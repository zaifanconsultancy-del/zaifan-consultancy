// BusinessForecastPanel V4 MAXIMUM — Founder Forecast Intelligence
// src/components/admin/BusinessForecastPanel.jsx
//
// Maximum pass:
// - preserves current growth prop API
// - keeps forecasting local/template-safe (no fake AI/GPT claim)
// - replaces fragile array-length assumptions with safer fallbacks
// - adds explicit model assumptions and confidence/readiness visibility
// - separates base pipeline from forecast output
// - adds forecast momentum and pipeline health calculations
// - prevents misleading projections when source data is effectively empty
// - stronger 30/60/90 comparison and revenue progression visibility
// - responsive mobile-safe forecast table
// - reduced-motion support
// - explicit white text on navy surfaces
// - denser Zaifan Admin OS visual hierarchy

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Landmark,
  LineChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, safeNumber(value)));
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function percentChange(current, previous) {
  const currentValue = safeNumber(current);
  const previousValue = safeNumber(previous);

  if (previousValue <= 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return Math.round(
    ((currentValue - previousValue) / previousValue) * 100
  );
}

function BusinessForecastPanel({ growth = {} }) {
  const shouldReduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const applications = safeArray(growth.applications).length;
    const offers = safeArray(growth.offers).length;
    const cas = safeArray(growth.casRecords).length;
    const visas = safeArray(growth.visas).length;
    const invoices = safeArray(growth.invoices);

    const invoicedRevenue = safeNumber(growth.invoicedRevenue);

    const averageInvoice =
      invoices.length > 0 && invoicedRevenue > 0
        ? invoicedRevenue / invoices.length
        : 1500;

    const expectedOffers30 = Math.round(applications * 0.25 + offers * 0.1);
    const expectedCAS30 = Math.round(offers * 0.3 + cas * 0.1);
    const expectedVisas30 = Math.round(cas * 0.25 + visas * 0.05);

    const expectedOffers60 = Math.round(applications * 0.45 + offers * 0.18);
    const expectedCAS60 = Math.round(offers * 0.5 + cas * 0.2);
    const expectedVisas60 = Math.round(cas * 0.45 + visas * 0.1);

    const expectedOffers90 = Math.round(applications * 0.65 + offers * 0.25);
    const expectedCAS90 = Math.round(offers * 0.7 + cas * 0.35);
    const expectedVisas90 = Math.round(cas * 0.65 + visas * 0.18);

    const revenue30 =
      expectedCAS30 * averageInvoice * 0.55 +
      expectedVisas30 * averageInvoice * 0.35;

    const revenue60 =
      expectedCAS60 * averageInvoice * 0.55 +
      expectedVisas60 * averageInvoice * 0.35;

    const revenue90 =
      expectedCAS90 * averageInvoice * 0.55 +
      expectedVisas90 * averageInvoice * 0.35;

    const totalPipelineRecords =
      applications + offers + cas + visas;

    const stageProgression =
      applications > 0
        ? clamp(
            Math.round(
              ((offers + cas * 1.5 + visas * 2) /
                Math.max(applications * 2.5, 1)) *
                100
            )
          )
        : 0;

    const dataReadinessSignals = [
      applications > 0,
      offers > 0,
      cas > 0,
      visas > 0,
      invoices.length > 0,
      invoicedRevenue > 0,
    ];

    const readinessScore = Math.round(
      (dataReadinessSignals.filter(Boolean).length /
        dataReadinessSignals.length) *
        100
    );

    const confidence =
      readinessScore >= 80
        ? "Higher"
        : readinessScore >= 50
        ? "Moderate"
        : "Low";

    const momentum30to60 = percentChange(revenue60, revenue30);
    const momentum60to90 = percentChange(revenue90, revenue60);

    return {
      applications,
      offers,
      cas,
      visas,
      invoices: invoices.length,
      invoicedRevenue,
      averageInvoice,
      expectedOffers30,
      expectedCAS30,
      expectedVisas30,
      expectedOffers60,
      expectedCAS60,
      expectedVisas60,
      expectedOffers90,
      expectedCAS90,
      expectedVisas90,
      revenue30,
      revenue60,
      revenue90,
      totalPipelineRecords,
      stageProgression,
      readinessScore,
      confidence,
      momentum30to60,
      momentum60to90,
      hasRealPipeline:
        applications > 0 ||
        offers > 0 ||
        cas > 0 ||
        visas > 0,
    };
  }, [growth]);

  const forecastCards = [
    {
      label: "30 Day Revenue",
      value: money(model.revenue30),
      helper: "Near-term weighted pipeline",
      tone: "orange",
      Icon: CircleDollarSign,
    },
    {
      label: "60 Day Revenue",
      value: money(model.revenue60),
      helper: `${model.momentum30to60 >= 0 ? "+" : ""}${model.momentum30to60}% vs 30D`,
      tone: "blue",
      Icon: TrendingUp,
    },
    {
      label: "90 Day Revenue",
      value: money(model.revenue90),
      helper: `${model.momentum60to90 >= 0 ? "+" : ""}${model.momentum60to90}% vs 60D`,
      tone: "emerald",
      Icon: LineChart,
    },
  ];

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
      className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.07)]"
    >
      <div className="grid xl:grid-cols-[1.18fr_0.82fr]">
        <div className="bg-[#123866] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <BarChart3 size={12} />
              Business Forecast
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <ShieldCheck size={12} />
              Template-Safe Model
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            30 / 60 / 90 Day Pipeline
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
            Founder-level weighted forecast using applications, offers, CAS,
            visas and invoice averages. It is directional planning guidance,
            not guaranteed revenue.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkStat label="Applications" value={model.applications} />
            <DarkStat label="Offers" value={model.offers} />
            <DarkStat label="CAS" value={model.cas} />
            <DarkStat label="Visas" value={model.visas} />
          </div>
        </div>

        <div className="bg-orange-500 p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
            Forecast Readiness
          </p>

          <div className="mt-3 flex items-end gap-2">
            <p className="text-5xl font-black leading-none text-white">
              {model.readinessScore}%
            </p>
            <p className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-white">
              {model.confidence} confidence
            </p>
          </div>

          <p className="mt-3 text-xs font-semibold leading-5 text-white">
            Confidence rises as more real pipeline and finance history becomes
            available.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <OrangeStat label="Avg Invoice" value={money(model.averageInvoice)} />
            <OrangeStat label="Pipeline Records" value={model.totalPipelineRecords} />
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-[#fff8ee] p-4 sm:p-5">
        {!model.hasRealPipeline ? (
          <ForecastWarning />
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {forecastCards.map((card, index) => (
            <ForecastCard
              key={card.label}
              {...card}
              index={index}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_0.72fr]">
          <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                  Pipeline Projection
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  Expected Stage Movement
                </h3>
              </div>

              <span className="inline-flex w-fit rounded-full border-2 border-slate-300 bg-[#fffaf4] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                Weighted directional model
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[620px] space-y-3">
                <div className="grid grid-cols-4 gap-3 rounded-xl border-2 border-slate-300 bg-[#fffaf4] p-3 text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                  <p>Metric</p>
                  <p className="text-center">30 Days</p>
                  <p className="text-center">60 Days</p>
                  <p className="text-center">90 Days</p>
                </div>

                <ForecastRow
                  label="Expected Offers"
                  month30={model.expectedOffers30}
                  month60={model.expectedOffers60}
                  month90={model.expectedOffers90}
                />
                <ForecastRow
                  label="Expected CAS"
                  month30={model.expectedCAS30}
                  month60={model.expectedCAS60}
                  month90={model.expectedCAS90}
                />
                <ForecastRow
                  label="Expected Visas"
                  month30={model.expectedVisas30}
                  month60={model.expectedVisas60}
                  month90={model.expectedVisas90}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[1.6rem] border-[3px] border-[#123866] bg-[#123866] p-5 text-white">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
                <Gauge size={18} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                  Operating Signal
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  Pipeline progression
                </h3>
              </div>
            </div>

            <p className="mt-4 text-5xl font-black text-white">
              {model.stageProgression}%
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-white">
              Directional movement score derived from applications progressing
              through offer, CAS and visa stages.
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-orange-400"
                style={{
                  width: `${model.stageProgression}%`,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <DarkMiniStat
                label="Invoices"
                value={model.invoices}
              />
              <DarkMiniStat
                label="Invoiced Revenue"
                value={money(model.invoicedRevenue)}
              />
            </div>
          </section>
        </div>

        <section className="grid gap-3 lg:grid-cols-3">
          <AssumptionCard
            icon={Landmark}
            label="Pipeline Assumption"
            text="Offer, CAS and visa expectations use conservative weighted stage progression rather than claiming a guaranteed conversion."
          />

          <AssumptionCard
            icon={ReceiptText}
            label="Revenue Assumption"
            text={`Average invoice currently used: ${money(model.averageInvoice)}. When invoice history exists, the model uses the real average instead of the £1,500 fallback.`}
          />

          <AssumptionCard
            icon={Sparkles}
            label="Future Upgrade"
            text="Once Zaifan has enough real history, replace fixed weights with conversion rates by country, counselor, course, university, source and intake."
          />
        </section>

        <div className="rounded-[1.45rem] border-[3px] border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
            <div>
              <p className="text-sm font-black text-amber-950">
                Forecast interpretation
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-amber-900">
                These figures are planning estimates. They should help the
                founder see pipeline direction, staffing pressure and revenue
                potential, but should never be presented as guaranteed future
                income.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ForecastCard({
  label,
  value,
  helper,
  tone = "orange",
  Icon,
  index,
  shouldReduceMotion,
}) {
  const tones = {
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.22,
        delay: shouldReduceMotion ? 0 : index * 0.04,
      }}
      className={`rounded-[1.4rem] border-[3px] p-5 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${
        tones[tone] || tones.orange
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#10233f]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white">
          <Icon size={17} />
        </div>
      </div>

      {helper ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
          {helper}
        </p>
      ) : null}
    </motion.article>
  );
}

function ForecastRow({
  label,
  month30,
  month60,
  month90,
}) {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-xl border-2 border-slate-300 bg-white p-4 text-sm shadow-[0_4px_14px_rgba(15,35,63,0.03)]">
      <p className="font-black text-[#10233f]">
        {label}
      </p>
      <p className="text-center font-black text-orange-700">
        {month30}
      </p>
      <p className="text-center font-black text-blue-700">
        {month60}
      </p>
      <p className="text-center font-black text-emerald-700">
        {month90}
      </p>
    </div>
  );
}

function AssumptionCard({
  icon: Icon,
  label,
  text,
}) {
  return (
    <div className="rounded-[1.35rem] border-[3px] border-slate-300 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Icon size={17} />
      </div>

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.13em] text-orange-700">
        {label}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function DarkStat({
  label,
  value,
}) {
  return (
    <div className="rounded-[1.05rem] border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function DarkMiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeStat({
  label,
  value,
}) {
  return (
    <div className="rounded-[1.05rem] border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function ForecastWarning() {
  return (
    <div className="rounded-[1.35rem] border-[3px] border-orange-300 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-orange-700">
          <CalendarRange size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            Forecast is running on fallback assumptions
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            No meaningful application, offer, CAS or visa records are currently
            loaded. The model remains visible for system readiness, but its
            forecast should not be treated as operationally useful yet.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BusinessForecastPanel;
