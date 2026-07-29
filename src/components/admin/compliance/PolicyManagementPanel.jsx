// PolicyManagementPanel V3 EXTREME — Zaifan Compliance OS
// Full replacement for:
// src/components/admin/compliance/PolicyManagementPanel.jsx

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  FileQuestion,
  Info,
  Search,
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

function isReviewOverdue(policy = {}) {
  if (!policy.nextReview) return false;
  const time = new Date(policy.nextReview).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function acknowledgementValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid review date";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "Invalid review date";
  }
}

function statusTone(status = "") {
  const value = normalize(status);

  if (value.includes("approved") || value.includes("active")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }
  if (value.includes("draft")) {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }
  if (value.includes("review") || value.includes("pending")) {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }
  if (
    value.includes("expired") ||
    value.includes("retired") ||
    value.includes("rejected")
  ) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

export default function PolicyManagementPanel({
  compliance = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(
    () => safeArray(compliance.policyRows),
    [compliance.policyRows]
  );

  const stats = useMemo(() => {
    const approved = rows.filter((policy) => {
      const status = normalize(policy.status);
      return status.includes("approved") || status.includes("active");
    }).length;

    const overdue = rows.filter(isReviewOverdue).length;

    const unscheduled = rows.filter((policy) => !policy.nextReview).length;

    const unassigned = rows.filter((policy) => {
      const owner = normalize(policy.owner);
      return !owner || owner === "unassigned";
    }).length;

    const unknownStatus = rows.filter(
      (policy) => normalize(policy.status) === "unknown"
    ).length;

    const knownAcknowledgement = rows.filter(
      (policy) => acknowledgementValue(policy.acknowledgementRate) !== null
    );

    const averageAcknowledgement = knownAcknowledgement.length
      ? Math.round(
          knownAcknowledgement.reduce(
            (sum, policy) =>
              sum + acknowledgementValue(policy.acknowledgementRate),
            0
          ) / knownAcknowledgement.length
        )
      : null;

    return {
      total: rows.length,
      approved,
      overdue,
      unscheduled,
      unassigned,
      unknownStatus,
      averageAcknowledgement,
      acknowledgementEvidence: knownAcknowledgement.length,
    };
  }, [rows]);

  const filters = [
    "all",
    "approved",
    "draft",
    "review",
    "overdue",
    "unscheduled",
    "unassigned",
    "unknown",
  ];

  const filtered = useMemo(() => {
    const search = normalize(query);

    return rows.filter((policy) => {
      const status = normalize(policy.status);
      const owner = normalize(policy.owner);

      const matchesFilter =
        filter === "all" ||
        (filter === "approved" &&
          (status.includes("approved") || status.includes("active"))) ||
        (filter === "draft" && status.includes("draft")) ||
        (filter === "review" &&
          (status.includes("review") || status.includes("pending"))) ||
        (filter === "overdue" && isReviewOverdue(policy)) ||
        (filter === "unscheduled" && !policy.nextReview) ||
        (filter === "unassigned" &&
          (!owner || owner === "unassigned")) ||
        (filter === "unknown" && status === "unknown");

      if (!matchesFilter) return false;

      const haystack = normalize(
        [
          policy.title,
          policy.category,
          policy.owner,
          policy.status,
          policy.version,
          policy.source,
          policy.nextReview,
        ]
          .filter(Boolean)
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
          <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_16px_42px_rgba(23,36,61,0.07)]">
            <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <div className="bg-[#123865] p-5 text-white sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <HeaderChip icon={BookOpenCheck} label="Policy Management" />
                  <HeaderChip icon={ShieldCheck} label="Governance Evidence" />
                </div>

                <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
                  Policy Governance Library
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                  Review real policy status, ownership, versions, review dates
                  and acknowledgement evidence. Missing policy metadata remains
                  visible instead of being converted into an approved policy.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <DarkMetric label="Policies" value={stats.total} />
                  <DarkMetric label="Approved/Active" value={stats.approved} />
                  <DarkMetric label="Overdue" value={stats.overdue} />
                  <DarkMetric label="Unscheduled" value={stats.unscheduled} />
                </div>
              </div>

              <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      Acknowledgement evidence
                    </p>

                    <p className="mt-2 text-4xl font-black text-white">
                      {stats.averageAcknowledgement === null
                        ? "N/A"
                        : `${stats.averageAcknowledgement}%`}
                    </p>

                    <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                      {stats.acknowledgementEvidence}/{stats.total} policies measurable
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                    <CheckCircle2 size={22} />
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
                  <p className="text-xs font-black text-white">
                    No acknowledgement percentage is invented when evidence is missing.
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EF] p-3">
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
                        : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
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
                  placeholder="Search policy, category, owner, version, status..."
                  aria-label="Search policies"
                  className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear policy search"
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
              icon={CalendarClock}
              label="Overdue Reviews"
              value={stats.overdue}
              detail="Policies with a real review date that has passed."
              tone="red"
            />
            <MetricCard
              icon={FileQuestion}
              label="No Review Date"
              value={stats.unscheduled}
              detail="Policies without a scheduled next review."
              tone="orange"
            />
            <MetricCard
              icon={UserRound}
              label="Unassigned"
              value={stats.unassigned}
              detail="Policies without a supplied governance owner."
              tone="blue"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Unknown Status"
              value={stats.unknownStatus}
              detail="Policies whose lifecycle status is not known."
              tone="navy"
            />
          </div>
        </>
      ) : null}

      <section
        className={`overflow-hidden rounded-[1.65rem] border-[3px] ${
          compact
            ? "border-orange-400 bg-[#FFF8EF]"
            : "border-[#234E78] bg-[#FFFDF8]"
        }`}
      >
        <SectionHeader
          eyebrow="Policy Evidence"
          title={compact ? "Policy Governance Snapshot" : "Policy Library"}
          description={
            compact
              ? "Governance evidence currently visible in Compliance OS."
              : "Policy lifecycle, ownership, review and acknowledgement evidence."
          }
          icon={BookOpenCheck}
          count={visible.length}
        />

        <div className="p-4">
          {!rows.length ? (
            <EmptyState
              title="No policy evidence connected"
              text="Policies will appear here when real company policy records are supplied."
            />
          ) : visible.length ? (
            <div className="space-y-3">
              {visible.map((policy) => (
                <PolicyCard
                  key={policy.id}
                  policy={policy}
                  compact={compact}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No policies match these filters"
              text="Clear the search or choose another policy filter."
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
            title="Policy status integrity"
            text="Missing status remains Unknown. Compliance OS does not silently label a policy Active or Approved."
            tone="blue"
          />
          <GovernanceCard
            icon={Info}
            title="Acknowledgement boundary"
            text="A percentage is shown only when the source supplies measurable acknowledgement evidence. Policy existence alone proves nothing about staff acknowledgement."
            tone="orange"
          />
        </div>
      ) : null}
    </section>
  );
}

function PolicyCard({ policy, compact }) {
  const overdue = isReviewOverdue(policy);
  const acknowledgement = acknowledgementValue(policy.acknowledgementRate);

  return (
    <article
      className={`rounded-[1.25rem] border-2 p-4 ${
        overdue
          ? "border-red-300 bg-red-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.5fr)_auto] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">
              {policy.title || "Untitled policy"}
            </p>

            {overdue ? (
              <span className="rounded-lg border-2 border-red-300 bg-red-50 px-2 py-1 text-[8px] font-black uppercase text-red-800">
                Review overdue
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-600">
            {policy.category || "Unclassified"} · Version{" "}
            {policy.version || "Unknown"}
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            Owner: {policy.owner || "Unassigned"}
          </p>

          {!compact && policy.source ? (
            <span className="mt-3 inline-flex rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
              Source: {policy.source}
            </span>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-black text-[#10233F]">
            {formatDate(policy.nextReview)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            Next review
          </p>

          <p className="mt-2 text-[10px] font-black text-[#10233F]">
            Acknowledgement:{" "}
            {acknowledgement === null ? "Not measured" : `${acknowledgement}%`}
          </p>
        </div>

        <span
          className={`w-fit rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusTone(policy.status)}`}
        >
          {policy.status || "Unknown"}
        </span>
      </div>

      {!compact && acknowledgement !== null ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
              Recorded acknowledgement
            </span>
            <span className="text-xs font-black text-[#10233F]">
              {acknowledgement}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-500"
              style={{ width: `${acknowledgement}%` }}
            />
          </div>
        </div>
      ) : null}
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

function SectionHeader({ eyebrow, title, description, icon: Icon, count }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white">
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
    <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}
