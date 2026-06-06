import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function ExecutiveRecommendationPanel({ score = {} }) {
  const recommendations = buildExecutiveRecommendations(score);
  const studentName =
    score?.student_name || score?.full_name || score?.name || "Student";

  const summary = {
    total: recommendations.length,
    critical: recommendations.filter((item) => normalize(item.priority) === "critical").length,
    executive: recommendations.filter((item) => normalize(item.priority) === "executive").length,
    high: recommendations.filter((item) => normalize(item.priority) === "high").length,
  };

  return (
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
            Executive Recommendations
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            Recommended Actions for {studentName}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Action guidance generated from Student OS risk, opportunity,
            application, offer, CAS, visa, document, task, and university signals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SummaryPill label="Total" value={summary.total} />
          <SummaryPill label="Critical" value={summary.critical} tone="critical" />
          <SummaryPill label="Executive" value={summary.executive} tone="executive" />
          <SummaryPill label="High" value={summary.high} tone="high" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ContextPill label="Priority" value={score?.priority_level || "Standard"} />
        <ContextPill label="Category" value={score?.executive_category || "Standard"} />
        <ContextPill label="Journey" value={formatLabel(score?.journey_stage || "not_started")} />
        <ContextPill label="Risk" value={score?.risk_score ?? 0} />
        <ContextPill label="Opportunity" value={score?.opportunity_score ?? 0} />
      </div>

      <div className="mt-5 space-y-3">
        {recommendations.length ? (
          recommendations.map((item, index) => (
            <RecommendationCard key={`${item.type || item.title}-${index}`} item={item} />
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
            <p className="font-bold text-emerald-200">
              No urgent executive recommendations.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              This student does not currently show a strong action signal. Keep
              monitoring risk, opportunity, documents, tasks, university plan,
              and journey stage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ item }) {
  const style = getPriorityStyle(item.priority);
  const actionLabel = getActionLabel(item.action);
  const priorityLabel = item.priority || "standard";

  return (
    <div className={`rounded-2xl border p-4 ${style.wrapper}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-white">{item.title}</p>

            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style.badge}`}>
              {priorityLabel}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {item.description}
          </p>

          {item.type ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">
              Signal: {formatLabel(item.type)}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            Action
          </p>
          <p className="mt-1 text-xs font-black text-white/80">
            {actionLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value, tone = "default" }) {
  const className =
    tone === "critical"
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : tone === "executive"
      ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
      : tone === "high"
      ? "border-orange-400/25 bg-orange-500/10 text-orange-200"
      : "border-white/10 bg-black/20 text-white/55";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${className}`}>
      {value} {label}
    </span>
  );
}

function ContextPill({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold text-white/45">
      {label}: <span className="text-white/70">{value}</span>
    </span>
  );
}

function getPriorityStyle(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") {
    return {
      wrapper: "border-red-400/25 bg-red-500/10",
      badge: "border-red-400/25 bg-red-500/10 text-red-200",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#D4AF37]/30 bg-[#D4AF37]/10",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-orange-400/25 bg-orange-500/10",
      badge: "border-orange-400/25 bg-orange-500/10 text-orange-200",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-blue-400/25 bg-blue-500/10",
      badge: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    };
  }

  return {
    wrapper: "border-white/10 bg-white/[0.03]",
    badge: "border-white/10 bg-black/20 text-white/45",
  };
}

function getActionLabel(action = "") {
  const clean = normalize(action);

  const labels = {
    create_task: "Create Task",
    create_reminder: "Create Reminder",
    send_email: "Email Draft",
    send_whatsapp: "WhatsApp Draft",
    schedule_call: "Schedule Call",
  };

  return labels[clean] || formatLabel(action || "Review");
}

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default ExecutiveRecommendationPanel;