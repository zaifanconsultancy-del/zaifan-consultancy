import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function StudentDetailModal({ isOpen, onClose, student, type = "inquiry" }) {
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const studentId = student?.id ? String(student.id) : "";
  const priority = student?.priority || "low";
  const status =
    type === "inquiry"
      ? student?.status || "new"
      : student?.status || "pending";

  const priorityStyles = {
    vip: "border-purple-400/30 bg-purple-500/10 text-purple-300",
    high: "border-red-400/30 bg-red-500/10 text-red-300",
    medium: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    low: "border-white/10 bg-white/[0.05] text-gray-300",
  };

  const fetchNotes = async () => {
    if (!studentId || !type) return;

    setNotesLoading(true);

    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("student_id", studentId)
      .eq("student_type", type)
      .order("created_at", { ascending: false });

    setNotesLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to load notes.");
      return;
    }

    setNotes(data || []);
  };

  const saveNote = async () => {
    if (!studentId) return;

    if (!noteText.trim()) {
      alert("Please write a note first.");
      return;
    }

    const { error } = await supabase.from("crm_notes").insert({
      student_id: studentId,
      student_type: type,
      note: noteText.trim(),
    });

    if (error) {
      console.error(error);
      alert("Failed to save note.");
      return;
    }

    setNoteText("");
    await fetchNotes();
  };

  const deleteNote = async (id) => {
    const confirmDelete = confirm("Delete this note?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("crm_notes").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete note.");
      return;
    }

    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
  };

  useEffect(() => {
    if (isOpen && studentId) {
      fetchNotes();
      setNoteText("");
    }
  }, [isOpen, studentId, type]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(event) => event.stopPropagation()}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-7xl"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808]/95 backdrop-blur-2xl">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
            <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

            <div className="relative border-b border-white/10 p-5 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
                    Student CRM Profile
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">
                    {student.full_name || "Unnamed Student"}
                  </h2>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                        priorityStyles[priority] || priorityStyles.low
                      }`}
                    >
                      {priority} Priority
                    </span>

                    <span className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-400">
                      {status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="relative z-50 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-300 transition duration-300 hover:border-[#D4AF37]/30 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="relative grid gap-6 p-5 sm:p-8 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <Section title="Student Information">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard label="Email" value={student.email} />
                    <InfoCard label="Phone" value={student.phone} />
                    <InfoCard
                      label={type === "inquiry" ? "Country" : "Country Interest"}
                      value={student.country || student.country_interest}
                    />
                    <InfoCard
                      label={
                        type === "inquiry"
                          ? "Study Level"
                          : "Consultation Type"
                      }
                      value={student.study_level || student.consultation_type}
                    />
                  </div>
                </Section>

                <Section title="Student Message">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {student.message || "No message provided."}
                    </p>
                  </div>
                </Section>

                <Section title="CRM Notes">
                  <div className="rounded-[1.5rem] border border-dashed border-[#D4AF37]/25 bg-[#D4AF37]/5 p-5">
                    <textarea
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      placeholder="Add internal notes, follow-up reminders, visa updates, consultation summaries..."
                      className="min-h-[160px] w-full resize-none rounded-[1.2rem] border border-white/10 bg-black/30 p-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
                    />

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={saveNote}
                        className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition duration-300 hover:bg-[#E7C768]"
                      >
                        Save Note
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {notesLoading ? (
                        <p className="text-sm text-gray-400">Loading notes...</p>
                      ) : notes.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                          No internal notes yet.
                        </p>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                                {note.note}
                              </p>

                              <button
                                type="button"
                                onClick={() => deleteNote(note.id)}
                                className="shrink-0 rounded-full border border-red-500/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-400 hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>

                            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                              {note.created_at
                                ? new Date(note.created_at).toLocaleString()
                                : ""}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-6">
                <Section title="Quick Actions">
                  <div className="grid gap-3">
                    <ActionButton label="Send Email" icon="✉️" />
                    <ActionButton label="Schedule Consultation" icon="📅" />
                    <ActionButton label="Create Follow Up" icon="⏰" />
                    <ActionButton label="Mark as VIP Lead" icon="👑" />
                  </div>
                </Section>

                <Section title="Lead Timeline">
                  <div className="space-y-4">
                    <TimelineItem
                      title="Lead Created"
                      text="Student entered CRM system."
                    />
                    <TimelineItem
                      title="Priority Assigned"
                      text={`${priority.toUpperCase()} priority currently active.`}
                    />
                    <TimelineItem
                      title="Notes Enabled"
                      text={`${notes.length} internal note${
                        notes.length === 1 ? "" : "s"
                      } saved for this profile.`}
                    />
                  </div>
                </Section>

                <Section title="CRM Metadata">
                  <div className="space-y-3">
                    <MetaItem
                      label="Created"
                      value={
                        student.created_at
                          ? new Date(student.created_at).toLocaleString()
                          : "-"
                      }
                    />
                    <MetaItem label="Lead Type" value={type} />
                    <MetaItem label="Priority" value={priority} />
                    <MetaItem label="Status" value={status} />
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm text-gray-200">{value || "-"}</p>
    </div>
  );
}

function ActionButton({ label, icon }) {
  return (
    <button
      type="button"
      onClick={() =>
        alert(`${label} feature will be connected in the next CRM upgrade.`)
      }
      className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-5 py-4 text-left transition duration-300 hover:border-[#D4AF37]/30 hover:bg-white/[0.05]"
    >
      <span className="text-sm font-medium text-white">{label}</span>
      <span className="text-xl">{icon}</span>
    </button>
  );
}

function TimelineItem({ title, text }) {
  return (
    <div className="relative rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-full bg-[#D4AF37]"></div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-gray-400">{text}</p>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
        {label}
      </span>
      <span className="break-words text-right text-sm font-medium text-white">
        {value}
      </span>
    </div>
  );
}

export default StudentDetailModal;