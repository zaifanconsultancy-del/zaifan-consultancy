// VisaTrackerPanel V2 — High Contrast Admin OS Edition
// Preserves Supabase application/document loading, fallback behavior, visa status saves,
// application timeline events, parent Student OS refresh, and linked visa source logic.
// Visual layer aligned with Zaifan cream + white + navy + orange Admin OS.

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import VisaStatusTimeline from "./VisaStatusTimeline";
import VisaRequirementsCard from "./VisaRequirementsCard";

const REQUEST_TIMEOUT_MS = 30000;

function VisaTrackerPanel({
  student = {},
  sharedApplication = null,
  sharedDocuments = null,
  onSharedDataChange = null,
}) {
  const [application, setApplication] = useState(sharedApplication || student?.application || null);
  const [documents, setDocuments] = useState(Array.isArray(sharedDocuments) ? sharedDocuments : student?.documents || []);
  const [visaStatus, setVisaStatus] = useState(
    sharedApplication?.visa_status || student?.application?.visa_status || student?.visa_status || "not_started"
  );

  const [applicationLoading, setApplicationLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const applicationRequestRef = useRef(0);
  const documentsRequestRef = useRef(0);

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const studentType = student?.student_type || student?.__leadType || student?.type || "inquiry";
  const hasValidStudentId = Number.isFinite(numericStudentId);

  const loading = applicationLoading || documentsLoading;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const incomingApplication = sharedApplication || student?.application || null;
    const incomingDocuments = Array.isArray(sharedDocuments)
      ? sharedDocuments
      : Array.isArray(student?.documents)
      ? student.documents
      : [];

    setApplication(incomingApplication);
    setDocuments(incomingDocuments);
    setVisaStatus(
      incomingApplication?.visa_status || student?.visa_status || "not_started"
    );
    setError("");
    setSuccessMessage("");

    loadApplicationOnly();
    loadDocumentsOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentType, sharedApplication?.id, sharedApplication?.updated_at, sharedDocuments?.length]);

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

  const notifyParent = async (payload = {}) => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await Promise.race([
        Promise.resolve(onSharedDataChange(payload)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Parent Student OS refresh timed out.")), 12000)
        ),
      ]);
    } catch (error) {
      console.warn("Visa saved, but parent refresh did not finish:", error);
    }
  };

  const getFallbackApplication = () => ({
    student_id: numericStudentId || studentId,
    student_type: studentType,
    country: student?.country || student?.preferred_country || "",
    university: student?.university || "",
    program: student?.program || student?.field_of_interest || "",
    intake: student?.intake || "",
    source_university_id: student?.source_university_id || "",
    source_university_name: student?.source_university_name || "",
    application_status: student?.application_status || "not_started",
    offer_status: student?.offer_status || "pending",
    visa_status:
      student?.application?.visa_status || student?.visa_status || "not_started",
  });

  const loadApplicationOnly = async () => {
    const requestId = Date.now();
    applicationRequestRef.current = requestId;

    if (!hasValidStudentId) {
      safeSet(() => {
        const fallback = student?.application || getFallbackApplication();
        setApplication(fallback);
        setVisaStatus(fallback?.visa_status || "not_started");
        setApplicationLoading(false);
      });
      return;
    }

    safeSet(() => {
      setApplicationLoading(true);
      setError("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(1),
        "Visa application loading timed out."
      );

      if (applicationRequestRef.current !== requestId) return;
      if (error) throw error;

      const latestApplication = data?.[0] || null;
      const fallback = student?.application || getFallbackApplication();
      const finalApplication = latestApplication || fallback;

      safeSet(() => {
        setApplication(finalApplication);
        setVisaStatus(
          finalApplication?.visa_status || student?.visa_status || "not_started"
        );
      });
    } catch {
      if (applicationRequestRef.current !== requestId) return;

      safeSet(() => {
        const fallback = student?.application || getFallbackApplication();
        setApplication(fallback);
        setVisaStatus(fallback?.visa_status || "not_started");
      });
    } finally {
      if (applicationRequestRef.current !== requestId) return;

      safeSet(() => {
        setApplicationLoading(false);
      });
    }
  };

  const loadDocumentsOnly = async () => {
    const requestId = Date.now();
    documentsRequestRef.current = requestId;

    if (!hasValidStudentId) {
      safeSet(() => {
        setDocuments(Array.isArray(student?.documents) ? student.documents : []);
        setDocumentsLoading(false);
      });
      return;
    }

    safeSet(() => {
      setDocumentsLoading(true);
      setError("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", numericStudentId)
          .order("created_at", { ascending: true }),
        "Visa documents loading timed out."
      );

      if (documentsRequestRef.current !== requestId) return;
      if (error) throw error;

      safeSet(() => {
        setDocuments(data || []);
      });
    } catch {
      if (documentsRequestRef.current !== requestId) return;

      safeSet(() => {
        setDocuments(Array.isArray(student?.documents) ? student.documents : []);
      });
    } finally {
      if (documentsRequestRef.current !== requestId) return;

      safeSet(() => {
        setDocumentsLoading(false);
      });
    }
  };

  const refreshVisaData = () => {
    loadApplicationOnly();
    loadDocumentsOnly();
  };

  const createVisaTimelineEvent = async ({
    applicationId = null,
    previousStatus = "",
    nextStatus = "",
  }) => {
    if (!hasValidStudentId || !nextStatus) return;

    try {
      await withTimeout(
        supabase.from("student_application_timeline").insert({
          student_id: numericStudentId,
          student_type: studentType,
          application_id: applicationId ? String(applicationId) : null,
          event_type: "visa_status_changed",
          title: "Visa Status Updated",
          description: `Visa status changed from ${
            previousStatus || "empty"
          } to ${nextStatus}.`,
          old_value: previousStatus || null,
          new_value: nextStatus || null,
        }),
        "Visa timeline event timed out."
      );
    } catch {
      // Do not block visa save because timeline failed.
    }
  };

  const updateVisaStatus = async (nextStatus) => {
    if (!hasValidStudentId || saving) return;

    const previousStatus = visaStatus;
    const previousApplication = application;

    const payload = {
      student_id: numericStudentId,
      student_type: studentType,
      country:
        application?.country ||
        student?.country ||
        student?.preferred_country ||
        "",
      university: application?.university || student?.university || "",
      program:
        application?.program ||
        student?.program ||
        student?.field_of_interest ||
        "",
      intake: application?.intake || student?.intake || "",
      source_university_id: application?.source_university_id || null,
      source_university_name: application?.source_university_name || "",
      application_status:
        application?.application_status ||
        student?.application_status ||
        "not_started",
      offer_status:
        application?.offer_status || student?.offer_status || "pending",
      visa_status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    safeSet(() => {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      setVisaStatus(nextStatus);
      setApplication((prev) => ({
        ...(prev || {}),
        ...payload,
      }));
    });

    try {
      if (application?.id) {
        const result = await withTimeout(
          supabase
            .from("student_applications")
            .update(payload)
            .eq("id", application.id)
            .select()
            .single(),
          "Visa status save timed out. Please refresh after a few seconds."
        );

        if (result.error) throw result.error;

        const savedApplication = result.data || {
          ...(application || {}),
          ...payload,
          id: application.id,
        };

        await createVisaTimelineEvent({
          applicationId: savedApplication?.id,
          previousStatus,
          nextStatus,
        });

        safeSet(() => {
          setApplication(savedApplication);
          setVisaStatus(nextStatus);
          setSuccessMessage("Visa status saved successfully.");
        });
        await notifyParent({ source: "visa_status_update", application: savedApplication });
      } else {
        const result = await withTimeout(
          supabase
            .from("student_applications")
            .insert(payload)
            .select()
            .single(),
          "Visa status create timed out. Please refresh after a few seconds."
        );

        if (result.error) throw result.error;

        await createVisaTimelineEvent({
          applicationId: result.data?.id,
          previousStatus,
          nextStatus,
        });

        safeSet(() => {
          setApplication(result.data);
          setVisaStatus(result.data?.visa_status || nextStatus);
          setSuccessMessage("Visa status saved successfully.");
        });
        await notifyParent({ source: "visa_status_create", application: result.data });
      }
    } catch (error) {
      safeSet(() => {
        setVisaStatus(previousStatus);
        setApplication(previousApplication);
        setError(error.message || "Visa status update failed.");
      });
    } finally {
      safeSet(() => {
        setSaving(false);
      });
    }
  };

  const visaOptions = [
    "not_started",
    "visa_processing",
    "biometrics",
    "medical",
    "under_review",
    "visa_approved",
    "rejected",
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-orange-200 bg-[#fff8ee] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-orange-700">
          Visa Processing
        </p>

        <h2 className="mt-2 text-2xl font-black text-[#10233f]">
          Visa Operations Center
        </h2>

        <p className="mt-2 text-slate-600">
          Track visa status, requirements, readiness, and student visa movement.
        </p>

        <button
          type="button"
          onClick={refreshVisaData}
          disabled={loading || saving}
          className="mt-4 rounded-full border border-orange-300 bg-[#fff8ee] px-4 py-2 text-xs font-bold text-orange-700 transition hover:border-cyan-400/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Visa Data"}
        </button>
      </div>

      <VisaSourceCard application={application} visaStatus={visaStatus} />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-300 bg-white p-5 text-slate-600">
          Refreshing visa data safely...
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Current Visa Status
            </p>

            <h3 className="mt-2 text-xl font-black capitalize text-[#10233f]">
              {(visaStatus || "not_started").replaceAll("_", " ")}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Application:{" "}
              {application?.application_status?.replaceAll("_", " ") ||
                "not started"}{" "}
              • Offer:{" "}
              {application?.offer_status?.replaceAll("_", " ") || "pending"}
            </p>
          </div>

          <select
            value={visaStatus || "not_started"}
            disabled={saving}
            onChange={(event) => updateVisaStatus(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visaOptions.map((item) => (
              <option key={item} value={item} className="bg-white text-[#10233f]">
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {saving ? (
          <p className="mt-3 text-sm text-orange-700">Saving visa status...</p>
        ) : null}
      </div>

      <VisaStatusTimeline status={visaStatus} />

      <VisaRequirementsCard
        student={{
          ...student,
          visa_status: visaStatus,
          application,
          documents,
        }}
      />
    </div>
  );
}

function VisaSourceCard({ application = null, visaStatus = "not_started" }) {
  const sourceUniversityName =
    application?.source_university_name || application?.university || "";
  const sourceUniversityId = application?.source_university_id || "";

  if (!application) {
    return (
      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          Visa Source
        </p>

        <h3 className="mt-2 text-lg font-black text-[#10233f]">
          No Application Linked Yet
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start or sync an application first. Visa will then read from the linked
          application record.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] border border-orange-300 bg-[#fff8ee] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
            Visa Source
          </p>

          <h3 className="mt-2 text-xl font-black text-[#10233f]">
            🔗 Linked Application & University
          </h3>

          <p className="mt-2 text-lg font-black text-orange-700">
            {sourceUniversityName || "Linked application"}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            This visa workflow is powered by the same application record used by
            the University and Application systems.
          </p>

          {sourceUniversityId ? (
            <p className="mt-3 break-all text-xs text-slate-500">
              Source University ID: {sourceUniversityId}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:min-w-[260px]">
          <VisaSourceLine label="Country" value={application?.country} />
          <VisaSourceLine label="Program" value={application?.program} />
          <VisaSourceLine label="Intake" value={application?.intake} />
          <VisaSourceLine
            label="Application"
            value={application?.application_status || "not_started"}
          />
          <VisaSourceLine
            label="Offer"
            value={application?.offer_status || "pending"}
          />
          <VisaSourceLine label="Visa" value={visaStatus || "not_started"} />
        </div>
      </div>
    </div>
  );
}

function VisaSourceLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>

      <span className="max-w-[150px] truncate text-right text-xs font-bold capitalize text-[#10233f]">
        {String(value || "Not selected").replaceAll("_", " ")}
      </span>
    </div>
  );
}

export default VisaTrackerPanel;