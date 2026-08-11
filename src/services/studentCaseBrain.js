// Zaifan Student Case Brain V1
// Canonical, read-only Student 360 context shared by every student-level AI surface.
// It never mutates CRM data and never invents missing facts.

const CASE_BRAIN_VERSION = "student360-v1";
const MAX_ROWS_PER_SECTION = 80;
const MAX_STRING_LENGTH = 2400;
const MAX_OBJECT_KEYS = 80;

function normalize(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function safeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function safeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function trimString(value) {
  const text = String(value ?? "");
  return text.length > MAX_STRING_LENGTH
    ? `${text.slice(0, MAX_STRING_LENGTH)}…`
    : text;
}

function compactValue(value, depth = 0) {
  if (value === null || value === undefined) return value ?? null;

  if (typeof value === "string") return trimString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "function") return undefined;

  if (depth >= 4) {
    if (Array.isArray(value)) return `[${value.length} items]`;
    return "[nested object]";
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ROWS_PER_SECTION)
      .map((item) => compactValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const output = {};
    Object.entries(value)
      .slice(0, MAX_OBJECT_KEYS)
      .forEach(([key, item]) => {
        const compacted = compactValue(item, depth + 1);
        if (compacted !== undefined) output[key] = compacted;
      });
    return output;
  }

  return trimString(value);
}

function capRows(value) {
  return asArray(value)
    .slice(0, MAX_ROWS_PER_SECTION)
    .map((item) => compactValue(item));
}

function getName(student = {}) {
  return (
    student.full_name ||
    student.name ||
    student.student_name ||
    "Unknown Student"
  );
}

function getProgram(student = {}) {
  return (
    student.field_of_interest ||
    student.course ||
    student.program ||
    student.study_field ||
    student.consultation_type ||
    ""
  );
}

function getCountry(student = {}) {
  return (
    student.country ||
    student.country_interest ||
    student.preferred_country ||
    student.destination_country ||
    ""
  );
}

function statusOf(record = {}) {
  return normalize(
    record.status ||
      record.state ||
      record.application_status ||
      record.visa_status ||
      record.payment_status ||
      record.request_status ||
      ""
  );
}

function countByStatus(rows = []) {
  return asArray(rows).reduce((accumulator, row) => {
    const key = statusOf(row) || "unknown";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function newest(rows = []) {
  return [...asArray(rows)].sort((a, b) => {
    const bTime = new Date(
      b?.updated_at || b?.created_at || b?.sent_at || b?.date || 0
    ).getTime();
    const aTime = new Date(
      a?.updated_at || a?.created_at || a?.sent_at || a?.date || 0
    ).getTime();
    return (Number.isFinite(bTime) ? bTime : 0) -
      (Number.isFinite(aTime) ? aTime : 0);
  })[0] || null;
}

function isClosedStatus(value) {
  const status = normalize(value);
  return [
    "done",
    "completed",
    "resolved",
    "closed",
    "cancelled",
    "canceled",
    "archived",
    "paid",
    "approved",
  ].includes(status);
}

function buildDocumentSummary(documents, documentRequirements) {
  const rows = asArray(documents);
  const requirements = asArray(documentRequirements);

  const verified = rows.filter((item) =>
    ["verified", "approved", "cleared", "accepted"].includes(statusOf(item))
  ).length;
  const rejected = rows.filter((item) =>
    ["rejected", "declined"].includes(statusOf(item))
  ).length;
  const pending = rows.filter((item) =>
    ["pending", "uploaded", "submitted", "under_review", "review"].includes(
      statusOf(item)
    )
  ).length;

  const openRequirements = requirements.filter(
    (item) => !isClosedStatus(item.status) && normalize(item.status) !== "inactive"
  ).length;

  return {
    totalDocuments: rows.length,
    verified,
    pending,
    rejected,
    totalDocumentRequirements: requirements.length,
    openDocumentRequirements: openRequirements,
  };
}

function buildTaskSummary(tasks) {
  const rows = asArray(tasks);
  const now = Date.now();
  let overdue = 0;
  let open = 0;
  let done = 0;

  rows.forEach((item) => {
    const status = statusOf(item);
    const closed = isClosedStatus(status);
    if (closed) {
      done += 1;
      return;
    }

    open += 1;
    const due = item.due_date || item.due_at || item.deadline || null;
    if (due) {
      const dueTime = new Date(due).getTime();
      if (Number.isFinite(dueTime) && dueTime < now) overdue += 1;
    }
  });

  return { total: rows.length, open, done, overdue };
}

function buildFinanceSummary({ invoices, payments, receipts, paymentRequests }) {
  const invoiceRows = asArray(invoices);
  const paymentRows = asArray(payments);
  const receiptRows = asArray(receipts);
  const requestRows = asArray(paymentRequests);

  return {
    invoices: invoiceRows.length,
    invoiceStatuses: countByStatus(invoiceRows),
    payments: paymentRows.length,
    paymentStatuses: countByStatus(paymentRows),
    receipts: receiptRows.length,
    receiptStatuses: countByStatus(receiptRows),
    paymentRequests: requestRows.length,
    paymentRequestStatuses: countByStatus(requestRows),
  };
}

function buildSupportSummary(supportRequests, supportMessages) {
  const requests = asArray(supportRequests);
  const open = requests.filter((item) => !isClosedStatus(item.status)).length;

  return {
    requests: requests.length,
    openRequests: open,
    requestStatuses: countByStatus(requests),
    conversationMessages: asArray(supportMessages).length,
    latestRequest: compactValue(newest(requests)),
  };
}

function buildVisaSummary(visaCases, visaRequirements, visaEvents) {
  const cases = asArray(visaCases);
  const requirements = asArray(visaRequirements);
  const activeCase =
    cases.find((item) => item?.is_archived !== true && item?.is_archived !== "true") ||
    newest(cases);

  const openRequirements = requirements.filter((item) => {
    const status = normalize(item.status);
    return !["verified", "approved", "complete", "completed", "cleared"].includes(
      status
    );
  }).length;

  return {
    cases: cases.length,
    activeCase: compactValue(activeCase),
    visaStatus: safeText(activeCase?.visa_status || activeCase?.status),
    visaStage: safeText(activeCase?.visa_stage || activeCase?.stage),
    riskLevel: safeText(activeCase?.risk_level),
    requirements: requirements.length,
    openRequirements,
    events: asArray(visaEvents).length,
  };
}

function buildCommunicationSummary(communications) {
  const rows = asArray(communications);
  const latest = newest(rows);

  const internal = rows.filter((item) => {
    const metadata = asObject(item.metadata);
    const direction = normalize(item.direction || metadata.direction);
    const visibility = normalize(metadata.visibility || item.visibility);
    return (
      direction === "internal" ||
      ["staff_only", "internal", "private"].includes(visibility) ||
      metadata.studentVisible === false ||
      metadata.student_visible === false
    );
  }).length;

  return {
    total: rows.length,
    internal,
    studentFacing: Math.max(0, rows.length - internal),
    channels: rows.reduce((accumulator, item) => {
      const key = normalize(item.channel || "manual") || "manual";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {}),
    latest: compactValue(latest),
  };
}

function buildDataGaps(student, sections) {
  const gaps = [];

  if (!safeText(student.email)) gaps.push("Student email is missing");
  if (!safeText(student.phone || student.phone_number || student.whatsapp)) {
    gaps.push("Student phone/WhatsApp is missing");
  }
  if (!getCountry(student)) gaps.push("Country interest is missing");
  if (!getProgram(student)) gaps.push("Program/field interest is missing");
  if (!safeText(student.study_level || student.level)) gaps.push("Study level is missing");
  if (!safeText(student.academic_score || student.cgpa || student.marks || student.percentage)) {
    gaps.push("Academic score/CGPA is missing");
  }
  if (!safeText(student.ielts_score || student.english_score || student.pte_score || student.duolingo_score)) {
    gaps.push("English-language score is missing");
  }
  if (!safeText(student.budget || student.budget_range)) gaps.push("Budget is missing");
  if (!safeText(student.intake || student.preferred_intake)) gaps.push("Preferred intake is missing");

  if (!sections.documents.length) gaps.push("No student documents are recorded");
  if (!sections.applications.length) gaps.push("No student application is recorded");
  if (!sections.universities.length) gaps.push("No university shortlist is recorded");

  return gaps;
}

export function buildStudentCaseBrain({
  student = {},
  studentType = "inquiry",
  personId = null,
  application = null,
  applications = [],
  documents = [],
  documentRequirements = [],
  universities = [],
  universityRequirements = [],
  universityEvents = [],
  applicationRequirements = [],
  applicationEvents = [],
  tasks = [],
  communications = [],
  invoices = [],
  payments = [],
  receipts = [],
  paymentRequests = [],
  supportRequests = [],
  supportMessages = [],
  visaCases = [],
  visaRequirements = [],
  visaEvents = [],
  followUps = [],
  crmTimeline = [],
  applicationTimeline = [],
  portalAccount = null,
  sourceHealth = {},
} = {}) {
  const safeStudent = asObject(student);
  const applicationRows = asArray(applications).length
    ? asArray(applications)
    : application
      ? [application]
      : [];

  const sections = {
    applications: capRows(applicationRows),
    documents: capRows(documents),
    documentRequirements: capRows(documentRequirements),
    universities: capRows(universities),
    universityRequirements: capRows(universityRequirements),
    universityEvents: capRows(universityEvents),
    applicationRequirements: capRows(applicationRequirements),
    applicationEvents: capRows(applicationEvents),
    tasks: capRows(tasks),
    communications: capRows(communications),
    invoices: capRows(invoices),
    payments: capRows(payments),
    receipts: capRows(receipts),
    paymentRequests: capRows(paymentRequests),
    supportRequests: capRows(supportRequests),
    supportMessages: capRows(supportMessages),
    visaCases: capRows(visaCases),
    visaRequirements: capRows(visaRequirements),
    visaEvents: capRows(visaEvents),
    followUps: capRows(followUps),
    crmTimeline: capRows(crmTimeline),
    applicationTimeline: capRows(applicationTimeline),
  };

  const latestApplication = newest(applicationRows) || application || null;
  const latestUniversity = newest(universities);
  const latestFollowUp = newest(followUps);

  const brain = {
    version: CASE_BRAIN_VERSION,
    generatedAt: new Date().toISOString(),
    identity: {
      studentId: safeStudent.id ?? safeStudent.student_id ?? null,
      studentType: normalize(studentType || safeStudent.student_type || safeStudent.type || "inquiry"),
      personId: personId || safeStudent.person_id || null,
      name: getName(safeStudent),
      email: safeText(safeStudent.email),
      phone: safeText(
        safeStudent.phone ||
          safeStudent.phone_number ||
          safeStudent.whatsapp ||
          safeStudent.contact_number
      ),
    },
    profile: compactValue(safeStudent),
    caseSnapshot: {
      country: getCountry(safeStudent),
      program: getProgram(safeStudent),
      studyLevel: safeText(safeStudent.study_level || safeStudent.level),
      status: safeText(
        safeStudent.status ||
          safeStudent.appointment_stage ||
          safeStudent.pipeline_stage ||
          safeStudent.stage
      ),
      priority: safeText(safeStudent.priority),
      intake: safeText(safeStudent.intake || safeStudent.preferred_intake),
      budget: safeText(safeStudent.budget || safeStudent.budget_range),
      academicScore: safeText(
        safeStudent.academic_score ||
          safeStudent.cgpa ||
          safeStudent.marks ||
          safeStudent.percentage
      ),
      englishScore: safeText(
        safeStudent.ielts_score ||
          safeStudent.english_score ||
          safeStudent.pte_score ||
          safeStudent.duolingo_score
      ),
      latestApplication: compactValue(latestApplication),
      latestUniversity: compactValue(latestUniversity),
      latestFollowUp: compactValue(latestFollowUp),
      portal: portalAccount
        ? {
            exists: true,
            isActive: Boolean(portalAccount.is_active),
            mustChangePassword: Boolean(portalAccount.must_change_password),
            lastLoginAt: safeDate(
              portalAccount.last_login_at || portalAccount.last_login
            ),
          }
        : { exists: false, isActive: false },
    },
    summaries: {
      documents: buildDocumentSummary(documents, documentRequirements),
      tasks: buildTaskSummary(tasks),
      communications: buildCommunicationSummary(communications),
      finance: buildFinanceSummary({
        invoices,
        payments,
        receipts,
        paymentRequests,
      }),
      support: buildSupportSummary(supportRequests, supportMessages),
      visa: buildVisaSummary(visaCases, visaRequirements, visaEvents),
    },
    sections,
    dataGaps: [],
    sourceHealth: compactValue(sourceHealth),
    dataSummary: {
      applications: sections.applications.length,
      documents: sections.documents.length,
      documentRequirements: sections.documentRequirements.length,
      universities: sections.universities.length,
      universityRequirements: sections.universityRequirements.length,
      applicationRequirements: sections.applicationRequirements.length,
      tasks: sections.tasks.length,
      communications: sections.communications.length,
      invoices: sections.invoices.length,
      payments: sections.payments.length,
      receipts: sections.receipts.length,
      paymentRequests: sections.paymentRequests.length,
      supportRequests: sections.supportRequests.length,
      supportMessages: sections.supportMessages.length,
      visaCases: sections.visaCases.length,
      visaRequirements: sections.visaRequirements.length,
      followUps: sections.followUps.length,
      timelineEvents: sections.crmTimeline.length + sections.applicationTimeline.length,
    },
  };

  brain.dataGaps = buildDataGaps(safeStudent, sections);
  return brain;
}

export function getStudentCaseBrainPromptContext(caseBrain = {}) {
  const safeBrain = asObject(caseBrain);
  return compactValue(safeBrain);
}

export { CASE_BRAIN_VERSION };
