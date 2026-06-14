import React, { useState } from "react";

function ReportCard({
  title,
  description,
  status,
  tone = "cyan",
}) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div
      className={`rounded-3xl border p-5 ${
        tones[tone] || tones.cyan
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black text-white">
            {title}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
          {status}
        </span>
      </div>
    </div>
  );
}

export default function ExecutiveReportingPanel({
  analytics = {},
  compact = false,
}) {
  const [activeView, setActiveView] =
    useState("reports");

  const reports = [
    {
      title: "Daily Executive Brief",
      description:
        "Daily performance, growth, risk and operational summary.",
      status: "Ready",
      tone: "cyan",
    },
    {
      title: "Weekly Performance Report",
      description:
        "Weekly student, revenue and counselor performance.",
      status: "Ready",
      tone: "emerald",
    },
    {
      title: "Monthly Growth Report",
      description:
        "Growth metrics, trends and strategic analysis.",
      status: "Scheduled",
      tone: "violet",
    },
    {
      title: "Quarterly Board Report",
      description:
        "Executive level board and stakeholder reporting.",
      status: "Planned",
      tone: "amber",
    },
    {
      title: "Annual Strategy Report",
      description:
        "Long-term strategic planning and performance review.",
      status: "Planned",
      tone: "rose",
    },
  ];

  if (compact) {
    return (
      <div className="rounded-3xl border border-white/10 p-5">
        <h2 className="text-xl font-black text-white">
          Executive Reporting
        </h2>

        <div className="mt-4 space-y-3">
          {reports.slice(0, 3).map((report) => (
            <div
              key={report.title}
              className="rounded-2xl border border-white/10 p-3"
            >
              <p className="font-bold text-white">
                {report.title}
              </p>

              <p className="text-xs text-slate-400">
                {report.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
          Analytics OS
        </p>

        <h1 className="mt-2 text-3xl font-black text-white">
          Executive Reporting Center
        </h1>

        <p className="mt-2 text-slate-400">
          Executive summaries, board reports,
          growth reports, strategic reviews
          and stakeholder reporting.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "reports",
          "archive",
          "distribution",
          "snapshots",
        ].map((view) => (
          <button
            key={view}
            onClick={() =>
              setActiveView(view)
            }
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              activeView === view
                ? "bg-white text-slate-900"
                : "border border-white/10 text-white"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {activeView === "reports" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {reports.map((report) => (
            <ReportCard
              key={report.title}
              {...report}
            />
          ))}
        </div>
      )}

      {activeView === "archive" && (
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Report Archive
          </h2>

          <p className="mt-3 text-slate-400">
            Historical executive reports,
            snapshots and reporting records.
          </p>
        </div>
      )}

      {activeView === "distribution" && (
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Distribution Center
          </h2>

          <p className="mt-3 text-slate-400">
            Executive delivery channels,
            scheduled reporting and
            stakeholder distribution.
          </p>
        </div>
      )}

      {activeView === "snapshots" && (
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Executive Snapshots
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs text-slate-500">
                Growth
              </p>

              <p className="mt-2 text-2xl font-black">
                Strong
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs text-slate-500">
                Revenue
              </p>

              <p className="mt-2 text-2xl font-black">
                Healthy
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs text-slate-500">
                Operations
              </p>

              <p className="mt-2 text-2xl font-black">
                Stable
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}