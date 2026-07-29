// MyLeadsPanel V4 — Identity-Based Assigned Work Queue
// src/components/admin/MyLeadsPanel.jsx
//
// Maximum pass:
// - preserves lead_assignments / inquiries / appointments Supabase contracts
// - one Auth UUID = one personal queue across Admin + Counselor access
// - safer timeout cleanup and stale-request protection
// - parallel inquiry + appointment hydration for faster loading
// - partial-fetch warnings instead of silently hiding one broken lead type
// - tighter realtime subscription for this admin's assignment rows
// - memoized filtering / sorting / operational metrics
// - search + type + priority + workload-status filters
// - stale/new/pending/urgent workload intelligence
// - quick email / call / WhatsApp / copy contact actions
// - better date handling and schedule intelligence
// - reduced-motion support
// - explicit Admin OS cream/orange/navy contrast
// - no schema changes and no fake AI

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  Copy,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 8000;
const REALTIME_DEBOUNCE_MS = 350;

function withTimeout(promise, label = "Request") {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(`${label} timed out.`)),
      REQUEST_TIMEOUT_MS
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
  });
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ageInDays(value) {
  const date = safeDate(value);
  if (!date) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000)
  );
}

function normalizePhone(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");
}

function toWhatsAppNumber(value = "") {
  const digits = normalizePhone(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

async function copyText(value) {
  if (!value) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(value));
      return true;
    }
  } catch {
    // Fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = String(value);
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function getLeadStatus(lead = {}) {
  return normalize(
    lead.status ||
      lead.pipeline_stage ||
      lead.appointment_stage ||
      (lead.leadType === "appointment" ? "pending" : "new")
  );
}

function getLeadPriority(lead = {}) {
  const priority = normalize(lead.priority || "low");
  return ["vip", "high", "medium", "low"].includes(priority)
    ? priority
    : "low";
}

function getLeadName(lead = {}) {
  return lead.full_name || lead.name || "Unnamed Student";
}

function getLeadMainDetail(lead = {}) {
  if (lead.leadType === "appointment") {
    return (
      lead.country_interest ||
      lead.consultation_type ||
      "Appointment lead"
    );
  }

  return (
    lead.country ||
    lead.field_of_interest ||
    "Inquiry lead"
  );
}

function getLeadSchedule(lead = {}) {
  if (lead.leadType === "appointment") {
    const parts = [];

    if (lead.appointment_date) {
      const date = safeDate(lead.appointment_date);

      parts.push(
        date
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(date)
          : String(lead.appointment_date)
      );
    }

    if (lead.appointment_time) parts.push(lead.appointment_time);

    return parts.length
      ? parts.join(" · ")
      : lead.consultation_type || "No appointment time";
  }

  return (
    lead.preferred_date ||
    lead.time_slot ||
    "No preferred time"
  );
}

function getWorkloadSignal(lead = {}) {
  const status = getLeadStatus(lead);
  const priority = getLeadPriority(lead);
  const ageDays = ageInDays(lead.created_at);

  if (["vip", "high"].includes(priority)) {
    return {
      key: "urgent",
      label: priority === "vip" ? "VIP Priority" : "High Priority",
      tone: "border-red-300 bg-red-50 text-red-700",
    };
  }

  if (
    ageDays >= 3 &&
    ["new", "pending", "new_booking"].includes(status)
  ) {
    return {
      key: "stale",
      label: `${ageDays}d Unworked`,
      tone: "border-amber-300 bg-amber-50 text-amber-800",
    };
  }

  if (
    ["completed", "converted", "approved", "confirmed"].includes(status)
  ) {
    return {
      key: "progressed",
      label: "Progressed",
      tone: "border-emerald-300 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    key: "active",
    label: "Active",
    tone: "border-orange-300 bg-orange-50 text-orange-700",
  };
}

function MyLeadsPanel({
  cardClass = "",
  adminProfile = null,
}) {
  const reduceMotion = useReducedMotion();

  const [assignments, setAssignments] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loadWarning, setLoadWarning] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [workFilter, setWorkFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  const mountedRef = useRef(true);
  const requestRef = useRef(0);
  const copyTimerRef = useRef(null);

  const adminId = adminProfile?.id;

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchMyLeads = async ({ silent = false } = {}) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!adminId) {
      safeSetState(() => {
        setAssignments([]);
        setInquiries([]);
        setAppointments([]);
        setLoading(false);
        setLoadError(
          "Admin profile not loaded yet. Refresh after login completes."
        );
        setLoadWarning("");
      });
      return;
    }

    safeSetState(() => {
      setLoadError("");
      setLoadWarning("");
      if (!silent) setLoading(true);
    });

    try {
      const { data: assignmentData, error: assignmentError } =
        await withTimeout(
          supabase
            .from("lead_assignments")
            .select("*")
            .or(
              `assigned_user_id.eq.${adminId},assigned_admin_id.eq.${adminId}`
            )
            .order("created_at", { ascending: false }),
          "My leads assignment fetch"
        );

      if (requestRef.current !== requestId) return;

      if (assignmentError) throw assignmentError;

      const safeAssignments = cleanDuplicateAssignments(
        assignmentData || []
      );

      const inquiryIds = [
        ...new Set(
          safeAssignments
            .filter(
              (item) => normalize(item.lead_type) === "inquiry"
            )
            .map((item) => String(item.lead_id))
            .filter(Boolean)
        ),
      ];

      const appointmentIds = [
        ...new Set(
          safeAssignments
            .filter(
              (item) => normalize(item.lead_type) === "appointment"
            )
            .map((item) => String(item.lead_id))
            .filter(Boolean)
        ),
      ];

      const inquiryPromise = inquiryIds.length
        ? withTimeout(
            supabase
              .from("inquiries")
              .select("*")
              .in("id", inquiryIds)
              .order("created_at", { ascending: false }),
            "My leads inquiries fetch"
          )
        : Promise.resolve({ data: [], error: null });

      const appointmentPromise = appointmentIds.length
        ? withTimeout(
            supabase
              .from("appointments")
              .select("*")
              .in("id", appointmentIds)
              .order("created_at", { ascending: false }),
            "My leads appointments fetch"
          )
        : Promise.resolve({ data: [], error: null });

      const [inquiryResult, appointmentResult] =
        await Promise.allSettled([
          inquiryPromise,
          appointmentPromise,
        ]);

      if (requestRef.current !== requestId) return;

      let nextInquiries = [];
      let nextAppointments = [];
      const warnings = [];

      if (inquiryResult.status === "fulfilled") {
        if (inquiryResult.value.error) {
          console.error(
            "My leads inquiries error:",
            inquiryResult.value.error
          );
          warnings.push("Assigned inquiries could not be loaded.");
        } else {
          nextInquiries = addAssignmentMeta(
            inquiryResult.value.data || [],
            safeAssignments,
            "inquiry"
          );
        }
      } else {
        console.error(
          "My leads inquiries fetch crashed:",
          inquiryResult.reason
        );
        warnings.push("Assigned inquiries timed out.");
      }

      if (appointmentResult.status === "fulfilled") {
        if (appointmentResult.value.error) {
          console.error(
            "My leads appointments error:",
            appointmentResult.value.error
          );
          warnings.push("Assigned appointments could not be loaded.");
        } else {
          nextAppointments = addAssignmentMeta(
            appointmentResult.value.data || [],
            safeAssignments,
            "appointment"
          );
        }
      } else {
        console.error(
          "My leads appointments fetch crashed:",
          appointmentResult.reason
        );
        warnings.push("Assigned appointments timed out.");
      }

      safeSetState(() => {
        setAssignments(safeAssignments);
        setInquiries(nextInquiries);
        setAppointments(nextAppointments);
        setLastSyncedAt(new Date());
        setLoadError("");
        setLoadWarning(warnings.join(" "));
      });
    } catch (error) {
      if (requestRef.current !== requestId) return;

      console.error("My leads crash:", error);

      safeSetState(() => {
        setLoadError(
          error?.message ||
            "My Leads request failed. Check your internet and retry."
        );
      });
    } finally {
      if (requestRef.current === requestId) {
        safeSetState(() => setLoading(false));
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchMyLeads();

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
      window.clearTimeout(copyTimerRef.current);
    };
  }, [adminId]);

  useEffect(() => {
    if (!adminId) return undefined;

    let refreshTimeout;

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimeout);

      refreshTimeout = window.setTimeout(() => {
        fetchMyLeads({ silent: true });
      }, REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`my-leads-${adminId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_assignments",
        },
        (payload) => {
          const ownerId = String(
            payload.new?.assigned_user_id ||
              payload.new?.assigned_admin_id ||
              payload.old?.assigned_user_id ||
              payload.old?.assigned_admin_id ||
              ""
          );

          if (ownerId === String(adminId)) {
            scheduleRefresh();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inquiries",
        },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [adminId]);

  const allLeads = useMemo(
    () => [
      ...inquiries.map((item) => ({
        ...item,
        leadType: "inquiry",
      })),
      ...appointments.map((item) => ({
        ...item,
        leadType: "appointment",
      })),
    ],
    [inquiries, appointments]
  );

  const metrics = useMemo(() => {
    const vip = allLeads.filter(
      (lead) => getLeadPriority(lead) === "vip"
    ).length;

    const high = allLeads.filter(
      (lead) => getLeadPriority(lead) === "high"
    ).length;

    const stale = allLeads.filter(
      (lead) => getWorkloadSignal(lead).key === "stale"
    ).length;

    const progressed = allLeads.filter(
      (lead) => getWorkloadSignal(lead).key === "progressed"
    ).length;

    const pendingAppointments = appointments.filter((appointment) =>
      ["pending", "new_booking"].includes(
        normalize(
          appointment.status ||
            appointment.appointment_stage ||
            "pending"
        )
      )
    ).length;

    const firstContactNeeded = inquiries.filter((inquiry) =>
      ["", "new", "pending"].includes(
        normalize(inquiry.status || "new")
      )
    ).length;

    return {
      vip,
      high,
      urgent: vip + high,
      stale,
      progressed,
      pendingAppointments,
      firstContactNeeded,
    };
  }, [allLeads, inquiries, appointments]);

  const filteredLeads = useMemo(() => {
    const searchText = normalize(search);

    return allLeads
      .filter((lead) => {
        if (
          activeView !== "all" &&
          lead.leadType !== activeView
        ) {
          return false;
        }

        if (
          priorityFilter !== "all" &&
          getLeadPriority(lead) !== priorityFilter
        ) {
          return false;
        }

        const signal = getWorkloadSignal(lead);

        if (
          workFilter !== "all" &&
          signal.key !== workFilter
        ) {
          return false;
        }

        if (!searchText) return true;

        return [
          getLeadName(lead),
          lead.email,
          lead.phone,
          lead.country,
          lead.country_interest,
          lead.field_of_interest,
          lead.consultation_type,
          lead.status,
          lead.pipeline_stage,
          lead.appointment_stage,
        ]
          .map(normalize)
          .some((value) => value.includes(searchText));
      })
      .sort((a, b) => {
        const priorityWeight = {
          vip: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        const priorityDifference =
          (priorityWeight[getLeadPriority(b)] || 0) -
          (priorityWeight[getLeadPriority(a)] || 0);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          (safeDate(b.created_at)?.getTime() || 0) -
          (safeDate(a.created_at)?.getTime() || 0)
        );
      });
  }, [
    allLeads,
    activeView,
    priorityFilter,
    workFilter,
    search,
  ]);

  const clearFilters = () => {
    setActiveView("all");
    setPriorityFilter("all");
    setWorkFilter("all");
    setSearch("");
  };

  const handleCopy = async (key, value) => {
    const copied = await copyText(value);

    if (!copied) return;

    setCopiedKey(key);
    window.clearTimeout(copyTimerRef.current);

    copyTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopiedKey("");
    }, 1400);
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-6 text-[#10233f]"
    >
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
        <div className="grid xl:grid-cols-[1.3fr_0.7fr]">
          <div
            className="bg-[#123865] p-5 sm:p-7"
            style={{ color: "#FFFFFF" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Users
                size={13}
                style={{ color: "#FDBA74" }}
              />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Assigned Work
              </p>
            </div>

            <h2
              className="mt-3 text-3xl font-black"
              style={{ color: "#FFFFFF" }}
            >
              My Leads
            </h2>

            <p
              className="mt-3 max-w-3xl text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Personal operating queue for inquiries and appointments owned by your
              Zaifan identity, regardless of whether you enter through Admin or Counselor access.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em]"
                style={{ color: "#FFFFFF" }}
              >
                {adminProfile?.full_name ||
                  adminProfile?.email ||
                  "Current Admin"}
              </span>

              {lastSyncedAt ? (
                <span
                  className="rounded-full border-2 border-orange-300 bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em]"
                  style={{ color: "#FFFFFF" }}
                >
                  Synced {formatTime(lastSyncedAt)}
                </span>
              ) : null}
            </div>
          </div>

          <div
            className="bg-orange-500 p-5 sm:p-7"
            style={{ color: "#FFFFFF" }}
          >
            <div className="flex items-center gap-2">
              <Target size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Work Queue
              </p>
            </div>

            <p className="mt-3 text-4xl font-black text-white">
              {filteredLeads.length}
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
              Visible Leads
            </p>

            <button
              type="button"
              onClick={() => fetchMyLeads()}
              disabled={loading}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-white text-sm font-black text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Refreshing..." : "Refresh Queue"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Assigned"
          value={assignments.length}
          icon={Target}
          tone="navy"
        />
        <StatCard
          label="Inquiries"
          value={inquiries.length}
          icon={Mail}
        />
        <StatCard
          label="Appointments"
          value={appointments.length}
          icon={CalendarClock}
        />
        <StatCard
          label="Urgent"
          value={metrics.urgent}
          icon={Flame}
          tone="danger"
        />
        <StatCard
          label="Stale"
          value={metrics.stale}
          icon={AlertTriangle}
          tone={metrics.stale ? "warning" : "good"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalCard
          label="First Contact Needed"
          value={metrics.firstContactNeeded}
          helper="New inquiry records still needing first human contact."
          icon={MessageCircle}
          tone={
            metrics.firstContactNeeded > 0
              ? "warning"
              : "good"
          }
        />

        <OperationalCard
          label="Pending Appointments"
          value={metrics.pendingAppointments}
          helper="Bookings that still need confirmation or progression."
          icon={CalendarClock}
          tone={
            metrics.pendingAppointments > 0
              ? "orange"
              : "good"
          }
        />

        <OperationalCard
          label="Progressed"
          value={metrics.progressed}
          helper="Assigned records already confirmed, converted, approved, or completed."
          icon={CheckCircle2}
          tone="good"
        />

        <OperationalCard
          label="Priority Mix"
          value={`${metrics.vip} VIP · ${metrics.high} High`}
          helper="Highest-value workload currently owned by this person."
          icon={ShieldCheck}
          tone="navy"
        />
      </div>

      <section
        className={`${cardClass} rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)]`}
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, email, phone, country, service, status..."
              className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <select
            value={activeView}
            onChange={(event) =>
              setActiveView(event.target.value)
            }
            className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All Leads</option>
            <option value="inquiry">Inquiries</option>
            <option value="appointment">Appointments</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
            className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All Priorities</option>
            <option value="vip">VIP</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={workFilter}
            onChange={(event) =>
              setWorkFilter(event.target.value)
            }
            className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All Workload</option>
            <option value="urgent">Urgent</option>
            <option value="stale">Stale</option>
            <option value="active">Active</option>
            <option value="progressed">Progressed</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500">
            Showing {filteredLeads.length} of {allLeads.length} hydrated assigned lead
            {allLeads.length === 1 ? "" : "s"}.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
          >
            <X size={13} />
            Clear Filters
          </button>
        </div>
      </section>

      {loadWarning ? (
        <div className="rounded-[1.4rem] border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="font-black text-[#10233f]">
                Partial lead data loaded
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">
                {loadWarning}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div
          className={`${cardClass} rounded-[1.5rem] border-[3px] border-red-300 bg-red-50 p-5`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="font-black text-red-900">
                  My Leads could not load
                </p>
                <p className="mt-1 text-sm font-semibold text-red-700">
                  {loadError}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchMyLeads()}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white transition hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <LoadingState cardClass={cardClass} />
      ) : assignments.length === 0 ? (
        <EmptyState cardClass={cardClass} />
      ) : filteredLeads.length === 0 ? (
        <div
          className={`${cardClass} rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,35,63,0.04)]`}
        >
          <Search className="mx-auto h-9 w-9 text-orange-600" />

          <h3 className="mt-4 text-2xl font-black text-[#10233f]">
            No matching leads
          </h3>

          <p className="mt-3 text-sm font-semibold text-slate-600">
            Try changing your search, type, priority, or workload filter.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-600"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredLeads.map((lead, index) => (
            <LeadCard
              key={`${lead.leadType}-${lead.id}`}
              lead={lead}
              index={index}
              reduceMotion={reduceMotion}
              copiedKey={copiedKey}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {assignments.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <MiniSummary
            title="Follow-up Focus"
            icon={Target}
            text={`${metrics.firstContactNeeded} inquiries still need first contact.`}
            tone={
              metrics.firstContactNeeded > 0
                ? "warning"
                : "good"
            }
          />

          <MiniSummary
            title="Appointment Focus"
            icon={CalendarClock}
            text={`${metrics.pendingAppointments} appointments are waiting for confirmation or progression.`}
            tone={
              metrics.pendingAppointments > 0
                ? "orange"
                : "good"
            }
          />
        </div>
      ) : null}
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const surface =
    tone === "danger"
      ? "border-red-300 bg-red-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-300 bg-orange-50";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${surface}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={19}
          style={{ color: dark ? "#FDBA74" : "#C2410C" }}
        />
      </div>
    </div>
  );
}

function OperationalCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const surface =
    tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-300 bg-orange-50";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${surface}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-2xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{ color: dark ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function LeadCard({
  lead,
  index,
  reduceMotion,
  copiedKey,
  onCopy,
}) {
  const isAppointment = lead.leadType === "appointment";
  const priority = getLeadPriority(lead);
  const status = getLeadStatus(lead);
  const signal = getWorkloadSignal(lead);

  const priorityStyles = {
    vip: "border-orange-300 bg-orange-50 text-orange-800",
    high: "border-red-300 bg-red-50 text-red-700",
    medium: "border-orange-300 bg-orange-50 text-orange-700",
    low: "border-slate-300 bg-slate-50 text-slate-600",
  };

  const typeStyle = isAppointment
    ? "border-blue-300 bg-blue-50 text-blue-700"
    : "border-orange-300 bg-orange-50 text-orange-700";

  const phone = normalizePhone(
    lead.phone || lead.phone_number || lead.whatsapp
  );

  const whatsapp = toWhatsAppNumber(phone);
  const emailLink = lead.email ? `mailto:${lead.email}` : "";
  const phoneLink = phone ? `tel:${phone}` : "";
  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp}`
    : "";

  const cardKey = `${lead.leadType}-${lead.id}`;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : index * 0.025,
      }}
      className="rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_7px_20px_rgba(15,35,63,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${typeStyle}`}
            >
              {lead.leadType}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                priorityStyles[priority] || priorityStyles.low
              }`}
            >
              {priority}
            </span>

            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
              {status.replaceAll("_", " ")}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${signal.tone}`}
            >
              {signal.label}
            </span>
          </div>

          <h4 className="truncate text-lg font-black text-[#10233f]">
            {getLeadName(lead)}
          </h4>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            {getLeadMainDetail(lead)}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
          {isAppointment ? (
            <CalendarClock size={21} />
          ) : priority === "vip" ? (
            <Flame size={21} />
          ) : (
            <Mail size={21} />
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <InfoLine
          label="Email"
          value={lead.email || "No email"}
          copyKey={`${cardKey}-email`}
          copiedKey={copiedKey}
          onCopy={
            lead.email
              ? () =>
                  onCopy(
                    `${cardKey}-email`,
                    lead.email
                  )
              : null
          }
        />

        <InfoLine
          label="Phone"
          value={lead.phone || "No phone"}
          copyKey={`${cardKey}-phone`}
          copiedKey={copiedKey}
          onCopy={
            lead.phone
              ? () =>
                  onCopy(
                    `${cardKey}-phone`,
                    lead.phone
                  )
              : null
          }
        />

        <InfoLine
          label="Schedule"
          value={getLeadSchedule(lead)}
        />

        <InfoLine
          label="Assigned"
          value={formatDate(lead.assigned_at)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <QuickAction
          label="Email"
          icon={Mail}
          href={emailLink}
          disabled={!emailLink}
        />

        <QuickAction
          label="Call"
          icon={Phone}
          href={phoneLink}
          disabled={!phoneLink}
        />

        <QuickAction
          label="WhatsApp"
          icon={MessageCircle}
          href={whatsappLink}
          disabled={!whatsappLink}
          external
          primary
        />

        {lead.email ? (
          <button
            type="button"
            onClick={() =>
              onCopy(
                `${cardKey}-email`,
                lead.email
              )
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
          >
            {copiedKey === `${cardKey}-email` ? (
              <CheckCircle2 size={13} />
            ) : (
              <Clipboard size={13} />
            )}
            {copiedKey === `${cardKey}-email`
              ? "Copied"
              : "Copy Email"}
          </button>
        ) : null}
      </div>

      {lead.message ? (
        <div className="mt-4 rounded-xl border-2 border-slate-300 bg-[#fffaf2] p-4">
          <p className="line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
            {lead.message}
          </p>
        </div>
      ) : null}
    </motion.article>
  );
}

function QuickAction({
  label,
  icon: Icon,
  href,
  disabled = false,
  external = false,
  primary = false,
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-10 cursor-not-allowed items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-400">
        <Icon size={13} />
        {label}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border-2 px-3 text-xs font-black transition ${
        primary
          ? "border-orange-600 bg-orange-500 text-white hover:bg-orange-600"
          : "border-slate-300 bg-white text-[#10233f] hover:border-orange-300 hover:bg-orange-50"
      }`}
    >
      <Icon size={13} />
      {label}
    </a>
  );
}

function InfoLine({
  label,
  value,
  copyKey,
  copiedKey,
  onCopy = null,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-slate-300 bg-[#fffaf2] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>

        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 text-[9px] font-black text-orange-700"
          >
            {copiedKey === copyKey ? (
              <CheckCircle2 size={10} />
            ) : (
              <Copy size={10} />
            )}
            {copiedKey === copyKey ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>

      <p
        className="mt-1 truncate text-xs font-semibold text-slate-700"
        title={String(value || "")}
      >
        {value}
      </p>
    </div>
  );
}

function MiniSummary({
  title,
  icon: Icon,
  text,
  tone = "orange",
}) {
  const surface =
    tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : "border-orange-300 bg-orange-50";

  return (
    <div className={`rounded-[1.5rem] border-[3px] p-5 ${surface}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white text-orange-700">
          <Icon size={18} />
        </div>

        <div>
          <h3 className="text-lg font-black text-[#10233f]">
            {title}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ cardClass }) {
  return (
    <div
      className={`${cardClass} rounded-[1.5rem] border-[3px] border-slate-300 bg-white p-6`}
    >
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-600" />
        Loading assigned leads...
      </div>
    </div>
  );
}

function EmptyState({ cardClass }) {
  return (
    <div
      className={`${cardClass} rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,35,63,0.04)]`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <UserRoundCheck size={28} />
      </div>

      <h3 className="mt-5 text-2xl font-black text-[#10233f]">
        No Assigned Leads Yet
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-600">
        Once lead ownership is assigned to your Zaifan account, the records will
        appear here as your personal follow-up queue.
      </p>
    </div>
  );
}

function cleanDuplicateAssignments(rows = []) {
  const seen = new Set();
  const cleanRows = [];

  for (const row of safeArray(rows)) {
    const leadType = normalize(row.lead_type);
    const leadId = String(row.lead_id || "");

    if (!leadType || !leadId) continue;

    const key = `${leadType}-${leadId}`;

    if (!seen.has(key)) {
      seen.add(key);
      cleanRows.push(row);
    }
  }

  return cleanRows;
}

function addAssignmentMeta(
  rows = [],
  assignments = [],
  leadType
) {
  const assignmentMap = new Map(
    safeArray(assignments)
      .filter(
        (item) => normalize(item.lead_type) === leadType
      )
      .map((item) => [
        String(item.lead_id),
        item,
      ])
  );

  return safeArray(rows).map((row) => {
    const assignment = assignmentMap.get(
      String(row.id)
    );

    return {
      ...row,
      assigned_user_id:
        assignment?.assigned_user_id ||
        assignment?.assigned_admin_id ||
        null,
      assigned_user_name:
        assignment?.assigned_user_name ||
        assignment?.assigned_admin_name ||
        null,
      assigned_user_role:
        assignment?.assigned_user_role || null,
      assigned_admin_id:
        assignment?.assigned_admin_id || null,
      assigned_admin_name:
        assignment?.assigned_admin_name ||
        assignment?.assigned_user_name ||
        null,
      assigned_at:
        assignment?.created_at || null,
    };
  });
}

function formatDate(date) {
  const parsed = safeDate(date);

  if (!parsed) return "No date";

  return parsed.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(date) {
  const parsed = safeDate(date);

  if (!parsed) return "Never";

  return parsed.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default MyLeadsPanel;
