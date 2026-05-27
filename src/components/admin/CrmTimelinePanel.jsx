import { useEffect, useState } from "react";
import { addTimelineEvent, fetchTimelineEvents } from "../../lib/crmTimeline";

function CrmTimelinePanel({ studentId, studentType, adminProfile = null }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTimeline = async () => {
    if (!studentId || !studentType) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await fetchTimelineEvents(studentId, studentType);

      if (error) {
        setErrorMessage("Timeline could not load. Check crm_timeline table/RLS.");
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error("Timeline load crashed:", error);
      setErrorMessage("Timeline crashed while loading.");
      setEvents([]);
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

      <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">CRM Timeline</h3>
            <p className="text-sm text-white/45">
              Complete history of actions for this student.
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
            Loading timeline...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No timeline history yet.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative pl-6">
                <span className="absolute left-0 top-2 h-3 w-3 rounded-full bg-[#D4AF37]" />

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

                    <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold text-[#D4AF37]">
                      {event.action_type}
                    </span>
                  </div>

                  {(event.old_value || event.new_value) && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45">
                      {event.old_value ? <span>{event.old_value}</span> : null}
                      {event.old_value && event.new_value ? (
                        <span className="mx-2 text-[#D4AF37]">→</span>
                      ) : null}
                      {event.new_value ? (
                        <span className="text-white/70">{event.new_value}</span>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
                    <span>By {event.created_by_name || "Admin"}</span>
                    <span>{formatDate(event.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CrmTimelinePanel;