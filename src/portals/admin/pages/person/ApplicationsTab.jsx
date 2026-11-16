// Applications: each university they applied to, plus the shortlist.

import { useState } from "react";
import { ExternalLink, GraduationCap, ListChecks, Plus } from "lucide-react";

import { useAdminData } from "../../data/AdminDataProvider";
import { dueLabel, fmtDate, fmtMoney, humanize } from "../../lib/format";
import { Button, Card, CardHeader, Drawer, EmptyState, Field, FormRow, Input, Select, Textarea, useConfirm, useForm, useToast } from "../../ui/kit";
import { DetailLine, numberOrNull, orNull, StatusChip, toInputDate } from "./shared";

const APPLICATION_STATUSES = [
  ["planning", "Planning"],
  ["preparing", "Preparing documents"],
  ["submitted", "Submitted"],
  ["under_review", "University reviewing"],
  ["enrolled", "Enrolled"],
  ["rejected", "Rejected by university"],
  ["withdrawn", "Withdrawn"],
];

const OFFER_STATUSES = [
  ["none", "No offer yet"],
  ["waiting", "Waiting for decision"],
  ["conditional_offer", "Conditional offer"],
  ["offer_received", "Offer received"],
  ["offer_accepted", "Offer accepted"],
  ["offer_declined", "Offer declined"],
  ["rejected", "Rejected"],
];

const COUNTRIES = ["Italy", "Germany", "France", "Belgium", "Lithuania", "Hungary", "China", "Vietnam", "Malaysia", "Other"];

export default function ApplicationsTab({ person }) {
  const { insert, update, logEvent } = useAdminData();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | {} | application row

  const save = async (form) => {
    const payload = {
      country: orNull(form.country),
      university: orNull(form.university),
      source_university_name: orNull(form.university),
      program: orNull(form.program),
      intake: orNull(form.intake),
      application_status: form.application_status,
      offer_status: form.offer_status === "none" ? null : form.offer_status,
      application_stage: form.application_status,
      submission_deadline: orNull(form.submission_deadline),
      application_reference: orNull(form.application_reference),
      portal_url: orNull(form.portal_url),
      portal_username: orNull(form.portal_username),
      application_fee_required: Boolean(numberOrNull(form.application_fee_amount)),
      application_fee_amount: numberOrNull(form.application_fee_amount),
      application_fee_currency: form.application_fee_currency || "EUR",
      application_fee_paid: form.application_fee_paid === true || form.application_fee_paid === "true",
      scholarship_status: orNull(form.scholarship_status),
      next_action: orNull(form.next_action),
      next_action_due: orNull(form.next_action_due),
      counselor_notes: orNull(form.counselor_notes),
      last_updated_by: null,
    };
    if (editing?.id) {
      await update("applications", editing.id, payload);
      if (editing.application_status !== payload.application_status || (editing.offer_status || null) !== payload.offer_status) {
        await logEvent(person, {
          actionType: "application_updated",
          title: `${payload.university || "Application"}: ${humanize(payload.application_status)}${payload.offer_status ? ` · ${humanize(payload.offer_status)}` : ""}`,
        });
      }
      toast.push("Application updated.");
    } else {
      await insert("applications", {
        ...payload,
        student_id: person.primary.student_id,
        student_type: person.primary.student_type,
        application_priority: "normal",
      });
      await logEvent(person, { actionType: "application_created", title: `Application added: ${payload.university || "University TBC"}` });
      toast.push("Application added.");
    }
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <Card className="pb-4">
        <CardHeader
          icon={GraduationCap}
          title="University applications"
          subtitle="One card per university. Keep the status honest; the student sees it in their portal."
          action={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})} disabled={!person.primary}>
              Add application
            </Button>
          }
        />
        <div className="mt-3 grid gap-3 px-5 lg:grid-cols-2">
          {person.applications.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => setEditing(app)}
              className="flex flex-col rounded-2xl border border-[#071f50]/8 p-4 text-left transition hover:border-[#071f50]/25 hover:shadow-[0_8px_20px_rgba(7,31,80,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-[#071f50]">{app.university || "University TBC"}</p>
                  <p className="text-[13px] font-semibold text-[#071f50]/60">
                    {[app.program, app.country, app.intake].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <StatusChip status={app.application_status} label={APPLICATION_STATUSES.find(([id]) => id === app.application_status)?.[1]} />
                  {app.offer_status ? <StatusChip status={app.offer_status} label={OFFER_STATUSES.find(([id]) => id === app.offer_status)?.[1]} /> : null}
                </div>
              </div>
              <div className="mt-3 space-y-0.5">
                <DetailLine label="Deadline" value={app.submission_deadline ? `${fmtDate(app.submission_deadline)} (${dueLabel(app.submission_deadline)})` : null} />
                <DetailLine label="Next" value={app.next_action ? `${app.next_action}${app.next_action_due ? ` · ${dueLabel(app.next_action_due)}` : ""}` : null} />
                <DetailLine label="Reference" value={app.application_reference} />
                <DetailLine
                  label="Application fee"
                  value={app.application_fee_amount ? `${fmtMoney(app.application_fee_amount, app.application_fee_currency)} · ${app.application_fee_paid ? "paid" : "not paid"}` : null}
                />
                <DetailLine label="Scholarship" value={app.scholarship_status ? humanize(app.scholarship_status) : null} />
              </div>
              {app.portal_url ? (
                <a
                  href={app.portal_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-extrabold text-[#ff4b12] hover:underline"
                >
                  Open university portal <ExternalLink size={13} />
                </a>
              ) : null}
            </button>
          ))}
        </div>
        {!person.applications.length ? (
          <EmptyState compact icon={GraduationCap} title="No applications yet" text="Add one when you start preparing a university application." />
        ) : null}
      </Card>

      <ShortlistCard person={person} onApply={(uni) => setEditing({ country: uni.country, university: uni.university, program: uni.program, intake: uni.intake })} />

      <ApplicationDrawer key={editing?.id || (editing ? "new" : "closed")} application={editing} onClose={() => setEditing(null)} onSave={save} />
    </div>
  );
}

function ApplicationDrawer({ application, onClose, onSave }) {
  const open = Boolean(application);
  const [form, set] = useForm({
    country: application?.country || "Italy",
    university: application?.university || "",
    program: application?.program || "",
    intake: application?.intake || "",
    application_status: application?.application_status || "planning",
    offer_status: application?.offer_status || "none",
    submission_deadline: toInputDate(application?.submission_deadline),
    application_reference: application?.application_reference || "",
    portal_url: application?.portal_url || "",
    portal_username: application?.portal_username || "",
    application_fee_amount: application?.application_fee_amount ?? "",
    application_fee_currency: application?.application_fee_currency || "EUR",
    application_fee_paid: application?.application_fee_paid ? "true" : "false",
    scholarship_status: application?.scholarship_status || "",
    next_action: application?.next_action || "",
    next_action_due: toInputDate(application?.next_action_due),
    counselor_notes: application?.counselor_notes || "",
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
      title={application?.id ? "Edit application" : "Add application"}
      subtitle={application?.id ? application.university : "Which university, which course, where it stands."}
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
        <FormRow>
          <Field label="Country">
            <Select value={form.country} onChange={set("country")}>
              {COUNTRIES.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </Select>
          </Field>
          <Field label="Intake" hint="e.g. September 2027">
            <Input value={form.intake} onChange={set("intake")} placeholder="September 2027" />
          </Field>
        </FormRow>
        <Field label="University" required>
          <Input value={form.university} onChange={set("university")} placeholder="University of Bologna" />
        </Field>
        <Field label="Course / programme">
          <Input value={form.program} onChange={set("program")} placeholder="MSc Computer Science" />
        </Field>
        <FormRow>
          <Field label="Application status">
            <Select value={form.application_status} onChange={set("application_status")}>
              {APPLICATION_STATUSES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Offer">
            <Select value={form.offer_status} onChange={set("offer_status")}>
              {OFFER_STATUSES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Submission deadline">
            <Input type="date" value={form.submission_deadline} onChange={set("submission_deadline")} />
          </Field>
          <Field label="Reference number" hint="from the university">
            <Input value={form.application_reference} onChange={set("application_reference")} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="University portal link">
            <Input value={form.portal_url} onChange={set("portal_url")} placeholder="https://…" />
          </Field>
          <Field label="Portal username">
            <Input value={form.portal_username} onChange={set("portal_username")} />
          </Field>
        </FormRow>
        <FormRow cols={3}>
          <Field label="Application fee">
            <Input type="number" min="0" value={form.application_fee_amount} onChange={set("application_fee_amount")} placeholder="0" />
          </Field>
          <Field label="Currency">
            <Select value={form.application_fee_currency} onChange={set("application_fee_currency")}>
              {["EUR", "PKR", "USD", "GBP", "CNY"].map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fee paid?">
            <Select value={form.application_fee_paid} onChange={set("application_fee_paid")}>
              <option value="false">Not yet</option>
              <option value="true">Paid</option>
            </Select>
          </Field>
        </FormRow>
        <Field label="Scholarship" hint="optional">
          <Select value={form.scholarship_status} onChange={set("scholarship_status")}>
            <option value="">Not applied</option>
            <option value="applied">Applied</option>
            <option value="awarded">Awarded</option>
            <option value="not_awarded">Not awarded</option>
          </Select>
        </Field>
        <FormRow>
          <Field label="Next thing to do">
            <Input value={form.next_action} onChange={set("next_action")} placeholder="Upload final transcript" />
          </Field>
          <Field label="By when">
            <Input type="date" value={form.next_action_due} onChange={set("next_action_due")} />
          </Field>
        </FormRow>
        <Field label="Notes" hint="team only">
          <Textarea value={form.counselor_notes} onChange={set("counselor_notes")} rows={3} />
        </Field>
      </div>
    </Drawer>
  );
}

function ShortlistCard({ person, onApply }) {
  const { insert, remove } = useAdminData();
  const confirm = useConfirm();
  const [form, set, reset] = useForm({ university: "", country: person.country || "Italy", program: "" });
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!form.university.trim()) return;
    setBusy(true);
    try {
      await insert("universities", {
        student_id: person.primary.student_id,
        student_type: person.primary.student_type,
        university: form.university.trim(),
        country: form.country,
        program: form.program.trim() || null,
        status: "shortlisted",
      });
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="pb-4">
      <CardHeader icon={ListChecks} title="Shortlist" subtitle="Universities being considered. Turn one into an application when ready." />
      <div className="mt-3 px-5">
        <ul className="divide-y divide-[#071f50]/8">
          {person.universities.map((uni) => (
            <li key={uni.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-black text-[#071f50]">{uni.university}</p>
                <p className="text-[12.5px] font-semibold text-[#071f50]/55">{[uni.program, uni.country, uni.intake].filter(Boolean).join(" · ")}</p>
              </div>
              <Button size="sm" variant="navy" onClick={() => onApply(uni)}>
                Start application
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  const yes = await confirm({ title: `Remove ${uni.university} from the shortlist?`, confirmLabel: "Remove", danger: true });
                  if (yes) await remove("universities", uni.id);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
          <Input value={form.university} onChange={set("university")} placeholder="University name" />
          <Select value={form.country} onChange={set("country")}>
            {COUNTRIES.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </Select>
          <Input value={form.program} onChange={set("program")} placeholder="Course (optional)" />
          <Button variant="soft" busy={busy} onClick={add} disabled={!form.university.trim() || !person.primary}>
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
