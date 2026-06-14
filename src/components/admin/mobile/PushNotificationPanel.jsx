import React, { useState } from "react";

const TEMPLATES = [
  "Your counselor has replied to your support request.",
  "Please upload the pending document to continue your application.",
  "Your payment receipt has been reviewed.",
  "Your appointment outcome has been updated.",
  "Your visa/CAS task needs attention.",
];

function CategoryBar({ item, max }) {
  const width = max ? Math.max(4, Math.round((Number(item.count || 0) / max) * 100)) : 4;

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-bold text-slate-300">{item.name}</span>
        <span className="text-slate-500">{item.count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function PushNotificationPanel({ mobile = {}, compact = false }) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState(null);
  const categories = mobile.notificationCategories || [];
  const max = Math.max(...categories.map((item) => Number(item.count || 0)), 1);

  function simulatePush() {
    if (!draft.trim()) {
      setStatus({ type: "error", message: "Write or choose a push message first." });
      return;
    }

    setStatus({ type: "success", message: "Push notification payload prepared. Connect to FCM/APNs when mobile backend is ready." });
    console.info("Prepared push notification:", {
      body: draft.trim(),
      createdAt: new Date().toISOString(),
      source: "MobileControlCenter",
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Push Notifications</p>
        <h2 className="mt-2 text-2xl font-black text-white">Notification Command</h2>
        <p className="mt-1 text-sm text-slate-400">Prepare and monitor app push notifications for students and counselors.</p>
      </div>

      {!compact ? (
        <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setDraft(template)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.08]"
              >
                {template.slice(0, 28)}...
              </button>
            ))}
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Write push notification..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />

          <button type="button" onClick={simulatePush} className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-400/20">
            Prepare Push
          </button>

          {status ? (
            <p className={`mt-3 rounded-2xl border px-4 py-3 text-sm font-bold ${status.type === "error" ? "border-rose-400/25 bg-rose-500/10 text-rose-100" : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"}`}>
              {status.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <p className="mb-4 text-sm font-black text-white">Notification Categories</p>
        <div className="space-y-4">
          {categories.length ? categories.map((item) => <CategoryBar key={item.name} item={item} max={max} />) : (
            <p className="text-sm text-slate-500">No notification history yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
