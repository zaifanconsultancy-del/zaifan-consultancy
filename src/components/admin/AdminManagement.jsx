import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

function AdminManagement({
  cardClass = "",
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const fetchAdmins = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to load admin profiles.");
      return;
    }

    setAdmins(data || []);
  };

  useEffect(() => {
    fetchAdmins();
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

    setSaving(true);

    const { error } = await supabase.from("admin_profiles").insert({
      id: form.id.trim(),
      full_name: form.full_name.trim(),
      role: form.role,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert(error.message || "Failed to create admin profile.");
      return;
    }

    resetForm();
    fetchAdmins();
    alert("Admin profile created successfully.");
  };

  const updateAdminRole = async (adminId, newRole) => {
    if (!canManageAdmins) {
      alert("Only Super Admin can update admin roles.");
      return;
    }

    if (adminId === adminProfile?.id && newRole !== "super_admin") {
      alert("You cannot remove your own Super Admin role.");
      return;
    }

    const { error } = await supabase
      .from("admin_profiles")
      .update({ role: newRole })
      .eq("id", adminId);

    if (error) {
      console.error(error);
      alert("Failed to update role.");
      return;
    }

    setAdmins((current) =>
      current.map((admin) =>
        admin.id === adminId ? { ...admin, role: newRole } : admin
      )
    );
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

    const confirmDelete = confirm("Delete this admin profile?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("admin_profiles")
      .delete()
      .eq("id", adminId);

    if (error) {
      console.error(error);
      alert("Failed to delete admin profile.");
      return;
    }

    setAdmins((current) => current.filter((admin) => admin.id !== adminId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-6"
    >
      <div className={`${cardClass} p-5 sm:p-7`}>
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

      <form onSubmit={createAdminProfile} className={`${cardClass} p-5 sm:p-7`}>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
          Create Admin Profile
        </p>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_1fr_0.7fr_auto]">
          <input
            value={form.id}
            onChange={(event) => setForm({ ...form, id: event.target.value })}
            disabled={!canManageAdmins}
            placeholder="Paste Supabase Auth User UUID"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          />

          <input
            value={form.full_name}
            onChange={(event) =>
              setForm({ ...form, full_name: event.target.value })
            }
            disabled={!canManageAdmins}
            placeholder="Full name"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          />

          <select
            value={form.role}
            onChange={(event) =>
              setForm({ ...form, role: event.target.value })
            }
            disabled={!canManageAdmins}
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

        <p className="mt-4 text-xs leading-relaxed text-gray-500">
          First create the user in Supabase Authentication, then paste that
          user UUID here.
        </p>
      </form>

      <div className={`${cardClass} p-5 sm:p-7`}>
        <div className="mb-5 flex items-center justify-between gap-4">
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
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-gray-400">
            Loading admins...
          </p>
        ) : admins.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm text-gray-400">
            No admin profiles found.
          </p>
        ) : (
          <div className="grid gap-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4"
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
                      disabled={!canManageAdmins}
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
                      disabled={!canManageAdmins || admin.id === adminProfile?.id}
                      className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AdminManagement;