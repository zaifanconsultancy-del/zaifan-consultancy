import React from "react";
import {
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
    icon: Brain,
  },
  {
    id: "executive-copilot",
    label: "Executive Copilot",
    icon: Bot,
  },
  {
    id: "predictive-insights",
    label: "Predictive Insights",
    icon: LineChart,
  },
  {
    id: "workflow-intelligence",
    label: "Workflow Intelligence",
    icon: GitBranch,
  },
  {
    id: "cross-system-intelligence",
    label: "Cross-System Intelligence",
    icon: Network,
  },
  {
    id: "ai-analytics",
    label: "AI Analytics",
    icon: BarChart3,
  },
];

export default function AICommandModuleNav({
  activeModule,
  onOpenModule,
}) {
  const navigationReady = typeof onOpenModule === "function";

  return (
    <nav
      aria-label="AI Command OS modules"
      className="overflow-hidden rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EE] shadow-[0_10px_26px_rgba(23,36,61,0.055)]"
    >
      <div className="flex flex-col gap-2 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-orange-300">
            AI Executive Workspace
          </p>
          <p className="mt-0.5 text-sm font-black text-white">
            AI Command OS
          </p>
        </div>

        <span className="w-fit rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
          6 connected modules
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto p-3">
        {MODULES.map((module) => {
          const Icon = module.icon;
          const current = module.id === activeModule;

          return (
            <button
              key={module.id}
              type="button"
              disabled={current || !navigationReady}
              onClick={() => onOpenModule?.(module.id)}
              aria-current={current ? "page" : undefined}
              title={
                current
                  ? "Current AI Command module"
                  : navigationReady
                    ? `Open ${module.label}`
                    : "Module navigation is not connected"
              }
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                current
                  ? "cursor-default border-orange-500 bg-orange-500 text-white"
                  : navigationReady
                    ? "border-slate-300 bg-white text-[#10233F] hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50"
                    : "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400"
              }`}
            >
              <Icon size={14} />
              {module.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
