import React, { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarRange,
  CircleGauge,
  Database,
  Info,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasMoney(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function money(value, currency = "GBP") {
  if (!hasMoney(value)) return "Unavailable";

  const code = String(currency || "GBP").trim().toUpperCase() || "GBP";

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${code} ${Math.round(Number(value)).toLocaleString("en-GB")}`;
  }
}

function toneClass(tone = "blue") {
  const map = {
    navy: "border-[#123865] bg-[#123865]",
    orange: "border-[#F97316] bg-[#FFF4E8]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  return map[tone] || map.blue;
}

function ForecastMetric({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon = CalendarRange,
  badge = "",
}) {
  const dark = tone === "navy";

  return (
    <div
      className={`min-w-0 rounded-[1.45rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${toneClass(
        tone
      )}`}
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

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white/80 text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>

      {helper ? (
        <p
          className={`mt-2 text-xs font-semibold leading-5 ${
            dark ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {helper}
        </p>
      ) : null}

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

function ForecastEvidenceCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon = Database,
}) {
  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-lg font-black text-[#10233F]">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function ForecastStageRow({
  item,
  currency,
  probabilityLabel,
  probabilityValue,
}) {
  const valueAvailable = hasMoney(item?.value);

  return (
    <article className="rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_7rem_10rem_8rem] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-[#10233F]">{item.label}</h4>

            <span className="rounded-full border-2 border-[#F59E0B] bg-[#FFF8E8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-amber-800">
              Estimate
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Stage record volume currently feeding the operating forecast.
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Records
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {safeNumber(item.count)}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            90D Weighted Value
          </p>
          <p className="mt-1 text-sm font-black text-[#123865]">
            {valueAvailable ? money(item.value, currency) : "Unavailable"}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Assumption
          </p>
          <span className="mt-1 inline-flex rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[9px] font-black text-blue-700">
            {probabilityLabel || `${Math.round(probabilityValue * 100)}%`}
          </span>
        </div>
      </div>

      {!valueAvailable ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-xs font-semibold leading-5 text-slate-600">
            Zaifan has stage volume but no reliable invoice/payment basis for
            turning this stage into money.
          </p>
        </div>
      ) : null}
    </article>
  );
}

function ForecastUnavailable({ reason }) {
  return (
    <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#F59E0B] bg-[#FFF8E8] p-7 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F59E0B] bg-white text-amber-700">
        <AlertTriangle size={24} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        Monetary forecast unavailable
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        {reason ||
          "A real invoice or payment history is required before Zaifan calculates projected money."}
      </p>
    </div>
  );
}

export default function RevenueForecastPanel({
  finance = {},
  compact = false,
}) {
  const forecast = finance.forecast || {};
  const pipeline = safeArray(finance.pipeline);
  const currency = finance.currency || "GBP";
  const totals = finance.totals || {};
  const metadata = finance.metadata || {};
  const averageInvoiceMeta = totals.averageInvoiceMeta || {};

  const assumptions = useMemo(() => {
    const weights = forecast.weights || {};

    return {
      applications: weights.applications?.day90 ?? 0.25,
      offers: weights.offers?.day90 ?? 0.55,
      cas: weights.cas?.day90 ?? 0.8,
      visas: weights.visas?.day90 ?? 0.35,
    };
  }, [forecast.weights]);

  const confidenceLabel =
    forecast.confidence === "medium"
      ? "Medium confidence"
      : forecast.confidence === "low-medium"
        ? "Low-medium confidence"
        : forecast.confidence === "low"
          ? "Low confidence"
          : "Unavailable";

  const sampleSize = safeNumber(averageInvoiceMeta.sampleSize);

  const stageRecordCount = pipeline.reduce(
    (sum, item) => sum + safeNumber(item.count),
    0
  );

  const hasForecast =
    forecast.available &&
    hasMoney(forecast.day30) &&
    hasMoney(forecast.day60) &&
    hasMoney(forecast.day90);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <TrendingUp size={12} />
            Revenue Forecast
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            30 / 60 / 90 Day Revenue
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Weighted operating projection from real pipeline volume plus
            historical invoice/payment value. Forecast money is always
            separated from collected or invoiced revenue.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Forecast Integrity
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {hasForecast ? confidenceLabel : "Not enough evidence"}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {forecast.reason ||
              "Zaifan needs real pipeline and invoice/payment evidence before forecasting."}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Forecast ≠ booked revenue
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {hasForecast ? (
          <div className="grid gap-3 md:grid-cols-3">
            <ForecastMetric
              label="30 Days"
              value={money(forecast.day30, currency)}
              helper="Near-term weighted operating estimate."
              tone="blue"
              icon={CalendarRange}
              badge="Estimated"
            />

            <ForecastMetric
              label="60 Days"
              value={money(forecast.day60, currency)}
              helper="Mid-term weighted operating estimate."
              tone="violet"
              icon={Target}
              badge="Estimated"
            />

            <ForecastMetric
              label="90 Days"
              value={money(forecast.day90, currency)}
              helper="Quarter-window weighted operating estimate."
              tone="green"
              icon={TrendingUp}
              badge="Estimated"
            />
          </div>
        ) : (
          <ForecastUnavailable reason={forecast.reason} />
        )}

        {!compact ? (
          <>
            <div className="grid gap-3 lg:grid-cols-3">
              <ForecastEvidenceCard
                label="Historical Money Basis"
                value={
                  hasMoney(totals.averageInvoice)
                    ? money(totals.averageInvoice, currency)
                    : "Unavailable"
                }
                helper={
                  sampleSize
                    ? `Average based on ${sampleSize} ${
                        averageInvoiceMeta.basis === "invoice-records"
                          ? "invoice"
                          : "payment"
                      } record${sampleSize === 1 ? "" : "s"}.`
                    : "No positive invoice/payment values are available."
                }
                tone={sampleSize >= 3 ? "green" : sampleSize ? "amber" : "red"}
                icon={Database}
              />

              <ForecastEvidenceCard
                label="Pipeline Evidence"
                value={`${stageRecordCount} records`}
                helper="Applications + offers + CAS + visas currently represented."
                tone={stageRecordCount >= 10 ? "green" : stageRecordCount ? "amber" : "red"}
                icon={BarChart3}
              />

              <ForecastEvidenceCard
                label="Confidence"
                value={hasForecast ? confidenceLabel : "Unavailable"}
                helper={
                  hasForecast
                    ? "Confidence reflects historical money sample size, not statistical certainty."
                    : "No forecast confidence is shown without a monetary projection."
                }
                tone={
                  forecast.confidence === "medium"
                    ? "green"
                    : forecast.confidence
                      ? "amber"
                      : "red"
                }
                icon={CircleGauge}
              />
            </div>

            <section className="rounded-[1.65rem] border-[3px] border-[#F97316] bg-[#FFF8EF] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                    Forecast Composition
                  </p>

                  <h3 className="mt-1 text-xl font-black text-[#10233F]">
                    Pipeline Stage Assumptions
                  </h3>

                  <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-600">
                    The percentages below are modelling assumptions used by
                    Finance OS. They are not historical conversion rates unless
                    you later replace them with measured Zaifan data.
                  </p>
                </div>

                <span className="w-fit rounded-full border-2 border-[#F59E0B] bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-amber-800">
                  Model assumptions
                </span>
              </div>

              {pipeline.length ? (
                <div className="mt-4 space-y-3">
                  {pipeline.map((item) => (
                    <ForecastStageRow
                      key={item.key || item.label}
                      item={item}
                      currency={currency}
                      probabilityValue={assumptions[item.key] || 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.45rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-7 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-orange-600" />
                  <h4 className="mt-3 text-lg font-black text-[#10233F]">
                    No forecast stages available
                  </h4>
                  <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
                    Once applications, offers, CAS or visa records are available,
                    the forecast composition will appear here.
                  </p>
                </div>
              )}
            </section>

            <div
              className={`flex items-start gap-3 rounded-[1.35rem] border-[3px] p-4 ${
                metadata.forecastIsEstimate !== false
                  ? "border-[#F59E0B] bg-[#FFF8E8]"
                  : "border-[#34D399] bg-[#F0FFF8]"
              }`}
            >
              {metadata.forecastIsEstimate !== false ? (
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
              ) : (
                <BadgeCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
              )}

              <div>
                <p className="font-black text-[#10233F]">
                  {metadata.forecastIsEstimate !== false
                    ? "Forecast is an operating estimate"
                    : "Forecast is backed by measured model data"}
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  {metadata.forecastIsEstimate !== false
                    ? "Use this for planning and prioritisation, not as booked revenue, cash balance, or accounting recognition."
                    : "The model has been configured to use measured forecast evidence."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
