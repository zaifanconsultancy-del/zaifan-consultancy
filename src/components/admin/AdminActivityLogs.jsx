// AdminActivityLogs V5 — Role-Aware Audit Command Center
// src/components/admin/AdminActivityLogs.jsx
//
// Maximum pass:
// - live Supabase activity_logs read model with realtime refresh
// - timeout + stale-request protection + unmount safety
// - search, target/action/admin/date filters, sorting, pagination, page size
// - operational summary: today, destructive, ownership, status, unique admins
// - local CSV export of currently filtered audit records
// - clear RLS/network error states and retry flow
// - no fake writes or destructive controls inside the audit viewer
// - readable Zaifan Admin OS navy/orange/cream hierarchy
// - mobile-safe layout + reduced-motion support
//
// Known activity_logs fields used by the existing Zaifan codebase:
// id, admin_id, admin_name, action, target_type, target_id, details, created_at

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileClock,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 15000;
const FETCH_LIMIT = 500;
const PAGE_SIZE_OPTIONS = [20, 40, 75, 100];

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

function pretty(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function safeDateMs(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  const ms = safeDateMs(value);
  if (!ms) return "Unknown time";

  try {
    return new Date(ms).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Unknown time";
  }
}

function dateKey(value) {
  const ms = safeDateMs(value);
  if (!ms) return "";
  const date = new Date(ms);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function isToday(value) {
  if (!value) return false;
  return dateKey(value) === dateKey(new Date());
}

function getActionCategory(action = "") {
  const clean = normalize(action);

  if (
    clean.includes("delete") ||
    clean.includes("clear") ||
    clean.includes("remove")
  ) {
    return "destructive";
  }

  if (
    clean.includes("assign") ||
    clean.includes("owner") ||
    clean.includes("counselor")
  ) {
    return "ownership";
  }

  if (clean.includes("priority")) return "priority";

  if (
    clean.includes("status") ||
    clean.includes("confirm") ||
    clean.includes("complete") ||
    clean.includes("cancel") ||
    clean.includes("stage")
  ) {
    return "status";
  }

  if (
    clean.includes("login") ||
    clean.includes("logout") ||
    clean.includes("role") ||
    clean.includes("permission") ||
    clean.includes("admin")
  ) {
    return "security";
  }

  return "general";
}

function compactActionLabel(value = "") {
  const clean = String(value || "").trim();
  return clean ? pretty(clean) : "CRM Activity";
}

function isRedundantDetail(action = "", details = "") {
  const actionText = normalize(pretty(action))
    .replace(/\b(updated|changed|set|created|deleted|removed)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const detailText = normalize(details)
    .replace(/\b(updated|changed|set|created|deleted|removed|from|to)\b/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!detailText) return true;
  if (!actionText) return false;

  return (
    detailText === actionText ||
    detailText.startsWith(actionText) ||
    (actionText.length > 8 && detailText.includes(actionText))
  );
}

function shortId(value = "", max = 12) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

const ACTION_CATEGORIES = [
  ["all", "All actions"],
  ["destructive", "Delete / Remove"],
  ["ownership", "Ownership"],
  ["priority", "Priority"],
  ["status", "Status / Stage"],
  ["security", "Security / Admin"],
  ["general", "Other"],
];

function AdminActivityLogs({ cardClass = "" }) {
  const shouldReduceMotion = useReducedMotion();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [actorRoles, setActorRoles] = useState({});

  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [pageSize, setPageSize] = useState(40);
  const [page, setPage] = useState(1);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const realtimeTimerRef = useRef(null);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchActorRoles = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("admin_profiles")
          .select("id, full_name, role"),
        "Admin profile role lookup"
      );

      if (error) throw error;

      const roleMap = {};

      (Array.isArray(data) ? data : []).forEach((profile) => {
        if (!profile?.id) return;

        roleMap[String(profile.id)] = {
          role: normalize(profile.role || "staff"),
          name: profile.full_name || "",
        };
      });

      safeSet(() => setActorRoles(roleMap));
    } catch (error) {
      // Audit history should still render if profile-role enrichment is blocked.
      console.warn("AdminActivityLogs role enrichment failed:", error);
    }
  };

  const fetchLogs = async ({ silent = false } = {}) => {
    const requestId = ++requestIdRef.current;

    if (!silent) {
      safeSet(() => {
        setLoading(true);
        setLoadError("");
      });
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("activity_logs")
          .select(
            "id, admin_id, admin_name, action, target_type, target_id, details, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(FETCH_LIMIT),
        "Activity logs fetch"
      );

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (error) {
        throw error;
      }

      safeSet(() => {
        setLogs(Array.isArray(data) ? data : []);
        setLoadError("");
        setLastSyncedAt(new Date());
      });
    } catch (error) {
      console.error("Activity logs fetch failed:", error);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const message = String(error?.message || "");

      safeSet(() => {
        setLoadError(
          message.toLowerCase().includes("row-level security") ||
            message.toLowerCase().includes("permission")
            ? "Activity logs could not load because Supabase permissions/RLS blocked access."
            : message || "Activity logs could not load. Check Supabase connectivity and retry."
        );
      });
    } finally {
      if (!silent && mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void fetchLogs();
    void fetchActorRoles();

    const channel = supabase
      .channel("admin-activity-logs-v3")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_logs",
        },
        () => {
          if (realtimeTimerRef.current) {
            window.clearTimeout(realtimeTimerRef.current);
          }

          realtimeTimerRef.current = window.setTimeout(() => {
            void fetchLogs({ silent: true });
          }, 250);
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel("admin-activity-actor-roles-v5")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "admin_profiles",
        },
        () => {
          void fetchActorRoles();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;

      if (realtimeTimerRef.current) {
        window.clearTimeout(realtimeTimerRef.current);
      }

      supabase.removeChannel(channel);
      supabase.removeChannel(profileChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    targetFilter,
    actionFilter,
    adminFilter,
    dateFilter,
    sortOrder,
    pageSize,
  ]);

  const targetTypes = useMemo(
    () =>
      [...new Set(logs.map((log) => log.target_type).filter(Boolean))].sort(
        (a, b) => String(a).localeCompare(String(b))
      ),
    [logs]
  );

  const adminNames = useMemo(
    () =>
      [...new Set(logs.map((log) => log.admin_name).filter(Boolean))].sort(
        (a, b) => String(a).localeCompare(String(b))
      ),
    [logs]
  );

  const actionCategories = ACTION_CATEGORIES;

  const stats = useMemo(() => {
    const uniqueAdmins = new Set();
    let today = 0;
    let destructive = 0;
    let ownership = 0;
    let status = 0;

    for (const log of logs) {
      const actor = log.admin_id || log.admin_name;
      if (actor) uniqueAdmins.add(actor);

      if (isToday(log.created_at)) {
        today += 1;
      }

      const category = getActionCategory(log.action);

      if (category === "destructive") {
        destructive += 1;
      } else if (category === "ownership") {
        ownership += 1;
      } else if (category === "status") {
        status += 1;
      }
    }

    return {
      total: logs.length,
      today,
      admins: uniqueAdmins.size,
      destructive,
      ownership,
      status,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const filtered = logs.filter((log) => {
      if (targetFilter !== "all" && log.target_type !== targetFilter) {
        return false;
      }

      const actionCategory = getActionCategory(log.action);
      if (actionFilter !== "all" && actionCategory !== actionFilter) {
        return false;
      }

      if (adminFilter !== "all" && log.admin_name !== adminFilter) {
        return false;
      }

      const createdMs = safeDateMs(log.created_at);

      if (dateFilter === "today" && !isToday(log.created_at)) return false;
      if (
        dateFilter === "7d" &&
        (!createdMs || now - createdMs > 7 * 86400000)
      ) {
        return false;
      }
      if (
        dateFilter === "30d" &&
        (!createdMs || now - createdMs > 30 * 86400000)
      ) {
        return false;
      }

      if (!searchText) return true;

      return [
        log.action,
        log.admin_name,
        log.details,
        log.target_type,
        log.target_id,
        log.admin_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText);
    });

    return [...filtered].sort((a, b) => {
      const aDate = safeDateMs(a.created_at);
      const bDate = safeDateMs(b.created_at);
      return sortOrder === "oldest" ? aDate - bDate : bDate - aDate;
    });
  }, [
    logs,
    search,
    targetFilter,
    actionFilter,
    adminFilter,
    dateFilter,
    sortOrder,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const rangeStart =
    filteredLogs.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filteredLogs.length);

  const resetFilters = () => {
    setSearch("");
    setTargetFilter("all");
    setActionFilter("all");
    setAdminFilter("all");
    setDateFilter("all");
    setSortOrder("newest");
    setPage(1);
  };

  const exportFilteredCsv = () => {
    if (!filteredLogs.length) return;

    const headers = [
      "Created At",
      "Admin Name",
      "Admin ID",
      "Action",
      "Category",
      "Target Type",
      "Target ID",
      "Details",
    ];

    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      log.admin_name || "",
      log.admin_id || "",
      log.action || "",
      pretty(getActionCategory(log.action)),
      log.target_type || "",
      log.target_id || "",
      log.details || "",
    ]);

    const csv = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zaifan-admin-activity-logs-${dateKey(new Date()) || "export"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    targetFilter !== "all" ||
    actionFilter !== "all" ||
    adminFilter !== "all" ||
    dateFilter !== "all" ||
    sortOrder !== "newest";

  return (
    <section
      className={`${cardClass} overflow-hidden rounded-[2.2rem] border-[3px] border-orange-300 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.07)]`}
    >
      <div className="p-4 sm:p-5">
        <div className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 shadow-[0_12px_30px_rgba(15,35,63,0.08)]">
          <div className="grid xl:grid-cols-[1.2fr_0.8fr]">
            <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">
              <FileClock size={12} />
              Audit Trail OS
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <ShieldCheck size={12} />
              Read Only
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Admin Activity Logs
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-white">
            Permanent operational visibility into assignment, priority, status,
            deletion and other Admin CRM actions written to Supabase activity_logs.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchLogs()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 bg-white px-4 py-2.5 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Refreshing..." : "Refresh Logs"}
            </button>

            <button
              type="button"
              onClick={exportFilteredCsv}
              disabled={!filteredLogs.length}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={14} />
              Export Filtered
            </button>
          </div>

          <p className="mt-3 text-[11px] font-semibold text-white">
            {lastSyncedAt
              ? `Last synced ${lastSyncedAt.toLocaleTimeString("en-PK", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Waiting for first successful sync"}
          </p>
        </div>

            <div className="bg-orange-500 p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
            Audit Coverage
          </p>

          <p className="mt-3 text-5xl font-black text-white">{stats.total}</p>
          <p className="mt-1 text-sm font-black text-white">
            loaded audit records
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <OrangeStat label="Today" value={stats.today} />
            <OrangeStat label="Admins" value={stats.admins} />
          </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-[#fff8ee] px-4 pb-4 sm:px-5 sm:pb-5">
        {loadError ? (
          <Feedback
            tone="error"
            message={loadError}
            onRetry={() => fetchLogs()}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Destructive"
            value={stats.destructive}
            icon={Trash2}
            tone="red"
            detail="Delete, clear or remove actions"
          />
          <MetricCard
            label="Ownership"
            value={stats.ownership}
            icon={UserRoundCog}
            tone="blue"
            detail="Assignment and counselor changes"
          />
          <MetricCard
            label="Status / Stage"
            value={stats.status}
            icon={Activity}
            tone="green"
            detail="Pipeline and status changes"
          />
          <MetricCard
            label="Unique Admins"
            value={stats.admins}
            icon={UsersRound}
            tone="navy"
            detail="Distinct actors in loaded history"
          />
        </div>

        <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#F97316] bg-[#FFFDF9] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-orange-700" />
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
              Audit Controls
            </p>
          </div>

          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <div className="relative min-w-0 md:col-span-2 xl:col-span-3 2xl:col-span-2">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search action, admin, details, target ID..."
                className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <select
              value={targetFilter}
              onChange={(event) => setTargetFilter(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All targets</option>
              {targetTypes.map((type) => (
                <option key={type} value={type}>
                  {pretty(type)}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              {actionCategories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={adminFilter}
              onChange={(event) => setAdminFilter(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All admins</option>
              {adminNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-11 min-w-0 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#B9C9D9] bg-white px-3 text-xs font-black text-[#10233f] transition hover:border-[#F97316] hover:bg-[#FFF4E8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Filter size={14} />
              Reset
            </button>
          </div>

          <div className="mt-3 flex min-w-0 flex-col gap-3 text-xs font-bold text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <span className="min-w-0 break-words">
              Showing {rangeStart}–{rangeEnd} of {filteredLogs.length} matching
              records · newest {FETCH_LIMIT} loaded
            </span>

            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-9 w-fit shrink-0 rounded-lg border-2 border-[#B9C9D9] bg-white px-2 text-[11px] font-black text-[#10233f] outline-none focus:border-[#F97316]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading && !logs.length ? (
          <LoadingState />
        ) : !logs.length ? (
          <EmptyState
            icon={FileClock}
            title="No activity logs yet"
            text="Important Admin CRM actions will appear here after they are written to activity_logs."
          />
        ) : !filteredLogs.length ? (
          <EmptyState
            icon={Search}
            title="No matching audit records"
            text="The audit table has data, but none match the current search and filters."
          />
        ) : (
          <div className="space-y-2.5">
            {pagedLogs.map((log, index) => (
              <ActivityLogCard
                key={log.id}
                log={log}
                index={index}
                shouldReduceMotion={shouldReduceMotion}
                actorRole={
                  actorRoles[String(log.admin_id || "")]?.role || "unknown"
                }
              />
            ))}
          </div>
        )}

        {filteredLogs.length > pageSize ? (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPrevious={() =>
              setPage((current) => Math.max(1, current - 1))
            }
            onNext={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          />
        ) : null}
      </div>
    </section>
  );
}

function ActivityLogCard({
  log,
  index,
  shouldReduceMotion,
  actorRole = "unknown",
}) {
  const category = getActionCategory(log.action);
  const tone = getActionTone(category);
  const Icon = tone.icon;

  const actionLabel = compactActionLabel(log.action);
  const showDetails =
    Boolean(String(log.details || "").trim()) &&
    !isRedundantDetail(log.action, log.details);

  const roleTone = getActorRoleTone(actorRole);

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.22,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.018, 0.12),
      }}
      className={`group min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] bg-white shadow-[0_5px_16px_rgba(15,35,63,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(15,35,63,0.055)] ${tone.card}`}
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,12rem)]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${tone.iconBox}`}
            >
              <Icon size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h4 className="min-w-0 break-words text-[15px] font-black leading-5 text-[#10233f]">
                  {actionLabel}
                </h4>

                <span
                  className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.11em] ${tone.badge}`}
                >
                  {pretty(category)}
                </span>

                <span
                  className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${roleTone.badge}`}
                >
                  {roleTone.label}
                </span>
              </div>

              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-black text-[#10233f]">
                  <UserRoundCog size={13} className="shrink-0 text-orange-700" />
                  <span className="break-words">
                    {log.admin_name || "Unknown Actor"}
                  </span>
                </span>

                <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />

                <span className="min-w-0 break-words font-bold text-slate-600">
                  {pretty(log.target_type || "crm")}
                  {log.target_id ? ` #${shortId(log.target_id, 14)}` : ""}
                </span>

                {log.admin_id ? (
                  <>
                    <span className="hidden h-1 w-1 shrink-0 rounded-full bg-slate-300 sm:block" />
                    <span
                      className="hidden max-w-[11rem] truncate font-mono text-[9px] font-semibold text-slate-400 sm:inline"
                      title={String(log.admin_id)}
                    >
                      actor {shortId(log.admin_id, 10)}
                    </span>
                  </>
                ) : null}
              </div>

              {showDetails ? (
                <p className="mt-3 max-w-4xl whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600">
                  {log.details}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center border-t-2 border-slate-100 bg-[#FFF9F1] px-4 py-3 lg:justify-end lg:border-l-2 lg:border-t-0">
          <div className="min-w-0 text-left lg:text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-400">
              Recorded
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-orange-800 lg:justify-end">
              <Clock3 size={12} className="shrink-0" />
              <span className="break-words text-[10px] font-black leading-4">
                {formatDate(log.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function getActorRoleTone(role = "unknown") {
  if (role === "super_admin") {
    return {
      label: "Super Admin",
      badge: "border-[#173F6B] bg-[#173F6B] text-white",
    };
  }

  if (role === "admin") {
    return {
      label: "Admin",
      badge: "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    };
  }

  if (role === "staff") {
    return {
      label: "Staff",
      badge: "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    };
  }

  return {
    label: "Actor",
    badge: "border-slate-300 bg-slate-50 text-slate-700",
  };
}

function getActionTone(category) {
  const tones = {
    destructive: {
      icon: Trash2,
      card: "border-red-300 hover:border-red-400",
      badge: "border-red-200 bg-red-50 text-red-800",
      iconBox: "border-red-200 bg-red-50 text-red-700",
    },
    ownership: {
      icon: UserRoundCog,
      card: "border-blue-300 hover:border-blue-400",
      badge: "border-blue-200 bg-blue-50 text-blue-800",
      iconBox: "border-blue-200 bg-blue-50 text-blue-700",
    },
    priority: {
      icon: ShieldAlert,
      card: "border-violet-300 hover:border-violet-400",
      badge: "border-violet-200 bg-violet-50 text-violet-800",
      iconBox: "border-violet-200 bg-violet-50 text-violet-700",
    },
    status: {
      icon: CheckCircle2,
      card: "border-emerald-300 hover:border-emerald-400",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
      iconBox: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    security: {
      icon: ShieldCheck,
      card: "border-[#123865] hover:border-orange-400",
      badge: "border-[#123865] bg-[#123865] text-white",
      iconBox: "border-[#123865] bg-[#123865] text-white",
    },
    general: {
      icon: Activity,
      card: "border-orange-300 hover:border-orange-400",
      badge: "border-orange-200 bg-orange-50 text-orange-800",
      iconBox: "border-orange-200 bg-orange-50 text-orange-700",
    },
  };

  return tones[category] || tones.general;
}

function MetricCard({ label, value, icon: Icon, tone = "navy", detail }) {
  const styles = {
    navy: "border-[#123865] bg-[#123865] text-white",
    red: "border-red-300 bg-red-50 text-red-900",
    blue: "border-blue-300 bg-blue-50 text-blue-900",
    green: "border-emerald-300 bg-emerald-50 text-emerald-900",
  };

  const iconStyle =
    tone === "navy"
      ? "border-white/20 bg-white/10 text-white"
      : "border-current/20 bg-white text-current";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 ${
        styles[tone] || styles.navy
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${iconStyle}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5">{detail}</p>
    </div>
  );
}

function OrangeStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function Feedback({ tone = "error", message, onRetry }) {
  const isError = tone === "error";

  return (
    <div
      className={`flex flex-col gap-3 rounded-[1.4rem] border-[3px] p-4 sm:flex-row sm:items-center sm:justify-between ${
        isError
          ? "border-red-300 bg-red-50 text-red-900"
          : "border-emerald-300 bg-emerald-50 text-emerald-900"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {isError ? (
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        )}

        <p className="text-sm font-black leading-6">{message}</p>
      </div>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-5"
        >
          <div className="h-4 w-44 rounded-full bg-slate-200" />
          <div className="mt-4 h-3 w-full max-w-xl rounded-full bg-slate-200" />
          <div className="mt-3 h-3 w-60 rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Icon size={22} />
      </div>
      <h3 className="mt-4 text-xl font-black text-[#10233f]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function Pagination({ page, totalPages, onPrevious, onNext }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.35rem] border-[3px] border-orange-300 bg-white p-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={14} />
        Previous
      </button>

      <p className="text-xs font-black text-[#10233f]">
        Page {page} of {totalPages}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default AdminActivityLogs;
