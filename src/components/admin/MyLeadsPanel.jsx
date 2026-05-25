import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function MyLeadsPanel({ cardClass = "", adminProfile = null }) {
  const [assignments, setAssignments] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const adminId = adminProfile?.id;

  const fetchMyLeads = async () => {
    if (!adminId) return;

    setLoading(true);

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("lead_assignments")
        .select("*")
        .eq("assigned_admin_id", adminId)
        .order("created_at", { ascending: false });

      if (assignmentError) {
        console.error("My leads assignment error:", assignmentError);
        alert("Failed to load assigned leads.");
        return;
      }

      const safeAssignments = assignmentData || [];
      setAssignments(safeAssignments);

      const inquiryIds = [
        ...new Set(
          safeAssignments
            .filter((item) => item.lead_type === "inquiry")
            .map((item) => item.lead_id)
        ),
      ];

      const appointmentIds = [
        ...new Set(
          safeAssignments
            .filter((item) => item.lead_type === "appointment")
            .map((item) => item.lead_id)
        ),
      ];

      if (inquiryIds.length > 0) {
        const { data, error } = await supabase
          .from("inquiries")
          .select("*")
          .in("id", inquiryIds)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("My leads inquiries error:", error);
          setInquiries([]);
        } else {
          setInquiries(data || []);
        }
      } else {
        setInquiries([]);
      }

      if (appointmentIds.length > 0) {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .in("id", appointmentIds)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("My leads appointments error:", error);
          setAppointments([]);
        } else {
          setAppointments(data || []);
        }
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error("My leads crash:", error);
      alert("Something went wrong while loading My Leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, [adminId]);

  useEffect(() => {
    if (!adminId) return;

    const channel = supabase
      .channel(`my-leads-${adminId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_assignments" },
        () => {
          fetchMyLeads();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        () => {
          fetchMyLeads();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          fetchMyLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId]);

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-5 sm:p-7`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
              Assigned Work
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">My Leads</h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              View inquiries and appointments assigned to your admin profile.
            </p>
          </div>

          <button
            onClick={fetchMyLeads}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Assigned" value={assignments.length} icon="📌" />
        <StatCard label="Inquiries" value={inquiries.length} icon="📨" />
        <StatCard label="Appointments" value={appointments.length} icon="📅" />
      </div>

      {loading ? (
        <div className={`${cardClass} p-6 text-sm text-gray-400`}>
          Loading assigned leads...
        </div>
      ) : assignments.length === 0 ? (
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl">
            ✨
          </div>

          <h3 className="mt-5 text-2xl font-black text-white">
            No Assigned Leads Yet
          </h3>

          <p className="mt-3 text-sm text-gray-400">
            Once leads are assigned to you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <LeadColumn title="Assigned Inquiries" icon="📨" items={inquiries} />
          <LeadColumn
            title="Assigned Appointments"
            icon="📅"
            items={appointments}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
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

function LeadColumn({ title, icon, items }) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-black text-white">
          {icon} {title}
        </h3>

        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-gray-400">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-gray-500">
          Nothing assigned here.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.3rem] border border-white/10 bg-black/25 p-4 transition hover:border-[#D4AF37]/25"
            >
              <h4 className="text-base font-black text-white">
                {item.full_name || "Unnamed Student"}
              </h4>

              <p className="mt-2 break-words text-sm text-gray-400">
                {item.email || "No email"}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#D4AF37]">
                  {item.priority || "low"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-gray-400">
                  {item.status || "new"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyLeadsPanel;