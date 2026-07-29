// VisaRiskAnalyzer V4 MAXIMUM — Reliable Portfolio Command Center
// src/components/admin/VisaRiskAnalyzer.jsx
//
// Admin-wide Visa OS command center.
// Deterministic / rules-based only: this component does NOT call GPT.
//
// Maximum pass:
// - preserves student_visas + student_visa_requirements + student_applications architecture
// - adds stale-request protection and timeout cleanup
// - loads portfolio sources independently so one failed source does not blank the whole dashboard
// - exposes source-health rather than pretending every source is live
// - fixes status-normalization bugs ("offer_received" vs normalized "offer received")
// - application linkage is validated against student_id + student_type
// - separates "no checklist configured" from "requirements complete"
// - adds requirement due-date / rejection / expiry / review pressure
// - date-only deadlines remain valid through the end of that day
// - avoids duplicate requirement rows inflating risk
// - clearer risk model with transparent deterministic weights
// - adds search, risk filter and sort controls for larger portfolios
// - adds Critical / High / Medium / Low distribution
// - adds missing-checklist, no-next-action, overdue, upcoming appointment and refusal pressure
// - safer open-student payload includes visaId
// - keeps Zaifan Admin OS cream/orange/navy contrast and explicit white text on navy

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileWarning,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;
const MAX_PORTFOLIO_ROWS = 500;
const MAX_REQUIREMENT_ROWS = 2000;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const normalizeStudentType = (value) =>
  normalize(value) === "appointment" ? "appointment" : "inquiry";

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, safeNumber(value)));

const isTruthy = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  normalize(value) === "true" ||
  normalize(value) === "yes";

const formatDate = (value) => {
  if (!value) return "—";

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateOnlyTimestamp = (value, endOfDay = true) => {
  if (!value) return null;

  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T${endOfDay ? "23:59:59" : "00:00:00"}`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const daysFromNow = (value, endOfDay = true) => {
  const timestamp = dateOnlyTimestamp(value, endOfDay);
  if (timestamp === null) return null;

  return Math.ceil((timestamp - Date.now()) / 86400000);
};

const withTimeout = (
  promise,
  message = "Request timed out.",
  timeoutMs = REQUEST_TIMEOUT_MS
) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
};

const dedupeRows = (rows = []) => {
  const map = new Map();

  rows.forEach((row) => {
    const key =
      row?.id !== undefined && row?.id !== null
        ? String(row.id)
        : JSON.stringify(row);

    if (!map.has(key)) {
      map.set(key, row);
    }
  });

  return [...map.values()];
};

const requirementState = (value) => {
  const status = normalize(value);

  if (
    [
      "verified",
      "completed",
      "complete",
      "approved",
      "accepted",
      "ready",
    ].includes(status)
  ) {
    return "ready";
  }

  if (
    [
      "received",
      "under review",
      "review",
      "reviewing",
      "submitted",
      "uploaded",
      "pending review",
    ].includes(status)
  ) {
    return "review";
  }

  if (
    ["rejected", "declined", "invalid", "expired"].includes(status)
  ) {
    return "rejected";
  }

  return "missing";
};

const isOfferReadyApplication = (application = {}) => {
  const applicationStatus = normalize(application.application_status);
  const offerStatus = normalize(application.offer_status);

  return (
    [
      "offer received",
      "offer accepted",
      "accepted",
      "cas pending",
      "cas issued",
      "enrolled",
    ].includes(applicationStatus) ||
    [
      "offer received",
      "received",
      "conditional offer",
      "unconditional offer",
      "offer accepted",
      "accepted",
    ].includes(offerStatus)
  );
};

const riskLevelFromScore = (score) => {
  const value = clamp(score);

  if (value >= 75) return "Critical";
  if (value >= 55) return "High";
  if (value >= 30) return "Medium";
  return "Low";
};

function VisaRiskAnalyzer({
  onOpenStudent = null,
  limit = 12,
}) {
  const [visas, setVisas] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [applications, setApplications] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceHealth, setSourceHealth] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");

  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  const safeLimit = Math.max(1, Math.min(100, safeNumber(limit, 12)));

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  const load = async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setLoading(true);
    setError("");

    const sources = [
      {
        key: "visas",
        run: () =>
          supabase
            .from("student_visas")
            .select("*")
            .eq("is_archived", false)
            .order("updated_at", { ascending: false })
            .limit(MAX_PORTFOLIO_ROWS),
      },
      {
        key: "requirements",
        run: () =>
          supabase
            .from("student_visa_requirements")
            .select("*")
            .order("updated_at", { ascending: false })
            .limit(MAX_REQUIREMENT_ROWS),
      },
      {
        key: "applications",
        run: () =>
          supabase
            .from("student_applications")
            .select(
              "id, student_id, student_type, university, program, application_status, offer_status, visa_status, updated_at"
            )
            .limit(MAX_PORTFOLIO_ROWS),
      },
      {
        key: "inquiries",
        run: () =>
          supabase
            .from("inquiries")
            .select("*")
            .limit(MAX_PORTFOLIO_ROWS),
      },
      {
        key: "appointments",
        run: () =>
          supabase
            .from("appointments")
            .select("*")
            .limit(MAX_PORTFOLIO_ROWS),
      },
    ];

    try {
      const settled = await Promise.allSettled(
        sources.map((source) =>
          withTimeout(
            Promise.resolve(source.run()),
            `${pretty(source.key)} loading timed out.`
          )
        )
      );

      if (!mountedRef.current || requestRef.current !== requestId) return;

      const values = {};
      const health = {};
      const failures = [];

      settled.forEach((result, index) => {
        const key = sources[index].key;

        if (result.status === "fulfilled" && !result.value?.error) {
          values[key] = dedupeRows(result.value?.data || []);
          health[key] = "live";
          return;
        }

        const sourceError =
          result.status === "rejected"
            ? result.reason
            : result.value?.error;

        values[key] = null;
        health[key] = "error";

        failures.push({
          source: key,
          message:
            sourceError?.message ||
            `${pretty(key)} could not be loaded.`,
        });
      });

      if (values.visas !== null) setVisas(values.visas);
      if (values.requirements !== null) {
        setRequirements(values.requirements);
      }
      if (values.applications !== null) {
        setApplications(values.applications);
      }
      if (values.inquiries !== null) setInquiries(values.inquiries);
      if (values.appointments !== null) {
        setAppointments(values.appointments);
      }

      setSourceHealth(health);
      setLastSyncedAt(new Date());

      if (failures.length) {
        setError(
          `Some portfolio sources could not refresh: ${failures
            .map((item) => `${item.source} (${item.message})`)
            .join(" · ")}. Existing data was preserved for failed sources.`
        );
      }
    } catch (loadError) {
      if (!mountedRef.current || requestRef.current !== requestId) return;

      console.error("Visa portfolio load failed:", loadError);

      setError(
        loadError?.message ||
          "Visa risk portfolio could not be loaded."
      );
    } finally {
      if (mountedRef.current && requestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portfolio = useMemo(() => {
    const requirementMap = new Map();

    requirements.forEach((item) => {
      const visaKey = String(item.visa_id || "");
      if (!visaKey) return;

      const list = requirementMap.get(visaKey) || [];
      list.push(item);
      requirementMap.set(visaKey, list);
    });

    const applicationMap = new Map(
      applications.map((item) => [String(item.id), item])
    );

    const inquiryMap = new Map(
      inquiries.map((item) => [String(item.id), item])
    );

    const appointmentMap = new Map(
      appointments.map((item) => [String(item.id), item])
    );

    return visas.map((visa) => {
      const visaStudentType = normalizeStudentType(visa.student_type);

      const reqs = dedupeRows(
        requirementMap.get(String(visa.id)) || []
      );

      const linkedApplication = visa.application_id
        ? applicationMap.get(String(visa.application_id)) || null
        : null;

      const application =
        linkedApplication &&
        String(linkedApplication.student_id) === String(visa.student_id) &&
        normalizeStudentType(linkedApplication.student_type) === visaStudentType
          ? linkedApplication
          : null;

      const source =
        visaStudentType === "appointment"
          ? appointmentMap.get(String(visa.student_id))
          : inquiryMap.get(String(visa.student_id));

      const name =
        source?.full_name ||
        source?.name ||
        `Student #${visa.student_id}`;

      const requiredReqs = [];
      const ready = [];
      const missing = [];
      const rejected = [];
      const review = [];
      const overdueRequirements = [];
      const dueSoonRequirements = [];
      const expiredRequirements = [];

      for (const item of reqs) {
        if (item.required === false) {
          continue;
        }

        requiredReqs.push(item);

        const state = requirementState(item.status);

        if (state === "ready") {
          ready.push(item);
        } else if (state === "missing") {
          missing.push(item);
        } else if (state === "rejected") {
          rejected.push(item);
        } else if (state === "review") {
          review.push(item);
        }

        if (state !== "ready") {
          const dueDays = daysFromNow(item.due_date);

          if (dueDays !== null) {
            if (dueDays < 0) {
              overdueRequirements.push(item);
            } else if (dueDays <= 7) {
              dueSoonRequirements.push(item);
            }
          }
        }

        const expiry =
          item.expiry_date ||
          item.document_expiry_date ||
          item.expires_at;

        const expiryDays = daysFromNow(expiry);

        if (expiryDays !== null && expiryDays < 0) {
          expiredRequirements.push(item);
        }
      }

      const nextActionDays = daysFromNow(visa.next_action_due);
      const appointmentDays = daysFromNow(visa.appointment_date);

      let score = 0;
      const reasons = [];
      const weights = [];

      const addRisk = (points, reason, key) => {
        score += points;
        reasons.push(reason);
        weights.push({
          key,
          points,
          reason,
        });
      };

      if (!visa.application_id) {
        addRisk(25, "No linked application", "no_application_link");
      } else if (!application) {
        addRisk(
          20,
          "Linked application does not match this student identity",
          "application_identity_mismatch"
        );
      } else if (!isOfferReadyApplication(application)) {
        addRisk(
          15,
          "Application is not offer-ready",
          "application_not_offer_ready"
        );
      }

      if (requiredReqs.length === 0) {
        addRisk(
          20,
          "Visa checklist not configured",
          "checklist_not_configured"
        );
      }

      if (rejected.length > 0) {
        addRisk(
          Math.min(30, rejected.length * 10),
          `${rejected.length} rejected requirement(s)`,
          "rejected_requirements"
        );
      }

      if (missing.length > 0) {
        addRisk(
          Math.min(28, missing.length * 7),
          `${missing.length} missing requirement(s)`,
          "missing_requirements"
        );
      }

      if (overdueRequirements.length > 0) {
        addRisk(
          Math.min(25, overdueRequirements.length * 8),
          `${overdueRequirements.length} overdue requirement(s)`,
          "overdue_requirements"
        );
      }

      if (expiredRequirements.length > 0) {
        addRisk(
          Math.min(20, expiredRequirements.length * 8),
          `${expiredRequirements.length} expired requirement(s)`,
          "expired_requirements"
        );
      }

      if (review.length > 0) {
        addRisk(
          Math.min(12, review.length * 3),
          `${review.length} requirement(s) still under review`,
          "requirements_under_review"
        );
      }

      if (isTruthy(visa.previous_refusal)) {
        addRisk(20, "Previous visa refusal", "previous_refusal");
      }

      const counselorRisk = normalize(visa.risk_level);

      if (counselorRisk === "critical") {
        addRisk(20, "Counselor marked critical", "manual_critical");
      } else if (counselorRisk === "high") {
        addRisk(12, "Counselor marked high risk", "manual_high");
      }

      if (!String(visa.next_action || "").trim()) {
        addRisk(8, "No next action defined", "no_next_action");
      }

      if (nextActionDays !== null) {
        if (nextActionDays < 0) {
          addRisk(18, "Next action overdue", "next_action_overdue");
        } else if (nextActionDays <= 7) {
          addRisk(
            8,
            "Next action due within 7 days",
            "next_action_due_soon"
          );
        }
      }

      if (
        appointmentDays !== null &&
        appointmentDays >= 0 &&
        appointmentDays <= 14
      ) {
        if (
          missing.length ||
          rejected.length ||
          overdueRequirements.length
        ) {
          addRisk(
            18,
            "Appointment within 14 days with unresolved requirements",
            "appointment_pressure"
          );
        } else if (review.length) {
          addRisk(
            8,
            "Appointment within 14 days while requirements remain under review",
            "appointment_review_pressure"
          );
        }
      }

      score = clamp(score);

      const readiness =
        requiredReqs.length > 0
          ? Math.round((ready.length / requiredReqs.length) * 100)
          : null;

      return {
        ...visa,
        student_type: visaStudentType,
        studentName: name,
        studentSource: source || null,
        application,
        requirements: reqs,
        requiredRequirements: requiredReqs,
        ready,
        missing,
        rejected,
        review,
        overdueRequirements,
        dueSoonRequirements,
        expiredRequirements,
        readiness,
        nextActionDays,
        appointmentDays,
        score,
        level: riskLevelFromScore(score),
        reasons,
        weights,
      };
    });
  }, [
    visas,
    requirements,
    applications,
    inquiries,
    appointments,
  ]);

  const stats = useMemo(() => {
    const critical = portfolio.filter(
      (item) => item.level === "Critical"
    ).length;

    const high = portfolio.filter(
      (item) => item.level === "High"
    ).length;

    const medium = portfolio.filter(
      (item) => item.level === "Medium"
    ).length;

    const low = portfolio.filter(
      (item) => item.level === "Low"
    ).length;

    const upcomingAppointments = portfolio.filter(
      (item) =>
        item.appointmentDays !== null &&
        item.appointmentDays >= 0 &&
        item.appointmentDays <= 14
    ).length;

    const unresolvedRequirements = portfolio.reduce(
      (sum, item) =>
        sum +
        item.missing.length +
        item.rejected.length +
        item.overdueRequirements.length,
      0
    );

    const overdueActions = portfolio.filter(
      (item) =>
        item.nextActionDays !== null &&
        item.nextActionDays < 0
    ).length;

    const missingChecklists = portfolio.filter(
      (item) => item.requiredRequirements.length === 0
    ).length;

    const noNextAction = portfolio.filter(
      (item) => !String(item.next_action || "").trim()
    ).length;

    const previousRefusal = portfolio.filter((item) =>
      isTruthy(item.previous_refusal)
    ).length;

    return {
      total: portfolio.length,
      critical,
      high,
      medium,
      low,
      highOrCritical: critical + high,
      upcomingAppointments,
      unresolvedRequirements,
      overdueActions,
      missingChecklists,
      noNextAction,
      previousRefusal,
    };
  }, [portfolio]);

  const filteredPortfolio = useMemo(() => {
    const query = search.trim().toLowerCase();

    const rows = portfolio.filter((item) => {
      if (
        riskFilter !== "all" &&
        normalize(item.level) !== normalize(riskFilter)
      ) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        item.studentName,
        item.studentSource?.email,
        item.studentSource?.phone,
        item.country,
        item.source_university_name,
        item.application?.university,
        item.application?.program,
        item.visa_stage,
        item.visa_status,
        item.next_action,
        ...item.reasons,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    rows.sort((a, b) => {
      if (sortBy === "appointment") {
        const aDays =
          a.appointmentDays === null
            ? Number.MAX_SAFE_INTEGER
            : a.appointmentDays;
        const bDays =
          b.appointmentDays === null
            ? Number.MAX_SAFE_INTEGER
            : b.appointmentDays;

        return aDays - bDays || b.score - a.score;
      }

      if (sortBy === "next_action") {
        const aDays =
          a.nextActionDays === null
            ? Number.MAX_SAFE_INTEGER
            : a.nextActionDays;
        const bDays =
          b.nextActionDays === null
            ? Number.MAX_SAFE_INTEGER
            : b.nextActionDays;

        return aDays - bDays || b.score - a.score;
      }

      if (sortBy === "readiness") {
        const aReady = a.readiness === null ? -1 : a.readiness;
        const bReady = b.readiness === null ? -1 : b.readiness;

        return aReady - bReady || b.score - a.score;
      }

      return b.score - a.score;
    });

    return rows;
  }, [portfolio, search, riskFilter, sortBy]);

  const ranked = useMemo(
    () => filteredPortfolio.slice(0, safeLimit),
    [filteredPortfolio, safeLimit]
  );

  const hasFilters =
    Boolean(search.trim()) ||
    riskFilter !== "all" ||
    sortBy !== "risk";

  const clearFilters = () => {
    setSearch("");
    setRiskFilter("all");
    setSortBy("risk");
  };

  return (
    <section className="min-w-0 space-y-5 text-[#10233f]">
      <div
        className="rounded-[1.9rem] border-[3px] border-[#F97316] bg-[#173F6B] p-5 shadow-[0_16px_40px_rgba(15,35,63,0.14)] sm:p-6"
        style={{ color: "#ffffff" }}
      >
        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5">
              <ShieldCheck size={14} style={{ color: "#FDBA74" }} />
              <p
                className="text-[9px] font-black uppercase tracking-[0.14em]"
                style={{ color: "#ffffff" }}
              >
                Visa Portfolio Intelligence
              </p>
            </div>

            <h2
              className="mt-3 break-words text-3xl font-black leading-tight"
              style={{ color: "#ffffff" }}
            >
              Visa Risk Command Center
            </h2>

            <p
              className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6"
              style={{ color: "#ffffff" }}
            >
              Deterministic portfolio ranking from application linkage,
              checklist readiness, missing/rejected requirements, deadlines,
              appointments, refusal history and counselor risk markers.
            </p>

            <p
              className="mt-3 max-w-3xl text-xs font-semibold"
              style={{ color: "#ffffff" }}
            >
              No GPT call is made here. Scores are operational triage signals,
              not visa-outcome predictions.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2 rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] p-3">
            {lastSyncedAt ? (
              <span className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-xs font-black text-white">
                <DatabaseDot />
                Synced{" "}
                {lastSyncedAt.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-white px-3 py-2 text-xs font-black text-[#0b2a57] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Refreshing..." : "Refresh Portfolio"}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border-[3px] border-amber-400 bg-[#FFF8E8] p-4 text-sm font-bold leading-6 text-amber-950 shadow-[0_7px_18px_rgba(146,96,12,0.06)]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="font-black">Portfolio source warning</p>
              <p className="mt-1 break-words font-semibold">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {Object.keys(sourceHealth).length ? (
        <div className="flex flex-wrap gap-2">
          {Object.entries(sourceHealth).map(([source, health]) => (
            <span
              key={source}
              className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                health === "live"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-red-300 bg-red-50 text-red-800"
              }`}
            >
              {source}: {health}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-3">
        <Metric label="Active Cases" value={stats.total} icon={Stamp} />
        <Metric
          label="Critical"
          value={stats.critical}
          icon={ShieldAlert}
          tone={stats.critical ? "red" : "slate"}
        />
        <Metric
          label="High"
          value={stats.high}
          icon={AlertTriangle}
          tone={stats.high ? "orange" : "slate"}
        />
        <Metric
          label="Appointments ≤14d"
          value={stats.upcomingAppointments}
          icon={CalendarClock}
          tone={stats.upcomingAppointments ? "orange" : "slate"}
        />
        <Metric
          label="Requirement Pressure"
          value={stats.unresolvedRequirements}
          icon={FileWarning}
          tone={stats.unresolvedRequirements ? "red" : "slate"}
        />
        <Metric
          label="Overdue Actions"
          value={stats.overdueActions}
          icon={TimerReset}
          tone={stats.overdueActions ? "red" : "slate"}
        />
        <Metric
          label="No Checklist"
          value={stats.missingChecklists}
          icon={FileWarning}
          tone={stats.missingChecklists ? "orange" : "slate"}
        />
        <Metric
          label="Previous Refusal"
          value={stats.previousRefusal}
          icon={ShieldAlert}
          tone={stats.previousRefusal ? "red" : "slate"}
        />
      </div>

      <div className="rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-orange-700" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Portfolio Controls
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {filteredPortfolio.length} matching case
                {filteredPortfolio.length === 1 ? "" : "s"} · showing up to{" "}
                {safeLimit}
              </p>
            </div>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
            >
              <X size={13} />
              Clear Controls
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_190px_190px]">
          <label className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-600"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, university, program, stage, pressure..."
              className="w-full rounded-xl border-2 border-[#B9C9D9] bg-[#FFF9F1] py-2.5 pl-10 pr-3 text-sm font-semibold text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <label className="relative">
            <Filter
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-orange-600"
            />
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-[#B9C9D9] bg-white py-2.5 pl-9 pr-3 text-sm font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
          >
            <option value="risk">Sort: Highest Risk</option>
            <option value="next_action">Sort: Next Action</option>
            <option value="appointment">Sort: Appointment</option>
            <option value="readiness">Sort: Lowest Readiness</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
        <PressureCard
          label="High / Critical"
          value={stats.highOrCritical}
          helper="Cases needing the fastest counselor review"
          tone={stats.highOrCritical ? "red" : "green"}
        />
        <PressureCard
          label="No Next Action"
          value={stats.noNextAction}
          helper="Visa cases without an operational next move"
          tone={stats.noNextAction ? "orange" : "green"}
        />
        <PressureCard
          label="Medium Risk"
          value={stats.medium}
          helper="Cases worth monitoring before they escalate"
          tone={stats.medium ? "orange" : "green"}
        />
        <PressureCard
          label="Low Risk"
          value={stats.low}
          helper="Currently lower-pressure active visa cases"
          tone="green"
        />
      </div>

      <div className="overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_10px_28px_rgba(15,35,63,0.06)]">
        <div className="border-b-[3px] border-[#F97316]/35 bg-[#FFF7EC] p-4">
          <h3 className="text-lg font-black text-[#10233f]">
            Highest Pressure Visa Cases
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Operational score is transparent and capped at 100. It is for
            prioritization only, not a prediction of visa approval or refusal.
          </p>
        </div>

        {loading && !ranked.length ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="text-center">
              <LoaderCircle
                size={26}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-2 text-sm font-black text-[#10233f]">
                Loading Visa OS portfolio
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !ranked.length ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={34} className="mx-auto text-emerald-500" />
            <p className="mt-3 text-sm font-black text-[#10233f]">
              {portfolio.length
                ? "No visa cases match the current controls"
                : "No active visa cases yet"}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-2 text-xs font-black text-orange-800"
              >
                Reset Controls
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="divide-y-2 divide-slate-200">
          {ranked.map((item) => (
            <VisaCaseRow
              key={item.id}
              item={item}
              onOpenStudent={onOpenStudent}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[1.6rem] border-[3px] border-[#173F6B]/30 bg-[#FFFDF8] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)]">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
          Risk Model Transparency
        </p>

        <h3 className="mt-1 text-base font-black text-[#10233f]">
          What can increase the operational risk score?
        </h3>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Rule
            title="Application"
            text="Missing link, identity mismatch or an application that has not reached an offer-ready state."
          />
          <Rule
            title="Requirements"
            text="Checklist not configured, missing/rejected/expired items, overdue requirements or review backlog."
          />
          <Rule
            title="Timing"
            text="Overdue next actions and appointments approaching while blockers remain unresolved."
          />
          <Rule
            title="Case Risk"
            text="Previous refusal and explicit counselor high/critical risk markers."
          />
        </div>
      </div>
    </section>
  );
}

function VisaCaseRow({ item, onOpenStudent }) {
  const openable = typeof onOpenStudent === "function";

  const content = (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr_130px_1.25fr] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <UserRound size={15} className="text-orange-600" />

          <p className="truncate font-black text-[#10233f]">
            {item.studentName}
          </p>

          <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
            {item.student_type}
          </span>
        </div>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {item.source_university_name ||
            item.application?.university ||
            "No source university"}
        </p>

        <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
          {item.application?.program || "Program not linked"}
        </p>
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          Visa Stage / Readiness
        </p>

        <p className="mt-1 text-xs font-black text-[#10233f]">
          {pretty(item.visa_stage || item.visa_status || "preparation")}
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          {item.readiness === null
            ? "Checklist not assessed"
            : `${item.readiness}% requirements ready`}
        </p>

        {item.appointment_date ? (
          <p className="mt-1 text-[10px] font-bold text-orange-700">
            Appointment {formatDate(item.appointment_date)}
          </p>
        ) : null}
      </div>

      <RiskBadge level={item.level} score={item.score} />

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          Highest Pressure
        </p>

        <p className="mt-1 line-clamp-2 text-xs font-black leading-5 text-[#10233f]">
          {item.reasons[0] || "No major pressure signal"}
        </p>

        {item.reasons.length > 1 ? (
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            +{item.reasons.length - 1} more pressure signal
            {item.reasons.length - 1 === 1 ? "" : "s"}
          </p>
        ) : null}

        {item.next_action_due ? (
          <p
            className={`mt-1 text-[10px] font-black ${
              item.nextActionDays !== null && item.nextActionDays < 0
                ? "text-red-700"
                : "text-orange-700"
            }`}
          >
            Next action {formatDate(item.next_action_due)}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!openable) {
    return <div className="p-4 transition hover:bg-[#FFF7EC]">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() =>
        onOpenStudent({
          studentId: item.student_id,
          studentType: item.student_type,
          visaId: item.id,
        })
      }
      className="w-full p-4 text-left transition hover:bg-orange-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-100"
    >
      {content}
    </button>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-[#B9C9D9] bg-[#FFFDF8] text-[#10233f]",
    orange: "border-[#F59E0B] bg-[#FFF7ED] text-orange-800",
    red: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    green: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
  };

  return (
    <div
      className={`min-w-0 rounded-2xl border-[3px] p-4 shadow-[0_6px_16px_rgba(15,35,63,0.055)] ${
        tones[tone] || tones.slate
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-black">{value}</p>
          <p className="mt-1 break-words text-[9px] font-black uppercase leading-4 tracking-[0.08em] opacity-80">
            {label}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

function PressureCard({ label, value, helper, tone = "green" }) {
  const styles = {
    red: "border-[#FB7185] bg-[#FFF4F4]",
    orange: "border-[#F59E0B] bg-[#FFF7ED]",
    green: "border-[#34D399] bg-[#F0FFF8]",
  };

  return (
    <div
      className={`min-w-0 rounded-2xl border-[3px] p-4 shadow-[0_6px_16px_rgba(15,35,63,0.05)] ${
        styles[tone] || styles.green
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233f]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function RiskBadge({ level, score }) {
  const style =
    level === "Critical"
      ? "border-red-500 bg-red-100 text-red-900"
      : level === "High"
      ? "border-orange-400 bg-orange-50 text-orange-900"
      : level === "Medium"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <div className={`rounded-xl border-2 px-3 py-2 ${style}`}>
      <p className="text-xs font-black">{level}</p>
      <p className="mt-0.5 text-[10px] font-semibold">{score}/100</p>
    </div>
  );
}

function Rule({ title, text }) {
  return (
    <div className="rounded-xl border-2 border-[#9B6CFF]/55 bg-[#FBF8FF] p-3">
      <p className="text-xs font-black text-[#10233f]">{title}</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function DatabaseDot() {
  return (
    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(110,231,183,0.15)]" />
  );
}

export default VisaRiskAnalyzer;
