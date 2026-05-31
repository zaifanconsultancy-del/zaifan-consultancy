import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const emptyApplicationForm = {
  country: "",
  university: "",
  program: "",
  intake: "",
  application_status: "not_started",
  offer_status: "pending",
  visa_status: "not_started",
};

function StudentApplicationPanel({ student }) {
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyApplicationForm);
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
    loadApplication();
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const buildFallback = () => ({
    country: student?.country || student?.preferred_country || "",
    university: student?.university || "",
    program: student?.program || student?.field_of_interest || "",
    intake: student?.intake || "",
    application_status: student?.application_status || "not_started",
    offer_status: student?.offer_status || "pending",
    visa_status: student?.visa_status || "not_started",
  });

  const normalizeApplication = (record) => ({
    ...emptyApplicationForm,
    ...buildFallback(),
    ...(record || {}),
  });

  const loadApplication = async () => {
    if (!studentId) {
      setApplication(null);
      setForm(emptyApplicationForm);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("student_applications")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const record = data?.[0] || null;

      safeSet(() => {
        setApplication(record);
        setForm(normalizeApplication(record));
      });
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Failed to load application.");
        setApplication(null);
        setForm(normalizeApplication(null));
      });
    } finally {
      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const saveApplication = async () => {
    if (!studentId || saving) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        student_id: studentId,
        student_type: studentType,
        country: form.country || "",
        university: form.university || "",
        program: form.program || "",
        intake: form.intake || "",
        application_status: form.application_status || "not_started",
        offer_status: form.offer_status || "pending",
        visa_status: form.visa_status || "not_started",
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
      setForm(normalizeApplication(result.data));
      setSuccessMessage("Application saved successfully.");
    } catch (error) {
      setError(error.message || "Application save failed.");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          University Application Tracker
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Student Journey Management
        </h2>

        <p className="mt-2 text-white/60">
          Connect student applications, offers, and visa progress to Supabase.
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
          Loading application...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <InputCard
              label="Country"
              value={form.country}
              disabled={saving}
              onChange={(value) => setForm({ ...form, country: value })}
            />

            <InputCard
              label="University"
              value={form.university}
              disabled={saving}
              onChange={(value) => setForm({ ...form, university: value })}
            />

            <InputCard
              label="Program"
              value={form.program}
              disabled={saving}
              onChange={(value) => setForm({ ...form, program: value })}
            />

            <InputCard
              label="Intake"
              value={form.intake}
              disabled={saving}
              onChange={(value) => setForm({ ...form, intake: value })}
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
                setForm({ ...form, application_status: value })
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
              onChange={(value) => setForm({ ...form, offer_status: value })}
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
              onChange={(value) => setForm({ ...form, visa_status: value })}
            />
          </div>

          <button
            type="button"
            onClick={saveApplication}
            disabled={saving}
            className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving Application..." : "Save Application"}
          </button>
        </>
      )}
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

export default StudentApplicationPanel;