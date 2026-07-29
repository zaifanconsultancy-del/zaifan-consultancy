import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  Funnel,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value ?? "").trim().toLowerCase();
}

function money(value, currency = "PKR") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function getPartnerName(item = {}) {
  return (
    item.name ||
    item.partner ||
    item.partner_name ||
    item.partnerName ||
    item.organization_name ||
    item.organizationName ||
    "Unnamed partner"
  );
}

function getLeads(item = {}) {
  return safeNumber(
    item.leads ??
      item.referred_leads ??
      item.referredLeads ??
      item.lead_count ??
      item.leadCount
  );
}

function getQualified(item = {}) {
  return safeNumber(
    item.qualified ??
      item.qualified_leads ??
      item.qualifiedLeads ??
      item.qualified_count ??
      item.qualifiedCount
  );
}

function getApplications(item = {}) {
  return safeNumber(
    item.applications ??
      item.application_count ??
      item.applicationCount
  );
}

function getOffers(item = {}) {
  return safeNumber(
    item.offers ??
      item.offer_count ??
      item.offerCount
  );
}

function getEnrolled(item = {}) {
  return safeNumber(
    item.enrolled ??
      item.enrollments ??
      item.enrolled_students ??
      item.enrolledStudents
  );
}

function getRevenue(item = {}) {
  return safeNumber(
    item.revenue ??
      item.partner_revenue ??
      item.partnerRevenue ??
      item.collected_revenue ??
      item.collectedRevenue
  );
}

function getCurrency(item = {}) {
  return (
    item.currency ||
    item.currency_code ||
    item.currencyCode ||
    "PKR"
  );
}

function funnelConversion(current, previous) {
  const a = safeNumber(current);
  const b = safeNumber(previous);

  if (b <= 0) return null;
  return Math.round((a / b) * 100);
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
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${
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
    </article>
  );
}

function FunnelRow({ label, value, previous, max, index }) {
  const conversion =
    index === 0 ? null : funnelConversion(value, previous);

  const width =
    max > 0
      ? Math.max(value > 0 ? 4 : 0, Math.round((value / max) * 100))
      : 0;

  return (
    <div className="rounded-[1.2rem] border-2 border-[#C9D7E6] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">{label}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {index === 0
              ? "Entry stage"
              : conversion === null
                ? "Conversion not measured"
                : `${percent(conversion)} from previous stage`}
          </p>
        </div>

        <p className="text-lg font-black text-[#10233F]">{value}</p>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#DDE7F0]">
        {width > 0 ? (
          <div
            className="h-full rounded-full bg-[#123865] transition-[width] duration-500"
            style={{ width: `${width}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function RevenueRow({ item, max }) {
  const revenue = safeNumber(item.revenue);
  const width =
    max > 0
      ? Math.max(revenue > 0 ? 4 : 0, Math.round((revenue / max) * 100))
      : 0;

  return (
    <div className="rounded-[1.2rem] border-2 border-[#C9D7E6] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-[#10233F]">
            {item.label}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {item.students} student{item.students === 1 ? "" : "s"}
          </p>
        </div>

        <p className="shrink-0 text-xs font-black text-[#10233F]">
          {money(revenue, item.currency)}
        </p>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#DDE7F0]">
        {width > 0 ? (
          <div
            className="h-full rounded-full bg-[#FF5A0A] transition-[width] duration-500"
            style={{ width: `${width}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function PartnerAnalytics({
  compact = false,
  partners = [],
  records = [],
  analytics = {},
}) {
  const partnerRows = useMemo(
    () => safeArray(partners),
    [partners]
  );

  const analyticsRecords = useMemo(
    () => safeArray(records),
    [records]
  );

  const funnel = useMemo(() => {
    const explicit = safeArray(
      analytics.funnel ||
        analytics.funnels ||
        analytics.partnerFunnel
    );

    if (explicit.length) {
      return explicit.map((item, index) => ({
        key: item.key || item.label || `stage-${index}`,
        label: item.label || item.name || `Stage ${index + 1}`,
        value: safeNumber(item.value ?? item.count),
      }));
    }

    const leads = partnerRows.reduce(
      (sum, item) => sum + getLeads(item),
      0
    );
    const qualified = partnerRows.reduce(
      (sum, item) => sum + getQualified(item),
      0
    );
    const applications = partnerRows.reduce(
      (sum, item) => sum + getApplications(item),
      0
    );
    const offers = partnerRows.reduce(
      (sum, item) => sum + getOffers(item),
      0
    );
    const enrolled = partnerRows.reduce(
      (sum, item) => sum + getEnrolled(item),
      0
    );

    const rows = [
      { key: "leads", label: "Referred Leads", value: leads },
      { key: "qualified", label: "Qualified Leads", value: qualified },
      { key: "applications", label: "Applications", value: applications },
      { key: "offers", label: "Offers", value: offers },
      { key: "enrolled", label: "Enrolled", value: enrolled },
    ];

    return rows.filter((item, index) => {
      if (index === 0) return true;
      return item.value > 0 || rows[index - 1]?.value > 0;
    });
  }, [analytics, partnerRows]);

  const revenueTrend = useMemo(() => {
    const explicit = safeArray(
      analytics.revenueTrend ||
        analytics.trends ||
        analytics.partnerRevenueTrend
    );

    if (explicit.length) {
      return explicit
        .map((item, index) => ({
          key: item.id || item.month || item.label || `trend-${index}`,
          label: item.month || item.label || item.period || `Period ${index + 1}`,
          revenue: safeNumber(item.revenue ?? item.amount),
          students: safeNumber(
            item.students ??
              item.student_count ??
              item.studentCount
          ),
          currency: getCurrency(item),
        }))
        .filter((item) => item.revenue > 0 || item.students > 0);
    }

    return analyticsRecords
      .map((item, index) => ({
        key: item.id || item.month || item.label || `record-${index}`,
        label:
          item.month ||
          item.label ||
          item.period ||
          getPartnerName(item),
        revenue: getRevenue(item),
        students: safeNumber(
          item.students ??
            item.student_count ??
            item.studentCount ??
            item.enrolled ??
            item.enrollments
        ),
        currency: getCurrency(item),
      }))
      .filter((item) => item.revenue > 0 || item.students > 0);
  }, [analytics, analyticsRecords]);

  const revenueCurrencies = useMemo(
    () =>
      new Set(
        revenueTrend
          .filter((item) => item.revenue > 0)
          .map((item) => item.currency)
      ),
    [revenueTrend]
  );

  const totalRevenue =
    revenueCurrencies.size === 1
      ? revenueTrend.reduce(
          (sum, item) => sum + safeNumber(item.revenue),
          0
        )
      : null;

  const totalStudents = revenueTrend.reduce(
    (sum, item) => sum + safeNumber(item.students),
    0
  );

  const maxRevenue = Math.max(
    ...revenueTrend.map((item) => safeNumber(item.revenue)),
    0
  );

  const maxFunnel = Math.max(
    ...funnel.map((item) => safeNumber(item.value)),
    0
  );

  const endToEnd =
    funnel.length > 1 && safeNumber(funnel[0]?.value) > 0
      ? funnelConversion(
          funnel[funnel.length - 1]?.value,
          funnel[0]?.value
        )
      : null;

  const measurableTransitions = funnel
    .slice(1)
    .map((item, index) => ({
      from: funnel[index]?.label,
      to: item.label,
      rate: funnelConversion(item.value, funnel[index]?.value),
    }))
    .filter((item) => item.rate !== null);

  const weakestTransition = measurableTransitions.length
    ? [...measurableTransitions].sort(
        (a, b) => safeNumber(a.rate) - safeNumber(b.rate)
      )[0]
    : null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <BarChart3 size={12} />
            Partner Analytics
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Partner Funnel & Contribution
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Referral movement and partner contribution now come from real partner
            records or explicit analytics evidence. No fabricated monthly revenue,
            student counts or strategic recommendations are preloaded.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            End-to-End Funnel
          </p>

          <p className="mt-2 text-3xl font-black">
            {endToEnd === null ? "Not measured" : percent(endToEnd)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {endToEnd === null
              ? "Needs a valid entry stage and downstream partner outcome."
              : `${safeNumber(funnel[funnel.length - 1]?.value)} final-stage records from ${safeNumber(funnel[0]?.value)} entry records.`}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Evidence-led analytics
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Funnel Stages"
              value={funnel.length}
              helper="Partner funnel stages with current evidence."
              tone="navy"
              icon={Funnel}
            />

            <MetricCard
              label="Entry Records"
              value={safeNumber(funnel[0]?.value)}
              helper="Partner-attributed records in the first funnel stage."
              tone="blue"
              icon={UsersRound}
            />

            <MetricCard
              label="Revenue Evidence"
              value={
                totalRevenue === null
                  ? revenueTrend.some((item) => item.revenue > 0)
                    ? "Mixed currencies"
                    : "—"
                  : money(totalRevenue, [...revenueCurrencies][0] || "PKR")
              }
              helper={
                totalRevenue === null
                  ? revenueTrend.some((item) => item.revenue > 0)
                    ? "Revenue exists across multiple currencies and is not combined."
                    : "No partner revenue trend evidence yet."
                  : "Total across explicit revenue-trend records."
              }
              tone="green"
              icon={CircleDollarSign}
            />

            <MetricCard
              label="Weakest Transition"
              value={
                weakestTransition
                  ? percent(weakestTransition.rate)
                  : "—"
              }
              helper={
                weakestTransition
                  ? `${weakestTransition.from} → ${weakestTransition.to}`
                  : "No measurable stage transition yet."
              }
              tone={weakestTransition ? "amber" : "blue"}
              icon={Target}
              badge={
                weakestTransition ? "Measured" : "Not measured"
              }
            />
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Partner Funnel
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Referral-to-outcome movement from real partner evidence.
              </p>
            </div>

            <div className="space-y-3">
              {funnel.length ? (
                funnel.map((item, index) => (
                  <FunnelRow
                    key={item.key}
                    label={item.label}
                    value={item.value}
                    previous={index === 0 ? null : funnel[index - 1]?.value}
                    max={maxFunnel}
                    index={index}
                  />
                ))
              ) : (
                <div className="rounded-[1.2rem] border-2 border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-6 text-center">
                  <Funnel size={22} className="mx-auto text-orange-700" />
                  <p className="mt-3 font-black text-[#10233F]">
                    No partner funnel evidence yet
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    Partner funnel analytics will appear when referred leads,
                    applications, offers or enrolled outcomes are connected.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Revenue / Student Contribution
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Contribution trend from explicit analytics records only.
              </p>
            </div>

            <div className="space-y-3">
              {revenueTrend.length ? (
                revenueTrend.map((item) => (
                  <RevenueRow
                    key={item.key}
                    item={item}
                    max={maxRevenue}
                  />
                ))
              ) : (
                <div className="rounded-[1.2rem] border-2 border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-6 text-center">
                  <TrendingUp size={22} className="mx-auto text-orange-700" />
                  <p className="mt-3 font-black text-[#10233F]">
                    No contribution trend yet
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    Monthly or period-based partner revenue/student analytics are
                    not fabricated when no real trend data exists.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Funnel Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No invented referral funnel
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Funnel stages are derived from real partner records or explicit
                    analytics input only.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Activity size={17} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Trend Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Missing months stay missing
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Partner OS no longer creates January-to-June revenue growth
                    simply to make analytics look complete.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Insight Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No automatic fake strategy advice
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Recommendations should come from real measured partner evidence,
                    not hardcoded claims about Gold agents, UK universities or
                    September intakes.
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
