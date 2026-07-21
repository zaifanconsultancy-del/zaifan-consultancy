// UniversityManagementPanel V2 — High Contrast Admin OS Edition
// Preserves university CRUD, Dream/Target/Safe workflow, application sync,
// timeline events, shared Student OS refresh, UniversitySelector and ProgramTracker.
// Visual layer aligned with Zaifan cream + white + navy + orange Admin OS.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import UniversitySelector from "./UniversitySelector";
import ProgramTracker from "./ProgramTracker";

const CATEGORY_OPTIONS = [
  { id: "dream", label: "Dream", description: "Ambitious but possible" },
  { id: "target", label: "Target", description: "Strong realistic match" },
  { id: "safe", label: "Safe", description: "Backup / high chance" },
];

const STATUS_OPTIONS = [
  "interested",
  "researching",
  "applied",
  "offer_received",
  "accepted",
  "rejected",
  "enrolled",
];

const withTimeout = (promise, ms = 30000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Request timed out. Check Supabase RLS/policies.")),
        ms
      )
    ),
  ]);

function UniversityManagementPanel({
  student = {},
  sharedUniversities = null,
  sharedApplication = null,
  onSharedDataChange = null,
}) {
  const [universities, setUniversities] = useState(Array.isArray(sharedUniversities) ? sharedUniversities : []);
  const [activeApplication, setActiveApplication] = useState(sharedApplication || student?.application || null);
  const [form, setForm] = useState({
    university: "",
    country: "",
    program: "",
    intake: "",
    category: "target",
    status: "interested",
    deadline: "",
    tuition: "",
    requirements: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startingApplicationId, setStartingApplicationId] = useState(null);
  const [syncingStatusId, setSyncingStatusId] = useState(null);
  const [error, setError] = useState("");

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const hasValidStudentId = Number.isFinite(numericStudentId);
  const studentType = student?.student_type || student?.__leadType || student?.type || "inquiry";

  const country =
    student?.country ||
    student?.preferred_country ||
    student?.country_interest ||
    "Not selected";

  const program =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    student?.study_field ||
    "Not selected";

  useEffect(() => {
    if (Array.isArray(sharedUniversities)) {
      setUniversities(sharedUniversities);
    }
  }, [sharedUniversities]);

  useEffect(() => {
    if (sharedApplication) {
      setActiveApplication(sharedApplication);
    }
  }, [sharedApplication?.id, sharedApplication?.updated_at]);

  useEffect(() => {
    loadUniversities();
    loadActiveApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentType]);

  const notifyParent = async (payload = {}) => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await withTimeout(
        Promise.resolve(onSharedDataChange(payload)),
        12000
      );
    } catch (error) {
      console.warn("Student OS parent refresh did not complete in time:", error);
    }
  };

  const loadUniversities = async () => {
    if (!studentId) return;

    setLoading(true);
    setError("");

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_universities")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
      );

      if (error) {
        setError(error.message);
        setUniversities([]);
        return;
      }

      setUniversities(data || []);
    } catch (error) {
      setError(error.message || "Failed to load universities.");
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveApplication = async () => {
    if (!hasValidStudentId) return;

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(1)
      );

      if (error) throw error;
      setActiveApplication(data?.[0] || sharedApplication || student?.application || null);
    } catch {
      setActiveApplication(null);
    }
  };

  const resetForm = () => {
    setForm({
      university: "",
      country: "",
      program: "",
      intake: "",
      category: "target",
      status: "interested",
      deadline: "",
      tuition: "",
      requirements: "",
      notes: "",
    });
  };

  const saveUniversity = async () => {
    if (!studentId || !form.university.trim()) return;

    setSaving(true);
    setError("");

    try {
      const { error } = await withTimeout(
        supabase.from("student_universities").insert({
          student_id: studentId,
          student_type: studentType,
          university: form.university.trim(),
          country: form.country || country,
          program: form.program || program,
          intake: form.intake,
          category: form.category,
          status: form.status,
          deadline: form.deadline,
          tuition: form.tuition,
          requirements: form.requirements,
          notes: form.notes,
          updated_at: new Date().toISOString(),
        })
      );

      if (error) {
        setError(error.message);
        return;
      }

      resetForm();
      await addApplicationTimelineEvent({
  eventType: "university_added",
  title: "University Added",
  description: `${form.university} added to university planning.`,
  newValue: form.category,
});

await loadUniversities();
await notifyParent();
    } catch (error) {
      setError(error.message || "University save failed.");
    } finally {
      setSaving(false);
    }
  };

  const updateUniversity = async (id, updates) => {
    if (!id) return false;

    setError("");

    try {
      const { error } = await withTimeout(
        supabase
          .from("student_universities")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
      );

      if (error) {
        setError(error.message);
        return false;
      }

      await loadUniversities();
      await notifyParent();
      return true;
    } catch (error) {
      setError(error.message || "University update failed.");
      return false;
    }
  };

  const findOrCreateApplication = async (university, overrides = {}) => {
    const basePayload = {
      student_id: numericStudentId,
      student_type: studentType,
      country: university.country || "",
      university: university.university || "",
      program: university.program || "",
      intake: university.intake || "",
      source_university_id: university.id,
      source_university_name: university.university || "",
      application_status: "applied",
      offer_status: "pending",
      visa_status: "not_started",
      updated_at: new Date().toISOString(),
      ...overrides,
    };

    const { data: existingApplications, error: lookupError } = await withTimeout(
      supabase
        .from("student_applications")
        .select("*")
        .eq("student_id", numericStudentId)
        .eq("student_type", studentType)
        .order("created_at", { ascending: false })
        .limit(10)
    );

    if (lookupError) throw lookupError;

    const existingApplication = (existingApplications || []).find(
      (item) => String(item.source_university_id || "") === String(university.id || "")
    ) || (existingApplications || [])[0] || null;

    if (existingApplication?.id) {
      const { data, error } = await withTimeout(
        supabase
          .from("student_applications")
          .update(basePayload)
          .eq("id", existingApplication.id)
          .select()
          .single()
      );

      if (error) throw error;
      setActiveApplication(data);
      return data;
    }

    const { data, error } = await withTimeout(
      supabase.from("student_applications").insert(basePayload).select().single()
    );

    if (error) throw error;
    setActiveApplication(data);
    return data;
  };

  const addApplicationTimelineEvent = async ({
    applicationId = null,
    eventType,
    title,
    description,
    oldValue = "",
    newValue = "",
  }) => {
    await withTimeout(
      supabase.from("student_application_timeline").insert({
        student_id: numericStudentId,
        student_type: studentType,
        application_id: applicationId ? String(applicationId) : null,
        event_type: eventType,
        title,
        description,
        old_value: oldValue ? String(oldValue) : null,
        new_value: newValue ? String(newValue) : null,
      })
    );
  };

  const startApplication = async (university) => {
    if (!hasValidStudentId || !university?.id) {
      setError("Invalid student or university record.");
      return;
    }

    setStartingApplicationId(university.id);
    setError("");

    try {
      const savedApplication = await findOrCreateApplication(university, {
        application_status: "applied",
        offer_status: "pending",
        visa_status: "not_started",
      });

      await addApplicationTimelineEvent({
        applicationId: savedApplication?.id,
        eventType: "application_started_from_university",
        title: "Application Started From University",
        description: `${university.university} moved into active application workflow.`,
        oldValue: university.status || "",
        newValue: "applied",
      });

      await updateUniversity(university.id, {
        status: "applied",
      });

      await loadActiveApplication();
      await notifyParent({ source: "university_start_application", application: savedApplication });

      alert("Application workflow started successfully.");
    } catch (error) {
      setError(error.message || "Failed to start application.");
    } finally {
      setStartingApplicationId(null);
    }
  };

  const syncApplicationFromUniversityStatus = async (university, nextStatus) => {
    if (!hasValidStudentId || !university?.id) return null;

    const syncMap = {
      applied: {
        application_status: "applied",
        offer_status: "pending",
        visa_status: "not_started",
        title: "Application Marked Applied",
      },
      offer_received: {
        application_status: "applied",
        offer_status: "offer_received",
        title: "Offer Received",
      },
      accepted: {
        application_status: "offer_accepted",
        offer_status: "offer_accepted",
        title: "Offer Accepted",
      },
      rejected: {
        application_status: "rejected",
        offer_status: "rejected",
        title: "Application Rejected",
      },
      enrolled: {
        application_status: "enrolled",
        offer_status: "offer_accepted",
        visa_status: "visa_approved",
        title: "Student Enrolled",
      },
    };

    const syncConfig = syncMap[nextStatus];
    if (!syncConfig) return null;

    const { title, ...applicationUpdates } = syncConfig;

    const savedApplication = await findOrCreateApplication(
      university,
      applicationUpdates
    );

    await addApplicationTimelineEvent({
      applicationId: savedApplication?.id,
      eventType: `university_status_${nextStatus}`,
      title,
      description: `${university.university} status changed to ${nextStatus.replaceAll(
        "_",
        " "
      )}. Application workflow was synced automatically from the linked university.`,
      oldValue: university.status || "",
      newValue: nextStatus,
    });

    return savedApplication;
  };
const moveUniversityCategory = async (
  university,
  nextCategory
) => {
  await updateUniversity(university.id, {
    category: nextCategory,
  });

  await addApplicationTimelineEvent({
    eventType: "university_category_changed",
    title: "University Category Updated",
    description: `${university.university} moved to ${nextCategory}.`,
    oldValue: university.category,
    newValue: nextCategory,
  });
};

  const handleUniversityStatusChange = async (university, nextStatus) => {
    if (!university?.id || !nextStatus) return;

    setSyncingStatusId(university.id);
    setError("");

    try {
      await syncApplicationFromUniversityStatus(university, nextStatus);

      const updated = await updateUniversity(university.id, {
        status: nextStatus,
      });

      if (!updated) return;

      await loadActiveApplication();
      await notifyParent({ source: "university_status_sync", university, nextStatus });
    } catch (error) {
      setError(error.message || "Status sync failed.");
    } finally {
      setSyncingStatusId(null);
    }
  };

  const deleteUniversity = async (id) => {
    const confirmed = window.confirm("Delete this university option?");
    if (!confirmed) return;

    setError("");

    try {
      const { error } = await withTimeout(
        supabase.from("student_universities").delete().eq("id", id)
      );

      if (error) {
        setError(error.message);
        return;
      }

      await loadUniversities();
      await loadActiveApplication();
      await notifyParent();
    } catch (error) {
      setError(error.message || "University delete failed.");
    }
  };

  const grouped = useMemo(() => {
    return {
      dream: universities.filter((item) => item.category === "dream"),
      target: universities.filter(
        (item) => !item.category || item.category === "target"
      ),
      safe: universities.filter((item) => item.category === "safe"),
    };
  }, [universities]);

  const stats = useMemo(() => {
    return {
      total: universities.length,
      dream: grouped.dream.length,
      target: grouped.target.length,
      safe: grouped.safe.length,
      applied: universities.filter((item) => item.status === "applied").length,
      offers: universities.filter((item) => item.status === "offer_received")
        .length,
      accepted: universities.filter((item) => item.status === "accepted").length,
    };
  }, [universities, grouped]);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-orange-200 bg-[#fff8ee] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-orange-700">
          University Operating System
        </p>

        <h2 className="mt-2 text-2xl font-black text-[#10233f]">
          Dream / Target / Safe University Workflow
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Build a real consultancy shortlist, track application status, manage
          intakes, requirements, tuition, deadlines, offers, and final decisions.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <PlanningCard label="Target Country" value={country} />
        <PlanningCard label="Target Program" value={program} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total" value={stats.total} />
        <MetricCard label="Dream" value={stats.dream} />
        <MetricCard label="Target" value={stats.target} />
        <MetricCard label="Safe" value={stats.safe} />
        <MetricCard label="Applied" value={stats.applied} />
        <MetricCard label="Offers" value={stats.offers} />
        <MetricCard label="Accepted" value={stats.accepted} />
        <MetricCard label="Loading" value={loading ? "Yes" : "No"} />
      </div>

      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
        <h3 className="font-bold text-[#10233f]">Add University Option</h3>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Input
            label="University"
            value={form.university}
            onChange={(value) => setForm({ ...form, university: value })}
          />

          <Input
            label="Country"
            value={form.country}
            placeholder={country}
            onChange={(value) => setForm({ ...form, country: value })}
          />

          <Input
            label="Program"
            value={form.program}
            placeholder={program}
            onChange={(value) => setForm({ ...form, program: value })}
          />

          <Input
            label="Intake"
            value={form.intake}
            placeholder="Sep 2026"
            onChange={(value) => setForm({ ...form, intake: value })}
          />

          <Select
            label="Category"
            value={form.category}
            options={CATEGORY_OPTIONS.map((item) => item.id)}
            onChange={(value) => setForm({ ...form, category: value })}
          />

          <Select
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(value) => setForm({ ...form, status: value })}
          />

          <Input
            label="Deadline"
            value={form.deadline}
            placeholder="15 Jan 2026"
            onChange={(value) => setForm({ ...form, deadline: value })}
          />

          <Input
            label="Tuition"
            value={form.tuition}
            placeholder="CAD 35,000 / year"
            onChange={(value) => setForm({ ...form, tuition: value })}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Requirements"
              value={form.requirements}
              placeholder="IELTS, GPA, portfolio, SOP, recommendation letters..."
              onChange={(value) => setForm({ ...form, requirements: value })}
            />
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Notes"
              value={form.notes}
              placeholder="Scholarship chance, counselor notes, ranking, application strategy..."
              onChange={(value) => setForm({ ...form, notes: value })}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveUniversity}
          disabled={saving || !form.university.trim()}
          className="mt-5 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add University"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {CATEGORY_OPTIONS.map((category) => (
          <UniversityColumn
            key={category.id}
            category={category}
            items={grouped[category.id] || []}
            activeApplication={activeApplication}
            startingApplicationId={startingApplicationId}
            syncingStatusId={syncingStatusId}
            onStatusChange={handleUniversityStatusChange}
            onCategoryChange={(university, nextCategory) =>
  moveUniversityCategory(university, nextCategory)
}
            onDelete={deleteUniversity}
            onStartApplication={startApplication}
          />
        ))}
      </div>

      <UniversitySelector student={student} />
      <ProgramTracker student={student} />
    </div>
  );
}

function UniversityColumn({
  category,
  items = [],
  activeApplication = null,
  startingApplicationId = null,
  syncingStatusId = null,
  onStatusChange,
  onCategoryChange,
  onDelete,
  onStartApplication,
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-black text-[#10233f]">{category.label}</h3>

          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
            {items.length}
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">{category.description}</p>
      </div>

      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <UniversityCard
              key={item.id}
              item={item}
              isLinkedToApplication={
                activeApplication?.source_university_id === item.id
              }
              isStartingApplication={startingApplicationId === item.id}
              isSyncingStatus={syncingStatusId === item.id}
              onStatusChange={onStatusChange}
              onCategoryChange={onCategoryChange}
              onDelete={onDelete}
              onStartApplication={onStartApplication}
            />
          ))
        ) : (
          <p className="rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-500">
            No {category.label.toLowerCase()} universities yet.
          </p>
        )}
      </div>
    </div>
  );
}

function UniversityCard({
  item,
  isLinkedToApplication = false,
  isStartingApplication = false,
  isSyncingStatus = false,
  onStatusChange,
  onCategoryChange,
  onDelete,
  onStartApplication,
}) {
  const alreadyApplied =
    item.status === "applied" ||
    item.status === "offer_received" ||
    item.status === "accepted" ||
    item.status === "enrolled";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isLinkedToApplication
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words font-semibold text-[#10233f]">
              {item.university}
            </p>

            {isLinkedToApplication ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                🔗 Linked
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-slate-600">
            {item.country || "No country"} • {item.program || "No program"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Intake: {item.intake || "Not selected"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={isStartingApplication || isSyncingStatus}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 transition hover:border-red-400 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {isLinkedToApplication ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          This university is the active source for the application record.
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <Select
          label={isSyncingStatus ? "Syncing Status..." : "Status"}
          value={item.status || "interested"}
          disabled={isSyncingStatus || isStartingApplication}
          options={STATUS_OPTIONS}
          onChange={(value) => onStatusChange(item, value)}
        />

        <Select
          label="Move Category"
          value={item.category || "target"}
          disabled={isSyncingStatus || isStartingApplication}
          options={CATEGORY_OPTIONS.map((category) => category.id)}
          onChange={(value) => onCategoryChange(item, value)}
        />

        <button
          type="button"
          onClick={() => onStartApplication(item)}
          disabled={isStartingApplication || isSyncingStatus}
          className={`rounded-xl border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isLinkedToApplication
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
              : alreadyApplied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100"
              : "border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100"
          }`}
        >
          {isStartingApplication
            ? "Starting..."
            : isSyncingStatus
            ? "Syncing..."
            : isLinkedToApplication
            ? "🔗 Linked To Application"
            : alreadyApplied
            ? "Application Active"
            : "🚀 Start Application"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        {item.deadline ? <InfoLine label="Deadline" value={item.deadline} /> : null}
        {item.tuition ? <InfoLine label="Tuition" value={item.tuition} /> : null}
        {item.requirements ? (
          <InfoLine label="Requirements" value={item.requirements} />
        ) : null}
        {item.notes ? <InfoLine label="Notes" value={item.notes} /> : null}
      </div>
    </div>
  );
}

function PlanningCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.035)]">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 break-words text-lg font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.035)]">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <p>
      <span className="font-semibold text-slate-700">{label}:</span>{" "}
      <span>{value}</span>
    </p>
  );
}

function Input({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || `Enter ${label}`}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#10233f] outline-none placeholder:text-[#10233f]/25 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#10233f] outline-none placeholder:text-[#10233f]/25 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

function Select({ label, value, options = [], onChange, disabled = false }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <select
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm capitalize text-[#10233f] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-white text-[#10233f]">
            {String(option).replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

export default UniversityManagementPanel;