import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import VisaStatusTimeline from "./VisaStatusTimeline";
import VisaRequirementsCard from "./VisaRequirementsCard";

const REQUEST_TIMEOUT_MS = 30000;

function VisaTrackerPanel({ student = {} }) {
  const [application, setApplication] = useState(student?.application || null);
  const [documents, setDocuments] = useState(student?.documents || []);
  const [visaStatus, setVisaStatus] = useState(
    student?.application?.visa_status || student?.visa_status || "not_started"
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);

  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setApplication(student?.application || null);
    setDocuments(student?.documents || []);
    setVisaStatus(
      student?.application?.visa_status || student?.visa_status || "not_started"
    );

    loadVisaData();
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

  const getFallbackApplication = () => ({
    student_id: studentId,
    student_type: studentType,
    country: student?.country || student?.preferred_country || "",
    university: student?.university || "",
    program: student?.program || student?.field_of_interest || "",
    intake: student?.intake || "",
    application_status: student?.application_status || "not_started",
    offer_status: student?.offer_status || "pending",
    visa_status:
      student?.application?.visa_status || student?.visa_status || "not_started",
  });

  const loadVisaData = async () => {
    const requestId = Date.now();
    loadRequestRef.current = requestId;

    if (!studentId) {
      safeSet(() => {
        setApplication(null);
        setDocuments([]);
        setVisaStatus("not_started");
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
      const [applicationResult, documentsResult] = await Promise.all([
        withTimeout(
          supabase
            .from("student_applications")
            .select("*")
            .eq("student_id", studentId)
            .order("created_at", { ascending: false })
            .limit(1),
          "Visa application loading timed out."
        ),

        withTimeout(
          supabase
            .from("student_documents")
            .select("*")
            .eq("student_id", studentId)
            .order("created_at", { ascending: true }),
          "Visa documents loading timed out."
        ),
      ]);

      if (loadRequestRef.current !== requestId) return;

      if (applicationResult.error) throw applicationResult.error;
      if (documentsResult.error) throw documentsResult.error;

      const latestApplication = applicationResult.data?.[0] || null;

      safeSet(() => {
        setApplication(latestApplication);
        setDocuments(documentsResult.data || []);
        setVisaStatus(
          latestApplication?.visa_status ||
            student?.visa_status ||
            "not_started"
        );
        setError("");
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        const fallback = student?.application || getFallbackApplication();

        setApplication(fallback);
        setDocuments(student?.documents || []);
        setVisaStatus(fallback?.visa_status || "not_started");
        setError("");
      });
    } finally {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const updateVisaStatus = async (nextStatus) => {
    if (!studentId || saving) return;

    const previousStatus = visaStatus;
    const previousApplication = application;

    const payload = {
      student_id: studentId,
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
            .eq("id", application.id),
          "Visa status save timed out. Please refresh after a few seconds."
        );

        if (result.error) throw result.error;

        safeSet(() => {
          setApplication((prev) => ({
            ...(prev || {}),
            ...payload,
            id: application.id,
          }));
          setVisaStatus(nextStatus);
          setSuccessMessage("Visa status saved successfully.");
        });
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

        safeSet(() => {
          setApplication(result.data);
          setVisaStatus(result.data?.visa_status || nextStatus);
          setSuccessMessage("Visa status saved successfully.");
        });
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
      <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          Visa Processing
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Visa Operations Center
        </h2>

        <p className="mt-2 text-white/60">
          Track visa status, requirements, readiness, and student visa movement.
        </p>

        <button
          type="button"
          onClick={loadVisaData}
          disabled={loading || saving}
          className="mt-4 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 transition hover:border-cyan-400/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Visa Data"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/50">
          Refreshing visa data...
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              Current Visa Status
            </p>

            <h3 className="mt-2 text-xl font-black capitalize text-white">
              {(visaStatus || "not_started").replaceAll("_", " ")}
            </h3>

            <p className="mt-2 text-sm text-white/45">
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
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {visaOptions.map((item) => (
              <option key={item} value={item} className="bg-black">
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {saving ? (
          <p className="mt-3 text-sm text-cyan-300">Saving visa status...</p>
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

export default VisaTrackerPanel;