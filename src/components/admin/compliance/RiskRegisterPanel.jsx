// RiskRegisterPanel V4 PARTNER-OS ALIGNED — Zaifan Compliance OS
// Full replacement for:
// src/components/admin/compliance/RiskRegisterPanel.jsx
//
// Production principles:
// - no fake "Open" status or fake owner assignment
// - unknown severity/status remains unknown
// - overdue requires a real due date + non-terminal status
// - mitigation absence is explicit, never hidden
// - unified Zaifan navy/orange/cream Compliance OS visual language

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function isTerminalStatus(status = "") {
  const value = normalize(status);

  return [
    "closed",
    "resolved",
    "completed",
    "complete",
    "approved",
    "archived",
    "dismissed",
  ].some((token) => value.includes(token));
}

function isOverdue(risk = {}) {
  if (!risk.dueDate) return false;

  const time = new Date(risk.dueDate).getTime();

  return (
    Number.isFinite(time) &&
    time < Date.now() &&
    !isTerminalStatus(risk.status)
  );
}

function severityTone(value = "") {
  const clean = normalize(value);

  if (clean.includes("critical")) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (clean.includes("high")) {
    return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  }

  if (clean.includes("medium")) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (clean.includes("low")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  return "border-[#C9D7E6] bg-[#F7FAFC] text-slate-700";
}

function statusTone(status = "") {
  const value = normalize(status);

  if (
    value.includes("closed") ||
    value.includes("resolved") ||
    value.includes("completed") ||
    value.includes("approved")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("progress") ||
    value.includes("mitigat") ||
    value.includes("review")
  ) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value.includes("open") || value.includes("pending")) {
    return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  }

  return "border-[#C9D7E6] bg-[#F7FAFC] text-slate-700";
}

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid due date";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "Invalid due date";
  }
}

export default function RiskRegisterPanel({
  compliance = {},
  compact = false,
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => safeArray(compliance.riskRows),
    [compliance.riskRows]
  );

  const stats = useMemo(() => {
    const critical = rows.filter(
      (risk) => normalize(risk.severity) === "critical"
    ).length;

    const high = rows.filter(
      (risk) => normalize(risk.severity) === "high"
    ).length;

    const overdue = rows.filter(isOverdue).length;

    const unassigned = rows.filter((risk) => {
      const owner = normalize(risk.owner);
      return !owner || owner === "unassigned";
    }).length;

    const missingMitigation = rows.filter((risk) => {
      const mitigation = normalize(risk.mitigation);
      return (
        !mitigation ||
        mitigation.includes("not documented") ||
        mitigation.includes("missing")
      );
    }).length;

    return {
      total: rows.length,
      critical,
      high,
      overdue,
      unassigned,
      missingMitigation,
    };
  }, [rows]);

  const filters = [
    "all",
    "critical",
    "high",
    "medium",
    "open",
    "overdue",
    "unassigned",
    "no mitigation",
    "unknown",
  ];

  const filtered = useMemo(() => {
    const search = normalize(query);

    return rows.filter((risk) => {
      const severity = normalize(risk.severity);
      const status = normalize(risk.status);
      const owner = normalize(risk.owner);
      const mitigation = normalize(risk.mitigation);

      const matchesFilter =
        filter === "all" ||
        (filter === "critical" && severity === "critical") ||
        (filter === "high" && severity === "high") ||
        (filter === "medium" && severity === "medium") ||
        (filter === "open" &&
          status !== "unknown" &&
          !isTerminalStatus(risk.status)) ||
        (filter === "overdue" && isOverdue(risk)) ||
        (filter === "unassigned" &&
          (!owner || owner === "unassigned")) ||
        (filter === "no mitigation" &&
          (!mitigation ||
            mitigation.includes("not documented") ||
            mitigation.includes("missing"))) ||
        (filter === "unknown" &&
          (severity === "unknown" || status === "unknown"));

      if (!matchesFilter) return false;

      const haystack = normalize(
        [
          risk.title,
          risk.category,
          risk.severity,
          risk.status,
          risk.owner,
          risk.mitigation,
          risk.source,
          risk.dueDate,
        ]
          .filter(hasValue)
          .join(" ")
      );

      return !search || haystack.includes(search);
    });
  }, [rows, filter, query]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  return (
    <section className="space-y-4">
      {!compact ? (
        <>
          <header className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
            <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <div className="bg-[#123865] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <HeaderChip icon={ShieldAlert} label="Risk Register" />
                  <HeaderChip icon={ShieldCheck} label="Mitigation Evidence" />
                </div>

                <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
                  Compliance Risk Control
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                  Review real compliance risks, severity, ownership, mitigation
                  evidence and overdue actions. Unknown or incomplete records
                  stay visibly incomplete instead of being normalised into a
                  healthy risk register.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <DarkMetric label="Risks" value={stats.total} />
                  <DarkMetric
                    label="High/Critical"
                    value={stats.critical + stats.high}
                  />
                  <DarkMetric label="Overdue" value={stats.overdue} />
                  <DarkMetric label="Unassigned" value={stats.unassigned} />
                </div>
              </div>

              <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      Mitigation quality
                    </p>

                    <p className="mt-2 text-4xl font-black text-white">
                      {stats.missingMitigation}
                    </p>

                    <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                      risks missing mitigation detail
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                    <AlertTriangle size={22} />
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
                  <p className="text-xs font-black text-white">
                    A risk is not controlled merely because it exists in the register.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
            <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                      filter === item
                        ? "border-[#123865] bg-[#123865] text-white"
                        : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4EA]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search risk, category, owner, status, mitigation..."
                  aria-label="Search compliance risks"
                  className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
                />

                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear risk search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={AlertTriangle}
              label="Critical"
              value={stats.critical}
              detail="Risks explicitly classified Critical."
              tone="red"
            />
            <MetricCard
              icon={ShieldAlert}
              label="High"
              value={stats.high}
              detail="Risks explicitly classified High."
              tone="orange"
            />
            <MetricCard
              icon={Clock3}
              label="Overdue"
              value={stats.overdue}
              detail="Non-terminal risks past their mitigation due date."
              tone="blue"
            />
            <MetricCard
              icon={UserRound}
              label="Unassigned"
              value={stats.unassigned}
              detail="Risk records without a real owner."
              tone="navy"
            />
          </div>
        </>
      ) : null}

      <section
        className={`overflow-hidden rounded-[1.65rem] border-[3px] ${
          compact
            ? "border-[#F97316] bg-[#FFF8EF]"
            : "border-[#234E78] bg-[#FFFDF8]"
        }`}
      >
        <SectionHeader
          eyebrow="Risk Evidence"
          title={compact ? "Risk Register Snapshot" : "Compliance Risks"}
          description={
            compact
              ? "Highest-value compliance risk evidence currently visible."
              : "Severity, ownership, mitigation and timing evidence from the connected risk register."
          }
          icon={ShieldAlert}
          count={visible.length}
        />

        <div className="p-4">
          {!rows.length ? (
            <EmptyState
              title="No compliance risk register connected"
              text="Risk entries will appear when real compliance-risk data is supplied."
            />
          ) : visible.length ? (
            <div className="space-y-3">
              {visible.map((risk) => (
                <RiskCard key={risk.id} risk={risk} compact={compact} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No risks match these filters"
              text="Clear the search or choose another risk filter."
              onClear={
                compact
                  ? undefined
                  : () => {
                      setFilter("all");
                      setQuery("");
                    }
              }
            />
          )}
        </div>
      </section>

      {!compact ? (
        <div className="grid gap-3 md:grid-cols-2">
          <GovernanceCard
            icon={ShieldCheck}
            title="Risk ownership"
            text="Unassigned risks remain unassigned. Compliance OS does not silently assign them to Admin."
            tone="blue"
          />
          <GovernanceCard
            icon={Info}
            title="Risk status integrity"
            text="Unknown status is not counted as Open. Overdue requires both a real due date and a non-terminal status."
            tone="orange"
          />
        </div>
      ) : null}
    </section>
  );
}

function RiskCard({ risk, compact }) {
  const overdue = isOverdue(risk);
  const noMitigation =
    !normalize(risk.mitigation) ||
    normalize(risk.mitigation).includes("not documented") ||
    normalize(risk.mitigation).includes("missing");

  return (
    <article
      className={`rounded-[1.25rem] border-2 p-4 ${
        overdue
          ? "border-red-300 bg-red-50"
          : "border-[#C9D7E6] bg-white"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(210px,0.5fr)_auto] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">
              {risk.title || "Untitled compliance risk"}
            </p>

            {overdue ? (
              <span className="rounded-lg border-2 border-red-300 bg-red-50 px-2 py-1 text-[8px] font-black uppercase text-red-800">
                Overdue
              </span>
            ) : null}

            {noMitigation ? (
              <span className="rounded-lg border-2 border-[#F97316] bg-[#FFF4EA] px-2 py-1 text-[8px] font-black uppercase text-[#B84F0E]">
                No mitigation
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-600">
            {risk.category || "Unclassified"} · Owner:{" "}
            {risk.owner || "Unassigned"}
          </p>

          {!compact ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {risk.mitigation || "Mitigation not documented."}
            </p>
          ) : null}

          {!compact && risk.source ? (
            <span className="mt-3 inline-flex rounded-md border border-[#C9D7E6] bg-[#F7FAFC] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
              Source: {risk.source}
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-black text-[#10233F]">
            {formatDate(risk.dueDate)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            Mitigation due date
          </p>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <span
            className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${severityTone(risk.severity)}`}
          >
            {risk.severity || "Unknown"}
          </span>

          <span
            className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusTone(risk.status)}`}
          >
            {risk.status || "Unknown"}
          </span>
        </div>
      </div>
    </article>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {Number(value || 0).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-4 text-white">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
          {count}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {Number(value || 0).toLocaleString("en-GB")}
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function GovernanceCard({ icon: Icon, title, text, tone }) {
  return (
    <article className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {text}
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-[#C9D7E6] bg-[#F7FAFC] p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-[#F97316] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4EA]"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA]";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#F2F7FF]";
}
