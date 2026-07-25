// LeadAssignmentPanel V3 — Zaifan Ownership & Accountability OS
// Full replacement for: src/components/admin/LeadAssignmentPanel.jsx
//
// Keeps the existing database contract:
// public.lead_assignments
//   id, lead_type, lead_id, assigned_admin_id, assigned_admin_name, created_at
//
// Major upgrades:
// - preserves assignment / reassignment / unassignment
// - preserves duplicate cleanup
// - preserves realtime sync + activity logs
// - adds workload visibility per team member
// - adds "Assign to Me"
// - replaces most browser alerts with inline feedback
// - safer optimistic UX and retry states
// - avoids remounting parent Student OS
// - stronger navy + orange Admin OS hierarchy
// - no database migration required

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;

function withTimeout(promise, label = "Request") {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(`${label} timed out.`)),
      REQUEST_TIMEOUT_MS
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function LeadAssignmentPanel({
  lead,
  leadType = "inquiry",
  currentAdmin = null,
  onAssigned = () => {},
}) {
  const [admins, setAdmins] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [workloads, setWorkloads] = useState({});

  const [loading, setLoading] = useState(false);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const mountedRef = useRef(true);
  const refreshTimerRef = useRef(null);

  const leadId = lead?.id ? String(lead.id) : "";
  const isBusy =
    loading || adminsLoading || saving || unassigning || syncing;

  const selectedAdmin = useMemo(
    () => admins.find((admin) => admin.id === selectedAdminId) || null,
    [admins, selectedAdminId]
  );

  const currentOwner = useMemo(() => {
    if (!assignment?.assigned_admin_id) return null;

    return (
      admins.find(
        (admin) => String(admin.id) === String(assignment.assigned_admin_id)
      ) || {
        id: assignment.assigned_admin_id,
        full_name: assignment.assigned_admin_name || "Assigned staff",
        role: "staff",
      }
    );
  }, [admins, assignment]);

  const assignedAdminInitial = assignment?.assigned_admin_name
    ? assignment.assigned_admin_name.trim().charAt(0).toUpperCase()
    : "?";

  const leadTypeLabel =
    leadType === "appointment" ? "Appointment" : "Inquiry";

  const currentAdminCanSelfAssign =
    currentAdmin?.id &&
    admins.some((admin) => String(admin.id) === String(currentAdmin.id));

  const roleStyles = {
    staff: "border-blue-300 bg-blue-50 text-blue-800",
    admin: "border-orange-300 bg-orange-50 text-orange-800",
    super_admin: "border-violet-300 bg-violet-50 text-violet-800",
  };

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const showFeedback = (type, message) => {
    safeSetState(() => setFeedback({ type, message }));
  };

  const fetchAdmins = async () => {
    safeSetState(() => setAdminsLoading(true));

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .select("id, full_name, role")
          .order("full_name", { ascending: true }),
        "Team member fetch"
      );

      if (error) throw error;

      safeSetState(() => {
        setAdmins(data || []);
      });
    } catch (error) {
      console.error("Admins fetch failed:", error);
      showFeedback(
        "error",
        error?.message || "Could not load staff/admin list."
      );
    } finally {
      safeSetState(() => setAdminsLoading(false));
    }
  };

  const fetchWorkloads = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("lead_assignments")
          .select("assigned_admin_id"),
        "Ownership workload fetch"
      );

      if (error) throw error;

      const counts = (data || []).reduce((acc, row) => {
        if (!row.assigned_admin_id) return acc;

        const key = String(row.assigned_admin_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      safeSetState(() => setWorkloads(counts));
    } catch (error) {
      console.warn("Ownership workload fetch skipped:", error);
    }
  };

  const cleanDuplicateAssignments = async (rows = []) => {
    if (rows.length <= 1) return rows[0] || null;

    const sortedRows = [...rows].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });

    const mainAssignment = sortedRows[0];
    const duplicateIds = sortedRows.slice(1).map((item) => item.id);

    if (duplicateIds.length > 0) {
      try {
        const { error } = await withTimeout(
          supabase
            .from("lead_assignments")
            .delete()
            .in("id", duplicateIds),
          "Duplicate ownership cleanup"
        );

        if (error) throw error;
      } catch (error) {
        console.warn("Duplicate ownership cleanup skipped:", error);
      }
    }

    return mainAssignment;
  };

  const fetchAssignment = async ({ silent = false } = {}) => {
    if (!leadId) {
      safeSetState(() => {
        setAssignment(null);
        setSelectedAdminId("");
        setLoading(false);
        setSyncing(false);
      });
      return;
    }

    safeSetState(() => {
      if (!silent) setLoading(true);
      if (silent) setSyncing(true);
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("lead_assignments")
          .select("*")
          .eq("lead_type", leadType)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
        "Ownership fetch"
      );

      if (error) throw error;

      const mainAssignment = await cleanDuplicateAssignments(data || []);

      safeSetState(() => {
        setAssignment(mainAssignment);
        setSelectedAdminId(mainAssignment?.assigned_admin_id || "");
      });
    } catch (error) {
      console.error("Ownership fetch failed:", error);
      showFeedback(
        "error",
        error?.message || "Could not load lead ownership."
      );
    } finally {
      safeSetState(() => {
        setLoading(false);
        setSyncing(false);
      });
    }
  };

  const refreshAll = async ({ silent = false } = {}) => {
    if (!silent) {
      safeSetState(() => setFeedback(null));
    }

    await Promise.all([
      fetchAdmins(),
      fetchAssignment({ silent }),
      fetchWorkloads(),
    ]);
  };

  useEffect(() => {
    mountedRef.current = true;

    void fetchAdmins();
    void fetchWorkloads();

    return () => {
      mountedRef.current = false;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    safeSetState(() => setFeedback(null));
    void fetchAssignment();
  }, [leadId, leadType]);

  useEffect(() => {
    if (!leadId) return undefined;

    const channel = supabase
      .channel(`lead-assignment-v3-${leadType}-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_assignments",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const changedLeadId = String(
            payload.new?.lead_id || payload.old?.lead_id || ""
          );

          const changedLeadType =
            payload.new?.lead_type || payload.old?.lead_type || "";

          if (
            changedLeadId === leadId &&
            normalize(changedLeadType) === normalize(leadType)
          ) {
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
            }

            refreshTimerRef.current = window.setTimeout(() => {
              void fetchAssignment({ silent: true });
              void fetchWorkloads();
              onAssigned({ source: "assignment_realtime" });
            }, 250);
          }
        }
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      supabase.removeChannel(channel);
    };
  }, [leadId, leadType, onAssigned]);

  const logActivity = async ({
    action,
    details,
  }) => {
    try {
      await withTimeout(
        supabase.from("activity_logs").insert({
          admin_id: currentAdmin?.id || null,
          admin_name:
            currentAdmin?.full_name ||
            currentAdmin?.name ||
            "Unknown Admin",
          action,
          target_type: leadType,
          target_id: leadId,
          details,
        }),
        "Ownership activity log"
      );
    } catch (error) {
      console.warn("Ownership activity log skipped:", error);
    }
  };

  const assignLead = async (targetAdminId = selectedAdminId) => {
    if (!leadId || saving || unassigning) return;

    if (!targetAdminId) {
      showFeedback("warning", "Select a team member first.");
      return;
    }

    const targetAdmin = admins.find(
      (admin) => String(admin.id) === String(targetAdminId)
    );

    if (!targetAdmin) {
      showFeedback("error", "Selected team member is no longer available.");
      return;
    }

    const previousAssignment = assignment
      ? { ...assignment }
      : null;

    safeSetState(() => {
      setSaving(true);
      setFeedback(null);

      setAssignment((current) => ({
        ...(current || {}),
        assigned_admin_id: targetAdmin.id,
        assigned_admin_name: targetAdmin.full_name,
      }));

      setSelectedAdminId(targetAdmin.id);
    });

    try {
      const { data: existingRows, error: checkError } =
        await withTimeout(
          supabase
            .from("lead_assignments")
            .select("*")
            .eq("lead_type", leadType)
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false }),
          "Ownership check"
        );

      if (checkError) throw checkError;

      const existingAssignment =
        await cleanDuplicateAssignments(existingRows || []);

      let savedAssignment = null;

      if (existingAssignment?.id) {
        const { data, error } = await withTimeout(
          supabase
            .from("lead_assignments")
            .update({
              assigned_admin_id: targetAdmin.id,
              assigned_admin_name: targetAdmin.full_name,
            })
            .eq("id", existingAssignment.id)
            .select("*")
            .single(),
          "Ownership update"
        );

        if (error) throw error;
        savedAssignment = data;
      } else {
        const { data, error } = await withTimeout(
          supabase
            .from("lead_assignments")
            .insert({
              lead_type: leadType,
              lead_id: leadId,
              assigned_admin_id: targetAdmin.id,
              assigned_admin_name: targetAdmin.full_name,
            })
            .select("*")
            .single(),
          "Ownership insert"
        );

        if (error) throw error;
        savedAssignment = data;
      }

      safeSetState(() => {
        setAssignment(savedAssignment);
        setSelectedAdminId(savedAssignment?.assigned_admin_id || "");
      });

      void logActivity({
        action: existingAssignment?.id
          ? "Updated lead assignment"
          : "Assigned lead",
        details: `${leadTypeLabel} assigned to ${targetAdmin.full_name}.`,
      });

      await fetchWorkloads();

      try {
        await Promise.resolve(
          onAssigned({
            source: existingAssignment?.id
              ? "ownership_updated"
              : "ownership_created",
            assignment: savedAssignment,
          })
        );
      } catch (parentError) {
        console.warn(
          "Ownership saved; parent refresh delayed:",
          parentError
        );
      }

      showFeedback(
        "success",
        existingAssignment?.id
          ? `Ownership moved to ${targetAdmin.full_name}.`
          : `${targetAdmin.full_name} now owns this ${leadTypeLabel.toLowerCase()}.`
      );
    } catch (error) {
      console.error("Ownership save failed:", error);

      safeSetState(() => {
        setAssignment(previousAssignment);
        setSelectedAdminId(
          previousAssignment?.assigned_admin_id || ""
        );
      });

      showFeedback(
        "error",
        error?.message ||
          "Ownership could not be saved. Nothing was changed."
      );
    } finally {
      safeSetState(() => setSaving(false));
    }
  };

  const unassignLead = async () => {
    if (!leadId || !assignment?.id || unassigning || saving) return;

    const confirmed = window.confirm(
      `Return this ${leadTypeLabel.toLowerCase()} to the open pool?\n\nCurrent owner: ${
        assignment.assigned_admin_name || "Unknown"
      }`
    );

    if (!confirmed) return;

    const previousAssignment = { ...assignment };

    safeSetState(() => {
      setUnassigning(true);
      setFeedback(null);
      setAssignment(null);
      setSelectedAdminId("");
    });

    try {
      const { data: existingRows, error: checkError } =
        await withTimeout(
          supabase
            .from("lead_assignments")
            .select("*")
            .eq("lead_type", leadType)
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false }),
          "Unassign check"
        );

      if (checkError) throw checkError;

      const existingAssignment =
        await cleanDuplicateAssignments(existingRows || []);

      if (existingAssignment?.id) {
        const { error } = await withTimeout(
          supabase
            .from("lead_assignments")
            .delete()
            .eq("id", existingAssignment.id),
          "Ownership removal"
        );

        if (error) throw error;
      }

      void logActivity({
        action: "Unassigned lead",
        details: `Removed ${leadTypeLabel.toLowerCase()} ownership from ${
          previousAssignment.assigned_admin_name || "Unknown"
        }.`,
      });

      await fetchWorkloads();

      try {
        await Promise.resolve(
          onAssigned({
            source: "ownership_removed",
            assignment: null,
          })
        );
      } catch (parentError) {
        console.warn(
          "Ownership removed; parent refresh delayed:",
          parentError
        );
      }

      showFeedback(
        "success",
        `${leadTypeLabel} returned to the open pool.`
      );
    } catch (error) {
      console.error("Unassign failed:", error);

      safeSetState(() => {
        setAssignment(previousAssignment);
        setSelectedAdminId(
          previousAssignment.assigned_admin_id || ""
        );
      });

      showFeedback(
        "error",
        error?.message ||
          "Ownership could not be removed. Previous owner was restored."
      );
    } finally {
      safeSetState(() => setUnassigning(false));
    }
  };

  const selectedWorkload =
    selectedAdmin?.id
      ? workloads[String(selectedAdmin.id)] || 0
      : 0;

  const currentOwnerWorkload =
    currentOwner?.id
      ? workloads[String(currentOwner.id)] || 0
      : 0;

  const teamWorkloadValues = admins
    .map((admin) => workloads[String(admin.id)] || 0)
    .filter((value) => Number.isFinite(value));

  const averageWorkload = teamWorkloadValues.length
    ? Math.round(
        teamWorkloadValues.reduce((sum, value) => sum + value, 0) /
          teamWorkloadValues.length
      )
    : 0;

  const totalAssignedLeads = teamWorkloadValues.reduce(
    (sum, value) => sum + value,
    0
  );

  const busiestAdmin = useMemo(() => {
    if (!admins.length) return null;

    return [...admins]
      .map((admin) => ({
        ...admin,
        workload: workloads[String(admin.id)] || 0,
      }))
      .sort((a, b) => b.workload - a.workload)[0];
  }, [admins, workloads]);

  const lightestAdmin = useMemo(() => {
    if (!admins.length) return null;

    return [...admins]
      .map((admin) => ({
        ...admin,
        workload: workloads[String(admin.id)] || 0,
      }))
      .sort((a, b) => a.workload - b.workload)[0];
  }, [admins, workloads]);

  const ownershipHealth = assignment?.assigned_admin_id
    ? currentOwnerWorkload > averageWorkload + 3
      ? "Owner above team average"
      : "Ownership healthy"
    : "Needs owner";

  if (!leadId) {
    return (
      <div className="rounded-[1.7rem] border-2 border-dashed border-orange-300 bg-[#fffaf4] p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-orange-600" />
        <h3 className="mt-3 text-lg font-black text-[#10233f]">
          Ownership unavailable
        </h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          This workspace needs a saved lead ID before assignment controls can
          safely write to lead_assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[#10233f]">
      <section className="overflow-hidden rounded-[1.85rem] border-[3px] border-orange-400 bg-white shadow-[0_16px_45px_rgba(15,35,63,0.08)]">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                Ownership OS
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-200">
                {leadTypeLabel}
              </span>

              {syncing ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-blue-100">
                  <RefreshCw size={10} className="animate-spin" />
                  Syncing
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 text-2xl font-black text-white">
              Ownership & Accountability
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Give every student one clear owner. Reassign safely, return cases
              to the open pool, and see team workload before handing off work.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <HeroStat
                label="Current Owner"
                value={
                  assignment?.assigned_admin_name || "Open Pool"
                }
              />

              <HeroStat
                label="Owner Workload"
                value={
                  currentOwner
                    ? `${currentOwnerWorkload} lead${
                        currentOwnerWorkload === 1 ? "" : "s"
                      }`
                    : "—"
                }
              />

              <HeroStat
                label="Team Average"
                value={`${averageWorkload} lead${
                  averageWorkload === 1 ? "" : "s"
                }`}
              />
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-100">
              Ownership Status
            </p>

            <div className="mt-3">
              <OwnerStatus
                loading={loading}
                assignment={assignment}
                assignedAdminInitial={assignedAdminInitial}
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-orange-50">
              {assignment?.assigned_admin_name
                ? "Responsibility is currently assigned. Reassignment changes the active owner without creating a second assignment."
                : "This case is in the open pool. Assign it so follow-up responsibility is explicit."}
            </p>

            <button
              type="button"
              onClick={() => refreshAll()}
              disabled={isBusy}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white px-4 py-2.5 text-xs font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isBusy ? "animate-spin" : ""}
              />
              Refresh Ownership
            </button>
          </div>
        </div>
      </section>

      {feedback ? (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalStat
          label="Ownership Health"
          value={ownershipHealth}
          helper={
            assignment?.assigned_admin_id
              ? "Compares current owner workload with the live team average."
              : "Open-pool cases should be assigned when responsibility is known."
          }
          tone={assignment?.assigned_admin_id ? "orange" : "red"}
        />

        <OperationalStat
          label="Team Load"
          value={`${totalAssignedLeads} active`}
          helper={`${admins.length} team member${admins.length === 1 ? "" : "s"} visible in admin_profiles.`}
          tone="navy"
        />

        <OperationalStat
          label="Highest Load"
          value={
            busiestAdmin
              ? `${busiestAdmin.full_name} · ${busiestAdmin.workload}`
              : "No team data"
          }
          helper="Useful as a warning against accidental overload."
          tone="amber"
        />

        <OperationalStat
          label="Available Capacity"
          value={
            lightestAdmin
              ? `${lightestAdmin.full_name} · ${lightestAdmin.workload}`
              : "No team data"
          }
          helper="A workload signal only; expertise and continuity still matter."
          tone="green"
        />
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
              Assignment Control
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Select the responsible team member
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Workload figures are based on current rows in
              <span className="font-bold"> lead_assignments</span>.
            </p>
          </div>

          {currentAdminCanSelfAssign ? (
            <button
              type="button"
              onClick={() => {
                setSelectedAdminId(currentAdmin.id);
                void assignLead(currentAdmin.id);
              }}
              disabled={
                isBusy ||
                String(assignment?.assigned_admin_id || "") ===
                  String(currentAdmin.id)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40"
            >
              <UserCheck size={14} />
              {String(assignment?.assigned_admin_id || "") ===
              String(currentAdmin.id)
                ? "Already Mine"
                : "Assign to Me"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_210px_auto_auto]">
          <label className="rounded-2xl border-2 border-slate-300 bg-[#fffaf4] p-3 focus-within:border-orange-400">
            <span className="block text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
              Team Member
            </span>

            <select
              value={selectedAdminId}
              onChange={(event) =>
                setSelectedAdminId(event.target.value)
              }
              disabled={isBusy}
              className="mt-2 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-bold text-[#10233f] outline-none transition focus:border-orange-400 disabled:opacity-50"
            >
              <option value="">Select staff/admin</option>

              {admins.map((admin) => {
                const workload =
                  workloads[String(admin.id)] || 0;

                return (
                  <option key={admin.id} value={admin.id}>
                    {admin.full_name} — {admin.role} — {workload} active
                  </option>
                );
              })}
            </select>
          </label>

          <SelectedWorkload
            admin={selectedAdmin}
            workload={selectedWorkload}
            averageWorkload={averageWorkload}
          />

          <button
            type="button"
            onClick={() => assignLead()}
            disabled={isBusy || !selectedAdminId}
            className="inline-flex min-h-[74px] items-center justify-center gap-2 rounded-2xl border-2 border-orange-700 bg-orange-500 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md disabled:opacity-45"
          >
            <UserPlus size={16} />
            {saving
              ? "Saving..."
              : assignment?.id
              ? "Update Owner"
              : "Assign"}
          </button>

          {assignment?.id ? (
            <button
              type="button"
              onClick={unassignLead}
              disabled={isBusy}
              className="inline-flex min-h-[74px] items-center justify-center gap-2 rounded-2xl border-2 border-red-300 bg-red-50 px-5 text-sm font-black text-red-800 transition hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-100 disabled:opacity-45"
            >
              <UserMinus size={16} />
              {unassigning ? "Removing..." : "Unassign"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.6rem] border-[3px] border-[#123865] bg-[#123865] p-5 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-orange-300" />

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
              Current Accountability
            </p>
          </div>

          {currentOwner ? (
            <>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black">
                  {currentOwner.full_name?.charAt(0)?.toUpperCase() || "A"}
                </div>

                <div>
                  <p className="text-lg font-black text-white">
                    {currentOwner.full_name}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                    {currentOwner.role || "staff"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <DarkInfo
                  label="Owned Leads"
                  value={currentOwnerWorkload}
                />
                <DarkInfo
                  label="Assigned"
                  value={
                    assignment?.created_at
                      ? new Date(
                          assignment.created_at
                        ).toLocaleDateString()
                      : "Unknown"
                  }
                />
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-200">
              No owner is currently accountable for this case.
            </div>
          )}
        </div>

        <div className="rounded-[1.6rem] border-[3px] border-orange-400 bg-orange-500 p-5 text-white">
          <div className="flex items-center gap-2">
            <UsersRound size={16} />

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-100">
              Handoff Guidance
            </p>
          </div>

          <h3 className="mt-3 text-lg font-black text-white">
            {selectedAdmin
              ? `${selectedAdmin.full_name} has ${selectedWorkload} assigned lead${
                  selectedWorkload === 1 ? "" : "s"
                }.`
              : "Select a team member to inspect workload."}
          </h3>

          <p className="mt-2 text-sm leading-6 text-orange-50">
            {selectedAdmin
              ? selectedWorkload > averageWorkload + 3
                ? "This person is above the current team average. Consider another owner unless expertise or continuity makes this assignment intentional."
                : selectedWorkload < Math.max(averageWorkload - 2, 0)
                ? "This person is below the current team average and may have useful capacity."
                : "This workload is close to the current team average."
              : "Use workload as one signal, not the only signal. Student fit, counselor expertise and continuity still matter."}
          </p>
        </div>
      </section>
    </div>
  );
}

function OperationalStat({ label, value, helper, tone = "orange" }) {
  const tones = {
    orange: "border-orange-300 bg-orange-50",
    navy: "border-[#123865] bg-[#123865] text-white",
    amber: "border-amber-300 bg-amber-50",
    green: "border-emerald-300 bg-emerald-50",
    red: "border-red-300 bg-red-50",
  };

  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-2 p-4 shadow-[0_8px_22px_rgba(15,35,63,0.04)] ${
        tones[tone] || tones.orange
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-[0.16em] ${
          dark ? "text-orange-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 break-words text-lg font-black ${
          dark ? "text-white" : "text-[#10233f]"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>
    </div>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-300">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function DarkInfo({ label, value }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function SelectedWorkload({
  admin,
  workload,
  averageWorkload,
}) {
  if (!admin) {
    return (
      <div className="flex min-h-[74px] items-center rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 text-xs font-bold text-slate-500">
        Select an owner to inspect workload.
      </div>
    );
  }

  const above = workload > averageWorkload + 3;
  const below = workload < Math.max(averageWorkload - 2, 0);

  const tone = above
    ? "border-red-300 bg-red-50 text-red-800"
    : below
    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
    : "border-blue-300 bg-blue-50 text-blue-800";

  return (
    <div
      className={`flex min-h-[74px] items-center gap-3 rounded-2xl border-2 px-4 ${tone}`}
    >
      <Clock3 size={16} />

      <div>
        <p className="text-lg font-black">{workload}</p>
        <p className="text-[9px] font-black uppercase tracking-[0.1em]">
          Assigned Leads
        </p>
      </div>
    </div>
  );
}

function OwnerStatus({
  loading,
  assignment,
  assignedAdminInitial,
}) {
  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white">
        <RefreshCw size={13} className="animate-spin" />
        Loading owner…
      </div>
    );
  }

  if (!assignment?.assigned_admin_name) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white px-4 py-2.5 text-xs font-black text-orange-700">
        <AlertTriangle size={14} />
        Unassigned
      </div>
    );
  }

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-xl border-2 border-white/30 bg-white px-3 py-2.5 text-xs font-black text-[#123865]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#123865] text-[10px] font-black text-white">
        {assignedAdminInitial}
      </span>

      <span className="max-w-[240px] truncate">
        {assignment.assigned_admin_name}
      </span>
    </div>
  );
}

function Feedback({ type, message, onClose }) {
  const style =
    type === "success"
      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
      : type === "warning"
      ? "border-orange-400 bg-orange-50 text-orange-900"
      : "border-red-400 bg-red-50 text-red-900";

  const Icon =
    type === "success"
      ? CheckCircle2
      : AlertTriangle;

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${style}`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />

      <div className="min-w-0 flex-1">{message}</div>

      <button
        type="button"
        onClick={onClose}
        className="font-black"
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
}

export default LeadAssignmentPanel;
