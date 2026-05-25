import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 8000;

function withTimeout(promise, label = "Request") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out.`)),
        REQUEST_TIMEOUT_MS
      )
    ),
  ]);
}

function AdminActivityLogs({ cardClass = "" }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");

  const mountedRef = useRef(true);

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchLogs = async () => {
    safeSetState(() => {
      setLoading(true);
      setLoadError("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(75),
        "Activity logs fetch"
      );

      if (error) {
        console.error(error);

        safeSetState(() => {
          setLoadError("Failed to load activity logs.");
        });

        return;
      }

      safeSetState(() => {
        setLogs(data || []);
        setLoadError("");
      });
    } catch (error) {
      console.error(error);

      safeSetState(() => {
        setLoadError(
          "Activity logs request timed out. Check internet and retry."
        );
      });
    } finally {
      safeSetState(() => setLoading(false));
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    fetchLogs();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const targetTypes = useMemo(() => {
    const unique = [...new Set(logs.map((log) => log.target_type).filter(Boolean))];
    return ["all", ...unique];
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      log.action?.toLowerCase().includes(searchText) ||
      log.admin_name?.toLowerCase().includes(searchText) ||
      log.details?.toLowerCase().includes(searchText) ||
      log.target_type?.toLowerCase().includes(searchText) ||
      String(log.target_id || "").toLowerCase().includes(searchText);

    const matchesTarget =
      targetFilter === "all" || log.target_type === targetFilter;

    return matchesSearch && matchesTarget;
  });

  const todayCount = logs.filter((log) =>
    log.created_at
      ? new Date(log.created_at).toDateString() === new Date().toDateString()
      : false
  ).length;

  const adminCount = new Set(logs.map((log) => log.admin_name).filter(Boolean))
    .size;

  const resetFilters = () => {
    setSearch("");
    setTargetFilter("all");
  };

  return (
    <div className={`${cardClass} p-5 sm:p-7`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Audit Trail
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            Admin Activity Logs
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            Track important CRM actions, role activity, lead updates, assignment
            changes, and admin operations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Logs" value={logs.length} icon="📜" />
        <SummaryCard label="Today" value={todayCount} icon="⚡" />
        <SummaryCard label="Admins" value={adminCount} icon="🛡️" />
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search action, admin, details, target..."
          className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
        />

        <select
          value={targetFilter}
          onChange={(event) => setTargetFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]"
        >
          {targetTypes.map((type) => (
            <option key={type} value={type} className="bg-[#111]">
              {type === "all" ? "All Targets" : type}
            </option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white"
        >
          Reset
        </button>
      </div>

      {loadError && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{loadError}</p>

            <button
              type="button"
              onClick={fetchLogs}
              className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#E7C768]"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <EmptyState />
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-8 text-center">
          <h3 className="text-2xl font-black text-white">No Matching Logs</h3>
          <p className="mt-3 text-sm text-gray-400">
            Try changing the search or target filter.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-3 hidden h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-[#D4AF37]/50 via-white/10 to-transparent lg:block"></div>

          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <ActivityLogCard key={log.id} log={log} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityLogCard({ log, index }) {
  const actionTone = getActionTone(log.action);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.2) }}
      className="relative rounded-[1.4rem] border border-white/10 bg-black/25 p-4 transition duration-300 hover:border-[#D4AF37]/25 hover:bg-white/[0.035]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${actionTone.className}`}
            >
              {actionTone.icon} {log.action || "Activity"}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gray-400">
              {log.target_type || "crm"}
            </span>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            By{" "}
            <span className="font-bold text-[#D4AF37]">
              {log.admin_name || "Unknown Admin"}
            </span>
          </p>

          <p className="mt-3 break-words text-sm leading-relaxed text-gray-300">
            {log.details || "No details provided."}
          </p>

          {log.target_id && (
            <p className="mt-3 break-all font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
              Target ID: {log.target_id}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]">
            {formatDate(log.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
            {label}
          </p>
          <h3 className="mt-2 text-3xl font-black text-[#D4AF37]">{value}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[1.4rem] border border-white/10 bg-black/25 p-5"
        >
          <div className="h-4 w-44 rounded-full bg-white/10"></div>
          <div className="mt-4 h-3 w-full max-w-xl rounded-full bg-white/10"></div>
          <div className="mt-3 h-3 w-60 rounded-full bg-white/10"></div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl">
        📜
      </div>
      <h3 className="mt-5 text-2xl font-black text-white">No Activity Yet</h3>
      <p className="mt-3 text-sm text-gray-400">
        Important CRM actions will appear here once admins start working.
      </p>
    </div>
  );
}

function getActionTone(action = "") {
  const lower = action.toLowerCase();

  if (lower.includes("delete") || lower.includes("clear")) {
    return {
      icon: "🗑️",
      className: "border-red-400/25 bg-red-500/10 text-red-300",
    };
  }

  if (lower.includes("assign")) {
    return {
      icon: "📌",
      className: "border-cyan-400/25 bg-cyan-500/10 text-cyan-300",
    };
  }

  if (lower.includes("priority")) {
    return {
      icon: "🔥",
      className: "border-purple-400/25 bg-purple-500/10 text-purple-300",
    };
  }

  if (lower.includes("status") || lower.includes("confirm")) {
    return {
      icon: "✅",
      className: "border-green-400/25 bg-green-500/10 text-green-300",
    };
  }

  return {
    icon: "⚡",
    className: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
  };
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default AdminActivityLogs;
