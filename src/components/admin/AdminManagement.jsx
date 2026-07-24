// AdminManagement V4 MAXIMUM — Framed Access Control Command Center
// src/components/admin/AdminManagement.jsx
//
// Maximum pass:
// - preserves Supabase admin_profiles CRUD and current role/permission API
// - validates Auth User UUIDs before insert
// - protects current Super Admin and the LAST Super Admin from demotion/deletion
// - realtime admin_profiles sync
// - timeout-safe fetch/create/update/delete
// - stale/unmount safety
// - inline success/error/warning feedback; no alert() dependence
// - explicit destructive confirmation panel
// - search + role filter + sorting
// - optimistic role update with rollback on failure
// - best-effort activity_logs audit writes without breaking core CRUD
// - stronger responsive Admin OS hierarchy and contrast
// - no fake Auth user creation: this panel manages profiles only

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Crown,
  Filter,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;

const ROLES = [
  {
    id: "staff",
    label: "Staff",
    description: "Operational access based on assigned permissions.",
    Icon: UserRound,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Broader CRM operational access.",
    Icon: ShieldCheck,
  },
  {
    id: "super_admin",
    label: "Super Admin",
    description: "Highest access level and team management control.",
    Icon: Crown,
  },
];

function withTimeout(promise, label = "Request") {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error(`${label} timed out.`)),
        REQUEST_TIMEOUT_MS
      );
      Promise.resolve(promise).finally(() => window.clearTimeout(timer));
    }),
  ]);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function AdminManagement({
  cardClass = "",
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const shouldReduceMotion = useReducedMotion();
  const mountedRef = useRef(true);
  const realtimeTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [operationMessage, setOperationMessage] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortMode, setSortMode] = useState("role");

  const [form, setForm] = useState({
    id: "",
    full_name: "",
    role: "staff",
  });

  const canManageAdmins =
    Boolean(permissions?.canManageAdmins) || role === "super_admin";

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const writeAuditLog = useCallback(
    async ({ action, targetId, details }) => {
      try {
        await withTimeout(
          supabase.from("activity_logs").insert({
            admin_id: adminProfile?.id || null,
            admin_name:
              adminProfile?.full_name ||
              adminProfile?.name ||
              "Unknown Admin",
            action,
            target_type: "admin_profile",
            target_id: targetId ? String(targetId) : null,
            details,
          }),
          "Admin management audit log"
        );
      } catch (error) {
        // Core access-control CRUD must not fail because optional audit logging fails.
        console.warn("AdminManagement audit log failed:", error);
      }
    },
    [adminProfile]
  );

  const fetchAdmins = useCallback(async ({ quiet = false } = {}) => {
    const requestId = ++requestIdRef.current;

    if (!quiet) {
      safeSet(() => {
        setLoading(true);
        setLoadError("");
      });
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .select("*")
          .order("role", { ascending: true })
          .order("full_name", { ascending: true }),
        "Admin profiles fetch"
      );

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (error) throw error;

      safeSet(() => {
        setAdmins(Array.isArray(data) ? data : []);
        setLoadError("");
      });
    } catch (error) {
      console.error("Admin profiles fetch failed:", error);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      safeSet(() => {
        const message = String(error?.message || "");
        setLoadError(
          message.toLowerCase().includes("permission") ||
            message.toLowerCase().includes("row-level security")
            ? "Admin profiles are blocked by Supabase permissions/RLS."
            : message || "Failed to load admin profiles."
        );
      });
    } finally {
      if (!quiet && mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchAdmins();

    const channel = supabase
      .channel("admin-management-profiles-v3")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_profiles",
        },
        () => {
          window.clearTimeout(realtimeTimerRef.current);
          realtimeTimerRef.current = window.setTimeout(() => {
            void fetchAdmins({ quiet: true });
          }, 250);
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      window.clearTimeout(realtimeTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchAdmins]);

  useEffect(() => {
    if (!operationMessage) return undefined;

    const timer = window.setTimeout(() => {
      setOperationMessage(null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [operationMessage]);

  const counts = useMemo(() => {
    const staff = admins.filter((admin) => admin.role === "staff").length;
    const admin = admins.filter((item) => item.role === "admin").length;
    const superAdmin = admins.filter(
      (item) => item.role === "super_admin"
    ).length;

    return {
      total: admins.length,
      staff,
      admin,
      superAdmin,
    };
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = admins.filter((admin) => {
      if (roleFilter !== "all" && admin.role !== roleFilter) return false;

      if (!query) return true;

      return [
        admin.full_name,
        admin.id,
        admin.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    const roleRank = {
      super_admin: 3,
      admin: 2,
      staff: 1,
    };

    return [...filtered].sort((a, b) => {
      if (sortMode === "name") {
        return String(a.full_name || "").localeCompare(
          String(b.full_name || "")
        );
      }

      if (sortMode === "name_desc") {
        return String(b.full_name || "").localeCompare(
          String(a.full_name || "")
        );
      }

      const roleDifference =
        (roleRank[b.role] || 0) - (roleRank[a.role] || 0);

      if (roleDifference !== 0) return roleDifference;

      return String(a.full_name || "").localeCompare(
        String(b.full_name || "")
      );
    });
  }, [admins, search, roleFilter, sortMode]);

  const resetForm = () => {
    setForm({
      id: "",
      full_name: "",
      role: "staff",
    });
  };

  const createAdminProfile = async (event) => {
    event.preventDefault();

    if (!canManageAdmins || saving) {
      setOperationMessage({
        type: "warning",
        text: "Only Super Admin can create Admin profiles.",
      });
      return;
    }

    const cleanId = form.id.trim();
    const cleanName = form.full_name.trim();

    if (!isUuid(cleanId)) {
      setOperationMessage({
        type: "error",
        text: "Paste a valid Supabase Auth User UUID.",
      });
      return;
    }

    if (!cleanName) {
      setOperationMessage({
        type: "error",
        text: "Enter the Admin team member's full name.",
      });
      return;
    }

    if (admins.some((admin) => admin.id === cleanId)) {
      setOperationMessage({
        type: "warning",
        text: "An Admin profile already exists for this Auth User UUID.",
      });
      return;
    }

    setSaving(true);
    setOperationMessage(null);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .insert({
            id: cleanId,
            full_name: cleanName,
            role: form.role,
          })
          .select("*")
          .single(),
        "Create Admin profile"
      );

      if (error) throw error;

      safeSet(() => {
        setAdmins((current) => {
          if (current.some((item) => item.id === data?.id)) return current;
          return [...current, data].filter(Boolean);
        });
      });

      resetForm();

      await writeAuditLog({
        action: "admin_profile_created",
        targetId: cleanId,
        details: `Created Admin profile for ${cleanName} with role ${form.role}.`,
      });

      setOperationMessage({
        type: "success",
        text: `${cleanName} was added to Admin access.`,
      });
    } catch (error) {
      console.error("Create Admin profile failed:", error);
      setOperationMessage({
        type: "error",
        text:
          error?.message ||
          "Admin profile could not be created. Check Supabase permissions/RLS.",
      });
    } finally {
      safeSet(() => setSaving(false));
    }
  };

  const updateAdminRole = async (adminId, newRole) => {
    if (!canManageAdmins || updatingId) {
      setOperationMessage({
        type: "warning",
        text: "Only Super Admin can update Admin roles.",
      });
      return;
    }

    if (!ROLES.some((item) => item.id === newRole)) return;

    const selectedAdmin = admins.find((admin) => admin.id === adminId);
    if (!selectedAdmin || selectedAdmin.role === newRole) return;

    const oldRole = selectedAdmin.role;
    const isCurrentUser = adminId === adminProfile?.id;
    const isLastSuperAdmin =
      oldRole === "super_admin" && counts.superAdmin <= 1;

    if (isCurrentUser && oldRole === "super_admin" && newRole !== "super_admin") {
      setOperationMessage({
        type: "warning",
        text: "You cannot remove your own Super Admin role.",
      });
      return;
    }

    if (isLastSuperAdmin && newRole !== "super_admin") {
      setOperationMessage({
        type: "warning",
        text: "The last Super Admin cannot be demoted.",
      });
      return;
    }

    setUpdatingId(adminId);
    setOperationMessage(null);

    // Optimistic UI with rollback.
    setAdmins((current) =>
      current.map((admin) =>
        admin.id === adminId ? { ...admin, role: newRole } : admin
      )
    );

    try {
      const { error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .update({ role: newRole })
          .eq("id", adminId),
        "Update Admin role"
      );

      if (error) throw error;

      await writeAuditLog({
        action: "admin_role_updated",
        targetId: adminId,
        details: `Changed ${selectedAdmin.full_name || adminId} from ${oldRole} to ${newRole}.`,
      });

      setOperationMessage({
        type: "success",
        text: `${selectedAdmin.full_name || "Admin"} is now ${prettyRole(newRole)}.`,
      });
    } catch (error) {
      console.error("Admin role update failed:", error);

      // Roll back optimistic update.
      safeSet(() => {
        setAdmins((current) =>
          current.map((admin) =>
            admin.id === adminId ? { ...admin, role: oldRole } : admin
          )
        );
      });

      setOperationMessage({
        type: "error",
        text:
          error?.message ||
          "Role update failed. The previous role has been restored.",
      });
    } finally {
      safeSet(() => setUpdatingId(null));
    }
  };

  const requestDelete = (admin) => {
    if (!canManageAdmins) {
      setOperationMessage({
        type: "warning",
        text: "Only Super Admin can delete Admin profiles.",
      });
      return;
    }

    if (admin.id === adminProfile?.id) {
      setOperationMessage({
        type: "warning",
        text: "You cannot delete your own Admin profile.",
      });
      return;
    }

    if (admin.role === "super_admin" && counts.superAdmin <= 1) {
      setOperationMessage({
        type: "warning",
        text: "The last Super Admin profile cannot be deleted.",
      });
      return;
    }

    setPendingDelete(admin);
  };

  const deleteAdminProfile = async () => {
    const selectedAdmin = pendingDelete;
    if (!selectedAdmin || deletingId) return;

    setDeletingId(selectedAdmin.id);
    setOperationMessage(null);

    try {
      const { error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .delete()
          .eq("id", selectedAdmin.id),
        "Delete Admin profile"
      );

      if (error) throw error;

      safeSet(() => {
        setAdmins((current) =>
          current.filter((admin) => admin.id !== selectedAdmin.id)
        );
        setPendingDelete(null);
      });

      await writeAuditLog({
        action: "admin_profile_deleted",
        targetId: selectedAdmin.id,
        details: `Deleted Admin profile for ${
          selectedAdmin.full_name || selectedAdmin.id
        } (${selectedAdmin.role}).`,
      });

      setOperationMessage({
        type: "success",
        text: `${selectedAdmin.full_name || "Admin profile"} was removed from Admin access.`,
      });
    } catch (error) {
      console.error("Delete Admin profile failed:", error);
      setOperationMessage({
        type: "error",
        text:
          error?.message ||
          "Admin profile could not be deleted. Check Supabase permissions/RLS.",
      });
    } finally {
      safeSet(() => setDeletingId(null));
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
      className="space-y-5 text-[#10233f]"
    >
      <section
        className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_18px_48px_rgba(15,35,63,0.09)] sm:p-4`}
      >
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={12} />
                Team Access OS
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Crown size={12} />
                Super Admin Control
              </span>
            </div>

            <h2 className="mt-4 break-words text-3xl font-black leading-tight text-white sm:text-4xl">
              Admin Management
            </h2>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
              Control Zaifan team access, roles and protected Super Admin
              authority from one audited workspace.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkStat label="Total" value={counts.total} />
              <DarkStat label="Staff" value={counts.staff} />
              <DarkStat label="Admins" value={counts.admin} />
              <DarkStat label="Super Admin" value={counts.superAdmin} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
              Current Authority
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 text-white">
                {canManageAdmins ? (
                  <Crown size={21} />
                ) : (
                  <KeyRound size={21} />
                )}
              </div>

              <div className="min-w-0">
                <p className="break-words text-xl font-black text-white">
                  {canManageAdmins ? "Management Enabled" : "View Only"}
                </p>
                <p className="mt-1 text-xs font-semibold text-white">
                  {canManageAdmins
                    ? "Create, promote, demote and remove team profiles."
                    : "Your role cannot change team access."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.25rem] border-2 border-white/25 bg-white/10 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Signed in as
              </p>
              <p className="mt-1 break-words text-lg font-black text-white">
                {adminProfile?.full_name || "Admin User"}
              </p>
              <p className="mt-1 text-xs font-bold text-white">
                {prettyRole(role)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {operationMessage ? (
        <Feedback
          type={operationMessage.type}
          text={operationMessage.text}
          onClose={() => setOperationMessage(null)}
        />
      ) : null}

      {!canManageAdmins ? (
        <Feedback
          type="warning"
          text="This workspace is view-only for your current role. Super Admin authority is required for profile creation, role changes and deletion."
        />
      ) : null}

      <section
        className={`${cardClass} min-w-0 rounded-[1.85rem] border-[3px] border-[#F97316] bg-[#FFF7EC] p-5 shadow-[0_10px_28px_rgba(15,35,63,0.055)] sm:p-6`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
              Access Provisioning
            </p>

            <h3 className="mt-1 break-words text-2xl font-black leading-tight text-[#10233f]">
              Add Team Access
            </h3>

            <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
              This creates an <strong>admin_profiles</strong> record only. The
              user must already exist in Supabase Authentication.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            disabled={!canManageAdmins || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2.5 text-xs font-black text-[#10233f] transition hover:border-[#F97316] hover:bg-[#FFF4E8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X size={14} />
            Reset
          </button>
        </div>

        <form
          onSubmit={createAdminProfile}
          className="mt-5 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
        >
          <div className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(18rem,1.35fr)_minmax(15rem,1fr)_minmax(11rem,0.7fr)_auto]">
            <Field label="Supabase Auth User UUID">
              <input
                value={form.id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    id: event.target.value,
                  }))
                }
                disabled={!canManageAdmins || saving}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={inputClass(Boolean(form.id) && !isUuid(form.id))}
              />
            </Field>

            <Field label="Full Name">
              <input
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    full_name: event.target.value,
                  }))
                }
                disabled={!canManageAdmins || saving}
                placeholder="Team member name"
                className={inputClass(false)}
              />
            </Field>

            <Field label="Access Role">
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                disabled={!canManageAdmins || saving}
                className={inputClass(false)}
              >
                {ROLES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={
                  !canManageAdmins ||
                  saving ||
                  !isUuid(form.id) ||
                  !form.full_name.trim()
                }
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[3px] border-[#D94F08] bg-[#E96512] px-5 text-sm font-black text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] transition hover:bg-[#D94F08] disabled:cursor-not-allowed disabled:opacity-45 2xl:w-auto"
              >
                <UserPlus size={16} />
                {saving ? "Creating..." : "Create Access"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {ROLES.map((item) => (
            <RoleExplainer key={item.id} {...item} />
          ))}
        </div>
      </section>

      <section
        className={`${cardClass} min-w-0 rounded-[1.85rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-5 shadow-[0_10px_28px_rgba(15,35,63,0.055)] sm:p-6`}
      >
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
              Team Directory
            </p>
            <h3 className="mt-1 text-2xl font-black text-[#10233f]">
              Admin Profiles
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {filteredAdmins.length} shown · {admins.length} total profiles
            </p>
          </div>

          <div className="grid min-w-0 gap-2 md:grid-cols-2 2xl:grid-cols-[minmax(16rem,1fr)_150px_170px_auto]">
            <div className="relative min-w-0 md:col-span-2 2xl:col-span-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, UUID or role..."
                className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white pl-9 pr-3 text-xs font-bold text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All roles</option>
              {ROLES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="role">Privilege first</option>
              <option value="name">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>

            <button
              type="button"
              onClick={() => fetchAdmins()}
              disabled={loading}
              className="inline-flex h-11 min-w-0 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] px-4 text-xs font-black text-orange-700 transition hover:bg-[#FFE8D5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="mt-4">
            <Feedback
              type="error"
              text={loadError}
              actionLabel="Retry"
              onAction={() => fetchAdmins()}
            />
          </div>
        ) : null}

        <div className="mt-5">
          {loading && !admins.length ? (
            <LoadingState />
          ) : !admins.length ? (
            <EmptyState />
          ) : !filteredAdmins.length ? (
            <NoMatchState />
          ) : (
            <div className="grid gap-3">
              {filteredAdmins.map((admin) => {
                const isCurrentUser = admin.id === adminProfile?.id;
                const isBusy =
                  updatingId === admin.id || deletingId === admin.id;
                const isLastSuperAdmin =
                  admin.role === "super_admin" &&
                  counts.superAdmin <= 1;

                return (
                  <AdminProfileCard
                    key={admin.id}
                    admin={admin}
                    isCurrentUser={isCurrentUser}
                    isLastSuperAdmin={isLastSuperAdmin}
                    canManageAdmins={canManageAdmins}
                    isBusy={isBusy}
                    updatingId={updatingId}
                    deletingId={deletingId}
                    onRoleChange={updateAdminRole}
                    onDelete={() => requestDelete(admin)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {pendingDelete ? (
          <DeleteConfirmation
            admin={pendingDelete}
            deleting={deletingId === pendingDelete.id}
            onCancel={() => {
              if (!deletingId) setPendingDelete(null);
            }}
            onConfirm={deleteAdminProfile}
            shouldReduceMotion={shouldReduceMotion}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function inputClass(invalid) {
  return `h-12 w-full rounded-xl border-2 bg-white px-4 text-sm font-bold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
    invalid
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-[#B9C9D9] focus:border-[#F97316] focus:ring-orange-100"
  }`;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function RoleExplainer({ label, description, Icon, id }) {
  const styles = {
    staff: "border-[#60A5FA] bg-[#F2F7FF] text-blue-900",
    admin: "border-[#F97316] bg-[#FFF4E8] text-orange-900",
    super_admin: "border-[#173F6B] bg-[#173F6B] text-white",
  };

  return (
    <div className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.035)] ${styles[id]}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} />
        <p className="text-sm font-black">{label}</p>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5">
        {description}
      </p>
    </div>
  );
}

function AdminProfileCard({
  admin,
  isCurrentUser,
  isLastSuperAdmin,
  canManageAdmins,
  isBusy,
  updatingId,
  deletingId,
  onRoleChange,
  onDelete,
}) {
  const config =
    ROLES.find((item) => item.id === admin.role) || ROLES[0];
  const Icon = config.Icon;

  return (
    <div className="min-w-0 rounded-[1.5rem] border-[3px] border-[#D1DCE7] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316] hover:shadow-[0_10px_24px_rgba(15,35,63,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 ${
                admin.role === "super_admin"
                  ? "border-[#123865] bg-[#123865] text-white"
                  : admin.role === "admin"
                  ? "border-orange-300 bg-orange-50 text-orange-700"
                  : "border-blue-300 bg-blue-50 text-blue-700"
              }`}
            >
              <Icon size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="break-words text-lg font-black leading-6 text-[#10233f]">
                  {admin.full_name || "Unnamed Admin"}
                </h4>

                <RoleBadge role={admin.role} />

                {isCurrentUser ? (
                  <span className="rounded-full border-2 border-blue-300 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-700">
                    You
                  </span>
                ) : null}

                {isLastSuperAdmin ? (
                  <span className="rounded-full border-2 border-red-300 bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-red-700">
                    Last Super Admin
                  </span>
                ) : null}
              </div>

              <p className="mt-2 break-all font-mono text-[10px] font-semibold text-slate-500">
                {admin.id}
              </p>

              <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[180px_auto]">
          <div className="relative">
            <select
              value={admin.role}
              onChange={(event) =>
                onRoleChange(admin.id, event.target.value)
              }
              disabled={
                !canManageAdmins ||
                isBusy ||
                (isCurrentUser && admin.role === "super_admin") ||
                isLastSuperAdmin
              }
              className="h-11 w-full appearance-none rounded-xl border-2 border-[#B9C9D9] bg-white px-4 pr-9 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ROLES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={onDelete}
            disabled={
              !canManageAdmins ||
              isBusy ||
              isCurrentUser ||
              isLastSuperAdmin
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            {deletingId === admin.id
              ? "Deleting..."
              : updatingId === admin.id
              ? "Updating..."
              : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    staff: "border-blue-300 bg-blue-50 text-blue-700",
    admin: "border-orange-300 bg-orange-50 text-orange-700",
    super_admin: "border-[#123865] bg-[#123865] text-white",
  };

  return (
    <span
      className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
        styles[role] || styles.staff
      }`}
    >
      {prettyRole(role)}
    </span>
  );
}

function DarkStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/30 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function Feedback({
  type = "warning",
  text,
  onClose = null,
  actionLabel = "",
  onAction = null,
}) {
  const styles = {
    success: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    warning: "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    error: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
  };

  const Icon =
    type === "success" ? Check : AlertTriangle;

  return (
    <div
      role="status"
      className={`flex flex-col gap-3 rounded-[1.3rem] border-[3px] p-4 sm:flex-row sm:items-center sm:justify-between ${
        styles[type] || styles.warning
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <Icon size={17} className="mt-0.5 shrink-0" />
        <p className="text-sm font-black leading-6">{text}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-xl border-2 border-current bg-white px-3 py-2 text-xs font-black"
          >
            {actionLabel || "Retry"}
          </button>
        ) : null}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-black/5"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DeleteConfirmation({
  admin,
  deleting,
  onCancel,
  onConfirm,
  shouldReduceMotion,
}) {
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#10233f]/55 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, y: 16, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="w-full max-w-lg overflow-hidden rounded-[1.9rem] border-[3px] border-[#FB7185] bg-[#FFFDF8] p-3 shadow-[0_28px_80px_rgba(15,35,63,0.22)]"
      >
        <div className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#FB7185] bg-[#173F6B] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
              <AlertTriangle size={19} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Protected Action
              </p>
              <h3 className="mt-1 text-xl font-black text-white">
                Remove Admin Access?
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-[#fff8ee] p-5">
          <p className="text-sm font-semibold leading-6 text-slate-700">
            You are about to delete the Admin profile for{" "}
            <strong className="text-[#10233f]">
              {admin.full_name || "this user"}
            </strong>
            . This removes their <strong>admin_profiles</strong> record. It does
            not delete the Supabase Authentication user.
          </p>

          <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4">
            <p className="text-xs font-black text-red-800">
              UUID: {admin.id}
            </p>
            <p className="mt-1 text-xs font-semibold text-red-700">
              Current role: {prettyRole(admin.role)}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={deleting}
              className="h-11 rounded-xl border-2 border-slate-300 bg-white text-xs font-black text-[#10233f] transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-red-600 bg-red-600 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete Profile"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EE] p-5"
        >
          <div className="h-4 w-44 rounded-full bg-slate-200" />
          <div className="mt-4 h-3 w-full max-w-lg rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#F97316] bg-[#FFF8EE] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <UsersRound size={22} />
      </div>
      <h3 className="mt-4 text-xl font-black text-[#10233f]">
        No Admin Profiles Found
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-600">
        Create an Auth user first, then provision its Admin profile here.
      </p>
    </div>
  );
}

function NoMatchState() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-8 text-center">
      <Filter size={22} className="mx-auto text-orange-600" />
      <h3 className="mt-3 text-lg font-black text-[#10233f]">
        No matching Admin profiles
      </h3>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        Adjust the search or role filter.
      </p>
    </div>
  );
}

function prettyRole(value = "") {
  return String(value || "staff")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default AdminManagement;
