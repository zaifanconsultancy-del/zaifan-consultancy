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
  const [studentApplication, setStudentApplication] = useState(null);
  const [studentUniversities, setStudentUniversities] = useState([]);
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentCommunications, setStudentCommunications] = useState([]);
  const [studentInvoices, setStudentInvoices] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [studentReceipts, setStudentReceipts] = useState([]);
  const [studentPaymentRequests, setStudentPaymentRequests] = useState([]);
  const [studentSupportRequests, setStudentSupportRequests] = useState([]);

  useEffect(() => {
    requestRef.current += 1;

    setOsLoading(false);
    setOsError("");
    setOsSourceHealth({});

    setStudentDocuments([]);
    setStudentApplication(null);
    setStudentUniversities([]);
    setStudentTasks([]);
    setStudentCommunications([]);
    setStudentInvoices([]);
    setStudentPayments([]);
    setStudentReceipts([]);
    setStudentPaymentRequests([]);
    setStudentSupportRequests([]);
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

    const sourceReferences =
      Array.isArray(identitySources) && identitySources.length
        ? identitySources.map((source) => ({
            id: source.student_id ?? source.id,
            type: normalize(source.student_type || "inquiry"),
          }))
        : idVariants.flatMap((idValue) =>
            (typeVariants.length ? typeVariants : [studentType]).map(
              (typeValue) => ({
                id: idValue,
                type: normalize(typeValue),
              })
            )
          );

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
        const errors = results
          .map((result) => result.error)
          .filter(Boolean);

        return { rows, errors };
      };

      let result = await runQueries(matchStudentType);

      if (
        matchStudentType &&
        allowLegacyWithoutStudentType &&
        result.errors.length &&
        result.rows.length === 0 &&
        result.errors.every(isMissingStudentTypeColumn)
      ) {
        result = await runQueries(false);
      }

      if (result.errors.length && result.rows.length === 0) {
        throw result.errors[0];
      }

      return Array.from(
        new Map(
          result.rows.map((item) => [
            item.id || JSON.stringify(item),
            item,
          ])
        ).values()
      );
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
        key: "applications",
        run: () =>
          fetchByStudentId("student_applications", {
            orderBy: "created_at",
            ascending: false,
            limit: 10,
            matchStudentType: true,
            allowLegacyWithoutStudentType: false,
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
            message:
              result.reason?.message ||
              `${key} source failed.`,
          });
        }
      });

      setOsSourceHealth(health);

      if (values.documents !== null) {
        setStudentDocuments(values.documents);
      }

      if (values.applications !== null) {
        setStudentApplication(values.applications?.[0] || null);
      }

      if (values.universities !== null) {
        setStudentUniversities(values.universities);
      }

      if (values.tasks !== null) {
        setStudentTasks(values.tasks);
      }

      if (values.communications !== null) {
        setStudentCommunications(values.communications);
      }

      if (values.invoices !== null) {
        setStudentInvoices(values.invoices);
      }

      if (values.payments !== null) {
        setStudentPayments(values.payments);
      }

      if (values.receipts !== null) {
        setStudentReceipts(values.receipts);
      }

      if (values.paymentRequests !== null) {
        setStudentPaymentRequests(values.paymentRequests);
      }

      if (values.support !== null) {
        setStudentSupportRequests(values.support);
      }

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
      setOsError(
        error?.message || "Student OS data failed to load."
      );
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
    studentApplication,
    studentUniversities,
    studentTasks,
    studentCommunications,
    studentInvoices,
    studentPayments,
    studentReceipts,
    studentPaymentRequests,
    studentSupportRequests,
    setStudentSupportRequests,
    loadStudentOsData,
  };
}
