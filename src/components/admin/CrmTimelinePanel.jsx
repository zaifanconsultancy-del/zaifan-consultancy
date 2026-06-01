import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { addTimelineEvent, fetchTimelineEvents } from "../../lib/crmTimeline";

const REQUEST_TIMEOUT_MS = 30000;

function CrmTimelinePanel({ studentId, studentType, adminProfile = null }) {
  const [crmEvents, setCrmEvents] = useState([]);
  const [applicationEvents, setApplicationEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const numericStudentId = Number(studentId);
  const hasValidStudentId = Number.isFinite(numericStudentId);

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const loadTimeline = async () => {
    if (!studentId || !studentType) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const [{ data: crmData, error: crmError }, appResult] = await Promise.all([
        fetchTimelineEvents(studentId, studentType),
        hasValidStudentId
          ? withTimeout(
              supabase
                .from("student_application_timeline")
                .select("*")
                .eq("student_id", numericStudentId)
                .order("created_at", { ascending: false })
                .limit(100),
              "Application timeline loading timed out."
            )
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (crmError) {
        setErrorMessage("CRM timeline could not load. Check crm_timeline table/RLS.");
      }

      if (appResult?.error) {
        setErrorMessage(
          "Application timeline could not load. Check student_application_timeline table/RLS."
        );
      }

      setCrmEvents(crmData || []);
      setApplicationEvents(appResult?.data || []);
    } catch (error) {
      console.error("Timeline load crashed:", error);
      setErrorMessage(error.message || "Timeline crashed while loading.");
      setCrmEvents([]);
      setApplicationEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [studentId, studentType]);

  const addManualNote = async () => {
    const cleanNote = note.trim();
    if (!cleanNote || savingNote) return;

    setSavingNote(true);
    setErrorMessage("");

    try {
      const { error } = await addTimelineEvent({
        studentId,
        studentType,
        actionType: "manual_note",
        title: "Manual Note Added",
        description: cleanNote,
        adminProfile,
      });

      if (error) {
        setErrorMessage("Note could not save. Check crm_timeline table/RLS.");
        return;
      }

      setNote("");
      await loadTimeline();
    } catch (error) {
      console.error("Note save crashed:", error);
      setErrorMessage("Note crashed while saving.");
    } finally {
      setSavingNote(false);
    }
  };

  const combinedEvents = useMemo(() => {
    const normalizedCrm = (crmEvents || []).map((event) => ({
      id: `crm-${event.id}`,
      source: "crm",
      title: event.title || "CRM Event",
      description: event.description || "",
      type: event.action_type || "crm_event",
      oldValue: event.old_value || "",
      newValue: event.new_value || "",
      createdBy: event.created_by_name || "Admin",
      createdAt: event.created_at,
    }));

    const normalizedApp = (applicationEvents || []).map((event) => ({
      id: `app-${event.id}`,
      source: "application",
      title: event.title || "Application Event",
      description: event.description || "",
      type: event.event_type || "application_event",
      oldValue: event.old_value || "",
      newValue: event.new_value || "",
      createdBy: "System",
      createdAt: event.created_at,
    }));

    return [...normalizedCrm, ...normalizedApp].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [crmEvents, applicationEvents]);

  const timelineStats = useMemo(() => {
    return {
      total: combinedEvents.length,
      crm: crmEvents.length,
      application: applicationEvents.length,
      visa: applicationEvents.filter((event) =>
        String(event.event_type || "").includes("visa")
      ).length,
    };
  }, [combinedEvents, crmEvents, applicationEvents]);

  const formatDate = (date) => {
    if (!date) return "Unknown time";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventIcon = (type = "") => {
    const clean = String(type);

    if (clean.includes("visa")) return "🌍";
    if (clean.includes("offer")) return "🏆";
    if (clean.includes("university")) return "🏫";
    if (clean.includes("application")) return "🎓";
    if (clean.includes("status")) return "⚡";
    if (clean.includes("note")) return "📝";
    if (clean.includes("assignment")) return "👥";
    if (clean.includes("pipeline")) return "🧭";

    return "•";
  };

  const getEventStyle = (source) => {
    if (source === "application") {
      return {
        dot: "bg-cyan-300",
        badge:
          "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
      };
    }

    return {
      dot: "bg-[#D4AF37]",
      badge:
        "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    };
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Add Timeline Note</h3>
          <p className="text-sm text-white/45">
            Save internal staff notes, follow-up comments, and student updates.
          </p>
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Example: Called student. He is interested in UK January intake and will send documents tomorrow."
          className="min-h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40"
        />

        <div className="mt-3 flex justify-end">
          <button
            onClick={addManualNote}
            disabled={!note.trim() || savingNote}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingNote ? "Saving..." : "Add Note"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Total Events" value={timelineStats.total} />
        <MiniStat label="CRM Events" value={timelineStats.crm} />
        <MiniStat label="Application Events" value={timelineStats.application} />
        <MiniStat label="Visa Events" value={timelineStats.visa} />
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Unified Student Journey Timeline
            </h3>
            <p className="text-sm text-white/45">
              CRM notes, application movement, university sync, offer history,
              and visa changes in one timeline.
            </p>
          </div>

          <button
            onClick={loadTimeline}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            Refresh
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
            Loading unified timeline...
          </div>
        ) : combinedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No timeline history yet.
          </div>
        ) : (
          <div className="space-y-4">
            {combinedEvents.map((event) => {
              const style = getEventStyle(event.source);

              return (
                <div key={event.id} className="relative pl-8">
                  <span
                    className={`absolute left-0 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${style.dot}`}
                  >
                    {getEventIcon(event.type)}
                  </span>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {event.title}
                        </p>

                        {event.description ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-white/50">
                            {event.description}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${style.badge}`}
                      >
                        {String(event.type).replaceAll("_", " ")}
                      </span>
                    </div>

                    {(event.oldValue || event.newValue) && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">
                        {event.oldValue ? <span>{event.oldValue}</span> : null}
                        {event.oldValue && event.newValue ? (
                          <span className="mx-2 text-[#D4AF37]">→</span>
                        ) : null}
                        {event.newValue ? (
                          <span className="text-white/70">{event.newValue}</span>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
                      <span>
                        {event.source === "application"
                          ? "Application System"
                          : `By ${event.createdBy || "Admin"}`}
                      </span>
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#D4AF37]">{value}</p>
    </div>
  );
}

export default CrmTimelinePanel;