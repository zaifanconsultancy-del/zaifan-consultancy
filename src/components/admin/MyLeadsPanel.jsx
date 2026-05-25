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

function MyLeadsPanel({ cardClass = "", adminProfile = null }) {
  const [assignments, setAssignments] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const mountedRef = useRef(true);
  const adminId = adminProfile?.id;

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchMyLeads = async ({ silent = false } = {}) => {
    if (!adminId) {
      safeSetState(() => {
        setAssignments([]);
        setInquiries([]);
        setAppointments([]);
        setLoading(false);
        setLoadError("Admin profile not loaded yet. Refresh after login completes.");
      });
      return;
    }

    safeSetState(() => {
      setLoadError("");
      if (!silent) setLoading(true);
    });

    try {
      const { data: assignmentData, error: assignmentError } = await withTimeout(
        supabase
          .from("lead_assignments")
          .select("*")
          .eq("assigned_admin_id", adminId)
          .order("created_at", { ascending: false }),
        "My leads assignment fetch"
      );

      if (assignmentError) {
        console.error("My leads assignment error:", assignmentError);
        safeSetState(() => {
          setLoadError("Failed to load assigned leads.");
          setAssignments([]);
          setInquiries([]);
          setAppointments([]);
        });
        return;
      }

      const safeAssignments = cleanDuplicateAssignments(assignmentData || []);

      const inquiryIds = [
        ...new Set(
          safeAssignments
            .filter((item) => item.lead_type === "inquiry")
            .map((item) => String(item.lead_id))
        ),
      ];

      const appointmentIds = [
        ...new Set(
          safeAssignments
            .filter((item) => item.lead_type === "appointment")
            .map((item) => String(item.lead_id))
        ),
      ];

      let nextInquiries = [];
      let nextAppointments = [];

      if (inquiryIds.length > 0) {
        const { data, error } = await withTimeout(
          supabase
            .from("inquiries")
            .select("*")
            .in("id", inquiryIds)
            .order("created_at", { ascending: false }),
          "My leads inquiries fetch"
        );

        if (error) {
          console.error("My leads inquiries error:", error);
          nextInquiries = [];
        } else {
          nextInquiries = addAssignmentMeta(data || [], safeAssignments, "inquiry");
        }
      }

      if (appointmentIds.length > 0) {
        const { data, error } = await withTimeout(
          supabase
            .from("appointments")
            .select("*")
            .in("id", appointmentIds)
            .order("created_at", { ascending: false }),
          "My leads appointments fetch"
        );

        if (error) {
          console.error("My leads appointments error:", error);
          nextAppointments = [];
        } else {
          nextAppointments = addAssignmentMeta(
            data || [],
            safeAssignments,
            "appointment"
          );
        }
      }

      safeSetState(() => {
        setAssignments(safeAssignments);
        setInquiries(nextInquiries);
        setAppointments(nextAppointments);
        setLastSyncedAt(new Date());
        setLoadError("");
      });
    } catch (error) {
      console.error("My leads crash:", error);
      safeSetState(() => {
        setLoadError("My Leads request timed out. Check your internet and retry.");
      });
    } finally {
      safeSetState(() => setLoading(false));
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchMyLeads();

    return () => {
      mountedRef.current = false;
    };
  }, [adminId]);

  useEffect(() => {
    if (!adminId) return;

    let refreshTimeout;

    const scheduleRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchMyLeads({ silent: true });
      }, 350);
    };

    const channel = supabase
      .channel(`my-leads-${adminId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lead_assignments" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [adminId]);

  const allLeads = useMemo(
    () => [
      ...inquiries.map((item) => ({ ...item, leadType: "inquiry" })),
      ...appointments.map((item) => ({ ...item, leadType: "appointment" })),
    ],
    [inquiries, appointments]
  );

  const filteredLeads = allLeads
    .filter((lead) => {
      if (activeView !== "all" && lead.leadType !== activeView) return false;

      if (priorityFilter !== "all") {
        const priority = lead.priority || "low";
        if (priority !== priorityFilter) return false;
      }

      const searchText = search.trim().toLowerCase();
      if (!searchText) return true;

      return (
        lead.full_name?.toLowerCase().includes(searchText) ||
        lead.email?.toLowerCase().includes(searchText) ||
        lead.phone?.toLowerCase().includes(searchText) ||
        lead.country?.toLowerCase().includes(searchText) ||
        lead.country_interest?.toLowerCase().includes(searchText) ||
        lead.field_of_interest?.toLowerCase().includes(searchText) ||
        lead.consultation_type?.toLowerCase().includes(searchText)
      );
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const vipCount = allLeads.filter((lead) => lead.priority === "vip").length;
  const highCount = allLeads.filter((lead) => lead.priority === "high").length;
  const urgentCount = vipCount + highCount;

  const pendingAppointments = appointments.filter(
    (appointment) => (appointment.status || "pending") === "pending"
  ).length;

  const contactedInquiries = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;

  const clearFilters = () => {
    setActiveView("all");
    setPriorityFilter("all");
    setSearch("");
  };

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-5 sm:p-7`}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
              Assigned Work
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">My Leads</h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              A focused workspace for the inquiries and appointments assigned to
              your admin profile.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                {adminProfile?.full_name || "Current Admin"}
              </span>

              {lastSyncedAt && (
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Synced {formatTime(lastSyncedAt)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchMyLeads()}
            disabled={loading}
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Assigned" value={assignments.length} icon="📌" />
        <StatCard label="Inquiries" value={inquiries.length} icon="📨" />
        <StatCard label="Appointments" value={appointments.length} icon="📅" />
        <StatCard label="Urgent" value={urgentCount} icon="🔥" tone="danger" />
        <StatCard label="Pending" value={pendingAppointments} icon="⏳" tone="orange" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className={`${cardClass} p-4`}>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search my leads by name, email, country, service..."
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
            />

            <select
              value={activeView}
              onChange={(event) => setActiveView(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="all" className="bg-[#111]">
                All Leads
              </option>
              <option value="inquiry" className="bg-[#111]">
                Inquiries
              </option>
              <option value="appointment" className="bg-[#111]">
                Appointments
              </option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
            >
              <option value="all" className="bg-[#111]">
                All Priorities
              </option>
              <option value="vip" className="bg-[#111]">
                VIP
              </option>
              <option value="high" className="bg-[#111]">
                High
              </option>
              <option value="medium" className="bg-[#111]">
                Medium
              </option>
              <option value="low" className="bg-[#111]">
                Low
              </option>
            </select>
          </div>
        </div>

        <button
          onClick={clearFilters}
          className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white"
        >
          Clear Filters
        </button>
      </div>

      {loadError && (
        <div className={`${cardClass} p-6 text-sm text-red-200`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => fetchMyLeads()}
              className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#E7C768]"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState cardClass={cardClass} />
      ) : assignments.length === 0 ? (
        <EmptyState cardClass={cardClass} />
      ) : filteredLeads.length === 0 ? (
        <div className={`${cardClass} p-8 text-center`}>
          <h3 className="text-2xl font-black text-white">No matching leads</h3>
          <p className="mt-3 text-sm text-gray-400">
            Try changing your search or filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-5 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-[#E7C768]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredLeads.map((lead, index) => (
            <LeadCard key={`${lead.leadType}-${lead.id}`} lead={lead} index={index} />
          ))}
        </div>
      )}

      {assignments.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <MiniSummary
            title="Follow-up Focus"
            icon="🎯"
            text={`${inquiries.length - contactedInquiries} inquiries still need first contact.`}
          />
          <MiniSummary
            title="Appointment Focus"
            icon="📅"
            text={`${pendingAppointments} appointments are waiting for confirmation.`}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, tone = "gold" }) {
  const toneClass = {
    gold: "text-[#D4AF37]",
    danger: "text-red-300",
    orange: "text-orange-300",
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
            {label}
          </p>

          <h3 className={`mt-3 text-3xl font-black ${toneClass}`}>{value}</h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function LeadCard({ lead, index }) {
  const isAppointment = lead.leadType === "appointment";
  const priority = lead.priority || "low";
  const status = lead.status || (isAppointment ? "pending" : "new");

  const priorityStyles = {
    vip: "border-purple-400/30 bg-purple-500/10 text-purple-300",
    high: "border-red-400/30 bg-red-500/10 text-red-300",
    medium: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    low: "border-white/10 bg-white/[0.04] text-gray-400",
  };

  const typeStyle = isAppointment
    ? "border-green-400/20 bg-green-400/10 text-green-300"
    : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  const mainDetail = isAppointment
    ? lead.country_interest || lead.consultation_type || "Appointment lead"
    : lead.country || lead.field_of_interest || "Inquiry lead";

  const schedule = isAppointment
    ? lead.appointment_date && lead.appointment_time
      ? `${lead.appointment_date} · ${lead.appointment_time}`
      : lead.consultation_type || "No appointment time"
    : lead.preferred_date || lead.time_slot || "No preferred time";

  return (
    <div
      className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:bg-white/[0.055]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${typeStyle}`}
            >
              {lead.leadType}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                priorityStyles[priority] || priorityStyles.low
              }`}
            >
              {priority}
            </span>
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              {status}
            </span>
          </div>

          <h4 className="truncate text-lg font-black text-white">
            {lead.full_name || "Unnamed Student"}
          </h4>

          <p className="mt-1 text-sm text-gray-400">{mainDetail}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-2xl">
          {isAppointment ? "📅" : priority === "vip" ? "👑" : "📨"}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
        <InfoLine label="Email" value={lead.email || "No email"} />
        <InfoLine label="Phone" value={lead.phone || "No phone"} />
        <InfoLine label="Schedule" value={schedule} />
        <InfoLine label="Assigned" value={formatDate(lead.assigned_at)} />
      </div>

      {lead.message && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="line-clamp-3 text-sm leading-relaxed text-gray-400">
            {lead.message}
          </p>
        </div>
      )}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-gray-300">{value}</p>
    </div>
  );
}

function MiniSummary({ title, icon, text }) {
  return (
    <div className="rounded-[1.5rem] border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-5 backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-2xl">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ cardClass }) {
  return (
    <div className={`${cardClass} p-6 text-sm text-gray-400`}>
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
        Loading assigned leads...
      </div>
    </div>
  );
}

function EmptyState({ cardClass }) {
  return (
    <div className={`${cardClass} p-8 text-center`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl">
        ✨
      </div>

      <h3 className="mt-5 text-2xl font-black text-white">
        No Assigned Leads Yet
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400">
        Once leads are assigned to you, they will appear here as your personal
        follow-up workspace.
      </p>
    </div>
  );
}

function cleanDuplicateAssignments(rows = []) {
  const seen = new Set();
  const cleanRows = [];

  for (const row of rows) {
    const key = `${row.lead_type}-${row.lead_id}`;

    if (!seen.has(key)) {
      seen.add(key);
      cleanRows.push(row);
    }
  }

  return cleanRows;
}

function addAssignmentMeta(rows = [], assignments = [], leadType) {
  return rows.map((row) => {
    const assignment = assignments.find(
      (item) =>
        item.lead_type === leadType && String(item.lead_id) === String(row.id)
    );

    return {
      ...row,
      assigned_admin_id: assignment?.assigned_admin_id || null,
      assigned_admin_name: assignment?.assigned_admin_name || null,
      assigned_at: assignment?.created_at || null,
    };
  });
}

function formatDate(date) {
  if (!date) return "No date";

  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(date) {
  if (!date) return "Never";

  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default MyLeadsPanel;
