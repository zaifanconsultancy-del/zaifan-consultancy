import { supabase } from "./supabaseClient";

const SEARCH_TIMEOUT_MS = 12000;
const COUNT_TIMEOUT_MS = 7000;
const DATA_TIMEOUT_MS = 9000;
const PAYMENT_TIMEOUT_MS = 12000;
const PAYMENT_ACCOUNT_TIMEOUT_MS = 9000;
const LOGIN_TIMEOUT_MS = 25000;
const ACCOUNT_TIMEOUT_MS = 18000;

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
  invoices: "student_invoices",
  payments: "student_payments",
  receipts: "student_receipts",
  counselorPaymentRequests: "counselor_payment_requests",
  paymentAccounts: "payment_accounts",
  supportRequests: "student_support_requests",
};

const EMPTY_COUNTS = {
  applications: 0,
  documents: 0,
  tasks: 0,
  communications: 0,
  timeline: 0,
  universities: 0,
  invoices: 0,
  payments: 0,
  receipts: 0,
  counselorPaymentRequests: 0,
  paymentRequests: 0,
  supportRequests: 0,
  studentSupportRequests: 0,
  total: 0,
};

const EMPTY_PORTAL_DATA = {
  applications: [],
  documents: [],
  tasks: [],
  communications: [],
  timeline: [],
  universities: [],
  invoices: [],
  payments: [],
  receipts: [],
  counselorPaymentRequests: [],
  paymentRequests: [],
  paymentAccounts: [],
  supportRequests: [],
  studentSupportRequests: [],
  counts: EMPTY_COUNTS,
  error: null,
};

const PAYMENT_SECTION_KEYS = new Set([
  "invoices",
  "payments",
  "receipts",
  "counselorPaymentRequests",
  "paymentRequests",
  "paymentAccounts",
]);

function isPaymentSection(key = "") {
  return PAYMENT_SECTION_KEYS.has(key);
}

function buildPortalWarningMessage(failedSections = []) {
  const importantFailures = failedSections.filter((item) => !isPaymentSection(item.key));
  const paymentFailures = failedSections.filter((item) => isPaymentSection(item.key));

  if (!importantFailures.length && paymentFailures.length) {
    return "";
  }

  if (!failedSections.length) return "";

  return (
    "Some portal sections could not be loaded: " +
    failedSections
      .map((item) => item.label || item.key || "unknown section")
      .join(", ")
  );
}

const STUDENT_SEARCH_COLUMNS = "*";

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function sanitizePhone(value = "") {
  return String(value || "").replace(/[^\d]/g, "");
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

function uniqueById(rows = []) {
  return Array.from(
    new Map(
      rows
        .filter(Boolean)
        .map((item) => [
          `${item.student_type || item.__leadType || "student"}-${
            item.id || JSON.stringify(item)
          }`,
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

function getStudentIdVariants(student = {}) {
  const rawId = student?.id ?? student?.student_id ?? "";
  const stringId = String(rawId || "").trim();

  if (!stringId) return [];

  const variants = [stringId];
  const numericId = Number(stringId);

  if (Number.isFinite(numericId)) {
    variants.push(numericId);
  }

  return [
    ...new Set(
      variants.filter(
        (value) => value !== "" && value !== null && value !== undefined
      )
    ),
  ];
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
    return {
      data: [],
      error,
      count: 0,
      timedOut: false,
    };
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
    invoices: data.invoices?.length || 0,
    payments: data.payments?.length || 0,
    receipts: data.receipts?.length || 0,
    counselorPaymentRequests: data.counselorPaymentRequests?.length || 0,
    paymentRequests: data.paymentRequests?.length || data.counselorPaymentRequests?.length || 0,
    supportRequests: data.supportRequests?.length || 0,
    studentSupportRequests: data.studentSupportRequests?.length || data.supportRequests?.length || 0,
  };

  counts.total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
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
    invoices: Number(primary.invoices || fallback.invoices || 0),
    payments: Number(primary.payments || fallback.payments || 0),
    receipts: Number(primary.receipts || fallback.receipts || 0),
    counselorPaymentRequests: Number(
      primary.counselorPaymentRequests || fallback.counselorPaymentRequests || 0
    ),
    paymentRequests: Number(
      primary.paymentRequests ||
        primary.counselorPaymentRequests ||
        fallback.paymentRequests ||
        fallback.counselorPaymentRequests ||
        0
    ),
    supportRequests: Number(primary.supportRequests || fallback.supportRequests || 0),
    studentSupportRequests: Number(
      primary.studentSupportRequests ||
        fallback.studentSupportRequests ||
        primary.supportRequests ||
        fallback.supportRequests ||
        0
    ),
  };

  counts.total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
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
  const studentIds = getStudentIdVariants(student);
  const studentType = getStudentType(student);

  if (!studentIds.length) return 0;

  const results = await Promise.allSettled(
    studentIds.map((studentId) => {
      let query = supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);

      if (matchStudentType && studentType) {
        query = query.eq("student_type", studentType);
      }

      return safeCount(query, label || table);
    })
  );

  return Math.max(
    0,
    ...results.map((result) =>
      result.status === "fulfilled" ? Number(result.value || 0) : 0
    )
  );
}

export async function getPortalDataCountsForStudent(student = {}) {
  const countJobs = [
    ["applications", countByStudent(TABLES.applications, student, { matchStudentType: true, label: "applications" })],
    ["documents", countByStudent(TABLES.documents, student, { matchStudentType: false, label: "documents" })],
    ["tasks", countByStudent(TABLES.tasks, student, { matchStudentType: false, label: "tasks" })],
    ["communications", countByStudent(TABLES.communications, student, { matchStudentType: true, label: "communications" })],
    ["timeline", countByStudent(TABLES.timeline, student, { matchStudentType: true, label: "timeline" })],
    ["universities", countByStudent(TABLES.universities, student, { matchStudentType: false, label: "universities" })],
    ["invoices", countByStudent(TABLES.invoices, student, { matchStudentType: false, label: "invoices" })],
    ["payments", countByStudent(TABLES.payments, student, { matchStudentType: false, label: "payments" })],
    ["receipts", countByStudent(TABLES.receipts, student, { matchStudentType: false, label: "receipts" })],
    [
      "counselorPaymentRequests",
      countByStudent(TABLES.counselorPaymentRequests, student, {
        matchStudentType: false,
        label: "counselor payment requests",
      }),
    ],
    [
      "supportRequests",
      countByStudent(TABLES.supportRequests, student, {
        matchStudentType: false,
        label: "support requests",
      }),
    ],
  ];

  const results = await Promise.allSettled(countJobs.map(([, promise]) => promise));

  const counts = countJobs.reduce((acc, [key], index) => {
    acc[key] = results[index].status === "fulfilled" ? Number(results[index].value || 0) : 0;
    return acc;
  }, {});

  counts.paymentRequests = counts.counselorPaymentRequests || 0;
  counts.studentSupportRequests = counts.supportRequests || 0;
  counts.total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

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
          portalCounts: EMPTY_COUNTS,
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
    timeoutMs = DATA_TIMEOUT_MS,
  } = options;

  const studentIds = getStudentIdVariants(student);
  const studentType = getStudentType(student);

  if (!studentIds.length) return [];

  const attempts = studentIds.map((studentId) => {
    let query = supabase.from(table).select("*").eq("student_id", studentId);

    if (matchStudentType && studentType) {
      query = query.eq("student_type", studentType);
    }

    if (orderBy) query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);

    return safeQuery(query, [], timeoutMs, `${label} id:${studentId}`);
  });

  const results = await Promise.allSettled(attempts);

  return uniqueRows(
    results.flatMap((result) =>
      result.status === "fulfilled" ? result.value || [] : []
    )
  );
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

async function fetchPaymentRows(table, student, options = {}) {
  const {
    orderBy = "created_at",
    ascending = false,
    limit = 50,
    label = table,
  } = options;

  const strictRows = await fetchByStudent(table, student, {
    orderBy,
    ascending,
    limit,
    matchStudentType: true,
    label: `${label} payment strict`,
    timeoutMs: PAYMENT_TIMEOUT_MS,
  });

  const fallbackRows = await fetchByStudent(table, student, {
    orderBy,
    ascending,
    limit,
    matchStudentType: false,
    label: `${label} payment fallback`,
    timeoutMs: PAYMENT_TIMEOUT_MS,
  });

  const rows = uniqueRows([...strictRows, ...fallbackRows]);

  console.log("STUDENT PORTAL PAYMENT FETCH", {
    table,
    label,
    studentId: getStudentId(student),
    studentType: getStudentType(student),
    strictRows: strictRows.length,
    fallbackRows: fallbackRows.length,
    mergedRows: rows.length,
  });

  return rows;
}

export async function fetchActivePaymentAccounts() {
  return safeQuery(
    supabase
      .from(TABLES.paymentAccounts)
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(10),
    [],
    PAYMENT_ACCOUNT_TIMEOUT_MS,
    "active payment accounts"
  );
}

export async function fetchStudentPortalOverview(student) {
  if (!student?.id && !student?.student_id) {
    return EMPTY_PORTAL_DATA;
  }

  const [
    applicationsResult,
    invoicesResult,
    paymentsResult,
    receiptsResult,
    paymentRequestsResult,
    paymentAccountsResult,
    supportRequestsResult,
    countsResult,
  ] = await Promise.allSettled([
    fetchWithFallback(TABLES.applications, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 5,
      label: "overview applications",
    }),
    fetchPaymentRows(TABLES.invoices, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "overview invoices",
    }),
    fetchPaymentRows(TABLES.payments, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "overview payments",
    }),
    fetchPaymentRows(TABLES.receipts, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "overview receipts",
    }),
    fetchPaymentRows(TABLES.counselorPaymentRequests, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "overview counselor payment requests",
    }),
    fetchActivePaymentAccounts(),
    fetchPaymentRows(TABLES.supportRequests, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 10,
      label: "overview support requests",
    }),
    getPortalDataCountsForStudent(student),
  ]);

  const applications =
    applicationsResult.status === "fulfilled" ? uniqueRows(applicationsResult.value) : [];
  const invoices =
    invoicesResult.status === "fulfilled" ? uniqueRows(invoicesResult.value) : [];
  const payments =
    paymentsResult.status === "fulfilled" ? uniqueRows(paymentsResult.value) : [];
  const receipts =
    receiptsResult.status === "fulfilled" ? uniqueRows(receiptsResult.value) : [];
  const counselorPaymentRequests =
    paymentRequestsResult.status === "fulfilled" ? uniqueRows(paymentRequestsResult.value) : [];
  const paymentAccounts =
    paymentAccountsResult.status === "fulfilled" ? uniqueRows(paymentAccountsResult.value) : [];
  const supportRequests =
    supportRequestsResult.status === "fulfilled" ? uniqueRows(supportRequestsResult.value) : [];

  const counts =
    countsResult.status === "fulfilled"
      ? countsResult.value
      : student.portalCounts || EMPTY_COUNTS;

  const data = {
    applications,
    documents: [],
    tasks: [],
    communications: [],
    timeline: [],
    universities: [],
    invoices,
    payments,
    receipts,
    counselorPaymentRequests,
    paymentRequests: counselorPaymentRequests,
    paymentAccounts,
    supportRequests,
    studentSupportRequests: supportRequests,
  };

  return {
    ...data,
    counts: mergeCounts(buildCountsFromRows(data), counts),
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
    invoices: fetchPaymentRows(TABLES.invoices, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "invoices",
    }),
    payments: fetchPaymentRows(TABLES.payments, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "payments",
    }),
    receipts: fetchPaymentRows(TABLES.receipts, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "receipts",
    }),
    counselorPaymentRequests: fetchPaymentRows(TABLES.counselorPaymentRequests, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "counselor payment requests",
    }),
    paymentAccounts: fetchActivePaymentAccounts(),
    supportRequests: fetchPaymentRows(TABLES.supportRequests, student, {
      orderBy: "created_at",
      ascending: false,
      limit: 50,
      label: "support requests",
    }),
  };

  const results = await Promise.allSettled(
    Object.entries(fetchJobs).map(async ([key, promise]) => {
      try {
        const rows = await promise;
        return [key, uniqueRows(rows), null];
      } catch (error) {
        return [key, [], error];
      }
    })
  );

  const data = {
    applications: [],
    documents: [],
    tasks: [],
    communications: [],
    timeline: [],
    universities: [],
    invoices: [],
    payments: [],
    receipts: [],
    counselorPaymentRequests: [],
    paymentRequests: [],
    paymentAccounts: [],
    supportRequests: [],
    studentSupportRequests: [],
  };

  const failedSections = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const [key, rows, sectionError] = result.value;
      data[key] = rows;

      if (sectionError) {
        failedSections.push({
          key,
          label: key,
          message: sectionError?.message || `${key} failed.`,
        });
      }

      return;
    }

    failedSections.push({
      key: "unknown",
      label: "Unknown portal section",
      message: result.reason?.message || "Unknown portal section failed.",
    });
  });

  data.paymentRequests = data.counselorPaymentRequests;
  data.studentSupportRequests = data.supportRequests;

  const rowCounts = buildCountsFromRows(data);
  const savedCounts = student.portalCounts || {};
  const counts = mergeCounts(rowCounts, savedCounts);

  console.log("PORTAL DATA DEBUG", {
    student,
    studentId: getStudentId(student),
    studentType: getStudentType(student),
    studentIdVariants: getStudentIdVariants(student),
    applications: data.applications.length,
    documents: data.documents.length,
    tasks: data.tasks.length,
    universities: data.universities.length,
    communications: data.communications.length,
    timeline: data.timeline.length,
    invoices: data.invoices.length,
    payments: data.payments.length,
    receipts: data.receipts.length,
    counselorPaymentRequests: data.counselorPaymentRequests.length,
    paymentAccounts: data.paymentAccounts.length,
    supportRequests: data.supportRequests.length,
    paymentDiagnostics: {
      invoices: data.invoices.length,
      payments: data.payments.length,
      receipts: data.receipts.length,
      paymentAccounts: data.paymentAccounts.length,
      paymentSectionsAreNonBlocking: true,
      paymentTimeoutMs: PAYMENT_TIMEOUT_MS,
    },
    failedSections,
    counts,
  });

  return {
    ...data,
    counts,
    error: buildPortalWarningMessage(failedSections)
      ? new Error(buildPortalWarningMessage(failedSections))
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
  const invoices = data.invoices || [];
  const payments = data.payments || [];
  const receipts = data.receipts || [];
  const counselorPaymentRequests = data.counselorPaymentRequests || data.paymentRequests || [];
  const paymentAccounts = data.paymentAccounts || [];
  const supportRequests = data.supportRequests || data.studentSupportRequests || [];
  const fallbackCounts = data.counts || student.portalCounts || {};

  const latestApplication = applications[0] || {};
  const latestInvoice = invoices[0] || {};
  const latestPayment = payments[0] || {};
  const latestSupportRequest = supportRequests[0] || {};
  const activePaymentAccount =
    paymentAccounts.find((account) => account.is_active) || paymentAccounts[0] || null;

  const pendingTasks = tasks.filter((task) => {
    const status = normalize(task.status);
    return !["done", "completed", "complete", "closed"].includes(status);
  });

  const completedTasks = tasks.length - pendingTasks.length;

  const unpaidInvoices = invoices.filter((invoice) => {
    const status = normalize(invoice.status || invoice.payment_status || invoice.invoice_status);
    return !["paid", "completed", "cancelled", "void"].includes(status);
  });

  const paidInvoices = invoices.filter((invoice) => {
    const status = normalize(invoice.status || invoice.payment_status || invoice.invoice_status);
    return ["paid", "completed"].includes(status);
  });

  const pendingReceipts = receipts.filter((receipt) => {
    const status = normalize(receipt.status || receipt.review_status);
    return ["pending", "pending_review", "submitted", "under_review", "review"].includes(status);
  });

  const openSupportRequests = supportRequests.filter((request) =>
    ["open", "in_progress", "pending"].includes(normalize(request.status))
  );

  const resolvedSupportRequests = supportRequests.filter((request) =>
    ["resolved", "closed"].includes(normalize(request.status))
  );

  const totalInvoiceAmount = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount || invoice.total_amount || invoice.invoice_amount || 0),
    0
  );

  const totalPaidAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || payment.paid_amount || payment.payment_amount || 0),
    0
  );

  const outstandingAmount = Math.max(0, totalInvoiceAmount - totalPaidAmount);

  return {
    studentName: getStudentDisplayName(student),
    studentType: getStudentType(student),
    studentId: getStudentId(student),
    email: getStudentEmail(student),
    phone: getStudentPhone(student),

    latestApplication,
    latestInvoice,
    latestPayment,
    latestSupportRequest,
    activePaymentAccount,
    paymentAccounts,

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

    applicationsCount: applications.length || fallbackCounts.applications || 0,
    documentsCount: documents.length || fallbackCounts.documents || 0,
    tasksCount: tasks.length || fallbackCounts.tasks || 0,
    pendingTasksCount: tasks.length > 0 ? pendingTasks.length : fallbackCounts.tasks || 0,
    completedTasksCount: completedTasks,
    communicationsCount: communications.length || fallbackCounts.communications || 0,
    timelineCount: timeline.length || fallbackCounts.timeline || 0,
    universitiesCount: universities.length || fallbackCounts.universities || 0,

    invoicesCount: invoices.length || fallbackCounts.invoices || 0,
    paymentsCount: payments.length || fallbackCounts.payments || 0,
    receiptsCount: receipts.length || fallbackCounts.receipts || 0,
    counselorPaymentRequestsCount:
      counselorPaymentRequests.length ||
      fallbackCounts.counselorPaymentRequests ||
      fallbackCounts.paymentRequests ||
      0,

    supportRequestsCount:
      supportRequests.length ||
      fallbackCounts.supportRequests ||
      fallbackCounts.studentSupportRequests ||
      0,
    openSupportRequestsCount: openSupportRequests.length,
    resolvedSupportRequestsCount: resolvedSupportRequests.length,

    unpaidInvoicesCount: unpaidInvoices.length,
    paidInvoicesCount: paidInvoices.length,
    pendingReceiptsCount: pendingReceipts.length,
    totalInvoiceAmount,
    totalPaidAmount,
    outstandingAmount,

    pendingTasks,
    unpaidInvoices,
    pendingReceipts,
    supportRequests,
    openSupportRequests,
    resolvedSupportRequests,
  };
}

export function buildPortalHealthReport(
  student = {},
  data = {}
) {
  const summary = buildPortalSummary(student, data);

  const checks = {
    applications:
      summary.applicationsCount > 0,

    universities:
      summary.universitiesCount > 0,

    documents:
      summary.documentsCount > 0,

    tasks:
      summary.tasksCount > 0,

    communications:
      summary.communicationsCount > 0,

    timeline:
      summary.timelineCount > 0,

    payments:
      summary.invoicesCount > 0 ||
      summary.paymentsCount > 0,

    support:
      summary.supportRequestsCount > 0,
  };

  const passed =
    Object.values(checks)
      .filter(Boolean)
      .length;

  const total =
    Object.keys(checks).length;

  return {
    score: Math.round(
      (passed / total) * 100
    ),

    passed,
    total,

    checks,

    health:
      passed >= 7
        ? "Excellent"
        : passed >= 5
        ? "Good"
        : passed >= 3
        ? "Needs Review"
        : "Critical",
  };
}

export function buildPortalWorkflowVerification(
  student = {},
  data = {}
) {
  const summary =
    buildPortalSummary(student, data);

  return {
    inquiry:
      Boolean(student.id),

    universityPlanning:
      summary.universitiesCount > 0,

    application:
      summary.applicationsCount > 0,

    offer:
      data.applications?.some(
        app =>
          String(
            app.offer_status || ""
          )
            .toLowerCase()
            .includes("offer")
      ) || false,

    cas:
      data.applications?.some(
        app =>
          String(
            app.cas_status || ""
          )
            .toLowerCase()
            .includes("issued")
      ) || false,

    visa:
      data.applications?.some(
        app =>
          String(
            app.visa_status || ""
          )
            .toLowerCase()
            .includes("approved")
      ) || false,

    payments:
      summary.paymentsCount > 0,

    support:
      summary.supportRequestsCount > 0,

    timeline:
      summary.timelineCount > 0,
  };
}

export function buildPortalDiagnostics(
  student = {},
  data = {}
) {
  const verification =
    buildPortalWorkflowVerification(
      student,
      data
    );

  const missing = Object.entries(
    verification
  )
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    verified:
      missing.length === 0,

    missing,

    workflowCoverage:
      Math.round(
        ((Object.keys(verification)
          .length -
          missing.length) /
          Object.keys(verification)
            .length) *
          100
      ),

    verification,
  };
}

export async function uploadStudentReceipt({
  student,
  invoiceId = null,
  amount = null,
  currency = "PKR",
  paymentMethod = "",
  reference = "",
  receiptUrl = "",
  notes = "",
  file = null,
}) {
  const studentId = getStudentId(student);
  const studentType = getStudentType(student);

  if (!studentId) {
    throw new Error("Student record is missing.");
  }

  let finalReceiptUrl = receiptUrl || "";

  if (file) {
    const extension = file.name?.split(".").pop() || "file";
    const safeName = `${studentType}-${studentId}-${Date.now()}.${extension}`;
    const uploadPath = `student-receipts/${studentType}/${studentId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("student-receipts")
      .upload(uploadPath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from("student-receipts")
      .getPublicUrl(uploadPath);

    finalReceiptUrl = publicData?.publicUrl || uploadPath;
  }

  if (!finalReceiptUrl) {
    throw new Error("Receipt file or receipt URL is required.");
  }

  const payload = {
    student_id: studentId,
    student_type: studentType,
    invoice_id: invoiceId || null,
    amount: amount === "" || amount === null ? null : Number(amount),
    currency: currency || "PKR",
    payment_method: paymentMethod || null,
    reference: reference || null,
    receipt_url: finalReceiptUrl,
    notes: notes || null,
    status: "pending_review",
    review_status: "pending_review",
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLES.receipts)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  try {
    await supabase.from(TABLES.timeline).insert({
      student_id: studentId,
      student_type: studentType,
      action_type: "receipt_uploaded",
      title: "Receipt Uploaded",
      description: "Student uploaded a payment receipt for admin review.",
      new_value: finalReceiptUrl,
      metadata: {
        receipt_id: data?.id || null,
        invoice_id: invoiceId || null,
        amount: payload.amount,
        currency: payload.currency,
        source: "student_portal",
      },
    });
  } catch (timelineError) {
    console.warn("Receipt upload timeline event skipped:", timelineError?.message || timelineError);
  }

  return {
    receipt: data,
    error: null,
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

function buildAccountPayloadFromStudent(student = {}, options = {}) {
  const studentId = getStudentId(student);
  const studentType = getStudentType(student);
  const email = String(options.email || getStudentEmail(student) || "").trim().toLowerCase();

  if (!studentId) {
    throw new Error("Student record is missing.");
  }

  if (!email) {
    throw new Error("Student email is required to create a portal account.");
  }

  return {
    email,
    student_id: studentId,
    student_type: studentType,
    is_active: options.isActive ?? true,
    must_change_password: options.mustChangePassword ?? true,
  };
}

async function callAccountRpc(names = [], params = {}, timeoutMs = ACCOUNT_TIMEOUT_MS) {
  const errors = [];

  for (const name of names) {
    const result = await withTimeout(
      supabase.rpc(name, params),
      `${name} timed out.`,
      timeoutMs
    );

    if (!result.error && !result.timedOut) {
      return {
        data: result.data,
        error: null,
        rpcName: name,
      };
    }

    errors.push(result.error || new Error(`${name} timed out.`));
  }

  return {
    data: null,
    error: errors[errors.length - 1] || new Error("Portal account RPC failed."),
    rpcName: null,
  };
}

export async function createStudentPortalAccount({
  student,
  email = "",
  temporaryPassword = "",
  mustChangePassword = true,
  isActive = true,
  adminProfile = null,
}) {
  try {
    const payload = buildAccountPayloadFromStudent(student, {
      email,
      mustChangePassword,
      isActive,
    });

    if (!temporaryPassword || String(temporaryPassword).length < 6) {
      throw new Error("Temporary password must be at least 6 characters.");
    }

    const rpcResult = await callAccountRpc(
      [
        "create_student_portal_account",
        "admin_create_student_portal_account",
        "create_or_reset_student_portal_account",
      ],
      {
        p_email: payload.email,
        p_password: temporaryPassword,
        p_student_id: payload.student_id,
        p_student_type: payload.student_type,
        p_is_active: payload.is_active,
        p_must_change_password: payload.must_change_password,
        p_admin_id: adminProfile?.id || null,
      }
    );

    if (rpcResult.error) {
      throw new Error(
        `${rpcResult.error.message || "Portal account RPC is missing."} Create/reset account requires a Supabase RPC that hashes the password safely.`
      );
    }

    const accountResult = await fetchStudentPortalAccountForStudent({
      ...student,
      student_type: payload.student_type,
    });

    return {
      success: true,
      account: accountResult.account || null,
      data: rpcResult.data,
      message: "Portal account created.",
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      account: null,
      data: null,
      message: error.message || "Portal account could not be created.",
      error,
    };
  }
}

export async function resetStudentPortalAccountPassword({
  accountId,
  email = "",
  newPassword = "",
  mustChangePassword = true,
  adminProfile = null,
}) {
  try {
    if (!accountId && !email) {
      throw new Error("Portal account is missing.");
    }

    if (!newPassword || String(newPassword).length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }

    const rpcResult = await callAccountRpc(
      [
        "reset_student_portal_password",
        "admin_reset_student_portal_password",
        "set_student_portal_password",
      ],
      {
        p_account_id: accountId || null,
        p_email: String(email || "").trim().toLowerCase() || null,
        p_new_password: newPassword,
        p_password: newPassword,
        p_must_change_password: mustChangePassword,
        p_admin_id: adminProfile?.id || null,
      }
    );

    if (rpcResult.error) {
      throw new Error(
        `${rpcResult.error.message || "Portal password reset RPC is missing."} Reset requires a Supabase RPC that hashes the password safely.`
      );
    }

    return {
      success: true,
      data: rpcResult.data,
      message: "Portal password reset.",
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error.message || "Portal password could not be reset.",
      error,
    };
  }
}

export async function updateStudentPortalAccountStatus({
  accountId,
  isActive,
  mustChangePassword,
}) {
  try {
    if (!accountId) {
      throw new Error("Portal account is missing.");
    }

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (typeof isActive === "boolean") {
      payload.is_active = isActive;
    }

    if (typeof mustChangePassword === "boolean") {
      payload.must_change_password = mustChangePassword;
    }

    let { data, error } = await supabase
      .from(TABLES.accounts)
      .update(payload)
      .eq("id", accountId)
      .select(
        "id, email, student_id, student_type, is_active, must_change_password, password_changed_at, last_login_at, created_at, updated_at"
      )
      .single();

    if (error) {
      const minimalPayload = { ...payload };
      delete minimalPayload.updated_at;

      const retry = await supabase
        .from(TABLES.accounts)
        .update(minimalPayload)
        .eq("id", accountId)
        .select(
          "id, email, student_id, student_type, is_active, must_change_password, password_changed_at, last_login_at, created_at, updated_at"
        )
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    return {
      success: true,
      account: data,
      message: "Portal account updated.",
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      account: null,
      message: error.message || "Portal account could not be updated.",
      error,
    };
  }
}

export async function activateStudentPortalAccount(accountId) {
  return updateStudentPortalAccountStatus({
    accountId,
    isActive: true,
  });
}

export async function deactivateStudentPortalAccount(accountId) {
  return updateStudentPortalAccountStatus({
    accountId,
    isActive: false,
  });
}

export async function forceStudentPortalPasswordChange(accountId, mustChangePassword = true) {
  return updateStudentPortalAccountStatus({
    accountId,
    mustChangePassword,
  });
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

export default {
  findStudentsForPortal,
  findStudentForPortal,

  getPortalDataCountsForStudent,
  enrichStudentsWithPortalCounts,

  fetchStudentPortalOverview,
  fetchStudentPortalData,

  buildPortalSummary,
  buildPortalHealthReport,
  buildPortalWorkflowVerification,
  buildPortalDiagnostics,

  uploadStudentReceipt,

  fetchStudentPortalAccountForStudent,

  createStudentPortalAccount,
  resetStudentPortalAccountPassword,
  updateStudentPortalAccountStatus,

  activateStudentPortalAccount,
  deactivateStudentPortalAccount,
  forceStudentPortalPasswordChange,

  loginStudentPortalAccount,
  changeStudentPortalPassword,
};