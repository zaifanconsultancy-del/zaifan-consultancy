import React, { useMemo } from "react";
import {
  AlertTriangle,
  Cpu,
  Database,
  HeartPulse,
  Smartphone,
  TabletSmartphone,
  Wifi,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayPercent(value) {
  return value === null || value === undefined
    ? "Not measured"
    : `${Math.round(safeNumber(value))}%`;
}

function DeviceTypeRow({ item, max }) {
  const count = safeNumber(item.count);
  const width =
    max > 0 ? Math.max(count > 0 ? 4 : 0, Math.round((count / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-black text-[#10233F]">
          {item.name || "Unknown"}
        </span>
        <span className="shrink-0 font-semibold text-slate-500">{count}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
        {width > 0 ? (
          <div
            className="h-full rounded-full bg-[#173F6B] transition-[width] duration-500"
            style={{ width: `${width}%` }}
          />
        ) : null}
      </div>
    </div>
  );
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
    navy: "border-[#173F6B] bg-[#173F6B]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${
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
                : "border-[#173F6B]/15 bg-white text-[#173F6B]"
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

export default function DeviceHealthPanel({
  mobile = {},
  compact = false,
}) {
  const totals = mobile.totals || {};
  const readiness = mobile.readiness || {};
  const evidence = mobile.evidence || {};

  const types = useMemo(
    () => safeArray(mobile.deviceTypes),
    [mobile.deviceTypes]
  );

  const max = Math.max(
    ...types.map((item) => safeNumber(item.count)),
    0
  );

  const deviceHealth = readiness.devices;

  const unknownPlatformCount = useMemo(
    () =>
      types
        .filter((item) => String(item.name || "").toLowerCase() === "unknown")
        .reduce((sum, item) => sum + safeNumber(item.count), 0),
    [types]
  );

  const knownPlatforms = types.filter(
    (item) => String(item.name || "").toLowerCase() !== "unknown"
  ).length;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#173F6B] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <HeartPulse size={12} />
            Device Health
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Device & Token Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Registered devices, active/recent devices and platform mix are now
            shown from real device/token evidence only. Missing devices no longer
            produce a fake 70% health baseline.
          </p>
        </div>

        <div className="bg-[#E96512] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Activation Evidence
          </p>

          <p className="mt-2 text-3xl font-black">
            {displayPercent(deviceHealth)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {evidence.devices
              ? `${safeNumber(totals.activeDevices)}/${safeNumber(
                  totals.devices
                )} registered devices currently active or recently seen.`
              : "No registered device/token evidence is connected."}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Device evidence only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-2"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          }
        >
          <MetricCard
            label="Registered"
            value={safeNumber(totals.devices)}
            helper="Total connected device/token records."
            tone="navy"
            icon={Smartphone}
            badge={evidence.devices ? "Connected" : "No evidence"}
          />

          <MetricCard
            label="Active / Recent"
            value={safeNumber(totals.activeDevices)}
            helper="Devices explicitly active or recently seen."
            tone={safeNumber(totals.activeDevices) > 0 ? "green" : "blue"}
            icon={Wifi}
            badge={evidence.devices ? "Observed" : "No evidence"}
          />

          {!compact ? (
            <>
              <MetricCard
                label="Activation"
                value={displayPercent(deviceHealth)}
                helper={
                  deviceHealth === null || deviceHealth === undefined
                    ? "Cannot be measured without registered devices."
                    : "Active/recent devices divided by registered devices."
                }
                tone={
                  deviceHealth === null || deviceHealth === undefined
                    ? "blue"
                    : deviceHealth >= 80
                      ? "green"
                      : deviceHealth >= 50
                        ? "amber"
                        : "red"
                }
                icon={Cpu}
                badge={
                  deviceHealth === null || deviceHealth === undefined
                    ? "Not measured"
                    : "Measured"
                }
              />

              <MetricCard
                label="Known Platforms"
                value={knownPlatforms}
                helper={
                  unknownPlatformCount
                    ? `${unknownPlatformCount} device record${
                        unknownPlatformCount === 1 ? "" : "s"
                      } still have an unknown platform.`
                    : "Distinct named device platforms in the current evidence."
                }
                tone={unknownPlatformCount > 0 ? "amber" : "green"}
                icon={TabletSmartphone}
              />
            </>
          ) : null}
        </div>

        {!compact ? (
          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Platform Mix
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Distribution based on recorded device platform fields.
              </p>
            </div>

            <div className="space-y-4">
              {types.length ? (
                types.map((item) => (
                  <DeviceTypeRow
                    key={`${item.name}-${item.count}`}
                    item={item}
                    max={max}
                  />
                ))
              ) : (
                <div className="rounded-[1.2rem] border-2 border-dashed border-[#C9D7E6] bg-[#FFF8EE] p-6 text-center">
                  <Smartphone size={22} className="mx-auto text-orange-700" />
                  <p className="mt-3 font-black text-[#10233F]">
                    No device platform data yet
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    Platform distribution will appear when real mobile
                    device/token records are connected.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <Wifi
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Activity Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Registered ≠ active
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A device counts as active only when its status or recent
                    activity supports that judgement.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Platform Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Unknown platforms stay unknown
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Missing platform fields are not silently classified as iOS,
                    Android or web.
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
                    Health Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Activation ≠ complete device health
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    This metric measures activation evidence only. Crash rate,
                    app version, latency and token validity require additional
                    telemetry before broader device health can be claimed.
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
