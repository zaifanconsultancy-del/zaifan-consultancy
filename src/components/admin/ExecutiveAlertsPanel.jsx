import { useEffect, useMemo, useState } from "react";
import { fetchExecutiveRiskScores } from "../../lib/executiveAI";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getJourneyStage(item = {}) {
  const direct = normalize(item.journey_stage || item?.diagnostics?.journey_stage);
  if (direct) return direct;

  const app = normalize(item.application_status);
  const visa = normalize(item.visa_status);
  const offer = normalize(item.offer_status);

  if (app === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visa)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visa)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visa)) {
    return "visa_pending";
  }
  if (app === "cas_issued") return "cas_issued";
  if (app === "cas_pending") return "cas_pending";
  if (["offer_accepted", "accepted"].includes(offer) || ["offer_accepted", "accepted"].includes(app)) {
    return "offer_accepted";
  }
  if (["offer_received", "received", "offer"].includes(offer) || ["offer_received", "offer"].includes(app)) {
    return "offer_received";
  }
  if (["under_review", "review"].includes(app)) return "application_under_review";
  if (["applied", "submitted"].includes(app)) return "application_submitted";

  return "not_started";
}

function ExecutiveAlertsPanel({ scores: externalScores = null }) {
  const [localScores, setLocalScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usingExternalScores = Array.isArray(externalScores);
  const scores = usingExternalScores ? externalScores : localScores;

  const loadScores = async () => {
    if (usingExternalScores) return;

    setLoading(true);
    setError("");

    try {
      const { data, error } = await fetchExecutiveRiskScores();
      if (error) throw error;
      setLocalScores(data || []);
    } catch (err) {
      setError(err.message || "Executive alerts failed to load.");
      setLocalScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, [usingExternalScores]);

  const alertGroups = useMemo(() => {
    const criticalRisks = scores
      .filter((item) => {
        const category = normalize(item.executive_category);
        const riskLevel = normalize(item.risk_level);
        const journeyStage = getJourneyStage(item);

        return (
          category === "critical_risk" ||
          riskLevel === "critical" ||
          journeyStage === "visa_rejected" ||
          number(item.risk_score) >= 85
        );
      })
      .sort((a, b) => number(b.risk_score) - number(a.risk_score))
      .slice(0, 6);

    const needsAttention = scores
      .filter((item) => {
        const category = normalize(item.executive_category);
        const riskLevel = normalize(item.risk_level);
        const riskScore = number(item.risk_score);
        const journeyStage = getJourneyStage(item);

        return (
          category === "needs_attention" ||
          category === "high_risk" ||
          riskLevel === "high" ||
          journeyStage === "cas_pending" ||
          (riskScore >= 60 && riskScore < 85)
        );
      })
      .sort((a, b) => number(b.risk_score) - number(a.risk_score))
      .slice(0, 6);

    const conversionReady = scores
      .filter((item) => {
        const category = normalize(item.executive_category);
        const journeyStage = getJourneyStage(item);

        return (
          category === "conversion_ready" ||
          category === "high_opportunity" ||
          ["offer_accepted", "cas_issued", "visa_pending"].includes(journeyStage) ||
          number(item.opportunity_score) >= 80
        );
      })
      .sort((a, b) => number(b.opportunity_score) - number(a.opportunity_score))
      .slice(0, 6);

    const visaWatch = scores
      .filter((item) =>
        ["cas_pending", "cas_issued", "visa_pending", "visa_rejected"].includes(
          getJourneyStage(item)
        )
      )
      .sort((a, b) => {
        const order = {
          visa_rejected: 4,
          visa_pending: 3,
          cas_issued: 2,
          cas_pending: 1,
        };

        return (
          (order[getJourneyStage(b)] || 0) - (order[getJourneyStage(a)] || 0) ||
          number(b.risk_score) - number(a.risk_score)
        );
      })
      .slice(0, 6);

    const successStories = scores
      .filter((item) => {
        const category = normalize(item.executive_category);
        const journeyStage = getJourneyStage(item);

        return category === "success_story" || journeyStage === "visa_approved";
      })
      .sort((a, b) => number(b.opportunity_score) - number(a.opportunity_score))
      .slice(0, 6);

    return {
      criticalRisks,
      needsAttention,
      conversionReady,
      visaWatch,
      successStories,
    };
  }, [scores]);

  const totalAlerts =
    alertGroups.criticalRisks.length +
    alertGroups.needsAttention.length +
    alertGroups.conversionReady.length +
    alertGroups.visaWatch.length +
    alertGroups.successStories.length;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-red-400/20 bg-red-500/[0.04] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
              Executive Alerts
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Student OS Decision Queue
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Critical risks, attention cases, conversion-ready students, CAS/visa
              watchlist, and success outcomes from Executive AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge label={`${totalAlerts} Alerts`} danger />
            <Badge label={`${alertGroups.criticalRisks.length} Critical`} danger />
            <Badge label={`${alertGroups.visaWatch.length} Visa/CAS`} gold />
            <Badge label={`${alertGroups.conversionReady.length} Conversion`} success />

            {!usingExternalScores ? (
              <button
                type="button"
                onClick={loadScores}
                disabled={loading}
                className="rounded-full border border-red-400/25 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-300 transition hover:border-red-400/45 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh Alerts"}
              </button>
            ) : (
              <Badge label="Live Command Scores" />
            )}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AlertList
          title="Critical Risks"
          eyebrow="Immediate Action"
          icon="🚨"
          items={alertGroups.criticalRisks}
          emptyText="No critical risks detected."
          scoreKey="risk_score"
          tone="red"
        />

        <AlertList
          title="Needs Attention"
          eyebrow="Counselor Priority"
          icon="⚠️"
          items={alertGroups.needsAttention}
          emptyText="No students currently need attention."
          scoreKey="risk_score"
          tone="orange"
        />

        <AlertList
          title="Conversion Ready"
          eyebrow="Executive Opportunity"
          icon="🏆"
          items={alertGroups.conversionReady}
          emptyText="No conversion-ready students detected."
          scoreKey="opportunity_score"
          tone="gold"
        />

        <AlertList
          title="CAS / Visa Watch"
          eyebrow="Visa Operations"
          icon="🛂"
          items={alertGroups.visaWatch}
          emptyText="No CAS or visa watch items."
          scoreKey="risk_score"
          tone="blue"
        />

        <AlertList
          title="Success Stories"
          eyebrow="Wins / Outcomes"
          icon="🎉"
          items={alertGroups.successStories}
          emptyText="No success stories detected yet."
          scoreKey="opportunity_score"
          tone="green"
        />
      </div>
    </div>
  );
}

function AlertList({
  title,
  eyebrow,
  icon,
  items = [],
  emptyText,
  scoreKey,
  tone = "gold",
}) {
  const toneClass = getToneClass(tone);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            {eyebrow}
          </p>

          <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
        </div>

        <span className={`rounded-2xl border p-3 text-xl ${toneClass}`}>
          {icon}
        </span>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <AlertCard
              key={`${item.student_id}-${item.student_type}-${item.generated_at}-${item.executive_category}`}
              item={item}
              scoreKey={scoreKey}
              toneClass={toneClass}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function AlertCard({ item, scoreKey, toneClass }) {
  const journeyStage = getJourneyStage(item);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {item.student_name || "Unknown Student"}
          </p>

          <p className="mt-1 text-xs capitalize text-white/40">
            {item.student_type || "student"} •{" "}
            {item.executive_category || item.priority_level || "Standard"} •{" "}
            {formatLabel(journeyStage)}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}
        >
          {number(item[scoreKey])}
        </span>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/50">
        {item.summary || "No executive summary available."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <MiniBadge text={`${item.risk_level || "Low"} Risk`} />
        <MiniBadge text={`Opp ${item.opportunity_score || 0}`} />
        <MiniBadge text={item.priority_level || "Standard"} />
        <MiniBadge text={formatLabel(journeyStage)} />

        {item.document_readiness_percent !== undefined ? (
          <MiniBadge text={`Docs ${item.document_readiness_percent || 0}%`} />
        ) : null}

        {item.task_completion_percent !== undefined ? (
          <MiniBadge text={`Tasks ${item.task_completion_percent || 0}%`} />
        ) : null}

        {item.generated_at ? (
          <MiniBadge text={new Date(item.generated_at).toLocaleDateString()} />
        ) : null}
      </div>
    </div>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-red-400/25 bg-red-500/10 text-red-300"
    : gold
    ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
    : success
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
    : "border-white/10 bg-black/20 text-white/45";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function MiniBadge({ text }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
      {text}
    </span>
  );
}

function getToneClass(tone = "") {
  if (tone === "red") return "border-red-400/25 bg-red-500/10 text-red-300";
  if (tone === "orange") return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  if (tone === "green") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  if (tone === "blue") return "border-blue-400/25 bg-blue-500/10 text-blue-300";

  return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
}

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default ExecutiveAlertsPanel;