// ExecutiveReportingPanel V4 PARTNER-OS ALIGNED — Zaifan Analytics OS
// Full replacement for:
// src/components/admin/analytics/ExecutiveReportingPanel.jsx
//
// Production principles:
// - no fake "Ready", "Scheduled" or "Planned" report statuses
// - no fake executive snapshot health labels
// - reports appear from real supplied report records
// - generation / opening / distribution actions only appear when real handlers exist
// - archive, distribution and snapshots stay honest when their data is unavailable
// - supports future reporting integration without breaking today's Analytics OS parent
// - unified Zaifan navy/orange/cream Analytics OS visual language
//
// Supported props:
// analytics = {
//   reports?: [
//     {
//       id,
//       title,
//       description,
//       type,
//       status,
//       period,
//       createdAt,
//       generatedAt,
//       source,
//       url,
//       recipients,
//       deliveryStatus
//     }
//   ],
//   reportArchive?: [...same report shape],
//   reportDistribution?: [
//     { id, channel, recipient, reportTitle, status, sentAt, source }
//   ],
//   executiveSnapshots?: [
//     { id, label, value, detail, tone?, source? }
//   ],
//   metrics?: {
//     students, applications, offers, visas, revenue,
//     applicationRate, offerRate, visaRate
//   },
//   updatedAt | generatedAt | lastUpdated,
//   reportingSource?: string
// }
// compact?: boolean
// onGenerateReport?: async (reportType) => void
// onOpenReport?: (report) => void
// onDistributeReport?: (report) => void

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  FolderArchive,
  Info,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

const VIEW_OPTIONS = [
  { id: "reports", label: "Reports", icon: FileText },
  { id: "archive", label: "Archive", icon: FolderArchive },
  { id: "distribution", label: "Distribution", icon: Send },
  { id: "snapshots", label: "Snapshots", icon: BarChart3 },
];

const REPORT_TYPES = [
  "Daily Executive Brief",
  "Weekly Performance Report",
  "Monthly Growth Report",
  "Quarterly Board Report",
  "Annual Strategy Report",
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function normalize(value = "") {
  return safeText(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  const amount = number(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `£${amount.toLocaleString("en-GB")}`;
  }
}

function formatTimestamp(value) {
  if (!value) return "No timestamp supplied";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Timestamp unavailable";
  }
}

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.label || fallback;
}

function resolveDescription(item, fallback) {
  if (typeof item === "string") return fallback;
  return item?.description || item?.detail || item?.summary || fallback;
}

function getStatusTone(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("failed") ||
    clean.includes("error") ||
    clean.includes("blocked") ||
    clean.includes("critical")
  ) {
    return "red";
  }

  if (
    clean.includes("scheduled") ||
    clean.includes("pending") ||
    clean.includes("processing") ||
    clean.includes("queued") ||
    clean.includes("draft")
  ) {
    return "orange";
  }

  if (
    clean.includes("ready") ||
    clean.includes("generated") ||
    clean.includes("sent") ||
    clean.includes("delivered") ||
    clean.includes("complete")
  ) {
    return "green";
  }

  return "blue";
}

function searchable(...parts) {
  return normalize(parts.filter(Boolean).join(" "));
}

export default function ExecutiveReportingPanel({
  analytics = {},
  compact = false,
  onGenerateReport,
  onOpenReport,
  onDistributeReport,
}) {
  const [activeView, setActiveView] = useState("reports");
  const [search, setSearch] = useState("");
  const [generatingType, setGeneratingType] = useState("");
  const [generationError, setGenerationError] = useState("");

  const reports = useMemo(
    () =>
      safeArray(analytics.reports).map((item, index) => ({
        id: item?.id || `report-${index}`,
        title: resolveTitle(item, `Executive report ${index + 1}`),
        description: resolveDescription(
          item,
          "No report description supplied."
        ),
        type:
          typeof item === "string"
            ? ""
            : item?.type || item?.reportType || item?.category || "",
        status:
          typeof item === "string"
            ? ""
            : item?.status || item?.state || "",
        period:
          typeof item === "string"
            ? ""
            : item?.period || item?.range || "",
        createdAt:
          typeof item === "string"
            ? null
            : item?.createdAt || item?.created_at || null,
        generatedAt:
          typeof item === "string"
            ? null
            : item?.generatedAt || item?.generated_at || null,
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
        url: typeof item === "string" ? "" : item?.url || item?.href || "",
        recipients:
          typeof item === "string"
            ? []
            : safeArray(item?.recipients),
        deliveryStatus:
          typeof item === "string"
            ? ""
            : item?.deliveryStatus || item?.delivery_status || "",
        raw: item,
      })),
    [analytics.reports]
  );

  const archive = useMemo(
    () =>
      safeArray(analytics.reportArchive).map((item, index) => ({
        id: item?.id || `archive-${index}`,
        title: resolveTitle(item, `Archived report ${index + 1}`),
        description: resolveDescription(
          item,
          "No archive description supplied."
        ),
        type:
          typeof item === "string"
            ? ""
            : item?.type || item?.reportType || "",
        status:
          typeof item === "string"
            ? ""
            : item?.status || "Archived",
        period:
          typeof item === "string"
            ? ""
            : item?.period || "",
        generatedAt:
          typeof item === "string"
            ? null
            : item?.generatedAt || item?.generated_at || item?.createdAt || null,
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
        url: typeof item === "string" ? "" : item?.url || item?.href || "",
        raw: item,
      })),
    [analytics.reportArchive]
  );

  const distribution = useMemo(
    () =>
      safeArray(analytics.reportDistribution).map((item, index) => ({
        id: item?.id || `distribution-${index}`,
        channel:
          item?.channel || item?.method || item?.type || "Unknown channel",
        recipient:
          item?.recipient || item?.recipientName || item?.email || "Unknown recipient",
        reportTitle:
          item?.reportTitle || item?.report || item?.title || "Report",
        status: item?.status || item?.deliveryStatus || "",
        sentAt: item?.sentAt || item?.sent_at || null,
        source: item?.source || item?.module || "",
        raw: item,
      })),
    [analytics.reportDistribution]
  );

  const suppliedSnapshots = useMemo(
    () =>
      safeArray(analytics.executiveSnapshots).map((item, index) => ({
        id: item?.id || `snapshot-${index}`,
        label: resolveTitle(item, `Executive snapshot ${index + 1}`),
        value:
          typeof item === "string"
            ? "—"
            : item?.value ?? item?.status ?? item?.state ?? "—",
        detail: resolveDescription(
          item,
          "No snapshot explanation supplied."
        ),
        tone:
          typeof item === "string"
            ? "navy"
            : item?.tone || getStatusTone(item?.status || item?.state),
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
      })),
    [analytics.executiveSnapshots]
  );

  const fallbackSnapshots = useMemo(() => {
    const metrics = analytics.metrics || {};

    return [
      {
        id: "students",
        label: "Students",
        value: hasValue(metrics.students)
          ? number(metrics.students).toLocaleString("en-GB")
          : "—",
        detail: "Current student volume from Analytics OS.",
        tone: "blue",
        source: "analytics.metrics",
      },
      {
        id: "applications",
        label: "Applications",
        value: hasValue(metrics.applications)
          ? number(metrics.applications).toLocaleString("en-GB")
          : "—",
        detail: "Current application volume from Analytics OS.",
        tone: "navy",
        source: "analytics.metrics",
      },
      {
        id: "revenue",
        label: "Connected Revenue",
        value: hasValue(metrics.revenue) ? money(metrics.revenue) : "—",
        detail: "Collected payment value supplied to Analytics OS.",
        tone: "orange",
        source: "analytics.metrics",
      },
    ];
  }, [analytics.metrics]);

  const snapshots = suppliedSnapshots.length
    ? suppliedSnapshots
    : fallbackSnapshots;

  const query = normalize(search);

  const visibleReports = useMemo(
    () =>
      reports.filter((item) =>
        searchable(
          item.title,
          item.description,
          item.type,
          item.status,
          item.period,
          item.source,
          item.deliveryStatus
        ).includes(query)
      ),
    [reports, query]
  );

  const visibleArchive = useMemo(
    () =>
      archive.filter((item) =>
        searchable(
          item.title,
          item.description,
          item.type,
          item.status,
          item.period,
          item.source
        ).includes(query)
      ),
    [archive, query]
  );

  const visibleDistribution = useMemo(
    () =>
      distribution.filter((item) =>
        searchable(
          item.channel,
          item.recipient,
          item.reportTitle,
          item.status,
          item.source
        ).includes(query)
      ),
    [distribution, query]
  );

  const visibleSnapshots = useMemo(
    () =>
      snapshots.filter((item) =>
        searchable(
          item.label,
          item.value,
          item.detail,
          item.source
        ).includes(query)
      ),
    [snapshots, query]
  );

  const hasGenerate = typeof onGenerateReport === "function";
  const hasOpen = typeof onOpenReport === "function";
  const hasDistribute = typeof onDistributeReport === "function";

  const reportingSource =
    safeText(analytics.reportingSource).trim() || "No reporting source connected";

  const updatedAt =
    analytics.generatedAt || analytics.updatedAt || analytics.lastUpdated || null;

  const handleGenerate = async (reportType) => {
    if (!hasGenerate || generatingType) return;

    setGeneratingType(reportType);
    setGenerationError("");

    try {
      await onGenerateReport(reportType);
    } catch (error) {
      console.error("Executive report generation failed:", error);
      setGenerationError(
        error?.message || "Executive report generation failed."
      );
    } finally {
      setGeneratingType("");
    }
  };

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Analytics OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Executive Reporting
            </h2>
          </div>

          <FileText size={18} />
        </div>

        <div className="p-4">
          {reports.length ? (
            <div className="space-y-3">
              {reports.slice(0, 3).map((report) => (
                <CompactReport key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <SmallEmpty text="No executive reports connected." />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={FileText} label="Executive Reporting" />
              <HeaderChip icon={ShieldCheck} label="Evidence Based" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Executive Reporting Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Generate, review, archive and distribute executive reports only
              through connected reporting workflows. No report is labelled
              Ready or Scheduled unless real reporting data says so.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Reports" value={reports.length} />
              <DarkMetric label="Archived" value={archive.length} />
              <DarkMetric label="Deliveries" value={distribution.length} />
              <DarkMetric label="Snapshots" value={snapshots.length} />
            </div>
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Reporting connection
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {hasGenerate || reports.length ? "READY" : "OFF"}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  {hasGenerate
                    ? "generation handler connected"
                    : reports.length
                      ? "read-only reports connected"
                      : "no reporting workflow"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <BarChart3 size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Source
              </p>
              <p className="mt-2 text-xs font-black text-white">
                {reportingSource}
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                Last snapshot: {formatTimestamp(updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {generationError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Report generation failed"
          detail={generationError}
          actionLabel="Dismiss"
          onAction={() => setGenerationError("")}
        />
      ) : null}

      {!hasGenerate ? (
        <InlineNotice
          tone="blue"
          icon={Info}
          title="Report generation is not connected"
          detail="This workspace stays read-only until the parent supplies onGenerateReport. Existing report records can still be reviewed."
        />
      ) : null}

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EF] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {VIEW_OPTIONS.map((view) => {
              const Icon = view.icon;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                    activeView === view.id
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4EA]"
                  }`}
                >
                  <Icon size={14} />
                  {view.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reports, archive, recipients or snapshots..."
              aria-label="Search Executive Reporting"
              className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear reporting search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {activeView === "reports" ? (
        <ReportsWorkspace
          reports={visibleReports}
          allReports={reports}
          query={query}
          canGenerate={hasGenerate}
          canOpen={hasOpen}
          canDistribute={hasDistribute}
          generatingType={generatingType}
          onGenerate={handleGenerate}
          onOpen={onOpenReport}
          onDistribute={onDistributeReport}
          onClear={() => setSearch("")}
        />
      ) : null}

      {activeView === "archive" ? (
        <ArchiveWorkspace
          archive={visibleArchive}
          allArchive={archive}
          query={query}
          canOpen={hasOpen}
          onOpen={onOpenReport}
          onClear={() => setSearch("")}
        />
      ) : null}

      {activeView === "distribution" ? (
        <DistributionWorkspace
          items={visibleDistribution}
          allItems={distribution}
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      {activeView === "snapshots" ? (
        <SnapshotsWorkspace
          items={visibleSnapshots}
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#F2F7FF] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#123865]" />
            <div>
              <p className="font-black text-[#10233F]">
                Reporting integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                The old static Ready, Scheduled and Planned labels are removed.
                Report status now comes only from supplied report records.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-[#F97316] bg-[#FFF4EA] p-4">
          <div className="flex items-start gap-3">
            <Database size={18} className="mt-0.5 shrink-0 text-[#B84F0E]" />
            <div>
              <p className="font-black text-[#10233F]">
                Honest executive snapshots
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                No generic Strong, Healthy or Stable business labels are
                invented. Supplied snapshots are used, otherwise current
                Analytics OS metrics are shown plainly.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function ReportsWorkspace({
  reports,
  allReports,
  query,
  canGenerate,
  canOpen,
  canDistribute,
  generatingType,
  onGenerate,
  onOpen,
  onDistribute,
  onClear,
}) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow="Reporting Workspace"
        title="Executive Reports"
        description="Existing reports plus generation controls when a real reporting handler is connected."
        icon={FileText}
        count={reports.length}
      />

      <div className="p-4 sm:p-5">
        {canGenerate ? (
          <div className="mb-4 overflow-hidden rounded-[1.35rem] border-[3px] border-[#F97316] bg-[#FFF4EA]">
            <div className="border-b-2 border-orange-200 p-4">
              <p className="font-black text-[#10233F]">Generate report</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                These controls call the parent reporting workflow. They do not
                create fake report cards locally.
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto p-4">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={Boolean(generatingType)}
                  onClick={() => void onGenerate(type)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 border-[#F97316] bg-white px-3 text-[9px] font-black text-[#B84F0E] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generatingType === type ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <FileText size={13} />
                  )}
                  {generatingType === type ? "Generating..." : type}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!allReports.length ? (
          <EmptyState
            title="No executive reports connected"
            text="No report records were supplied. This workspace will not pretend that daily, weekly, monthly or board reports already exist."
          />
        ) : reports.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                canOpen={canOpen}
                canDistribute={canDistribute}
                onOpen={() => onOpen?.(report.raw ?? report)}
                onDistribute={() => onDistribute?.(report.raw ?? report)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reports match this search"
            text="Try another search term."
            onClear={query ? onClear : undefined}
          />
        )}
      </div>
    </section>
  );
}

function ArchiveWorkspace({
  archive,
  allArchive,
  query,
  canOpen,
  onOpen,
  onClear,
}) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow="Historical Reporting"
        title="Report Archive"
        description="Historical reports only appear when real archive records are supplied."
        icon={FolderArchive}
        count={archive.length}
      />

      <div className="p-4 sm:p-5">
        {!allArchive.length ? (
          <EmptyState
            title="Report archive is empty"
            text="Connect analytics.reportArchive when historical generated reports are stored."
          />
        ) : archive.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {archive.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                canOpen={canOpen}
                onOpen={() => onOpen?.(report.raw ?? report)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No archived reports match this search"
            text="Try another search term."
            onClear={query ? onClear : undefined}
          />
        )}
      </div>
    </section>
  );
}

function DistributionWorkspace({ items, allItems, query, onClear }) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow="Delivery Audit"
        title="Report Distribution"
        description="Delivery records appear only when a reporting/distribution workflow supplies them."
        icon={Mail}
        count={items.length}
      />

      <div className="p-4 sm:p-5">
        {!allItems.length ? (
          <EmptyState
            title="No report distribution records connected"
            text="No stakeholder delivery history is available yet."
          />
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <DistributionCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No distribution records match this search"
            text="Try another search term."
            onClear={query ? onClear : undefined}
          />
        )}
      </div>
    </section>
  );
}

function SnapshotsWorkspace({ items, query, onClear }) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#F97316] bg-[#FFF8EF]">
      <SectionHeader
        eyebrow="Executive Snapshot"
        title="Current Reporting Context"
        description="Supplied executive snapshot fields, or plain current Analytics OS metrics when no custom snapshot exists."
        icon={BarChart3}
        count={items.length}
      />

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.length ? (
          items.map((item) => (
            <SnapshotCard key={item.id} item={item} />
          ))
        ) : (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              title="No executive snapshots match this search"
              text="Try another search term."
              onClear={query ? onClear : undefined}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ReportCard({
  report,
  canOpen,
  canDistribute,
  onOpen,
  onDistribute,
}) {
  const tone = getStatusTone(report.status);
  const StatusIcon =
    tone === "green"
      ? CheckCircle2
      : tone === "red"
        ? AlertTriangle
        : Clock3;

  return (
    <article className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{report.title}</p>
            {report.source ? <SourceBadge source={report.source} /> : null}
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {report.description}
          </p>
        </div>

        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusBadgeClass(tone)}`}>
          <StatusIcon size={11} />
          {report.status || "Status unavailable"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Type" value={report.type || "—"} />
        <MiniStat label="Period" value={report.period || "—"} />
        <MiniStat
          label="Generated"
          value={
            report.generatedAt
              ? formatTimestamp(report.generatedAt)
              : "—"
          }
        />
        <MiniStat
          label="Delivery"
          value={report.deliveryStatus || "—"}
        />
      </div>

      {(canOpen || canDistribute) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canOpen ? (
            <ActionButton label="Open Report" onClick={onOpen} />
          ) : null}

          {canDistribute ? (
            <ActionButton label="Distribute" onClick={onDistribute} secondary />
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
          Read-only report record
        </p>
      )}
    </article>
  );
}

function DistributionCard({ item }) {
  const tone = getStatusTone(item.status);

  return (
    <article className={`rounded-[1.2rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="font-black text-[#10233F]">{item.reportTitle}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            {item.recipient}
          </p>
        </div>

        <span className={`w-fit rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusBadgeClass(tone)}`}>
          {item.status || "Status unavailable"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat label="Channel" value={item.channel} />
        <MiniStat
          label="Sent"
          value={item.sentAt ? formatTimestamp(item.sentAt) : "—"}
        />
        <MiniStat label="Source" value={item.source || "—"} />
      </div>
    </article>
  );
}

function SnapshotCard({ item }) {
  return (
    <article className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(item.tone)}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {item.label}
      </p>

      <p className="mt-2 break-words text-2xl font-black text-[#10233F]">
        {safeText(item.value)}
      </p>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {item.detail}
      </p>

      {item.source ? <SourceBadge source={item.source} /> : null}
    </article>
  );
}

function CompactReport({ report }) {
  return (
    <article className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
      <p className="font-black text-[#10233F]">{report.title}</p>
      <p className="mt-1 text-[9px] font-semibold text-slate-500">
        {report.status || "Status unavailable"}
      </p>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-4 text-white">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
          {count}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {typeof value === "number"
          ? value.toLocaleString("en-GB")
          : value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border-2 border-[#E1E8F0] bg-white/80 p-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function SourceBadge({ source }) {
  return (
    <span className="mt-3 inline-flex max-w-full truncate rounded-md border border-[#C9D7E6] bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
      {source}
    </span>
  );
}

function ActionButton({ label, onClick, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] transition ${
        secondary
          ? "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E] hover:bg-orange-100"
          : "border-[#234E78] bg-white text-[#123865] hover:bg-[#123865] hover:text-white"
      }`}
    >
      {label}
      <ArrowRight size={12} />
    </button>
  );
}

function InlineNotice({
  tone = "blue",
  icon: Icon = Info,
  title,
  detail,
  actionLabel,
  onAction,
}) {
  const classes =
    tone === "red"
      ? "border-red-400 bg-red-50"
      : "border-blue-300 bg-blue-50";

  return (
    <div className={`rounded-[1.25rem] border-[3px] p-4 ${classes}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon
            className={`mt-0.5 shrink-0 ${
              tone === "red" ? "text-red-700" : "text-blue-700"
            }`}
            size={18}
          />
          <div>
            <p className="font-black text-[#10233F]">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {detail}
            </p>
          </div>
        </div>

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-lg border-2 border-[#C9D7E6] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#10233F] transition hover:border-[#F97316] hover:bg-[#FFF4EA]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-[#C9D7E6] bg-slate-50 p-6 text-center">
      <Sparkles size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-[#F97316] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4EA]"
        >
          Clear search
        </button>
      ) : null}
    </div>
  );
}

function SmallEmpty({ text }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-slate-50 p-4 text-center">
      <p className="text-xs font-semibold text-slate-600">{text}</p>
    </div>
  );
}

function toneClass(tone = "navy") {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA]";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#F2F7FF]";
}

function statusBadgeClass(tone = "blue") {
  if (tone === "red") return "border-red-300 bg-red-50 text-red-800";
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  if (tone === "green") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  return "border-blue-300 bg-blue-50 text-blue-800";
}
