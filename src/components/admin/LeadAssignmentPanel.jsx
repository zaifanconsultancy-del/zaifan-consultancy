import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 8000;

function withTimeout(promise, label = "Request") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out.`)), REQUEST_TIMEOUT_MS)
    ),
  ]);
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const mountedRef = useRef(true);
  const leadId = lead?.id ? String(lead.id) : "";
  const isBusy = loading || saving || unassigning;

  const selectedAdmin = useMemo(
    () => admins.find((admin) => admin.id === selectedAdminId) || null,
    [admins, selectedAdminId]
  );

  const assignedAdminInitial = assignment?.assigned_admin_name
    ? assignment.assigned_admin_name.trim().charAt(0).toUpperCase()
    : "?";

  const leadTypeLabel = leadType === "appointment" ? "Appointment" : "Inquiry";

  const roleStyles = {
    staff: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    admin: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    super_admin: "border-purple-400/25 bg-purple-500/10 text-purple-300",
  };

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .select("id, full_name, role")
          .order("full_name", { ascending: true }),
        "Admins fetch"
      );

      if (error) {
        console.error("Admins error:", error);
        safeSetState(() => setLoadError("Failed to load staff/admin list."));
        return;
      }

      safeSetState(() => {
        setAdmins(data || []);
        setLoadError("");
      });
    } catch (error) {
      console.error("Admins crash:", error);
      safeSetState(() =>
        setLoadError("Admin list request timed out. Refresh and try again.")
      );
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
          supabase.from("lead_assignments").delete().in("id", duplicateIds),
          "Duplicate cleanup"
        );

        if (error) {
          console.error("Duplicate cleanup error:", error);
        }
      } catch (error) {
        console.error("Duplicate cleanup timeout:", error);
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
      setLoadError("");
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
        "Assignment fetch"
      );

      if (error) {
        console.error("Assignment error:", error);
        safeSetState(() => {
          setAssignment(null);
          setSelectedAdminId("");
          setLoadError("Failed to load assignment.");
        });
        return;
      }

      const mainAssignment = await cleanDuplicateAssignments(data || []);

      safeSetState(() => {
        setAssignment(mainAssignment);
        setSelectedAdminId(mainAssignment?.assigned_admin_id || "");
        setLoadError("");
      });
    } catch (error) {
      console.error("Assignment crash:", error);
      safeSetState(() => {
        setLoadError("Assignment request timed out. Refresh and try again.");
      });
    } finally {
      safeSetState(() => {
        setLoading(false);
        setSyncing(false);
      });
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchAdmins();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchAssignment();
  }, [leadId, leadType]);

  useEffect(() => {
    if (!leadId) return;

    let refreshTimeout;

    const channel = supabase
      .channel(`lead-assignment-modal-${leadType}-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_assignments",
          filter: `lead_type=eq.${leadType}`,
        },
        (payload) => {
          const changedLeadId = String(
            payload.new?.lead_id || payload.old?.lead_id || ""
          );

          if (changedLeadId === leadId) {
            clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
              fetchAssignment({ silent: true });
              onAssigned();
            }, 200);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [leadId, leadType]);

  const assignLead = async () => {
    if (!leadId) return;

    if (!selectedAdminId) {
      alert("Please select an admin or staff member.");
      return;
    }

    const selectedAdmin = admins.find((admin) => admin.id === selectedAdminId);

    if (!selectedAdmin) {
      alert("Selected admin not found.");
      return;
    }

    setSaving(true);

    try {
      const { data: existingRows, error: checkError } = await withTimeout(
        supabase
          .from("lead_assignments")
          .select("*")
          .eq("lead_type", leadType)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
        "Assignment check"
      );

      if (checkError) {
        console.error("Check error:", checkError);
        alert("Failed to check assignment.");
        return;
      }

      const existingAssignment = await cleanDuplicateAssignments(existingRows || []);

      if (existingAssignment?.id) {
        const { error } = await withTimeout(
          supabase
            .from("lead_assignments")
            .update({
              assigned_admin_id: selectedAdmin.id,
              assigned_admin_name: selectedAdmin.full_name,
            })
            .eq("id", existingAssignment.id),
          "Assignment update"
        );

        if (error) {
          console.error("Update error:", error);
          alert("Failed to update assignment.");
          return;
        }
      } else {
        const { error } = await withTimeout(
          supabase.from("lead_assignments").insert({
            lead_type: leadType,
            lead_id: leadId,
            assigned_admin_id: selectedAdmin.id,
            assigned_admin_name: selectedAdmin.full_name,
          }),
          "Assignment insert"
        );

        if (error) {
          console.error("Insert error:", error);
          alert("Failed to assign lead.");
          return;
        }
      }

      await withTimeout(
        supabase.from("activity_logs").insert({
          admin_id: currentAdmin?.id || null,
          admin_name: currentAdmin?.full_name || "Unknown Admin",
          action: existingAssignment?.id ? "Updated lead assignment" : "Assigned lead",
          target_type: leadType,
          target_id: leadId,
          details: `Assigned ${leadType} to ${selectedAdmin.full_name}.`,
        }),
        "Activity log insert"
      ).catch((error) => console.error("Activity log timeout/error:", error));

      await fetchAssignment({ silent: true });
      onAssigned();
      alert("Lead assigned successfully.");
    } catch (error) {
      console.error("Assign crash:", error);
      alert("Assignment request timed out or failed. Check your internet and try again.");
    } finally {
      safeSetState(() => setSaving(false));
    }
  };

  const unassignLead = async () => {
    if (!leadId || !assignment?.id) return;

    const confirmUnassign = confirm(
      `Remove assignment from ${assignment.assigned_admin_name || "this lead"}?`
    );

    if (!confirmUnassign) return;

    setUnassigning(true);

    try {
      const previousAdminName = assignment.assigned_admin_name || "Unknown Admin";

      const { data: existingRows, error: checkError } = await withTimeout(
        supabase
          .from("lead_assignments")
          .select("*")
          .eq("lead_type", leadType)
          .eq("lead_id", leadId)
          .order("created_at", { ascending: false }),
        "Unassign check"
      );

      if (checkError) {
        console.error("Unassign check error:", checkError);
        alert("Failed to check current assignment.");
        return;
      }

      const existingAssignment = await cleanDuplicateAssignments(existingRows || []);

      if (!existingAssignment?.id) {
        safeSetState(() => {
          setAssignment(null);
          setSelectedAdminId("");
        });
        onAssigned();
        alert("This lead is already unassigned.");
        return;
      }

      const { error } = await withTimeout(
        supabase.from("lead_assignments").delete().eq("id", existingAssignment.id),
        "Unassign delete"
      );

      if (error) {
        console.error("Unassign error:", error);
        alert("Failed to unassign lead.");
        return;
      }

      await withTimeout(
        supabase.from("activity_logs").insert({
          admin_id: currentAdmin?.id || null,
          admin_name: currentAdmin?.full_name || "Unknown Admin",
          action: "Unassigned lead",
          target_type: leadType,
          target_id: leadId,
          details: `Removed ${leadType} assignment from ${previousAdminName}.`,
        }),
        "Activity log insert"
      ).catch((error) => console.error("Activity log timeout/error:", error));

      safeSetState(() => {
        setAssignment(null);
        setSelectedAdminId("");
      });
      await fetchAssignment({ silent: true });
      onAssigned();
      alert("Lead unassigned successfully.");
    } catch (error) {
      console.error("Unassign crash:", error);
      alert("Unassign request timed out or failed. Check your internet and try again.");
    } finally {
      safeSetState(() => setUnassigning(false));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-cyan-400/5 blur-3xl"></div>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

      <div className="relative mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
              Lead Ownership
            </p>

            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
              {leadTypeLabel}
            </span>

            {syncing && (
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"></span>
                Syncing
              </span>
            )}
          </div>

          <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Assignment Control
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
            Assign this student to the right counselor, staff member, or admin.
            The panel keeps one clean owner and removes duplicate assignment rows.
          </p>
        </div>

        <OwnerStatus
          loading={loading}
          assignment={assignment}
          assignedAdminInitial={assignedAdminInitial}
        />
      </div>

      {loadError && (
        <div className="relative mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-xs leading-relaxed text-red-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => {
                fetchAdmins();
                fetchAssignment();
              }}
              className="w-fit rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 font-black text-red-100 transition hover:bg-red-400/20"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="relative grid gap-3 xl:grid-cols-[1fr_auto_auto]">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 p-3 transition duration-300 focus-within:border-[#D4AF37]/40 focus-within:bg-black/35">
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
            Select Team Member
          </label>

          <select
            value={selectedAdminId}
            onChange={(event) => setSelectedAdminId(event.target.value)}
            disabled={isBusy}
            className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" className="bg-[#111] text-white">
              Select staff/admin
            </option>

            {admins.map((admin) => (
              <option key={admin.id} value={admin.id} className="bg-[#111] text-white">
                {admin.full_name} — {admin.role}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={assignLead}
          disabled={isBusy || !selectedAdminId}
          className="rounded-2xl bg-[#D4AF37] px-6 py-4 text-sm font-black text-black shadow-[0_0_28px_rgba(212,175,55,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 xl:min-w-[145px]"
        >
          {saving ? "Saving..." : assignment?.id ? "Update Owner" : "Assign Lead"}
        </button>

        {assignment?.id && (
          <button
            type="button"
            onClick={unassignLead}
            disabled={isBusy}
            className="rounded-2xl border border-red-400/20 bg-red-500/10 px-6 py-4 text-sm font-black text-red-300 transition duration-300 hover:-translate-y-0.5 hover:border-red-400/40 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 xl:min-w-[130px]"
          >
            {unassigning ? "Removing..." : "Unassign"}
          </button>
        )}
      </div>

      {selectedAdmin && (
        <div className="relative mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-sm font-black text-[#D4AF37]">
              {selectedAdmin.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {selectedAdmin.full_name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Selected for ownership
              </p>
            </div>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
              roleStyles[selectedAdmin.role] || roleStyles.staff
            }`}
          >
            {selectedAdmin.role || "staff"}
          </span>
        </div>
      )}

      {assignment?.assigned_admin_name ? (
        <div className="relative mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4 text-xs leading-relaxed text-gray-300">
          This lead is currently owned by{" "}
          <span className="font-bold text-cyan-300">
            {assignment.assigned_admin_name}
          </span>
          . Updating will reassign ownership. Unassigning will return it to the
          open lead pool.
        </div>
      ) : (
        <div className="relative mt-4 rounded-2xl border border-orange-400/10 bg-orange-500/[0.04] p-4 text-xs leading-relaxed text-orange-100/80">
          This lead is currently in the open pool. Assign it to a team member so
          follow-up responsibility is clear.
        </div>
      )}
    </div>
  );
}

function OwnerStatus({ loading, assignment, assignedAdminInitial }) {
  if (loading) {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold text-gray-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-300"></span>
        Loading owner...
      </div>
    );
  }

  if (!assignment?.assigned_admin_name) {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.08)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-300/20 bg-orange-400/10 text-[10px]">
          !
        </span>
        Unassigned
      </div>
    );
  }

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/15 text-[10px] font-black text-cyan-200">
        {assignedAdminInitial}
      </span>
      <span className="max-w-[220px] truncate">
        {assignment.assigned_admin_name}
      </span>
    </div>
  );
}

export default LeadAssignmentPanel;