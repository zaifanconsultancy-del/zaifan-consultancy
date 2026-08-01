// CrmTimelinePanel V5 PARTNER OS EXTREME — Executive Student Journey Timeline Command
// src/components/admin/CrmTimelinePanel.jsx
//
// Partner OS Extreme production pass:
// - preserves crm_timeline + student_application_timeline architecture
// - preserves addTimelineEvent + fetchTimelineEvents helpers
// - no DB migration required
// - safer bigint-like student ID validation
// - timeout cleanup (no orphaned timers)
// - timeout protection for BOTH timeline sources
// - partial-source recovery: one failed source never hides the other
// - source-health indicators
// - duplicate manual-note protection
// - Ctrl/Cmd + Enter quick-save for staff notes
// - note length / empty-state safety
// - safer metadata serialization (objects/arrays/errors)
// - better actor/source normalization
// - search/filter/sort/pagination preserved and strengthened
// - filter reset control
// - category coverage expanded
// - safe date sorting
// - reduced-motion support
// - mobile-safe history layout
// - stronger accessibility labels / live feedback
// - explicit white text on navy surfaces
// - approved Zaifan Admin OS orange/navy hierarchy
//
// IMPORTANT:
// This timeline remains an audit/history surface. Existing specialized module
// logs stay in their own tables; this panel only unifies the history view.

import {
  AlertTriangle,
  ArrowDownUp,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  GraduationCap,
  History,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UserRoundCog,
  X,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  addTimelineEvent,
  fetchTimelineEvents,
} from "../../../../lib/crmTimeline";

const REQUEST_TIMEOUT_MS = 15000;
const PAGE_SIZE = 12;
const MAX_NOTE_LENGTH = 3000;

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const pretty = (value = "") =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

function isBigIntLike(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  return /^\d+$/.test(
    String(value).trim()
  );
}

function safeDateMs(value) {
  if (!value) return 0;

  const date = new Date(value);
  const time = date.getTime();

  return Number.isNaN(time)
    ? 0
    : time;
}

function safeMetadataText(metadata) {
  if (
    !metadata ||
    typeof metadata !== "object"
  ) {
    return "";
  }

  try {
    return Object.entries(metadata)
      .map(([key, value]) => {
        if (
          value &&
          typeof value === "object"
        ) {
          try {
            return `${key} ${JSON.stringify(
              value
            )}`;
          } catch {
            return `${key} [complex value]`;
          }
        }

        return `${key} ${String(
          value ?? ""
        )}`;
      })
      .join(" ");
  } catch {
    return "";
  }
}

function formatMetadataValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return "[Unable to display value]";
  }
}

async function withTimeout(
  promise,
  message = "Request timed out."
) {
  let timeoutId;

  const timeout = new Promise(
    (_, reject) => {
      timeoutId =
        window.setTimeout(
          () =>
            reject(
              new Error(message)
            ),
          REQUEST_TIMEOUT_MS
        );
    }
  );

  try {
    return await Promise.race([
      promise,
      timeout,
    ]);
  } finally {
    window.clearTimeout(
      timeoutId
    );
  }
}

function CrmTimelinePanel({
  studentId,
  studentType,
  adminProfile = null,
}) {
  const reduceMotion =
    useReducedMotion();

  const [crmEvents, setCrmEvents] =
    useState([]);

  const [
    applicationEvents,
    setApplicationEvents,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    savingNote,
    setSavingNote,
  ] = useState(false);

  const [note, setNote] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [query, setQuery] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    sourceFilter,
    setSourceFilter,
  ] = useState("all");

  const [
    sortOrder,
    setSortOrder,
  ] = useState("newest");

  const [page, setPage] =
    useState(1);

  const [
    sourceHealth,
    setSourceHealth,
  ] = useState({
    crm: "idle",
    application: "idle",
  });

  const mountedRef =
    useRef(true);

  const lastSavedNoteRef =
    useRef({
      text: "",
      at: 0,
    });

  const safeStudentType =
    studentType ||
    "inquiry";

  const hasValidStudentId =
    isBigIntLike(studentId);

  const numericStudentId =
    hasValidStudentId
      ? Number(studentId)
      : null;

  const safeSet = (
    callback
  ) => {
    if (mountedRef.current) {
      callback();
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setQuery("");
    setCategoryFilter("all");
    setSourceFilter("all");
    setSortOrder("newest");
    setPage(1);
    setErrorMessage("");
    setSuccessMessage("");
    setNote("");

    void loadTimeline();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    studentId,
    safeStudentType,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    query,
    categoryFilter,
    sourceFilter,
    sortOrder,
  ]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          safeSet(() =>
            setSuccessMessage("")
          );
        },
        3500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [successMessage]);

  const loadTimeline =
    async () => {
      if (
        !hasValidStudentId ||
        !safeStudentType
      ) {
        safeSet(() => {
          setCrmEvents([]);
          setApplicationEvents([]);
          setSourceHealth({
            crm: "idle",
            application: "idle",
          });
          setErrorMessage(
            "Student ID is missing or invalid, so timeline history cannot be loaded."
          );
        });
        return;
      }

      safeSet(() => {
        setLoading(true);
        setErrorMessage("");
        setSourceHealth({
          crm: "loading",
          application: "loading",
        });
      });

      try {
        const [
          crmResult,
          applicationResult,
        ] =
          await Promise.allSettled([
            withTimeout(
              fetchTimelineEvents(
                studentId,
                safeStudentType
              ),
              "CRM history timed out."
            ),
            withTimeout(
              supabase
                .from(
                  "student_application_timeline"
                )
                .select("*")
                .eq(
                  "student_id",
                  numericStudentId
                )
                .eq(
                  "student_type",
                  safeStudentType
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(500),
              "Student Journey history timed out."
            ),
          ]);

        let nextCrmEvents = [];
        let nextApplicationEvents =
          [];

        const failedSources = [];

        let crmHealth = "ok";
        let applicationHealth =
          "ok";

        if (
          crmResult.status ===
          "fulfilled"
        ) {
          const {
            data,
            error,
          } = crmResult.value || {};

          if (error) {
            crmHealth = "error";
            failedSources.push(
              "CRM history"
            );
          } else {
            nextCrmEvents =
              Array.isArray(data)
                ? data
                : [];
          }
        } else {
          crmHealth = "error";
          failedSources.push(
            "CRM history"
          );
        }

        if (
          applicationResult.status ===
          "fulfilled"
        ) {
          const {
            data,
            error,
          } =
            applicationResult.value ||
            {};

          if (error) {
            applicationHealth =
              "error";

            failedSources.push(
              "Student Journey history"
            );
          } else {
            nextApplicationEvents =
              Array.isArray(data)
                ? data
                : [];
          }
        } else {
          applicationHealth =
            "error";

          failedSources.push(
            "Student Journey history"
          );
        }

        safeSet(() => {
          setCrmEvents(
            nextCrmEvents
          );

          setApplicationEvents(
            nextApplicationEvents
          );

          setSourceHealth({
            crm: crmHealth,
            application:
              applicationHealth,
          });

          if (
            failedSources.length
          ) {
            setErrorMessage(
              `${failedSources.join(
                " and "
              )} could not fully load. Available history is still shown.`
            );
          }
        });
      } catch (error) {
        console.error(
          "Timeline load crashed:",
          error
        );

        safeSet(() => {
          setErrorMessage(
            error?.message ||
              "Student journey timeline crashed while loading."
          );

          setCrmEvents([]);
          setApplicationEvents([]);

          setSourceHealth({
            crm: "error",
            application:
              "error",
          });
        });
      } finally {
        safeSet(() =>
          setLoading(false)
        );
      }
    };

  const addManualNote =
    async () => {
      const cleanNote =
        note.trim();

      if (
        !cleanNote ||
        savingNote ||
        !hasValidStudentId
      ) {
        return;
      }

      if (
        cleanNote.length >
        MAX_NOTE_LENGTH
      ) {
        setErrorMessage(
          `Timeline note is too long. Keep it under ${MAX_NOTE_LENGTH.toLocaleString()} characters.`
        );
        return;
      }

      const now = Date.now();

      if (
        lastSavedNoteRef.current
          .text === cleanNote &&
        now -
          lastSavedNoteRef.current
            .at <
          15000
      ) {
        setErrorMessage(
          "This exact note was just saved. Duplicate note blocked."
        );
        return;
      }

      safeSet(() => {
        setSavingNote(true);
        setErrorMessage("");
        setSuccessMessage("");
      });

      try {
        const {
          error,
        } = await withTimeout(
          addTimelineEvent({
            studentId,
            studentType:
              safeStudentType,
            actionType:
              "manual_note",
            title:
              "Manual Note Added",
            description:
              cleanNote,
            adminProfile,
          }),
          "Timeline note save timed out."
        );

        if (error) {
          throw error;
        }

        lastSavedNoteRef.current =
          {
            text: cleanNote,
            at: now,
          };

        safeSet(() => {
          setNote("");
          setSuccessMessage(
            "Timeline note saved."
          );
        });

        await loadTimeline();
      } catch (error) {
        console.error(
          "Timeline note save failed:",
          error
        );

        safeSet(() => {
          setErrorMessage(
            error?.message ||
              "Timeline note could not be saved."
          );
        });
      } finally {
        safeSet(() =>
          setSavingNote(false)
        );
      }
    };

  const handleNoteKeyDown =
    (event) => {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        void addManualNote();
      }
    };

  const combinedEvents =
    useMemo(() => {
      const normalizedCrm =
        (crmEvents || []).map(
          (event) => ({
            id: `crm-${event.id}`,
            rawId: event.id,
            source: "crm",
            sourceLabel: "CRM",
            applicationId:
              event.application_id ||
              null,
            title:
              event.title ||
              "CRM Event",
            description:
              event.description ||
              "",
            type:
              event.action_type ||
              event.event_type ||
              "crm_event",
            oldValue:
              event.old_value ||
              "",
            newValue:
              event.new_value ||
              "",
            createdBy:
              event.created_by_name ||
              event.admin_name ||
              "Admin",
            createdById:
              event.created_by ||
              event.admin_id ||
              null,
            createdAt:
              event.created_at,
            metadata:
              event.metadata &&
              typeof event.metadata ===
                "object"
                ? event.metadata
                : {},
          })
        );

      const normalizedApplication =
        (
          applicationEvents ||
          []
        ).map((event) => ({
          id: `application-${event.id}`,
          rawId: event.id,
          source:
            "application",
          sourceLabel:
            "Student Journey",
          applicationId:
            event.application_id ||
            null,
          title:
            event.title ||
            "Student Journey Event",
          description:
            event.description ||
            "",
          type:
            event.event_type ||
            event.action_type ||
            "application_event",
          oldValue:
            event.old_value ||
            "",
          newValue:
            event.new_value ||
            "",
          createdBy:
            event.created_by_name ||
            event.actor_name ||
            "System",
          createdById:
            event.created_by ||
            event.actor_id ||
            null,
          createdAt:
            event.created_at,
          metadata:
            event.metadata &&
            typeof event.metadata ===
              "object"
              ? event.metadata
              : {},
        }));

      return [
        ...normalizedCrm,
        ...normalizedApplication,
      ];
    }, [
      crmEvents,
      applicationEvents,
    ]);

  const enrichedEvents =
    useMemo(
      () =>
        combinedEvents.map(
          (event) => ({
            ...event,
            category:
              getEventCategory(
                event.type,
                event.title
              ),
          })
        ),
      [combinedEvents]
    );

  const stats = useMemo(() => {
    const count = (
      category
    ) =>
      enrichedEvents.filter(
        (event) =>
          event.category ===
          category
      ).length;

    return {
      total:
        enrichedEvents.length,
      notes: count("notes"),
      documents:
        count("documents"),
      applications:
        count("applications"),
      tasks: count("tasks"),
      communications:
        count(
          "communications"
        ),
      universities:
        count("universities"),
      visa: count("visa"),
      ownership:
        count("ownership"),
      system: count("system"),
    };
  }, [enrichedEvents]);

  const filteredEvents =
    useMemo(() => {
      const cleanQuery =
        query
          .trim()
          .toLowerCase();

      const filtered =
        enrichedEvents.filter(
          (event) => {
            if (
              categoryFilter !==
                "all" &&
              event.category !==
                categoryFilter
            ) {
              return false;
            }

            if (
              sourceFilter !==
                "all" &&
              event.source !==
                sourceFilter
            ) {
              return false;
            }

            if (!cleanQuery) {
              return true;
            }

            const haystack = [
              event.title,
              event.description,
              event.type,
              event.oldValue,
              event.newValue,
              event.createdBy,
              event.applicationId,
              safeMetadataText(
                event.metadata
              ),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(
              cleanQuery
            );
          }
        );

      return [...filtered].sort(
        (a, b) => {
          const dateA =
            safeDateMs(
              a.createdAt
            );

          const dateB =
            safeDateMs(
              b.createdAt
            );

          return sortOrder ===
            "oldest"
            ? dateA - dateB
            : dateB - dateA;
        }
      );
    }, [
      enrichedEvents,
      query,
      categoryFilter,
      sourceFilter,
      sortOrder,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredEvents.length /
          PAGE_SIZE
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const pagedEvents =
    filteredEvents.slice(
      (safePage - 1) *
        PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  const rangeStart =
    filteredEvents.length ===
    0
      ? 0
      : (safePage - 1) *
          PAGE_SIZE +
        1;

  const rangeEnd = Math.min(
    safePage * PAGE_SIZE,
    filteredEvents.length
  );

  const categoryOptions = [
    ["all", "All categories"],
    ["notes", "Notes"],
    ["documents", "Documents"],
    [
      "applications",
      "Applications",
    ],
    [
      "universities",
      "Universities",
    ],
    ["visa", "Visa"],
    ["tasks", "Tasks"],
    [
      "communications",
      "Communications",
    ],
    [
      "ownership",
      "Ownership",
    ],
    [
      "system",
      "System / AI",
    ],
  ];

  const filtersActive =
    query ||
    categoryFilter !== "all" ||
    sourceFilter !== "all" ||
    sortOrder !== "newest";

  const resetFilters = () => {
    setQuery("");
    setCategoryFilter("all");
    setSourceFilter("all");
    setSortOrder("newest");
    setPage(1);
  };

  return (
    <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <motion.section
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 10,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration:
            reduceMotion
              ? 0
              : 0.26,
        }}
        className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]"
      >
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderBadge>
                <History size={11} />
                Timeline Command
              </HeaderBadge>

              <HeaderBadge>
                <ShieldCheck size={11} />
                Evidence First
              </HeaderBadge>
            </div>

            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              Student Journey Timeline Command
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              CRM notes and operational journey events are combined into one
              searchable audit history while specialized module logs remain intact.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <SourceHealthBadge
                label="CRM Timeline"
                status={
                  sourceHealth.crm
                }
                count={
                  crmEvents.length
                }
              />

              <SourceHealthBadge
                label="Student Journey"
                status={
                  sourceHealth.application
                }
                count={
                  applicationEvents.length
                }
              />
            </div>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Current Workspace
            </p>

            <p className="mt-3 text-5xl font-black text-white">
              {stats.total}
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-white">
              verified timeline event
              {stats.total === 1
                ? ""
                : "s"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="CRM"
                value={
                  crmEvents.length
                }
              />

              <OrangeMetric
                label="Journey"
                value={
                  applicationEvents.length
                }
              />
            </div>

            <button
              type="button"
              onClick={loadTimeline}
              disabled={loading}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {loading
                ? "Refreshing..."
                : "Refresh Timeline"}
            </button>
          </div>
        </div>
      </motion.section>

      {errorMessage ? (
        <Feedback
          tone="error"
          message={
            errorMessage
          }
          onClose={() =>
            setErrorMessage("")
          }
        />
      ) : null}

      {successMessage ? (
        <Feedback
          tone="success"
          message={
            successMessage
          }
          onClose={() =>
            setSuccessMessage("")
          }
        />
      ) : null}

      <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_24px_rgba(15,35,63,0.05)] sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4EA] text-orange-700">
            <StickyNote
              size={18}
            />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              Internal Staff Note
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233F]">
              Add Timeline Note
            </h3>

            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Save counselor observations, call outcomes, follow-up context and
              internal case notes directly into CRM history.
            </p>
          </div>
        </div>

        <textarea
          value={note}
          maxLength={
            MAX_NOTE_LENGTH
          }
          onKeyDown={
            handleNoteKeyDown
          }
          onChange={(event) =>
            setNote(
              event.target.value
            )
          }
          placeholder="Example: Called student. Waiting for bank statement. Student promised to send it tomorrow morning."
          className="mt-4 min-h-[120px] w-full resize-y rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-4 text-sm font-semibold leading-6 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
          aria-label="Internal timeline note"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Internal Admin OS history only. Nothing here is automatically sent to the student.
            </p>

            <p className="mt-1 text-[10px] font-bold text-slate-400">
              Ctrl/Cmd + Enter to save · {note.length}/{MAX_NOTE_LENGTH}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void addManualNote()
            }
            disabled={
              !note.trim() ||
              savingNote ||
              !hasValidStudentId
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C94800] bg-[#FF5A0A] px-5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E64F00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <StickyNote size={14} />

            {savingNote
              ? "Saving..."
              : "Add Note"}
          </button>
        </div>
      </section>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat
          label="Total"
          value={stats.total}
          tone="navy"
        />

        <MiniStat
          label="Documents"
          value={
            stats.documents
          }
          tone="blue"
        />

        <MiniStat
          label="Applications"
          value={
            stats.applications
          }
          tone="orange"
        />

        <MiniStat
          label="Tasks"
          value={stats.tasks}
          tone="green"
        />

        <MiniStat
          label="Visa"
          value={stats.visa}
          tone="violet"
        />
      </div>

      <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter
              size={14}
              className="text-orange-700"
            />

            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              Timeline Filters
            </p>
          </div>

          {filtersActive ? (
            <button
              type="button"
              onClick={
                resetFilters
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black text-orange-700 transition hover:bg-[#FFF4EA] hover:text-orange-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              <RotateCcw size={12} />
              Reset filters
            </button>
          ) : null}
        </div>

        <div className="mt-3 grid gap-2 xl:grid-cols-[1fr_190px_180px_170px]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search event title, notes, change values, creator..."
              className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              aria-label="Search verified timeline events"
            />
          </div>

          <SelectControl
            value={
              categoryFilter
            }
            onChange={
              setCategoryFilter
            }
            ariaLabel="Filter timeline category"
            options={
              categoryOptions
            }
          />

          <SelectControl
            value={
              sourceFilter
            }
            onChange={
              setSourceFilter
            }
            ariaLabel="Filter timeline source"
            options={[
              [
                "all",
                "All sources",
              ],
              [
                "crm",
                "CRM Timeline",
              ],
              [
                "application",
                "Student Journey",
              ],
            ]}
          />

          <button
            type="button"
            onClick={() =>
              setSortOrder(
                (previous) =>
                  previous ===
                  "newest"
                    ? "oldest"
                    : "newest"
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] transition hover:border-[#F97316] hover:bg-[#FFF4EA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            aria-label={`Sort ${
              sortOrder ===
              "newest"
                ? "oldest first"
                : "newest first"
            }`}
          >
            <ArrowDownUp
              size={14}
            />

            {sortOrder ===
            "newest"
              ? "Newest First"
              : "Oldest First"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {filteredEvents.length} matching event
            {filteredEvents.length === 1 ? "" : "s"}.
          </p>

          <p className="text-[10px] font-bold text-slate-400">
            {PAGE_SIZE} per page
          </p>
        </div>
      </section>

      <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(15,35,63,0.06)] sm:p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              Permanent History
            </p>

            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              Student Journey Timeline
            </h3>

            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              Operational changes, staff notes, communications and system-generated journey events in one chronological audit view.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <CompactBadge
              label="Notes"
              value={stats.notes}
            />

            <CompactBadge
              label="Communication"
              value={
                stats.communications
              }
            />

            <CompactBadge
              label="Ownership"
              value={
                stats.ownership
              }
            />

            <CompactBadge
              label="System"
              value={stats.system}
            />
          </div>
        </div>

        {loading &&
        !combinedEvents.length ? (
          <EmptyState
            loading
            title="Loading student history"
            text="Combining CRM and Student Journey audit events."
          />
        ) : pagedEvents.length ===
          0 ? (
          <EmptyState
            title={
              enrichedEvents.length
                ? "No matching timeline history"
                : "No timeline history yet"
            }
            text={
              enrichedEvents.length
                ? "No events match the selected filters. Reset the filters or try another search."
                : "CRM notes and Student Journey activity will appear here as the student's case develops."
            }
          />
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-[18px] top-0 hidden w-[2px] bg-gradient-to-b from-orange-500 via-slate-300 to-transparent sm:block" />

            <div className="space-y-4">
              {pagedEvents.map(
                (
                  event,
                  index
                ) => (
                  <TimelineEvent
                    key={
                      event.id
                    }
                    event={
                      event
                    }
                    index={
                      index
                    }
                    reduceMotion={
                      reduceMotion
                    }
                  />
                )
              )}
            </div>
          </div>
        )}

        {filteredEvents.length >
        PAGE_SIZE ? (
          <Pagination
            page={safePage}
            totalPages={
              totalPages
            }
            onPrevious={() =>
              setPage(
                (previous) =>
                  Math.max(
                    1,
                    previous - 1
                  )
              )
            }
            onNext={() =>
              setPage(
                (previous) =>
                  Math.min(
                    totalPages,
                    previous + 1
                  )
              )
            }
          />
        ) : null}
      </section>
    </div>
  );
}

function TimelineEvent({
  event,
  index,
  reduceMotion,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const style =
    getCategoryStyle(
      event.category
    );

  const Icon = style.icon;

  const metadataEntries =
    Object.entries(
      event.metadata || {}
    ).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    );

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 8,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.2,
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index * 0.025,
                0.12
              ),
      }}
      className="relative min-w-0 sm:pl-12"
    >
      <div
        className={`absolute left-0 top-5 z-10 hidden h-9 w-9 items-center justify-center rounded-xl border-2 sm:flex ${style.iconWrap}`}
      >
        <Icon size={15} />
      </div>

      <div
        className={`min-w-0 rounded-[1.35rem] border-[3px] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:-translate-y-0.5 hover:border-[#F97316] hover:shadow-md ${style.card}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.badge}`}
              >
                {pretty(
                  event.category
                )}
              </span>

              <span className="rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-700">
                {
                  event.sourceLabel
                }
              </span>

              {event.applicationId ? (
                <span className="rounded-full border-2 border-blue-300 bg-blue-50 px-3 py-1 text-[9px] font-black text-blue-800">
                  App:{" "}
                  {String(
                    event.applicationId
                  ).slice(0, 12)}
                </span>
              ) : null}
            </div>

            <h4 className="mt-3 text-base font-black text-[#10233F] sm:text-lg">
              {event.title}
            </h4>

            {event.description ? (
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                {
                  event.description
                }
              </p>
            ) : null}
          </div>

          <div className="min-w-0 shrink-0 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Event Type
            </p>

            <p className="mt-1 max-w-[220px] break-words text-xs font-black text-[#10233F]">
              {pretty(
                event.type
              )}
            </p>
          </div>
        </div>

        {(
          event.oldValue ||
          event.newValue
        ) ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <ChangeBox
              label="Before"
              value={
                event.oldValue ||
                "—"
              }
            />

            <div className="text-center text-sm font-black text-orange-600">
              →
            </div>

            <ChangeBox
              label="After"
              value={
                event.newValue ||
                "—"
              }
              active
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700">
              {normalize(
                event.createdBy
              ) === "system" ? (
                <Bot size={12} />
              ) : (
                <UserRoundCog
                  size={12}
                />
              )}

              {event.createdBy}
            </span>

            {event.createdById ? (
              <span className="text-[10px] font-medium text-slate-400">
                {String(
                  event.createdById
                ).slice(0, 8)}
              </span>
            ) : null}
          </div>

          <span className="text-[10px] font-bold text-slate-500">
            {formatDate(
              event.createdAt
            )}
          </span>
        </div>

        {metadataEntries.length ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (previous) =>
                    !previous
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-black text-orange-700 transition hover:bg-[#FFF4EA] hover:text-orange-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
              aria-expanded={
                expanded
              }
            >
              <ChevronDown
                size={13}
                className={`transition-transform ${
                  expanded
                    ? "rotate-180"
                    : ""
                }`}
              />

              {expanded
                ? "Hide metadata"
                : `View metadata (${metadataEntries.length})`}
            </button>

            {expanded ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {metadataEntries.map(
                  ([
                    key,
                    value,
                  ]) => (
                    <div
                      key={
                        key
                      }
                      className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3"
                    >
                      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                        {pretty(
                          key
                        )}
                      </p>

                      <pre className="mt-1 whitespace-pre-wrap break-words font-sans text-xs font-bold leading-5 text-[#10233F]">
                        {formatMetadataValue(
                          value
                        )}
                      </pre>
                    </div>
                  )
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function getEventCategory(
  type = "",
  title = ""
) {
  const clean =
    normalize(
      `${type} ${title}`
    );

  if (
    clean.includes("note")
  ) {
    return "notes";
  }

  if (
    clean.includes(
      "document"
    ) ||
    clean.includes(
      "passport"
    ) ||
    clean.includes("ielts") ||
    clean.includes(
      "transcript"
    )
  ) {
    return "documents";
  }

  if (
    clean.includes(
      "university"
    ) ||
    clean.includes(
      "shortlist"
    )
  ) {
    return "universities";
  }

  if (
    clean.includes("visa")
  ) {
    return "visa";
  }

  if (
    clean.includes("task") ||
    clean.includes(
      "reminder"
    ) ||
    clean.includes(
      "follow_up"
    )
  ) {
    return "tasks";
  }

  if (
    clean.includes(
      "communication"
    ) ||
    clean.includes("email") ||
    clean.includes(
      "whatsapp"
    ) ||
    clean.includes("call") ||
    clean.includes("sms")
  ) {
    return "communications";
  }

  if (
    clean.includes(
      "assignment"
    ) ||
    clean.includes("owner") ||
    clean.includes(
      "counselor"
    )
  ) {
    return "ownership";
  }

  if (
    clean.includes(
      "application"
    ) ||
    clean.includes("offer") ||
    clean.includes("cas") ||
    clean.includes(
      "admission"
    )
  ) {
    return "applications";
  }

  return "system";
}

function getCategoryStyle(
  category
) {
  const styles = {
    notes: {
      icon: StickyNote,
      card:
        "border-orange-300",
      iconWrap:
        "border-orange-400 bg-orange-50 text-orange-700",
      badge:
        "border-orange-300 bg-orange-50 text-orange-800",
    },

    documents: {
      icon: FileText,
      card:
        "border-blue-300",
      iconWrap:
        "border-blue-400 bg-blue-50 text-blue-800",
      badge:
        "border-blue-300 bg-blue-50 text-blue-800",
    },

    applications: {
      icon:
        GraduationCap,
      card:
        "border-orange-300",
      iconWrap:
        "border-orange-400 bg-orange-50 text-orange-800",
      badge:
        "border-orange-300 bg-orange-50 text-orange-800",
    },

    universities: {
      icon:
        GraduationCap,
      card:
        "border-violet-300",
      iconWrap:
        "border-violet-400 bg-violet-50 text-violet-800",
      badge:
        "border-violet-300 bg-violet-50 text-violet-800",
    },

    visa: {
      icon: ShieldCheck,
      card:
        "border-cyan-300",
      iconWrap:
        "border-cyan-400 bg-cyan-50 text-cyan-800",
      badge:
        "border-cyan-300 bg-cyan-50 text-cyan-800",
    },

    tasks: {
      icon:
        CheckCircle2,
      card:
        "border-emerald-300",
      iconWrap:
        "border-emerald-400 bg-emerald-50 text-emerald-800",
      badge:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
    },

    communications: {
      icon:
        MessageSquareText,
      card:
        "border-teal-300",
      iconWrap:
        "border-teal-400 bg-teal-50 text-teal-800",
      badge:
        "border-teal-300 bg-teal-50 text-teal-800",
    },

    ownership: {
      icon:
        UserRoundCog,
      card:
        "border-slate-400",
      iconWrap:
        "border-[#123865] bg-[#123865] text-white",
      badge:
        "border-slate-300 bg-slate-50 text-slate-800",
    },

    system: {
      icon: Sparkles,
      card:
        "border-slate-300",
      iconWrap:
        "border-[#123865] bg-[#123865] text-white",
      badge:
        "border-slate-300 bg-slate-50 text-slate-800",
    },
  };

  return (
    styles[category] ||
    styles.system
  );
}

function formatDate(date) {
  if (!date) {
    return "Unknown time";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "Unknown time";
  }

  return parsed.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function HeaderBadge({
  children,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      {children}
    </span>
  );
}

function SourceHealthBadge({
  label,
  status,
  count,
}) {
  const loading =
    status === "loading";

  const failed =
    status === "error";

  return (
    <span className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black text-white">
      {loading ? (
        <RefreshCw
          size={11}
          className="animate-spin text-white"
        />
      ) : failed ? (
        <AlertTriangle
          size={11}
          className="text-white"
        />
      ) : (
        <CheckCircle2
          size={11}
          className="text-white"
        />
      )}

      <span className="text-white">
        {label}: {count}
      </span>
    </span>
  );
}

function ChangeBox({
  label,
  value,
  active = false,
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        active
          ? "border-orange-300 bg-orange-50"
          : "border-slate-300 bg-slate-50"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-[#10233F]">
        {String(value)}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}) {
  const styles = {
    navy:
      "border-[#123865] bg-[#123865] text-white",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    orange:
      "border-orange-400 bg-orange-500 text-white",
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    violet:
      "border-violet-300 bg-violet-50 text-violet-800",
  };

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 ${
        styles[tone] ||
        styles.navy
      }`}
    >
      <p
        className={`text-[8px] font-black uppercase tracking-[0.12em] ${
          tone === "navy" ||
          tone === "orange"
            ? "text-white"
            : ""
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          tone === "navy" ||
          tone === "orange"
            ? "text-white"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CompactBadge({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-0.5 text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function Feedback({
  tone,
  message,
  onClose,
}) {
  const isError =
    tone === "error";

  return (
    <div
      role={
        isError
          ? "alert"
          : "status"
      }
      className={`flex items-start gap-3 rounded-xl border-[3px] p-4 text-sm font-bold ${
        isError
          ? "border-red-400 bg-red-50 text-red-900"
          : "border-emerald-400 bg-emerald-50 text-emerald-900"
      }`}
    >
      {isError ? (
        <AlertTriangle
          size={17}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <CheckCircle2
          size={17}
          className="mt-0.5 shrink-0"
        />
      )}

      <div className="min-w-0 flex-1">
        {message}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function EmptyState({
  title,
  text,
  loading = false,
}) {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-slate-300 bg-[#FFF8EF] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        {loading ? (
          <RefreshCw
            size={22}
            className="animate-spin"
          />
        ) : (
          <ShieldCheck
            size={22}
          />
        )}
      </div>

      <h3 className="mt-4 text-lg font-black text-[#10233F]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-slate-200 pt-4">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-40"
      >
        <ChevronLeft
          size={14}
        />
        Previous
      </button>

      <p className="text-xs font-black text-slate-600">
        Page {page} of{" "}
        {totalPages}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={
          page >= totalPages
        }
        className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-40"
      >
        Next
        <ChevronRight
          size={14}
        />
      </button>
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  options,
  ariaLabel,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        aria-label={ariaLabel}
        className="h-11 w-full appearance-none rounded-xl border-2 border-[#C9D7E6] bg-white px-3 pr-9 text-xs font-black text-[#10233F] outline-none transition hover:border-orange-400 focus:border-[#F97316]"
      >
        {options.map(
          ([
            optionValue,
            label,
          ]) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {label}
            </option>
          )
        )}
      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

export default CrmTimelinePanel;
