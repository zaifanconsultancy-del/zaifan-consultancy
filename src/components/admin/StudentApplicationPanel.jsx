import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 30000;

const emptyApplicationForm = {
  country: "",
  university: "",
  program: "",
  intake: "",
  application_status: "not_started",
  offer_status: "pending",
  visa_status: "not_started",
  counselor_notes: "",
  university_notes: "",
  offer_notes: "",
  internal_notes: "",
};

function StudentApplicationPanel({ student }) {
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyApplicationForm);
  const [timeline, setTimeline] = useState([]);

  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [timelineError, setTimelineError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const studentType = student?.student_type || student?.type || "inquiry";

  const hasValidStudentId = Number.isFinite(numericStudentId);

  const studentName =
    student?.full_name || student?.name || student?.student_name || "Student";

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fallback = normalizeApplication(null);

    setApplication(student?.application || null);
    setForm(normalizeApplication(student?.application || fallback));
    setTimeline([]);
    setError("");
    setTimelineError("");
    setSuccessMessage("");

    loadApplication();
    loadTimeline();
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const buildFallback = () => ({
    country: student?.country || student?.preferred_country || "",
    university: student?.university || "",
    program: student?.program || student?.field_of_interest || "",
    intake: student?.intake || "",
    application_status: student?.application_status || "not_started",
    offer_status: student?.offer_status || "pending",
    visa_status: student?.visa_status || "not_started",
    counselor_notes: "",
    university_notes: "",
    offer_notes: "",
    internal_notes: "",
  });

  const normalizeApplication = (record) => ({
    ...emptyApplicationForm,
    ...buildFallback(),
    ...(record || {}),
  });

  const formatStatus = (value) =>
    String(value || "not_started").replaceAll("_", " ");

  const timelineStats = useMemo(() => {
    const statusEvents = timeline.filter((item) =>
      String(item.event_type || "").includes("status")
    ).length;

    const noteEvents = timeline.filter((item) =>
      String(item.event_type || "").includes("notes")
    ).length;

    const universityEvents = timeline.filter((item) =>
      ["university_changed", "program_changed", "country_changed", "intake_changed"].includes(
        item.event_type
      )
    ).length;

    return {
      total: timeline.length,
      statusEvents,
      noteEvents,
      universityEvents,
    };
  }, [timeline]);

  const loadApplication = async () => {
    const requestId = Date.now();
    loadRequestRef.current = requestId;

    if (!hasValidStudentId) {
      safeSet(() => {
        setApplication(null);
        setForm(emptyApplicationForm);
        setLoading(false);
        setError("");
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      setError("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", numericStudentId)
          .order("created_at", { ascending: false })
          .limit(1),
        "Application loading timed out. Showing fallback profile data."
      );

      if (loadRequestRef.current !== requestId) return;
      if (error) throw error;

      const record = data?.[0] || null;

      safeSet(() => {
        setApplication(record);
        setForm(normalizeApplication(record));
        setError("");
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setApplication(student?.application || null);
        setForm(normalizeApplication(student?.application || null));
        setError("");
      });
    } finally {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const loadTimeline = async () => {
    if (!hasValidStudentId) {
      safeSet(() => {
        setTimeline([]);
        setTimelineLoading(false);
        setTimelineError("Invalid student id for timeline.");
      });
      return;
    }

    safeSet(() => {
      setTimelineLoading(true);
      setTimelineError("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_application_timeline")
          .select("*")
          .eq("student_id", numericStudentId)
          .order("created_at", { ascending: false })
          .limit(50),
        "Timeline loading timed out."
      );

      if (error) throw error;

      safeSet(() => {
        setTimeline(data || []);
        setTimelineError("");
      });
    } catch (error) {
      safeSet(() => {
        setTimeline([]);
        setTimelineError(error.message || "Timeline failed to load.");
      });
    } finally {
      safeSet(() => {
        setTimelineLoading(false);
      });
    }
  };

  const createTimelineEvent = async ({
    applicationId = null,
    eventType,
    title,
    description = "",
    oldValue = "",
    newValue = "",
  }) => {
    if (!hasValidStudentId || !eventType || !title) {
      safeSet(() => {
        setTimelineError("Timeline event skipped because student id or event data is invalid.");
      });
      return false;
    }

    const payload = {
      student_id: numericStudentId,
      student_type: studentType,
      application_id: applicationId ? String(applicationId) : null,
      event_type: eventType,
      title,
      description,
      old_value: oldValue ? String(oldValue) : null,
      new_value: newValue ? String(newValue) : null,
    };

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_application_timeline")
          .insert(payload)
          .select()
          .single(),
        "Timeline event save timed out."
      );

      if (error) throw error;

      safeSet(() => {
        setTimelineError("");
        setTimeline((prev) => [data, ...prev].slice(0, 50));
      });

      return true;
    } catch (error) {
      safeSet(() => {
        setTimelineError(error.message || "Timeline event failed to save.");
      });

      return false;
    }
  };

  const buildChangeEvents = (previous, next, applicationId) => {
    const events = [];

    const compare = ({ field, eventType, title, descriptionPrefix }) => {
      const oldValue = previous?.[field] || "";
      const newValue = next?.[field] || "";

      if (String(oldValue) === String(newValue)) return;

      events.push({
        applicationId,
        eventType,
        title,
        description: `${descriptionPrefix} changed from "${
          oldValue || "empty"
        }" to "${newValue || "empty"}".`,
        oldValue,
        newValue,
      });
    };

    compare({
      field: "application_status",
      eventType: "application_status_changed",
      title: "Application Status Updated",
      descriptionPrefix: "Application status",
    });

    compare({
      field: "offer_status",
      eventType: "offer_status_changed",
      title: "Offer Status Updated",
      descriptionPrefix: "Offer status",
    });

    compare({
      field: "visa_status",
      eventType: "visa_status_changed",
      title: "Visa Status Updated",
      descriptionPrefix: "Visa status",
    });

    compare({
      field: "country",
      eventType: "country_changed",
      title: "Target Country Updated",
      descriptionPrefix: "Target country",
    });

    compare({
      field: "university",
      eventType: "university_changed",
      title: "University Updated",
      descriptionPrefix: "University",
    });

    compare({
      field: "program",
      eventType: "program_changed",
      title: "Program Updated",
      descriptionPrefix: "Program",
    });

    compare({
      field: "intake",
      eventType: "intake_changed",
      title: "Intake Updated",
      descriptionPrefix: "Intake",
    });

    const noteFields = [
      "counselor_notes",
      "university_notes",
      "offer_notes",
      "internal_notes",
    ];

    const notesChanged = noteFields.some(
      (field) => String(previous?.[field] || "") !== String(next?.[field] || "")
    );

    if (notesChanged) {
      events.push({
        applicationId,
        eventType: "notes_updated",
        title: "Application Notes Updated",
        description:
          "Counselor, university, offer, or internal notes were updated.",
        oldValue: "",
        newValue: "Notes updated",
      });
    }

    return events;
  };

  const saveApplication = async () => {
    if (!hasValidStudentId || saving) return;

    safeSet(() => {
      setSaving(true);
      setError("");
      setTimelineError("");
      setSuccessMessage("");
    });

    const payload = {
      student_id: numericStudentId,
      student_type: studentType,
      country: form.country || "",
      university: form.university || "",
      program: form.program || "",
      intake: form.intake || "",
      application_status: form.application_status || "not_started",
      offer_status: form.offer_status || "pending",
      visa_status: form.visa_status || "not_started",
      counselor_notes: form.counselor_notes || "",
      university_notes: form.university_notes || "",
      offer_notes: form.offer_notes || "",
      internal_notes: form.internal_notes || "",
      updated_at: new Date().toISOString(),
    };

    try {
      let savedApplication = null;
      let wasCreated = false;

      if (application?.id) {
        const result = await withTimeout(
          supabase
            .from("student_applications")
            .update(payload)
            .eq("id", application.id),
          "Application save timed out. Please refresh after a few seconds."
        );

        if (result.error) throw result.error;

        savedApplication = {
          ...application,
          ...payload,
        };

        safeSet(() => {
          setApplication(savedApplication);
          setForm(normalizeApplication(savedApplication));
          setSuccessMessage("Application saved successfully.");
        });
      } else {
        wasCreated = true;

        const result = await withTimeout(
          supabase
            .from("student_applications")
            .insert(payload)
            .select()
            .single(),
          "Application create timed out. Please refresh after a few seconds."
        );

        if (result.error) throw result.error;

        savedApplication = result.data;

        safeSet(() => {
          setApplication(result.data);
          setForm(normalizeApplication(result.data));
          setSuccessMessage("Application saved successfully.");
        });
      }

      const applicationId = savedApplication?.id || application?.id || null;

      if (wasCreated) {
        await createTimelineEvent({
          applicationId,
          eventType: "application_created",
          title: "Application Created",
          description: `${studentName}'s application record was created.`,
          oldValue: "",
          newValue: savedApplication?.application_status || "not_started",
        });
      } else {
        const changeEvents = buildChangeEvents(application, savedApplication, applicationId);

        if (changeEvents.length === 0) {
          await createTimelineEvent({
            applicationId,
            eventType: "application_saved",
            title: "Application Saved",
            description:
              "Application was saved. No major tracked status fields changed, but the record was updated.",
            oldValue: "",
            newValue: "Saved",
          });
        } else {
          for (const event of changeEvents) {
            await createTimelineEvent(event);
          }
        }
      }

      await loadTimeline();
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Application save failed.");
      });
    } finally {
      safeSet(() => {
        setSaving(false);
      });
    }
  };

  const statusStyle = (value) => {
    const styles = {
      not_started: "border-white/10 bg-white/[0.03] text-white/60",
      pending: "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
      documents_pending:
        "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
      documents_received:
        "border-blue-400/30 bg-blue-500/10 text-blue-300",
      applied: "border-purple-400/30 bg-purple-500/10 text-purple-300",
      under_review: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
      offer_received:
        "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      offer_accepted:
        "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
      visa_processing: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
      biometrics: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      medical: "border-purple-400/30 bg-purple-500/10 text-purple-300",
      visa_approved: "border-green-400/30 bg-green-500/10 text-green-300",
      enrolled: "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]",
      rejected: "border-red-400/30 bg-red-500/10 text-red-300",
    };

    return styles[value] || styles.not_started;
  };

  const currentReadiness = [
    form.country,
    form.university,
    form.program,
    form.intake,
    form.application_status !== "not_started" ? form.application_status : "",
    form.offer_status !== "pending" ? form.offer_status : "",
    form.visa_status !== "not_started" ? form.visa_status : "",
  ].filter(Boolean).length;

  const readinessPercent = Math.round((currentReadiness / 7) * 100);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              University Application Tracker
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Student Journey Management
            </h2>

            <p className="mt-2 max-w-2xl text-white/60">
              Manage target country, university, program, offer status, visa
              progress, internal notes, and application movement history.
            </p>
          </div>

          <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/20 p-4 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
              Readiness
            </p>
            <p className="mt-1 text-2xl font-black text-[#D4AF37]">
              {readinessPercent}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              loadApplication();
              loadTimeline();
            }}
            disabled={loading || saving}
            className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Application"}
          </button>

          <button
            type="button"
            onClick={loadTimeline}
            disabled={timelineLoading || saving}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {timelineLoading ? "Refreshing Timeline..." : "Refresh Timeline"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Timeline Events" value={timelineStats.total} />
        <MiniStat label="Status Updates" value={timelineStats.statusEvents} />
        <MiniStat label="Note Updates" value={timelineStats.noteEvents} />
        <MiniStat label="University Changes" value={timelineStats.universityEvents} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {timelineError ? (
        <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-sm text-orange-200">
          Timeline error: {timelineError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/50">
          Refreshing application data...
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <InputCard
          label="Country"
          value={form.country}
          disabled={saving}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, country: value }))
          }
        />

        <InputCard
          label="University"
          value={form.university}
          disabled={saving}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, university: value }))
          }
        />

        <InputCard
          label="Program"
          value={form.program}
          disabled={saving}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, program: value }))
          }
        />

        <InputCard
          label="Intake"
          value={form.intake}
          disabled={saving}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, intake: value }))
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SelectStatusCard
          title="Application Status"
          value={form.application_status}
          disabled={saving}
          options={[
            "not_started",
            "documents_pending",
            "documents_received",
            "applied",
            "under_review",
            "offer_received",
            "offer_accepted",
            "rejected",
          ]}
          className={statusStyle(form.application_status)}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, application_status: value }))
          }
        />

        <SelectStatusCard
          title="Offer Status"
          value={form.offer_status}
          disabled={saving}
          options={[
            "pending",
            "under_review",
            "offer_received",
            "offer_accepted",
            "rejected",
          ]}
          className={statusStyle(form.offer_status)}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, offer_status: value }))
          }
        />

        <SelectStatusCard
          title="Visa Status"
          value={form.visa_status}
          disabled={saving}
          options={[
            "not_started",
            "visa_processing",
            "biometrics",
            "medical",
            "under_review",
            "visa_approved",
            "rejected",
          ]}
          className={statusStyle(form.visa_status)}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, visa_status: value }))
          }
        />
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            Application Notes
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Counselor Application Intelligence
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Store internal context for counseling, university processing, offer
            handling, and operational decision-making.
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TextAreaCard
            label="Counselor Notes"
            value={form.counselor_notes}
            disabled={saving}
            placeholder="Add counseling context, student goals, family concerns, budget notes, or next steps..."
            onChange={(value) =>
              setForm((prev) => ({ ...prev, counselor_notes: value }))
            }
          />

          <TextAreaCard
            label="University Notes"
            value={form.university_notes}
            disabled={saving}
            placeholder="Add university requirements, shortlist reasoning, program fit, deadline notes..."
            onChange={(value) =>
              setForm((prev) => ({ ...prev, university_notes: value }))
            }
          />

          <TextAreaCard
            label="Offer Notes"
            value={form.offer_notes}
            disabled={saving}
            placeholder="Add offer conditions, deposit notes, scholarship details, acceptance deadline..."
            onChange={(value) =>
              setForm((prev) => ({ ...prev, offer_notes: value }))
            }
          />

          <TextAreaCard
            label="Internal Notes"
            value={form.internal_notes}
            disabled={saving}
            placeholder="Private internal notes for staff, risk flags, admin decisions, or backend follow-up..."
            onChange={(value) =>
              setForm((prev) => ({ ...prev, internal_notes: value }))
            }
          />
        </div>
      </div>

      <button
        type="button"
        onClick={saveApplication}
        disabled={saving}
        className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving Application..." : "Save Application"}
      </button>

      <ApplicationTimeline
        timeline={timeline}
        loading={timelineLoading}
        onRefresh={loadTimeline}
      />
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

function InputCard({ label, value, onChange, disabled = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <input
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${label}`}
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40 disabled:opacity-50"
      />
    </div>
  );
}

function TextAreaCard({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "",
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <textarea
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={6}
        className="mt-3 min-h-[150px] w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40 disabled:opacity-50"
      />
    </div>
  );
}

function SelectStatusCard({
  title,
  value,
  options,
  className,
  onChange,
  disabled = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>

      <div
        className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-bold capitalize ${className}`}
      >
        {(value || "not_started").replaceAll("_", " ")}
      </div>

      <select
        value={value || "not_started"}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/40 disabled:opacity-50"
      >
        {options.map((item) => (
          <option key={item} value={item} className="bg-black">
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

function ApplicationTimeline({ timeline = [], loading = false, onRefresh }) {
  const getEventIcon = (type) => {
    if (String(type).includes("visa")) return "🌍";
    if (String(type).includes("offer")) return "🏆";
    if (String(type).includes("notes")) return "📝";
    if (String(type).includes("university")) return "🏫";
    if (String(type).includes("program")) return "🎓";
    if (String(type).includes("created")) return "🚀";
    return "⚡";
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            Application Timeline
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Application Movement History
          </h3>
          <p className="mt-2 text-sm text-white/50">
            Automatic history for application, offer, visa, university, program,
            intake, and note changes.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Timeline"}
        </button>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
          Loading timeline...
        </div>
      ) : null}

      {!loading && timeline.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/45">
          No application timeline events yet. Save an application change to
          create the first event.
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {timeline.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10">
                <span>{getEventIcon(item.event_type)}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>

                    {item.description ? (
                      <p className="mt-1 text-sm leading-6 text-white/50">
                        {item.description}
                      </p>
                    ) : null}

                    {item.old_value || item.new_value ? (
                      <p className="mt-2 text-xs text-white/35">
                        {item.old_value || "empty"} →{" "}
                        {item.new_value || "empty"}
                      </p>
                    ) : null}

                    {item.event_type ? (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/70">
                        {String(item.event_type).replaceAll("_", " ")}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/40">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StudentApplicationPanel;