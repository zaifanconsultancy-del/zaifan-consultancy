import { supabase } from "./supabaseClient";

const SEARCH_TIMEOUT_MS = 12000;
const COUNT_TIMEOUT_MS = 5000;
const DATA_TIMEOUT_MS = 7000;
const LOGIN_TIMEOUT_MS = 25000;

const TABLES = {
  inquiries: "inquiries",
  appointments: "appointments",
  accounts: "student_portal_accounts",
  applications: "student_applications",
  documents: "student_documents",
  tasks: "student_tasks",
  communications: "student_communications",
  timeline: "crm_timeline",
  universities: "student_universities",
};

const EMPTY_PORTAL_DATA = {
  applications: [],
  documents: [],
  tasks: [],
  communications: [],
  timeline: [],
  universities: [],
  counts: {
    applications: 0,
    documents: 0,
    tasks: 0,
    communications: 0,
    timeline: 0,
    universities: 0,
    total: 0,
  },
  error: null,
};

const STUDENT_SEARCH_COLUMNS = "*";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function uniqueById(rows = []) {
  return Array.from(
    new Map(
      rows.map((item) => [
        `${item.student_type || item.__leadType || "student"}-${item.id || JSON.stringify(item)}`,
        item,
      ])
    ).values()
  );
}

function uniqueRows(rows = []) {
  return Array.from(
    new Map(
      rows
        .filter(Boolean)
        .map((item) => [item.id || item.uuid || JSON.stringify(item), item])
    ).values()
  );
}

async function withTimeout(
  promise,
  message = "Student portal request timed out.",
  timeoutMs = DATA_TIMEOUT_MS
) {
  let timer;

  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve({
        data: [],
        error: new Error(message),
        count: 0,
        timedOut: true,
      });
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    return { data: [], error, count: 0, timedOut: false };
  } finally {
    clearTimeout(timer);
  }
}

async function safeQuery(query, fallback = [], timeoutMs = DATA_TIMEOUT_MS, label = "") {
  const { data, error, timedOut } = await withTimeout(
    query,
    label ? `${label} timed out.` : "Student portal query timed out.",
    timeoutMs
  );

  if (error) {
    console.warn("Student portal query skipped:", label || "query", error.message || error);
    return fallback;
  }

  if (timedOut) {
    console.warn("Student portal query timed out:", label || "query");
    return fallback;
  }

  return Array.isArray(data) ? data : data ? [data] : fallback;
}

async function safeSingle(query, fallback = null, timeoutMs = DATA_TIMEOUT_MS, label = "") {
  const { data, error, timedOut } = await withTimeout(
    query,
    label ? `${label} timed out.` : "Student portal single query timed out.",
    timeoutMs
  );

  if (error) {
    console.warn("Student portal single query skipped:", label || "query", error.message || error);
    return fallback;
  }

  if (timedOut) {
    console.warn("Student portal single query timed out:", label || "query");
    return fallback;
  }

  return data || fallback;
}

async function safeCount(query, label = "") {
  const { count, error, timedOut } = await withTimeout(
    query,
    label ? `${label} count timed out.` : "Student portal count timed out.",
    COUNT_TIMEOUT_MS
  );

  if (error) {
    console.warn("Student portal count skipped:", label || "count", error.message || error);
    return 0;
  }

  if (timedOut) {
    console.warn("Student portal count timed out:", label || "count");
    return 0;
  }

  return Number(count || 0);
}

function buildCountsFromRows(data = {}) {
  const counts = {
    applications: data.applications?.length || 0,
    documents: data.documents?.length || 0,
    tasks: data.tasks?.length || 0,
    communications: data.communications?.length || 0,
    timeline: data.timeline?.length || 0,
    universities: data.universities?.length || 0,
  };

  counts.total =
    counts.applications +
    counts.documents +
    counts.tasks +
    counts.communications +
    counts.timeline +
    counts.universities;

  return counts;
}

function mergeCounts(primary = {}, fallback = {}) {
  const counts = {
    applications: Number(primary.applications || fallback.applications || 0),
    documents: Number(primary.documents || fallback.documents || 0),
    tasks: Number(primary.tasks || fallback.tasks || 0),
    communications: Number(primary.communications || fallback.communications || 0),
    timeline: Number(primary.timeline || fallback.timeline || 0),
    universities: Number(primary.universities || fallback.universities || 0),
  };

  counts.total =
    counts.applications +
    counts.documents +
    counts.tasks +
    counts.communications +
    counts.timeline +
    counts.universities;

  return counts;
}

export function getStudentDisplayName(student = {}) {
  return (
    student.full_name ||
    student.student_name ||
    student.name ||
    student.first_name ||
    "Student"
  );
}

export function getStudentEmail(student = {}) {
  return student.email || student.student_email || "";
}

export function getStudentPhone(student = {}) {
  return student.phone || student.phone_number || student.whatsapp || "";
}

export function getStudentType(student = {}) {
  return student.student_type || student.__leadType || student.type || "inquiry";
}

export function getStudentId(student = {}) {
  return String(student.id || student.student_id || "").trim();
}

function normalizePortalStudent(row = {}, sourceType = "inquiry") {
  return {
    ...row,
    id: row.id,
    student_type: sourceType,
    __leadType: sourceType,
    portal_student_key: `${sourceType}-${row.id}`,
  };
}

function sanitizePhone(value = "") {
  return String(value || "").replace(/[^\d]/g, "");
}

async function runSearchQuery(buildQuery, label = "") {
  try {
    return await safeQuery(buildQuery(), [], SEARCH_TIMEOUT_MS, label);
  } catch (error) {
    console.warn("Student portal search failed:", label, error);
    return [];
  }
}

async function searchStudentsInSource(source, clean) {
  const value = String(clean || "").trim();
  const lower = normalize(value);
  const phoneDigits = sanitizePhone(value);

  if (!value) return [];

  const rows = [];

  if (/^\d+$/.test(value)) {
    rows.push(
      ...(await runSearchQuery(
        () => supabase.from(source.table).select(STUDENT_SEARCH_COLUMNS).eq("id", value).limit(10),
        `${source.type} id search`
      ))
    );
  }

  if (value.includes("@")) {
    rows.push(
      ...(await runSearchQuery(
        () => supabase.from(source.table).select(STUDENT_SEARCH_COLUMNS).eq("email", lower).limit(25),
        `${source.type} email exact search`
      )),
      ...(await runSearchQuery(
        () => supabase.from(source.table).select(STUDENT_SEARCH_COLUMNS).ilike("email", `%${lower}%`).limit(25),
        `${source.type} email fuzzy search`
      ))
    );
  }

  if (!value.includes("@")) {
    rows.push(
      ...(await runSearchQuery(
        () => supabase.from(source.table).select(STUDENT_SEARCH_COLUMNS).eq("phone", value).limit(25),
        `${source.type} phone exact search`
      )),
      ...(await runSearchQuery(
        () => supabase.from(source.table).select(STUDENT_SEARCH_COLUMNS).ilike("phone", `%${value}%`).limit(25),
        `${source.type} phone fuzzy search`
      ))
    );

    if (phoneDigits && phoneDigits !== value) {
      rows.push(
        ...(await runSearchQuery(
          () => supabase.from(source.table).select(STUDENT_SEARCH_COLUMNS).ilike("phone", `%${phoneDigits}%`).limit(25),
          `${source.type} phone digits search`
        ))
      );
    }
  }

  return uniqueById(
    rows.filter(Boolean).map((row) => normalizePortalStudent(row, source.type))
  );
}

async function countByStudent(table, student, { matchStudentType = false, label = "" } = {}) {
  const studentId = getStudentId(student);
  const studentType = getStudentType(student);

  if (!studentId) return 0;

  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  if (matchStudentType && studentType) {
    query = query.eq("student_type", studentType);
  }

  return safeCount(query, label || table);
}

export async function getPortalDataCountsForStudent(student = {}) {
  const countJobs = [
    ["applications", countByStudent(TABLES.applications, student, { matchStudentType: true, label: "applications" })],
    ["documents", countByStudent(TABLES.documents, student, { matchStudentType: false, label: "documents" })],
    ["tasks", countByStudent(TABLES.tasks, student, { matchStudentType: false, label: "tasks" })],
    ["communications", countByStudent(TABLES.communications, student, { matchStudentType: true, label: "communications" })],
    ["timeline", countByStudent(TABLES.timeline, student, { matchStudentType: true, label: "timeline" })],
    ["universities", countByStudent(TABLES.universities, student, { matchStudentType: false, label: "universities" })],
  ];

  const results = await Promise.allSettled(countJobs.map(([, promise]) => promise));

  const counts = countJobs.reduce((acc, [key], index) => {
    acc[key] = results[index].status === "fulfilled" ? Number(results[index].value || 0) : 0;
    return acc;
  }, {});

  counts.total =
    counts.applications +
    counts.documents +
    counts.tasks +
    counts.communications +
    counts.timeline +
    counts.universities;

  return counts;
}

export async function enrichStudentsWithPortalCounts(students = []) {
  const enriched = await Promise.allSettled(
    (students || []).map(async (student) => ({
      ...student,
      portalCounts: await getPortalDataCountsForStudent(student),
    }))
  );

  return enriched.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          ...students[index],
          portalCounts: EMPTY_PORTAL_DATA.counts,
        }
  );
}

export async function findStudentsForPortal(identifier = "") {
  const clean = String(identifier || "").trim();

  if (!clean) {
    return {
      students: [],
      error: new Error("Enter email or WhatsApp number."),
    };
  }

  const sources = [
    { table: TABLES.inquiries, type: "inquiry" },
    { table: TABLES.appointments, type: "appointment" },
  ];

  const results = await Promise.allSettled(
    sources.map((source) => searchStudentsInSource(source, clean))
  );

  let students = uniqueById(
    results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
  );

  if (!students.length) {
    return {
      students: [],
      error: new Error("No student record found. Please check your email or WhatsApp number."),
    };
  }

  students = await enrichStudentsWithPortalCounts(students);

  students.sort((a, b) => {
    const aTotal = Number(a.portalCounts?.total || 0);
    const bTotal = Number(b.portalCounts?.total || 0);

    if (aTotal !== bTotal) return bTotal - aTotal;

    const aDate = new Date(a.created_at || a.appointment_date || 0).getTime();
    const bDate = new Date(b.created_at || b.appointment_date || 0).getTime();

    return bDate - aDate;
  });

  return { students, error: null };
}

export async function findStudentForPortal(identifier = "") {
  const result = await findStudentsForPortal(identifier);

  return {
    student: result.students?.[0] || null,
    students: result.students || [],
    error: result.error,
  };
}

async function fetchByStudent(table, student, options = {}) {
  const {
    orderBy = "created_at",
    ascending = false,
    limit = null,
    matchStudentType = true,
    label = table,
  } = options;

  const studentId = getStudentId(student);
  const studentType = getStudentType(student);

  if (!studentId) return [];

  let query = supabase.from(table).select("*").eq("student_id", studentId);

  if (matchStudentType && studentType) {
    query = query.eq("student_type", studentType);
  }

  if (orderBy) query = query.order(orderBy, { ascending });
  if (limit) query = query.limit(limit);

  return safeQuery(query, [], DATA_TIMEOUT_MS, label);
}

async function fetchWithFallback(table, student, options = {}) {
  const strictRows = await fetchByStudent(table, student, {
    ...options,
    matchStudentType: true,
    label: `${options.label || table} strict`,
  });

  if (strictRows.length) return strictRows;

  return fetchByStudent(table, student, {
    ...options,
    matchStudentType: false,
    label: `${options.label || table} fallback`,
  });
}

export async function fetchStudentPortalOverview(student) {
  if (!student?.id && !student?.student_id) {
    return EMPTY_PORTAL_DATA;
  }

  const [applicationsResult, countsResult] = await Promise.allSettled([
    fetchWithFallback(TABLES.applications, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 5,
      label: "overview applications",
    }),
    getPortalDataCountsForStudent(student),
  ]);

  const applications =
    applicationsResult.status === "fulfilled" ? uniqueRows(applicationsResult.value) : [];

  const counts =
    countsResult.status === "fulfilled"
      ? countsResult.value
      : student.portalCounts || EMPTY_PORTAL_DATA.counts;

  return {
    applications,
    documents: [],
    tasks: [],
    communications: [],
    timeline: [],
    universities: [],
    counts: mergeCounts(
      {
        applications: applications.length,
      },
      counts
    ),
    error: null,
  };
}

export async function fetchStudentPortalData(student) {
  if (!student?.id && !student?.student_id) {
    return EMPTY_PORTAL_DATA;
  }

  const fetchJobs = {
    applications: fetchWithFallback(TABLES.applications, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 20,
      label: "applications",
    }),
    documents: fetchByStudent(TABLES.documents, student, {
      orderBy: "created_at",
      ascending: false,
      matchStudentType: false,
      limit: 50,
      label: "documents",
    }),
    tasks: fetchByStudent(TABLES.tasks, student, {
      orderBy: "created_at",
      ascending: false,
      matchStudentType: false,
      limit: 100,
      label: "tasks",
    }),
    communications: fetchWithFallback(TABLES.communications, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "communications",
    }),
    timeline: fetchWithFallback(TABLES.timeline, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 100,
      label: "timeline",
    }),
    universities: fetchByStudent(TABLES.universities, student, {
      orderBy: "created_at",
      ascending: false,
      matchStudentType: false,
      limit: 50,
      label: "universities",
    }),
  };

  const results = await Promise.allSettled(
    Object.entries(fetchJobs).map(async ([key, promise]) => {
      const rows = await promise;
      return [key, uniqueRows(rows)];
    })
  );

  const data = {
    applications: [],
    documents: [],
    tasks: [],
    communications: [],
    timeline: [],
    universities: [],
  };

  const failedSections = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const [key, rows] = result.value;
      data[key] = rows;
    } else {
      failedSections.push(result.reason?.message || "Unknown portal section failed.");
    }
  });

  const rowCounts = buildCountsFromRows(data);
  const savedCounts = student.portalCounts || {};
  const counts = mergeCounts(rowCounts, savedCounts);
  console.log("PORTAL DATA DEBUG", {
  student,
  applications: data.applications.length,
  documents: data.documents.length,
  tasks: data.tasks.length,
  universities: data.universities.length,
  communications: data.communications.length,
  timeline: data.timeline.length,
  counts,
});
  return {
    ...data,
    counts,
    error: failedSections.length
      ? new Error(`Some portal sections could not be loaded: ${failedSections.join(", ")}`)
      : null,
  };
}

export function buildPortalSummary(student = {}, data = {}) {
  const applications = data.applications || [];
  const documents = data.documents || [];
  const tasks = data.tasks || [];
  const communications = data.communications || [];
  const timeline = data.timeline || [];
  const universities = data.universities || [];
  const fallbackCounts = data.counts || student.portalCounts || {};

  const latestApplication = applications[0] || {};

  const pendingTasks = tasks.filter((task) => {
    const status = normalize(task.status);
    return !["done", "completed", "complete", "closed"].includes(status);
  });

  const completedTasks = tasks.length - pendingTasks.length;

  return {
    studentName: getStudentDisplayName(student),
    studentType: getStudentType(student),
    studentId: getStudentId(student),
    email: getStudentEmail(student),
    phone: getStudentPhone(student),

    latestApplication,

    applicationStatus:
      latestApplication.application_status ||
      latestApplication.status ||
      student.application_status ||
      "not_started",

    offerStatus:
      latestApplication.offer_status ||
      student.offer_status ||
      "not_started",

    casStatus:
      latestApplication.cas_status ||
      latestApplication.cas ||
      student.cas_status ||
      "not_started",

    visaStatus:
      latestApplication.visa_status ||
      student.visa_status ||
      "not_started",

    documentsCount: documents.length || fallbackCounts.documents || 0,
    tasksCount: tasks.length || fallbackCounts.tasks || 0,
    pendingTasksCount:
      tasks.length > 0 ? pendingTasks.length : fallbackCounts.tasks || 0,
    completedTasksCount: completedTasks,
    communicationsCount: communications.length || fallbackCounts.communications || 0,
    timelineCount: timeline.length || fallbackCounts.timeline || 0,
    universitiesCount: universities.length || fallbackCounts.universities || 0,

    pendingTasks,
  };
}

async function fetchMappedStudentForAccount(account = {}) {
  const sourceType = account.student_type || "inquiry";
  const table = sourceType === "appointment" ? TABLES.appointments : TABLES.inquiries;

  const studentData = await safeSingle(
    supabase.from(table).select("*").eq("id", account.student_id).single(),
    null,
    LOGIN_TIMEOUT_MS,
    "mapped student"
  );

  if (!studentData) {
    return {
      student: null,
      error: new Error("Mapped student record not found."),
    };
  }

  const normalizedStudent = normalizePortalStudent(studentData, sourceType);

  return {
    student: {
      ...normalizedStudent,
      portalCounts: await getPortalDataCountsForStudent(normalizedStudent),
    },
    error: null,
  };
}

export async function fetchStudentPortalAccountForStudent(student = {}) {
  const studentId = getStudentId(student);
  const studentType = getStudentType(student);

  if (!studentId) {
    return {
      account: null,
      error: new Error("Student record is missing."),
    };
  }

  const account = await safeSingle(
    supabase
      .from(TABLES.accounts)
      .select(
        "id, email, student_id, student_type, is_active, must_change_password, password_changed_at, last_login_at, created_at, updated_at"
      )
      .eq("student_id", studentId)
      .eq("student_type", studentType)
      .maybeSingle(),
    null,
    LOGIN_TIMEOUT_MS,
    "student portal account lookup"
  );

  return {
    account,
    error: null,
  };
}

export async function loginStudentPortalAccount(email = "", password = "") {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    return {
      account: null,
      student: null,
      error: new Error("Enter email and password."),
    };
  }

  const rpcResult = await withTimeout(
    supabase.rpc("verify_student_portal_login", {
      p_email: cleanEmail,
      p_password: cleanPassword,
    }),
    "Portal login timed out.",
    LOGIN_TIMEOUT_MS
  );

  if (rpcResult.timedOut) {
    return {
      account: null,
      student: null,
      error: new Error("Portal login timed out. Please try again."),
    };
  }

  if (rpcResult.error) {
    return {
      account: null,
      student: null,
      error: rpcResult.error,
    };
  }

  const account = Array.isArray(rpcResult.data) ? rpcResult.data[0] : rpcResult.data;

  if (!account?.student_id) {
    return {
      account: null,
      student: null,
      error: new Error("Invalid email or password."),
    };
  }

  if (account.is_active === false) {
    return {
      account,
      student: null,
      error: new Error("This student portal account is inactive."),
    };
  }

  const mappedStudentResult = await fetchMappedStudentForAccount(account);

  if (mappedStudentResult.error || !mappedStudentResult.student) {
    return {
      account,
      student: null,
      error: mappedStudentResult.error || new Error("Mapped student record not found."),
    };
  }

  return {
    account,
    student: mappedStudentResult.student,
    error: null,
  };
}

export async function changeStudentPortalPassword({
  accountId,
  currentPassword,
  newPassword,
}) {
  if (!accountId) {
    return {
      success: false,
      message: "Portal account is missing.",
      error: new Error("Portal account is missing."),
    };
  }

  if (!currentPassword || !newPassword) {
    return {
      success: false,
      message: "Enter current password and new password.",
      error: new Error("Enter current password and new password."),
    };
  }

  const { data, error } = await supabase.rpc("change_student_portal_password", {
    p_account_id: accountId,
    p_current_password: currentPassword,
    p_new_password: newPassword,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Password change failed.",
      error,
    };
  }

  const result = Array.isArray(data) ? data[0] : data;

  return {
    success: Boolean(result?.success),
    message: result?.message || "Password change completed.",
    password_changed_at: result?.password_changed_at || null,
    must_change_password: result?.must_change_password ?? false,
    error: null,
  };
}