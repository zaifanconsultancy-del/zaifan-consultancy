import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  buildAutoStageSuggestions,
  getStageSuggestionSummary,
} from "../../services/autoStageEngine";

function AutoStageMovementPanel({
  cardClass = "",
  inquiries = [],
  appointments = [],
  updateInquiryStatus = () => {},
  updateAppointmentStage = null,
  updateAppointmentStatus = () => {},
}) {
  const suggestions = buildAutoStageSuggestions({ inquiries, appointments });
  const summary = getStageSuggestionSummary({ inquiries, appointments });

  const applySuggestion = (suggestion) => {
    if (!suggestion) return;

    if (suggestion.leadType === "inquiry") {
      updateInquiryStatus(suggestion.leadId, suggestion.suggestedStage);
      return;
    }

    if (suggestion.leadType === "appointment") {
      if (typeof updateAppointmentStage === "function") {
        updateAppointmentStage(suggestion.leadId, suggestion.suggestedStage);
        return;
      }

      const stageToStatus = {
        new_booking: "pending",
        confirmed: "confirmed",
        consultation_done: "completed",
        follow_up_needed: "pending",
        converted_to_lead: "completed",
        not_interested: "completed",
        cancelled: "cancelled",
      };

      updateAppointmentStatus(
        suggestion.leadId,
        stageToStatus[suggestion.suggestedStage] || "pending"
      );
    }
  };

  const topSuggestions = suggestions.allSuggestions.slice(0, 10);

  const metricCards = [
    {
      label: "Total Suggestions",
      value: suggestions.total,
      icon: GitBranch,
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/20",
    },
    {
      label: "High Confidence",
      value: suggestions.highConfidence.length,
      icon: ShieldCheck,
      color: "text-green-300",
      bg: "bg-green-400/10",
      border: "border-green-400/20",
    },
    {
      label: "High Urgency",
      value: suggestions.highUrgency.length,
      icon: Zap,
      color: "text-red-300",
      bg: "bg-red-400/10",
      border: "border-red-400/20",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-5 backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.13),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Bot className="h-3.5 w-3.5 text-[#D4AF37]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Auto Stage Movement
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Pipeline Automation Suggestions
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Detects when inquiries or appointments look ready to move forward
              in the CRM pipeline, then lets staff apply the stage safely.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className={`rounded-2xl border ${metric.border} ${metric.bg} p-4 backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">
                      {metric.label}
                    </p>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>

                  <h3 className={`mt-2 text-2xl font-black ${metric.color}`}>
                    {metric.value}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                summary.level === "urgent"
                  ? "border-red-400/25 bg-red-500/10"
                  : summary.level === "active"
                  ? "border-[#D4AF37]/25 bg-[#D4AF37]/10"
                  : "border-green-400/25 bg-green-500/10"
              }`}
            >
              {summary.level === "urgent" ? (
                <Zap className="h-5 w-5 text-red-300" />
              ) : summary.level === "active" ? (
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-300" />
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#D4AF37]">
                Automation Summary
              </p>

              <h3 className="mt-2 text-xl font-black text-white">
                {summary.title}
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
                {summary.message}
              </p>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
            Review before applying
          </div>
        </div>
      </div>

      {topSuggestions.length === 0 ? (
        <div className={`${cardClass} rounded-[2rem] p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/20 bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-300" />
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            Pipeline looks clean
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
            No strong auto-stage movement suggestions were detected. Your CRM
            pipeline stages currently look stable.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {topSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`${cardClass} group relative overflow-hidden rounded-[2rem] p-5 transition duration-500 hover:-translate-y-0.5 hover:border-[#D4AF37]/30 sm:p-6`}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                      #{index + 1} Suggestion
                    </span>

                    <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                      {suggestion.leadType}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
                        suggestion.confidence === "High"
                          ? "border-green-400/20 bg-green-500/10 text-green-300"
                          : "border-orange-400/20 bg-orange-500/10 text-orange-300"
                      }`}
                    >
                      {suggestion.confidence} Confidence
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${
                        suggestion.urgency === "High"
                          ? "border-red-400/20 bg-red-500/10 text-red-300"
                          : suggestion.urgency === "Medium"
                          ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
                          : "border-white/10 bg-white/[0.04] text-gray-400"
                      }`}
                    >
                      {suggestion.urgency} Urgency
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-black text-white">
                    {suggestion.title}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-gray-300">
                    {suggestion.studentName}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    <span className="rounded-2xl border border-white/10 bg-black/25 px-4 py-2">
                      {suggestion.currentStage}
                    </span>

                    <ArrowRight className="h-4 w-4 text-[#D4AF37]" />

                    <span className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 font-bold text-[#D4AF37]">
                      {suggestion.suggestedStage}
                    </span>
                  </div>

                  <p className="mt-4 max-w-4xl text-sm leading-relaxed text-gray-400">
                    {suggestion.reason}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-3 xl:w-[230px]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">
                      Suggestion Score
                    </p>

                    <h4 className="mt-2 text-3xl font-black text-[#D4AF37]">
                      {suggestion.score}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => applySuggestion(suggestion)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {suggestion.actionLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AutoStageMovementPanel;
