import { supabase } from "./supabaseClient";

const COUNSELOR_TABLES = {
  students: "students",
  inquiries: "inquiries",
  appointments: "appointments",
  assignments: "lead_assignments",
  applications: "student_applications",
  universities: "student_universities",
  documents: "student_documents",
  tasks: "student_tasks",
  support: "student_support_requests",
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

const WRITE_TIMEOUT_MS = 12000;

async function withWriteTimeout(promise, label = "Counselor write") {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${WRITE_TIMEOUT_MS}ms.`)),
      WRITE_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
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
    record.person_id,
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

function cleanPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== undefined
    )
  );
}

function buildWriteError(table, operation, errors = []) {
  const detail = errors.filter(Boolean).join(" | ");
  const error = new Error(
    detail
      ? `${operation} failed for ${table}. ${detail}`
      : `${operation} failed for ${table}. No row was returned. Check RLS, table schema, and record access.`
  );

  error.name = "CounselorPortalWriteError";
  error.table = table;
  error.operation = operation;
  error.causes = [...errors];

  return error;
}

async function insertWithFallback(table, attempts = []) {
  const errors = [];

  for (const payload of attempts.map(cleanPayload)) {
    if (!Object.keys(payload).length) continue;

    try {
      const { data, error } = await withWriteTimeout(
        supabase.from(table).insert(payload).select().maybeSingle(),
        `${table} insert`
      );

      if (!error && data) return data;

      const message =
        error?.message ||
        "Insert returned no row. The write may be blocked by RLS or a schema mismatch.";

      errors.push(message);
      console.warn(`${table} insert attempt skipped:`, message);
    } catch (error) {
      const message = error?.message || String(error);
      errors.push(message);
      console.warn(`${table} insert attempt failed:`, message);
    }
  }

  throw buildWriteError(table, "Insert", errors);
}

async function updateByIdWithFallback(table, id, attempts = []) {
  if (id === null || id === undefined || String(id).trim() === "") {
    throw buildWriteError(table, "Update", ["A valid record id is required."]);
  }

  const errors = [];

  for (const payload of attempts.map(cleanPayload)) {
    if (!Object.keys(payload).length) continue;

    try {
      const { data, error } = await withWriteTimeout(
        supabase.from(table).update(payload).eq("id", id).select().maybeSingle(),
        `${table} update`
      );

      if (!error && data) return data;

      const message =
        error?.message ||
        "Update matched no visible row. Check the record id and RLS update/select policies.";

      errors.push(message);
      console.warn(`${table} update attempt skipped:`, message);
    } catch (error) {
      const message = error?.message || String(error);
      errors.push(message);
      console.warn(`${table} update attempt failed:`, message);
    }
  }

  throw buildWriteError(table, "Update", errors);
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
  const bundles = students.map((student) => ({
    student,
    applications: [],
    universities: [],
    documents: [],
    tasks: [],
    support: [],
    communications: [],
    timeline: [],
  }));

  if (!bundles.length) return bundles;

  const aliasMap = new Map();

  bundles.forEach((bundle, index) => {
    const aliases = [
      bundle.student.person_id,
      bundle.student.id,
      bundle.student.student_id,
      bundle.student.inquiry_id,
      bundle.student.appointment_id,
      bundle.student.email,
      bundle.student.student_email,
      bundle.student.lead_email,
      bundle.student.phone,
      bundle.student.student_phone,
      bundle.student.mobile,
      bundle.student.whatsapp,
    ]
      .filter(Boolean)
      .map(normalizeKey);

    aliases.forEach((alias) => {
      const indexes = aliasMap.get(alias) || [];
      if (!indexes.includes(index)) indexes.push(index);
      aliasMap.set(alias, indexes);
    });
  });

  const assignRecords = (records, key) => {
    safeArray(records).forEach((record) => {
      const recordKeys = [
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
        .map(normalizeKey);

      const matchedIndexes = new Set();

      recordKeys.forEach((recordKey) => {
        safeArray(aliasMap.get(recordKey)).forEach((index) => matchedIndexes.add(index));
      });

      matchedIndexes.forEach((index) => {
        bundles[index][key].push(record);
      });
    });
  };

  assignRecords(snapshot.applications, "applications");
  assignRecords(snapshot.universities, "universities");
  assignRecords(snapshot.documents, "documents");
  assignRecords(snapshot.tasks, "tasks");
  assignRecords(snapshot.support, "support");
  assignRecords(snapshot.communications, "communications");
  assignRecords(snapshot.timeline, "timeline");

  return bundles;
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

      const openTasks = safeArray(bundle.tasks).filter(
        (task) => !isClosedStatus(task.status)
      );

      const missingDocuments = safeArray(bundle.documents).filter((doc) =>
        containsUrgentWord(doc.status, doc.document_status, doc.document_name, doc.type)
      );

      const openSupport = safeArray(bundle.support).filter(
        (item) => !isClosedStatus(item.status)
      );

      return {
        ...student,
        id: buildRecordId(student, "student"),
        name: getStudentName(student),
        email: getStudentEmail(student),
        phone: getStudentPhone(student),
        stage,
        stageIndex: getStageIndex(stage),
        nextMilestone: getNextMilestone(student),
        riskScore,
        opportunityScore,
        velocityScore,
        stalledDays,
        openTasks: openTasks.length,
        missingDocuments: missingDocuments.length,
        openSupport: openSupport.length,
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
          student.last_contacted_at,
          newestFirst(bundle.timeline)[0]?.created_at,
          newestFirst(bundle.communications)[0]?.created_at,
          student.created_at
        ),
      };
    })
    .sort((a, b) => {
      const aScore =
        a.riskScore * 1.45 +
        a.opportunityScore +
        a.openSupport * 8 +
        a.openTasks * 4 +
        a.stalledDays;

      const bScore =
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
    const status = getRecordStatus(application);
    const offerStatus = pickFirst(application.offer_status, "");
    const casStatus = pickFirst(application.cas_status, "");
    const isBlocked = containsUrgentWord(
      status,
      offerStatus,
      casStatus,
      application.notes
    );
    const isConversion =
      lower(offerStatus).includes("offer") ||
      lower(casStatus).includes("issued");

    return {
      ...application,
      id: buildRecordId(application, "application"),
      studentName: pickFirst(
        application.student_name,
        application.student_email,
        "Assigned Student"
      ),
      universityName: pickFirst(
        application.university_name,
        application.institution_name,
        "University not selected"
      ),
      courseName: pickFirst(
        application.course_name,
        application.program_name,
        application.course,
        "Course not selected"
      ),
      status,
      offerStatus: offerStatus || "Not updated",
      casStatus: casStatus || "Not started",
      priorityScore: clamp(
        (isBlocked ? 35 : 0) + (isConversion ? 35 : 0) + (status ? 25 : 10)
      ),
      nextAction: isBlocked
        ? "Fix blocked application requirement."
        : isConversion
          ? "Move offer/CAS conversion forward."
          : "Check status and update application progress.",
      updatedAt: pickFirst(application.updated_at, application.created_at),
    };
  });
}

export function buildCounselorUniversityQueue(snapshot = {}) {
  return newestFirst(snapshot.universities).map((university) => {
    const status = getRecordStatus(university);
    const category = pickFirst(
      university.category,
      university.fit_type,
      university.shortlist_type,
      "Target"
    );

    const hasCourse = Boolean(
      pickFirst(university.course_name, university.program_name, university.course)
    );

    const readinessScore = clamp(
      (status ? 35 : 15) + (category ? 20 : 0) + (hasCourse ? 25 : 0) + 10
    );

    return {
      ...university,
      id: buildRecordId(university, "university"),
      studentName: pickFirst(
        university.student_name,
        university.student_email,
        "Assigned Student"
      ),
      universityName: pickFirst(
        university.university_name,
        university.name,
        university.institution_name,
        "University"
      ),
      country: pickFirst(university.country, university.destination_country, "Not set"),
      courseName: pickFirst(
        university.course_name,
        university.program_name,
        university.course,
        "Course not selected"
      ),
      category,
      status,
      readinessScore,
      nextAction:
        readinessScore >= 75
          ? "Convert shortlist into application."
          : "Confirm entry requirements, fees, course fit, and intake.",
    };
  });
}

export function buildCounselorDocumentQueue(snapshot = {}) {
  return newestFirst(snapshot.documents).map((document) => {
    const status = getRecordStatus(document);
    const name = pickFirst(document.document_name, document.name, document.type, "Document");
    const type = lower(document.type || name);

    const highCritical =
      type.includes("passport") ||
      type.includes("visa") ||
      type.includes("cas") ||
      type.includes("transcript") ||
      containsUrgentWord(status, name, document.notes);

    return {
      ...document,
      id: buildRecordId(document, "document"),
      studentName: pickFirst(
        document.student_name,
        document.student_email,
        "Assigned Student"
      ),
      documentName: name,
      status,
      criticality: highCritical ? "High" : "Normal",
      reviewState: isClosedStatus(status)
        ? "Cleared"
        : highCritical
          ? "Needs counselor review"
          : "Pending review",
      nextAction: isClosedStatus(status)
        ? "No immediate action required."
        : highCritical
          ? "Review document or request corrected upload."
          : "Check document quality and update status.",
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
  return newestFirst(snapshot.support)
    .filter((request) => !isClosedStatus(request.status))
    .map((request) => {
      const category = pickFirst(request.category, request.type, "General Support");
      const status = pickFirst(request.status, "Open");

      const urgent = containsUrgentWord(
        category,
        status,
        request.subject,
        request.message,
        request.description
      );

      return {
        ...request,
        id: buildRecordId(request, "support"),
        studentName: pickFirst(
          request.student_name,
          request.student_email,
          "Assigned Student"
        ),
        subject: pickFirst(request.subject, request.title, category),
        category,
        status,
        priority: pickFirst(request.priority, urgent ? "Urgent" : "Normal"),
        message: pickFirst(request.message, request.description, request.notes, ""),
        createdAt: pickFirst(request.created_at, request.updated_at),
        nextAction: urgent
          ? "Respond and escalate if blocked."
          : "Reply and update request status.",
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

export function buildCounselorPortalMetrics(snapshot = {}) {
  const studentQueue = buildPriorityStudentQueue(snapshot);
  const taskQueue = buildCounselorTaskQueue(snapshot);
  const supportQueue = buildCounselorSupportQueue(snapshot);
  const applicationQueue = buildCounselorApplicationQueue(snapshot);
  const documentQueue = buildCounselorDocumentQueue(snapshot);

  return {
    assignedStudents: studentQueue.length,
    atRiskStudents: studentQueue.filter((student) => student.isAtRisk).length,
    stalledStudents: studentQueue.filter((student) => student.isStalled).length,
    conversionReady: studentQueue.filter((student) => student.isConversionReady).length,
    openTasks: taskQueue.length,
    overdueTasks: taskQueue.filter((task) => task.isOverdue).length,
    supportQueue: supportQueue.length,
    openApplications: applicationQueue.filter((application) => !isClosedStatus(application.status)).length,
    blockedApplications: applicationQueue.filter((application) => application.priorityScore >= 70).length,
    pendingDocuments: documentQueue.filter((document) => !isClosedStatus(document.status)).length,
    criticalDocuments: documentQueue.filter(
      (document) =>
        document.criticality === "High" && !isClosedStatus(document.status)
    ).length,
  };
}

export function buildCounselorNavigation(metrics = {}) {
  return [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Assigned Students", badge: metrics.assignedStudents },
    { key: "applications", label: "Applications", badge: metrics.openApplications },
    { key: "universities", label: "Universities" },
    { key: "documents", label: "Documents", badge: metrics.criticalDocuments },
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
    executiveSummary: `${recommendedFocus} should be the counselor focus. Current load includes ${metrics.assignedStudents} assigned students, ${metrics.atRiskStudents} high-risk students, ${metrics.stalledStudents} stalled students, ${metrics.conversionReady} conversion-ready students, ${metrics.openTasks} open tasks, ${metrics.supportQueue} support items, and ${metrics.criticalDocuments} critical document issues.`,
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

  const casIssued = applications.filter((app) =>
    lower(app.casStatus).includes("issued")
  ).length;

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
    openSupport: support.length,
    offersReceived,
    offersAccepted,
    casIssued,
    performanceGrade:
      students.length === 0
        ? "Not Assessed"
        : conversionRate >= 65 && activationRate >= 80
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

async function safeSelect(table, queryBuilder, fallback = [], diagnostics = null) {
  try {
    const baseQuery = supabase.from(table);
    const query = queryBuilder ? queryBuilder(baseQuery) : baseQuery.select("*");
    const { data, error } = await query;

    if (error) {
      const message = error.message || String(error);
      console.warn(`Counselor Portal skipped ${table}:`, message);
      diagnostics?.push({ table, message });
      return fallback;
    }

    return safeArray(data);
  } catch (error) {
    const message = error?.message || String(error);
    console.warn(`Counselor Portal failed ${table}:`, message);
    diagnostics?.push({ table, message });
    return fallback;
  }
}

function buildAssignmentFilter(profile = {}) {
  const counselorId = safeString(profile.counselorId).trim();
  const email = safeString(profile.email).trim();
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

async function fetchAssignedStudents(profile, diagnostics = []) {
  const counselorId = safeString(profile?.counselorId).trim();
  const counselorEmail = safeString(profile?.email).trim();

  if (!counselorId && !counselorEmail) {
    diagnostics.push({
      table: "assignment",
      message:
        "Counselor identity has no id or email, so assigned records cannot be safely scoped.",
    });

    return {
      records: [],
      scope: "missing-counselor-identity",
    };
  }

  let assignments = [];

  if (counselorId) {
    assignments = await safeSelect(
      COUNSELOR_TABLES.assignments,
      (table) =>
        table
          .select("*")
          .eq("assigned_user_id", counselorId)
          .order("created_at", { ascending: false })
          .limit(500),
      [],
      diagnostics
    );
  }

  // Email is only a fallback for legacy/migration safety. The canonical
  // ownership key is the authenticated human UUID; portal role does not duplicate ownership.
  if (!assignments.length && counselorEmail) {
    assignments = await safeSelect(
      COUNSELOR_TABLES.assignments,
      (table) =>
        table
          .select("*")
          .ilike("assigned_user_name", counselorEmail)
          .order("created_at", { ascending: false })
          .limit(500),
      [],
      diagnostics
    );
  }

  if (!assignments.length) {
    return {
      records: [],
      scope: "assigned-empty",
    };
  }

  const inquiryIds = assignments
    .filter((row) => normalizeKey(row.lead_type) === "inquiry")
    .map((row) => safeString(row.lead_id).trim())
    .filter(Boolean);

  const appointmentIds = assignments
    .filter((row) => normalizeKey(row.lead_type) === "appointment")
    .map((row) => safeString(row.lead_id).trim())
    .filter(Boolean);

  const [inquiries, appointments] = await Promise.all([
    inquiryIds.length
      ? safeSelect(
          COUNSELOR_TABLES.inquiries,
          (table) => table.select("*").in("id", inquiryIds).limit(500),
          [],
          diagnostics
        )
      : [],
    appointmentIds.length
      ? safeSelect(
          COUNSELOR_TABLES.appointments,
          (table) => table.select("*").in("id", appointmentIds).limit(500),
          [],
          diagnostics
        )
      : [],
  ]);

  const normalizedRecords = [
    ...safeArray(inquiries).map((record) => ({
      ...record,
      inquiry_id: record.inquiry_id || record.id,
      source_table: "inquiries",
      assignment_owner_id: counselorId,
    })),
    ...safeArray(appointments).map((record) => ({
      ...record,
      appointment_id: record.appointment_id || record.id,
      source_table: "appointments",
      assignment_owner_id: counselorId,
    })),
  ];

  const records = uniqueBy(
    normalizedRecords,
    (record) =>
      normalizeKey(
        pickFirst(
          record.person_id,
          record.student_id,
          record.inquiry_id,
          record.appointment_id,
          record.email,
          record.student_email,
          record.phone,
          buildRecordId(record, "student")
        )
      )
  );

  return {
    records,
    scope: records.length ? "assigned-records" : "assignment-record-missing",
  };
}

function buildAssignedSnapshot(rawSnapshot = {}) {
  const students = safeArray(rawSnapshot.students);

  return {
    ...rawSnapshot,
    students,
    applications: filterToAssignedStudents(rawSnapshot.applications, students),
    universities: filterToAssignedStudents(rawSnapshot.universities, students),
    documents: filterToAssignedStudents(rawSnapshot.documents, students),
    tasks: filterToAssignedStudents(rawSnapshot.tasks, students),
    support: filterToAssignedStudents(rawSnapshot.support, students),
    communications: filterToAssignedStudents(rawSnapshot.communications, students),
    appointments: filterToAssignedStudents(rawSnapshot.appointments, students),
    timeline: filterToAssignedStudents(rawSnapshot.timeline, students),
  };
}

export async function fetchCounselorPortalSnapshot({ counselor } = {}) {
  const profile = normalizeCounselorProfile(counselor);
  const readErrors = [];
  const assigned = await fetchAssignedStudents(profile, readErrors);
  const students = assigned.records;

  const [
    applicationsRaw,
    universitiesRaw,
    documentsRaw,
    tasksRaw,
    supportRaw,
    communicationsRaw,
    appointmentsRaw,
    timelineRaw,
  ] = await Promise.all([
    safeSelect(COUNSELOR_TABLES.applications, (table) => table.select("*").limit(500), [], readErrors),
    safeSelect(COUNSELOR_TABLES.universities, (table) => table.select("*").limit(500), [], readErrors),
    safeSelect(COUNSELOR_TABLES.documents, (table) => table.select("*").limit(500), [], readErrors),
    safeSelect(COUNSELOR_TABLES.tasks, (table) => table.select("*").limit(500), [], readErrors),
    safeSelect(COUNSELOR_TABLES.support, (table) => table.select("*").limit(300), [], readErrors),
    safeSelect(COUNSELOR_TABLES.communications, (table) => table.select("*").limit(500), [], readErrors),
    safeSelect(COUNSELOR_TABLES.appointments, (table) => table.select("*").limit(300), [], readErrors),
    safeSelect(COUNSELOR_TABLES.timeline, (table) => table.select("*").limit(500), [], readErrors),
  ]);

  const rawSnapshot = {
    loadedAt: nowIso(),
    counselor: profile,
    assignmentScope: assigned.scope,
    students,
    applications: applicationsRaw,
    universities: universitiesRaw,
    documents: documentsRaw,
    tasks: tasksRaw,
    support: supportRaw,
    communications: communicationsRaw,
    appointments: appointmentsRaw,
    timeline: timelineRaw,
    diagnostics: {
      rawApplications: applicationsRaw.length,
      rawUniversities: universitiesRaw.length,
      rawDocuments: documentsRaw.length,
      rawTasks: tasksRaw.length,
      rawSupport: supportRaw.length,
      rawCommunications: communicationsRaw.length,
      rawAppointments: appointmentsRaw.length,
      rawTimeline: timelineRaw.length,
      readErrors,
      hasReadErrors: readErrors.length > 0,
      assignmentScope: assigned.scope,
    },
  };

  const snapshot = buildAssignedSnapshot(rawSnapshot);
  const priorityStudents = buildPriorityStudentQueue(snapshot);
  const metrics = buildCounselorPortalMetrics(snapshot);
  const workload = buildCounselorWorkloadAnalytics(snapshot);
  const performance = buildCounselorPerformanceAnalytics(snapshot);
  const executiveBrief = buildCounselorExecutiveBrief(snapshot);

  return {
    ...snapshot,
    priorityStudents,
    metrics,
    workload,
    performance,
    executiveBrief,
  };
}

export async function createCounselorTask({
  studentId,
  studentName,
  title,
  category = "Counselor Follow-up",
  priority = "Normal",
  dueDate,
  counselor,
  metadata = {},
}) {
  const profile = normalizeCounselorProfile(counselor);

  const notes = [
    title || "Counselor follow-up",
    category ? `Category: ${category}` : "",
    metadata?.nextMilestone ? `Next milestone: ${metadata.nextMilestone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const attempts = [
    {
      student_id: studentId,
      student_name: studentName,
      status: "Open",
      priority,
      due_date: dueDate || null,
      notes,
      metadata: {
        ...metadata,
        counselor: profile,
        source: "Counselor Portal OS",
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      status: "Open",
      priority,
      notes,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      status: "Open",
      priority,
      notes,
    },
    {
      student_id: studentId,
      status: "Open",
      priority,
      notes,
    },
    {
      student_id: studentId,
      status: "Open",
    },
    {
      student_id: studentId,
    },
  ];

  return insertWithFallback(COUNSELOR_TABLES.tasks, attempts, {
    student_id: studentId,
    student_name: studentName,
    title,
    category,
    priority,
    status: "Open",
    notes,
    created_at: nowIso(),
  });
}

export async function logCounselorCommunication({
  studentId,
  studentName,
  channel = "Note",
  subject = "Counselor Update",
  message,
  counselor,
  metadata = {},
}) {
  const profile = normalizeCounselorProfile(counselor);

  const notes = [
    subject || "Counselor Update",
    channel ? `Channel: ${channel}` : "",
    message || "",
  ]
    .filter(Boolean)
    .join("\n");

  const attempts = [
    {
      student_id: studentId,
      student_name: studentName,
      channel,
      subject,
      message,
      status: "Logged",
      metadata: {
        ...metadata,
        counselor: profile,
        source: "Counselor Portal OS",
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      channel,
      subject,
      message,
      status: "Logged",
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      type: channel,
      subject,
      message,
      status: "Logged",
      created_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      channel,
      notes,
      status: "Logged",
      created_at: nowIso(),
    },
    {
      student_id: studentId,
      student_name: studentName,
      notes,
      created_at: nowIso(),
    },
    {
      student_id: studentId,
      notes,
    },
    {
      student_id: studentId,
    },
  ];

  return insertWithFallback(COUNSELOR_TABLES.communications, attempts, {
    student_id: studentId,
    student_name: studentName,
    channel,
    subject,
    message,
    status: "Logged",
    notes,
    created_at: nowIso(),
  });
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
  const students = buildPriorityStudentQueue(snapshot)
    .filter(
      (student) =>
        student.riskScore >= 80 ||
        student.opportunityScore >= 75 ||
        student.stalledDays >= 14
    )
    .slice(0, 25);

  const results = [];

  for (const student of students) {
    try {
      const triggered = await executeCounselorStudentReview({
        student,
        counselor,
      });

      results.push({
        studentId: student.id,
        studentName: student.name,
        triggered,
        ok: true,
      });
    } catch (error) {
      console.error("Daily counselor sweep failed", student.name, error);
      results.push({
        studentId: student.id,
        studentName: student.name,
        triggered: [],
        ok: false,
        error: error?.message || String(error),
      });
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