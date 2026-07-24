// StudentSupportDeskPanel V2 MAXIMUM — Zaifan Student Support OS
// Full standalone replacement for the old inline Support Desk UI inside StudentDetailModal.
// Preserves the current student_support_requests schema and Student Portal visibility.
// Adds:
// - searchable/filterable support queue
// - priority + status control
// - admin notes
// - response composer
// - Send Response vs Send + Resolve
// - reopen / resolve / close
// - optimistic updates with timeout safety
// - timeline logging
// - urgency/age visibility
// - strong Zaifan Admin OS contrast
// - request-level concurrency instead of one global busy lock
// - stale parent refresh protection and local-draft preservation
// - timeout cleanup + post-timeout reconciliation
// - student_id + student_type identity-safe mutations
// - timeline/audit sync reporting instead of silent failure
// - SLA/age intelligence and overdue support pressure
// - response freshness + unsaved-draft indicators
// - safer status transitions and resolve semantics
// - queue controls + deterministic priority/age ordering

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  History,
  LifeBuoy,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TimerReset,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { addTimelineEvent } from "../../lib/crmTimeline";

const REQUEST_TIMEOUT_MS = 18000;

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const pretty = (value = "") =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ageMeta = (createdAt, status) => {
  if (!createdAt) return { hours: 0, label: "Age unknown", tone: "slate" };

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return { hours: 0, label: "Age unknown", tone: "slate" };
  }

  const hours = Math.max(0, (Date.now() - created.getTime()) / 3600000);
  const closed = ["resolved", "closed"].includes(normalize(status));

  if (closed) {
    return {
      hours,
      label: hours < 24 ? `${Math.floor(hours)}h old` : `${Math.floor(hours / 24)}d old`,
      tone: "slate",
    };
  }

  if (hours >= 48) {
    return {
      hours,
      label: `${Math.floor(hours / 24)}d waiting`,
      tone: "red",
    };
  }

  if (hours >= 24) {
    return {
      hours,
      label: `${Math.floor(hours)}h waiting`,
      tone: "orange",
    };
  }

  return {
    hours,
    label: `${Math.max(1, Math.floor(hours))}h waiting`,
    tone: "blue",
  };
};

export default function StudentSupportDeskPanel({
  student = {},
  studentType = "inquiry",
  adminProfile = null,
  requests = [],
  onRefresh = null,
  onOpenTimeline = null,
}) {
  const [localRequests, setLocalRequests] = useState(Array.isArray(requests) ? requests : []);
  const [responseDrafts, setResponseDrafts] = useState({});
  const [noteDrafts, setNoteDrafts] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [auditWarning, setAuditWarning] = useState("");
  const [messageTone, setMessageTone] = useState("info");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const studentId = String(student?.id || student?.student_id || "").trim();
  const safeStudentType = normalize(
    student?.student_type ||
      student?.__leadType ||
      student?.type ||
      studentType ||
      "inquiry"
  );

  // Keep local UI synchronized when parent refreshes without wiping active drafts.
  useEffect(() => {
    const incoming = Array.isArray(requests) ? requests : [];
    setLocalRequests(incoming);

    setResponseDrafts((previous) => {
      const next = { ...previous };
      incoming.forEach((request) => {
        if (!(request.id in next)) next[request.id] = request.counselor_response || "";
      });
      return next;
    });

    setNoteDrafts((previous) => {
      const next = { ...previous };
      incoming.forEach((request) => {
        if (!(request.id in next)) next[request.id] = request.admin_notes || "";
      });
      return next;
    });
  }, [requests]);

  const withTimeout = (promise, label = "Support action") => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error(`${label} timed out. Refresh and verify the request before retrying.`)),
        REQUEST_TIMEOUT_MS
      );
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  };

  const patchLocal = (requestId, patch = {}) => {
    setLocalRequests((previous) =>
      previous.map((item) =>
        String(item.id) === String(requestId) ? { ...item, ...patch } : item
      )
    );
  };

  const setBusy = (requestId, action = "saving") => {
    setBusyMap((previous) => ({ ...previous, [requestId]: action }));
  };

  const clearBusy = (requestId) => {
    setBusyMap((previous) => {
      const next = { ...previous };
      delete next[requestId];
      return next;
    });
  };

  const isBusy = (requestId) => Boolean(busyMap[requestId]);

  const reconcileRequest = async (requestId, expectedPatch = {}) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_support_requests")
          .select("*")
          .eq("id", requestId)
          .eq("student_id", studentId)
          .single(),
        "Support reconciliation"
      );

      if (error) throw error;
      if (!data) return null;

      const matches = Object.entries(expectedPatch)
        .filter(([key]) => key !== "updated_at")
        .every(([key, value]) => String(data?.[key] ?? "") === String(value ?? ""));

      return matches ? data : null;
    } catch (error) {
      console.warn("Support reconciliation failed:", error);
      return null;
    }
  };

  const hasUnsavedResponse = (request) =>
    String(responseDrafts[request.id] ?? "").trim() !== String(request.counselor_response || "").trim();

  const hasUnsavedNotes = (request) =>
    String(noteDrafts[request.id] ?? "").trim() !== String(request.admin_notes || "").trim();

  const refresh = async () => {
    if (typeof onRefresh !== "function" || refreshing) return;
    setRefreshing(true);
    try {
      await withTimeout(Promise.resolve(onRefresh()), "Support desk refresh");
    } catch (error) {
      console.warn("Support refresh delayed:", error);
      setMessageTone("warning");
      setMessage(error?.message || "Support refresh did not confirm. Existing queue data is preserved.");
    } finally {
      setRefreshing(false);
    }
  };

  const timeline = async ({
    request,
    actionType,
    title,
    description,
    oldValue = null,
    newValue = null,
    metadata = {},
  }) => {
    try {
      await withTimeout(
        addTimelineEvent({
          studentId,
          studentType: safeStudentType,
          actionType,
          title,
          description,
          oldValue,
          newValue,
          adminProfile,
          metadata: {
            support_request_id: request?.id || null,
            request_type: request?.request_type || null,
            ...metadata,
          },
        }),
        "Support timeline event"
      );
      return true;
    } catch (error) {
      console.warn("Support timeline event skipped:", error?.message || error);
      return false;
    }
  };

  const savePatch = async (request, patch, successText, timelineData = null) => {
    if (!request?.id || isBusy(request.id)) return null;

    const previous = { ...request };
    const optimistic = {
      ...patch,
      updated_at: patch.updated_at || new Date().toISOString(),
    };

    setBusy(request.id, "saving");
    setMessage("");
    setAuditWarning("");
    patchLocal(request.id, optimistic);

    try {
      let result;

      try {
        result = await withTimeout(
          supabase
            .from("student_support_requests")
            .update(optimistic)
            .eq("id", request.id)
            .eq("student_id", studentId)
            .select("*")
            .single(),
          "Support update"
        );
      } catch (error) {
        if (String(error?.message || "").toLowerCase().includes("timed out")) {
          const reconciled = await reconcileRequest(request.id, optimistic);
          if (reconciled) result = { data: reconciled, error: null };
          else throw new Error("Support update timed out and could not be verified. The previous UI state has been restored. Refresh before retrying.");
        } else {
          throw error;
        }
      }

      if (result?.error) throw result.error;
      const data = result?.data;
      patchLocal(request.id, data);

      let timelineOk = true;
      if (timelineData) timelineOk = await timeline({ request: data, ...timelineData });
      if (!timelineOk) setAuditWarning("Support data saved, but the Student OS timeline event did not confirm.");

      setMessageTone("success");
      setMessage(successText);
      void refresh();
      return data;
    } catch (error) {
      patchLocal(request.id, previous);
      setMessageTone("error");
      setMessage(error?.message || "Support request update failed.");
      return null;
    } finally {
      clearBusy(request.id);
    }
  };

  const changeStatus = async (request, nextStatus) => {
    const current = normalize(request?.status || "open");
    const next = normalize(nextStatus || "open");
    if (!request?.id || current === next) return;

    const now = new Date().toISOString();
    const patch = {
      status: next,
      updated_at: now,
      resolved_at: ["resolved", "closed"].includes(next)
        ? request.resolved_at || now
        : null,
    };

    if (next === "open" || next === "in_progress") {
      patch.resolved_at = null;
    }

    await savePatch(
      request,
      patch,
      `Support request marked ${pretty(next)}.`,
      {
        actionType: "support_status_changed",
        title: "Support Request Updated",
        description: `Support request status changed from ${pretty(current)} to ${pretty(next)}.`,
        oldValue: current,
        newValue: next,
        metadata: { status: next },
      }
    );
  };

  const changePriority = async (request, nextPriority) => {
    const current = normalize(request?.priority || "normal");
    const next = normalize(nextPriority || "normal");
    if (current === next) return;

    await savePatch(
      request,
      { priority: next, updated_at: new Date().toISOString() },
      `Priority changed to ${pretty(next)}.`,
      {
        actionType: "support_priority_changed",
        title: "Support Priority Changed",
        description: `Support priority changed from ${pretty(current)} to ${pretty(next)}.`,
        oldValue: current,
        newValue: next,
      }
    );
  };

  const saveAdminNotes = async (request) => {
    const notes = String(noteDrafts[request.id] ?? request.admin_notes ?? "").trim();
    const currentNotes = String(request.admin_notes || "").trim();

    if (notes === currentNotes) {
      setMessageTone("info");
      setMessage("Internal notes have no unsaved changes.");
      return;
    }

    await savePatch(
      request,
      {
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      "Internal support notes saved.",
      {
        actionType: "support_admin_notes_updated",
        title: "Support Internal Notes Updated",
        description: `Internal notes updated for: ${request.subject || "Support Request"}.`,
        newValue: notes ? "notes_saved" : "notes_cleared",
      }
    );
  };

  const sendResponse = async (request, { resolve = false } = {}) => {
    if (!request?.id || isBusy(request.id)) return;

    const response = String(
      responseDrafts[request.id] ?? request.counselor_response ?? ""
    ).trim();

    if (!response) {
      setMessageTone("warning");
      setMessage("Write the counselor response before sending.");
      return;
    }

    const now = new Date().toISOString();
    const patch = {
      counselor_response: response,
      responded_at: now,
      updated_at: now,
    };

    if (resolve) {
      patch.status = "resolved";
      patch.resolved_at = request.resolved_at || now;
    } else if (["resolved", "closed"].includes(normalize(request.status))) {
      // Editing a historic response should not silently reopen/alter a resolved ticket.
      patch.status = request.status;
    } else if (normalize(request.status || "open") === "open") {
      patch.status = "in_progress";
      patch.resolved_at = null;
    }

    const saved = await savePatch(
      request,
      patch,
      resolve
        ? "Response sent and request resolved."
        : "Response sent. Student can now see it in Support Center.",
      {
        actionType: "support_response",
        title: resolve ? "Counselor Responded & Resolved" : "Counselor Responded",
        description: `Counselor responded to support request: ${
          request.request_type || "Support Request"
        }.`,
        newValue: resolve ? "resolved" : normalize(request.status || "open"),
        metadata: {
          resolved_with_response: resolve,
        },
      }
    );

    if (saved?.id) {
      setResponseDrafts((previous) => ({
        ...previous,
        [saved.id]: saved.counselor_response || response,
      }));
    }
  };

  const stats = useMemo(() => {
    const total = localRequests.length;
    const open = localRequests.filter((item) =>
      ["open", "pending"].includes(normalize(item.status || "open"))
    ).length;
    const progress = localRequests.filter(
      (item) => normalize(item.status) === "in_progress"
    ).length;
    const urgent = localRequests.filter(
      (item) =>
        ["urgent", "high"].includes(normalize(item.priority)) &&
        !["resolved", "closed"].includes(normalize(item.status))
    ).length;
    const responded = localRequests.filter((item) =>
      Boolean(String(item.counselor_response || "").trim())
    ).length;
    const resolved = localRequests.filter((item) =>
      ["resolved", "closed"].includes(normalize(item.status))
    ).length;

    const overdue = localRequests.filter((item) => {
      const meta = ageMeta(item.created_at, item.status);
      return meta.hours >= 24 && !["resolved", "closed"].includes(normalize(item.status));
    }).length;

    const responseRate = total ? Math.round((responded / total) * 100) : 0;
    return { total, open, progress, urgent, responded, resolved, overdue, responseRate };
  }, [localRequests]);

  const filteredRequests = useMemo(() => {
    const query = String(search || "").trim().toLowerCase();

    return [...localRequests]
      .filter((request) => {
        if (
          statusFilter !== "all" &&
          normalize(request.status || "open") !== statusFilter
        ) {
          return false;
        }

        if (
          priorityFilter !== "all" &&
          normalize(request.priority || "normal") !== priorityFilter
        ) {
          return false;
        }

        if (!query) return true;

        const haystack = [
          request.subject,
          request.request_type,
          request.message,
          request.admin_notes,
          request.counselor_response,
          request.status,
          request.priority,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => {
        const priorityRank = { urgent: 4, high: 3, normal: 2, low: 1 };
        const aPriority = priorityRank[normalize(a.priority || "normal")] || 0;
        const bPriority = priorityRank[normalize(b.priority || "normal")] || 0;

        const aClosed = ["resolved", "closed"].includes(normalize(a.status));
        const bClosed = ["resolved", "closed"].includes(normalize(b.status));

        if (aClosed !== bClosed) return aClosed ? 1 : -1;
        if (aPriority !== bPriority) return bPriority - aPriority;

        const aAge = ageMeta(a.created_at, a.status).hours;
        const bAge = ageMeta(b.created_at, b.status).hours;
        if (!aClosed && aAge !== bAge) return bAge - aAge;

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [localRequests, search, statusFilter, priorityFilter]);

  const hasFilters = Boolean(String(search || "").trim()) || statusFilter !== "all" || priorityFilter !== "all";
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  return (
    <div className="space-y-4 pb-6 text-[#10233f]">
      <section className="rounded-[1.7rem] border-[3px] border-orange-400 bg-white p-4 shadow-[0_12px_30px_rgba(15,35,63,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                Support OS
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                Student #{studentId || "—"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black text-[#10233f]">
              Student Support Desk
            </h2>

            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Review student requests, control urgency and status, keep internal
              notes, and send responses directly back to the Student Portal.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-[#10233f] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md active:translate-y-0"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Metric label="Total" value={stats.total} icon={LifeBuoy} />
          <Metric label="Open" value={stats.open} icon={MessageSquareText} tone="blue" />
          <Metric label="In Progress" value={stats.progress} icon={Clock3} tone="orange" />
          <Metric label="Urgent" value={stats.urgent} icon={ShieldAlert} tone={stats.urgent ? "red" : "slate"} />
          <Metric label="Responded" value={stats.responded} icon={CheckCircle2} tone="green" />
          <Metric label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="green" />
          <Metric label="24h+ Waiting" value={stats.overdue} icon={TimerReset} tone={stats.overdue ? "red" : "slate"} />
          <Metric label="Response Rate" value={`${stats.responseRate}%`} icon={CheckCircle2} tone="green" />
        </div>
      </section>

      {message ? (
        <Feedback tone={messageTone} onClose={() => setMessage("")}>
          {message}
        </Feedback>
      ) : null}

      {auditWarning ? (
        <Feedback tone="warning" onClose={() => setAuditWarning("")}>
          {auditWarning}
        </Feedback>
      ) : null}

      <section className="rounded-[1.4rem] border-[3px] border-orange-300 bg-white p-3">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-orange-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">Queue Controls</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border-2 border-slate-300 bg-[#fffaf4] px-3 py-1.5 text-[10px] font-black text-slate-600">{filteredRequests.length} shown</span>
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700">
                <X size={13} /> Clear Filters
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject, message, type, notes or response..."
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {pretty(status)}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {pretty(priority)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filteredRequests.length ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <SupportRequestCard
              key={request.id}
              request={request}
              busy={isBusy(request.id)}
              busyAction={busyMap[request.id] || ""}
              unsavedResponse={hasUnsavedResponse(request)}
              unsavedNotes={hasUnsavedNotes(request)}
              responseDraft={
                responseDrafts[request.id] ?? request.counselor_response ?? ""
              }
              noteDraft={noteDrafts[request.id] ?? request.admin_notes ?? ""}
              onResponseDraft={(value) =>
                setResponseDrafts((previous) => ({
                  ...previous,
                  [request.id]: value,
                }))
              }
              onNoteDraft={(value) =>
                setNoteDrafts((previous) => ({
                  ...previous,
                  [request.id]: value,
                }))
              }
              onPriority={(value) => changePriority(request, value)}
              onStatus={(value) => changeStatus(request, value)}
              onSaveNotes={() => saveAdminNotes(request)}
              onSend={() => sendResponse(request, { resolve: false })}
              onSendResolve={() => sendResponse(request, { resolve: true })}
              onTimeline={() => {
                if (typeof onOpenTimeline === "function") {
                  onOpenTimeline(request);
                }
              }}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-8 text-center">
          <LifeBuoy size={34} className="mx-auto text-orange-400" />
          <h3 className="mt-3 text-lg font-black text-[#10233f]">
            No matching support requests
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            The queue is empty for the current filters.
          </p>
        </section>
      )}
    </div>
  );
}

function SupportRequestCard({
  request,
  busy,
  busyAction,
  unsavedResponse,
  unsavedNotes,
  responseDraft,
  noteDraft,
  onResponseDraft,
  onNoteDraft,
  onPriority,
  onStatus,
  onSaveNotes,
  onSend,
  onSendResolve,
  onTimeline,
}) {
  const status = normalize(request.status || "open");
  const closed = ["resolved", "closed"].includes(status);
  const age = ageMeta(request.created_at, request.status);

  return (
    <article className="overflow-hidden rounded-[1.6rem] border-[3px] border-orange-300 bg-white shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
      <div className="border-b-2 border-orange-200 bg-[#fffaf4] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge value={request.priority || "normal"} />
              <StatusBadge value={request.status || "open"} />
              <AgeBadge meta={age} />
              {unsavedNotes ? <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-800">Notes Unsaved</span> : null}
              {unsavedResponse ? <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase text-orange-800">Response Draft</span> : null}
            </div>

            <h3 className="mt-3 text-lg font-black text-[#10233f]">
              {request.subject || "Support Request"}
            </h3>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-orange-700">
              {pretty(request.request_type || "general")}
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
              {request.message || "No message supplied."}
            </p>
          </div>

          <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <label>
              <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                Priority
              </span>
              <select
                value={normalize(request.priority || "normal")}
                disabled={busy}
                onChange={(event) => onPriority(event.target.value)}
                className="h-10 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black capitalize text-[#10233f]"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {pretty(option)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                Status
              </span>
              <select
                value={status}
                disabled={busy}
                onChange={(event) => onStatus(event.target.value)}
                className="h-10 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black capitalize text-[#10233f]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {pretty(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Info label="Created" value={formatDateTime(request.created_at)} />
          <Info label="Responded" value={formatDateTime(request.responded_at)} />
          <Info label="Resolved" value={formatDateTime(request.resolved_at)} />
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
        <section className="rounded-2xl border-2 border-slate-300 bg-[#fffaf4] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Internal Workspace
          </p>
          <h4 className="mt-1 font-black text-[#10233f]">Admin Notes</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Internal only. Students do not see this text.
          </p>

          <textarea
            value={noteDraft}
            onChange={(event) => onNoteDraft(event.target.value)}
            rows={6}
            disabled={busy}
            placeholder="Add internal context, follow-up instructions, escalation notes..."
            className="mt-3 w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={onSaveNotes}
            disabled={busy || !unsavedNotes}
            className="mt-3 rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-2.5 text-xs font-black text-orange-800 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-600 hover:bg-orange-100 hover:shadow-md active:translate-y-0 disabled:opacity-50"
          >
            {busy ? "Saving..." : unsavedNotes ? "Save Internal Notes" : "Notes Saved"}
          </button>
        </section>

        <section className="rounded-2xl border-2 border-[#123865] bg-[#123865] p-4 text-white">
          <p
            className="text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: "#ffb35c" }}
          >
            Student Response
          </p>
          <h4 className="mt-1 font-black" style={{ color: "#ffffff" }}>
            Counselor Response
          </h4>
          <p
            className="mt-1 text-xs font-semibold"
            style={{ color: "#ffffff" }}
          >
            This response is visible inside the Student Portal Support Center.
          </p>

          <textarea
            value={responseDraft}
            onChange={(event) => onResponseDraft(event.target.value)}
            rows={6}
            disabled={busy}
            placeholder="Write the response the student will see..."
            className="mt-3 w-full resize-y rounded-xl border-2 border-white/40 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-200/30 disabled:opacity-60"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSend}
              disabled={busy || !String(responseDraft || "").trim() || (!unsavedResponse && Boolean(request.counselor_response))}
              className="rounded-xl border-2 border-white bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md active:translate-y-0 disabled:opacity-40"
            >
              {busy ? (busyAction === "saving" ? "Saving..." : "Working...") : request.counselor_response ? (unsavedResponse ? "Update Response" : "Response Saved") : "Send Response"}
            </button>

            {!closed ? (
              <button
                type="button"
                onClick={onSendResolve}
                disabled={busy || !String(responseDraft || "").trim()}
                className="rounded-xl border-2 border-orange-300 bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0 disabled:opacity-40"
                style={{ color: "#ffffff" }}
              >
                <span style={{ color: "#ffffff" }}>
                  Send + Resolve
                </span>
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 border-t-2 border-orange-200 bg-white p-4 sm:px-5">
        {!closed ? (
          <>
            {status !== "in_progress" ? (
              <ActionButton
                tone="blue"
                disabled={busy}
                onClick={() => onStatus("in_progress")}
              >
                Mark In Progress
              </ActionButton>
            ) : null}

            <ActionButton
              tone="green"
              disabled={busy}
              onClick={() => onStatus("resolved")}
            >
              Resolve
            </ActionButton>

            <ActionButton
              tone="red"
              disabled={busy}
              onClick={() => onStatus("closed")}
            >
              Close
            </ActionButton>
          </>
        ) : (
          <ActionButton
            tone="slate"
            disabled={busy}
            onClick={() => onStatus("open")}
          >
            Reopen
          </ActionButton>
        )}

        <button
          type="button"
          onClick={onTimeline}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-[#10233f] shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md active:translate-y-0"
        >
          <History size={14} />
          Open Timeline
        </button>
      </div>
    </article>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-slate-300 bg-white text-[#10233f]",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    red: "border-red-300 bg-red-50 text-red-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
        tones[tone] || tones.slate
      }`}
    >
      <Icon size={15} />
      <div>
        <p className="text-sm font-black">{value}</p>
        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
          {label}
        </p>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function PriorityBadge({ value }) {
  const clean = normalize(value || "normal");
  const styles = {
    urgent: "border-red-400 bg-red-50 text-red-800",
    high: "border-orange-400 bg-orange-50 text-orange-800",
    normal: "border-blue-300 bg-blue-50 text-blue-800",
    low: "border-slate-300 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
        styles[clean] || styles.normal
      }`}
    >
      {pretty(clean)} Priority
    </span>
  );
}

function StatusBadge({ value }) {
  const clean = normalize(value || "open");
  const style =
    clean === "resolved"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : clean === "closed"
      ? "border-slate-400 bg-slate-100 text-slate-700"
      : clean === "in_progress"
      ? "border-orange-300 bg-orange-50 text-orange-800"
      : "border-blue-300 bg-blue-50 text-blue-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${style}`}>
      {pretty(clean)}
    </span>
  );
}

function AgeBadge({ meta }) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    slate: "border-slate-300 bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
        styles[meta?.tone] || styles.slate
      }`}
    >
      {meta?.label || "Age unknown"}
    </span>
  );
}

function ActionButton({ children, tone = "slate", disabled, onClick }) {
  const styles = {
    blue: "border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-500 hover:bg-blue-100",
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100",
    red: "border-red-300 bg-red-50 text-red-800 hover:border-red-500 hover:bg-red-100",
    slate:
      "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-500 hover:bg-slate-100",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 ${
        styles[tone] || styles.slate
      }`}
    >
      {children}
    </button>
  );
}

function Feedback({ tone = "info", onClose, children }) {
  const styles = {
    success: "border-emerald-400 bg-emerald-50 text-emerald-900",
    error: "border-red-400 bg-red-50 text-red-900",
    warning: "border-amber-400 bg-amber-50 text-amber-900",
    info: "border-blue-400 bg-blue-50 text-blue-900",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${
        styles[tone] || styles.info
      }`}
    >
      {tone === "error" || tone === "warning" ? (
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">{children}</div>

      <button type="button" onClick={onClose} aria-label="Dismiss message" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/50 transition hover:bg-white">
        <X size={15} />
      </button>
    </div>
  );
}
