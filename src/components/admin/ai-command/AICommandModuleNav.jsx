// AICommandModuleNav V5 PARTNER OS EXTREME — Clean Stable Switching
// Full replacement for:
// src/components/admin/ai-command/AICommandModuleNav.jsx
//
// No manual scroll restoration, no delayed timers and no height locking.
// The clicked card is blurred before the parent changes the lazy module.

import React from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  GitBranch,
  LineChart,
  Network,
} from "lucide-react";

const MODULES = [
  {
    id: "command-center",
    label: "Command Center",
    description:
      "Executive operating signals, risks, opportunities and system health.",
    icon: Brain,
  },
  {
    id: "executive-copilot",
    label: "Executive Copilot",
    description:
      "Leadership assistance, decision support and executive guidance.",
    icon: Bot,
  },
  {
    id: "predictive-insights",
    label: "Predictive Insights",
    description:
      "Forecasting, trend intelligence and forward-looking operating signals.",
    icon: LineChart,
  },
  {
    id: "workflow-intelligence",
    label: "Workflow Intelligence",
    description:
      "Journey health, bottlenecks, delays and recovery intelligence.",
    icon: GitBranch,
  },
  {
    id: "cross-system-intelligence",
    label: "Cross-System Intelligence",
    description:
      "Relationships and dependencies across Zaifan operating systems.",
    icon: Network,
  },
  {
    id: "ai-analytics",
    label: "AI Analytics",
    description:
      "Intelligence coverage, model outputs and analytical operating context.",
    icon: BarChart3,
  },
];

export default function AICommandModuleNav({
  activeModule = "command-center",
  onOpenModule,
}) {
  const navigationReady =
    typeof onOpenModule === "function";

  const normalizedActiveModule = MODULES.some(
    (module) => module.id === activeModule
  )
    ? activeModule
    : "command-center";

  const activeModuleMeta =
    MODULES.find(
      (module) =>
        module.id === normalizedActiveModule
    ) || MODULES[0];

  const handleModuleOpen = (event, moduleId) => {
    if (
      !navigationReady ||
      moduleId === normalizedActiveModule
    ) {
      return;
    }

    event.preventDefault();

    // The clicked card disappears when the next lazy module replaces
    // the current one. Remove focus first so the browser does not try
    // to relocate the viewport to another focused element.
    event.currentTarget.blur();

    onOpenModule(moduleId);
  };

  return (
    <nav
      aria-label="AI Command OS modules"
      className="min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#123865] bg-white shadow-[0_16px_42px_rgba(18,56,101,0.10)] [overflow-anchor:none]"
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="min-w-0 bg-[#123865] px-5 py-4 text-white sm:px-6 sm:py-5">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
            AI Command Workspace
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Choose an intelligence module
          </h2>

          <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-200">
            Move between executive guidance, forecasting,
            workflow diagnosis and cross-system evidence
            without changing the navigation layout.
          </p>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] px-5 py-4 text-white sm:px-6 sm:py-5 lg:border-l-[3px] lg:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Active Intelligence Module
          </p>

          <p className="mt-2 break-words text-xl font-black text-white">
            {activeModuleMeta.label}
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-orange-50">
            {activeModuleMeta.description}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {MODULES.map((module, index) => {
          const Icon = module.icon;
          const current =
            module.id === normalizedActiveModule;

          return (
            <button
              key={module.id}
              type="button"
              disabled={!navigationReady}
              onClick={(event) =>
                handleModuleOpen(event, module.id)
              }
              aria-current={
                current ? "page" : undefined
              }
              aria-pressed={current}
              title={
                current
                  ? `${module.label} is the active module`
                  : navigationReady
                    ? `Open ${module.label}`
                    : "Module navigation is not connected"
              }
              className={`group relative min-h-[150px] min-w-0 overflow-hidden rounded-[1.3rem] border-[3px] p-4 text-left shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                current
                  ? "border-[#FF5A0A] bg-white shadow-[0_12px_28px_rgba(255,90,10,0.15)]"
                  : navigationReady
                    ? "border-[#C9D7E6] bg-white hover:-translate-y-1 hover:border-[#123865] hover:bg-[#F2F7FF] hover:shadow-[0_16px_32px_rgba(18,56,101,0.11)]"
                    : "cursor-not-allowed border-[#D8E0E8] bg-slate-50 opacity-65"
              }`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-1.5 ${
                  current
                    ? "bg-[#FF5A0A]"
                    : "bg-[#123865] opacity-85"
                }`}
              />

              <span className="flex items-start justify-between gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
                    current
                      ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-sm"
                      : "border-[#123865] bg-[#F2F7FF] text-[#123865] group-hover:bg-[#123865] group-hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                </span>

                <span
                  className={`rounded-lg border-2 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
                    current
                      ? "border-[#FF5A0A] bg-white text-[#C2410C]"
                      : navigationReady
                        ? "border-[#C9D7E6] bg-[#F7FAFC] text-slate-500"
                        : "border-[#D8E0E8] bg-white text-slate-400"
                  }`}
                >
                  {current
                    ? "Current"
                    : navigationReady
                      ? `0${index + 1}`
                      : "Locked"}
                </span>
              </span>

              <span className="mt-3 block font-black text-[#10233F]">
                {module.label}
              </span>

              <span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-600">
                {module.description}
              </span>

              <span
                className={`mt-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${
                  current
                    ? "text-[#FF5A0A]"
                    : navigationReady
                      ? "text-[#123865]"
                      : "text-slate-400"
                }`}
              >
                {current
                  ? "Active workspace"
                  : navigationReady
                    ? "Open workspace"
                    : "Navigation unavailable"}

                {navigationReady && !current ? (
                  <ArrowRight size={12} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {!navigationReady ? (
        <div className="border-t-[3px] border-[#C9D7E6] bg-[#F2F7FF] px-4 py-3 sm:px-5">
          <p className="text-[10px] font-bold leading-4 text-[#123865]">
            The premium navigator remains visible,
            but switching is disabled until the parent
            supplies the real module handler.
          </p>
        </div>
      ) : null}
    </nav>
  );
}
