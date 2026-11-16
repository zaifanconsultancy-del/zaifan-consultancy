/* eslint-disable react-refresh/only-export-components */
// Loads every table the admin needs (the data is small), builds the "one
// record per person" view, and exposes simple write helpers that refresh the
// right table afterwards. Pages never talk to Supabase directly.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "../../../lib/supabaseClient";
import { DOCUMENTS_BUCKET, safeFileName, uploadPrivateFile } from "../../../lib/storageFiles";
import { buildPeople, CLOSE_REASON_LABEL, STAGE_BY_ID, stageIndex } from "../lib/people";
import { useToast } from "../ui/kit";

const TABLES = {
  inquiries: { table: "inquiries" },
  appointments: { table: "appointments" },
  identities: { table: "student_identities" },
  applications: { table: "student_applications" },
  documents: { table: "student_documents" },
  requirements: { table: "student_document_requirements" },
  visas: { table: "student_visas" },
  invoices: { table: "student_invoices" },
  payments: { table: "student_payments" },
  receipts: { table: "student_receipts" },
  communications: { table: "student_communications" },
  tasks: { table: "student_tasks" },
  notes: { table: "crm_notes" },
  timeline: { table: "crm_timeline", limit: 800 },
  reminders: { table: "follow_up_reminders" },
  portalAccounts: {
    table: "student_portal_accounts",
    select: "id,email,student_id,student_type,is_active,must_change_password,password_changed_at,last_login_at,created_at",
  },
  supportRequests: { table: "student_support_requests" },
  supportMessages: { table: "student_support_messages" },
  universities: { table: "student_universities" },
  counselors: { table: "counselor_profiles" },
  admins: { table: "admin_profiles" },
  paymentAccounts: { table: "payment_accounts" },
  activity: { table: "activity_logs", limit: 200 },
  // Added 2026-11-15 (supabase/sql/2026-11-15-prices-expenses.sql). "optional"
  // means: if the table is not in the database yet, show the page as "not
  // switched on" instead of an error.
  prices: { table: "service_prices", optional: true },
  expenses: { table: "office_expenses", optional: true },
};

// `missing` lists optional tables that are not in the database yet.
const EMPTY = { ...Object.fromEntries(Object.keys(TABLES).map((key) => [key, []])), missing: {} };

const AdminDataContext = createContext(null);

async function fetchTable(key) {
  const spec = TABLES[key];
  let query = supabase.from(spec.table).select(spec.select || "*");
  if (spec.order !== false) query = query.order("created_at", { ascending: false });
  if (spec.limit) query = query.limit(spec.limit);
  // One slow answer must never leave the whole admin stuck on "Loading…".
  const { data, error } = await query.abortSignal(AbortSignal.timeout(15000));
  if (error) {
    const timedOut = /abort|timed? ?out/i.test(`${error.name || ""} ${error.message || ""}`);
    const problem = new Error(timedOut ? `${spec.table}: took too long, press refresh` : `${spec.table}: ${error.message}`);
    // "Not switched on yet" only when the table really is not in the database.
    const tableMissing = error.code === "PGRST205" || error.code === "42P01";
    problem.optional = Boolean(spec.optional) && tableMissing;
    throw problem;
  }
  return data || [];
}

export function AdminDataProvider({ admin, children }) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const toast = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async (keys = Object.keys(TABLES)) => {
    const list = Array.isArray(keys) ? keys : [keys];
    const results = await Promise.allSettled(list.map((key) => fetchTable(key)));
    if (!mounted.current) return;
    const failures = [];
    setData((current) => {
      const next = { ...current, missing: { ...current.missing } };
      results.forEach((result, index) => {
        const key = list[index];
        if (result.status === "fulfilled") {
          next[key] = result.value;
          delete next.missing[key];
        } else if (result.reason?.optional) {
          next[key] = [];
          next.missing[key] = true;
        } else failures.push(result.reason?.message || String(result.reason));
      });
      return next;
    });
    setError(failures.length ? `Some data could not be loaded: ${failures.join(" · ")}` : "");
    setLastLoadedAt(new Date());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  // A counselor only ever sees the people assigned to them.
  const isCounselor = admin?.kind === "counselor";
  const viewerId = admin?.id || null;
  const people = useMemo(() => {
    const everyone = buildPeople(data);
    return isCounselor ? everyone.filter((person) => person.assignedTo === viewerId) : everyone;
  }, [data, isCounselor, viewerId]);
  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person])), [people]);

  const staff = useMemo(() => {
    const seen = new Map();
    for (const row of data.admins) {
      seen.set(row.id, { id: row.id, name: row.full_name || "Admin", role: row.role || "admin", kind: "admin", avatar: row.avatar });
    }
    for (const row of data.counselors) {
      const id = row.auth_id || row.user_id || row.id;
      if (seen.has(id)) {
        seen.get(id).alsoCounselor = true;
        continue;
      }
      seen.set(id, {
        id,
        name: row.full_name || row.email || "Counselor",
        email: row.email,
        role: "counselor",
        kind: "counselor",
        active: row.is_active !== false && String(row.status || "active") !== "inactive",
        avatar: row.avatar_url,
        profileId: row.id,
      });
    }
    return Array.from(seen.values());
  }, [data.admins, data.counselors]);

  const staffById = useMemo(() => new Map(staff.map((member) => [member.id, member])), [staff]);

  /* ----------------------------- write helpers ----------------------------- */

  const fail = useCallback(
    (label, error) => {
      console.error(label, error);
      toast.push({ tone: "error", message: `${label} failed: ${error?.message || "unknown error"}` });
      throw error;
    },
    [toast]
  );

  const insert = useCallback(
    async (key, row, { reloadKeys } = {}) => {
      const { data: created, error } = await supabase.from(TABLES[key].table).insert(row).select().single();
      if (error) fail("Saving", error);
      await reload(reloadKeys || [key]);
      return created;
    },
    [fail, reload]
  );

  /** Saves several rows at once (e.g. a whole document checklist). */
  const insertMany = useCallback(
    async (key, rows) => {
      const { error } = await supabase.from(TABLES[key].table).insert(rows);
      if (error) fail("Saving", error);
      await reload([key]);
    },
    [fail, reload]
  );

  const update = useCallback(
    async (key, id, patch, { reloadKeys } = {}) => {
      const { data: updated, error } = await supabase.from(TABLES[key].table).update(patch).eq("id", id).select().single();
      if (error) fail("Updating", error);
      await reload(reloadKeys || [key]);
      return updated;
    },
    [fail, reload]
  );

  const remove = useCallback(
    async (key, id, { reloadKeys } = {}) => {
      const { error } = await supabase.from(TABLES[key].table).delete().eq("id", id);
      if (error) fail("Deleting", error);
      await reload(reloadKeys || [key]);
    },
    [fail, reload]
  );

  const rpc = useCallback(
    async (name, args) => {
      const { data: result, error } = await supabase.rpc(name, args);
      if (error) fail("Request", error);
      return result;
    },
    [fail]
  );

  const invoke = useCallback(
    async (name, body) => {
      const { data: result, error } = await supabase.functions.invoke(name, { body });
      if (error) fail("Email", error);
      if (result && result.success === false) fail("Email", new Error(result.message || "The email service said no."));
      return result;
    },
    [fail]
  );

  /** Writes a line into the student's history (crm_timeline). Never throws. */
  const logEvent = useCallback(
    async (person, { actionType, title, description = "", oldValue = "", newValue = "", metadata = {} }) => {
      if (!person?.primary) return;
      await supabase.from("crm_timeline").insert({
        student_id: String(person.primary.student_id),
        student_type: person.primary.student_type,
        action_type: actionType,
        title,
        description,
        old_value: String(oldValue ?? ""),
        new_value: String(newValue ?? ""),
        created_by: admin?.id || null,
        created_by_name: admin?.name || "Admin",
        metadata,
      });
      await reload(["timeline"]);
    },
    [admin, reload]
  );

  const ensureIdentity = useCallback(
    async (person) => {
      if (person.identity) return person.identity.id;
      // Legacy row without a person record: create one and link the sources.
      const { data: created, error } = await supabase
        .from("student_identities")
        .insert({
          full_name: person.name,
          primary_email: person.email || null,
          primary_phone: person.phone || null,
          normalized_name: person.name.toLowerCase(),
          normalized_email: (person.email || "").toLowerCase() || null,
          normalized_phone: (person.phone || "").replace(/\D/g, "") || null,
          first_source_type: person.sources[0]?.type || "inquiry",
          first_source_id: person.sources[0]?.id || null,
        })
        .select()
        .single();
      if (error) fail("Creating person record", error);
      for (const source of person.sources) {
        await supabase.from(source.type === "appointment" ? "appointments" : "inquiries").update({ person_id: created.id }).eq("id", source.id);
      }
      return created.id;
    },
    [fail]
  );

  const updatePerson = useCallback(
    async (person, patch) => {
      const identityId = await ensureIdentity(person);
      const { error } = await supabase.from("student_identities").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", identityId);
      if (error) fail("Saving", error);
      await reload(["identities", "inquiries", "appointments"]);
    },
    [ensureIdentity, fail, reload]
  );

  const setStage = useCallback(
    async (person, stage, { reason = "", note = "", quiet = false } = {}) => {
      if (!STAGE_BY_ID[stage] || person.stage === stage) return;
      await updatePerson(person, { stage, stage_changed_at: new Date().toISOString() });
      const why = stage === "closed" && reason ? CLOSE_REASON_LABEL[reason] || reason : "";
      await logEvent(person, {
        actionType: "stage_changed",
        title: why ? `File closed: ${why}` : `Moved to ${STAGE_BY_ID[stage].label}`,
        description: note,
        oldValue: STAGE_BY_ID[person.stage]?.label || person.stage,
        newValue: STAGE_BY_ID[stage].label,
        metadata: why ? { close_reason: reason, close_note: note } : {},
      });
      if (!quiet) toast.push(`${person.name} moved to “${STAGE_BY_ID[stage].label}”.`);
    },
    [logEvent, toast, updatePerson]
  );

  const assignPerson = useCallback(
    async (person, staffId, { quiet = false } = {}) => {
      if ((person.assignedTo || null) === (staffId || null)) return;
      await updatePerson(person, { assigned_to: staffId || null });
      const member = staffId ? staffById.get(staffId) : null;
      await logEvent(person, {
        actionType: "assigned",
        title: member ? `Assigned to ${member.name}` : "Unassigned",
        newValue: member?.name || "",
      });
      if (!quiet) toast.push(member ? `${person.name} is now with ${member.name}.` : `${person.name} is unassigned.`);
    },
    [logEvent, staffById, toast, updatePerson]
  );

  /**
   * Two files for the same person become one: everything `other` ever sent
   * (questions, bookings and all that hangs off them) moves under `keep`.
   * Admin only. Use pickKeeper() from lib/people.js to choose which stays.
   */
  const mergePeople = useCallback(
    async (keep, other) => {
      if (keep.id === other.id) return keep.id;
      if (keep.identity?.auth_user_id && other.identity?.auth_user_id) {
        fail("Merging", new Error("Both files have a student login. Turn one login off first."));
      }
      if (other.identity?.auth_user_id) {
        fail("Merging", new Error("The file being merged away has a student login. Keep that one instead."));
      }
      const keepId = await ensureIdentity(keep);

      for (const source of other.sources) {
        const { error } = await supabase.from(source.type === "appointment" ? "appointments" : "inquiries").update({ person_id: keepId }).eq("id", source.id);
        if (error) fail("Merging", error);
      }

      // Carry over anything the kept file does not have yet.
      const patch = {};
      if (!keep.email && other.email) Object.assign(patch, { primary_email: other.email, normalized_email: other.email.toLowerCase() });
      if (!keep.phone && other.phone) Object.assign(patch, { primary_phone: other.phone, normalized_phone: other.phone.replace(/\D/g, "") });
      if (!keep.identity?.country && other.identity?.country) patch.country = other.identity.country;
      if (!keep.assignedTo && other.assignedTo) patch.assigned_to = other.assignedTo;
      if (other.adminNotes) patch.admin_notes = [keep.adminNotes, other.adminNotes].filter(Boolean).join("\n");
      if (other.stage !== "closed" && stageIndex(other.stage) > stageIndex(keep.stage)) {
        patch.stage = other.stage;
        patch.stage_changed_at = new Date().toISOString();
      }
      if (Object.keys(patch).length) {
        const { error } = await supabase.from("student_identities").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", keepId);
        if (error) fail("Merging", error);
      }

      // The emptied person record goes, so a later website form from the same
      // email or phone lands in the kept file.
      if (other.identity?.id) {
        const { error } = await supabase.from("student_identities").delete().eq("id", other.identity.id);
        if (error) console.error("Could not remove the emptied person record", error);
      }

      await reload(["identities", "inquiries", "appointments"]);
      await logEvent(keep, {
        actionType: "files_merged",
        title: "Two files joined into one",
        description: `Merged with the file of ${other.name}${other.phone ? ` (${other.phone})` : ""}.`,
      });
      toast.push(`Done. Everything is now in one file for ${keep.name}.`);
      return keepId;
    },
    [ensureIdentity, fail, logEvent, reload, toast]
  );

  const addNote = useCallback(
    async (person, note) => {
      if (!person.primary || !note.trim()) return;
      await insert("notes", {
        student_id: String(person.primary.student_id),
        student_type: person.primary.student_type,
        note: note.trim(),
      });
    },
    [insert]
  );

  const uploadDocument = useCallback(
    async (person, { file, name, category, status = "pending_review", notes = "" }) => {
      if (!person.primary) throw new Error("This person has no record to attach files to.");
      const folder = `${person.primary.student_id}/${safeFileName(name || "document").toLowerCase()}`;
      const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;
      const uploaded = await uploadPrivateFile({ bucket: DOCUMENTS_BUCKET, path, file });
      return insert("documents", {
        student_id: person.primary.student_id,
        student_type: person.primary.student_type,
        document_name: name || file.name,
        document_category: category || "Other",
        status,
        notes,
        file_path: uploaded.path,
        file_url: uploaded.url,
        original_file_name: file.name,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        uploaded_by: admin?.id || null,
      });
    },
    [admin, insert]
  );

  const value = useMemo(
    () => ({
      admin,
      isCounselor,
      data,
      people,
      peopleById,
      staff,
      staffById,
      loading,
      error,
      lastLoadedAt,
      reload,
      insert,
      insertMany,
      update,
      remove,
      rpc,
      invoke,
      logEvent,
      ensureIdentity,
      updatePerson,
      setStage,
      assignPerson,
      mergePeople,
      addNote,
      uploadDocument,
    }),
    [admin, isCounselor, data, people, peopleById, staff, staffById, loading, error, lastLoadedAt, reload, insert, insertMany, update, remove, rpc, invoke, logEvent, ensureIdentity, updatePerson, setStage, assignPerson, mergePeople, addNote, uploadDocument]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error("useAdminData must be used inside AdminDataProvider");
  return context;
}

/** Shortcut: { person, ...everything } for a person id, re-computed when data changes. */
export function usePerson(personId) {
  const { peopleById } = useAdminData();
  return peopleById.get(personId) || null;
}
