// Applications + visa: one card per university, with plain-word status and the
// dates that matter.

import { CalendarDays, GraduationCap, Stamp } from "lucide-react";

import { fmtDate, fmtMoney, humanize } from "../../admin/lib/format";
import { Card, EmptyState, PageHeader } from "../../admin/ui/kit";
import { StatusChip } from "../../admin/pages/person/shared";

const has = (value) => value !== null && value !== undefined && value !== "";

function Fact({ label, value }) {
  if (!has(value)) return null;
  return (
    <div className="rounded-2xl bg-[#fff7ed] px-3.5 py-2.5">
      <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-[#071f50]/45">{label}</p>
      <p className="mt-0.5 text-[14px] font-extrabold leading-5">{value}</p>
    </div>
  );
}

export default function ApplicationsTab({ file }) {
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Applications" title="Your universities and visa" subtitle="Your counselor updates this page whenever something changes." />

      {file.applications.length ? (
        <div className="space-y-3">
          {file.applications.map((app) => (
            <Card key={app.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#071f50] text-white">
                    <GraduationCap size={20} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[16.5px] font-black leading-6">{app.university || "University to be confirmed"}</h2>
                    <p className="text-[13.5px] font-semibold text-[#071f50]/60">{[app.program, app.country, app.intake ? `${app.intake} intake` : ""].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {has(app.application_status) ? <StatusChip status={app.application_status} /> : null}
                  {has(app.offer_status) && !["none", "not_started", "pending"].includes(String(app.offer_status).toLowerCase()) ? <StatusChip status={app.offer_status} /> : null}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label="Apply before" value={app.submission_deadline && !app.submitted_at ? fmtDate(app.submission_deadline) : null} />
                <Fact label="Application sent" value={app.submitted_at ? fmtDate(app.submitted_at) : null} />
                <Fact label="Offer received" value={app.offer_received_at ? fmtDate(app.offer_received_at) : null} />
                <Fact label="Accept offer before" value={app.offer_acceptance_deadline ? fmtDate(app.offer_acceptance_deadline) : null} />
                <Fact
                  label="Deposit to the university"
                  value={app.deposit_required ? `${has(app.deposit_amount) ? fmtMoney(app.deposit_amount, app.deposit_currency || "EUR") : "Required"}${app.deposit_paid ? " · paid" : app.deposit_deadline ? ` · before ${fmtDate(app.deposit_deadline)}` : ""}` : null}
                />
                <Fact
                  label="Scholarship"
                  value={has(app.scholarship_status) && !["none", "not_applied"].includes(String(app.scholarship_status).toLowerCase()) ? `${humanize(app.scholarship_status)}${has(app.scholarship_amount) ? ` · ${fmtMoney(app.scholarship_amount, app.scholarship_currency || "EUR")}` : ""}` : null}
                />
              </div>

              {app.conditional_offer && app.conditions_text ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] font-semibold leading-5 text-amber-900">
                  <strong>Your offer has conditions:</strong> {app.conditions_text}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={GraduationCap} title="No applications yet" text="Once you and your counselor choose universities, each application will appear here with its status." />
        </Card>
      )}

      {file.visas.map((visa) => (
        <Card key={visa.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff4b12] text-white">
                <Stamp size={20} />
              </span>
              <div>
                <h2 className="text-[16.5px] font-black leading-6">{visa.case_name || `${visa.country || "Student"} visa`}</h2>
                <p className="text-[13.5px] font-semibold text-[#071f50]/60">{[visa.embassy_or_consulate, visa.visa_center].filter(Boolean).join(" · ") || "Visa file"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {has(visa.visa_stage) ? <StatusChip status={visa.visa_stage} /> : null}
              {has(visa.visa_status) && visa.visa_status !== visa.visa_stage ? <StatusChip status={visa.visa_status} /> : null}
            </div>
          </div>

          {visa.appointment_date ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#071f50] px-4 py-3.5 text-white">
              <CalendarDays size={20} className="shrink-0 text-[#ff8a5c]" />
              <div>
                <p className="text-[14.5px] font-black">
                  Appointment: {fmtDate(visa.appointment_date)}
                  {visa.appointment_time ? ` at ${String(visa.appointment_time).slice(0, 5)}` : ""}
                </p>
                {visa.appointment_location ? <p className="text-[13px] text-white/70">{visa.appointment_location}</p> : null}
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label="Fingerprints (biometrics)" value={visa.biometrics_date ? fmtDate(visa.biometrics_date) : null} />
            <Fact label="File submitted" value={visa.submitted_at ? fmtDate(visa.submitted_at) : null} />
            <Fact label="Decision" value={visa.decision_at ? fmtDate(visa.decision_at) : null} />
            <Fact label="Collect passport" value={visa.passport_collection_date ? fmtDate(visa.passport_collection_date) : null} />
            <Fact label="Visa valid" value={visa.visa_valid_from || visa.visa_valid_until ? `${visa.visa_valid_from ? fmtDate(visa.visa_valid_from) : "…"} to ${visa.visa_valid_until ? fmtDate(visa.visa_valid_until) : "…"}` : null} />
            <Fact label="Visa fee" value={has(visa.visa_fee_amount) ? `${fmtMoney(visa.visa_fee_amount, visa.visa_fee_currency || "EUR")}${visa.visa_fee_paid ? " · paid" : ""}` : null} />
          </div>

          {visa.student_notes ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-[13.5px] leading-5">{visa.student_notes}</p> : null}
        </Card>
      ))}
    </div>
  );
}
