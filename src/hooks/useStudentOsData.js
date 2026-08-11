// useStudentOsData STUDENT 360 V5 — authoritative cross-portal case loader
// Core Student Detail data plus deep AI context sources (requirements, visa,
// support threads, follow-ups and timeline). All reads remain scoped to the
// resolved inquiry/appointment identities; failures are isolated per source.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "../lib/supabaseClient";
import * as studentPortalApi from "../lib/studentPortal";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function uniqueRows(rows = []) {
  return Array.from(
    new Map(
      (Array.isArray(rows) ? rows : []).map((item) => [
        item?.id || JSON.stringify(item),
        item,
      ])
    ).values()
  );
}

export default function useStudentOsData({
  studentIdentity,
  studentId,
  studentType,
  personId,
  workingStudent,
  getStudentIdVariants,
  getStudentTypeVariants,
}) {
  const requestRef = useRef(0);

  const [osLoading, setOsLoading] = useState(false);
  const [osError, setOsError] = useState("");
  const [osSourceHealth, setOsSourceHealth] = useState({});

  const [studentDocuments, setStudentDocuments] = useState([]);
  const [studentDocumentRequirements, setStudentDocumentRequirements] = useState([]);
  const [studentApplication, setStudentApplication] = useState(null);
  const [studentApplications, setStudentApplications] = useState([]);
  const [studentApplicationRequirements, setStudentApplicationRequirements] = useState([]);
  const [studentApplicationEvents, setStudentApplicationEvents] = useState([]);
  const [studentApplicationTimeline, setStudentApplicationTimeline] = useState([]);
  const [studentUniversities, setStudentUniversities] = useState([]);
  const [studentUniversityRequirements, setStudentUniversityRequirements] = useState([]);
  const [studentUniversityEvents, setStudentUniversityEvents] = useState([]);
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentCommunications, setStudentCommunications] = useState([]);
  const [studentInvoices, setStudentInvoices] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [studentReceipts, setStudentReceipts] = useState([]);
  const [studentPaymentRequests, setStudentPaymentRequests] = useState([]);
  const [studentSupportRequests, setStudentSupportRequests] = useState([]);
  const [studentSupportMessages, setStudentSupportMessages] = useState([]);
  const [studentVisaCases, setStudentVisaCases] = useState([]);
  const [studentVisaRequirements, setStudentVisaRequirements] = useState([]);
  const [studentVisaEvents, setStudentVisaEvents] = useState([]);
  const [studentFollowUps, setStudentFollowUps] = useState([]);
  const [studentCrmTimeline, setStudentCrmTimeline] = useState([]);

  useEffect(() => {
    requestRef.current += 1;

    setOsLoading(false);
    setOsError("");
    setOsSourceHealth({});

    setStudentDocuments([]);
    setStudentDocumentRequirements([]);
    setStudentApplication(null);
    setStudentApplications([]);
    setStudentApplicationRequirements([]);
    setStudentApplicationEvents([]);
    setStudentApplicationTimeline([]);
    setStudentUniversities([]);
    setStudentUniversityRequirements([]);
    setStudentUniversityEvents([]);
    setStudentTasks([]);
    setStudentCommunications([]);
    setStudentInvoices([]);
    setStudentPayments([]);
    setStudentReceipts([]);
    setStudentPaymentRequests([]);
    setStudentSupportRequests([]);
    setStudentSupportMessages([]);
    setStudentVisaCases([]);
    setStudentVisaRequirements([]);
    setStudentVisaEvents([]);
    setStudentFollowUps([]);
    setStudentCrmTimeline([]);
  }, [studentIdentity]);

  const loadStudentOsData = useCallback(async () => {
    if (!studentId) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setOsLoading(true);
    setOsError("");

    const idVariants = getStudentIdVariants();
    const typeVariants = [...new Set(getStudentTypeVariants())];

    let identitySources = [];

    try {
      identitySources = await studentPortalApi.getStudentIdentitySources({
        ...workingStudent,
        id: studentId,
        student_type: studentType,
        person_id: personId || workingStudent?.person_id || null,
      });
    } catch (identityError) {
      console.warn(
        "Permanent identity sources could not be resolved; using current source only.",
        identityError?.message || identityError
      );
    }

    const sourceReferences = [
      ...(Array.isArray(identitySources) ? identitySources : []).map((source) => ({
        id: source.student_id ?? source.id,
        type: normalize(source.student_type || "inquiry"),
      })),
      ...idVariants.flatMap((idValue) =>
        (typeVariants.length ? typeVariants : [studentType]).map((typeValue) => ({
          id: idValue,
          type: normalize(typeValue),
        }))
      ),
    ];

    const uniqueSourceReferences = Array.from(
      new Map(
        sourceReferences
          .filter(
            (item) =>
              item.id !== null &&
              item.id !== undefined &&
              item.id !== ""
          )
          .map((item) => [
            `${item.type}:${String(item.id)}`,
            item,
          ])
      ).values()
    );

    const isMissingStudentTypeColumn = (error) => {
      const message = String(error?.message || "").toLowerCase();

      return (
        message.includes("student_type") &&
        (message.includes("column") ||
          message.includes("does not exist") ||
          message.includes("schema cache"))
      );
    };

    const fetchByStudentId = async (table, options = {}) => {
      const {
        select = "*",
        orderBy = "created_at",
        ascending = false,
        limit = null,
        matchStudentType = false,
        allowLegacyWithoutStudentType = false,
      } = options;

      const runQueries = async (typed) => {
        const attempts = uniqueSourceReferences.map(
          ({ id: idValue, type: sourceType }) => {
            let query = supabase
              .from(table)
              .select(select)
              .eq("student_id", idValue);

            if (typed && sourceType) {
              query = query.eq("student_type", sourceType);
            }

            if (orderBy) {
              query = query.order(orderBy, { ascending });
            }

            if (limit) {
              query = query.limit(limit);
            }

            return query;
          }
        );

        const results = await Promise.all(attempts);
        const rows = results.flatMap((result) => result.data || []);
        const errors = results.map((result) => result.error).filter(Boolean);

        return { rows, errors };
      };

      let result = await runQueries(matchStudentType);

      if (
        matchStudentType &&
        allowLegacyWithoutStudentType &&
        result.rows.length === 0 &&
        (
          result.errors.length === 0 ||
          result.errors.every(isMissingStudentTypeColumn)
        )
      ) {
        result = await runQueries(false);
      }

      if (result.errors.length && result.rows.length === 0) {
        throw result.errors[0];
      }

      return uniqueRows(result.rows);
    };

    const fetchByForeignIds = async (
      table,
      column,
      ids,
      { orderBy = "created_at", ascending = false, limit = null } = {}
    ) => {
      const cleanIds = [
        ...new Set(
          (Array.isArray(ids) ? ids : [])
            .filter((value) => value !== null && value !== undefined && value !== "")
            .map((value) => String(value))
        ),
      ];

      if (!cleanIds.length) return [];

      let query = supabase
        .from(table)
        .select("*")
        .in(column, cleanIds);

      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return uniqueRows(data || []);
    };

    const sources = [
      {
        key: "support",
        run: () =>
          fetchByStudentId("student_support_requests", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "documents",
        run: () =>
          fetchByStudentId("student_documents", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "documentRequirements",
        run: () =>
          fetchByStudentId("student_document_requirements", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "applications",
        run: () =>
          fetchByStudentId("student_applications", {
            orderBy: "created_at",
            ascending: false,
            limit: 25,
            matchStudentType: true,
            allowLegacyWithoutStudentType: false,
          }),
      },
      {
        key: "applicationTimeline",
        run: () =>
          fetchByStudentId("student_application_timeline", {
            orderBy: "created_at",
            ascending: false,
            limit: 150,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "universities",
        run: () =>
          fetchByStudentId("student_universities", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "tasks",
        run: () =>
          fetchByStudentId("student_tasks", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "communications",
        run: () =>
          fetchByStudentId("student_communications", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "invoices",
        run: () =>
          fetchByStudentId("student_invoices", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "payments",
        run: () =>
          fetchByStudentId("student_payments", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "receipts",
        run: () =>
          fetchByStudentId("student_receipts", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "paymentRequests",
        run: () =>
          fetchByStudentId("counselor_payment_requests", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "visaCases",
        run: () =>
          fetchByStudentId("student_visas", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: false,
          }),
      },
      {
        key: "visaEvents",
        run: () =>
          fetchByStudentId("student_visa_events", {
            orderBy: "created_at",
            ascending: false,
            limit: 200,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "followUps",
        run: () =>
          fetchByStudentId("follow_up_reminders", {
            orderBy: "created_at",
            ascending: false,
            limit: 150,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "crmTimeline",
        run: () =>
          fetchByStudentId("crm_timeline", {
            orderBy: "created_at",
            ascending: false,
            limit: 200,
            matchStudentType: false,
          }),
      },
    ];

    try {
      const settled = await Promise.allSettled(
        sources.map((source) => source.run())
      );

      if (requestRef.current !== requestId) return;

      const values = {};
      const health = {};
      const failures = [];

      settled.forEach((result, index) => {
        const key = sources[index].key;

        if (result.status === "fulfilled") {
          values[key] = result.value || [];
          health[key] = "ready";
        } else {
          values[key] = null;
          health[key] = "error";
          failures.push({
            key,
            message: result.reason?.message || `${key} source failed.`,
          });
        }
      });

      const runDependentSource = async (key, runner) => {
        try {
          const rows = await runner();
          values[key] = rows || [];
          health[key] = "ready";
        } catch (error) {
          values[key] = null;
          health[key] = "error";
          failures.push({
            key,
            message: error?.message || `${key} source failed.`,
          });
        }
      };

      const applicationIds = (values.applications || []).map((item) => item.id);
      const universityIds = (values.universities || []).map((item) => item.id);
      const visaIds = (values.visaCases || []).map((item) => item.id);
      const supportIds = (values.support || []).map((item) => item.id);

      await Promise.all([
        runDependentSource("applicationRequirements", () =>
          fetchByForeignIds(
            "student_application_requirements",
            "application_id",
            applicationIds,
            { orderBy: "created_at", ascending: true, limit: 300 }
          )
        ),
        runDependentSource("applicationEvents", () =>
          fetchByForeignIds(
            "student_application_events",
            "application_id",
            applicationIds,
            { orderBy: "created_at", ascending: false, limit: 300 }
          )
        ),
        runDependentSource("universityRequirements", () =>
          fetchByForeignIds(
            "student_university_requirements",
            "student_university_id",
            universityIds,
            { orderBy: "created_at", ascending: true, limit: 400 }
          )
        ),
        runDependentSource("universityEvents", () =>
          fetchByForeignIds(
            "student_university_events",
            "student_university_id",
            universityIds,
            { orderBy: "created_at", ascending: false, limit: 300 }
          )
        ),
        runDependentSource("visaRequirements", () =>
          fetchByForeignIds(
            "student_visa_requirements",
            "visa_id",
            visaIds,
            { orderBy: "created_at", ascending: true, limit: 300 }
          )
        ),
        runDependentSource("supportMessages", () =>
          fetchByForeignIds(
            "student_support_messages",
            "support_request_id",
            supportIds,
            { orderBy: "created_at", ascending: true, limit: 500 }
          )
        ),
      ]);

      if (requestRef.current !== requestId) return;

      setOsSourceHealth(health);

      if (values.documents !== null) setStudentDocuments(values.documents);
      if (values.documentRequirements !== null) {
        setStudentDocumentRequirements(values.documentRequirements);
      }
      if (values.applications !== null) {
        setStudentApplications(values.applications);
        setStudentApplication(values.applications?.[0] || null);
      }
      if (values.applicationRequirements !== null) {
        setStudentApplicationRequirements(values.applicationRequirements);
      }
      if (values.applicationEvents !== null) {
        setStudentApplicationEvents(values.applicationEvents);
      }
      if (values.applicationTimeline !== null) {
        setStudentApplicationTimeline(values.applicationTimeline);
      }
      if (values.universities !== null) setStudentUniversities(values.universities);
      if (values.universityRequirements !== null) {
        setStudentUniversityRequirements(values.universityRequirements);
      }
      if (values.universityEvents !== null) {
        setStudentUniversityEvents(values.universityEvents);
      }
      if (values.tasks !== null) setStudentTasks(values.tasks);
      if (values.communications !== null) setStudentCommunications(values.communications);
      if (values.invoices !== null) setStudentInvoices(values.invoices);
      if (values.payments !== null) setStudentPayments(values.payments);
      if (values.receipts !== null) setStudentReceipts(values.receipts);
      if (values.paymentRequests !== null) setStudentPaymentRequests(values.paymentRequests);
      if (values.support !== null) setStudentSupportRequests(values.support);
      if (values.supportMessages !== null) setStudentSupportMessages(values.supportMessages);
      if (values.visaCases !== null) setStudentVisaCases(values.visaCases);
      if (values.visaRequirements !== null) setStudentVisaRequirements(values.visaRequirements);
      if (values.visaEvents !== null) setStudentVisaEvents(values.visaEvents);
      if (values.followUps !== null) setStudentFollowUps(values.followUps);
      if (values.crmTimeline !== null) setStudentCrmTimeline(values.crmTimeline);

      if (failures.length) {
        setOsError(
          `Some Student OS sources could not refresh: ${failures
            .map((item) => item.key)
            .join(", ")}. Existing data was preserved for failed sources.`
        );
      }
    } catch (error) {
      if (requestRef.current !== requestId) return;

      console.error("Student OS data failed to load:", error);
      setOsError(error?.message || "Student OS data failed to load.");
    } finally {
      if (requestRef.current === requestId) {
        setOsLoading(false);
      }
    }
  }, [
    getStudentIdVariants,
    getStudentTypeVariants,
    personId,
    studentId,
    studentType,
    workingStudent,
  ]);

  return {
    osLoading,
    osError,
    osSourceHealth,
    studentDocuments,
    studentDocumentRequirements,
    studentApplication,
    studentApplications,
    studentApplicationRequirements,
    studentApplicationEvents,
    studentApplicationTimeline,
    studentUniversities,
    studentUniversityRequirements,
    studentUniversityEvents,
    studentTasks,
    studentCommunications,
    studentInvoices,
    studentPayments,
    studentReceipts,
    studentPaymentRequests,
    studentSupportRequests,
    studentSupportMessages,
    studentVisaCases,
    studentVisaRequirements,
    studentVisaEvents,
    studentFollowUps,
    studentCrmTimeline,
    setStudentSupportRequests,
    loadStudentOsData,
  };
}
