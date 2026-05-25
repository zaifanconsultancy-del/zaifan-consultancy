import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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

  const leadId = lead?.id ? String(lead.id) : "";

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("id, full_name, role");

    if (error) {
      console.error(error);
      return;
    }

    setAdmins(data || []);
  };

  const fetchAssignment = async () => {
    if (!leadId) return;

    setLoading(true);

    const { data, error } = await supabase
  .from("lead_assignments")
  .select("*")
  .eq("lead_type", leadType)
  .eq("lead_id", leadId)
  .limit(1);

const currentAssignment = data?.[0] || null;

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    setAssignment(currentAssignment);
setSelectedAdminId(currentAssignment?.assigned_admin_id || "");
  };

  useEffect(() => {
    fetchAdmins();
    fetchAssignment();
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

    if (assignment?.id) {
      const { error } = await supabase
        .from("lead_assignments")
        .update({
          assigned_admin_id: selectedAdmin.id,
          assigned_admin_name: selectedAdmin.full_name,
        })
        .eq("id", assignment.id);

      if (error) {
        console.error(error);
        setSaving(false);
        alert("Failed to update assignment.");
        return;
      }
    } else {
      const { error } = await supabase.from("lead_assignments").insert({
        lead_type: leadType,
        lead_id: leadId,
        assigned_admin_id: selectedAdmin.id,
        assigned_admin_name: selectedAdmin.full_name,
      });

      if (error) {
        console.error(error);
        setSaving(false);
        alert("Failed to assign lead.");
        return;
      }
    }

    await supabase.from("activity_logs").insert({
      admin_id: currentAdmin?.id || null,
      admin_name: currentAdmin?.full_name || "Unknown Admin",
      action: "Assigned lead",
      target_type: leadType,
      target_id: leadId,
      details: `Assigned ${leadType} to ${selectedAdmin.full_name}.`,
    });

    setSaving(false);
    await fetchAssignment();
    onAssigned();

    alert("Lead assigned successfully.");
  };

  return (
    <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]">
            Lead Ownership
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            Assignment Control
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Assign this student to a counselor, staff member, or admin.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-gray-300">
          {loading
            ? "Loading..."
            : assignment?.assigned_admin_name
            ? `Assigned: ${assignment.assigned_admin_name}`
            : "Unassigned"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={selectedAdminId}
          onChange={(event) => setSelectedAdminId(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
        >
          <option value="" className="bg-[#111] text-white">
            Select staff/admin
          </option>

          {admins.map((admin) => (
            <option key={admin.id} value={admin.id} className="bg-[#111]">
              {admin.full_name} — {admin.role}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={assignLead}
          disabled={saving}
          className="rounded-2xl bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Assigning..." : "Assign Lead"}
        </button>
      </div>
    </div>
  );
}

export default LeadAssignmentPanel;