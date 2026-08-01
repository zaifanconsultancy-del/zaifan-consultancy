import React, { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CircleGauge,
  Smartphone,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayPercent(value) {
  return value === null || value === undefined
    ? "Not measured"
    : `${Math.round(safeNumber(value))}%`;
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
    <article
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 ${
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
            className={`mt-2 whitespace-normal break-normal text-2xl font-black [overflow-wrap:normal] [word-break:normal] ${
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

export default function MobileAnalyticsPanel({ mobile = {} }) {
  const totals = mobile.totals || {};
  const readiness = mobile.readiness || {};
  const evidence = mobile.evidence || {};

  const studentAdoption = readiness.studentApp;
  const counselorAdoption = readiness.counselorApp;
  const deviceActivation = readiness.devices;
  const pushSuccess = readiness.push;

  const measuredCount = [
    studentAdoption,
    counselorAdoption,
    deviceActivation,
    pushSuccess,
  ].filter((value) => value !== null && value !== undefined).length;

  const interpretation = useMemo(() => {
    if (measuredCount === 0) {
      return {
        title: "Mobile analytics are not measurable yet",
        body:
          "Connect real mobile sessions, device/token records and push delivery outcomes before using this workspace to judge adoption or reliability.",
        tone: "amber",
      };
    }

    if (measuredCount < 4) {
      return {
        title: "Mobile analytics are partially measurable",
        body:
          "Some mobile evidence exists, but at least one adoption or reliability metric is still missing. Treat the dashboard as incomplete until all required evidence sources are connected.",
        tone: "blue",
      };
    }

    return {
      title: "Mobile analytics are evidence-backed",
      body:
        "All four core mobile metrics currently have measurable evidence. Continue to validate session identity, device freshness and delivery-status quality before making operational decisions.",
      tone: "green",
    };
  }, [measuredCount]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Activity size={12} />
            Mobile Analytics
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Adoption & Reliability Analytics
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Student adoption, counselor adoption, device activation and push
            reliability are now shown only when their real evidence sources are
            available.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Measurable Metrics
          </p>

          <p className="mt-2 text-3xl font-black">
            {measuredCount}/4
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Core mobile metrics backed by current evidence.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            No placeholder percentages
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Student Adoption"
            value={displayPercent(studentAdoption)}
            helper={
              studentAdoption === null || studentAdoption === undefined
                ? "Needs both student records and real recent student mobile sessions."
                : `${safeNumber(totals.studentActive)} recent student session${
                    safeNumber(totals.studentActive) === 1 ? "" : "s"
                  } across ${safeNumber(totals.students)} student record${
                    safeNumber(totals.students) === 1 ? "" : "s"
                  }.`
            }
            tone={
              studentAdoption === null || studentAdoption === undefined
                ? "blue"
                : studentAdoption >= 70
                  ? "green"
                  : studentAdoption >= 35
                    ? "amber"
                    : "red"
            }
            icon={UsersRound}
            badge={
              studentAdoption === null || studentAdoption === undefined
                ? "Not measured"
                : "Measured"
            }
          />

          <MetricCard
            label="Counselor Adoption"
            value={displayPercent(counselorAdoption)}
            helper={
              counselorAdoption === null || counselorAdoption === undefined
                ? "Needs counselor records plus real recent counselor mobile sessions."
                : `${safeNumber(totals.counselorActive)} recent counselor session${
                    safeNumber(totals.counselorActive) === 1 ? "" : "s"
                  } across ${safeNumber(totals.counselors)} counselor record${
                    safeNumber(totals.counselors) === 1 ? "" : "s"
                  }.`
            }
            tone={
              counselorAdoption === null || counselorAdoption === undefined
                ? "blue"
                : counselorAdoption >= 70
                  ? "green"
                  : counselorAdoption >= 35
                    ? "amber"
                    : "red"
            }
            icon={UserRoundCheck}
            badge={
              counselorAdoption === null || counselorAdoption === undefined
                ? "Not measured"
                : "Measured"
            }
          />

          <MetricCard
            label="Device Activation"
            value={displayPercent(deviceActivation)}
            helper={
              deviceActivation === null || deviceActivation === undefined
                ? "No registered device/token evidence is connected."
                : `${safeNumber(totals.activeDevices)}/${safeNumber(
                    totals.devices
                  )} registered devices are active or recently seen.`
            }
            tone={
              deviceActivation === null || deviceActivation === undefined
                ? "blue"
                : deviceActivation >= 80
                  ? "green"
                  : deviceActivation >= 50
                    ? "amber"
                    : "red"
            }
            icon={Smartphone}
            badge={
              deviceActivation === null || deviceActivation === undefined
                ? "Not measured"
                : "Measured"
            }
          />

          <MetricCard
            label="Push Success"
            value={displayPercent(pushSuccess)}
            helper={
              pushSuccess === null || pushSuccess === undefined
                ? "Known sent/delivered and failed outcomes are required."
                : `${safeNumber(totals.sentNotifications)} sent/delivered · ${safeNumber(
                    totals.failedNotifications
                  )} failed.`
            }
            tone={
              pushSuccess === null || pushSuccess === undefined
                ? "blue"
                : pushSuccess >= 90
                  ? "green"
                  : pushSuccess >= 70
                    ? "amber"
                    : "red"
            }
            icon={BellRing}
            badge={
              pushSuccess === null || pushSuccess === undefined
                ? "Not measured"
                : "Measured"
            }
          />
        </div>

        <div
          className={`rounded-[1.45rem] border-[3px] p-4 ${
            interpretation.tone === "green"
              ? "border-[#34D399] bg-[#F0FFF8]"
              : interpretation.tone === "blue"
                ? "border-[#60A5FA] bg-[#F2F7FF]"
                : "border-[#F59E0B] bg-[#FFF8E8]"
          }`}
        >
          <div className="flex items-start gap-3">
            {measuredCount === 4 ? (
              <CircleGauge
                size={18}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
            ) : (
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-amber-700"
              />
            )}

            <div>
              <p className="font-black text-[#10233F]">
                {interpretation.title}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {interpretation.body}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <CircleGauge
                size={17}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Adoption Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Sessions are the denominator evidence
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Adoption is not derived from portal usage, account existence or
                  module availability. It needs real mobile sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="flex items-start gap-3">
              <Smartphone
                size={17}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Device Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Registered ≠ active
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Device activation is based on explicit active status or recent
                  device activity, not on registration count alone.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <BellRing
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Push Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Unknown states are excluded
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Push success uses only known successful and failed outcomes.
                  Pending or unknown records do not inflate the percentage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
