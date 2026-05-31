import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import VisaStatusTimeline from "./VisaStatusTimeline";
import VisaRequirementsCard from "./VisaRequirementsCard";

function VisaTrackerPanel({ student = {} }) {
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [visaStatus, setVisaStatus] = useState(
    student?.visa_status || "not_started"
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadVisaData();
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const loadVisaData = async () => {
    if (!studentId) {
      setApplication(null);
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [applicationResult, documentsResult] = await Promise.all([
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: true }),
      ]);

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
      });
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Failed to load visa data.");
        setApplication(null);
        setDocuments([]);
        setVisaStatus(student?.visa_status || "not_started");
      });
    } finally {
      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const updateVisaStatus = async (nextStatus) => {
    if (!studentId || saving) return;

    const previousStatus = visaStatus;

    setSaving(true);
    setError("");
    setSuccessMessage("");
    setVisaStatus(nextStatus);

    try {
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

      const result = application?.id
        ? await supabase
            .from("student_applications")
            .update(payload)
            .eq("id", application.id)
            .select()
            .single()
        : await supabase
            .from("student_applications")
            .insert(payload)
            .select()
            .single();

      if (result.error) throw result.error;

      setApplication(result.data);
      setVisaStatus(result.data?.visa_status || nextStatus);
      setSuccessMessage("Visa status saved successfully.");
    } catch (error) {
      setVisaStatus(previousStatus);
      setError(error.message || "Visa status update failed.");
    } finally {
      setSaving(false);
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
          Loading visa data...
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