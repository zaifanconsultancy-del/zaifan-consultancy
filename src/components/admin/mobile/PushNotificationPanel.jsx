import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const TEMPLATES = [
  "Your counselor has replied to your support request.",
  "Please upload the pending document to continue your application.",
  "Your payment receipt has been reviewed.",
  "Your appointment outcome has been updated.",
  "Your visa/CAS task needs attention.",
];

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

function deliveryState(notification = {}) {
  const status = lower(
    notification.status ||
      notification.delivery_status ||
      notification.deliveryStatus
  );

  if (
    status.includes("fail") ||
    status.includes("error") ||
    status.includes("bounce") ||
    status.includes("invalid")
  ) {
    return "failed";
  }

  if (
    status.includes("sent") ||
    status.includes("delivered") ||
    status.includes("success")
  ) {
    return "sent";
  }

  if (
    status.includes("queued") ||
    status.includes("pending") ||
    status.includes("scheduled")
  ) {
    return "pending";
  }

  return "unknown";
}

function percent(part, total) {
  const numerator = safeNumber(part);
  const denominator = safeNumber(total);

  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
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
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 ${
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

function CategoryBar({ item, max }) {
  const count = safeNumber(item.count);
  const width =
    max > 0 ? Math.max(count > 0 ? 4 : 0, Math.round((count / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-xs">
        <span className="min-w-0 truncate font-black text-[#10233F]">
          {item.name || "General"}
        </span>
        <span className="shrink-0 font-semibold text-slate-500">{count}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
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

export default function PushNotificationPanel({
  mobile = {},
  compact = false,
  onPreparePush,
}) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState(null);
  const [preparing, setPreparing] = useState(false);

  const notifications = useMemo(
    () => safeArray(mobile.notifications),
    [mobile.notifications]
  );

  const categories = useMemo(
    () => safeArray(mobile.notificationCategories),
    [mobile.notificationCategories]
  );

  const max = Math.max(
    ...categories.map((item) => safeNumber(item.count)),
    0
  );

  const summary = useMemo(() => {
    const states = notifications.reduce(
      (acc, notification) => {
        acc[deliveryState(notification)] += 1;
        return acc;
      },
      { sent: 0, failed: 0, pending: 0, unknown: 0 }
    );

    const knownOutcomes = states.sent + states.failed;
    const successRate =
      knownOutcomes > 0 ? percent(states.sent, knownOutcomes) : null;

    return {
      ...states,
      knownOutcomes,
      successRate,
    };
  }, [notifications]);

  async function preparePush() {
    const message = draft.trim();

    if (!message) {
      setStatus({
        type: "error",
        message: "Write or choose a push message first.",
      });
      return;
    }

    try {
      setPreparing(true);
      setStatus(null);

      const payload = {
        body: message,
        createdAt: new Date().toISOString(),
        source: "MobileControlCenter",
      };

      if (typeof onPreparePush === "function") {
        const result = await onPreparePush(payload);

        if (result?.error) {
          throw result.error;
        }

        setStatus({
          type: "success",
          message:
            "Push payload was handed to the connected notification workflow.",
        });
      } else {
        setStatus({
          type: "info",
          message:
            "Payload prepared locally only. FCM/APNs or another real push provider is not connected here yet.",
        });
      }
    } catch (error) {
      console.error("Push preparation failed:", error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "The push payload could not be handed to the notification workflow.",
      });
    } finally {
      setPreparing(false);
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <BellRing size={12} />
            Push Notifications
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Notification Command
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Prepare push payloads and inspect real delivery outcomes. Zaifan no
            longer treats a locally prepared message as a successfully sent
            mobile notification.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Delivery Evidence
          </p>

          <p className="mt-2 text-3xl font-black">
            {summary.successRate === null
              ? "Not measured"
              : `${summary.successRate}%`}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {summary.knownOutcomes
              ? `${summary.sent} sent/delivered · ${summary.failed} failed.`
              : "No known sent/failed delivery outcomes yet."}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Delivery evidence only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Sent / Delivered"
              value={summary.sent}
              helper="Notifications with a known successful delivery state."
              tone="green"
              icon={CheckCircle2}
              badge="Known outcome"
            />

            <MetricCard
              label="Failed"
              value={summary.failed}
              helper="Notifications with a known failed/error delivery state."
              tone={summary.failed > 0 ? "red" : "green"}
              icon={AlertTriangle}
              badge="Known outcome"
            />

            <MetricCard
              label="Pending"
              value={summary.pending}
              helper="Queued, pending or scheduled notification records."
              tone="amber"
              icon={ClipboardCheck}
            />

            <MetricCard
              label="Unknown State"
              value={summary.unknown}
              helper="Notification records without a recognised delivery status."
              tone={summary.unknown > 0 ? "blue" : "green"}
              icon={Database}
            />
          </div>
        ) : null}

        {!compact ? (
          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                  Prepare Payload
                </p>
                <h3 className="mt-1 text-lg font-black text-[#10233F]">
                  Draft a mobile notification
                </h3>
              </div>

              <p className="text-xs font-semibold text-slate-500">
                Provider workflow:{" "}
                <span className="font-black text-[#10233F]">
                  {typeof onPreparePush === "function"
                    ? "Connected"
                    : "Not connected"}
                </span>
              </p>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => {
                    setDraft(template);
                    setStatus(null);
                  }}
                  className="rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-2 text-left text-xs font-black text-[#10233F] transition hover:border-[#F97316]"
                >
                  {template}
                </button>
              ))}
            </div>

            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                if (status) setStatus(null);
              }}
              rows={4}
              placeholder="Write push notification..."
              className="w-full resize-none rounded-[1.2rem] border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-500">
                {draft.trim().length} characters
              </p>

              <button
                type="button"
                onClick={preparePush}
                disabled={preparing}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-5 text-sm font-black text-white transition hover:border-[#F97316] hover:bg-[#245886] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={15} />
                {preparing ? "Preparing..." : "Prepare Push"}
              </button>
            </div>

            {status ? (
              <div
                className={`mt-4 rounded-[1.2rem] border-2 px-4 py-3 text-sm font-semibold ${
                  status.type === "error"
                    ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
                    : status.type === "success"
                      ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                      : "border-[#60A5FA] bg-[#F2F7FF] text-blue-800"
                }`}
              >
                {status.message}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={16} className="text-orange-700" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Notification Categories
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Distribution based on real notification records.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {categories.length ? (
              categories.map((item) => (
                <CategoryBar
                  key={`${item.name}-${item.count}`}
                  item={item}
                  max={max}
                />
              ))
            ) : (
              <div className="rounded-[1.2rem] border-2 border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-6 text-center">
                <BellRing size={22} className="mx-auto text-orange-700" />
                <p className="mt-3 font-black text-[#10233F]">
                  No notification history yet
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  Categories will appear when real push-notification records are
                  connected.
                </p>
              </div>
            )}
          </div>
        </section>

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
                    Delivery Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Prepared ≠ sent
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A locally prepared payload is not counted as a delivered push
                    notification unless a real provider workflow records the
                    outcome.
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
                    Success Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Unknown states stay unknown
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Push success is calculated only from known successful and
                    failed outcomes.
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
                    Provider Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    FCM/APNs must be wired explicitly
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    This control surface does not pretend a production push
                    provider exists until the real sending workflow is connected.
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
