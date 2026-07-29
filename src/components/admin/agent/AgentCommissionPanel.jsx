import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  ClipboardCheck,
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Not recorded";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function statusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("paid") ||
    value.includes("settled") ||
    value.includes("released") ||
    value.includes("cleared")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("pending") ||
    value.includes("due") ||
    value.includes("review")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("reject") ||
    value.includes("failed") ||
    value.includes("blocked")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    value.includes("not recorded") ||
    value.includes("no commission")
  ) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function CommissionRow({ row, compact }) {
  const hasEvidence = Boolean(row.hasCommissionEvidence);
  const confirmed = Boolean(row.identityConfirmed);

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-4"
            : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_11rem] xl:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
              <Banknote size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words font-black text-[#10233F]">
                {row.agent}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {safeNumber(row.leads)} lead{safeNumber(row.leads) === 1 ? "" : "s"} ·{" "}
                {safeNumber(row.visas)} visa{safeNumber(row.visas) === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
                confirmed
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                  : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
              }`}
            >
              {confirmed ? "Confirmed agent" : "Observed source"}
            </span>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
                hasEvidence
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                  : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
              }`}
            >
              {hasEvidence
                ? "Commission evidence"
                : "No commission evidence"}
            </span>
          </div>
        </div>

        <div className={compact ? "grid grid-cols-2 gap-2" : ""}>
          <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Revenue
            </p>
            <p className="mt-1 text-sm font-black text-[#10233F]">
              {money(row.revenue)}
            </p>
          </div>

          {compact ? (
            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Claim / Due
              </p>
              <p className="mt-1 text-sm font-black text-[#10233F]">
                {money(row.commissionDue)}
              </p>
            </div>
          ) : null}
        </div>

        {!compact ? (
          <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Claim / Due
            </p>
            <p className="mt-1 text-sm font-black text-[#10233F]">
              {money(row.commissionDue)}
            </p>
          </div>
        ) : null}

        <div className="flex items-start xl:justify-end">
          <span
            className={`inline-flex w-fit rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.07em] ${statusTone(
              row.status
            )}`}
          >
            {row.status || "Not recorded"}
          </span>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Commission interpretation
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {!confirmed
              ? "This source is not backed by a confirmed agent identity yet, so any commission handling should be reconciled before payout."
              : !hasEvidence
                ? "No agent commission record is linked. Zaifan will not estimate commission from revenue or visa volume."
                : safeNumber(row.commissionDue) > 0
                  ? "A recorded commission amount exists and remains subject to the connected approval/payment workflow."
                  : "Commission evidence exists with no amount currently due."}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function AgentCommissionPanel({
  agentOS = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [identityFilter, setIdentityFilter] = useState("all");

  const rows = safeArray(agentOS.commissions);

  const filtered = useMemo(() => {
    const search = lower(query);

    return rows.filter((row) => {
      const hasEvidence = Boolean(row.hasCommissionEvidence);
      const confirmed = Boolean(row.identityConfirmed);

      if (
        evidenceFilter === "recorded" &&
        !hasEvidence
      ) {
        return false;
      }

      if (
        evidenceFilter === "missing" &&
        hasEvidence
      ) {
        return false;
      }

      if (
        identityFilter === "confirmed" &&
        !confirmed
      ) {
        return false;
      }

      if (
        identityFilter === "observed" &&
        confirmed
      ) {
        return false;
      }

      if (!search) return true;

      return [
        row.agent,
        row.status,
        row.revenue,
        row.commissionDue,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [
    rows,
    query,
    evidenceFilter,
    identityFilter,
  ]);

  const visible = compact
    ? filtered.slice(0, 5)
    : filtered;

  const recordedRows = rows.filter(
    (row) => row.hasCommissionEvidence
  );

  const missingRows = rows.filter(
    (row) => !row.hasCommissionEvidence
  );

  const confirmedRows = rows.filter(
    (row) => row.identityConfirmed
  );

  const pendingRows = recordedRows.filter((row) =>
    lower(row.status).includes("pending")
  );

  const totalRecordedDue = recordedRows.length
    ? recordedRows.reduce(
        (sum, row) => sum + safeNumber(row.commissionDue),
        0
      )
    : null;

  const filtersActive =
    Boolean(query.trim()) ||
    evidenceFilter !== "all" ||
    identityFilter !== "all";

  function clearFilters() {
    setQuery("");
    setEvidenceFilter("all");
    setIdentityFilter("all");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <WalletCards size={12} />
            Agent Commission Claims
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Individual Commission Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Individual agent commission evidence, claim visibility and payout
            status. Commercial agreements and partner-wide commission structure
            remain in Partner OS.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Recorded Claims
          </p>

          <p className="mt-2 text-3xl font-black">
            {recordedRows.length}/{rows.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {pendingRows.length} pending · {missingRows.length} without commission evidence.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            No estimated commission
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Confirmed Agents"
              value={confirmedRows.length}
              helper="Commission rows tied to confirmed agent identities."
              tone="navy"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Recorded Claims"
              value={recordedRows.length}
              helper="Agent rows with explicit commission evidence."
              tone="green"
              icon={ClipboardCheck}
            />

            <MetricCard
              label="Pending Claims"
              value={pendingRows.length}
              helper="Recorded commission rows still awaiting review or settlement."
              tone={pendingRows.length ? "amber" : "green"}
              icon={AlertTriangle}
            />

            <MetricCard
              label="Recorded Due"
              value={money(totalRecordedDue)}
              helper={
                totalRecordedDue === null
                  ? "No commission amount evidence exists yet."
                  : "Sum of explicitly recorded agent commission amounts."
              }
              tone={totalRecordedDue === null ? "blue" : "violet"}
              icon={Banknote}
              badge={
                totalRecordedDue === null
                  ? "Not recorded"
                  : "Recorded"
              }
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agent or claim state..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
              />
            </label>

            <select
              value={evidenceFilter}
              onChange={(event) =>
                setEvidenceFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All evidence</option>
              <option value="recorded">Recorded claims</option>
              <option value="missing">Missing claims</option>
            </select>

            <select
              value={identityFilter}
              onChange={(event) =>
                setIdentityFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All identities</option>
              <option value="confirmed">Confirmed agents</option>
              <option value="observed">Observed sources</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {visible.length ? (
            visible.map((row, index) => (
              <CommissionRow
                key={row.id || `${row.agent}-${index}`}
                row={row}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <WalletCards size={24} className="mx-auto text-orange-700" />

              <p className="mt-3 font-black text-[#10233F]">
                {rows.length
                  ? "No agent commission rows match these filters."
                  : "No agent commission evidence yet."}
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {rows.length
                  ? "Clear or change the commission filters."
                  : "Connect genuine agent commission records before Agent Operations reports individual claims or payout amounts."}
              </p>
            </div>
          )}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Claim Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No revenue-based estimation
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Agent Operations never guesses a commission percentage from
                    revenue, visa count or lead volume.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Identity Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Unconfirmed source ≠ payable agent
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A referral name should be reconciled to a confirmed agent
                    identity before payout decisions are made.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    System Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Agent claim ≠ Partner commission policy
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Partner OS owns commercial agreements and commission
                    structure. This page only shows individual agent-level
                    evidence and claim state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
