// Visa: one case per country/university. Appointment, file, decision.

import { useState } from "react";
import { Plus, Stamp } from "lucide-react";

import { useAdminData } from "../../data/AdminDataProvider";
import { dueLabel, fmtDate, fmtMoney } from "../../lib/format";
import { Button, Card, CardHeader, Drawer, EmptyState, Field, FormRow, Input, Select, Textarea, useForm, useToast } from "../../ui/kit";
import { DetailLine, numberOrNull, orNull, StatusChip, toInputDate } from "./shared";

const VISA_STATUSES = [
  ["not_started", "Not started"],
  ["preparing", "Preparing the file"],
  ["appointment_booked", "Appointment booked"],
  ["submitted", "Submitted to embassy"],
  ["decision_pending", "Waiting for decision"],
  ["granted", "Visa granted"],
  ["refused", "Refused"],
];

const SIMPLE = [
  ["", "—"],
  ["pending", "Pending"],
  ["ready", "Ready"],
  ["submitted", "Submitted"],
];

export default function VisaTab({ person }) {
  const { insert, update, logEvent } = useAdminData();
  const toast = useToast();
  const [editing, setEditing] = useState(null);

  const save = async (form) => {
    const payload = {
      country: orNull(form.country),
      source_university_name: orNull(form.university),
      case_name: orNull(form.case_name) || `${form.country || "Visa"} student visa`,
      visa_status: form.visa_status,
      visa_stage: form.visa_status,
      visa_center: orNull(form.visa_center),
      embassy_or_consulate: orNull(form.embassy_or_consulate),
      appointment_reference: orNull(form.appointment_reference),
      appointment_date: orNull(form.appointment_date),
      appointment_time: orNull(form.appointment_time),
      appointment_location: orNull(form.appointment_location),
      biometrics_date: orNull(form.biometrics_date),
      medical_date: orNull(form.medical_date),
      submitted_at: form.submitted_at ? new Date(form.submitted_at).toISOString() : null,
      decision_at: form.decision_at ? new Date(form.decision_at).toISOString() : null,
      visa_valid_from: orNull(form.visa_valid_from),
      visa_valid_until: orNull(form.visa_valid_until),
      required_funds: numberOrNull(form.required_funds),
      available_funds: numberOrNull(form.available_funds),
      funds_currency: form.funds_currency || "EUR",
      sponsor_name: orNull(form.sponsor_name),
      sponsor_relationship: orNull(form.sponsor_relationship),
      financial_evidence_status: orNull(form.financial_evidence_status),
      accommodation_status: orNull(form.accommodation_status),
      insurance_status: orNull(form.insurance_status),
      previous_refusal: form.previous_refusal === "true",
      refusal_reason: orNull(form.refusal_reason),
      next_action: orNull(form.next_action),
      next_action_due: orNull(form.next_action_due),
      internal_notes: orNull(form.internal_notes),
      student_notes: orNull(form.student_notes),
    };
    if (editing?.id) {
      await update("visas", editing.id, payload);
      if (editing.visa_status !== payload.visa_status) {
        await logEvent(person, { actionType: "visa_updated", title: `Visa: ${VISA_STATUSES.find(([id]) => id === payload.visa_status)?.[1]}` });
      }
      toast.push("Visa case updated.");
    } else {
      await insert("visas", {
        ...payload,
        student_id: person.primary.student_id,
        student_type: person.primary.student_type,
        application_id: person.applications[0]?.id || null,
      });
      await logEvent(person, { actionType: "visa_created", title: `Visa case opened: ${payload.case_name}` });
      toast.push("Visa case added.");
    }
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Card className="pb-4">
        <CardHeader
          icon={Stamp}
          title="Visa cases"
          subtitle="Appointment, documents, money proof and the decision."
          action={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})} disabled={!person.primary}>
              Open visa case
            </Button>
          }
        />
        <div className="mt-3 grid gap-3 px-5 lg:grid-cols-2">
          {person.visas.map((visa) => (
            <button
              key={visa.id}
              type="button"
              onClick={() => setEditing(visa)}
              className="flex flex-col rounded-2xl border border-[#071f50]/8 p-4 text-left transition hover:border-[#071f50]/25 hover:shadow-[0_8px_20px_rgba(7,31,80,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-black text-[#071f50]">{visa.case_name || `${visa.country} visa`}</p>
                  <p className="text-[13px] font-semibold text-[#071f50]/60">{[visa.country, visa.source_university_name].filter(Boolean).join(" · ")}</p>
                </div>
                <StatusChip status={visa.visa_status} label={VISA_STATUSES.find(([id]) => id === visa.visa_status)?.[1]} />
              </div>
              <div className="mt-3 space-y-0.5">
                <DetailLine label="Appointment" value={visa.appointment_date ? `${fmtDate(visa.appointment_date)}${visa.appointment_time ? ` ${String(visa.appointment_time).slice(0, 5)}` : ""} · ${dueLabel(visa.appointment_date)}${visa.visa_center ? ` · ${visa.visa_center}` : ""}` : null} />
                <DetailLine label="Biometrics" value={visa.biometrics_date ? fmtDate(visa.biometrics_date) : null} />
                <DetailLine label="Submitted" value={visa.submitted_at ? fmtDate(visa.submitted_at) : null} />
                <DetailLine label="Decision" value={visa.decision_at ? fmtDate(visa.decision_at) : null} />
                <DetailLine label="Valid" value={visa.visa_valid_from ? `${fmtDate(visa.visa_valid_from)} → ${fmtDate(visa.visa_valid_until)}` : null} />
                <DetailLine label="Funds" value={visa.required_funds ? `${fmtMoney(visa.available_funds || 0, visa.funds_currency)} of ${fmtMoney(visa.required_funds, visa.funds_currency)} shown` : null} />
                <DetailLine label="Next" value={visa.next_action ? `${visa.next_action}${visa.next_action_due ? ` · ${dueLabel(visa.next_action_due)}` : ""}` : null} />
                {visa.previous_refusal ? <DetailLine label="Earlier refusal" value={visa.refusal_reason || "yes"} /> : null}
              </div>
            </button>
          ))}
        </div>
        {!person.visas.length ? <EmptyState compact icon={Stamp} title="No visa case yet" text="Open one once an offer is accepted." /> : null}
      </Card>

      <VisaDrawer key={editing?.id || (editing ? "new" : "closed")} visa={editing} person={person} onClose={() => setEditing(null)} onSave={save} />
    </div>
  );
}

function VisaDrawer({ visa, person, onClose, onSave }) {
  const open = Boolean(visa);
  const [form, set] = useForm({
    country: visa?.country || person.country || "Italy",
    university: visa?.source_university_name || person.applications[0]?.university || "",
    case_name: visa?.case_name || "",
    visa_status: visa?.visa_status || "not_started",
    visa_center: visa?.visa_center || "",
    embassy_or_consulate: visa?.embassy_or_consulate || "",
    appointment_reference: visa?.appointment_reference || "",
    appointment_date: toInputDate(visa?.appointment_date),
    appointment_time: visa?.appointment_time ? String(visa.appointment_time).slice(0, 5) : "",
    appointment_location: visa?.appointment_location || "",
    biometrics_date: toInputDate(visa?.biometrics_date),
    medical_date: toInputDate(visa?.medical_date),
    submitted_at: toInputDate(visa?.submitted_at),
    decision_at: toInputDate(visa?.decision_at),
    visa_valid_from: toInputDate(visa?.visa_valid_from),
    visa_valid_until: toInputDate(visa?.visa_valid_until),
    required_funds: visa?.required_funds ?? "",
    available_funds: visa?.available_funds ?? "",
    funds_currency: visa?.funds_currency || "EUR",
    sponsor_name: visa?.sponsor_name || "",
    sponsor_relationship: visa?.sponsor_relationship || "",
    financial_evidence_status: visa?.financial_evidence_status || "",
    accommodation_status: visa?.accommodation_status || "",
    insurance_status: visa?.insurance_status || "",
    previous_refusal: visa?.previous_refusal ? "true" : "false",
    refusal_reason: visa?.refusal_reason || "",
    next_action: visa?.next_action || "",
    next_action_due: toInputDate(visa?.next_action_due),
    internal_notes: visa?.internal_notes || "",
    student_notes: visa?.student_notes || "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onSave(form);
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={visa?.id ? "Edit visa case" : "Open visa case"}
      subtitle={person.name}
      width="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Section title="Basics">
          <FormRow>
            <Field label="Country">
              <Input value={form.country} onChange={set("country")} />
            </Field>
            <Field label="University">
              <Input value={form.university} onChange={set("university")} />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Where it stands">
              <Select value={form.visa_status} onChange={set("visa_status")}>
                {VISA_STATUSES.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Case name" hint="optional">
              <Input value={form.case_name} onChange={set("case_name")} placeholder="Italy study visa 2027" />
            </Field>
          </FormRow>
        </Section>

        <Section title="Appointment">
          <FormRow cols={3}>
            <Field label="Date">
              <Input type="date" value={form.appointment_date} onChange={set("appointment_date")} />
            </Field>
            <Field label="Time">
              <Input type="time" value={form.appointment_time} onChange={set("appointment_time")} />
            </Field>
            <Field label="Reference">
              <Input value={form.appointment_reference} onChange={set("appointment_reference")} />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Visa centre" hint="e.g. VFS Islamabad">
              <Input value={form.visa_center} onChange={set("visa_center")} />
            </Field>
            <Field label="Embassy / consulate">
              <Input value={form.embassy_or_consulate} onChange={set("embassy_or_consulate")} />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Biometrics date">
              <Input type="date" value={form.biometrics_date} onChange={set("biometrics_date")} />
            </Field>
            <Field label="Medical date">
              <Input type="date" value={form.medical_date} onChange={set("medical_date")} />
            </Field>
          </FormRow>
        </Section>

        <Section title="Money proof and file">
          <FormRow cols={3}>
            <Field label="Funds required">
              <Input type="number" min="0" value={form.required_funds} onChange={set("required_funds")} />
            </Field>
            <Field label="Funds shown">
              <Input type="number" min="0" value={form.available_funds} onChange={set("available_funds")} />
            </Field>
            <Field label="Currency">
              <Select value={form.funds_currency} onChange={set("funds_currency")}>
                {["EUR", "PKR", "USD", "GBP"].map((currency) => (
                  <option key={currency}>{currency}</option>
                ))}
              </Select>
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Sponsor name">
              <Input value={form.sponsor_name} onChange={set("sponsor_name")} />
            </Field>
            <Field label="Relationship" hint="father, uncle…">
              <Input value={form.sponsor_relationship} onChange={set("sponsor_relationship")} />
            </Field>
          </FormRow>
          <FormRow cols={3}>
            <Field label="Bank proof">
              <Select value={form.financial_evidence_status} onChange={set("financial_evidence_status")}>
                {SIMPLE.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Accommodation">
              <Select value={form.accommodation_status} onChange={set("accommodation_status")}>
                {SIMPLE.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Insurance">
              <Select value={form.insurance_status} onChange={set("insurance_status")}>
                {SIMPLE.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </FormRow>
        </Section>

        <Section title="Decision">
          <FormRow>
            <Field label="Submitted on">
              <Input type="date" value={form.submitted_at} onChange={set("submitted_at")} />
            </Field>
            <Field label="Decision on">
              <Input type="date" value={form.decision_at} onChange={set("decision_at")} />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Visa valid from">
              <Input type="date" value={form.visa_valid_from} onChange={set("visa_valid_from")} />
            </Field>
            <Field label="Visa valid until">
              <Input type="date" value={form.visa_valid_until} onChange={set("visa_valid_until")} />
            </Field>
          </FormRow>
          <FormRow>
            <Field label="Refused before?">
              <Select value={form.previous_refusal} onChange={set("previous_refusal")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </Field>
            {form.previous_refusal === "true" ? (
              <Field label="Reason given">
                <Input value={form.refusal_reason} onChange={set("refusal_reason")} />
              </Field>
            ) : null}
          </FormRow>
        </Section>

        <Section title="Next step and notes">
          <FormRow>
            <Field label="Next thing to do">
              <Input value={form.next_action} onChange={set("next_action")} placeholder="Book VFS appointment" />
            </Field>
            <Field label="By when">
              <Input type="date" value={form.next_action_due} onChange={set("next_action_due")} />
            </Field>
          </FormRow>
          <Field label="Note for the student" hint="they see this">
            <Textarea value={form.student_notes} onChange={set("student_notes")} rows={2} />
          </Field>
          <Field label="Team-only notes">
            <Textarea value={form.internal_notes} onChange={set("internal_notes")} rows={2} />
          </Field>
        </Section>
      </div>
    </Drawer>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#071f50]/8 bg-white p-4">
      <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#071f50]/50">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
