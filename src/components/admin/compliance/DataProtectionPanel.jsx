// DataProtectionPanel V3 EXTREME — Zaifan Compliance OS
// Full replacement for:
// src/components/admin/compliance/DataProtectionPanel.jsx
//
// Production principles:
// - no blanket "high sensitivity" assumptions without evidence
// - no pretending that a consent record means valid consent coverage
// - classify document sensitivity carefully and show unknowns honestly
// - highlight missing/expired/review-required privacy records
// - unified Zaifan navy/orange/cream Compliance OS visual language

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Info,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserCheck,
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

function isSensitive(value = "") {
  return ["critical", "high"].includes(normalize(value));
}

function isMissingLike(status = "") {
  const value = normalize(status);
  return (
    value.includes("missing") ||
    value.includes("expired") ||
    value.includes("revoked") ||
    value.includes("invalid") ||
    value.includes("rejected")
  );
}

function isReviewLike(status = "") {
  const value = normalize(status);
  return value.includes("review") || value.includes("pending");
}

function sensitivityTone(value = "") {
  const clean = normalize(value);

  if (clean === "critical") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (clean === "high") {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }

  if (clean === "medium") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (clean === "low") {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function statusTone(status = "") {
  const value = normalize(status);

  if (
    value.includes("approved") ||
    value.includes("captured") ||
    value.includes("stored") ||
    value.includes("valid") ||
    value.includes("active")
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (isMissingLike(status)) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (isReviewLike(status)) {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

export default function DataProtectionPanel({
  compliance = {},
  compact = false,
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => safeArray(compliance.dataRows),
    [compliance.dataRows]
  );

  const stats = useMemo(() => {
    const documents = rows.filter(
      (item) => normalize(item.type) === "document"
    ).length;

    const consents = rows.filter(
      (item) => normalize(item.type) === "consent"
    ).length;

    const sensitive = rows.filter((item) =>
      isSensitive(item.sensitivity)
    ).length;

    const unclassified = rows.filter(
      (item) => normalize(item.sensitivity) === "unclassified"
    ).length;

    const attention = rows.filter(
      (item) => isMissingLike(item.status) || isReviewLike(item.status)
    ).length;

    const consentValid = rows.filter(
      (item) =>
        normalize(item.type) === "consent" &&
        !isMissingLike(item.status) &&
        !isReviewLike(item.status) &&
        normalize(item.status) !== "unknown"
    ).length;

    return {
      total: rows.length,
      documents,
      consents,
      sensitive,
      unclassified,
      attention,
      consentValid,
    };
  }, [rows]);

  const filters = [
    "all",
    "document",
    "consent",
    "critical",
    "high",
    "attention",
    "unclassified",
  ];

  const filtered = useMemo(() => {
    const search = normalize(query);

    return rows.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "document" &&
          normalize(item.type) === "document") ||
        (filter === "consent" &&
          normalize(item.type) === "consent") ||
        (filter === "critical" &&
          normalize(item.sensitivity) === "critical") ||
        (filter === "high" &&
          normalize(item.sensitivity) === "high") ||
        (filter === "attention" &&
          (isMissingLike(item.status) || isReviewLike(item.status))) ||
        (filter === "unclassified" &&
          normalize(item.sensitivity) === "unclassified");

      if (!matchesFilter) return false;

      const haystack = normalize(
        [
          item.title,
          item.type,
          item.category,
          item.owner,
          item.status,
          item.sensitivity,
          item.source,
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
                  <HeaderChip icon={LockKeyhole} label="Data Protection" />
                  <HeaderChip icon={ShieldCheck} label="Privacy Evidence" />
                </div>

                <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
                  Privacy & Sensitive Data Control
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                  Review student documents, consent records, sensitivity
                  classifications and privacy attention signals without
                  pretending that storage alone proves compliance.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <DarkMetric label="Data Records" value={stats.total} />
                  <DarkMetric label="Sensitive" value={stats.sensitive} />
                  <DarkMetric label="Attention" value={stats.attention} />
                  <DarkMetric label="Unclassified" value={stats.unclassified} />
                </div>
              </div>

              <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      Consent evidence
                    </p>

                    <p className="mt-2 text-4xl font-black text-white">
                      {stats.consentValid}
                    </p>

                    <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                      consent records without obvious attention status
                    </p>
                  </div>

                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                    <UserCheck size={22} />
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
                  <p className="text-xs font-black text-white">
                    Consent record ≠ full consent compliance
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                    Validity, purpose, retention and withdrawal must eventually
                    be measured separately.
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
                  placeholder="Search document, consent, owner, category, status..."
                  aria-label="Search Data Protection"
                  className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />

                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear data protection search"
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
              icon={FileText}
              label="Documents"
              value={stats.documents}
              detail="Document records currently supplied to Compliance OS."
              tone="blue"
            />
            <MetricCard
              icon={UserCheck}
              label="Consent Records"
              value={stats.consents}
              detail="Consent evidence currently supplied."
              tone="navy"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Privacy Attention"
              value={stats.attention}
              detail="Missing, expired, revoked, invalid, rejected or review/pending records."
              tone="red"
            />
            <MetricCard
              icon={Database}
              label="Unclassified"
              value={stats.unclassified}
              detail="Data records without a known sensitivity class."
              tone="orange"
            />
          </div>
        </>
      ) : null}

      <section className={`overflow-hidden rounded-[1.65rem] border-[3px] ${
        compact ? "border-orange-400 bg-[#FFF8EF]" : "border-[#234E78] bg-[#FFFDF8]"
      }`}>
        <SectionHeader
          eyebrow="Privacy Inventory"
          title={compact ? "Sensitive Data Snapshot" : "Data & Consent Inventory"}
          description={
            compact
              ? "Highest-value privacy evidence currently visible."
              : "Documents and consent records with honest classification and status evidence."
          }
          icon={LockKeyhole}
          count={visible.length}
        />

        <div className="p-4">
          {!rows.length ? (
            <EmptyState
              title="No data-protection evidence connected"
              text="This panel will populate when student documents, consent records or other privacy evidence are supplied."
            />
          ) : visible.length ? (
            <div className="space-y-3">
              {visible.map((item) => (
                <DataRow key={item.id} item={item} compact={compact} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No privacy records match these filters"
              text="Clear the search or choose another data filter."
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
            title="Sensitivity classification"
            text="Explicit source classification is preferred. Name-based classification is only a fallback signal."
            tone="blue"
          />
          <GovernanceCard
            icon={Info}
            title="Compliance boundary"
            text="Data inventory shows what exists; it does not prove lawful basis, retention compliance, consent validity or access-control compliance."
            tone="orange"
          />
        </div>
      ) : null}
    </section>
  );
}

function DataRow({ item, compact }) {
  const needsAttention =
    isMissingLike(item.status) || isReviewLike(item.status);

  return (
    <article
      className={`rounded-[1.25rem] border-2 p-4 ${
        needsAttention
          ? "border-red-300 bg-red-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_auto_auto] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">
              {item.title || "Unnamed data record"}
            </p>

            {needsAttention ? (
              <span className="rounded-lg border-2 border-red-300 bg-red-50 px-2 py-1 text-[8px] font-black uppercase text-red-800">
                Attention
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-600">
            {item.type || "Unknown type"} · {item.category || "Unclassified"}
          </p>

          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            Owner: {item.owner || "Unassigned"}
          </p>

          {!compact && item.source ? (
            <span className="mt-3 inline-flex rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
              Source: {item.source}
            </span>
          ) : null}
        </div>

        <span className={`w-fit rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${sensitivityTone(item.sensitivity)}`}>
          {item.sensitivity || "Unclassified"}
        </span>

        <span className={`w-fit rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusTone(item.status)}`}>
          {item.status || "Unknown"}
        </span>
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
