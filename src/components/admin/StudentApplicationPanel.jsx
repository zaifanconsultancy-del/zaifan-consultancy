// StudentApplicationPanel V2 — Application Command Center
// Preserves Supabase application loading/saving, shared Student OS synchronization,
// timeline creation/history, fallback records, readiness calculation and all status flows.
// Rebuilt as a coherent Zaifan Admin OS component rather than a dark-theme recolor.

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 30000;

const emptyApplicationForm = {
  country: "",
  university: "",
  program: "",
  intake: "",
  source_university_id: "",
  source_university_name: "",
  application_status: "not_started",
  offer_status: "pending",
  visa_status: "not_started",
  counselor_notes: "",
  university_notes: "",
  offer_notes: "",
  internal_notes: "",
};

function StudentApplicationPanel({
  student,
  sharedApplication = null,
  onSharedDataChange = null,
}) {
  const [application, setApplication] = useState(
    sharedApplication || student?.application || null
  );

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
  const studentType =
    student?.student_type || student?.__leadType || student?.type || "inquiry";
  const hasValidStudentId =
    studentId !== null &&
    studentId !== undefined &&
    String(studentId).trim() !== "";

  const getStudentIdVariants = () => {
    if (!hasValidStudentId) return [];

    const variants = [studentId, String(studentId)];

    if (Number.isFinite(numericStudentId)) {
      variants.push(numericStudentId);
    }

    return [
      ...new Set(
        variants.filter(
          (value) => value !== null && value !== undefined && value !== ""
        )
      ),
    ];
  };

  const getStudentTypeVariants = () => [
    ...new Set(
      [
        studentType,
        student?.student_type,
        student?.__leadType,
        student?.type,
        "inquiry",
        "appointment",
      ].filter(Boolean)
    ),
  ];

  const dbStudentId = Number.isFinite(numericStudentId)
    ? numericStudentId
    : studentId;

  const studentName =
    student?.full_name || student?.name || student?.student_name || "Student";

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        window.setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const buildFallback = () => ({
    country: student?.country || student?.preferred_country || "",
    university: student?.university || "",
    program: student?.program || student?.field_of_interest || "",
    intake: student?.intake || "",
    source_university_id: "",
    source_university_name: "",
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

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const incomingApplication = sharedApplication || student?.application || null;

    setApplication(incomingApplication);
    setForm(normalizeApplication(incomingApplication));
    setTimeline([]);
    setError("");
    setTimelineError("");
    setSuccessMessage("");

    loadApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (!sharedApplication) return;

    setApplication(sharedApplication);
    setForm(normalizeApplication(sharedApplication));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedApplication?.id, sharedApplication?.updated_at]);

  const sourceUniversityName =
    application?.source_university_name ||
    form.source_university_name ||
    "";

  const sourceUniversityId =
    application?.source_university_id || form.source_university_id || "";

  const hasApplicationSource = Boolean(sourceUniversityId || sourceUniversityName);

  const timelineStats = useMemo(() => {
    const statusEvents = timeline.filter((item) =>
      String(item.event_type || "").includes("status")
    ).length;

    const noteEvents = timeline.filter((item) =>
      String(item.event_type || "").includes("notes")
    ).length;

    const universityEvents = timeline.filter((item) =>
      [
        "university_changed",
        "program_changed",
        "country_changed",
        "intake_changed",
        "application_started_from_university",
      ].includes(item.event_type)
    ).length;

    return {
      total: timeline.length,
      statusEvents,
      noteEvents,
      universityEvents,
    };
  }, [timeline]);

  const loadApplicationRows = async ({ matchStudentType = true } = {}) => {
    const idVariants = getStudentIdVariants();
    const typeVariants = getStudentTypeVariants();

    if (!idVariants.length) return [];

    const attempts = idVariants.map((idValue) => {
      let query = supabase
        .from("student_applications")
        .select("*")
        .eq("student_id", idValue);

      if (matchStudentType && typeVariants.length > 0) {
        query = query.in("student_type", typeVariants);
      }

      return query.order("created_at", { ascending: false }).limit(3);
    });

    const results = await withTimeout(
      Promise.all(attempts),
      "Application loading timed out. Showing fallback profile data."
    );

    const firstError = results.find((result) => result.error)?.error;
    const merged = results.flatMap((result) => result.data || []);

    if (firstError && merged.length === 0) throw firstError;

    return Array.from(
      new Map(merged.map((item) => [item.id || JSON.stringify(item), item])).values()
    ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  };

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
      let records = await loadApplicationRows({ matchStudentType: true });

      if (!records.length) {
        records = await loadApplicationRows({ matchStudentType: false });
      }

      if (loadRequestRef.current !== requestId) return;

      const record = records?.[0] || null;

      safeSet(() => {
        setApplication(record);
        setForm(normalizeApplication(record));
        setError("");
      });
    } catch {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        const fallback = sharedApplication || student?.application || null;
        setApplication(fallback);
        setForm(normalizeApplication(fallback));
        setError("");
      });
    } finally {
      if (loadRequestRef.current !== requestId) return;
      safeSet(() => setLoading(false));
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
      safeSet(() => setTimelineLoading(false));
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
    if (!hasValidStudentId || !eventType || !title) return false;

    const payload = {
      student_id: dbStudentId,
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

    compare({
      field: "source_university_name",
      eventType: "application_source_changed",
      title: "Application Source Updated",
      descriptionPrefix: "Application source university",
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

    const previousApplication = application;

    const payload = {
      student_id: dbStudentId,
      student_type: studentType,
      country: form.country || "",
      university: form.university || "",
      program: form.program || "",
      intake: form.intake || "",
      source_university_id: form.source_university_id || application?.source_university_id || null,
      source_university_name:
        form.source_university_name || application?.source_university_name || "",
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
            .eq("id", application.id)
            .select()
            .single(),
          "Application save timed out. Please refresh after a few seconds."
        );

        if (result.error) throw result.error;
        savedApplication = result.data || { ...application, ...payload };
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
      }

      safeSet(() => {
        setApplication(savedApplication);
        setForm(normalizeApplication(savedApplication));
        setSuccessMessage("Application saved successfully.");
      });

      if (typeof onSharedDataChange === "function") {
        try {
          await withTimeout(
            Promise.resolve(onSharedDataChange(savedApplication)),
            "Student OS refresh after application save timed out. Local application was still saved."
          );
        } catch (refreshError) {
          console.warn("Application saved, but Student OS refresh failed:", refreshError);
        }
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
        const changeEvents = buildChangeEvents(
          previousApplication,
          savedApplication,
          applicationId
        );

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
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Application save failed.");
      });
    } finally {
      safeSet(() => setSaving(false));
    }
  };

  const statusStyle = (value) => {
    const styles = {
      not_started: "border-slate-300 bg-slate-50 text-slate-700",
      pending: "border-amber-300 bg-amber-50 text-amber-800",
      documents_pending:
        "border-amber-300 bg-amber-50 text-amber-800",
      documents_received:
        "border-blue-300 bg-blue-50 text-blue-800",
      applied: "border-violet-300 bg-violet-50 text-violet-800",
      under_review: "border-sky-300 bg-sky-50 text-sky-800",
      offer_received:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
      offer_accepted:
        "border-orange-300 bg-orange-50 text-orange-800",
      visa_processing: "border-sky-300 bg-sky-50 text-sky-800",
      biometrics: "border-blue-300 bg-blue-50 text-blue-800",
      medical: "border-violet-300 bg-violet-50 text-violet-800",
      visa_approved: "border-green-300 bg-green-50 text-green-800",
      enrolled: "border-orange-400 bg-orange-100 text-orange-900",
      rejected: "border-red-300 bg-red-50 text-red-800",
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
      <div className="relative overflow-hidden rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-[#10233f] shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-orange-700">
              University Application Tracker
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Student Journey Management
            </h2>

            <p className="mt-2 max-w-2xl text-slate-200">
              Manage target country, university, program, offer status, visa
              progress, internal notes, and application movement history.
            </p>
          </div>

          <div className="rounded-2xl border border-[#F97316]/20 bg-black/20 p-4 text-right">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              Readiness
            </p>
            <p className="mt-1 text-2xl font-black text-[#10233f]">
              {readinessPercent}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[#F97316] transition-all duration-500"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadApplication}
            disabled={loading || saving}
            className="rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-4 py-2 text-xs font-bold text-orange-700 transition hover:border-[#F97316]/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Application"}
          </button>

          <button
            type="button"
            onClick={loadTimeline}
            disabled={timelineLoading || saving}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-[#10233f] transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {timelineLoading ? "Refreshing Timeline..." : "Refresh Timeline"}
          </button>
        </div>
      </div>

      <ApplicationSourceCard
        hasSource={hasApplicationSource}
        sourceUniversityName={sourceUniversityName}
        sourceUniversityId={sourceUniversityId}
        application={application}
        statusStyle={statusStyle}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Timeline Events" value={timelineStats.total} />
        <MiniStat label="Status Updates" value={timelineStats.statusEvents} />
        <MiniStat label="Note Updates" value={timelineStats.noteEvents} />
        <MiniStat
          label="University Changes"
          value={timelineStats.universityEvents}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {timelineError ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
          Timeline error: {timelineError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-700">
          Refreshing application data...
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <InputCard
          label="Country"
          value={form.country}
          disabled={saving}
          onChange={(value) => setForm((prev) => ({ ...prev, country: value }))}
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
          onChange={(value) => setForm((prev) => ({ ...prev, program: value }))}
        />

        <InputCard
          label="Intake"
          value={form.intake}
          disabled={saving}
          onChange={(value) => setForm((prev) => ({ ...prev, intake: value }))}
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
            "enrolled",
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

      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
          Application Notes
        </p>
        <h3 className="mt-2 text-xl font-black text-[#10233f]">
          Counselor Application Intelligence
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Store internal context for counseling, university processing, offer
          handling, and operational decision-making.
        </p>

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
        className="rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-[#10233f] shadow-[0_10px_24px_rgba(249,115,22,0.20)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
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

function ApplicationSourceCard({
  hasSource,
  sourceUniversityName,
  sourceUniversityId,
  application,
  statusStyle,
}) {
  if (!hasSource) {
    return (
      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Application Source
        </p>
        <h3 className="mt-2 text-lg font-black text-[#10233f]">
          No Linked University Yet
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start an application from a university card to create a visible link
          between University OS and Application OS.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-emerald-300 bg-emerald-50 p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-800">
            Application Source
          </p>

          <h3 className="mt-2 text-xl font-black text-[#10233f]">
            🔗 Synced From University
          </h3>

          <p className="mt-2 text-lg font-bold text-emerald-900">
            {sourceUniversityName || "Linked university"}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            This application record was created or last synced from the linked
            university workflow.
          </p>

          {sourceUniversityId ? (
            <p className="mt-3 break-all text-xs text-slate-500">
              Source ID: {sourceUniversityId}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:min-w-[240px]">
          <SourceStatus
            label="Application"
            value={application?.application_status || "not_started"}
            className={statusStyle(application?.application_status)}
          />
          <SourceStatus
            label="Offer"
            value={application?.offer_status || "pending"}
            className={statusStyle(application?.offer_status)}
          />
          <SourceStatus
            label="Visa"
            value={application?.visa_status || "not_started"}
            className={statusStyle(application?.visa_status)}
          />
        </div>
      </div>
    </div>
  );
}

function SourceStatus({ label, value, className }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <span
        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}
      >
        {String(value || "").replaceAll("_", " ")}
      </span>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function InputCard({ label, value, onChange, disabled = false }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_5px_16px_rgba(15,35,63,0.03)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>

      <input
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${label}`}
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#10233f] outline-none transition placeholder:text-[#10233f]/25 focus:border-[#F97316]/40 disabled:opacity-50"
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
    <div className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>

      <textarea
        value={value || ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={6}
        className="mt-3 min-h-[150px] w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-[#10233f] outline-none transition placeholder:text-[#10233f]/25 focus:border-[#F97316]/40 disabled:opacity-50"
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
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_5px_16px_rgba(15,35,63,0.03)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
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
        className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-[#10233f] outline-none focus:border-[#F97316]/40 disabled:opacity-50"
      >
        {options.map((item) => (
          <option key={item} value={item} className="bg-white text-[#10233f]">
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
    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
            Application Timeline
          </p>
          <h3 className="mt-2 text-xl font-black text-[#10233f]">
            Application Movement History
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Automatic history for application, offer, visa, university, program,
            intake, and note changes.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-4 py-2 text-xs font-bold text-orange-700 transition hover:border-[#F97316]/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Timeline"}
        </button>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-600">
          Loading timeline...
        </div>
      ) : null}

      {!loading && timeline.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-[#fffaf2] p-5 text-sm text-slate-600">
          No application timeline events yet. Save an application change to
          create the first event.
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {timeline.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4"
          >
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F97316]/20 bg-[#F97316]/10">
                <span>{getEventIcon(item.event_type)}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#10233f]">{item.title}</p>

                    {item.description ? (
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}

                    {item.old_value || item.new_value ? (
                      <p className="mt-2 text-xs text-slate-500">
                        {item.old_value || "empty"} →{" "}
                        {item.new_value || "empty"}
                      </p>
                    ) : null}

                    {item.event_type ? (
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700/70">
                        {String(item.event_type).replaceAll("_", " ")}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-[#10233f]/40">
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