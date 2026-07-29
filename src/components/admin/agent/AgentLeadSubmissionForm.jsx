import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Globe2,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  SearchCheck,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const COUNTRIES = [
  "Italy",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "Turkey",
  "Other",
];

const INITIAL_FORM = {
  agentName: "",
  agentEmail: "",
  studentName: "",
  studentEmail: "",
  studentPhone: "",
  country: "Italy",
  course: "",
  intake: "",
  notes: "",
};

function clean(value) {
  return String(value || "").trim();
}

function lower(value) {
  return clean(value).toLowerCase();
}

function validEmail(value) {
  const email = clean(value);
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalisePhone(value) {
  return clean(value).replace(/[^\d+]/g, "");
}

function FieldShell({
  label,
  required = false,
  icon: Icon,
  helper,
  children,
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon ? (
            <Icon size={14} className="text-[#123865]" />
          ) : null}

          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
            {label}
          </span>
        </div>

        {required ? (
          <span className="rounded-full border-2 border-[#F97316] bg-[#FFF4E8] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.07em] text-orange-700">
            Required
          </span>
        ) : null}
      </div>

      {children}

      {helper ? (
        <p className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-500">
          {helper}
        </p>
      ) : null}
    </label>
  );
}

function StatusBanner({ status }) {
  if (!status) return null;

  const error = status.type === "error";
  const success = status.type === "success";
  const warning = status.type === "warning";

  return (
    <div
      className={`flex items-start gap-3 rounded-[1.25rem] border-[3px] p-4 ${
        error
          ? "border-[#FB7185] bg-[#FFF4F4]"
          : success
            ? "border-[#34D399] bg-[#F0FFF8]"
            : warning
              ? "border-[#F59E0B] bg-[#FFF8E8]"
              : "border-[#60A5FA] bg-[#F2F7FF]"
      }`}
    >
      {error || warning ? (
        <AlertTriangle
          size={18}
          className={`mt-0.5 shrink-0 ${
            error ? "text-red-700" : "text-amber-700"
          }`}
        />
      ) : success ? (
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0 text-emerald-700"
        />
      ) : (
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-blue-700"
        />
      )}

      <div>
        <p className="font-black text-[#10233F]">
          {status.title ||
            (error
              ? "Submission needs attention"
              : "Submission status")}
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          {status.message}
        </p>
      </div>
    </div>
  );
}

function IntegrityCard({
  label,
  title,
  helper,
  tone = "blue",
  icon: Icon,
}) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <article
      className={`rounded-[1.35rem] border-[3px] p-4 ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
          {Icon ? <Icon size={16} /> : null}
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {label}
          </p>

          <p className="mt-1 font-black text-[#10233F]">
            {title}
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function AgentLeadSubmissionForm({
  adminProfile,
  onSubmitLead,
  onCheckDuplicate,
  existingStudents = [],
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] =
    useState(false);
  const [duplicateState, setDuplicateState] =
    useState(null);

  const requiredComplete = useMemo(
    () =>
      Boolean(
        clean(form.agentName) &&
          clean(form.studentName) &&
          clean(form.studentPhone)
      ),
    [
      form.agentName,
      form.studentName,
      form.studentPhone,
    ]
  );

  const emailState = useMemo(
    () => ({
      agent: validEmail(form.agentEmail),
      student: validEmail(form.studentEmail),
    }),
    [form.agentEmail, form.studentEmail]
  );

  const localDuplicate = useMemo(() => {
    const phone = normalisePhone(form.studentPhone);
    const email = lower(form.studentEmail);

    if (!phone && !email) return null;

    const match = existingStudents.find((student) => {
      const studentPhone = normalisePhone(
        student.phone ||
          student.mobile ||
          student.whatsapp ||
          student.student_phone ||
          student.studentPhone
      );

      const studentEmail = lower(
        student.email ||
          student.student_email ||
          student.studentEmail
      );

      return (
        (phone && studentPhone && phone === studentPhone) ||
        (email && studentEmail && email === studentEmail)
      );
    });

    return match || null;
  }, [
    existingStudents,
    form.studentPhone,
    form.studentEmail,
  ]);

  function updateField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    if (
      key === "studentPhone" ||
      key === "studentEmail" ||
      key === "studentName"
    ) {
      setDuplicateState(null);
    }

    if (status) setStatus(null);
  }

  async function checkDuplicate() {
    const phone = normalisePhone(form.studentPhone);
    const email = clean(form.studentEmail);

    if (!phone && !email) {
      setDuplicateState({
        type: "warning",
        title: "Add a student contact first",
        message:
          "Enter the student's phone/WhatsApp or email before running a duplicate check.",
      });
      return;
    }

    if (localDuplicate) {
      setDuplicateState({
        type: "warning",
        title: "Possible existing student",
        message:
          "A current Agent Operations student record already matches this phone or email. Review the existing record before creating another lead.",
      });
      return;
    }

    if (typeof onCheckDuplicate !== "function") {
      setDuplicateState({
        type: "info",
        title: "Local check passed",
        message:
          "No duplicate was found in the records supplied to this form. A backend-wide duplicate check is not connected yet.",
      });
      return;
    }

    try {
      setCheckingDuplicate(true);
      setDuplicateState(null);

      const result = await onCheckDuplicate({
        student_name: clean(form.studentName) || null,
        student_email: email || null,
        student_phone: phone || null,
      });

      if (result?.error) {
        throw result.error;
      }

      const duplicate =
        Boolean(result?.duplicate) ||
        Boolean(result?.exists) ||
        Boolean(result?.match);

      setDuplicateState(
        duplicate
          ? {
              type: "warning",
              title: "Possible duplicate found",
              message:
                result?.message ||
                "The connected duplicate-check workflow found a matching student. Review that record before submitting a new lead.",
            }
          : {
              type: "success",
              title: "No duplicate found",
              message:
                result?.message ||
                "The connected duplicate-check workflow found no matching student.",
            }
      );
    } catch (error) {
      console.error(
        "Agent lead duplicate check failed:",
        error
      );

      setDuplicateState({
        type: "error",
        title: "Duplicate check failed",
        message:
          error?.message ||
          "Zaifan could not complete the duplicate check. No lead has been submitted.",
      });
    } finally {
      setCheckingDuplicate(false);
    }
  }

  async function submitLead(event) {
    event.preventDefault();

    const agentName = clean(form.agentName);
    const agentEmail = clean(form.agentEmail);
    const studentName = clean(form.studentName);
    const studentEmail = clean(form.studentEmail);
    const studentPhone = clean(form.studentPhone);
    const country = clean(form.country);
    const course = clean(form.course);
    const intake = clean(form.intake);
    const notes = clean(form.notes);

    if (!agentName || !studentName || !studentPhone) {
      setStatus({
        type: "error",
        title: "Required information is missing",
        message:
          "Agent name, student name and student phone/WhatsApp are required before this lead can be submitted.",
      });
      return;
    }

    if (!validEmail(agentEmail)) {
      setStatus({
        type: "error",
        title: "Agent email looks invalid",
        message:
          "Correct the agent email address or leave it blank if it is not available.",
      });
      return;
    }

    if (!validEmail(studentEmail)) {
      setStatus({
        type: "error",
        title: "Student email looks invalid",
        message:
          "Correct the student email address or leave it blank if it is not available.",
      });
      return;
    }

    if (localDuplicate) {
      setStatus({
        type: "warning",
        title: "Possible duplicate student",
        message:
          "A supplied Agent Operations record already matches this student's phone or email. Review the existing student before submitting another lead.",
      });
      return;
    }

    if (duplicateState?.type === "warning") {
      setStatus({
        type: "warning",
        title: "Duplicate review required",
        message:
          "The latest duplicate check raised a possible match. Resolve it before creating a new agent lead.",
      });
      return;
    }

    const payload = {
      agent_name: agentName,
      agent_email: agentEmail || null,
      student_name: studentName,
      student_email: studentEmail || null,
      student_phone: studentPhone,
      destination_country: country || null,
      preferred_course: course || null,
      preferred_intake: intake || null,
      notes: notes || null,

      source: "agent_portal",
      source_channel: "agent_operations",
      attribution_status: "agent_supplied",

      submitted_by: adminProfile?.email || null,
      submitted_at: new Date().toISOString(),
    };

    if (typeof onSubmitLead !== "function") {
      setStatus({
        type: "info",
        title: "Backend submission is not connected yet",
        message:
          "The lead has been validated in the interface, but Zaifan will not pretend it was saved. Connect a real backend insert handler through onSubmitLead before enabling live capture.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);

      const result = await onSubmitLead(payload);

      if (result?.error) {
        throw result.error;
      }

      setStatus({
        type: "success",
        title: "Agent lead submitted",
        message:
          "The connected backend confirmed the student lead was accepted.",
      });

      setForm((previous) => ({
        ...INITIAL_FORM,
        agentName: previous.agentName,
        agentEmail: previous.agentEmail,
      }));

      setDuplicateState(null);
    } catch (error) {
      console.error(
        "Agent lead submission failed:",
        error
      );

      setStatus({
        type: "error",
        title: "Lead submission failed",
        message:
          error?.message ||
          "Zaifan could not save this lead. The form has been preserved so you can retry without retyping the student details.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

  const duplicateWarning =
    Boolean(localDuplicate) ||
    duplicateState?.type === "warning";

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Send size={12} />
            Agent Lead Submission
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Submit Agent Student
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Controlled entry point for an agent-referred student. Capture the
            source identity, validate contact data, check for duplicate risk and
            only show a successful submission after the connected backend
            confirms the save.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Submission Readiness
          </p>

          <p className="mt-2 text-3xl font-black">
            {!requiredComplete
              ? "Incomplete"
              : duplicateWarning
                ? "Review"
                : "Ready"}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {!requiredComplete
              ? "Agent name, student name and student phone/WhatsApp are mandatory."
              : duplicateWarning
                ? "Required fields are complete, but duplicate attribution needs review."
                : "Required fields are complete and no current duplicate warning is active."}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Backend-confirmed submission only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <StatusBanner status={status} />

        <div className="grid gap-3 lg:grid-cols-3">
          <IntegrityCard
            label="Attribution"
            title="Agent source captured first"
            helper="Agent identity stays attached to the lead so attribution does not need to be guessed later."
            tone="green"
            icon={BadgeCheck}
          />

          <IntegrityCard
            label="Duplicate Safety"
            title="Contact evidence checked before save"
            helper="Phone/email can be checked against supplied student records and an optional backend duplicate workflow."
            tone="blue"
            icon={SearchCheck}
          />

          <IntegrityCard
            label="Save Integrity"
            title="No fake success message"
            helper="The interface only says submitted after onSubmitLead confirms the backend workflow."
            tone="amber"
            icon={ShieldCheck}
          />
        </div>

        <form
          onSubmit={submitLead}
          className="space-y-5"
        >
          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Agent Identity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Record who is submitting or referring this student.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FieldShell
                label="Agent Name"
                required
                icon={UserRound}
                helper="Use the agent/account identity used by your operational records."
              >
                <input
                  value={form.agentName}
                  onChange={(event) =>
                    updateField(
                      "agentName",
                      event.target.value
                    )
                  }
                  placeholder="Agent full name / recorded identity"
                  className={inputClass}
                  autoComplete="name"
                  disabled={submitting}
                />
              </FieldShell>

              <FieldShell
                label="Agent Email"
                icon={Mail}
                helper={
                  !emailState.agent
                    ? "This email format looks invalid."
                    : "Optional, but useful for reconciling the source to a confirmed agent account."
                }
              >
                <input
                  type="email"
                  value={form.agentEmail}
                  onChange={(event) =>
                    updateField(
                      "agentEmail",
                      event.target.value
                    )
                  }
                  placeholder="agent@example.com"
                  className={`${inputClass} ${
                    !emailState.agent
                      ? "border-[#FB7185] focus:border-[#FB7185] focus:ring-red-100"
                      : ""
                  }`}
                  autoComplete="email"
                  disabled={submitting}
                />
              </FieldShell>
            </div>
          </section>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                  Student Identity
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Capture enough contact evidence to prevent duplicate student
                  records.
                </p>
              </div>

              <button
                type="button"
                onClick={checkDuplicate}
                disabled={
                  submitting || checkingDuplicate
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingDuplicate ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <SearchCheck size={14} />
                )}
                {checkingDuplicate
                  ? "Checking..."
                  : "Check Duplicate"}
              </button>
            </div>

            {duplicateState ? (
              <div className="mb-4">
                <StatusBanner status={duplicateState} />
              </div>
            ) : localDuplicate ? (
              <div className="mb-4">
                <StatusBanner
                  status={{
                    type: "warning",
                    title: "Possible local duplicate",
                    message:
                      "A supplied student record already matches this phone or email. Review it before creating another lead.",
                  }}
                />
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <FieldShell
                label="Student Full Name"
                required
                icon={UserRound}
              >
                <input
                  value={form.studentName}
                  onChange={(event) =>
                    updateField(
                      "studentName",
                      event.target.value
                    )
                  }
                  placeholder="Student full name"
                  className={inputClass}
                  autoComplete="name"
                  disabled={submitting}
                />
              </FieldShell>

              <FieldShell
                label="Student Phone / WhatsApp"
                required
                icon={Phone}
                helper="Primary duplicate and follow-up contact."
              >
                <input
                  value={form.studentPhone}
                  onChange={(event) =>
                    updateField(
                      "studentPhone",
                      event.target.value
                    )
                  }
                  placeholder="+92..."
                  className={inputClass}
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={submitting}
                />
              </FieldShell>

              <FieldShell
                label="Student Email"
                icon={Mail}
                helper={
                  !emailState.student
                    ? "This email format looks invalid."
                    : "Optional secondary identity and duplicate-check signal."
                }
              >
                <input
                  type="email"
                  value={form.studentEmail}
                  onChange={(event) =>
                    updateField(
                      "studentEmail",
                      event.target.value
                    )
                  }
                  placeholder="student@example.com"
                  className={`${inputClass} ${
                    !emailState.student
                      ? "border-[#FB7185] focus:border-[#FB7185] focus:ring-red-100"
                      : ""
                  }`}
                  autoComplete="email"
                  disabled={submitting}
                />
              </FieldShell>

              <FieldShell
                label="Destination Country"
                icon={Globe2}
              >
                <select
                  value={form.country}
                  onChange={(event) =>
                    updateField(
                      "country",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  disabled={submitting}
                >
                  {COUNTRIES.map((country) => (
                    <option
                      key={country}
                      value={country}
                    >
                      {country}
                    </option>
                  ))}
                </select>
              </FieldShell>

              <FieldShell
                label="Preferred Course"
                helper="Optional at lead stage."
              >
                <input
                  value={form.course}
                  onChange={(event) =>
                    updateField(
                      "course",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Computer Science"
                  className={inputClass}
                  disabled={submitting}
                />
              </FieldShell>

              <FieldShell
                label="Preferred Intake"
                helper="Optional. Leave blank when the student is still exploring."
              >
                <input
                  value={form.intake}
                  onChange={(event) =>
                    updateField(
                      "intake",
                      event.target.value
                    )
                  }
                  placeholder="e.g. September 2027"
                  className={inputClass}
                  disabled={submitting}
                />
              </FieldShell>
            </div>
          </section>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <FieldShell
              label="Agent Notes"
              icon={MessageSquareText}
              helper="Qualification, budget, urgency, document status or anything the Zaifan team should know."
            >
              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Agent notes, qualification, budget, documents, urgency..."
                className={`${inputClass} resize-none`}
                disabled={submitting}
              />
            </FieldShell>
          </section>

          <div className="flex flex-col gap-3 rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                Final Check
              </p>

              <p className="mt-1 text-sm font-black text-[#10233F]">
                {!requiredComplete
                  ? "Complete the required fields."
                  : duplicateWarning
                    ? "Resolve the duplicate warning before submission."
                    : "Lead is ready for backend submission."}
              </p>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !requiredComplete ||
                duplicateWarning ||
                !emailState.agent ||
                !emailState.student
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#F97316] bg-[#FF5A0A] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#D94F08] disabled:cursor-not-allowed disabled:border-[#C9D7E6] disabled:bg-slate-300 disabled:text-slate-600"
            >
              {submitting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send size={16} />
              )}

              {submitting
                ? "Submitting..."
                : "Submit Agent Lead"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
