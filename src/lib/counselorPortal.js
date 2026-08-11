// counselorPortal FINANCE LEDGER RECONCILIATION FIX V3 — linked payments only reduce invoices
// counselorPortal FINANCE + VISA OS INTEGRATION V5 — assigned-student Finance visibility + identity bridge + persistent follow-up support
// Full replacement for: src/lib/counselorPortal.js
// Adds assigned-scope Visa snapshot data, Visa queue intelligence, navigation/metrics and counselor Visa audit events.
import { supabase } from "./supabaseClient";

const COUNSELOR_TABLES = {
  students: "students",
  inquiries: "inquiries",
  appointments: "appointments",
  applications: "student_applications",
  universities: "student_universities",
  universityRequirements: "student_university_requirements",
  universityEvents: "student_university_events",
  visas: "student_visas",
  visaRequirements: "student_visa_requirements",
  visaEvents: "student_visa_events",
  invoices: "student_invoices",
  payments: "student_payments",
  receipts: "student_receipts",
  paymentRequests: "counselor_payment_requests",
  paymentAccounts: "payment_accounts",
  documents: "student_documents",
  tasks: "student_tasks",
  support: "student_support_requests",
  supportMessages: "student_support_messages",
  portalAccounts: "student_portal_accounts",
  communications: "student_communications",
  timeline: "student_timeline",
};

const CLOSED_STATUSES = new Set([
  "done",
  "completed",
  "complete",
  "closed",
  "resolved",
  "approved",
  "verified",
  "accepted",
  "paid",
  "inactive",
  "cancelled",
  "canceled",
]);

const URGENT_WORDS = [
  "urgent",
  "overdue",
  "deadline",
  "missing",
  "rejected",
  "failed",
  "expired",
  "blocked",
  "stuck",
  "pending",
  "delay",
  "delayed",
  "issue",
  "problem",
];

const JOURNEY_STAGE_ORDER = [
  "Not Started",
  "Counseling",
  "Shortlisting",
  "Application Started",
  "Application Submitted",
  "Application Under Review",
  "Offer Received",
  "Offer Accepted",
  "CAS Pending",
  "CAS Issued",
  "Visa Pending",
  "Visa Approved",
  "Enrolled",
];

const nowIso = () => new Date().toISOString();

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const lower = (value) => safeString(value).trim().toLowerCase();

const clamp = (value, min = 0, max = 100) => {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  return Math.max(min, Math.min(max, numeric));
};

const pickFirst = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

const uniqueBy = (items = [], keyFactory) => {
  const seen = new Set();

  return safeArray(items).filter((item) => {
    const key = keyFactory(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const newestFirst = (items = []) =>
  [...safeArray(items)].sort((a, b) => {
    const aTime = new Date(
      a.updated_at || a.created_at || a.due_date || a.due_at || 0
    ).getTime();

    const bTime = new Date(
      b.updated_at || b.created_at || b.due_date || b.due_at || 0
    ).getTime();

    return bTime - aTime;
  });

const isClosedStatus = (status) => CLOSED_STATUSES.has(lower(status));

const containsUrgentWord = (...values) => {
  const text = values.map((value) => lower(value)).join(" ");
  return URGENT_WORDS.some((word) => text.includes(word));
};

const buildRecordId = (record = {}, prefix = "record") =>
  pickFirst(
    record.id,
    record.student_id,
    record.inquiry_id,
    record.appointment_id,
    record.email,
    record.student_email,
    record.phone
  ) || `${prefix}-${Math.random().toString(36).slice(2)}`;

function normalizeKey(value) {
  return safeString(value).trim().toLowerCase();
}

function hasAnyKey(record = {}, keySet = new Set()) {
  const possibleKeys = [
    record.person_id,
    record.student_id,
    record.inquiry_id,
    record.appointment_id,
    record.id,
    record.email,
    record.student_email,
    record.lead_email,
    record.phone,
    record.student_phone,
    record.mobile,
    record.whatsapp,
  ]
    .filter(Boolean)
    .map(normalizeKey);

  return possibleKeys.some((key) => keySet.has(key));
}

function buildStudentKeySet(students = []) {
  const keys = new Set();

  safeArray(students).forEach((student) => {
    [
      student.person_id,
      student.id,
      student.student_id,
      student.inquiry_id,
      student.appointment_id,
      student.email,
      student.student_email,
      student.lead_email,
      student.phone,
      student.student_phone,
      student.mobile,
      student.whatsapp,
    ]
      .filter(Boolean)
      .map(normalizeKey)
      .forEach((key) => keys.add(key));
  });

  return keys;
}

function filterToAssignedStudents(records = [], students = []) {
  const keys = buildStudentKeySet(students);
  if (!keys.size) return [];
  return safeArray(records).filter((record) => hasAnyKey(record, keys));
}

// Finance records can legitimately be created against an appointment identity while
// the Counselor assignment is stored against the canonical student/inquiry identity.
// Bridge those identities through the appointment row (email/phone/person aliases) so
// Admin Finance activity is never dropped from the assigned Counselor scope.
function financeIdentityRowsForStudent(student = {}, appointments = []) {
  const studentKeys = buildStudentKeySet([student]);
  if (!studentKeys.size) return [];

  return safeArray(appointments).filter((appointment) =>
    hasAnyKey(appointment, studentKeys)
  );
}

function financeRecordBelongsToStudentScope(
  record = {},
  student = {},
  appointments = []
) {
  if (hasAnyKey(record, buildStudentKeySet([student]))) return true;

  const recordStudentId = normalizeKey(
    pickFirst(
      record.student_id,
      record.appointment_id,
      record.inquiry_id,
      record.person_id,
      null
    )
  );

  if (!recordStudentId) return false;

  return financeIdentityRowsForStudent(student, appointments).some((appointment) => {
    const appointmentIds = [
      appointment.id,
      appointment.appointment_id,
      appointment.student_id,
      appointment.inquiry_id,
      appointment.person_id,
    ]
      .filter(Boolean)
      .map(normalizeKey);

    return appointmentIds.includes(recordStudentId);
  });
}

function filterFinanceToAssignedStudents(
  records = [],
  students = [],
  appointments = []
) {
  if (!safeArray(students).length) return [];

  return safeArray(records).filter((record) =>
    safeArray(students).some((student) =>
      financeRecordBelongsToStudentScope(record, student, appointments)
    )
  );
}

function findRelatedStudent(snapshot = {}, record = {}) {
  const recordKeys = new Set(
    [
      record.person_id,
      record.student_id,
      record.inquiry_id,
      record.appointment_id,
      record.email,
      record.student_email,
      record.lead_email,
      record.phone,
      record.student_phone,
      record.mobile,
      record.whatsapp,
    ]
      .filter(Boolean)
      .map(normalizeKey)
  );

  if (!recordKeys.size) return null;

  return (
    safeArray(snapshot.students).find((student) =>
      [
        student.person_id,
        student.id,
        student.student_id,
        student.inquiry_id,
        student.appointment_id,
        student.email,
        student.student_email,
        student.lead_email,
        student.phone,
        student.student_phone,
        student.mobile,
        student.whatsapp,
      ]
        .filter(Boolean)
        .map(normalizeKey)
        .some((key) => recordKeys.has(key))
    ) || null
  );
}

function prettifyStatus(value = "", fallback = "Not Started") {
  const clean = safeString(value || fallback)
    .replace(/[_-]+/g, " ")
    .trim();

  if (!clean) return fallback;

  return clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const INQUIRY_PIPELINE_STAGE_LABELS = Object.freeze({
  new_lead: "New Lead",
  contacted: "Contacted",
  documents_pending: "Documents Pending",
  applied: "Applied",
  offer_letter: "Offer Letter",
  visa_process: "Visa Process",
  approved: "Approved",
});

function normalizeInquiryPipelineStage(record = {}) {
  const raw = lower(
    pickFirst(
      record.pipeline_stage,
      record.inquiry_pipeline_stage,
      record.crm_pipeline_stage,
      ""
    )
  );

  if (!raw) return "";

  return INQUIRY_PIPELINE_STAGE_LABELS[raw] || prettifyStatus(raw, "");
}

function normalizeOperationalPriority(record = {}) {
  const raw = lower(
    pickFirst(
      record.priority,
      record.inquiry_priority,
      record.crm_priority,
      ""
    )
  );

  if (raw === "vip") return "VIP";
  if (["critical", "urgent", "high"].includes(raw)) return "High";
  if (raw === "medium") return "Medium";
  if (raw === "low") return "Low";

  return raw ? prettifyStatus(raw, "") : "";
}

function operationalPriorityRank(value = "") {
  const normalized = lower(value);

  if (normalized === "vip") return 4;
  if (["critical", "urgent", "high"].includes(normalized)) return 3;
  if (normalized === "medium") return 2;
  if (normalized === "low") return 1;

  return 0;
}

function identityAliases(record = {}) {
  const source = lower(
    pickFirst(
      record.source_table,
      record.record_type,
      record.student_type,
      record.source_type,
      ""
    )
  );

  const aliases = [
    record.person_id && `person:${normalizeKey(record.person_id)}`,
    record.student_id && `student:${normalizeKey(record.student_id)}`,
    record.inquiry_id && `inquiry:${normalizeKey(record.inquiry_id)}`,
    record.appointment_id && `appointment:${normalizeKey(record.appointment_id)}`,
    record.email && `email:${normalizeKey(record.email)}`,
    record.student_email && `email:${normalizeKey(record.student_email)}`,
    record.lead_email && `email:${normalizeKey(record.lead_email)}`,
    record.phone && `phone:${normalizeKey(record.phone)}`,
    record.student_phone && `phone:${normalizeKey(record.student_phone)}`,
    record.mobile && `phone:${normalizeKey(record.mobile)}`,
    record.whatsapp && `phone:${normalizeKey(record.whatsapp)}`,
  ].filter(Boolean);

  if (record.id && source.includes("inquir")) {
    aliases.push(`inquiry:${normalizeKey(record.id)}`);
  }

  if (record.id && source.includes("student")) {
    aliases.push(`student:${normalizeKey(record.id)}`);
  }

  return aliases;
}

function recordsShareIdentity(left = {}, right = {}) {
  const leftAliases = new Set(identityAliases(left));
  if (!leftAliases.size) return false;

  return identityAliases(right).some((alias) => leftAliases.has(alias));
}

function isRecordAssignedToProfile(record = {}, profile = {}) {
  const counselorIds = [
    profile.counselorId,
    profile.id,
    profile.user_id,
    profile.auth_id,
  ]
    .filter(Boolean)
    .map(normalizeKey);

  const recordIds = [
    record.assigned_counselor_id,
    record.counselor_id,
    record.assigned_to,
    record.owner_id,
  ]
    .filter(Boolean)
    .map(normalizeKey);

  if (counselorIds.some((id) => recordIds.includes(id))) return true;

  const counselorEmails = [profile.email, profile.user_email]
    .filter(Boolean)
    .map(normalizeKey);

  const recordEmails = [
    record.assigned_counselor_email,
    record.counselor_email,
    record.assigned_to_email,
  ]
    .filter(Boolean)
    .map(normalizeKey);

  return counselorEmails.some((email) => recordEmails.includes(email));
}

function mergeAssignedStudentRecords(
  students = [],
  inquiries = [],
  { includeUnmatchedInquiries = true } = {}
) {
  const inquiryRows = newestFirst(inquiries).map((inquiry) => ({
    ...inquiry,
    source_table: inquiry.source_table || "inquiries",
  }));

  const merged = safeArray(students).map((student) => {
    const studentRecord = {
      ...student,
      source_table: student.source_table || "students",
    };

    const inquiry = inquiryRows.find((row) =>
      recordsShareIdentity(studentRecord, row)
    );

    if (!inquiry) return studentRecord;

    return {
      ...studentRecord,
      person_id: pickFirst(student.person_id, inquiry.person_id, null),
      inquiry_id: pickFirst(student.inquiry_id, inquiry.inquiry_id, inquiry.id, null),
      inquiry_record_id: pickFirst(inquiry.id, inquiry.inquiry_id, null),
      pipeline_stage: pickFirst(inquiry.pipeline_stage, student.pipeline_stage, null),
      priority: pickFirst(inquiry.priority, student.priority, null),
      crm_status: pickFirst(inquiry.status, student.crm_status, null),
      inquiry_updated_at: pickFirst(
        inquiry.updated_at,
        inquiry.last_contacted_at,
        inquiry.created_at,
        null
      ),
    };
  });

  if (includeUnmatchedInquiries) {
    inquiryRows.forEach((inquiry) => {
      if (merged.some((student) => recordsShareIdentity(student, inquiry))) return;

      merged.push({
        ...inquiry,
        inquiry_id: pickFirst(inquiry.inquiry_id, inquiry.id, null),
        inquiry_record_id: pickFirst(inquiry.id, inquiry.inquiry_id, null),
      });
    });
  }

  return uniqueBy(
    merged,
    (record) =>
      pickFirst(
        record.person_id && `person:${normalizeKey(record.person_id)}`,
        record.student_id && `student:${normalizeKey(record.student_id)}`,
        record.inquiry_id && `inquiry:${normalizeKey(record.inquiry_id)}`,
        record.email && `email:${normalizeKey(record.email)}`,
        record.student_email && `email:${normalizeKey(record.student_email)}`,
        record.phone && `phone:${normalizeKey(record.phone)}`,
        record.id && `record:${normalizeKey(record.id)}`
      )
  );
}

function normalizeApplicationStage(application = {}) {
  const stage = lower(application.application_stage);
  const status = lower(application.application_status || application.status);
  const offer = lower(application.offer_status);

  if (
    stage === "enrollment" ||
    status === "enrolled" ||
    status === "enrollment_complete"
  ) {
    return {
      key: "enrollment",
      label: "Enrollment",
      progress: 100,
      meaning: "Final university enrollment or matriculation is complete.",
    };
  }

  if (
    stage === "pre_enrollment" ||
    status.includes("pre_enrollment") ||
    status.includes("pre enrolment") ||
    offer === "offer_accepted"
  ) {
    return {
      key: "pre_enrollment",
      label: "Pre-enrolment",
      progress: 83,
      meaning: "Universitaly pre-enrolment is being prepared, submitted or validated.",
    };
  }

  if (
    stage === "decision" ||
    [
      "conditional_offer",
      "offer_received",
      "admitted",
      "offer_accepted",
      "waitlisted",
      "rejected",
      "declined",
    ].includes(offer) ||
    [
      "conditional_admission",
      "offer_received",
      "admitted",
      "offer_accepted",
      "waitlisted",
      "rejected",
      "withdrawn",
    ].includes(status)
  ) {
    return {
      key: "decision",
      label: "Decision",
      progress: 67,
      meaning: "The university decision, offer or admission outcome is being managed.",
    };
  }

  if (
    stage === "university_review" ||
    status === "under_review" ||
    status === "university_review"
  ) {
    return {
      key: "university_review",
      label: "University Review",
      progress: 50,
      meaning: "The university is assessing the submitted application.",
    };
  }

  if (
    stage === "submitted" ||
    ["submitted", "applied", "application_submitted"].includes(status)
  ) {
    return {
      key: "submitted",
      label: "Submitted",
      progress: 33,
      meaning: "The application has been sent through the official university channel.",
    };
  }

  if (
    stage === "preparation" ||
    ["ready_to_submit", "documents_pending", "documents_received"].includes(status)
  ) {
    return {
      key: "preparation",
      label: "Prepare",
      progress: 17,
      meaning: "Documents, fees and submission details are being prepared.",
    };
  }

  return {
    key: "planning",
    label: "Plan",
    progress: 0,
    meaning: "University, programme, intake and application plan are being confirmed.",
  };
}

function applicationStageGuidance(application = {}, stageMeta = normalizeApplicationStage(application)) {
  const status = lower(application.application_status || application.status);
  const offer = lower(application.offer_status);

  if (stageMeta.key === "enrollment") {
    return "Confirm final enrollment evidence, arrival planning and post-arrival requirements.";
  }

  if (stageMeta.key === "pre_enrollment") {
    if (status.includes("validated")) {
      return "Pre-enrolment is validated. Confirm visa preparation and remaining arrival documents.";
    }
    if (status.includes("submitted")) {
      return "Universitaly is submitted. Monitor university validation and respond to any request.";
    }
    return "Prepare and submit Universitaly pre-enrolment with the required supporting documents.";
  }

  if (stageMeta.key === "decision") {
    if (offer === "offer_accepted" || status === "offer_accepted") {
      return "Student accepted the place. Start Universitaly pre-enrolment.";
    }
    if (offer === "admitted" || status === "admitted") {
      return "Confirm the admission letter, acceptance deadline and student decision.";
    }
    if (offer === "conditional_offer" || status.includes("conditional")) {
      return "Track every offer condition and complete the missing evidence before acceptance.";
    }
    if (offer === "waitlisted" || status === "waitlisted") {
      return "Monitor the waitlist and keep alternative applications active.";
    }
    if (offer === "rejected" || status === "rejected") {
      return "Review the decision, record the reason and move the student to the next suitable option.";
    }
    return "Review the admission decision and guide the student on the correct response.";
  }

  if (stageMeta.key === "university_review") {
    return "Monitor university review, interview, admission test and additional-document requests.";
  }

  if (stageMeta.key === "submitted") {
    return "Confirm submission reference, fee evidence and university acknowledgement.";
  }

  if (stageMeta.key === "preparation") {
    return "Clear application requirements, confirm fees and complete a final pre-submission review.";
  }

  return (
    application.next_action ||
    "Confirm the university, programme, intake, deadline and first application requirement."
  );
}

function normalizePortalAccess(account = null) {
  if (!account) {
    return {
      status: "Not Created",
      isActive: false,
      isLocked: false,
      mustChangePassword: false,
      email: "",
      lastLoginAt: null,
      passwordChangedAt: null,
    };
  }

  const rawStatus = lower(account.status);
  const isActive =
    account.is_active !== false &&
    !["inactive", "deactivated", "disabled", "suspended"].includes(rawStatus);
  const isLocked = Boolean(
    account.is_locked ||
      account.locked_at ||
      rawStatus === "locked"
  );

  return {
    status: !isActive
      ? "Inactive"
      : isLocked
        ? "Locked"
        : "Active",
    isActive,
    isLocked,
    mustChangePassword: Boolean(account.must_change_password),
    email: pickFirst(account.email, account.student_email, ""),
    lastLoginAt: pickFirst(account.last_login_at, account.last_login, null),
    passwordChangedAt: pickFirst(
      account.password_changed_at,
      account.last_password_change_at,
      null
    ),
  };
}

function cleanPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined
    )
  );
}

function localResult(table, payload = {}, extra = {}) {
  return {
    id:
      payload.id ||
      `${table}_local_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`,
    ...payload,
    ...extra,
    _local_fallback: true,
    _fallback_reason:
      "Supabase write skipped after schema-safe attempts failed.",
  };
}

async function insertWithFallback(table, attempts = [], fallbackPayload = {}) {
  const errors = [];

  for (const payload of attempts.map(cleanPayload)) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .maybeSingle();

      if (!error && data) return data;

      if (!error) return payload;

      errors.push(error.message);
      console.warn(`${table} insert attempt skipped:`, error.message, payload);
    } catch (error) {
      errors.push(error.message);
      console.warn(`${table} insert attempt failed:`, error.message, payload);
    }
  }

  console.warn(`${table} all insert attempts failed:`, errors.join(" | "));

  return localResult(table, cleanPayload(fallbackPayload), {
    _write_errors: errors,
  });
}

async function updateByIdWithFallback(table, id, attempts = [], fallbackPayload = {}) {
  const errors = [];

  for (const payload of attempts.map(cleanPayload)) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (!error && data) return data;

      if (!error) {
        return {
          id,
          ...payload,
        };
      }

      errors.push(error.message);
      console.warn(`${table} update attempt skipped:`, error.message, payload);
    } catch (error) {
      errors.push(error.message);
      console.warn(`${table} update attempt failed:`, error.message, payload);
    }
  }

  console.warn(`${table} all update attempts failed:`, errors.join(" | "));

  return localResult(table, { id, ...cleanPayload(fallbackPayload) }, {
    _write_errors: errors,
  });
}

export function normalizeCounselorProfile(profile = {}) {
  return {
    counselorId: pickFirst(
      profile.counselorId,
      profile.id,
      profile.user_id,
      profile.auth_id,
      profile.uid,
      ""
    ),
    email: pickFirst(profile.email, profile.user_email, ""),
    displayName: pickFirst(
      profile.displayName,
      profile.full_name,
      profile.name,
      profile.first_name,
      profile.email,
      "Counselor"
    ),
    role: pickFirst(profile.role, profile.user_role, "counselor"),
    avatar: pickFirst(profile.avatar, profile.avatar_url, profile.photo_url, ""),
  };
}

export function getStudentName(record = {}) {
  const fullName = pickFirst(
    record.student_name,
    record.full_name,
    record.name,
    record.lead_name,
    `${safeString(record.first_name)} ${safeString(record.last_name)}`.trim()
  );

  return (
    fullName ||
    pickFirst(record.email, record.student_email, record.phone, "Unnamed Student")
  );
}

export function getStudentEmail(record = {}) {
  return pickFirst(
    record.email,
    record.student_email,
    record.lead_email,
    record.parent_email,
    ""
  );
}

export function getStudentPhone(record = {}) {
  return pickFirst(
    record.phone,
    record.student_phone,
    record.mobile,
    record.whatsapp,
    record.contact_number,
    ""
  );
}

export function getRecordStatus(record = {}) {
  return pickFirst(
    record.status,
    record.application_status,
    record.offer_status,
    record.cas_status,
    record.visa_status,
    record.document_status,
    record.task_status,
    "Pending"
  );
}

export function formatRelativeTime(value) {
  if (!value) return "not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not available";

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60000)
  );

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function inferJourneyStage(record = {}) {
  const visa = lower(record.visa_status);
  const cas = lower(record.cas_status);
  const offer = lower(record.offer_status);
  const application = lower(record.application_status || record.status);
  const university = lower(record.university_status || record.shortlist_status);

  if (visa.includes("approved") || visa.includes("granted")) return "Visa Approved";
  if (
    visa.includes("submitted") ||
    visa.includes("pending") ||
    visa.includes("under review")
  ) {
    return "Visa Pending";
  }

  if (cas.includes("issued") || cas.includes("received")) return "CAS Issued";
  if (
    cas.includes("pending") ||
    cas.includes("requested") ||
    cas.includes("processing")
  ) {
    return "CAS Pending";
  }

  if (offer.includes("accepted") || offer.includes("deposit")) {
    return "Offer Accepted";
  }

  if (
    offer.includes("received") ||
    offer.includes("conditional") ||
    offer.includes("unconditional") ||
    offer.includes("offer")
  ) {
    return "Offer Received";
  }

  if (application.includes("under review")) return "Application Under Review";
  if (application.includes("submitted") || application.includes("applied")) {
    return "Application Submitted";
  }
  if (application.includes("started") || application.includes("draft")) {
    return "Application Started";
  }
  if (university.includes("shortlist") || university.includes("selected")) {
    return "Shortlisting";
  }
  if (
    application.includes("counsel") ||
    record.assigned_counselor_id ||
    record.counselor_id
  ) {
    return "Counseling";
  }

  return "Not Started";
}

export function getStageIndex(stage) {
  const index = JOURNEY_STAGE_ORDER.indexOf(stage);
  return index === -1 ? 0 : index;
}

export function calculateStudentVelocity(student = {}, related = {}) {
  const stage = inferJourneyStage(student);
  const stageIndex = getStageIndex(stage);
  const timelineCount = safeArray(related.timeline).length;
  const communicationsCount = safeArray(related.communications).length;
  const applicationsCount = safeArray(related.applications).length;

  const documentsApproved = safeArray(related.documents).filter((doc) =>
    lower(doc.status || doc.document_status).includes("approved")
  ).length;

  return clamp(
    stageIndex * 7 +
      timelineCount * 2 +
      communicationsCount * 3 +
      applicationsCount * 8 +
      documentsApproved * 4
  );
}

export function calculateStalledDays(student = {}, related = {}) {
  const dates = [
    student.updated_at,
    student.last_contacted_at,
    student.created_at,
    ...safeArray(related.timeline).map((item) => item.created_at),
    ...safeArray(related.communications).map((item) => item.created_at),
    ...safeArray(related.tasks).map((item) => item.updated_at || item.created_at),
  ].filter(Boolean);

  if (!dates.length) return 999;

  const latest = Math.max(
    ...dates.map((date) => new Date(date).getTime()).filter(Number.isFinite)
  );

  if (!latest) return 999;

  return Math.max(0, Math.round((Date.now() - latest) / 86400000));
}

export function calculateStudentRiskScore(student = {}, related = {}) {
  let score = 18;

  const status = lower(getRecordStatus(student));
  const stage = inferJourneyStage(student);
  const documents = safeArray(related.documents);
  const tasks = safeArray(related.tasks);
  const applications = safeArray(related.applications);
  const support = safeArray(related.support);
  const stalledDays = calculateStalledDays(student, related);

  if (!getStudentEmail(student) && !getStudentPhone(student)) score += 18;
  if (stage === "Not Started") score += 12;
  if (status.includes("rejected") || status.includes("failed")) score += 25;
  if (lower(student.visa_status).includes("rejected")) score += 35;
  if (lower(student.offer_status).includes("rejected")) score += 24;
  if (stalledDays >= 14) score += 18;
  if (stalledDays >= 30) score += 15;

  const openTasks = tasks.filter((task) => !isClosedStatus(task.status));

  const overdueTasks = openTasks.filter((task) => {
    if (!task.due_date && !task.due_at) return false;
    return new Date(task.due_date || task.due_at).getTime() < Date.now();
  });

  const missingDocs = documents.filter((doc) =>
    containsUrgentWord(
      doc.status,
      doc.document_status,
      doc.name,
      doc.document_name,
      doc.type
    )
  );

  const blockedApplications = applications.filter((application) =>
    containsUrgentWord(
      application.status,
      application.application_status,
      application.offer_status,
      application.cas_status,
      application.notes
    )
  );

  const unresolvedSupport = support.filter((item) => !isClosedStatus(item.status));

  score += Math.min(22, openTasks.length * 4);
  score += Math.min(25, overdueTasks.length * 9);
  score += Math.min(22, missingDocs.length * 7);
  score += Math.min(24, blockedApplications.length * 8);
  score += Math.min(18, unresolvedSupport.length * 6);

  return clamp(score);
}

export function calculateOpportunityScore(student = {}, related = {}) {
  let score = 25;

  const stage = inferJourneyStage(student);
  const stageIndex = getStageIndex(stage);
  const applications = safeArray(related.applications);
  const universities = safeArray(related.universities);
  const documents = safeArray(related.documents);
  const velocity = calculateStudentVelocity(student, related);

  score += stageIndex * 5;
  score += Math.round(velocity * 0.15);

  if (getStudentEmail(student) || getStudentPhone(student)) score += 8;
  if (student.preferred_country || student.country || student.destination_country) score += 8;
  if (student.intake || student.target_intake) score += 7;

  if (applications.length > 0) score += 12;
  if (applications.some((app) => lower(app.offer_status).includes("offer"))) score += 18;
  if (applications.some((app) => lower(app.offer_status).includes("accepted"))) score += 24;
  if (applications.some((app) => lower(app.cas_status).includes("issued"))) score += 28;
  if (universities.length >= 3) score += 10;
  if (documents.some((doc) => lower(doc.status || doc.document_status).includes("approved"))) score += 7;

  return clamp(score);
}

export function getNextMilestone(student = {}) {
  const stage = inferJourneyStage(student);

  const milestones = {
    "Not Started": "Counseling",
    Counseling: "Shortlisting",
    Shortlisting: "Application Started",
    "Application Started": "Application Submitted",
    "Application Submitted": "Application Under Review",
    "Application Under Review": "Offer Received",
    "Offer Received": "Offer Accepted",
    "Offer Accepted": "CAS Pending",
    "CAS Pending": "CAS Issued",
    "CAS Issued": "Visa Pending",
    "Visa Pending": "Visa Approved",
    "Visa Approved": "Enrolled",
    Enrolled: "Completed",
  };

  return milestones[stage] || "Counselor Review";
}

export function getNextBestCounselorAction(student = {}, related = {}) {
  const stage = inferJourneyStage(student);
  const risk = calculateStudentRiskScore(student, related);
  const applications = safeArray(related.applications);
  const documents = safeArray(related.documents);
  const tasks = safeArray(related.tasks);
  const support = safeArray(related.support);
  const stalledDays = calculateStalledDays(student, related);

  const hasMissingDocument = documents.some((doc) =>
    containsUrgentWord(
      doc.status,
      doc.document_status,
      doc.document_name,
      doc.name
    )
  );

  const hasOverdueTask = tasks.some((task) => {
    if (isClosedStatus(task.status)) return false;
    if (!task.due_date && !task.due_at) return false;
    return new Date(task.due_date || task.due_at).getTime() < Date.now();
  });

  const hasOpenSupport = support.some((item) => !isClosedStatus(item.status));

  if (risk >= 80) return "Call student today and remove the highest journey blocker.";
  if (stalledDays >= 14) return "Student is stalled. Log contact and push next milestone.";
  if (hasOpenSupport) return "Resolve the open student support request before new movement.";
  if (hasOverdueTask) return "Complete overdue counselor task and update the timeline.";
  if (hasMissingDocument) return "Request corrected document and confirm upload deadline.";
  if (stage === "Offer Received") return "Push offer decision, deposit plan, and acceptance timeline.";
  if (stage === "Offer Accepted") return "Start CAS readiness checklist and document verification.";
  if (stage === "CAS Pending") return "Follow CAS blockers with university and student.";
  if (stage === "CAS Issued") return "Move student into visa submission workflow.";
  if (stage === "Visa Pending") return "Track visa status and prepare recovery plan if delayed.";
  if (stage === "Not Started") return "Book counseling session and confirm destination pathway.";
  if (applications.length === 0) return "Create first application plan from shortlist.";

  return "Review journey stage and create the next counselor task.";
}

function groupRelatedByStudent(snapshot = {}) {
  const students = safeArray(snapshot.students);

  const aliasesFor = (student = {}) =>
    [
      student.person_id,
      student.id,
      student.student_id,
      student.inquiry_id,
      student.appointment_id,
      student.email,
      student.student_email,
      student.phone,
      student.mobile,
      student.whatsapp,
    ]
      .filter(Boolean)
      .map(normalizeKey);

  const matchesStudent = (record = {}, aliases = []) => {
    const recordKeys = [
      record.person_id,
      record.student_id,
      record.inquiry_id,
      record.appointment_id,
      record.email,
      record.student_email,
      record.phone,
      record.mobile,
      record.whatsapp,
    ]
      .filter(Boolean)
      .map(normalizeKey);

    return recordKeys.some((key) => aliases.includes(key));
  };

  return students.map((student) => {
    const aliases = aliasesFor(student);

    return {
      student,
      applications: safeArray(snapshot.applications).filter((record) =>
        matchesStudent(record, aliases)
      ),
      universities: safeArray(snapshot.universities).filter((record) =>
        matchesStudent(record, aliases)
      ),
      documents: safeArray(snapshot.documents).filter((record) =>
        matchesStudent(record, aliases)
      ),
      tasks: safeArray(snapshot.tasks).filter((record) =>
        matchesStudent(record, aliases)
      ),
      support: safeArray(snapshot.support).filter((record) =>
        matchesStudent(record, aliases)
      ),
      supportMessages: safeArray(snapshot.supportMessages).filter((record) =>
        matchesStudent(record, aliases)
      ),
      portalAccounts: safeArray(snapshot.portalAccounts).filter((record) =>
        matchesStudent(record, aliases)
      ),
      communications: safeArray(snapshot.communications).filter((record) =>
        matchesStudent(record, aliases)
      ),
      timeline: safeArray(snapshot.timeline).filter((record) =>
        matchesStudent(record, aliases)
      ),
    };
  });
}

export function buildPriorityStudentQueue(studentsOrSnapshot = []) {
  const snapshot = Array.isArray(studentsOrSnapshot)
    ? { students: studentsOrSnapshot }
    : studentsOrSnapshot || {};

  return groupRelatedByStudent(snapshot)
    .map((bundle) => {
      const { student } = bundle;
      const riskScore = calculateStudentRiskScore(student, bundle);
      const opportunityScore = calculateOpportunityScore(student, bundle);
      const velocityScore = calculateStudentVelocity(student, bundle);
      const stalledDays = calculateStalledDays(student, bundle);
      const stage = inferJourneyStage(student);
      const crmStage = normalizeInquiryPipelineStage(student);
      const operationalPriority = normalizeOperationalPriority(student);
      const operationalPriorityRankValue = operationalPriorityRank(
        operationalPriority
      );

      const openTasks = safeArray(bundle.tasks).filter(
        (task) => !isClosedStatus(task.status)
      );

      const missingDocuments = safeArray(bundle.documents).filter((doc) =>
        containsUrgentWord(doc.status, doc.document_status, doc.document_name, doc.type)
      );

      const openSupport = safeArray(bundle.support).filter(
        (item) => !isClosedStatus(item.status)
      );

      const portalAccount = newestFirst(bundle.portalAccounts)[0] || null;
      const portalAccess = normalizePortalAccess(portalAccount);

      return {
        ...student,
        id: buildRecordId(student, "student"),
        name: getStudentName(student),
        email: getStudentEmail(student),
        phone: getStudentPhone(student),
        stage,
        stageIndex: getStageIndex(stage),
        crmStage,
        operationalPriority,
        operationalPriorityRank: operationalPriorityRankValue,
        nextMilestone: getNextMilestone(student),
        riskScore,
        opportunityScore,
        velocityScore,
        stalledDays,
        openTasks: openTasks.length,
        missingDocuments: missingDocuments.length,
        openSupport: openSupport.length,
        portalAccess,
        portalStatus: portalAccess.status,
        portalEmail: portalAccess.email,
        portalLastLoginAt: portalAccess.lastLoginAt,
        portalMustChangePassword: portalAccess.mustChangePassword,
        applicationsCount: safeArray(bundle.applications).length,
        universitiesCount: safeArray(bundle.universities).length,
        documentsCount: safeArray(bundle.documents).length,
        communicationsCount: safeArray(bundle.communications).length,
        timelineCount: safeArray(bundle.timeline).length,
        isAtRisk: riskScore >= 65,
        isConversionReady: opportunityScore >= 70,
        isStalled: stalledDays >= 14 || (riskScore >= 60 && opportunityScore < 70),
        nextBestAction: getNextBestCounselorAction(student, bundle),
        lastActivityAt: pickFirst(
          student.updated_at,
          student.inquiry_updated_at,
          student.last_contacted_at,
          newestFirst(bundle.timeline)[0]?.created_at,
          newestFirst(bundle.communications)[0]?.created_at,
          student.created_at
        ),
      };
    })
    .sort((a, b) => {
      const aScore =
        safeNumber(a.operationalPriorityRank) * 45 +
        a.riskScore * 1.45 +
        a.opportunityScore +
        a.openSupport * 8 +
        a.openTasks * 4 +
        a.stalledDays;

      const bScore =
        safeNumber(b.operationalPriorityRank) * 45 +
        b.riskScore * 1.45 +
        b.opportunityScore +
        b.openSupport * 8 +
        b.openTasks * 4 +
        b.stalledDays;

      return bScore - aScore;
    });
}

export function buildCounselorApplicationQueue(snapshot = {}) {
  return newestFirst(snapshot.applications).map((application) => {
    const relatedStudent = findRelatedStudent(snapshot, application);
    const stageMeta = normalizeApplicationStage(application);
    const applicationStatus = pickFirst(
      application.application_status,
      application.status,
      "not_started"
    );
    const offerStatus = pickFirst(application.offer_status, "pending");
    const preEnrollmentStatus = (() => {
      const explicit = pickFirst(
        application.pre_enrollment_status,
        application.pre_enrolment_status,
        application.universitaly_status,
        ""
      );

      if (explicit) return explicit;

      const status = lower(applicationStatus);
      if (status === "pre_enrollment_started") return "started";
      if (status === "pre_enrollment_submitted") return "submitted";
      if (status === "pre_enrollment_validated") return "validated";
      if (stageMeta.key === "enrollment") return "completed";
      return "not_started";
    })();

    const visaStatus = pickFirst(application.visa_status, "not_started");
    const normalizedRisk = lower(application.risk_level);
    const normalizedStatus = lower(applicationStatus);
    const blocked =
      ["high", "critical", "urgent"].includes(normalizedRisk) ||
      ["rejected", "withdrawn"].includes(normalizedStatus) ||
      containsUrgentWord(
        application.risk_reason,
        application.internal_notes
      );

    const studentName = pickFirst(
      application.student_name,
      relatedStudent ? getStudentName(relatedStudent) : "",
      application.student_email,
      "Assigned Student"
    );

    const universityName = pickFirst(
      application.university,
      application.university_name,
      application.source_university_name,
      application.institution_name,
      "University not selected"
    );

    const courseName = pickFirst(
      application.program,
      application.program_name,
      application.course_name,
      application.course,
      "Course not selected"
    );

    return {
      ...application,
      id: buildRecordId(application, "application"),
      studentName,
      universityName,
      courseName,
      country: pickFirst(application.country, application.destination_country, "Italy"),
      intake: pickFirst(application.intake, "Not set"),
      status: applicationStatus,
      stage: stageMeta.key,
      stageLabel: stageMeta.label,
      stageMeaning: stageMeta.meaning,
      journeyProgress: stageMeta.progress,
      readinessScore: stageMeta.progress,
      offerStatus,
      preEnrollmentStatus,
      visaStatus,
      priorityScore: clamp(
        safeNumber(application.priority_score) ||
          (blocked ? 75 : 0) +
            (stageMeta.key === "decision" ? 45 : 0) +
            (stageMeta.key === "pre_enrollment" ? 55 : 0) +
            (stageMeta.key === "enrollment" ? 10 : 20)
      ),
      nextAction: applicationStageGuidance(application, stageMeta),
      isBlocked: blocked,
      updatedAt: pickFirst(application.updated_at, application.created_at),
    };
  });
}

function hasMeaningfulValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
}

function universityDeadlineMeta(value) {
  if (!hasMeaningfulValue(value)) {
    return {
      value: null,
      daysLeft: null,
      label: "No deadline",
      tone: "none",
      isOverdue: false,
      isUrgent: false,
    };
  }

  const raw = String(value).trim();
  const date = new Date(raw.length === 10 ? `${raw}T23:59:59` : raw);

  if (Number.isNaN(date.getTime())) {
    return {
      value: raw,
      daysLeft: null,
      label: "Date needs review",
      tone: "warning",
      isOverdue: false,
      isUrgent: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const daysLeft = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  if (daysLeft < 0) {
    return {
      value: raw,
      daysLeft,
      label: `${Math.abs(daysLeft)}d overdue`,
      tone: "danger",
      isOverdue: true,
      isUrgent: true,
    };
  }

  if (daysLeft === 0) {
    return {
      value: raw,
      daysLeft,
      label: "Due today",
      tone: "danger",
      isOverdue: false,
      isUrgent: true,
    };
  }

  if (daysLeft <= 7) {
    return {
      value: raw,
      daysLeft,
      label: `${daysLeft}d left`,
      tone: "danger",
      isOverdue: false,
      isUrgent: true,
    };
  }

  if (daysLeft <= 30) {
    return {
      value: raw,
      daysLeft,
      label: `${daysLeft}d left`,
      tone: "warning",
      isOverdue: false,
      isUrgent: false,
    };
  }

  return {
    value: raw,
    daysLeft,
    label: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    tone: "normal",
    isOverdue: false,
    isUrgent: false,
  };
}

function universityRequirementClosed(requirement = {}) {
  const status = lower(
    requirement.status ||
      requirement.requirement_status ||
      requirement.review_status
  );

  return (
    isClosedStatus(status) ||
    [
      "not_required",
      "waived",
      "met",
      "satisfied",
      "cleared",
    ].includes(status)
  );
}

function sameUniversityStudent(university = {}, record = {}) {
  const universityStudentId = pickFirst(
    university.student_id,
    university.inquiry_id,
    university.appointment_id
  );
  const recordStudentId = pickFirst(
    record.student_id,
    record.inquiry_id,
    record.appointment_id
  );

  if (
    hasMeaningfulValue(universityStudentId) &&
    hasMeaningfulValue(recordStudentId) &&
    String(universityStudentId) !== String(recordStudentId)
  ) {
    return false;
  }

  const universityType = lower(university.student_type);
  const recordType = lower(record.student_type);

  if (universityType && recordType && universityType !== recordType) {
    return false;
  }

  return true;
}

function universityApplicationMatch(university = {}, application = {}) {
  if (!sameUniversityStudent(university, application)) return false;

  const universityId = pickFirst(
    university.id,
    university.student_university_id
  );

  const linkedUniversityId = pickFirst(
    application.source_university_id,
    application.student_university_id,
    application.university_option_id
  );

  if (
    hasMeaningfulValue(universityId) &&
    hasMeaningfulValue(linkedUniversityId) &&
    String(universityId) === String(linkedUniversityId)
  ) {
    return true;
  }

  const universityName = lower(
    pickFirst(
      university.university,
      university.university_name,
      university.name,
      university.institution_name
    )
  );

  const applicationUniversityName = lower(
    pickFirst(
      application.source_university_name,
      application.university,
      application.university_name,
      application.institution_name
    )
  );

  if (!universityName || universityName !== applicationUniversityName) {
    return false;
  }

  const universityProgram = lower(
    pickFirst(
      university.program,
      university.course_name,
      university.program_name,
      university.course
    )
  );

  const applicationProgram = lower(
    pickFirst(
      application.program,
      application.course_name,
      application.program_name,
      application.course
    )
  );

  if (
    universityProgram &&
    applicationProgram &&
    universityProgram !== applicationProgram
  ) {
    return false;
  }

  return true;
}

function buildUniversityReadiness({
  university = {},
  category = "",
  status = "",
  linkedApplication = null,
  requirements = [],
  deadline = {},
}) {
  const explicit = Number(university.readiness_score);

  if (
    hasMeaningfulValue(university.readiness_score) &&
    Number.isFinite(explicit)
  ) {
    return clamp(explicit);
  }

  let score = 0;

  if (
    hasMeaningfulValue(
      pickFirst(
        university.university,
        university.university_name,
        university.name,
        university.institution_name
      )
    )
  ) {
    score += 15;
  }

  if (hasMeaningfulValue(university.country || university.destination_country)) {
    score += 8;
  }

  if (
    hasMeaningfulValue(
      pickFirst(
        university.program,
        university.course_name,
        university.program_name,
        university.course
      )
    )
  ) {
    score += 18;
  }

  if (hasMeaningfulValue(university.degree_level)) score += 5;
  if (hasMeaningfulValue(university.intake)) score += 8;
  if (hasMeaningfulValue(category)) score += 8;
  if (hasMeaningfulValue(status)) score += 8;
  if (hasMeaningfulValue(university.fit_score)) score += 8;
  if (hasMeaningfulValue(university.tuition_amount)) score += 5;
  if (hasMeaningfulValue(university.next_action)) score += 6;
  if (deadline?.value) score += 6;
  if (linkedApplication) score += 12;

  const openRequirements = safeArray(requirements).filter(
    (requirement) => !universityRequirementClosed(requirement)
  ).length;

  score -= Math.min(20, openRequirements * 5);

  if (deadline?.isOverdue) score -= 15;

  return clamp(score);
}

function buildUniversityPlanningPressure({
  university = {},
  readinessScore = 0,
  linkedApplication = null,
  requirements = [],
  deadline = {},
}) {
  let pressure = Math.max(0, 100 - safeNumber(readinessScore));

  const openRequirements = safeArray(requirements).filter(
    (requirement) => !universityRequirementClosed(requirement)
  );

  const urgentRequirements = openRequirements.filter((requirement) =>
    containsUrgentWord(
      requirement.status,
      requirement.requirement_status,
      requirement.requirement_name,
      requirement.title,
      requirement.notes
    )
  );

  pressure += Math.min(25, openRequirements.length * 5);
  pressure += Math.min(25, urgentRequirements.length * 8);

  if (!hasMeaningfulValue(university.program || university.course_name)) {
    pressure += 10;
  }

  if (!hasMeaningfulValue(university.intake)) pressure += 8;
  if (!hasMeaningfulValue(university.tuition_amount)) pressure += 6;
  if (!linkedApplication) pressure += 8;
  if (deadline?.isUrgent) pressure += 12;
  if (deadline?.isOverdue) pressure += 12;

  const manualRisk = lower(university.risk_level);
  if (manualRisk === "critical") pressure += 25;
  if (manualRisk === "high") pressure += 18;
  if (manualRisk === "medium") pressure += 9;

  return clamp(pressure);
}

function counselorUniversityNextAction({
  university = {},
  linkedApplication = null,
  requirements = [],
  readinessScore = 0,
  deadline = {},
}) {
  if (hasMeaningfulValue(university.next_action)) {
    return String(university.next_action);
  }

  const openRequirements = safeArray(requirements).filter(
    (requirement) => !universityRequirementClosed(requirement)
  );

  if (deadline?.isOverdue) {
    return "Recover the overdue university deadline and record the revised plan.";
  }

  if (deadline?.isUrgent) {
    return `Protect the university deadline (${deadline.label}) and confirm the next submission step.`;
  }

  if (openRequirements.length > 0) {
    return `Clear ${openRequirements.length} outstanding university requirement${
      openRequirements.length === 1 ? "" : "s"
    }.`;
  }

  if (
    !hasMeaningfulValue(
      pickFirst(
        university.program,
        university.course_name,
        university.program_name,
        university.course
      )
    )
  ) {
    return "Confirm the exact programme before this option moves forward.";
  }

  if (!hasMeaningfulValue(university.intake)) {
    return "Confirm the intake and application timeline.";
  }

  if (!hasMeaningfulValue(university.tuition_amount)) {
    return "Record tuition and affordability before recommending this option.";
  }

  if (linkedApplication) {
    return applicationStageGuidance(
      linkedApplication,
      normalizeApplicationStage(linkedApplication)
    );
  }

  if (readinessScore >= 75) {
    return "Create or link the Application OS record for this university.";
  }

  return "Confirm entry requirements, course fit, fees, intake and application timing.";
}

export function buildCounselorUniversityQueue(snapshot = {}) {
  const applications = newestFirst(snapshot.applications);
  const universityRequirements = safeArray(snapshot.universityRequirements);
  const universityEvents = newestFirst(snapshot.universityEvents);

  return newestFirst(snapshot.universities).map((university) => {
    const status = getRecordStatus(university);
    const category = pickFirst(
      university.category,
      university.fit_type,
      university.shortlist_type,
      "Target"
    );

    const universityId = pickFirst(
      university.id,
      university.student_university_id
    );

    const relatedStudent = findRelatedStudent(snapshot, university);

    const linkedApplication =
      applications.find((application) =>
        universityApplicationMatch(university, application)
      ) || null;

    const requirements = universityRequirements.filter((requirement) => {
      const requirementUniversityId = pickFirst(
        requirement.student_university_id,
        requirement.university_id,
        requirement.source_university_id
      );

      return (
        hasMeaningfulValue(universityId) &&
        hasMeaningfulValue(requirementUniversityId) &&
        String(universityId) === String(requirementUniversityId)
      );
    });

    const events = universityEvents.filter((event) => {
      const eventUniversityId = pickFirst(
        event.student_university_id,
        event.university_id,
        event.source_university_id
      );

      return (
        hasMeaningfulValue(universityId) &&
        hasMeaningfulValue(eventUniversityId) &&
        String(universityId) === String(eventUniversityId)
      );
    });

    const deadline = universityDeadlineMeta(
      pickFirst(
        university.deadline_date,
        university.application_deadline,
        university.deadline,
        university.next_action_due
      )
    );

    const readinessScore = buildUniversityReadiness({
      university,
      category,
      status,
      linkedApplication,
      requirements,
      deadline,
    });

    const openRequirements = requirements.filter(
      (requirement) => !universityRequirementClosed(requirement)
    );

    const verifiedRequirements = requirements.filter((requirement) =>
      universityRequirementClosed(requirement)
    );

    const urgentRequirements = openRequirements.filter((requirement) =>
      containsUrgentWord(
        requirement.status,
        requirement.requirement_status,
        requirement.requirement_name,
        requirement.title,
        requirement.notes
      )
    );

    const planningPressure = buildUniversityPlanningPressure({
      university,
      readinessScore,
      linkedApplication,
      requirements,
      deadline,
    });

    const latestEvent = events[0] || null;

    return {
      ...university,
      id: buildRecordId(university, "university"),
      studentName: pickFirst(
        university.student_name,
        relatedStudent ? getStudentName(relatedStudent) : "",
        university.student_email,
        "Assigned Student"
      ),
      studentEmail: pickFirst(
        university.student_email,
        relatedStudent ? getStudentEmail(relatedStudent) : "",
        ""
      ),
      universityName: pickFirst(
        university.university,
        university.university_name,
        university.name,
        university.institution_name,
        "University"
      ),
      country: pickFirst(
        university.country,
        university.destination_country,
        relatedStudent?.country,
        relatedStudent?.country_interest,
        "Not set"
      ),
      city: pickFirst(university.city, university.location, ""),
      courseName: pickFirst(
        university.program,
        university.course_name,
        university.program_name,
        university.course,
        "Course not selected"
      ),
      degreeLevel: pickFirst(
        university.degree_level,
        university.study_level,
        ""
      ),
      intake: pickFirst(university.intake, university.target_intake, "Not set"),
      category,
      status,
      fitScore: clamp(safeNumber(university.fit_score)),
      fitLevel: pickFirst(university.fit_level, "Not scored"),
      readinessScore,
      manualRiskLevel: pickFirst(university.risk_level, "low"),
      planningPressure,
      deadline,
      deadlineDate: deadline.value,
      nextActionDue: pickFirst(university.next_action_due, null),
      applicationLinked: Boolean(linkedApplication),
      applicationId: linkedApplication?.id || null,
      applicationStatus: linkedApplication
        ? getRecordStatus(linkedApplication)
        : "Not linked",
      applicationStage: linkedApplication
        ? normalizeApplicationStage(linkedApplication).label
        : "Planning",
      applicationProgress: linkedApplication
        ? normalizeApplicationStage(linkedApplication).progress
        : 0,
      requirements,
      requirementsCount: requirements.length,
      openRequirementsCount: openRequirements.length,
      verifiedRequirementsCount: verifiedRequirements.length,
      urgentRequirementsCount: urgentRequirements.length,
      events,
      eventsCount: events.length,
      latestEvent,
      latestEventLabel: pickFirst(
        latestEvent?.event_label,
        latestEvent?.title,
        latestEvent?.event_type,
        ""
      ),
      applicationFee: safeNumber(university.application_fee),
      applicationFeeCurrency: pickFirst(
        university.application_fee_currency,
        "EUR"
      ),
      tuitionAmount: safeNumber(university.tuition_amount),
      tuitionCurrency: pickFirst(university.tuition_currency, "EUR"),
      livingCostAmount: safeNumber(university.living_cost_amount),
      livingCostCurrency: pickFirst(university.living_cost_currency, "EUR"),
      scholarshipStatus: pickFirst(
        university.scholarship_status,
        "not_checked"
      ),
      scholarshipName: pickFirst(university.scholarship_name, ""),
      scholarshipAmount: safeNumber(university.scholarship_amount),
      scholarshipCurrency: pickFirst(
        university.scholarship_currency,
        "EUR"
      ),
      dsuEligible: Boolean(university.dsu_eligible),
      nextAction: counselorUniversityNextAction({
        university,
        linkedApplication,
        requirements,
        readinessScore,
        deadline,
      }),
      isReady: readinessScore >= 75,
      isHighPressure: planningPressure >= 75,
      isBlocked:
        deadline.isOverdue ||
        urgentRequirements.length > 0 ||
        lower(status).includes("blocked"),
      updatedAt: pickFirst(
        university.updated_at,
        university.created_at,
        latestEvent?.created_at
      ),
    };
  });
}

export function buildCounselorDocumentQueue(snapshot = {}) {
  return newestFirst(snapshot.documents).map((document) => {
    const status = pickFirst(
      document.status,
      document.document_status,
      "pending"
    );
    const normalizedStatus = lower(status);
    const name = pickFirst(
      document.document_name,
      document.name,
      document.type,
      "Document"
    );
    const type = lower(document.type || name);
    const approved =
      isClosedStatus(status) ||
      ["verified", "approved", "accepted", "cleared"].some((value) =>
        normalizedStatus.includes(value)
      );
    const rejected = [
      "rejected",
      "failed",
      "invalid",
      "declined",
      "correction_required",
      "requested_again",
      "reupload_required",
    ].some((value) => normalizedStatus.includes(value));

    const visaSensitive =
      type.includes("passport") ||
      type.includes("visa") ||
      type.includes("pre-enrol") ||
      type.includes("pre_enrol") ||
      type.includes("universitaly") ||
      type.includes("bank") ||
      type.includes("financial") ||
      type.includes("insurance") ||
      type.includes("police") ||
      type.includes("medical");

    const highCritical =
      !approved &&
      (rejected ||
        visaSensitive ||
        containsUrgentWord(status, name, document.notes));

    const relatedStudent = findRelatedStudent(snapshot, document);

    return {
      ...document,
      id: buildRecordId(document, "document"),
      studentName: pickFirst(
        document.student_name,
        relatedStudent ? getStudentName(relatedStudent) : "",
        document.student_email,
        "Assigned Student"
      ),
      documentName: name,
      status,
      criticality: approved
        ? "Cleared"
        : highCritical
          ? rejected
            ? "Urgent"
            : "High"
          : "Normal",
      reviewState: approved
        ? "Verified · Cleared"
        : rejected
          ? "Correction Required"
          : highCritical
            ? "Needs Counselor Attention"
            : "Pending Review",
      nextAction: approved
        ? "Cleared — no counselor action required."
        : rejected
          ? "Review the rejection reason and request a corrected upload."
          : highCritical
            ? "Review the file and confirm the next document action."
            : "Check document quality and monitor the Admin review decision.",
      updatedAt: pickFirst(document.updated_at, document.created_at),
    };
  });
}

export function buildCounselorTaskQueue(snapshot = {}) {
  return newestFirst(snapshot.tasks)
    .filter((task) => !isClosedStatus(task.status || task.task_status))
    .map((task) => {
      const dueAt = pickFirst(task.due_date, task.due_at, task.deadline);
      const isOverdue = dueAt ? new Date(dueAt).getTime() < Date.now() : false;
      const priority = pickFirst(task.priority, isOverdue ? "Urgent" : "Normal");

      return {
        ...task,
        id: buildRecordId(task, "task"),
        title: pickFirst(task.title, task.task_title, task.name, task.notes, "Counselor Task"),
        studentName: pickFirst(
          task.student_name,
          task.student_email,
          "Assigned Student"
        ),
        category: pickFirst(task.category, task.type, "General"),
        priority,
        status: pickFirst(task.status, task.task_status, "Open"),
        dueAt,
        isOverdue,
        updatedAt: pickFirst(task.updated_at, task.created_at),
        nextAction: isOverdue
          ? "Complete overdue task immediately."
          : "Complete task or update student timeline.",
      };
    });
}

export function buildCounselorSupportQueue(snapshot = {}) {
  const messages = newestFirst(snapshot.supportMessages);

  return newestFirst(snapshot.support).map((request) => {
    const category = pickFirst(
      request.request_type,
      request.category,
      request.type,
      "General Support"
    );
    const status = pickFirst(request.status, "open");
    const requestId = buildRecordId(request, "support");

    const threadMessages = messages
      .filter(
        (message) =>
          String(
            message.support_request_id ||
              message.request_id ||
              message.support_id ||
              ""
          ) === String(request.id || requestId)
      )
      .filter((message) => !message.is_internal)
      .sort(
        (a, b) =>
          new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime()
      );

    if (!threadMessages.length && request.message) {
      threadMessages.push({
        id: `${requestId}-legacy-student`,
        support_request_id: request.id || requestId,
        sender_type: "student",
        sender_name: pickFirst(
          request.student_name,
          request.student_email,
          "Student"
        ),
        message: request.message,
        created_at: request.created_at,
        is_internal: false,
        _legacy: true,
      });
    }

    if (
      request.counselor_response &&
      !threadMessages.some(
        (message) =>
          lower(message.sender_type).includes("counselor") &&
          safeString(message.message).trim() ===
            safeString(request.counselor_response).trim()
      )
    ) {
      threadMessages.push({
        id: `${requestId}-legacy-counselor`,
        support_request_id: request.id || requestId,
        sender_type: "counselor",
        sender_name: pickFirst(request.responded_by, "Counselor"),
        message: request.counselor_response,
        created_at: pickFirst(
          request.responded_at,
          request.updated_at,
          request.created_at
        ),
        is_internal: false,
        _legacy: true,
      });
    }

    const latestMessage = threadMessages[threadMessages.length - 1] || null;
    const urgent = containsUrgentWord(
      category,
      status,
      request.priority,
      request.subject,
      request.message,
      request.description
    );
    const closed = isClosedStatus(status);

    return {
      ...request,
      id: requestId,
      studentName: pickFirst(
        request.student_name,
        findRelatedStudent(snapshot, request)
          ? getStudentName(findRelatedStudent(snapshot, request))
          : "",
        request.student_email,
        "Assigned Student"
      ),
      subject: pickFirst(request.subject, request.title, category),
      category,
      status,
      priority: pickFirst(request.priority, urgent ? "Urgent" : "Normal"),
      message: pickFirst(request.message, request.description, request.notes, ""),
      threadMessages,
      threadCount: threadMessages.length,
      latestMessage,
      latestReply:
        [...threadMessages]
          .reverse()
          .find((message) =>
            ["counselor", "admin"].includes(lower(message.sender_type))
          ) || null,
      createdAt: pickFirst(request.created_at, request.updated_at),
      updatedAt: pickFirst(request.updated_at, request.responded_at, request.created_at),
      nextAction: closed
        ? "Resolved — reopen only if the student needs more help."
        : latestMessage &&
            ["counselor", "admin"].includes(lower(latestMessage.sender_type))
          ? "Waiting for the student to review or continue the conversation."
          : urgent
            ? "Reply promptly and escalate only if another team must act."
            : "Reply in the thread and keep the request status current.",
    };
  });
}

export function buildCounselorCommunicationHub(snapshot = {}) {
  const communicationItems = safeArray(snapshot.communications).map((item) => ({
    ...item,
    id: buildRecordId(item, "communication"),
    source: "communication",
    studentName: pickFirst(item.student_name, item.student_email, "Assigned Student"),
    title: pickFirst(item.subject, item.title, item.channel, item.type, "Student Communication"),
    channel: pickFirst(item.channel, item.type, "Message"),
    status: pickFirst(item.status, "Logged"),
    body: pickFirst(item.message, item.body, item.notes, ""),
    createdAt: pickFirst(item.created_at, item.updated_at),
  }));

  const supportItems = safeArray(snapshot.support).map((item) => ({
    ...item,
    id: buildRecordId(item, "support-communication"),
    source: "support",
    studentName: pickFirst(item.student_name, item.student_email, "Assigned Student"),
    title: pickFirst(item.subject, item.title, item.category, "Support Request"),
    channel: "Support",
    status: pickFirst(item.status, "Open"),
    body: pickFirst(item.message, item.description, item.notes, ""),
    createdAt: pickFirst(item.created_at, item.updated_at),
  }));

  return newestFirst([...communicationItems, ...supportItems]);
}

export function buildCounselorAppointmentsQueue(snapshot = {}) {
  return newestFirst(snapshot.appointments).map((appointment) => {
    const startAt = pickFirst(
      appointment.start_time,
      appointment.appointment_date,
      appointment.scheduled_at,
      appointment.created_at
    );

    const status = pickFirst(appointment.status, "Scheduled");
    const isPast = startAt ? new Date(startAt).getTime() < Date.now() : false;

    return {
      ...appointment,
      id: buildRecordId(appointment, "appointment"),
      studentName: getStudentName(appointment),
      title: pickFirst(appointment.title, appointment.purpose, "Counseling Appointment"),
      status,
      startAt,
      isPast,
      channel: pickFirst(
        appointment.channel,
        appointment.meeting_type,
        appointment.location,
        "Not set"
      ),
      nextAction:
        isPast && !isClosedStatus(status)
          ? "Add appointment outcome and create follow-up task."
          : "Prepare notes and confirm student attendance.",
    };
  });
}


function visaRequirementBucket(requirement = {}) {
  const status = lower(
    pickFirst(
      requirement.requirement_status,
      requirement.status,
      requirement.review_status,
      ""
    )
  );

  if (
    ["completed", "complete", "approved", "verified", "accepted", "cleared", "done"].some(
      (value) => status.includes(value)
    )
  ) {
    return "cleared";
  }

  if (
    ["missing", "rejected", "expired", "invalid", "failed", "declined", "blocked"].some(
      (value) => status.includes(value)
    )
  ) {
    return "attention";
  }

  return "open";
}

function buildVisaRequirementStats(requirements = []) {
  const rows = uniqueBy(
    safeArray(requirements),
    (item) =>
      normalizeKey(
        pickFirst(
          item.id,
          `${item.visa_id || "visa"}:${item.requirement_name || item.name || item.title || "requirement"}`
        )
      )
  );

  let cleared = 0;
  let attention = 0;
  let open = 0;
  let overdue = 0;
  let dueSoon = 0;

  const now = Date.now();

  rows.forEach((item) => {
    const bucket = visaRequirementBucket(item);
    if (bucket === "cleared") cleared += 1;
    else if (bucket === "attention") attention += 1;
    else open += 1;

    const dueValue = pickFirst(item.due_date, item.deadline, item.required_by, null);
    if (!dueValue || bucket === "cleared") return;

    const dueTime = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(String(dueValue))
        ? `${dueValue}T23:59:59`
        : dueValue
    ).getTime();

    if (!Number.isFinite(dueTime)) return;
    const days = Math.ceil((dueTime - now) / 86400000);
    if (days < 0) overdue += 1;
    else if (days <= 7) dueSoon += 1;
  });

  const total = rows.length;

  return {
    total,
    cleared,
    attention,
    open,
    overdue,
    dueSoon,
    readiness: total > 0 ? Math.round((cleared / total) * 100) : null,
  };
}

function normalizeVisaStage(value) {
  const stage = lower(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const aliases = {
    "": "preparation",
    "not started": "preparation",
    preparing: "preparation",
    preparation: "preparation",
    appointment: "appointment_booked",
    booked: "appointment_booked",
    "appointment booked": "appointment_booked",
    biometric: "biometrics",
    biometrics: "biometrics",
    medical: "medical",
    submission: "submitted",
    submitted: "submitted",
    "visa submitted": "submitted",
    review: "embassy_review",
    processing: "embassy_review",
    "under review": "embassy_review",
    "embassy review": "embassy_review",
    decision: "decision",
    approved: "decision",
    rejected: "decision",
    refused: "decision",
    "visa approved": "decision",
    "passport collection": "passport_collection",
    "passport returned": "passport_collection",
    completed: "completed",
    complete: "completed",
    closed: "completed",
  };

  return aliases[stage] || stage.replace(/\s+/g, "_") || "preparation";
}

function visaStageProgress(stage) {
  const order = [
    "preparation",
    "appointment_booked",
    "biometrics",
    "medical",
    "submitted",
    "embassy_review",
    "decision",
    "passport_collection",
    "completed",
  ];
  const index = order.indexOf(normalizeVisaStage(stage));
  return index < 0 ? 0 : Math.round((index / Math.max(1, order.length - 1)) * 100);
}

function visaRiskScore(value) {
  const risk = lower(value);
  if (risk.includes("critical")) return 90;
  if (risk.includes("high") || risk.includes("urgent")) return 70;
  if (risk.includes("medium") || risk.includes("moderate")) return 45;
  return 15;
}

function visaDatePressure(value) {
  if (!value) return { overdue: false, dueSoon: false };
  const raw = String(value).trim();
  const time = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59` : raw
  ).getTime();
  if (!Number.isFinite(time)) return { overdue: false, dueSoon: false };
  const days = Math.ceil((time - Date.now()) / 86400000);
  return { overdue: days < 0, dueSoon: days >= 0 && days <= 7 };
}

function isVisaArchived(visa = {}) {
  return Boolean(
    visa.is_archived ||
      visa.archived_at ||
      ["archived", "deleted"].includes(lower(visa.record_status)) ||
      lower(visa.status) === "archived"
  );
}

function isVisaApproved(visa = {}) {
  const text = `${lower(visa.visa_status)} ${lower(visa.visa_stage)} ${lower(visa.decision_status)}`;
  return (
    text.includes("visa approved") ||
    text.includes("approved") ||
    text.includes("granted")
  );
}

function isVisaRefused(visa = {}) {
  const text = `${lower(visa.visa_status)} ${lower(visa.visa_stage)} ${lower(visa.decision_status)}`;
  return (
    text.includes("rejected") ||
    text.includes("refused") ||
    text.includes("denied") ||
    Boolean(visa.previous_refusal)
  );
}

function visaPressureScore(visa = {}, requirementStats = {}) {
  let score = visaRiskScore(visa.risk_level);
  const nextAction = visaDatePressure(visa.next_action_due);
  const appointment = visaDatePressure(visa.appointment_date);

  if (requirementStats.attention > 0) score += Math.min(30, requirementStats.attention * 7);
  if (requirementStats.overdue > 0) score += Math.min(18, requirementStats.overdue * 6);
  if (requirementStats.total === 0) score += 8;
  if (nextAction.overdue) score += 20;
  else if (nextAction.dueSoon) score += 10;
  if (appointment.overdue && !isVisaApproved(visa)) score += 8;
  if (visa.previous_refusal) score += 15;
  if (isVisaRefused(visa)) score += 12;
  if (!safeString(visa.next_action).trim() && !isVisaApproved(visa)) score += 8;

  return clamp(score);
}

export function buildCounselorVisaQueue(snapshot = {}) {
  const applications = safeArray(snapshot.applications);
  const requirements = safeArray(snapshot.visaRequirements);
  const events = safeArray(snapshot.visaEvents);

  const requirementsByVisa = new Map();
  requirements.forEach((requirement) => {
    const key = normalizeKey(requirement.visa_id);
    if (!key) return;
    if (!requirementsByVisa.has(key)) requirementsByVisa.set(key, []);
    requirementsByVisa.get(key).push(requirement);
  });

  const eventsByVisa = new Map();
  events.forEach((event) => {
    const key = normalizeKey(event.visa_id);
    if (!key) return;
    if (!eventsByVisa.has(key)) eventsByVisa.set(key, []);
    eventsByVisa.get(key).push(event);
  });
  eventsByVisa.forEach((rows) =>
    rows.sort(
      (a, b) =>
        new Date(b.created_at || b.updated_at || 0).getTime() -
        new Date(a.created_at || a.updated_at || 0).getTime()
    )
  );

  return newestFirst(snapshot.visas)
    .map((visa) => {
      const relatedStudent = findRelatedStudent(snapshot, visa);
      const applicationId = pickFirst(visa.application_id, visa.source_application_id, null);
      const application = applicationId
        ? applications.find(
            (item) => normalizeKey(pickFirst(item.id, item.application_id, "")) === normalizeKey(applicationId)
          ) || {}
        : {};

      const visaId = normalizeKey(visa.id);
      const caseRequirements = visaId ? safeArray(requirementsByVisa.get(visaId)) : [];
      const caseEvents = visaId ? safeArray(eventsByVisa.get(visaId)) : [];
      const requirementStats = buildVisaRequirementStats(caseRequirements);
      const stage = normalizeVisaStage(pickFirst(visa.visa_stage, visa.stage, visa.visa_status, "preparation"));
      const studentId = pickFirst(
        visa.student_id,
        relatedStudent?.student_id,
        relatedStudent?.inquiry_id,
        relatedStudent?.appointment_id,
        relatedStudent?.id,
        null
      );
      const studentType = lower(pickFirst(visa.student_type, visa.appointment_id ? "appointment" : "inquiry")) === "appointment"
        ? "appointment"
        : "inquiry";
      const studentName = pickFirst(
        visa.student_name,
        relatedStudent ? getStudentName(relatedStudent) : "",
        visa.student_email,
        "Assigned Student"
      );
      const universityName = pickFirst(
        visa.source_university_name,
        application.university_name,
        application.university,
        application.institution_name,
        "University not linked"
      );
      const courseName = pickFirst(
        application.program_name,
        application.program,
        application.course_name,
        application.course,
        "Programme not linked"
      );
      const archived = isVisaArchived(visa);
      const pressureScore = archived ? 0 : visaPressureScore(visa, requirementStats);

      return {
        ...visa,
        id: buildRecordId(visa, "visa"),
        application_id: applicationId || visa.application_id || null,
        studentId,
        studentType,
        studentName,
        student: {
          ...(relatedStudent || {}),
          studentId,
          studentType,
          name: studentName,
          email: pickFirst(
            relatedStudent?.email,
            relatedStudent?.student_email,
            visa.student_email,
            ""
          ),
          phone: pickFirst(
            relatedStudent?.phone,
            relatedStudent?.student_phone,
            visa.student_phone,
            ""
          ),
        },
        application,
        universityName,
        courseName,
        country: pickFirst(visa.country, application.country, "Italy"),
        stage,
        stageProgress: visaStageProgress(stage),
        requirements: caseRequirements,
        events: caseEvents,
        requirementStats,
        pressureScore,
        isArchived: archived,
        isApproved: isVisaApproved(visa),
        isRefused: isVisaRefused(visa),
        latestEvent: caseEvents[0] || null,
        updatedAt: pickFirst(visa.updated_at, visa.created_at),
      };
    })
    .sort((a, b) => {
      if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
      if (a.pressureScore !== b.pressureScore) return b.pressureScore - a.pressureScore;
      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
}


function normalizeFinanceStatus(value = "") {
  return lower(value).replace(/[\s-]+/g, "_");
}

function financeLinkedConfirmedPaid(invoice = {}, payments = []) {
  const invoiceId = safeString(invoice?.id).trim();
  if (!invoiceId) return 0;

  const invoiceCurrency = safeString(invoice?.currency || "PKR").toUpperCase();

  return safeArray(payments)
    .filter(
      (payment) =>
        safeString(payment?.invoice_id).trim() === invoiceId &&
        normalizeFinanceStatus(payment?.status) === "confirmed" &&
        safeString(payment?.currency || invoiceCurrency).toUpperCase() ===
          invoiceCurrency
    )
    .reduce(
      (sum, payment) =>
        sum +
        safeNumber(
          pickFirst(payment.amount, payment.paid_amount, payment.payment_amount, 0)
        ),
      0
    );
}

function financeOutstanding(invoice = {}, payments = []) {
  const total = Math.max(
    0,
    safeNumber(
      pickFirst(invoice.total_amount, invoice.amount, invoice.invoice_amount, 0)
    )
  );
  const linkedPaid = Math.max(0, financeLinkedConfirmedPaid(invoice, payments));
  const storedPaid = Math.max(0, safeNumber(pickFirst(invoice.paid_amount, 0)));
  const storedOutstanding = Number(invoice.outstanding_amount);

  if (linkedPaid > 0) return Math.max(0, total - linkedPaid);
  if (storedPaid > 0) return Math.max(0, total - storedPaid);

  if (Number.isFinite(storedOutstanding) && storedOutstanding > 0) {
    return Math.min(total || storedOutstanding, storedOutstanding);
  }

  return total;
}

function financeInvoiceOpen(invoice = {}, payments = []) {
  const status = normalizeFinanceStatus(invoice.status);
  return !["cancelled", "canceled", "void", "refunded"].includes(status) &&
    financeOutstanding(invoice, payments) > 0;
}

function financeInvoiceOverdue(invoice = {}, payments = []) {
  if (!financeInvoiceOpen(invoice, payments)) return false;
  if (normalizeFinanceStatus(invoice.status) === "overdue") return true;
  if (!invoice.due_date) return false;
  const due = new Date(invoice.due_date).getTime();
  if (!Number.isFinite(due)) return false;
  return due < new Date().setHours(0, 0, 0, 0);
}

function financeRecordBelongsToStudent(
  record = {},
  student = {},
  appointments = []
) {
  return financeRecordBelongsToStudentScope(record, student, appointments);
}

function financeCurrencyBuckets(invoices = [], payments = []) {
  const buckets = new Map();

  const ensure = (currency) => {
    const key = safeString(currency || "PKR").toUpperCase();
    if (!buckets.has(key)) {
      buckets.set(key, {
        currency: key,
        invoiced: 0,
        paid: 0,
        outstanding: 0,
        overdue: 0,
      });
    }
    return buckets.get(key);
  };

  safeArray(invoices).forEach((invoice) => {
    const bucket = ensure(invoice.currency);
    const amount = safeNumber(
      pickFirst(invoice.total_amount, invoice.amount, invoice.invoice_amount, 0)
    );
    const outstanding = financeOutstanding(invoice, payments);
    bucket.invoiced += amount;
    bucket.outstanding += outstanding;
    if (financeInvoiceOverdue(invoice, payments)) bucket.overdue += outstanding;
  });

  safeArray(payments)
    .filter((payment) => normalizeFinanceStatus(payment.status) === "confirmed")
    .forEach((payment) => {
      ensure(payment.currency).paid += safeNumber(
        pickFirst(payment.amount, payment.paid_amount, payment.payment_amount, 0)
      );
    });

  return [...buckets.values()].sort((a, b) =>
    safeString(a.currency).localeCompare(safeString(b.currency))
  );
}

function financePressureScore({
  openInvoices = 0,
  overdueInvoices = 0,
  pendingReceipts = 0,
  openRequests = 0,
  outstandingCurrencies = 0,
} = {}) {
  let score = 0;
  score += Math.min(32, overdueInvoices * 18);
  score += Math.min(24, openInvoices * 7);
  score += Math.min(20, pendingReceipts * 9);
  score += Math.min(16, openRequests * 6);
  score += Math.min(8, outstandingCurrencies * 4);
  return clamp(score);
}

export function buildCounselorFinanceQueue(snapshot = {}) {
  const students = safeArray(snapshot.students);
  const invoices = safeArray(snapshot.invoices);
  const payments = safeArray(snapshot.payments);
  const receipts = safeArray(snapshot.receipts);
  const paymentRequests = safeArray(snapshot.paymentRequests);
  const appointments = safeArray(snapshot.appointments);
  const paymentAccounts = safeArray(snapshot.paymentAccounts).filter(
    (account) => account.is_active !== false
  );

  return students
    .map((student) => {
      const studentInvoices = invoices.filter((row) =>
        financeRecordBelongsToStudent(row, student, appointments)
      );
      const studentPayments = payments.filter((row) =>
        financeRecordBelongsToStudent(row, student, appointments)
      );
      const studentReceipts = receipts.filter((row) =>
        financeRecordBelongsToStudent(row, student, appointments)
      );
      const studentRequests = paymentRequests.filter((row) =>
        financeRecordBelongsToStudent(row, student, appointments)
      );

      const confirmedPayments = studentPayments.filter(
        (payment) => normalizeFinanceStatus(payment.status) === "confirmed"
      );
      const openInvoices = studentInvoices.filter((invoice) =>
        financeInvoiceOpen(invoice, confirmedPayments)
      );
      const overdueInvoices = studentInvoices.filter((invoice) =>
        financeInvoiceOverdue(invoice, confirmedPayments)
      );
      const pendingReceipts = studentReceipts.filter((receipt) =>
        ["pending_review", "pending", "under_review"].includes(
          normalizeFinanceStatus(
            pickFirst(receipt.status, receipt.review_status, "pending_review")
          )
        )
      );
      const openRequests = studentRequests.filter(
        (request) => !isClosedStatus(request.status)
      );
      const currencyBuckets = financeCurrencyBuckets(
        studentInvoices,
        studentPayments
      );
      const outstandingCurrencies = currencyBuckets.filter(
        (bucket) => bucket.outstanding > 0
      ).length;
      const pressureScore = financePressureScore({
        openInvoices: openInvoices.length,
        overdueInvoices: overdueInvoices.length,
        pendingReceipts: pendingReceipts.length,
        openRequests: openRequests.length,
        outstandingCurrencies,
      });

      const hasFinanceActivity =
        studentInvoices.length ||
        studentPayments.length ||
        studentReceipts.length ||
        studentRequests.length;

      const studentId = pickFirst(
        student.student_id,
        student.inquiry_id,
        student.appointment_id,
        student.id,
        null
      );
      const studentType =
        lower(pickFirst(student.student_type, student.record_type, "")) ===
        "appointment"
          ? "appointment"
          : "inquiry";

      const latestPayment = newestFirst(confirmedPayments)[0] || null;
      const latestReceipt = newestFirst(studentReceipts)[0] || null;
      const nearestInvoice = [...openInvoices].sort((a, b) => {
        const aTime = new Date(a.due_date || "2999-12-31").getTime();
        const bTime = new Date(b.due_date || "2999-12-31").getTime();
        return aTime - bTime;
      })[0] || null;

      const nextAction =
        overdueInvoices.length > 0
          ? `Recover ${overdueInvoices.length} overdue invoice${
              overdueInvoices.length === 1 ? "" : "s"
            }`
          : pendingReceipts.length > 0
            ? `Review ${pendingReceipts.length} pending receipt${
                pendingReceipts.length === 1 ? "" : "s"
              } with Admin Finance`
            : openRequests.length > 0
              ? `Follow up ${openRequests.length} finance request${
                  openRequests.length === 1 ? "" : "s"
                }`
              : openInvoices.length > 0
                ? "Confirm payment plan and next invoice due date"
                : hasFinanceActivity
                  ? "Finance record is currently clear"
                  : "No finance activity recorded yet";

      return {
        id: `finance-${normalizeKey(studentId || getStudentName(student))}`,
        student,
        studentId,
        studentType,
        studentName: getStudentName(student),
        studentEmail: getStudentEmail(student),
        invoices: newestFirst(studentInvoices),
        payments: newestFirst(studentPayments),
        receipts: newestFirst(studentReceipts),
        paymentRequests: newestFirst(studentRequests),
        paymentAccounts,
        currencyBuckets,
        openInvoices,
        overdueInvoices,
        confirmedPayments,
        pendingReceipts,
        openRequests,
        latestPayment,
        latestReceipt,
        nearestInvoice,
        pressureScore,
        hasFinanceActivity: Boolean(hasFinanceActivity),
        nextAction,
        updatedAt: pickFirst(
          latestPayment?.paid_at,
          latestPayment?.created_at,
          latestReceipt?.updated_at,
          latestReceipt?.created_at,
          nearestInvoice?.updated_at,
          nearestInvoice?.created_at,
          student.updated_at,
          student.created_at
        ),
      };
    })
    // Keep every assigned student visible in Counselor Finance, even before the
    // first invoice/payment/receipt exists. Zero-activity students are valid
    // finance cases with a clear/not-started position and payment guidance.
    .sort((a, b) => {
      if (a.pressureScore !== b.pressureScore) {
        return b.pressureScore - a.pressureScore;
      }
      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
}


export function buildCounselorPortalMetrics(snapshot = {}) {
  const studentQueue = buildPriorityStudentQueue(snapshot);
  const taskQueue = buildCounselorTaskQueue(snapshot);
  const supportQueue = buildCounselorSupportQueue(snapshot);
  const applicationQueue = buildCounselorApplicationQueue(snapshot);
  const documentQueue = buildCounselorDocumentQueue(snapshot);
  const visaQueue = buildCounselorVisaQueue(snapshot);
  const financeQueue = buildCounselorFinanceQueue(snapshot);
  const activeVisaQueue = visaQueue.filter((visa) => !visa.isArchived);

  return {
    assignedStudents: studentQueue.length,
    atRiskStudents: studentQueue.filter((student) => student.isAtRisk).length,
    stalledStudents: studentQueue.filter((student) => student.isStalled).length,
    conversionReady: studentQueue.filter((student) => student.isConversionReady).length,
    openTasks: taskQueue.length,
    overdueTasks: taskQueue.filter((task) => task.isOverdue).length,
    supportQueue: supportQueue.filter((item) => !isClosedStatus(item.status)).length,
    openApplications: applicationQueue.filter(
      (application) =>
        !["enrollment", "closed"].includes(lower(application.stage)) &&
        !["enrolled", "rejected", "withdrawn"].includes(lower(application.status))
    ).length,
    blockedApplications: applicationQueue.filter((application) => application.priorityScore >= 70).length,
    pendingDocuments: documentQueue.filter((document) => !isClosedStatus(document.status)).length,
    criticalDocuments: documentQueue.filter(
      (document) =>
        ["High", "Urgent"].includes(document.criticality) &&
        !isClosedStatus(document.status)
    ).length,
    activeVisaCases: activeVisaQueue.length,
    visaAttention: activeVisaQueue.filter(
      (visa) =>
        visa.pressureScore >= 60 ||
        visa.requirementStats.attention > 0 ||
        visa.requirementStats.overdue > 0
    ).length,
    visaApproved: activeVisaQueue.filter((visa) => visa.isApproved).length,
    financeStudents: financeQueue.filter((record) => record.hasFinanceActivity).length,
    financeAttention: financeQueue.filter((record) => record.pressureScore >= 45).length,
    financeOverdueInvoices: financeQueue.reduce(
      (sum, record) => sum + record.overdueInvoices.length,
      0
    ),
    financePendingReceipts: financeQueue.reduce(
      (sum, record) => sum + record.pendingReceipts.length,
      0
    ),
  };
}

export function buildCounselorNavigation(metrics = {}) {
  return [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Assigned Students", badge: metrics.assignedStudents },
    { key: "applications", label: "Applications", badge: metrics.openApplications },
    { key: "universities", label: "Universities" },
    { key: "documents", label: "Documents", badge: metrics.criticalDocuments },
    { key: "visa", label: "Visa", badge: metrics.activeVisaCases },
    { key: "finance", label: "Finance", badge: metrics.financeStudents },
    { key: "tasks", label: "Tasks", badge: metrics.openTasks },
    { key: "support", label: "Support Queue", badge: metrics.supportQueue },
    { key: "communications", label: "Communication Hub" },
    { key: "appointments", label: "Appointments" },
    { key: "workload", label: "Workload", badge: metrics.overdueTasks },
    { key: "analytics", label: "Analytics" },
  ];
}

export function buildCounselorWorkloadAnalytics(snapshot = {}) {
  const metrics = buildCounselorPortalMetrics(snapshot);
  const students = buildPriorityStudentQueue(snapshot);

  const pressureScore = clamp(
    metrics.openTasks * 4 +
      metrics.overdueTasks * 8 +
      metrics.atRiskStudents * 9 +
      metrics.stalledStudents * 7 +
      metrics.supportQueue * 5 +
      metrics.criticalDocuments * 7 +
      metrics.blockedApplications * 6 +
      metrics.financeAttention * 6 +
      metrics.conversionReady * 3
  );

  const pressureLabel =
    pressureScore >= 78
      ? "High counselor pressure"
      : pressureScore >= 48
        ? "Moderate counselor pressure"
        : "Healthy workload";

  const recommendedFocus =
    metrics.overdueTasks > 0
      ? "Overdue task recovery"
      : metrics.atRiskStudents > 0
        ? "Student risk recovery"
        : metrics.stalledStudents > 0
          ? "Stalled student recovery"
          : metrics.criticalDocuments > 0
            ? "Document clearance"
            : metrics.financeOverdueInvoices > 0
              ? "Finance collection recovery"
              : metrics.financePendingReceipts > 0
                ? "Finance receipt follow-up"
                : metrics.conversionReady > 0
              ? "Conversion movement"
              : metrics.supportQueue > 0
                ? "Support response"
                : "Pipeline nurturing";

  return {
    ...metrics,
    pressureScore,
    pressureLabel,
    recommendedFocus,
    topRiskStudents: students.filter((student) => student.isAtRisk).slice(0, 5),
    topConversionStudents: students
      .filter((student) => student.isConversionReady)
      .slice(0, 5),
    stalledStudentsList: students.filter((student) => student.isStalled).slice(0, 5),
    executiveSummary: `${recommendedFocus} should be the counselor focus. Current load includes ${metrics.assignedStudents} assigned students, ${metrics.atRiskStudents} high-risk students, ${metrics.stalledStudents} stalled students, ${metrics.conversionReady} conversion-ready students, ${metrics.openTasks} open tasks, ${metrics.supportQueue} support items, ${metrics.criticalDocuments} critical document issues, and ${metrics.financeAttention} finance cases needing attention.`,
  };
}

export function buildCounselorPerformanceAnalytics(snapshot = {}) {
  const students = buildPriorityStudentQueue(snapshot);
  const applications = buildCounselorApplicationQueue(snapshot);
  const documents = buildCounselorDocumentQueue(snapshot);
  const tasks = buildCounselorTaskQueue(snapshot);
  const support = buildCounselorSupportQueue(snapshot);

  const activeStudents = students.filter((student) => student.stage !== "Not Started");
  const advancedStudents = students.filter(
    (student) => student.stageIndex >= getStageIndex("Offer Received")
  );
  const visaStudents = students.filter(
    (student) => student.stageIndex >= getStageIndex("Visa Pending")
  );

  const offersReceived = applications.filter((app) =>
    lower(app.offerStatus).includes("offer")
  ).length;

  const offersAccepted = applications.filter((app) =>
    lower(app.offerStatus).includes("accepted")
  ).length;

  const preEnrollmentValidated = applications.filter((app) => {
    const value = lower(app.preEnrollmentStatus);
    return value.includes("validated") || value.includes("completed");
  }).length;

  const conversionRate = students.length
    ? Math.round((advancedStudents.length / students.length) * 100)
    : 0;

  const visaProgressRate = students.length
    ? Math.round((visaStudents.length / students.length) * 100)
    : 0;

  const activationRate = students.length
    ? Math.round((activeStudents.length / students.length) * 100)
    : 0;

  const avgVelocity = students.length
    ? Math.round(
        students.reduce((sum, student) => sum + (student.velocityScore || 0), 0) /
          students.length
      )
    : 0;

  return {
    activationRate,
    conversionRate,
    visaProgressRate,
    avgVelocity,
    studentsManaged: students.length,
    applicationsManaged: applications.length,
    documentsManaged: documents.length,
    openTasks: tasks.length,
    openSupport: support.filter((item) => !isClosedStatus(item.status)).length,
    offersReceived,
    offersAccepted,
    preEnrollmentValidated,
    // Compatibility alias for older dashboard consumers.
    casIssued: preEnrollmentValidated,
    performanceGrade:
      conversionRate >= 65 && activationRate >= 80
        ? "Excellent"
        : conversionRate >= 45 && activationRate >= 65
          ? "Strong"
          : conversionRate >= 25
            ? "Developing"
            : "Needs Attention",
  };
}

export function buildCounselorExecutiveBrief(snapshot = {}) {
  const workload = buildCounselorWorkloadAnalytics(snapshot);
  const performance = buildCounselorPerformanceAnalytics(snapshot);

  return {
    generatedAt: nowIso(),
    headline: workload.pressureLabel,
    focus: workload.recommendedFocus,
    workload,
    performance,
    recommendedActions: [
      workload.overdueTasks > 0 && "Clear overdue task queue first.",
      workload.atRiskStudents > 0 &&
        "Call high-risk students and log timeline recovery action.",
      workload.stalledStudents > 0 &&
        "Recover stalled students with fresh counselor contact.",
      workload.criticalDocuments > 0 &&
        "Review critical documents before application movement.",
      workload.conversionReady > 0 && "Push offer/CAS/visa-ready students forward.",
      workload.supportQueue > 0 && "Respond to open support requests.",
    ].filter(Boolean),
  };
}

async function safeSelect(table, queryBuilder, fallback = []) {
  try {
    const baseQuery = supabase.from(table);
    const query = queryBuilder ? queryBuilder(baseQuery) : baseQuery.select("*");
    const { data, error } = await query;

    if (error) {
      console.warn(`Counselor Portal skipped ${table}:`, error.message);
      return fallback;
    }

    return safeArray(data);
  } catch (error) {
    console.warn(`Counselor Portal failed ${table}:`, error);
    return fallback;
  }
}

function buildAssignmentFilter(profile = {}) {
  const counselorId = profile.counselorId;
  const email = profile.email;
  const filters = [];

  if (counselorId) {
    filters.push(`assigned_counselor_id.eq.${counselorId}`);
    filters.push(`counselor_id.eq.${counselorId}`);
    filters.push(`assigned_to.eq.${counselorId}`);
    filters.push(`owner_id.eq.${counselorId}`);
  }

  if (email) {
    filters.push(`assigned_counselor_email.eq.${email}`);
    filters.push(`counselor_email.eq.${email}`);
    filters.push(`assigned_to_email.eq.${email}`);
  }

  return filters.join(",");
}

async function fetchAssignedStudents(profile) {
  const assignmentFilter = buildAssignmentFilter(profile);

  const inquiries = await safeSelect(COUNSELOR_TABLES.inquiries, (table) =>
    table.select("*").limit(500)
  );

  const locallyAssignedInquiries = inquiries.filter((record) =>
    isRecordAssignedToProfile(record, profile)
  );

  if (assignmentFilter) {
    const filteredStudents = await safeSelect(COUNSELOR_TABLES.students, (table) =>
      table.select("*").or(assignmentFilter).limit(250)
    );

    if (filteredStudents.length > 0 || locallyAssignedInquiries.length > 0) {
      return {
        records: mergeAssignedStudentRecords(
          filteredStudents,
          locallyAssignedInquiries.length > 0
            ? locallyAssignedInquiries
            : inquiries,
          {
            includeUnmatchedInquiries:
              locallyAssignedInquiries.length > 0,
          }
        ),
        scope: "assigned-students",
      };
    }
  }

  const students = await safeSelect(COUNSELOR_TABLES.students, (table) =>
    table.select("*").limit(250)
  );

  return {
    records: mergeAssignedStudentRecords(students, inquiries),
    scope: "fallback-all-students",
  };
}

function buildAssignedSnapshot(rawSnapshot = {}) {
  const students = safeArray(rawSnapshot.students);
  const assignedAppointments = filterToAssignedStudents(
    rawSnapshot.appointments,
    students
  );
  const visas = filterToAssignedStudents(rawSnapshot.visas, students);
  const assignedVisaIds = new Set(
    visas.map((visa) => normalizeKey(visa.id)).filter(Boolean)
  );
  const visaRequirements = safeArray(rawSnapshot.visaRequirements).filter((requirement) =>
    assignedVisaIds.has(normalizeKey(requirement.visa_id))
  );
  const visaEvents = safeArray(rawSnapshot.visaEvents).filter((event) =>
    assignedVisaIds.has(normalizeKey(event.visa_id))
  );

  return {
    ...rawSnapshot,
    students,
    applications: filterToAssignedStudents(rawSnapshot.applications, students),
    universities: filterToAssignedStudents(rawSnapshot.universities, students),
    universityRequirements: filterToAssignedStudents(
      rawSnapshot.universityRequirements,
      students
    ),
    universityEvents: filterToAssignedStudents(
      rawSnapshot.universityEvents,
      students
    ),
    visas,
    visaRequirements,
    visaEvents,
    invoices: filterFinanceToAssignedStudents(
      rawSnapshot.invoices,
      students,
      assignedAppointments
    ),
    payments: filterFinanceToAssignedStudents(
      rawSnapshot.payments,
      students,
      assignedAppointments
    ),
    receipts: filterFinanceToAssignedStudents(
      rawSnapshot.receipts,
      students,
      assignedAppointments
    ),
    paymentRequests: filterFinanceToAssignedStudents(
      rawSnapshot.paymentRequests,
      students,
      assignedAppointments
    ),
    paymentAccounts: safeArray(rawSnapshot.paymentAccounts).filter(
      (account) => account.is_active !== false
    ),
    documents: filterToAssignedStudents(rawSnapshot.documents, students),
    tasks: filterToAssignedStudents(rawSnapshot.tasks, students),
    support: filterToAssignedStudents(rawSnapshot.support, students),
    supportMessages: filterToAssignedStudents(rawSnapshot.supportMessages, students),
    portalAccounts: filterToAssignedStudents(rawSnapshot.portalAccounts, students),
    communications: filterToAssignedStudents(rawSnapshot.communications, students),
    appointments: assignedAppointments,
    timeline: filterToAssignedStudents(rawSnapshot.timeline, students),
  };
}

export async function fetchCounselorPortalSnapshot({ counselor } = {}) {
  const profile = normalizeCounselorProfile(counselor);
  const assigned = await fetchAssignedStudents(profile);
  const students = assigned.records;

  const [
    applicationsRaw,
    universitiesRaw,
    universityRequirementsRaw,
    universityEventsRaw,
    visasRaw,
    visaRequirementsRaw,
    visaEventsRaw,
    invoicesRaw,
    paymentsRaw,
    receiptsRaw,
    paymentRequestsRaw,
    paymentAccountsRaw,
    documentsRaw,
    tasksRaw,
    supportRaw,
    supportMessagesRaw,
    portalAccountsRaw,
    communicationsRaw,
    appointmentsRaw,
    timelineRaw,
  ] = await Promise.all([
    safeSelect(COUNSELOR_TABLES.applications, (table) => table.select("*").limit(500)),
    safeSelect(COUNSELOR_TABLES.universities, (table) => table.select("*").limit(500)),
    safeSelect(COUNSELOR_TABLES.universityRequirements, (table) =>
      table.select("*").limit(1000)
    ),
    safeSelect(COUNSELOR_TABLES.universityEvents, (table) =>
      table.select("*").order("created_at", { ascending: false }).limit(1500)
    ),
    safeSelect(COUNSELOR_TABLES.visas, (table) =>
      table.select("*").order("updated_at", { ascending: false }).limit(500)
    ),
    safeSelect(COUNSELOR_TABLES.visaRequirements, (table) =>
      table.select("*").limit(2000)
    ),
    safeSelect(COUNSELOR_TABLES.visaEvents, (table) =>
      table.select("*").order("created_at", { ascending: false }).limit(2000)
    ),
    safeSelect(COUNSELOR_TABLES.invoices, (table) =>
      table.select("*").order("created_at", { ascending: false }).limit(1000)
    ),
    safeSelect(COUNSELOR_TABLES.payments, (table) =>
      table.select("*").order("created_at", { ascending: false }).limit(1000)
    ),
    safeSelect(COUNSELOR_TABLES.receipts, (table) =>
      table.select("*").order("created_at", { ascending: false }).limit(1000)
    ),
    safeSelect(COUNSELOR_TABLES.paymentRequests, (table) =>
      table.select("*").order("created_at", { ascending: false }).limit(1000)
    ),
    safeSelect(COUNSELOR_TABLES.paymentAccounts, (table) =>
      table.select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(50)
    ),
    safeSelect(COUNSELOR_TABLES.documents, (table) => table.select("*").limit(500)),
    safeSelect(COUNSELOR_TABLES.tasks, (table) => table.select("*").limit(500)),
    safeSelect(COUNSELOR_TABLES.support, (table) => table.select("*").limit(300)),
    safeSelect(COUNSELOR_TABLES.supportMessages, (table) =>
      table.select("*").order("created_at", { ascending: true }).limit(1500)
    ),
    safeSelect(COUNSELOR_TABLES.portalAccounts, (table) => table.select("*").limit(500)),
    safeSelect(COUNSELOR_TABLES.communications, (table) => table.select("*").limit(500)),
    safeSelect(COUNSELOR_TABLES.appointments, (table) => table.select("*").limit(300)),
    safeSelect(COUNSELOR_TABLES.timeline, (table) => table.select("*").limit(500)),
  ]);

  const rawSnapshot = {
    loadedAt: nowIso(),
    counselor: profile,
    assignmentScope: assigned.scope,
    students,
    applications: applicationsRaw,
    universities: universitiesRaw,
    universityRequirements: universityRequirementsRaw,
    universityEvents: universityEventsRaw,
    visas: visasRaw,
    visaRequirements: visaRequirementsRaw,
    visaEvents: visaEventsRaw,
    invoices: invoicesRaw,
    payments: paymentsRaw,
    receipts: receiptsRaw,
    paymentRequests: paymentRequestsRaw,
    paymentAccounts: paymentAccountsRaw,
    documents: documentsRaw,
    tasks: tasksRaw,
    support: supportRaw,
    supportMessages: supportMessagesRaw,
    portalAccounts: portalAccountsRaw,
    communications: communicationsRaw,
    appointments: appointmentsRaw,
    timeline: timelineRaw,
    diagnostics: {
      rawApplications: applicationsRaw.length,
      rawUniversities: universitiesRaw.length,
      rawUniversityRequirements: universityRequirementsRaw.length,
      rawUniversityEvents: universityEventsRaw.length,
      rawVisas: visasRaw.length,
      rawVisaRequirements: visaRequirementsRaw.length,
      rawVisaEvents: visaEventsRaw.length,
      rawInvoices: invoicesRaw.length,
      rawPayments: paymentsRaw.length,
      rawReceipts: receiptsRaw.length,
      rawPaymentRequests: paymentRequestsRaw.length,
      rawPaymentAccounts: paymentAccountsRaw.length,
      rawDocuments: documentsRaw.length,
      rawTasks: tasksRaw.length,
      rawSupport: supportRaw.length,
      rawSupportMessages: supportMessagesRaw.length,
      rawPortalAccounts: portalAccountsRaw.length,
      rawCommunications: communicationsRaw.length,
      rawAppointments: appointmentsRaw.length,
      rawTimeline: timelineRaw.length,
    },
  };

  const snapshot = buildAssignedSnapshot(rawSnapshot);
  const priorityStudents = buildPriorityStudentQueue(snapshot);

  return {
    ...snapshot,
    priorityStudents,
    metrics: buildCounselorPortalMetrics(snapshot),
    workload: buildCounselorWorkloadAnalytics(snapshot),
    performance: buildCounselorPerformanceAnalytics(snapshot),
    executiveBrief: buildCounselorExecutiveBrief(snapshot),
  };
}

export async function createCounselorTask({
  studentId,
  studentType,
  studentName,
  title,
  description,
  category = "Counselor Follow-up",
  priority = "Normal",
  dueDate,
  counselor,
  metadata = {},
}) {
  const profile = normalizeCounselorProfile(counselor);

  if (!studentId) {
    throw new Error("A valid student id is required before creating a counselor task.");
  }

  const resolvedStudentType = (() => {
    const raw = lower(
      pickFirst(
        studentType,
        metadata?.studentType,
        metadata?.student_type,
        metadata?.recordType,
        metadata?.record_type,
        ""
      )
    );

    if (raw.includes("appointment")) return "appointment";
    if (raw.includes("inquiry")) return "inquiry";
    return raw || null;
  })();

  const resolvedTitle = safeString(title || "Counselor follow-up").trim();
  const resolvedDescription = safeString(
    description ||
      [
        resolvedTitle,
        category ? `Category: ${category}` : "",
        metadata?.nextMilestone ? `Next milestone: ${metadata.nextMilestone}` : "",
      ]
        .filter(Boolean)
        .join("\n")
  ).trim();

  const normalizedPriority = (() => {
    const value = lower(priority);
    if (value.includes("urgent") || value.includes("critical")) return "urgent";
    if (value.includes("high")) return "high";
    if (value.includes("low")) return "low";
    return "medium";
  })();

  const createdBy = profile.counselorId || profile.email || null;

  // Real student_tasks schema used across Zaifan Admin/Student OS:
  // student_id, student_type, title, description, priority, status, due_date, created_by.
  // Keep compatibility attempts, but NEVER report success when persistence failed.
  const canonicalPayload = cleanPayload({
    student_id: String(studentId),
    student_type: resolvedStudentType,
    title: resolvedTitle,
    description: resolvedDescription,
    priority: normalizedPriority,
    status: "pending",
    due_date: dueDate || null,
    created_by: createdBy,
  });

  const attempts = [
    canonicalPayload,
    cleanPayload({
      ...canonicalPayload,
      created_by: null,
    }),
    cleanPayload({
      student_id: String(studentId),
      student_type: resolvedStudentType,
      title: resolvedTitle,
      description: resolvedDescription,
      priority: normalizedPriority,
      status: "pending",
      due_date: dueDate || null,
    }),
    cleanPayload({
      student_id: String(studentId),
      title: resolvedTitle,
      description: resolvedDescription,
      priority: normalizedPriority,
      status: "pending",
      due_date: dueDate || null,
    }),
  ];

  const created = await insertWithFallback(
    COUNSELOR_TABLES.tasks,
    attempts,
    canonicalPayload
  );

  if (created?._local_fallback) {
    const detail = safeArray(created._write_errors).filter(Boolean).join(" | ");
    throw new Error(
      detail
        ? `Counselor task was not saved to student_tasks: ${detail}`
        : "Counselor task was not saved to student_tasks."
    );
  }

  return created;
}

export async function logCounselorCommunication({
  studentId,
  studentName,
  studentType = null,
  channel = "Note",
  subject = "Counselor Update",
  message,
  counselor,
  metadata = {},
}) {
  const profile = normalizeCounselorProfile(counselor);

  const resolvedStudentId = safeString(studentId).trim();
  if (!resolvedStudentId) {
    throw new Error("A valid student id is required before logging communication.");
  }

  const rawStudentType = lower(
    pickFirst(
      studentType,
      metadata?.studentType,
      metadata?.student_type,
      metadata?.recordType,
      metadata?.record_type,
      "inquiry"
    )
  );

  const resolvedStudentType = rawStudentType.includes("appointment")
    ? "appointment"
    : "inquiry";

  const originalChannel = safeString(channel || "Note").trim() || "Note";
  const channelKey = lower(originalChannel);

  // student_communications uses the same canonical channel values as Admin OS.
  // Counselor-only Note/Meeting records are stored as manual logs while the
  // original channel remains available in metadata for display/audit context.
  const resolvedChannel =
    channelKey.includes("whatsapp")
      ? "whatsapp"
      : channelKey.includes("email")
        ? "email"
        : channelKey.includes("call") || channelKey.includes("phone")
          ? "call"
          : channelKey.includes("sms")
            ? "sms"
            : channelKey.includes("portal") || channelKey.includes("support")
              ? "portal"
              : "manual";

  const resolvedSubject =
    safeString(subject || "Counselor Update").trim() || "Counselor Update";
  const resolvedMessage = safeString(message || "").trim();

  if (!resolvedMessage) {
    throw new Error("Communication message is required.");
  }

  const requestedDirection = lower(
    pickFirst(metadata?.direction, metadata?.message_direction, "")
  );

  const resolvedDirection =
    ["internal", "inbound", "outbound"].includes(requestedDirection)
      ? requestedDirection
      : channelKey === "note" ||
          channelKey === "notes" ||
          channelKey.includes("internal")
        ? "internal"
        : "outbound";

  const explicitStudentVisible =
    metadata?.studentVisible ?? metadata?.student_visible;

  const studentVisible =
    explicitStudentVisible !== undefined
      ? explicitStudentVisible === true ||
        String(explicitStudentVisible).toLowerCase() === "true"
      : resolvedDirection !== "internal";

  const resolvedVisibility = lower(
    pickFirst(
      metadata?.visibility,
      metadata?.audience,
      studentVisible ? "student_safe" : "staff_only"
    )
  );

  const now = nowIso();

  // IMPORTANT: This payload intentionally mirrors Admin CommunicationCenterPanel.
  // Real student_communications schema does NOT contain student_name as a column,
  // and the status check constraint expects lowercase values such as "logged".
  const payload = cleanPayload({
    student_id: resolvedStudentId,
    student_type: resolvedStudentType,
    channel: resolvedChannel,
    direction: resolvedDirection,
    subject: resolvedSubject,
    message: resolvedMessage,
    status: "logged",
    source: "manual",
    sent_at: resolvedDirection === "outbound" ? now : null,
    metadata: {
      ...metadata,
      student_name: studentName || null,
      studentType: resolvedStudentType,
      student_type: resolvedStudentType,
      originalChannel,
      selectedChannel: originalChannel,
      direction: resolvedDirection,
      visibility: resolvedVisibility,
      studentVisible,
      student_visible: studentVisible,
      counselor: profile,
      created_from: "counselor_communication_hub",
      source: "Counselor Portal OS",
    },
  });

  const { data, error } = await supabase
    .from(COUNSELOR_TABLES.communications)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      error?.message || "Counselor communication could not be saved."
    );
  }

  return data;
}

export async function writeCounselorTimelineEvent({
  studentId,
  studentName,
  eventType = "counselor_event",
  title,
  description,
  counselor,
  metadata = {},
}) {
  const profile = normalizeCounselorProfile(counselor);

  const notes = [
    title || "Counselor Event",
    description || "",
    eventType ? `Type: ${eventType}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const attempts = [
    {
      student_id: studentId,
      student_name: studentName,
      event_type: eventType,
      title,
      description,
      metadata: {
        ...metadata,
        counselor: profile,
        source: "Counselor Portal OS",
      },
      created_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      type: eventType,
      title,
      description,
      created_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      title,
      notes,
      created_at: nowIso(),
    },
    {
      student_id: studentId,
      notes,
      created_at: nowIso(),
    },
    {
      student_id: studentId,
    },
  ];

  return insertWithFallback(COUNSELOR_TABLES.timeline, attempts, {
    student_id: studentId,
    student_name: studentName,
    event_type: eventType,
    title,
    description,
    notes,
    created_at: nowIso(),
  });
}


export async function writeCounselorVisaEvent({
  visaId,
  studentId,
  studentType = "inquiry",
  applicationId = null,
  eventType = "counselor_review",
  eventLabel = "Visa case reviewed by counselor",
  reason = "",
  counselor,
  metadata = {},
}) {
  const profile = normalizeCounselorProfile(counselor);
  const createdAt = nowIso();
  const normalizedStudentType = lower(studentType) === "appointment" ? "appointment" : "inquiry";
  const eventMetadata = {
    ...metadata,
    counselorId: profile.counselorId || profile.email || null,
    counselorName: profile.fullName || profile.name || profile.email || "Counselor",
    actionSource: "Counselor Visa OS",
  };

  const attempts = [
    {
      student_id: studentId || null,
      student_type: normalizedStudentType,
      visa_id: visaId || null,
      application_id: applicationId || null,
      event_type: eventType,
      event_label: eventLabel,
      reason,
      metadata: eventMetadata,
      created_at: createdAt,
    },
    {
      student_id: studentId || null,
      student_type: normalizedStudentType,
      visa_id: visaId || null,
      application_id: applicationId || null,
      event_type: eventType,
      event_label: eventLabel,
      reason,
      metadata: eventMetadata,
    },
    {
      visa_id: visaId || null,
      application_id: applicationId || null,
      event_type: eventType,
      event_label: eventLabel,
      reason,
      metadata: eventMetadata,
    },
    {
      visa_id: visaId || null,
      event_type: eventType,
      event_label: eventLabel,
      reason,
    },
  ];

  return insertWithFallback(COUNSELOR_TABLES.visaEvents, attempts, attempts[0]);
}

export async function replyCounselorSupportRequest({
  supportId,
  studentId,
  studentName,
  response,
  counselor,
  close = false,
}) {
  const profile = normalizeCounselorProfile(counselor);
  const status = close ? "resolved" : "responded";

  const updated = await updateByIdWithFallback(
    COUNSELOR_TABLES.support,
    supportId,
    [
      {
        status,
        counselor_response: response,
        responded_by: profile.counselorId || profile.email || null,
        responded_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        status,
        response,
        responded_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        status,
        notes: response,
        updated_at: nowIso(),
      },
      {
        status,
        updated_at: nowIso(),
      },
      {
        status,
      },
    ],
    {
      status,
      counselor_response: response,
      updated_at: nowIso(),
    }
  );

  const messageStudentId = studentId || updated.student_id;
  const messageStudentType = pickFirst(
    updated.student_type,
    updated.record_type,
    updated.source_type,
    "inquiry"
  );

  await insertWithFallback(
    COUNSELOR_TABLES.supportMessages,
    [
      {
        support_request_id: supportId,
        student_id: messageStudentId,
        student_type: messageStudentType,
        sender_type: "counselor",
        sender_name: profile.displayName || profile.email || "Counselor",
        message: response,
        is_internal: false,
        created_at: nowIso(),
      },
      {
        support_request_id: supportId,
        student_id: messageStudentId,
        sender_type: "counselor",
        sender_name: profile.displayName || profile.email || "Counselor",
        message: response,
        is_internal: false,
        created_at: nowIso(),
      },
      {
        support_request_id: supportId,
        student_id: messageStudentId,
        sender_type: "counselor",
        message: response,
        created_at: nowIso(),
      },
    ],
    {
      support_request_id: supportId,
      student_id: messageStudentId,
      sender_type: "counselor",
      sender_name: profile.displayName || profile.email || "Counselor",
      message: response,
      is_internal: false,
      created_at: nowIso(),
    }
  );

  await logCounselorCommunication({
    studentId: studentId || updated.student_id,
    studentName: studentName || updated.student_name,
    channel: "Support",
    subject: close ? "Support request resolved" : "Support request response",
    message: response,
    counselor,
    metadata: { supportId, close },
  }).catch((error) =>
    console.warn("Support communication log skipped:", error.message)
  );

  await writeCounselorTimelineEvent({
    studentId: studentId || updated.student_id,
    studentName: studentName || updated.student_name,
    eventType: close ? "support_resolved" : "support_response",
    title: close ? "Support request resolved" : "Support response sent",
    description: response,
    counselor,
    metadata: { supportId, close },
  }).catch((error) =>
    console.warn("Support timeline log skipped:", error.message)
  );

  return updated;
}

export async function resolveCounselorSupportRequest({
  supportId,
  response,
  counselor,
  status = "resolved",
}) {
  return replyCounselorSupportRequest({
    supportId,
    response:
      response ||
      "Resolved from Counselor Portal OS. Counselor reviewed and closed this support item.",
    counselor,
    close: status === "resolved",
  });
}

export async function updateCounselorTaskStatus({
  taskId,
  status = "Completed",
  notes = "",
  counselor,
}) {
  const closed = isClosedStatus(status);

  const updated = await updateByIdWithFallback(
    COUNSELOR_TABLES.tasks,
    taskId,
    [
      {
        status,
        notes,
        completed_at: closed ? nowIso() : null,
        updated_at: nowIso(),
      },
      {
        task_status: status,
        notes,
        updated_at: nowIso(),
      },
      {
        status,
        updated_at: nowIso(),
      },
      {
        status,
      },
      {
        task_status: status,
      },
    ],
    {
      status,
      notes,
      updated_at: nowIso(),
    }
  );

  await writeCounselorTimelineEvent({
    studentId: updated.student_id,
    studentName: updated.student_name,
    eventType: "task_status_updated",
    title: `Counselor task ${status}`,
    description: notes || updated.title || "Counselor task updated",
    counselor,
    metadata: { taskId, status },
  }).catch((error) =>
    console.warn("Task timeline log skipped:", error.message)
  );

  return updated;
}

export async function recordCounselorAppointmentOutcome({
  appointmentId,
  studentId,
  studentName,
  outcome,
  followUpRequired = false,
  counselor,
}) {
  const profile = normalizeCounselorProfile(counselor);

  const updated = await updateByIdWithFallback(
    COUNSELOR_TABLES.appointments,
    appointmentId,
    [
      {
        status: "completed",
        outcome_notes: outcome,
        follow_up_required: followUpRequired,
        completed_by: profile.counselorId || profile.email || null,
        completed_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        status: "completed",
        outcome,
        follow_up_required: followUpRequired,
        completed_at: nowIso(),
        updated_at: nowIso(),
      },
      {
        status: "completed",
        notes: outcome,
        updated_at: nowIso(),
      },
      {
        status: "completed",
        updated_at: nowIso(),
      },
      {
        status: "completed",
      },
    ],
    {
      status: "completed",
      outcome_notes: outcome,
      follow_up_required: followUpRequired,
      updated_at: nowIso(),
    }
  );

  await logCounselorCommunication({
    studentId: studentId || updated.student_id,
    studentName: studentName || getStudentName(updated),
    channel: "Appointment",
    subject: "Appointment outcome recorded",
    message: outcome,
    counselor,
    metadata: { appointmentId, followUpRequired },
  }).catch((error) =>
    console.warn("Appointment communication skipped:", error.message)
  );

  await writeCounselorTimelineEvent({
    studentId: studentId || updated.student_id,
    studentName: studentName || getStudentName(updated),
    eventType: "appointment_outcome",
    title: "Appointment outcome recorded",
    description: outcome,
    counselor,
    metadata: { appointmentId, followUpRequired },
  }).catch((error) =>
    console.warn("Appointment timeline skipped:", error.message)
  );

  if (followUpRequired) {
    await createCounselorTask({
      studentId: studentId || updated.student_id,
      studentName: studentName || getStudentName(updated),
      title: "Appointment follow-up required",
      category: "Appointment Follow-up",
      priority: "High",
      counselor,
      metadata: { appointmentId, outcome },
    }).catch((error) =>
      console.warn("Appointment follow-up task skipped:", error.message)
    );
  }

  return updated;
}

export async function createCounselorFollowUpTask({
  studentId,
  studentName,
  source = "Counselor Follow Up",
  priority = "Normal",
  counselor,
  metadata = {},
}) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);

  const task = await createCounselorTask({
    studentId,
    studentName,
    title: `Follow-up Required • ${source}`,
    category: "Follow Up",
    priority,
    dueDate: dueDate.toISOString(),
    counselor,
    metadata: {
      ...metadata,
      auto_created: true,
      workflow_source: source,
      generated_by: "Counselor Automation Engine",
    },
  });

  await writeCounselorTimelineEvent({
    studentId,
    studentName,
    eventType: "followup_task_created",
    title: "Automatic Follow-up Task Created",
    description: `System generated follow-up task from ${source}.`,
    counselor,
    metadata: {
      taskId: task?.id,
      source,
    },
  }).catch(() => {});

  return task;
}

export async function logCounselorCallOutcome({
  studentId,
  studentName,
  outcome,
  counselor,
  createFollowUp = false,
}) {
  await logCounselorCommunication({
    studentId,
    studentName,
    channel: "Call",
    subject: "Counselor Call Outcome",
    message: outcome,
    counselor,
    metadata: {
      source: "Counselor Call Outcome",
    },
  });

  await writeCounselorTimelineEvent({
    studentId,
    studentName,
    eventType: "call_outcome",
    title: "Counselor Call Logged",
    description: outcome,
    counselor,
  }).catch(() => {});

  if (createFollowUp) {
    await createCounselorFollowUpTask({
      studentId,
      studentName,
      source: "Call Outcome",
      priority: "High",
      counselor,
    }).catch(() => {});
  }

  return true;
}

export async function quickResolveSupportRequest({
  supportId,
  studentId,
  studentName,
  counselor,
}) {
  return replyCounselorSupportRequest({
    supportId,
    studentId,
    studentName,
    response:
      "Request reviewed, guidance provided, and issue resolved by assigned counselor.",
    counselor,
    close: true,
  });
}

export async function createAppointmentFollowUp({
  appointmentId,
  studentId,
  studentName,
  outcome,
  counselor,
}) {
  const task = await createCounselorTask({
    studentId,
    studentName,
    title: "Appointment Follow-up Required",
    category: "Appointment",
    priority: "High",
    counselor,
    metadata: {
      appointmentId,
      appointment_followup: true,
      outcome,
    },
  });

  await writeCounselorTimelineEvent({
    studentId,
    studentName,
    eventType: "appointment_followup_created",
    title: "Appointment Follow-up Created",
    description: outcome,
    counselor,
    metadata: {
      appointmentId,
      taskId: task?.id,
    },
  }).catch(() => {});

  return task;
}

export async function createCounselorRecoveryWorkflow({
  studentId,
  studentName,
  riskScore = 0,
  counselor,
}) {
  const priority =
    riskScore >= 85 ? "Urgent" : riskScore >= 70 ? "High" : "Normal";

  const task = await createCounselorTask({
    studentId,
    studentName,
    title: "Student Recovery Workflow",
    category: "Risk Recovery",
    priority,
    counselor,
    metadata: {
      riskScore,
      generated_by: "Recovery Engine",
    },
  });

  await logCounselorCommunication({
    studentId,
    studentName,
    channel: "Recovery",
    subject: "Recovery Workflow Started",
    message:
      "Automatic recovery workflow initiated due to elevated risk score.",
    counselor,
  }).catch(() => {});

  await writeCounselorTimelineEvent({
    studentId,
    studentName,
    eventType: "risk_recovery_started",
    title: "Risk Recovery Started",
    description: `Recovery workflow initiated. Risk score ${riskScore}.`,
    counselor,
    metadata: {
      riskScore,
      taskId: task?.id,
    },
  }).catch(() => {});

  return task;
}

export async function createConversionAccelerationWorkflow({
  studentId,
  studentName,
  stage,
  counselor,
}) {
  const task = await createCounselorTask({
    studentId,
    studentName,
    title: `Conversion Movement • ${stage}`,
    category: "Conversion",
    priority: "High",
    counselor,
    metadata: {
      stage,
      generated_by: "Conversion Engine",
    },
  });

  await writeCounselorTimelineEvent({
    studentId,
    studentName,
    eventType: "conversion_acceleration",
    title: "Conversion Workflow Started",
    description: `Student entered conversion acceleration workflow (${stage}).`,
    counselor,
    metadata: {
      stage,
      taskId: task?.id,
    },
  }).catch(() => {});

  return task;
}

export async function executeCounselorStudentReview({
  student,
  counselor,
}) {
  const riskScore = student.riskScore || 0;
  const opportunityScore = student.opportunityScore || 0;
  const stalledDays = student.stalledDays || 0;

  const actions = [];

  if (riskScore >= 80) {
    await createCounselorRecoveryWorkflow({
      studentId: student.id,
      studentName: student.name,
      riskScore,
      counselor,
    });

    actions.push("risk_recovery");
  }

  if (opportunityScore >= 75) {
    await createConversionAccelerationWorkflow({
      studentId: student.id,
      studentName: student.name,
      stage: student.stage,
      counselor,
    });

    actions.push("conversion");
  }

  if (stalledDays >= 14) {
    await createCounselorFollowUpTask({
      studentId: student.id,
      studentName: student.name,
      source: "Stalled Student Recovery",
      priority: "High",
      counselor,
    });

    actions.push("stalled_recovery");
  }

  await writeCounselorTimelineEvent({
    studentId: student.id,
    studentName: student.name,
    eventType: "executive_review",
    title: "Counselor Student Review",
    description: `Automatic review completed. ${actions.length} workflows triggered.`,
    counselor,
    metadata: {
      riskScore,
      opportunityScore,
      stalledDays,
      actions,
    },
  });

  return actions;
}

export async function executeCounselorDailySweep({
  snapshot,
  counselor,
}) {
  const students = buildPriorityStudentQueue(snapshot);
  const results = [];

  for (const student of students.slice(0, 25)) {
    try {
      const triggered = await executeCounselorStudentReview({
        student,
        counselor,
      });

      results.push({
        studentId: student.id,
        studentName: student.name,
        triggered,
      });
    } catch (error) {
      console.error("Daily counselor sweep failed", student.name, error);
    }
  }

  return results;
}

export async function executeSupportRecoverySweep({
  snapshot,
  counselor,
}) {
  const supportItems = buildCounselorSupportQueue(snapshot);

  const unresolved = supportItems.filter(
    (item) => item.status !== "resolved" && item.status !== "closed"
  );

  for (const item of unresolved) {
    await writeCounselorTimelineEvent({
      studentId: item.student_id,
      studentName: item.studentName,
      eventType: "support_review",
      title: "Support Queue Review",
      description: "Support request included in recovery sweep.",
      counselor,
      metadata: {
        supportId: item.id,
      },
    }).catch(() => {});
  }

  return unresolved.length;
}

export async function executeAppointmentRecoverySweep({
  snapshot,
  counselor,
}) {
  const appointments = buildCounselorAppointmentsQueue(snapshot);

  const missed = appointments.filter(
    (appointment) => appointment.isPast && appointment.status !== "completed"
  );

  for (const appointment of missed) {
    await createAppointmentFollowUp({
      appointmentId: appointment.id,
      studentId: appointment.student_id,
      studentName: appointment.studentName,
      outcome: "Appointment requires follow-up review.",
      counselor,
    }).catch(() => {});
  }

  return missed.length;
}

export default {
  normalizeCounselorProfile,
  formatRelativeTime,
  inferJourneyStage,
  getStageIndex,
  calculateStudentVelocity,
  calculateStalledDays,
  calculateStudentRiskScore,
  calculateOpportunityScore,
  getNextMilestone,
  getNextBestCounselorAction,
  buildPriorityStudentQueue,
  buildCounselorApplicationQueue,
  buildCounselorUniversityQueue,
  buildCounselorVisaQueue,
  buildCounselorFinanceQueue,
  buildCounselorDocumentQueue,
  buildCounselorTaskQueue,
  buildCounselorSupportQueue,
  buildCounselorCommunicationHub,
  buildCounselorAppointmentsQueue,
  buildCounselorPortalMetrics,
  buildCounselorNavigation,
  buildCounselorWorkloadAnalytics,
  buildCounselorPerformanceAnalytics,
  buildCounselorExecutiveBrief,
  fetchCounselorPortalSnapshot,
  createCounselorTask,
  logCounselorCommunication,
  writeCounselorTimelineEvent,
  writeCounselorVisaEvent,
  replyCounselorSupportRequest,
  resolveCounselorSupportRequest,
  updateCounselorTaskStatus,
  recordCounselorAppointmentOutcome,
  createCounselorFollowUpTask,
  logCounselorCallOutcome,
  quickResolveSupportRequest,
  createAppointmentFollowUp,
  createCounselorRecoveryWorkflow,
  createConversionAccelerationWorkflow,
  executeCounselorStudentReview,
  executeCounselorDailySweep,
  executeSupportRecoverySweep,
  executeAppointmentRecoverySweep,
};