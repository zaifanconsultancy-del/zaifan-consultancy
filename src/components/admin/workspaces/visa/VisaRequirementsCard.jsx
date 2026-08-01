// VisaRequirementsCard PARTNER OS EXTREME V4 — Visa Readiness Command Center
// src/components/admin/VisaRequirementsCard.jsx
//
// Maximum pass:
// - preserves dedicated Visa OS + Student Master File architecture
// - no document duplication; requirements continue linking to existing documents
// - student_id + student_type identity-safe Visa OS reads
// - explicit visaId is still scoped to the active student identity
// - sharedVisa/sharedRequirements/sharedDocuments are authoritative when supplied
// - empty shared arrays are respected instead of triggering duplicate Supabase fetches
// - stale-request protection when switching students/visa cases
// - timeout cleanup + partial-source recovery
// - requirement readiness distinguishes "not assessed" from 0% ready
// - overdue/due-soon/expiry/blocker intelligence is deterministic and transparent
// - duplicate linked-document lookups are indexed for better render performance
// - requirement status normalization covers common Visa OS variants
// - stronger counselor next-action guidance without GPT or invented outcomes
// - clearer data-source health and refresh state
// - approved Zaifan Admin OS cream/orange/navy contrast

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  FileWarning,
  FolderOpen,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const normalizeStudentType = (value) => {
  const clean = normalize(value);

  if (clean === "appointment") return "appointment";
  return "inquiry";
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateOnlyTimestamp = (value) => {
  if (!value) return null;

  const raw = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const deadlineMeta = (value) => {
  const timestamp = dateOnlyTimestamp(value);
  if (!timestamp) return null;

  const days = Math.ceil((timestamp - Date.now()) / 86400000);

  if (days < 0) {
    return {
      label: `${Math.abs(days)}d overdue`,
      tone: "red",
      days,
      timestamp,
    };
  }

  if (days === 0) {
    return {
      label: "Due today",
      tone: "red",
      days,
      timestamp,
    };
  }

  if (days <= 7) {
    return {
      label: `${days}d left`,
      tone: "orange",
      days,
      timestamp,
    };
  }

  if (days <= 30) {
    return {
      label: `${days}d left`,
      tone: "blue",
      days,
      timestamp,
    };
  }

  return {
    label: formatDate(value),
    tone: "slate",
    days,
    timestamp,
  };
};

const requirementStatus = (value) => {
  const clean = normalize(value);

  if (
    [
      "verified",
      "completed",
      "complete",
      "approved",
      "ready",
      "accepted",
    ].includes(clean)
  ) {
    return "ready";
  }

  if (
    [
      "received",
      "under review",
      "review",
      "reviewing",
      "submitted",
      "uploaded",
      "pending review",
    ].includes(clean)
  ) {
    return "review";
  }

  if (
    [
      "rejected",
      "declined",
      "invalid",
      "expired",
    ].includes(clean)
  ) {
    return "rejected";
  }

  return "missing";
};

const withTimeout = (
  promise,
  message = "Request timed out.",
  timeoutMs = REQUEST_TIMEOUT_MS
) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
};

function VisaRequirementsCard({
  student = {},
  visaId = null,
  sharedVisa = undefined,
  sharedRequirements = undefined,
  sharedDocuments = undefined,
  onOpenMasterFile = null,
}) {
  const [visa, setVisa] = useState(sharedVisa || null);
  const [requirements, setRequirements] = useState(
    Array.isArray(sharedRequirements) ? sharedRequirements : []
  );
  const [documents, setDocuments] = useState(
    Array.isArray(sharedDocuments)
      ? sharedDocuments
      : safeArray(student?.documents)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sourceHealth, setSourceHealth] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const requestRef = useRef(0);
  const identityRef = useRef("");

  const studentId = Number(student?.id);
  const hasValidStudentId =
    Number.isFinite(studentId) && studentId > 0;

  const studentType = normalizeStudentType(
    student?.student_type ||
      student?.__leadType ||
      student?.type ||
      "inquiry"
  );

  const resolvedVisaId =
    visaId ||
    sharedVisa?.id ||
    null;

  const identityKey = `${String(student?.id || "")}:${studentType}:${
    resolvedVisaId || "latest"
  }`;

  const hasSharedVisa = sharedVisa !== undefined;
  const hasSharedRequirements =
    sharedRequirements !== undefined;
  const hasSharedDocuments =
    sharedDocuments !== undefined;

  const load = async ({ force = false } = {}) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!hasValidStudentId) {
      setVisa(null);
      setRequirements([]);
      setDocuments([]);
      setLoading(false);
      setSourceHealth({});
      setError(
        "A valid Student OS ID is required before visa readiness can load."
      );
      return;
    }

    setLoading(true);
    setError("");

    const nextHealth = {};
    const failures = [];

    try {
      let visaRow =
        hasSharedVisa && !force
          ? sharedVisa || null
          : null;

      if (hasSharedVisa && !force) {
        nextHealth.visa = "shared";
      } else {
        try {
          let query = supabase
            .from("student_visas")
            .select("*")
            .eq("student_id", studentId)
            .eq("student_type", studentType)
            .eq("is_archived", false);

          if (resolvedVisaId) {
            query = query.eq("id", resolvedVisaId);
          } else {
            query = query
              .order("created_at", {
                ascending: false,
              })
              .limit(1);
          }

          const result = await withTimeout(
            query,
            "Visa case loading timed out."
          );

          if (result.error) throw result.error;

          visaRow = result.data?.[0] || null;
          nextHealth.visa = "live";
        } catch (visaError) {
          nextHealth.visa = "error";
          failures.push({
            source: "visa",
            message:
              visaError?.message ||
              "Visa case could not be loaded.",
          });
        }
      }

      let requirementRows =
        hasSharedRequirements && !force
          ? safeArray(sharedRequirements)
          : null;

      if (hasSharedRequirements && !force) {
        nextHealth.requirements = "shared";
      } else if (visaRow?.id) {
        try {
          const result = await withTimeout(
            supabase
              .from("student_visa_requirements")
              .select("*")
              .eq("visa_id", visaRow.id)
              .order("created_at", {
                ascending: true,
              }),
            "Visa requirements loading timed out."
          );

          if (result.error) throw result.error;

          requirementRows = result.data || [];
          nextHealth.requirements = "live";
        } catch (requirementError) {
          requirementRows = null;
          nextHealth.requirements = "error";
          failures.push({
            source: "requirements",
            message:
              requirementError?.message ||
              "Visa requirements could not be loaded.",
          });
        }
      } else {
        requirementRows = [];
        nextHealth.requirements = "empty";
      }

      let documentRows =
        hasSharedDocuments && !force
          ? safeArray(sharedDocuments)
          : null;

      if (hasSharedDocuments && !force) {
        nextHealth.documents = "shared";
      } else {
        try {
          const result = await withTimeout(
            supabase
              .from("student_documents")
              .select("*")
              .eq("student_id", studentId)
              .eq("student_type", studentType)
              .order("created_at", {
                ascending: true,
              }),
            "Student Master File loading timed out."
          );

          if (result.error) throw result.error;

          documentRows = result.data || [];
          nextHealth.documents = "live";
        } catch (documentError) {
          documentRows = null;
          nextHealth.documents = "error";
          failures.push({
            source: "documents",
            message:
              documentError?.message ||
              "Student Master File documents could not be loaded.",
          });
        }
      }

      if (requestRef.current !== requestId) return;

      if (
        nextHealth.visa !== "error" ||
        hasSharedVisa
      ) {
        setVisa(visaRow);
      }

      if (requirementRows !== null) {
        setRequirements(requirementRows);
      }

      if (documentRows !== null) {
        setDocuments(documentRows);
      }

      setSourceHealth(nextHealth);
      setLastSyncedAt(new Date());

      if (failures.length) {
        setError(
          `Some Visa OS sources could not refresh: ${failures
            .map((item) => item.source)
            .join(
              ", "
            )}. Existing data was preserved for failed sources.`
        );
      }
    } catch (loadError) {
      if (requestRef.current !== requestId) return;

      console.error(
        "Visa readiness load failed:",
        loadError
      );

      setError(
        loadError?.message ||
          "Visa readiness could not be loaded."
      );
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (
      identityRef.current === identityKey
    ) {
      return;
    }

    identityRef.current = identityKey;
    requestRef.current += 1;

    setError("");
    setSourceHealth({});

    if (hasSharedVisa) {
      setVisa(sharedVisa || null);
    } else {
      setVisa(null);
    }

    if (hasSharedRequirements) {
      setRequirements(
        safeArray(sharedRequirements)
      );
    } else {
      setRequirements([]);
    }

    if (hasSharedDocuments) {
      setDocuments(
        safeArray(sharedDocuments)
      );
    } else {
      setDocuments(
        safeArray(student?.documents)
      );
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityKey]);

  useEffect(() => {
    if (!hasSharedVisa) return;
    setVisa(sharedVisa || null);
  }, [sharedVisa, hasSharedVisa]);

  useEffect(() => {
    if (!hasSharedRequirements) return;
    setRequirements(
      safeArray(sharedRequirements)
    );
  }, [
    sharedRequirements,
    hasSharedRequirements,
  ]);

  useEffect(() => {
    if (!hasSharedDocuments) return;
    setDocuments(
      safeArray(sharedDocuments)
    );
  }, [
    sharedDocuments,
    hasSharedDocuments,
  ]);

  const requiredRequirements = useMemo(
    () =>
      requirements.filter(
        (item) => item.required !== false
      ),
    [requirements]
  );

  const stats = useMemo(() => {
    const ready = requiredRequirements.filter(
      (item) =>
        requirementStatus(item.status) ===
        "ready"
    ).length;

    const review = requiredRequirements.filter(
      (item) =>
        requirementStatus(item.status) ===
        "review"
    ).length;

    const missing = requiredRequirements.filter(
      (item) =>
        requirementStatus(item.status) ===
          "missing" ||
        requirementStatus(item.status) ===
          "rejected"
    ).length;

    const rejected =
      requiredRequirements.filter(
        (item) =>
          requirementStatus(item.status) ===
          "rejected"
      ).length;

    const overdue =
      requiredRequirements.filter((item) => {
        if (!item.due_date) return false;

        if (
          requirementStatus(item.status) ===
          "ready"
        ) {
          return false;
        }

        const timestamp =
          dateOnlyTimestamp(item.due_date);

        return (
          timestamp !== null &&
          timestamp < Date.now()
        );
      }).length;

    const dueSoon =
      requiredRequirements.filter((item) => {
        if (!item.due_date) return false;

        if (
          requirementStatus(item.status) ===
          "ready"
        ) {
          return false;
        }

        const meta = deadlineMeta(
          item.due_date
        );

        return (
          meta &&
          meta.days >= 0 &&
          meta.days <= 7
        );
      }).length;

    const readiness =
      requiredRequirements.length > 0
        ? Math.round(
            (ready /
              requiredRequirements.length) *
              100
          )
        : null;

    return {
      total: requiredRequirements.length,
      ready,
      review,
      missing,
      rejected,
      overdue,
      dueSoon,
      readiness,
    };
  }, [requiredRequirements]);

  const documentIndex = useMemo(() => {
    const map = new Map();

    documents.forEach((document) => {
      if (document?.id !== undefined) {
        map.set(
          String(document.id),
          document
        );
      }
    });

    return map;
  }, [documents]);

  const blockers = useMemo(() => {
    const rows = [];

    requiredRequirements.forEach((item) => {
      const status =
        requirementStatus(item.status);

      const due = deadlineMeta(
        item.due_date
      );

      if (status === "rejected") {
        rows.push({
          id: `${item.id}-rejected`,
          label: `${
            item.requirement_name ||
            "Requirement"
          }: rejected`,
          tone: "red",
          priority: 100,
        });
        return;
      }

      if (
        due?.days !== undefined &&
        due.days < 0 &&
        status !== "ready"
      ) {
        rows.push({
          id: `${item.id}-overdue`,
          label: `${
            item.requirement_name ||
            "Requirement"
          }: ${due.label}`,
          tone: "red",
          priority: 95,
        });
        return;
      }

      if (status === "missing") {
        rows.push({
          id: `${item.id}-missing`,
          label: `${
            item.requirement_name ||
            "Requirement"
          }: missing`,
          tone:
            due?.tone === "red"
              ? "red"
              : "orange",
          priority:
            due?.tone === "red"
              ? 90
              : 80,
        });
        return;
      }

      if (
        due?.days !== undefined &&
        due.days >= 0 &&
        due.days <= 7 &&
        status !== "ready"
      ) {
        rows.push({
          id: `${item.id}-due-soon`,
          label: `${
            item.requirement_name ||
            "Requirement"
          }: ${due.label}`,
          tone: "orange",
          priority: 70,
        });
      }
    });

    return rows
      .sort(
        (a, b) =>
          b.priority - a.priority
      )
      .slice(0, 6);
  }, [requiredRequirements]);

  const linkedDocumentIntelligence =
    useMemo(() => {
      const expiring = [];
      const missingLinks = [];

      requiredRequirements.forEach(
        (requirement) => {
          const linkedId =
            requirement.linked_document_id
              ? String(
                  requirement.linked_document_id
                )
              : "";

          const linked = linkedId
            ? documentIndex.get(linkedId)
            : null;

          if (!linked) {
            if (
              requirementStatus(
                requirement.status
              ) !== "ready"
            ) {
              missingLinks.push({
                id: requirement.id,
                requirement:
                  requirement.requirement_name ||
                  "Requirement",
              });
            }

            return;
          }

          const expiry =
            deadlineMeta(
              linked.expiry_date
            );

          if (
            expiry &&
            ["red", "orange", "blue"].includes(
              expiry.tone
            )
          ) {
            expiring.push({
              id: `${
                requirement.id
              }-${linked.id}`,
              requirement:
                requirement.requirement_name ||
                "Requirement",
              document:
                linked.document_name ||
                linked.original_file_name ||
                "Document",
              meta: expiry,
            });
          }
        }
      );

      expiring.sort((a, b) => {
        const first =
          a.meta?.timestamp ??
          Number.MAX_SAFE_INTEGER;

        const second =
          b.meta?.timestamp ??
          Number.MAX_SAFE_INTEGER;

        return first - second;
      });

      return {
        expiring: expiring.slice(0, 5),
        missingLinks,
      };
    }, [
      requiredRequirements,
      documentIndex,
    ]);

  const nextRequirement = useMemo(() => {
    const candidates =
      requiredRequirements
        .filter(
          (item) =>
            requirementStatus(
              item.status
            ) !== "ready"
        )
        .map((item) => {
          const status =
            requirementStatus(
              item.status
            );
          const due = deadlineMeta(
            item.due_date
          );

          let priority = 0;

          if (status === "rejected") {
            priority = 100;
          } else if (
            due?.days !== undefined &&
            due.days < 0
          ) {
            priority = 95;
          } else if (
            status === "missing"
          ) {
            priority = 80;
          } else if (
            due?.days !== undefined &&
            due.days <= 7
          ) {
            priority = 70;
          } else if (
            status === "review"
          ) {
            priority = 40;
          }

          return {
            item,
            priority,
            due,
          };
        })
        .sort((a, b) => {
          if (
            b.priority !== a.priority
          ) {
            return (
              b.priority - a.priority
            );
          }

          const aTime =
            a.due?.timestamp ??
            Number.MAX_SAFE_INTEGER;
          const bTime =
            b.due?.timestamp ??
            Number.MAX_SAFE_INTEGER;

          return aTime - bTime;
        });

    return candidates[0] || null;
  }, [requiredRequirements]);

  const health = useMemo(() => {
    if (!visa) {
      return {
        label: "No Visa Case",
        tone: "slate",
        text:
          "Create or select a Visa OS case before readiness can become operational.",
      };
    }

    if (
      requiredRequirements.length === 0
    ) {
      return {
        label: "Not Assessed",
        tone: "orange",
        text:
          "The visa case exists, but no required Visa OS checklist has been configured yet.",
      };
    }

    if (
      stats.rejected > 0 ||
      stats.overdue > 0
    ) {
      return {
        label: "Blocked",
        tone: "red",
        text:
          "Rejected or overdue visa requirements need counselor action before the case is treated as ready.",
      };
    }

    if (stats.missing > 0) {
      return {
        label: "Incomplete",
        tone: "orange",
        text:
          "Required visa items are still missing.",
      };
    }

    if (stats.review > 0) {
      return {
        label: "Under Review",
        tone: "blue",
        text:
          "Documents are present but some requirements still need review or verification.",
      };
    }

    if (
      stats.readiness === 100
    ) {
      return {
        label: "Ready",
        tone: "green",
        text:
          "Every required Visa OS item is currently verified or complete.",
      };
    }

    return {
      label: "In Progress",
      tone: "blue",
      text:
        "Visa readiness is progressing.",
    };
  }, [
    visa,
    requiredRequirements.length,
    stats,
  ]);

  const readinessLabel =
    stats.readiness === null
      ? "Not assessed"
      : `${stats.readiness}%`;

  return (
    <section className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={12} />
                Visa Readiness Intelligence
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                <Database size={12} />
                Visa OS + Master File
              </span>
            </div>

            <h3 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Visa Requirements Command Center
            </h3>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Control live Visa OS readiness, linked Student Master File evidence,
              deadlines, expiry pressure, blockers and counselor next actions.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <HeroMetric label="Required" value={stats.total} />
              <HeroMetric label="Ready" value={stats.ready} />
              <HeroMetric label="Review" value={stats.review} />
              <HeroMetric label="Overdue" value={stats.overdue} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Visa Command Actions
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">
              Open the linked Student Master File or refresh all Visa OS sources
              before acting on readiness, blockers or expiry pressure.
            </p>

            <div className="mt-4 grid min-w-0 gap-2">
              {typeof onOpenMasterFile === "function" ? (
                <button
                  type="button"
                  onClick={onOpenMasterFile}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-[#123865] px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:border-white hover:bg-[#0d2b50] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                >
                  <FolderOpen size={15} />
                  Open Master File
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => load({ force: true })}
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Refreshing..." : "Refresh Visa Data"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.35rem] border-[3px] border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
          {error}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div
          className={`min-w-0 rounded-[1.5rem] border-[3px] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)] ${getHealthStyle(
            health.tone
          )}`}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
                Current Visa Readiness State
              </p>
              <h4 className="mt-1 text-lg font-black text-[#10233F]">
                {health.label}
              </h4>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                {health.text}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
          <div className="flex items-center gap-2">
            <Database size={17} className="text-[#123865]" />
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              Data Source Health
            </p>
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            {Object.entries(sourceHealth).map(([source, state]) => (
              <span
                key={source}
                className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getSourceStyle(
                  state
                )}`}
              >
                {source}: {state}
              </span>
            ))}

            {lastSyncedAt ? (
              <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                Synced{" "}
                {lastSyncedAt.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric
          label="Readiness"
          value={readinessLabel}
          icon={BadgeCheck}
          tone={
            stats.readiness === 100
              ? "green"
              : stats.readiness === null
              ? "slate"
              : "orange"
          }
        />

        <Metric
          label="Required"
          value={stats.total}
          icon={Database}
          tone="slate"
        />

        <Metric
          label="Ready"
          value={stats.ready}
          icon={CheckCircle2}
          tone="green"
        />

        <Metric
          label="Review"
          value={stats.review}
          icon={Clock3}
          tone="blue"
        />

        <Metric
          label="Missing"
          value={stats.missing}
          icon={FileWarning}
          tone={
            stats.missing
              ? "red"
              : "slate"
          }
        />

        <Metric
          label="Due ≤7d"
          value={stats.dueSoon}
          icon={TimerReset}
          tone={
            stats.dueSoon
              ? "orange"
              : "slate"
          }
        />

        <Metric
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          tone={
            stats.overdue
              ? "red"
              : "slate"
          }
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-2">
          {requirements.length === 0 &&
          !loading ? (
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-7 text-center shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
              <FileCheck2
                size={28}
                className="mx-auto text-orange-500"
              />

              <p className="mt-3 text-sm font-black text-[#10233F]">
                No Visa OS requirements created yet
              </p>

              <p className="mx-auto mt-2 max-w-lg text-xs font-semibold leading-5 text-slate-600">
                This means readiness is not assessed yet — it is not treated as
                0% failure or 100% completion.
              </p>
            </div>
          ) : null}

          {requirements
            .slice(0, 10)
            .map((item) => {
              const linked =
                item.linked_document_id
                  ? documentIndex.get(
                      String(
                        item.linked_document_id
                      )
                    )
                  : null;

              const due = deadlineMeta(
                item.due_date
              );

              return (
                <div
                  key={item.id}
                  className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[#10233F]">
                          {item.requirement_name ||
                            "Unnamed requirement"}
                        </p>

                        <RequirementStatus
                          value={
                            item.status
                          }
                        />

                        {item.required ===
                        false ? (
                          <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                            Optional
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {linked
                          ? `Master File: ${
                              linked.document_name ||
                              linked.original_file_name ||
                              "Linked document"
                            }`
                          : "No Master File document linked"}
                      </p>

                      {linked?.expiry_date ? (
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">
                          Document expiry:{" "}
                          {formatDate(
                            linked.expiry_date
                          )}
                        </p>
                      ) : null}
                    </div>

                    {due ? (
                      <DeadlineBadge
                        meta={due}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="space-y-3">
          <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
            <div className="flex items-center gap-2">
              <ShieldAlert
                size={17}
                className="text-orange-700"
              />

              <h4 className="text-sm font-black text-[#10233F]">
                Current blockers
              </h4>
            </div>

            {blockers.length ? (
              <div className="mt-3 space-y-2">
                {blockers.map(
                  (blocker) => (
                    <div
                      key={blocker.id}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                        blocker.tone ===
                        "red"
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-orange-300 bg-orange-50 text-orange-800"
                      }`}
                    >
                      {blocker.label}
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold text-emerald-700">
                No major requirement blocker detected.
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
            <div className="flex items-center gap-2">
              <Sparkles
                size={15}
                className="text-orange-700"
              />

              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Counselor Next Requirement
              </p>
            </div>

            <p className="mt-2 text-sm font-black text-[#10233F]">
              {nextRequirement?.item
                ?.requirement_name ||
                (stats.total
                  ? "Nothing urgent"
                  : "Configure visa checklist")}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {nextRequirement
                ? getNextRequirementText(
                    nextRequirement
                  )
                : stats.total
                ? "All current required items are ready."
                : "Add required Visa OS items before using readiness as a decision signal."}
            </p>
          </div>

          {linkedDocumentIntelligence
            .missingLinks.length ? (
            <div className="min-w-0 rounded-[1.45rem] border-[3px] border-amber-300 bg-amber-50 p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                Master File Link Gaps
              </p>

              <p className="mt-2 text-sm font-black text-amber-950">
                {
                  linkedDocumentIntelligence
                    .missingLinks.length
                }{" "}
                required item
                {linkedDocumentIntelligence
                  .missingLinks.length ===
                1
                  ? ""
                  : "s"}{" "}
                currently lack a linked Student Master File document.
              </p>
            </div>
          ) : null}

          {linkedDocumentIntelligence
            .expiring.length ? (
            <div className="min-w-0 rounded-[1.45rem] border-[3px] border-blue-300 bg-blue-50 p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-800">
                Expiry Watch
              </p>

              <div className="mt-3 space-y-2">
                {linkedDocumentIntelligence.expiring.map(
                  (item) => (
                    <div key={item.id}>
                      <p className="text-xs font-black text-blue-950">
                        {item.document}
                      </p>
                      <p className="text-xs font-semibold text-blue-700">
                        {item.requirement} ·{" "}
                        {item.meta.label}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {visa ? (
        <div className="grid min-w-0 gap-3 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:grid-cols-2 xl:grid-cols-4">
          <VisaField
            label="Visa Case"
            value={
              visa.source_university_name ||
              visa.university ||
              "Linked application"
            }
          />

          <VisaField
            label="Visa Status"
            value={pretty(
              visa.visa_status ||
                "not_started"
            )}
          />

          <VisaField
            label="Country"
            value={
              visa.country ||
              student?.country_interest ||
              student?.country ||
              "Not set"
            }
          />

          <VisaField
            label="Case ID"
            value={
              visa.id
                ? String(visa.id)
                : "Not set"
            }
          />
        </div>
      ) : (
        <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-5 text-sm font-semibold text-slate-600 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
          No active Visa OS case is linked to this student yet.
        </div>
      )}
    </section>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}


function Metric({
  label,
  value,
  icon: Icon,
  tone = "slate",
}) {
  const tones = {
    slate:
      "border-slate-300 bg-white text-[#10233F]",
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    orange:
      "border-orange-300 bg-orange-50 text-orange-800",
    red:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-[1.2rem] border-[3px] p-3 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${
        tones[tone] || tones.slate
      }`}
    >
      <Icon
        size={15}
        className="shrink-0"
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-black">
          {value}
        </p>

        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
          {label}
        </p>
      </div>
    </div>
  );
}

function RequirementStatus({ value }) {
  const status =
    requirementStatus(value);

  const styles = {
    ready:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    review:
      "border-blue-300 bg-blue-50 text-blue-800",
    rejected:
      "border-red-300 bg-red-50 text-red-800",
    missing:
      "border-amber-300 bg-amber-50 text-amber-800",
  };

  const labels = {
    ready: "Ready",
    review: "Review",
    rejected: "Rejected",
    missing: "Missing",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
        styles[status] ||
        styles.missing
      }`}
    >
      {labels[status] || "Missing"}
    </span>
  );
}

function DeadlineBadge({ meta }) {
  if (!meta) return null;

  const styles = {
    red:
      "border-red-300 bg-red-50 text-red-800",
    orange:
      "border-orange-300 bg-orange-50 text-orange-800",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    slate:
      "border-slate-300 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${
        styles[meta.tone] ||
        styles.slate
      }`}
    >
      {meta.label}
    </span>
  );
}

function VisaField({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p
        className="mt-1 truncate text-xs font-black text-[#10233F]"
        title={String(value || "")}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function getHealthStyle(tone) {
  if (tone === "red") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (tone === "orange") {
    return "border-orange-300 bg-orange-50 text-orange-800";
  }

  if (tone === "blue") {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }

  if (tone === "green") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function getSourceStyle(state) {
  if (state === "error") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (state === "shared") {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }

  if (state === "live") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function getNextRequirementText(next) {
  if (!next?.item) {
    return "No next requirement.";
  }

  const status =
    requirementStatus(
      next.item.status
    );

  if (status === "rejected") {
    return "Rejected requirement needs replacement or counselor review before the visa checklist can progress.";
  }

  if (
    next.due?.days !== undefined &&
    next.due.days < 0
  ) {
    return `This requirement is ${next.due.label} and should be handled before lower-priority checklist items.`;
  }

  if (status === "missing") {
    return next.due
      ? `Missing requirement · ${next.due.label}.`
      : "Missing required item. Request or link the correct Student Master File document.";
  }

  if (status === "review") {
    return next.due
      ? `Document is under review · ${next.due.label}.`
      : "Document is present but still needs review or verification.";
  }

  return "Review this requirement.";
}

function pretty(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default VisaRequirementsCard;
