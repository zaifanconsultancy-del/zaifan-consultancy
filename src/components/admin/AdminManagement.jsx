import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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

function AdminManagement({
  cardClass = "",
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const mountedRef = useRef(true);

  const [form, setForm] = useState({
    id: "",
    full_name: "",
    role: "staff",
  });

  const canManageAdmins = permissions?.canManageAdmins || role === "super_admin";

  const roleStyles = {
    staff: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    admin: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    super_admin: "border-purple-400/25 bg-purple-500/10 text-purple-300",
  };

  const roleIcons = {
    staff: "🧑‍💼",
    admin: "🛡️",
    super_admin: "👑",
  };

  const staffCount = admins.filter((admin) => admin.role === "staff").length;
  const adminCount = admins.filter((admin) => admin.role === "admin").length;
  const superAdminCount = admins.filter(
    (admin) => admin.role === "super_admin"
  ).length;

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchAdmins = async () => {
    safeSetState(() => {
      setLoading(true);
      setLoadError("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .select("*")
          .order("role", { ascending: true })
          .order("full_name", { ascending: true }),
        "Admin profiles fetch"
      );

      if (error) {
        console.error(error);
        safeSetState(() => setLoadError("Failed to load admin profiles."));
        return;
      }

      safeSetState(() => {
        setAdmins(data || []);
        setLoadError("");
      });
    } catch (error) {
      console.error(error);
      safeSetState(() => {
        setLoadError("Admin profiles request timed out. Check internet and retry.");
      });
    } finally {
      safeSetState(() => setLoading(false));
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchAdmins();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetForm = () => {
    setForm({
      id: "",
      full_name: "",
      role: "staff",
    });
  };

  const createAdminProfile = async (event) => {
    event.preventDefault();

    if (!canManageAdmins) {
      alert("Only Super Admin can create admin profiles.");
      return;
    }

    if (!form.id.trim() || !form.full_name.trim()) {
      alert("Please add user UUID and full name.");
      return;
    }

    safeSetState(() => setSaving(true));

    try {
      const { error } = await withTimeout(
        supabase.from("admin_profiles").insert({
          id: form.id.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
        }),
        "Create admin profile"
      );

      if (error) {
        console.error(error);
        alert(error.message || "Failed to create admin profile.");
        return;
      }

      resetForm();
      await fetchAdmins();
      alert("Admin profile created successfully.");
    } catch (error) {
      console.error(error);
      alert("Create admin request timed out or failed. Try again.");
    } finally {
      safeSetState(() => setSaving(false));
    }
  };

  const updateAdminRole = async (adminId, newRole) => {
    if (!canManageAdmins) {
      alert("Only Super Admin can update admin roles.");
      return;
    }

    const selectedAdmin = admins.find((admin) => admin.id === adminId);

    if (adminId === adminProfile?.id && newRole !== "super_admin") {
      alert("You cannot remove your own Super Admin role.");
      return;
    }

    if (selectedAdmin?.role === newRole) return;

    safeSetState(() => setUpdatingId(adminId));

    try {
      const { error } = await withTimeout(
        supabase.from("admin_profiles").update({ role: newRole }).eq("id", adminId),
        "Update admin role"
      );

      if (error) {
        console.error(error);
        alert("Failed to update role.");
        return;
      }

      safeSetState(() => {
        setAdmins((current) =>
          current.map((admin) =>
            admin.id === adminId ? { ...admin, role: newRole } : admin
          )
        );
      });
    } catch (error) {
      console.error(error);
      alert("Role update timed out or failed. Try again.");
    } finally {
      safeSetState(() => setUpdatingId(null));
    }
  };

  const deleteAdminProfile = async (adminId) => {
    if (!canManageAdmins) {
      alert("Only Super Admin can delete admin profiles.");
      return;
    }

    if (adminId === adminProfile?.id) {
      alert("You cannot delete your own admin profile.");
      return;
    }

    const selectedAdmin = admins.find((admin) => admin.id === adminId);

    if (selectedAdmin?.role === "super_admin" && superAdminCount <= 1) {
      alert("You cannot delete the last Super Admin profile.");
      return;
    }

    const confirmDelete = confirm(
      `Delete ${selectedAdmin?.full_name || "this admin profile"}?`
    );
    if (!confirmDelete) return;

    safeSetState(() => setDeletingId(adminId));

    try {
      const { error } = await withTimeout(
        supabase.from("admin_profiles").delete().eq("id", adminId),
        "Delete admin profile"
      );

      if (error) {
        console.error(error);
        alert("Failed to delete admin profile.");
        return;
      }

      safeSetState(() => {
        setAdmins((current) => current.filter((admin) => admin.id !== adminId));
      });
    } catch (error) {
      console.error(error);
      alert("Delete request timed out or failed. Try again.");
    } finally {
      safeSetState(() => setDeletingId(null));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-6"
    >
      <div className={`${cardClass} p-5 sm:p-7`}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
              Super Admin Control
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
              Admin Management
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              Create admin profiles, assign roles, promote staff, and protect
              your CRM with role-based access.
            </p>
          </div>

          <div
            className={`w-fit rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
              canManageAdmins
                ? "border-purple-400/25 bg-purple-500/10 text-purple-300"
                : "border-red-400/25 bg-red-500/10 text-red-300"
            }`}
          >
            {canManageAdmins ? "Access Granted" : "Super Admin Only"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Profiles" value={admins.length} icon="👥" />
        <SummaryCard label="Staff" value={staffCount} icon="🧑‍💼" />
        <SummaryCard label="Admins" value={adminCount} icon="🛡️" />
        <SummaryCard label="Super Admins" value={superAdminCount} icon="👑" />
      </div>

      {!canManageAdmins && (
        <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5 text-sm leading-relaxed text-red-200">
          This panel is view-only for your current role. Only Super Admin can
          create, update, or delete admin profiles.
        </div>
      )}

      <form onSubmit={createAdminProfile} className={`${cardClass} p-5 sm:p-7`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
              Create Admin Profile
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              Add Team Access
            </h3>
          </div>

          <button
            type="button"
            onClick={resetForm}
            disabled={!canManageAdmins || saving}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr_0.7fr_auto]">
          <input
            value={form.id}
            onChange={(event) => setForm({ ...form, id: event.target.value })}
            disabled={!canManageAdmins || saving}
            placeholder="Paste Supabase Auth User UUID"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          />

          <input
            value={form.full_name}
            onChange={(event) =>
              setForm({ ...form, full_name: event.target.value })
            }
            disabled={!canManageAdmins || saving}
            placeholder="Full name"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          />

          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            disabled={!canManageAdmins || saving}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option className="bg-[#111]" value="staff">
              Staff
            </option>
            <option className="bg-[#111]" value="admin">
              Admin
            </option>
            <option className="bg-[#111]" value="super_admin">
              Super Admin
            </option>
          </select>

          <button
            type="submit"
            disabled={!canManageAdmins || saving}
            className="rounded-2xl bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create"}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4 text-xs leading-relaxed text-gray-400">
          First create the user in Supabase Authentication, then paste that user
          UUID here. Do not create duplicate profiles for the same auth user.
        </div>
      </form>

      <div className={`${cardClass} p-5 sm:p-7`}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
              Admin Profiles
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              Team Access List
            </h3>
          </div>

          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loadError && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={fetchAdmins}
                className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#E7C768]"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : admins.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {admins.map((admin) => {
              const isCurrentUser = admin.id === adminProfile?.id;
              const isBusy = updatingId === admin.id || deletingId === admin.id;
              const isLastSuperAdmin =
                admin.role === "super_admin" && superAdminCount <= 1;

              return (
                <div
                  key={admin.id}
                  className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 transition duration-300 hover:border-[#D4AF37]/25 hover:bg-white/[0.035]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-black text-white">
                          {admin.full_name || "Unnamed Admin"}
                        </h4>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                            roleStyles[admin.role] || roleStyles.staff
                          }`}
                        >
                          {roleIcons[admin.role] || "🧑‍💼"} {admin.role}
                        </span>

                        {isCurrentUser && (
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                            You
                          </span>
                        )}

                        {isLastSuperAdmin && (
                          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-purple-300">
                            Protected
                          </span>
                        )}
                      </div>

                      <p className="mt-2 break-all font-mono text-xs text-gray-500">
                        {admin.id}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={admin.role}
                        onChange={(event) =>
                          updateAdminRole(admin.id, event.target.value)
                        }
                        disabled={
                          !canManageAdmins ||
                          isBusy ||
                          (isCurrentUser && admin.role === "super_admin")
                        }
                        className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option className="bg-[#111]" value="staff">
                          Staff
                        </option>
                        <option className="bg-[#111]" value="admin">
                          Admin
                        </option>
                        <option className="bg-[#111]" value="super_admin">
                          Super Admin
                        </option>
                      </select>

                      <button
                        onClick={() => deleteAdminProfile(admin.id)}
                        disabled={
                          !canManageAdmins ||
                          isBusy ||
                          isCurrentUser ||
                          isLastSuperAdmin
                        }
                        className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === admin.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/25">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
            {label}
          </p>
          <h3 className="mt-3 text-3xl font-black text-[#D4AF37]">{value}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
        >
          <div className="h-4 w-40 rounded-full bg-white/10"></div>
          <div className="mt-4 h-3 w-full max-w-lg rounded-full bg-white/10"></div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/25 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl">
        👥
      </div>
      <h3 className="mt-5 text-2xl font-black text-white">
        No Admin Profiles Found
      </h3>
      <p className="mt-3 text-sm text-gray-400">
        Create your first admin profile to start managing CRM access.
      </p>
    </div>
  );
}

export default AdminManagement;
