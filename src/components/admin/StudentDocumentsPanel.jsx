// StudentDocumentsPanel V14 — Docked Inspector + Persistent Workspace State
// Functional overhaul:
// - true multi-file document blocks (without destructive replacement)
// - multi-select upload
// - custom document types
// - search + status filtering
// - preview/open, download, verify, reject, archive, restore and delete
// - replacement uploads preserve the previous file as archived history
// - grouped document blocks with live counts
// - compact operational UI with purpose-first controls
// - preserves existing Supabase table/storage/timeline/parent-refresh architecture
// - no scoped <style> override block; Tailwind classes are explicit in the component
// - parent-data-first loading prevents duplicate Supabase requests and timeout storms
// - resilient lightweight retry keeps existing data instead of blanking the workspace

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  File,
  FilePlus2,
  Files,
  FolderOpen,
  History,
  CalendarClock,
  ListChecks,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  XCircle,
  Square,
  CheckSquare,
  Save,
  Database,
  Undo2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 45000;
const FAST_RETRY_TIMEOUT_MS = 15000;
const MUTATION_WATCHDOG_MS = 8000;
const STORAGE_BUCKET = "student-documents";

const DEFAULT_DOCUMENT_TYPES = [
  {
    name: "Passport",
    group: "Identity",
    aliases: ["passport", "cnic", "identity"],
  },
  {
    name: "Transcript",
    group: "Academic",
    aliases: ["transcript", "marks", "marksheet"],
  },
  {
    name: "Degree",
    group: "Academic",
    aliases: ["degree", "certificate", "diploma"],
  },
  {
    name: "IELTS",
    group: "Language",
    aliases: ["ielts", "toefl", "pte", "duolingo", "language"],
  },
  {
    name: "Personal Statement",
    group: "Application",
    aliases: ["personal statement", "statement of purpose", "sop", "motivation"],
  },
  {
    name: "CV",
    group: "Application",
    aliases: ["cv", "resume", "curriculum vitae"],
  },
  {
    name: "Financial Documents",
    group: "Financial",
    aliases: ["financial", "bank", "sponsor", "income", "fund"],
  },
];

const STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const safeFileName = (value) =>
  String(value || "document")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const formatDate = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function StudentDocumentsPanel({
  student,
  sharedDocuments = null,
  onSharedDataChange = null,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState(() => new Set());
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBlocks, setExpandedBlocks] = useState(() => new Set(["Passport"]));
  const [customTypes, setCustomTypes] = useState([]);
  const [showAddType, setShowAddType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState("");
  const [customTypeGroup, setCustomTypeGroup] = useState("Custom");
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [undoAction, setUndoAction] = useState(null);

  const [requirements, setRequirements] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showDeleted, setShowDeleted] = useState(false);

  const [metadataTarget, setMetadataTarget] = useState(null);
  const [metadataForm, setMetadataForm] = useState({
    document_category: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });

  const [actorId, setActorId] = useState(null);

  const undoTimerRef = useRef(null);

  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);

  const studentId = student?.id;
  const studentType =
    student?.student_type ||
    student?.__leadType ||
    student?.type ||
    "inquiry";

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolveActor = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setActorId(data?.session?.user?.id || null);
      } catch {
        if (!cancelled) setActorId(null);
      }
    };

    void resolveActor();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!studentId) {
      setRequirements([]);
      setHistoryEvents([]);
      return;
    }

    const loadMasterFileSupportData = async () => {
      const [requirementsResult, historyResult] = await Promise.allSettled([
        supabase
          .from("student_document_requirements")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .eq("status", "active")
          .order("created_at", { ascending: true }),

        supabase
          .from("student_document_events")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(150),
      ]);

      if (!mountedRef.current) return;

      if (
        requirementsResult.status === "fulfilled" &&
        !requirementsResult.value.error
      ) {
        setRequirements(requirementsResult.value.data || []);
      }

      if (
        historyResult.status === "fulfilled" &&
        !historyResult.value.error
      ) {
        setHistoryEvents(historyResult.value.data || []);
      }
    };

    void loadMasterFileSupportData();
  }, [studentId, studentType]);

  useEffect(() => {
    if (!Array.isArray(sharedDocuments)) return;

    // StudentDetailModal already loads student_documents as part of the Student OS
    // payload. Reuse that result instead of immediately firing a second identical
    // Supabase request that can compete with the parent load and produce timeouts.
    setDocuments(sharedDocuments);
    setLoading(false);

    // Clear stale timeout/error messages as soon as authoritative parent data arrives.
    setError((current) =>
      current.includes("refresh delayed") ||
      current.includes("timed out") ||
      current.includes("Failed to load")
        ? ""
        : current
    );
  }, [sharedDocuments]);

  useEffect(() => {
    // When this panel is used inside StudentDetailModal, sharedDocuments is always
    // an array (including an intentionally empty array), so the parent is the source
    // of truth. Standalone usages still fetch their own data.
    if (Array.isArray(sharedDocuments)) return;

    loadDocuments({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const startSaving = (key) => {
    if (!key) return;

    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });
    });
  };

  const stopSaving = (key) => {
    if (!key) return;

    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    });
  };

  const isSaving = (key) => savingKeys.has(key);

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const notifyParent = async () => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await Promise.race([
        Promise.resolve(onSharedDataChange()),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Student OS refresh timed out.")),
            10000
          )
        ),
      ]);
    } catch (refreshError) {
      console.warn(
        "Documents saved, but parent Student OS refresh failed:",
        refreshError
      );
    }
  };

  const createTimelineEvent = async ({
    eventType,
    title,
    description,
    newValue = "",
  }) => {
    try {
      await supabase.from("student_application_timeline").insert({
        student_id: Number(studentId),
        student_type: studentType,
        event_type: eventType,
        title,
        description,
        new_value: newValue,
      });
    } catch {
      // Timeline logging must never block the document action.
    }
  };

  const createDocumentEvent = async ({
    documentId = null,
    eventType,
    eventLabel = "",
    previousStatus = null,
    newStatus = null,
    previousNotes = null,
    newNotes = null,
    reason = null,
    metadata = {},
  }) => {
    try {
      const { data, error: eventError } = await supabase
        .from("student_document_events")
        .insert({
          student_id: Number(studentId),
          student_type: studentType,
          document_id: documentId,
          event_type: eventType,
          event_label: eventLabel || eventType,
          previous_status: previousStatus,
          new_status: newStatus,
          previous_notes: previousNotes,
          new_notes: newNotes,
          reason,
          metadata,
          performed_by: actorId,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      safeSet(() => {
        setHistoryEvents((previous) => [data, ...previous].slice(0, 150));
      });

      return data;
    } catch (eventError) {
      console.warn("Document history event failed:", eventError);
      return null;
    }
  };

  const reloadHistory = async () => {
    if (!studentId) return;

    setHistoryLoading(true);

    try {
      const { data, error: historyError } = await supabase
        .from("student_document_events")
        .select("*")
        .eq("student_id", studentId)
        .eq("student_type", studentType)
        .order("created_at", { ascending: false })
        .limit(150);

      if (historyError) throw historyError;
      safeSet(() => setHistoryEvents(data || []));
    } catch (historyError) {
      console.warn("Document history refresh failed:", historyError);
    } finally {
      safeSet(() => setHistoryLoading(false));
    }
  };

  const loadDocuments = async ({ silent = false } = {}) => {
    const requestId = Date.now();
    loadRequestRef.current = requestId;

    if (!studentId) {
      safeSet(() => {
        setDocuments([]);
        setLoading(false);
        setError("");
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      if (!silent) setError("");
    });

    const runPrimaryQuery = () =>
      withTimeout(
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(500),
        "Document refresh delayed."
      );

    const runFastRetry = () =>
      Promise.race([
        supabase
          .from("student_documents")
          .select(
            "id,student_id,student_type,document_name,status,file_path,file_url,notes,created_at,updated_at"
          )
          .eq("student_id", studentId)
          .limit(500),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Document refresh delayed.")),
            FAST_RETRY_TIMEOUT_MS
          )
        ),
      ]);

    try {
      let result;

      try {
        result = await runPrimaryQuery();
      } catch (primaryError) {
        console.warn(
          "Primary document refresh was slow; trying lightweight fallback:",
          primaryError?.message || primaryError
        );
        result = await runFastRetry();
      }

      if (loadRequestRef.current !== requestId) return;
      if (result?.error) throw result.error;

      safeSet(() => {
        setDocuments(result?.data || []);
        setError("");
        if (!silent) {
          setSuccessMessage(
            `Document vault refreshed · ${result?.data?.length || 0} file${
              result?.data?.length === 1 ? "" : "s"
            } loaded.`
          );
        }
      });
    } catch (loadError) {
      if (loadRequestRef.current !== requestId) return;

      console.warn("Document refresh failed:", loadError);

      safeSet(() => {
        // Never wipe already-loaded parent/shared data just because a manual refresh
        // request was slow. Keep the workspace usable and make the failure recoverable.
        if (documents.length > 0 || Array.isArray(sharedDocuments)) {
          setError(
            "Live refresh delayed. Existing Student OS document data is still available; use Refresh again when the connection stabilizes."
          );
        } else {
          setError(
            loadError?.message ||
              "Could not reach the document service. Check Supabase connectivity and retry."
          );
        }
      });
    } finally {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const getFileName = (item) => {
    if (item?.original_file_name) return item.original_file_name;
    if (!item?.file_path) return item?.document_name || "Student document";
    return item.file_path.split("/").pop() || "Student document";
  };

  const buildStoragePath = (documentName, file) => {
    const safeDocumentName = safeFileName(documentName.toLowerCase());
    const finalFileName = safeFileName(file.name);

    return `${studentId}/${safeDocumentName}/${Date.now()}-${finalFileName}`;
  };

  const resolveBaseType = (document) => {
    const documentName = normalize(document?.document_name);
    const searchText = normalize(
      [
        document?.document_name,
        document?.notes,
        document?.file_path,
        getFileName(document),
      ]
        .filter(Boolean)
        .join(" ")
    );

    const allTypes = [...DEFAULT_DOCUMENT_TYPES, ...customTypes];

    const exact = allTypes.find(
      (type) => normalize(type.name) === documentName
    );
    if (exact) return exact.name;

    const prefixed = allTypes.find((type) =>
      documentName.startsWith(`${normalize(type.name)} •`)
    );
    if (prefixed) return prefixed.name;

    const aliasMatch = allTypes.find((type) =>
      (type.aliases || [type.name]).some((alias) =>
        searchText.includes(normalize(alias))
      )
    );

    return aliasMatch?.name || document?.document_name || "Other";
  };

  const documentTypes = useMemo(() => {
    const persistentTypes = requirements.map((item) => ({
      name: item.document_name,
      group: item.group_name || "Custom",
      aliases: [item.document_name],
      requirementId: item.id,
      required: item.required,
      verificationRequired: item.verification_required,
      expiryTracking: item.expiry_tracking,
    }));

    const known = [
      ...DEFAULT_DOCUMENT_TYPES,
      ...persistentTypes,
      ...customTypes,
    ];

    documents.forEach((document) => {
      const base = resolveBaseType(document);
      if (
        base &&
        !known.some((item) => normalize(item.name) === normalize(base))
      ) {
        known.push({
          name: base,
          group: "Custom",
          aliases: [base],
        });
      }
    });

    const seen = new Set();

    return known.filter((item) => {
      const key = normalize(item.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTypes, documents, requirements]);

  const groupedDocuments = useMemo(() => {
    const groups = new Map();

    documentTypes.forEach((type) => {
      groups.set(type.name, {
        ...type,
        files: [],
      });
    });

    documents.forEach((document) => {
      const base = resolveBaseType(document);

      if (!groups.has(base)) {
        groups.set(base, {
          name: base,
          group: "Custom",
          aliases: [base],
          files: [],
        });
      }

      groups.get(base).files.push(document);
    });

    return Array.from(groups.values()).map((block) => ({
      ...block,
      files: [...block.files].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, documentTypes]);

  const filteredBlocks = useMemo(() => {
    const query = normalize(search);

    return groupedDocuments
      .map((block) => ({
        ...block,
        files: block.files.filter((file) =>
          showDeleted ? Boolean(file.is_deleted) : !file.is_deleted
        ),
      }))
      .filter((block) => {
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "deleted"
          ? block.files.some((file) => Boolean(file.is_deleted))
          : block.files.some(
              (file) => normalize(file.status || "received") === statusFilter
            ));

      if (!statusMatch) return false;
      if (!query) return true;

      const blockText = normalize(
        [
          block.name,
          block.group,
          ...block.files.flatMap((file) => [
            file.document_name,
            file.notes,
            getFileName(file),
            file.status,
          ]),
        ].join(" ")
      );

      return blockText.includes(query);
    });
  }, [groupedDocuments, search, statusFilter, showDeleted]);

  const counts = useMemo(() => {
    const summary = {
      total: 0,
      received: 0,
      verified: 0,
      rejected: 0,
      archived: 0,
      deleted: 0,
      expiring: 0,
    };

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    documents.forEach((document) => {
      if (document.is_deleted) {
        summary.deleted += 1;
        return;
      }

      summary.total += 1;

      if (document.expiry_date) {
        const expiry = new Date(document.expiry_date).getTime();
        if (!Number.isNaN(expiry) && expiry - now <= thirtyDays) {
          summary.expiring += 1;
        }
      }

      const status = normalize(document.status || "received");

      if (status === "verified") summary.verified += 1;
      else if (status === "rejected") summary.rejected += 1;
      else if (status === "archived") summary.archived += 1;
      else summary.received += 1;
    });

    return summary;
  }, [documents]);

  const verifiedRate = counts.total
    ? Math.round((counts.verified / counts.total) * 100)
    : 0;

  const toggleBlock = (name) => {
    setExpandedBlocks((previous) => {
      const next = new Set(previous);

      if (next.has(name)) next.delete(name);
      else next.add(name);

      return next;
    });
  };

  const uniqueDocumentName = (baseType, file, index) => {
    const sameTypeCount = documents.filter(
      (item) => normalize(resolveBaseType(item)) === normalize(baseType)
    ).length;

    if (sameTypeCount === 0 && index === 0) {
      return baseType;
    }

    return `${baseType} • ${file.name}`;
  };

  const insertDocumentRecord = async ({
    documentName,
    filePath,
    fileUrl,
    notes,
    status = "received",
    category = null,
    originalFileName = null,
    mimeType = null,
    fileSizeBytes = null,
    version = 1,
    replacedDocumentId = null,
  }) => {
    const payload = {
      student_id: studentId,
      student_type: studentType,
      document_name: documentName,
      document_category: category,
      status,
      file_path: filePath,
      file_url: fileUrl,
      original_file_name: originalFileName,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
      version,
      replaced_document_id: replacedDocumentId,
      uploaded_by: actorId,
      notes,
      updated_at: new Date().toISOString(),
    };

    const result = await withTimeout(
      supabase
        .from("student_documents")
        .insert(payload)
        .select()
        .single(),
      "Document record creation timed out."
    );

    if (result.error) throw result.error;
    return result.data;
  };

  const updateDocumentRecord = async (id, patch) => {
    const payload = {
      ...patch,
      updated_at: new Date().toISOString(),
    };

    const current = documents.find(
      (item) => String(item.id) === String(id)
    );

    const optimisticRow = current
      ? { ...current, ...payload }
      : { id, ...payload };

    // Apply the next state immediately so a delayed network response never freezes
    // the Student Master File.
    safeSet(() => {
      setDocuments((previous) =>
        previous.map((item) =>
          String(item.id) === String(id) ? optimisticRow : item
        )
      );
    });

    const controller = new AbortController();
    let watchdog;

    try {
      const updatePromise = supabase
        .from("student_documents")
        .update(payload)
        .eq("id", id)
        .abortSignal(controller.signal);

      const result = await Promise.race([
        updatePromise,
        new Promise((resolve) => {
          watchdog = window.setTimeout(
            () => resolve({ __watchdog: true }),
            MUTATION_WATCHDOG_MS
          );
        }),
      ]);

      if (result?.__watchdog) {
        controller.abort();

        safeSet(() => {
          setSuccessMessage(
            "Document update submitted. Saved state is reconciling in the background."
          );
        });

        void notifyParent();
        return optimisticRow;
      }

      if (result?.error) throw result.error;
      return optimisticRow;
    } catch (updateError) {
      if (updateError?.name === "AbortError") {
        safeSet(() => {
          setSuccessMessage(
            "Document update submitted. Saved state is reconciling in the background."
          );
        });

        void notifyParent();
        return optimisticRow;
      }

      if (current) {
        safeSet(() => {
          setDocuments((previous) =>
            previous.map((item) =>
              String(item.id) === String(id) ? current : item
            )
          );
        });
      }

      throw updateError;
    } finally {
      if (watchdog) window.clearTimeout(watchdog);
    }
  };

  const uploadFiles = async (documentType, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !studentId || isSaving(`upload-${documentType}`)) return;

    const operationKey = `upload-${documentType}`;

    safeSet(() => {
      startSaving(operationKey);
      setError("");
      setSuccessMessage("");
    });

    const createdRecords = [];
    const uploadedPaths = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const filePath = buildStoragePath(documentType, file);

        const uploadResult = await withTimeout(
          supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          }),
          `Upload timed out for ${file.name}.`
        );

        if (uploadResult.error) throw uploadResult.error;
        uploadedPaths.push(filePath);

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        let recordName = uniqueDocumentName(documentType, file, index);

        try {
          const typeConfig = documentTypes.find(
            (item) => normalize(item.name) === normalize(documentType)
          );

          const record = await insertDocumentRecord({
            documentName: recordName,
            filePath,
            fileUrl: publicUrlData?.publicUrl || "",
            notes: `Uploaded file: ${file.name}`,
            category: typeConfig?.group || "Other",
            originalFileName: file.name,
            mimeType: file.type || null,
            fileSizeBytes: file.size || null,
            version: 1,
          });

          createdRecords.push(record);
        } catch (insertError) {
          const message = String(insertError?.message || "").toLowerCase();

          if (
            message.includes("duplicate") ||
            message.includes("unique") ||
            message.includes("already exists")
          ) {
            recordName = `${documentType} • ${Date.now()} • ${file.name}`;

            const typeConfig = documentTypes.find(
              (item) => normalize(item.name) === normalize(documentType)
            );

            const retryRecord = await insertDocumentRecord({
              documentName: recordName,
              filePath,
              fileUrl: publicUrlData?.publicUrl || "",
              notes: `Uploaded file: ${file.name}`,
              category: typeConfig?.group || "Other",
              originalFileName: file.name,
              mimeType: file.type || null,
              fileSizeBytes: file.size || null,
              version: 1,
            });

            createdRecords.push(retryRecord);
          } else {
            throw insertError;
          }
        }
      }

      safeSet(() => {
        setDocuments((previous) => [...createdRecords, ...previous]);
        setExpandedBlocks((previous) => new Set(previous).add(documentType));
        setSuccessMessage(
          `${createdRecords.length} file${
            createdRecords.length === 1 ? "" : "s"
          } uploaded to ${documentType}.`
        );
      });

      void createTimelineEvent({
        eventType: "documents_uploaded",
        title: "Documents Uploaded",
        description: `${createdRecords.length} file(s) uploaded to ${documentType}.`,
        newValue: documentType,
      });

      createdRecords.forEach((record) => {
        void createDocumentEvent({
          documentId: record.id,
          eventType: "uploaded",
          eventLabel: "Document uploaded",
          newStatus: record.status || "received",
          newNotes: record.notes || null,
          metadata: {
            document_type: documentType,
            file_name: record.original_file_name || getFileName(record),
            version: record.version || 1,
            category: record.document_category || null,
          },
        });
      });

      void notifyParent();
    } catch (uploadError) {
      // Remove orphaned storage objects that did not get a DB record.
      const recordedPaths = new Set(createdRecords.map((item) => item.file_path));
      const orphanedPaths = uploadedPaths.filter(
        (path) => !recordedPaths.has(path)
      );

      if (orphanedPaths.length) {
        supabase.storage.from(STORAGE_BUCKET).remove(orphanedPaths);
      }

      safeSet(() => {
        setError(uploadError.message || "Document upload failed.");
      });

      await loadDocuments();
    } finally {
      safeSet(() => {
        stopSaving(operationKey);
      });
    }
  };

  const replaceFile = async (document, file) => {
    if (!document?.id || !file || !studentId || isSaving(`replace-${document.id}`)) return;

    const operationKey = `replace-${document.id}`;

    safeSet(() => {
      startSaving(operationKey);
      setError("");
      setSuccessMessage("");
    });

    try {
      const baseType = resolveBaseType(document);

      // Preserve history: archive the old DB row instead of overwriting it.
      const archivedAt = new Date().toISOString();

      const archived = await updateDocumentRecord(document.id, {
        status: "archived",
        archived_at: archivedAt,
        notes: `${document.notes || ""}${
          document.notes ? " " : ""
        }Archived during replacement on ${new Date().toLocaleDateString("en-GB")}.`,
      });

      const filePath = buildStoragePath(baseType, file);

      const uploadResult = await withTimeout(
        supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        }),
        "Replacement upload timed out."
      );

      if (uploadResult.error) throw uploadResult.error;

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const nextVersion = Number(document.version || 1) + 1;

      const replacementRecord = await insertDocumentRecord({
        documentName: `${baseType} • ${file.name}`,
        filePath,
        fileUrl: publicUrlData?.publicUrl || "",
        notes: `Replacement for ${getFileName(document)}.`,
        category: document.document_category || resolveBaseType(document),
        originalFileName: file.name,
        mimeType: file.type || null,
        fileSizeBytes: file.size || null,
        version: nextVersion,
        replacedDocumentId: document.id,
      });

      safeSet(() => {
        setDocuments((previous) => [
          replacementRecord,
          ...previous.map((item) =>
            String(item.id) === String(document.id) ? archived : item
          ),
        ]);

        setSuccessMessage(
          `${getFileName(document)} archived and replacement uploaded.`
        );
      });

      void createTimelineEvent({
        eventType: "document_replaced",
        title: "Document Replaced",
        description: `${baseType} was replaced. Previous file retained as archived history.`,
        newValue: baseType,
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: "replaced",
        eventLabel: "Document replaced",
        previousStatus: document.status || "received",
        newStatus: "archived",
        previousNotes: document.notes || null,
        newNotes: archived.notes || null,
        metadata: {
          replacement_document_id: replacementRecord.id,
          old_version: document.version || 1,
          new_version: replacementRecord.version || nextVersion,
        },
      });

      void createDocumentEvent({
        documentId: replacementRecord.id,
        eventType: "replacement_uploaded",
        eventLabel: "Replacement uploaded",
        newStatus: replacementRecord.status || "received",
        newNotes: replacementRecord.notes || null,
        metadata: {
          replaces_document_id: document.id,
          version: replacementRecord.version || nextVersion,
        },
      });

      void notifyParent();
    } catch (replaceError) {
      safeSet(() => {
        setError(replaceError.message || "Replacement failed.");
      });

      await loadDocuments();
    } finally {
      safeSet(() => {
        stopSaving(operationKey);
      });
    }
  };

  const registerUndo = ({
    document,
    previousStatus,
    previousNotes,
    previousIsDeleted = document?.is_deleted || false,
    previousDeletedAt = document?.deleted_at || null,
    actionLabel,
  }) => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }

    setUndoAction({
      documentId: document.id,
      documentName: getFileName(document),
      previousStatus,
      previousNotes,
      previousIsDeleted,
      previousDeletedAt,
      actionLabel,
    });

    undoTimerRef.current = window.setTimeout(() => {
      setUndoAction(null);
      undoTimerRef.current = null;
    }, 12000);
  };

  const undoLastAction = async () => {
    if (!undoAction?.documentId) return;

    const currentDocument = documents.find(
      (item) => String(item.id) === String(undoAction.documentId)
    );

    if (!currentDocument) {
      setUndoAction(null);
      return;
    }

    const operationKey = `status-${currentDocument.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const restored = await updateDocumentRecord(currentDocument.id, {
        status: undoAction.previousStatus || "received",
        notes: undoAction.previousNotes || "",
        is_deleted: Boolean(undoAction.previousIsDeleted),
        deleted_at: undoAction.previousDeletedAt || null,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(currentDocument.id) ? restored : item
          )
        );

        setSuccessMessage(
          `${undoAction.documentName} restored to ${undoAction.previousStatus || "received"}.`
        );
        setUndoAction(null);
      });

      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }

      void createTimelineEvent({
        eventType: "document_action_undone",
        title: "Document Action Undone",
        description: `${undoAction.actionLabel || "Document status change"} was undone for ${currentDocument.document_name}.`,
        newValue: undoAction.previousStatus || "received",
      });

      void createDocumentEvent({
        documentId: currentDocument.id,
        eventType: "action_undone",
        eventLabel: `${undoAction.actionLabel || "Status change"} undone`,
        previousStatus: currentDocument.status || null,
        newStatus: undoAction.previousStatus || "received",
        previousNotes: currentDocument.notes || null,
        newNotes: undoAction.previousNotes || null,
      });

      void notifyParent();
    } catch (undoError) {
      safeSet(() => {
        setError(undoError.message || "Undo failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const changeStatus = async (document, status, reason = "") => {
    if (!document?.id || isSaving(`status-${document.id}`)) return;

    const operationKey = `status-${document.id}`;

    safeSet(() => {
      startSaving(operationKey);
      setError("");
      setSuccessMessage("");
    });

    try {
      const notes =
        status === "rejected" && reason
          ? `Rejected: ${reason}`
          : document.notes || `${document.document_name} marked ${status}.`;

      const nowIso = new Date().toISOString();

      const statusPatch = {
        status,
        notes,
      };

      if (status === "verified") {
        statusPatch.verified_by = actorId;
        statusPatch.verified_at = nowIso;
        statusPatch.rejected_by = null;
        statusPatch.rejected_at = null;
        statusPatch.rejection_reason = null;
      } else if (status === "rejected") {
        statusPatch.rejected_by = actorId;
        statusPatch.rejected_at = nowIso;
        statusPatch.rejection_reason = reason || null;
        statusPatch.verified_by = null;
        statusPatch.verified_at = null;
      } else if (status === "archived") {
        statusPatch.archived_at = nowIso;
      } else if (status === "received") {
        statusPatch.archived_at = null;

        if (normalize(document.status) === "verified") {
          statusPatch.verified_by = null;
          statusPatch.verified_at = null;
        }

        if (normalize(document.status) === "rejected") {
          statusPatch.rejected_by = null;
          statusPatch.rejected_at = null;
          statusPatch.rejection_reason = null;
        }
      }

      const saved = await updateDocumentRecord(document.id, statusPatch);

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(document.id) ? saved : item
          )
        );

        setSuccessMessage(
          `${getFileName(document)} marked ${status}.`
        );
      });

      registerUndo({
        document,
        previousStatus: document.status || "received",
        previousNotes: document.notes || "",
        actionLabel:
          status === "verified"
            ? "Verify"
            : status === "rejected"
            ? "Reject"
            : status === "archived"
            ? "Archive"
            : status === "received" && normalize(document.status) === "verified"
            ? "Unverify"
            : "Status change",
      });

      void createTimelineEvent({
        eventType: `document_${status}`,
        title: `Document ${status}`,
        description:
          status === "rejected" && reason
            ? `${document.document_name} rejected: ${reason}`
            : `${document.document_name} marked as ${status}.`,
        newValue: document.document_name,
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: `status_${status}`,
        eventLabel:
          status === "verified"
            ? "Document verified"
            : status === "rejected"
            ? "Document rejected"
            : status === "archived"
            ? "Document archived"
            : status === "received" && normalize(document.status) === "verified"
            ? "Document unverified"
            : status === "received" && normalize(document.status) === "rejected"
            ? "Returned to review"
            : "Document status changed",
        previousStatus: document.status || "received",
        newStatus: status,
        previousNotes: document.notes || null,
        newNotes: notes || null,
        reason: reason || null,
      });

      void notifyParent();
    } catch (statusError) {
      safeSet(() => {
        setError(statusError.message || "Document status update failed.");
      });
    } finally {
      safeSet(() => {
        stopSaving(operationKey);
      });
    }
  };

  const deleteDocument = async (document) => {
    if (!document?.id || isSaving(`delete-${document.id}`)) return;

    const confirmed = window.confirm(
      `Move ${getFileName(document)} to recovery?\n\nThis is reversible. The physical file will not be removed yet.`
    );

    if (!confirmed) return;

    const operationKey = `delete-${document.id}`;
    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    try {
      const deletedAt = new Date().toISOString();

      const saved = await updateDocumentRecord(document.id, {
        is_deleted: true,
        deleted_at: deletedAt,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(document.id) ? saved : item
          )
        );
        setSuccessMessage(
          `${getFileName(document)} moved to recovery.`
        );
      });

      registerUndo({
        document,
        previousStatus: document.status || "received",
        previousNotes: document.notes || "",
        previousIsDeleted: Boolean(document.is_deleted),
        previousDeletedAt: document.deleted_at || null,
        actionLabel: "Move to recovery",
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: "soft_deleted",
        eventLabel: "Moved to recovery",
        previousStatus: document.status || null,
        newStatus: document.status || null,
        metadata: { deleted_at: deletedAt },
      });

      void notifyParent();
    } catch (deleteError) {
      safeSet(() => {
        setError(deleteError.message || "Could not move document to recovery.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const restoreDeletedDocument = async (document) => {
    if (!document?.id || isSaving(`delete-${document.id}`)) return;

    const operationKey = `delete-${document.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const restored = await updateDocumentRecord(document.id, {
        is_deleted: false,
        deleted_at: null,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(document.id) ? restored : item
          )
        );
        setSuccessMessage(`${getFileName(document)} restored from recovery.`);
      });

      void createDocumentEvent({
        documentId: document.id,
        eventType: "restored_from_recovery",
        eventLabel: "Restored from recovery",
        newStatus: document.status || "received",
      });

      void notifyParent();
    } catch (restoreError) {
      safeSet(() => setError(restoreError.message || "Restore failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const permanentlyDeleteDocument = async (document) => {
    if (!document?.id || isSaving(`delete-${document.id}`)) return;

    const confirmed = window.confirm(
      `PERMANENTLY delete ${getFileName(document)}?\n\nThis removes the database record and attempts to remove the Storage object. This cannot be undone.`
    );

    if (!confirmed) return;

    const operationKey = `delete-${document.id}`;
    startSaving(operationKey);
    setError("");

    try {
      if (document.file_path) {
        const removeResult = await withTimeout(
          supabase.storage.from(STORAGE_BUCKET).remove([document.file_path]),
          "Storage deletion timed out."
        );

        if (removeResult.error) {
          throw new Error(
            `Storage deletion blocked: ${removeResult.error.message}. Keep this file in Recovery until the Storage DELETE policy is configured.`
          );
        }
      }

      const result = await withTimeout(
        supabase.from("student_documents").delete().eq("id", document.id),
        "Permanent document deletion timed out."
      );

      if (result.error) throw result.error;

      safeSet(() => {
        setDocuments((previous) =>
          previous.filter(
            (item) => String(item.id) !== String(document.id)
          )
        );
        setSelectedIds((previous) => {
          const next = new Set(previous);
          next.delete(document.id);
          return next;
        });
        setSuccessMessage(`${getFileName(document)} permanently deleted.`);
      });

      void createDocumentEvent({
        documentId: null,
        eventType: "permanently_deleted",
        eventLabel: "Document permanently deleted",
        metadata: {
          deleted_document_id: document.id,
          document_name: document.document_name,
          file_path: document.file_path || null,
        },
      });

      void notifyParent();
    } catch (deleteError) {
      safeSet(() => {
        setError(deleteError.message || "Permanent deletion failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };


  const addCustomType = async () => {
    const name = customTypeName.trim();
    if (!name || !studentId) return;

    const alreadyExists = documentTypes.some(
      (type) => normalize(type.name) === normalize(name)
    );

    if (alreadyExists) {
      setError("That document type already exists.");
      return;
    }

    const operationKey = "add-document-type";
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_document_requirements")
          .insert({
            student_id: Number(studentId),
            student_type: studentType,
            document_name: name,
            group_name: customTypeGroup.trim() || "Custom",
            required: true,
            verification_required: true,
            expiry_tracking: false,
            student_can_upload: true,
            counselor_can_upload: true,
            admin_only: false,
            status: "active",
            created_by: actorId,
          })
          .select()
          .single(),
        "Document type creation timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) => [...previous, data]);
        setExpandedBlocks((previous) => new Set(previous).add(name));
        setCustomTypeName("");
        setCustomTypeGroup("Custom");
        setShowAddType(false);
        setSuccessMessage(`${name} document block permanently added.`);
      });

      void createDocumentEvent({
        eventType: "requirement_created",
        eventLabel: "Document requirement created",
        metadata: {
          requirement_id: data.id,
          document_name: name,
          group_name: data.group_name,
        },
      });
    } catch (requirementError) {
      safeSet(() => {
        setError(
          requirementError.message ||
            "Could not permanently create this document type."
        );
      });
    } finally {
      stopSaving(operationKey);
    }
  };


  const openMetadataEditor = (document) => {
    setMetadataTarget(document);
    setMetadataForm({
      document_category:
        document.document_category || resolveBaseType(document) || "",
      issue_date: document.issue_date || "",
      expiry_date: document.expiry_date || "",
      notes: document.notes || "",
    });
  };

  const saveMetadata = async () => {
    if (!metadataTarget?.id) return;

    const operationKey = `metadata-${metadataTarget.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const saved = await updateDocumentRecord(metadataTarget.id, {
        document_category: metadataForm.document_category.trim() || null,
        issue_date: metadataForm.issue_date || null,
        expiry_date: metadataForm.expiry_date || null,
        notes: metadataForm.notes.trim() || null,
      });

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            String(item.id) === String(metadataTarget.id) ? saved : item
          )
        );

        // Keep the inspector open and refresh it with the saved row.
        // This prevents the confusing "save -> modal closes -> old-looking state" flow.
        setMetadataTarget(saved);
        setMetadataForm({
          document_category: saved.document_category || "",
          issue_date: saved.issue_date || "",
          expiry_date: saved.expiry_date || "",
          notes: saved.notes || "",
        });

        setSuccessMessage(`${getFileName(saved)} details saved.`);
      });

      void createDocumentEvent({
        documentId: metadataTarget.id,
        eventType: "metadata_updated",
        eventLabel: "Document metadata updated",
        previousNotes: metadataTarget.notes || null,
        newNotes: saved.notes || null,
        metadata: {
          document_category: saved.document_category || null,
          issue_date: saved.issue_date || null,
          expiry_date: saved.expiry_date || null,
        },
      });

      void notifyParent();
    } catch (metadataError) {
      safeSet(() => {
        setError(metadataError.message || "Document details update failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const toggleSelected = (documentId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(documentId)) next.delete(documentId);
      else next.add(documentId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const bulkChangeStatus = async (status) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    const selectedDocuments = documents.filter(
      (item) => ids.includes(item.id) && !item.is_deleted
    );

    if (!selectedDocuments.length) return;

    const operationKey = `bulk-${status}`;
    startSaving(operationKey);
    setError("");

    const nowIso = new Date().toISOString();
    const patch = { status };

    if (status === "verified") {
      patch.verified_by = actorId;
      patch.verified_at = nowIso;
      patch.rejected_by = null;
      patch.rejected_at = null;
      patch.rejection_reason = null;
    }

    if (status === "archived") {
      patch.archived_at = nowIso;
    }

    if (status === "received") {
      patch.archived_at = null;
      patch.verified_by = null;
      patch.verified_at = null;
      patch.rejected_by = null;
      patch.rejected_at = null;
      patch.rejection_reason = null;
    }

    try {
      const { error: bulkError } = await withTimeout(
        supabase
          .from("student_documents")
          .update({
            ...patch,
            updated_at: nowIso,
          })
          .in("id", ids),
        "Bulk document update timed out."
      );

      if (bulkError) throw bulkError;

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            ids.includes(item.id)
              ? { ...item, ...patch, updated_at: nowIso }
              : item
          )
        );
        setSuccessMessage(
          `${selectedDocuments.length} document${
            selectedDocuments.length === 1 ? "" : "s"
          } moved to ${status}.`
        );
        clearSelection();
      });

      selectedDocuments.forEach((document) => {
        void createDocumentEvent({
          documentId: document.id,
          eventType: `bulk_status_${status}`,
          eventLabel: `Bulk status changed to ${status}`,
          previousStatus: document.status || null,
          newStatus: status,
        });
      });

      void notifyParent();
    } catch (bulkError) {
      safeSet(() => {
        setError(bulkError.message || "Bulk update failed.");
      });
    } finally {
      stopSaving(operationKey);
    }
  };

  const bulkSoftDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    const confirmed = window.confirm(
      `Move ${ids.length} selected document${ids.length === 1 ? "" : "s"} to recovery?`
    );
    if (!confirmed) return;

    const operationKey = "bulk-delete";
    startSaving(operationKey);
    setError("");

    const deletedAt = new Date().toISOString();

    try {
      const { error: bulkError } = await withTimeout(
        supabase
          .from("student_documents")
          .update({
            is_deleted: true,
            deleted_at: deletedAt,
            updated_at: deletedAt,
          })
          .in("id", ids),
        "Bulk recovery action timed out."
      );

      if (bulkError) throw bulkError;

      const affectedDocuments = documents.filter((item) =>
        ids.includes(item.id)
      );

      safeSet(() => {
        setDocuments((previous) =>
          previous.map((item) =>
            ids.includes(item.id)
              ? { ...item, is_deleted: true, deleted_at: deletedAt }
              : item
          )
        );
        setSuccessMessage(`${ids.length} document(s) moved to recovery.`);
        clearSelection();
      });

      affectedDocuments.forEach((document) => {
        void createDocumentEvent({
          documentId: document.id,
          eventType: "bulk_soft_deleted",
          eventLabel: "Moved to recovery in bulk",
          previousStatus: document.status || null,
          newStatus: document.status || null,
          metadata: { deleted_at: deletedAt },
        });
      });

      void notifyParent();
    } catch (bulkError) {
      safeSet(() => setError(bulkError.message || "Bulk recovery action failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const bulkDownload = () => {
    const selectedDocuments = documents.filter(
      (item) =>
        selectedIds.has(item.id) &&
        !item.is_deleted &&
        Boolean(item.file_url)
    );

    if (!selectedDocuments.length) {
      setError("No downloadable files are selected.");
      return;
    }

    selectedDocuments.forEach((item, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = item.file_url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.download = getFileName(item);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 150);
    });

    setSuccessMessage(
      `${selectedDocuments.length} download${
        selectedDocuments.length === 1 ? "" : "s"
      } started.`
    );
  };

  const openDocument = (item) => {
    if (!item?.file_url) return;
    window.open(item.file_url, "_blank", "noopener,noreferrer");
  };

  const downloadDocument = (item) => {
    if (!item?.file_url) return;

    const link = document.createElement("a");
    link.href = item.file_url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = getFileName(item);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusClass = (status, isDeleted = false) => {
    if (isDeleted) {
      return "border-slate-500 bg-slate-100 text-slate-800";
    }

    switch (normalize(status)) {
      case "verified":
        return "border-emerald-400 bg-emerald-50 text-emerald-800";
      case "rejected":
        return "border-red-400 bg-red-50 text-red-800";
      case "archived":
        return "border-slate-400 bg-slate-100 text-slate-700";
      default:
        return "border-blue-400 bg-blue-50 text-blue-800";
    }
  };

  return (
    <div className="space-y-4 bg-[#fffaf4] p-3 text-[#10233f] sm:p-4 lg:p-5">
      {/* COMMAND BAR */}
      <section className="rounded-[1.5rem] border-[3px] border-orange-500 bg-white p-4 shadow-[0_12px_32px_rgba(121,72,40,0.08)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                <FolderOpen size={12} />
                Student Master File
              </span>

              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                Student #{studentId || "—"}
              </span>
            </div>

            <h2 className="mt-2 text-xl font-black tracking-tight text-[#10233f] sm:text-2xl">
              Document Operations
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-600">
              Real files, real statuses and direct actions. Add as many files
              and document blocks as the case needs.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowHistory(true);
                void reloadHistory();
              }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0b2a57] bg-[#0b2a57] px-3.5 py-2.5 text-xs font-black transition hover:bg-[#123d75]"
              style={{ color: "#ffffff" }}
            >
              <History size={15} style={{ color: "#ffffff" }} />
              <span style={{ color: "#ffffff" }}>History</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowDeleted((current) => !current);
                clearSelection();
              }}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-xs font-black transition ${
                showDeleted
                  ? "border-[#0b2a57] bg-[#0b2a57]"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Undo2
                size={15}
                style={{ color: showDeleted ? "#ffffff" : undefined }}
              />
              <span style={{ color: showDeleted ? "#ffffff" : undefined }}>
                Recovery {counts.deleted ? `(${counts.deleted})` : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-400 bg-orange-50 px-3.5 py-2.5 text-xs font-black text-orange-700 transition hover:bg-orange-100"
            >
              <Plus size={15} />
              Add Document Type
            </button>

            <button
              type="button"
              onClick={loadDocuments}
              disabled={loading || savingKeys.size > 0}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-400 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Files" value={counts.total} icon={Files} />
          <Metric label="Verified" value={counts.verified} icon={BadgeCheck} tone="green" />
          <Metric label="Review" value={counts.received} icon={CircleAlert} tone="blue" />
          <Metric label="Rejected" value={counts.rejected} icon={XCircle} tone="red" />
          <Metric label="Expiring" value={counts.expiring} icon={CalendarClock} tone="orange" />
          <Metric label="Verified rate" value={`${verifiedRate}%`} icon={ShieldCheck} tone="orange" />
        </div>
      </section>

      {savingKeys.size > 0 ? (
        <div
          className="flex items-center gap-3 rounded-2xl border-[3px] border-[#071f50] bg-[#0b2a57] px-4 py-3 shadow-[0_10px_28px_rgba(7,31,80,0.18)]"
          style={{ color: "#ffffff" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-orange-400 bg-[#173b70]">
            <LoaderCircle
              size={17}
              className="animate-spin"
              style={{ color: "#ff9b45" }}
            />
          </span>

          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-black leading-tight"
              style={{ color: "#ffffff" }}
            >
              {savingKeys.size} document operation{savingKeys.size === 1 ? "" : "s"} running
            </p>
            <p
              className="mt-1 text-xs font-bold leading-relaxed"
              style={{ color: "#ffffff" }}
            >
              Other files remain usable while Zaifan OS finishes this action.
            </p>
          </div>
        </div>
      ) : null}

      {/* FEEDBACK */}
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-red-400 bg-red-50 p-4 text-sm font-bold text-red-800">
          <CircleAlert className="mt-0.5 shrink-0" size={17} />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
            <span className="min-w-0 flex-1">{successMessage}</span>
          </div>

          <div className="flex items-center gap-2">
            {undoAction ? (
              <button
                type="button"
                onClick={undoLastAction}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#0b2a57] bg-[#0b2a57] px-3 py-2 text-xs font-black transition hover:bg-[#123d75]"
                style={{ color: "#ffffff" }}
              >
                <RotateCcw size={14} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Undo</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-white/70"
              aria-label="Dismiss success"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : null}

      {selectedIds.size > 0 ? (
        <section className="rounded-[1.35rem] border-[3px] border-[#0b2a57] bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <ListChecks size={17} className="text-[#0b2a57]" />
              <span className="text-sm font-black text-[#0b2a57]">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={bulkDownload}
                className="rounded-xl border-2 border-orange-400 bg-orange-50 px-3 py-2 text-xs font-black text-orange-800"
              >
                Download selected
              </button>

              <button
                type="button"
                onClick={() => bulkChangeStatus("verified")}
                className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
              >
                Verify selected
              </button>

              <button
                type="button"
                onClick={() => bulkChangeStatus("archived")}
                className="rounded-xl border-2 border-slate-400 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
              >
                Archive selected
              </button>

              <button
                type="button"
                onClick={() => bulkChangeStatus("received")}
                className="rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
              >
                Return to review
              </button>

              <button
                type="button"
                onClick={bulkSoftDelete}
                className="rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-xs font-black text-red-800"
              >
                Move to recovery
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* SEARCH / FILTER */}
      <section className="rounded-[1.35rem] border-[3px] border-orange-300 bg-white p-3 shadow-sm">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search document types, files, notes..."
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-black text-[#10233f] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All statuses</option>
            <option value="received">Received</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
            <option value="deleted">Recovery</option>
          </select>
        </div>
      </section>

      {/* DOCUMENT BLOCKS */}
      <section className="space-y-3">
        {loading && documents.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border-2 border-orange-300 bg-white">
            <div className="text-center">
              <LoaderCircle
                size={28}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-3 text-sm font-black text-[#10233f]">
                Loading student files
              </p>
            </div>
          </div>
        ) : null}

        {!loading && filteredBlocks.length === 0 ? (
          <div className="rounded-[1.5rem] border-2 border-dashed border-orange-300 bg-white p-8 text-center">
            <File size={32} className="mx-auto text-orange-400" />
            <h3 className="mt-3 text-lg font-black text-[#10233f]">
              No matching document blocks
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Clear the filters or add a custom document type.
            </p>
          </div>
        ) : null}

        {filteredBlocks.map((block) => {
          const isExpanded = expandedBlocks.has(block.name);
          const verified = block.files.filter(
            (file) => normalize(file.status) === "verified"
          ).length;
          const rejected = block.files.filter(
            (file) => normalize(file.status) === "rejected"
          ).length;
          const archived = block.files.filter(
            (file) => normalize(file.status) === "archived"
          ).length;
          const isUploading = isSaving(`upload-${block.name}`);

          return (
            <article
              key={block.name}
              className="overflow-hidden rounded-[1.5rem] border-[3px] border-orange-300 bg-white shadow-[0_8px_24px_rgba(15,35,63,0.05)]"
            >
              <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                <button
                  type="button"
                  onClick={() => toggleBlock(block.name)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-600">
                    <FolderOpen size={19} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-black text-[#10233f]">
                        {block.name}
                      </span>

                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                        {block.group}
                      </span>
                    </span>

                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {block.files.length} file{block.files.length === 1 ? "" : "s"}
                      {" · "}
                      {verified} verified
                      {rejected ? ` · ${rejected} rejected` : ""}
                      {archived ? ` · ${archived} archived` : ""}
                    </span>
                  </span>

                  {isExpanded ? (
                    <ChevronDown size={18} className="shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight size={18} className="shrink-0 text-slate-400" />
                  )}
                </button>

                <label
                  className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-orange-400 bg-orange-500 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 ${
                    isUploading ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  {isUploading ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Upload size={15} />
                  )}

                  {isUploading ? "Uploading..." : "Upload Files"}

                  <input
                    type="file"
                    multiple
                    disabled={isUploading}
                    className="hidden"
                    onChange={(event) => {
                      uploadFiles(block.name, event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>

              {isExpanded ? (
                <div className="border-t-2 border-orange-200 bg-[#fffaf4] p-3 sm:p-4">
                  {block.files.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-white p-6 text-center">
                      <FilePlus2 size={26} className="mx-auto text-orange-400" />
                      <p className="mt-2 text-sm font-black text-[#10233f]">
                        No files in this block yet
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-600">
                        Upload one file or many files together.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {block.files.map((document) => (
                        <DocumentRow
                          key={document.id}
                          document={document}
                          getFileName={getFileName}
                          statusClass={statusClass}
                          busy={
                            isSaving(`status-${document.id}`) ||
                            isSaving(`replace-${document.id}`) ||
                            isSaving(`delete-${document.id}`)
                          }
                          saving={
                            isSaving(`status-${document.id}`) ||
                            isSaving(`replace-${document.id}`) ||
                            isSaving(`delete-${document.id}`)
                          }
                          onOpen={() => openDocument(document)}
                          onDownload={() => downloadDocument(document)}
                          onVerify={() => changeStatus(document, "verified")}
                          onUnverify={() => changeStatus(document, "received")}
                          onReject={() => {
                            setRejectionTarget(document);
                            setRejectionReason("");
                          }}
                          onArchive={() =>
                            changeStatus(document, "archived")
                          }
                          onRestore={() =>
                            changeStatus(document, "received")
                          }
                          selected={selectedIds.has(document.id)}
                          onToggleSelected={() => toggleSelected(document.id)}
                          onEditDetails={() => openMetadataEditor(document)}
                          onDelete={() => deleteDocument(document)}
                          onRestoreDeleted={() => restoreDeletedDocument(document)}
                          onPermanentDelete={() => permanentlyDeleteDocument(document)}
                          onReplace={(file) => replaceFile(document, file)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      {/* ADD CUSTOM TYPE */}
      {showAddType ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.6rem] border-2 border-orange-400 bg-[#fffaf4] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Student Master File
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  Add Document Type
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAddType(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-slate-500 transition hover:text-orange-600"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                  Document type
                </span>
                <input
                  value={customTypeName}
                  onChange={(event) => setCustomTypeName(event.target.value)}
                  placeholder="e.g. CIMEA Verification"
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                  Group
                </span>
                <input
                  value={customTypeGroup}
                  onChange={(event) => setCustomTypeGroup(event.target.value)}
                  placeholder="e.g. Italy Admission"
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddType(false)}
                className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addCustomType}
                className="rounded-xl border-2 border-orange-600 bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600"
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* DOCUMENT INSPECTOR */}
      {metadataTarget ? (
        <div className="fixed inset-3 z-[1210] flex justify-end pointer-events-none sm:bottom-4 sm:left-auto sm:right-4 sm:top-28 sm:w-[min(94vw,38rem)]">
          <aside className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-[1.6rem] border-[4px] border-[#0b2a57] bg-[#fffaf4] shadow-[-24px_18px_70px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-3 border-b-2 border-orange-300 bg-white p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Document Inspector
                </p>
                <h3 className="mt-1 truncate text-xl font-black text-[#10233f]">
                  {getFileName(metadataTarget)}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  View and edit the permanent metadata for this exact file without leaving the document workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMetadataTarget(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-slate-500"
                title="Close inspector"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2">
                <span className="text-xs font-black text-emerald-800">
                  Changes stay visible here after saving.
                </span>
                <span className="rounded-full border border-emerald-300 bg-white px-2 py-1 text-[9px] font-black uppercase text-emerald-700">
                  Persistent
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InspectorStat
                  label="Status"
                  value={metadataTarget.is_deleted ? "Recovery" : metadataTarget.status || "received"}
                />
                <InspectorStat
                  label="Version"
                  value={`v${metadataTarget.version || 1}`}
                />
                <InspectorStat
                  label="Original file"
                  value={metadataTarget.original_file_name || getFileName(metadataTarget)}
                />
                <InspectorStat
                  label="File type"
                  value={metadataTarget.mime_type || "Unknown"}
                />
                <InspectorStat
                  label="File size"
                  value={
                    metadataTarget.file_size_bytes
                      ? `${(Number(metadataTarget.file_size_bytes) / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown"
                  }
                />
                <InspectorStat
                  label="Uploaded"
                  value={formatDate(metadataTarget.created_at)}
                />
                <InspectorStat
                  label="Verified"
                  value={metadataTarget.verified_at ? formatDate(metadataTarget.verified_at) : "Not verified"}
                />
                <InspectorStat
                  label="Rejected"
                  value={metadataTarget.rejected_at ? formatDate(metadataTarget.rejected_at) : "No"}
                />
              </div>

              {metadataTarget.rejection_reason ? (
                <div className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                    Rejection reason
                  </p>
                  <p className="mt-2 text-sm font-semibold text-red-900">
                    {metadataTarget.rejection_reason}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 rounded-[1.35rem] border-2 border-orange-300 bg-white p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock size={17} className="text-orange-600" />
                  <h4 className="text-sm font-black text-[#10233f]">
                    Editable document details
                  </h4>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                      Category
                    </span>
                    <input
                      value={metadataForm.document_category}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          document_category: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                      Issue date
                    </span>
                    <input
                      type="date"
                      value={metadataForm.issue_date}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          issue_date: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                      Expiry date
                    </span>
                    <input
                      type="date"
                      value={metadataForm.expiry_date}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          expiry_date: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                      Internal notes
                    </span>
                    <textarea
                      rows={5}
                      value={metadataForm.notes}
                      onChange={(event) =>
                        setMetadataForm((previous) => ({
                          ...previous,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full resize-none rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400"
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMetadataTarget(null)}
                    className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={saveMetadata}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-700 bg-orange-500 px-4 py-2.5 text-xs font-black text-white"
                  >
                    <Save size={14} />
                    Save details
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-[1.35rem] border-2 border-slate-300 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Storage reference
                </p>
                <p className="mt-2 break-all text-xs font-semibold text-slate-700">
                  {metadataTarget.file_path || "No Storage path"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* DOCUMENT HISTORY */}
      {showHistory ? (
        <div className="fixed inset-0 z-[1210] flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-2xl flex-col border-l-[4px] border-[#0b2a57] bg-[#fffaf4] shadow-[-30px_0_100px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b-2 border-orange-300 bg-white p-4 sm:p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                  Permanent Audit Trail
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  Document History
                </h3>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reloadHistory}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-white"
                  title="Refresh history"
                >
                  <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-white"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {historyEvents.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-white p-8 text-center">
                  <Database size={28} className="mx-auto text-orange-500" />
                  <p className="mt-3 text-sm font-black text-[#10233f]">
                    No document history recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border-2 border-slate-300 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#10233f]">
                            {event.event_label || event.event_type}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(event.created_at)}
                          </p>
                        </div>

                        {event.new_status ? (
                          <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-800">
                            {event.new_status}
                          </span>
                        ) : null}
                      </div>

                      {event.reason ? (
                        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                          {event.reason}
                        </p>
                      ) : null}

                      {(event.previous_status || event.new_status) ? (
                        <p className="mt-3 text-xs font-semibold text-slate-600">
                          {event.previous_status || "—"} → {event.new_status || "—"}
                        </p>
                      ) : null}

                      {event.metadata &&
                      Object.keys(event.metadata).length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {event.metadata.file_name ? (
                            <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-[9px] font-black text-slate-600">
                              {event.metadata.file_name}
                            </span>
                          ) : null}

                          {event.metadata.version ? (
                            <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-1 text-[9px] font-black text-orange-700">
                              v{event.metadata.version}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* REJECTION */}
      {rejectionTarget ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.6rem] border-2 border-red-400 bg-[#fffaf4] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">
                  Verification Action
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  Reject {getFileName(rejectionTarget)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-red-300 bg-white text-slate-500 transition hover:text-red-600"
              >
                <X size={17} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-black text-[#10233f]">
                Rejection reason
              </span>

              <textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Explain exactly what needs to be corrected or replaced..."
                rows={5}
                className="w-full resize-none rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-600"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={async () => {
                  await changeStatus(
                    rejectionTarget,
                    "rejected",
                    rejectionReason.trim()
                  );
                  setRejectionTarget(null);
                  setRejectionReason("");
                }}
                className="rounded-xl border-2 border-red-700 bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InspectorStat({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233f]">
        {value || "—"}
      </p>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-slate-300 bg-white text-[#10233f]",
    orange: "border-orange-400 bg-orange-50 text-orange-800",
    green: "border-emerald-400 bg-emerald-50 text-emerald-800",
    blue: "border-blue-400 bg-blue-50 text-blue-800",
    red: "border-red-400 bg-red-50 text-red-800",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
        tones[tone] || tones.slate
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
        <Icon size={16} />
      </span>

      <div className="min-w-0">
        <p className="text-lg font-black leading-none">{value}</p>
        <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.1em] opacity-75">
          {label}
        </p>
      </div>
    </div>
  );
}

function DocumentRow({
  document,
  getFileName,
  statusClass,
  busy,
  saving,
  onOpen,
  onDownload,
  onVerify,
  onUnverify,
  onReject,
  onArchive,
  onRestore,
  selected,
  onToggleSelected,
  onEditDetails,
  onDelete,
  onRestoreDeleted,
  onPermanentDelete,
  onReplace,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = normalize(document.status || "received");
  const isArchived = status === "archived";
  const isDeleted = Boolean(document.is_deleted);

  const expiryState = (() => {
    if (!document.expiry_date) return null;

    const expiry = new Date(document.expiry_date).getTime();
    if (Number.isNaN(expiry)) return null;

    const days = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));

    if (days < 0) return { label: "Expired", tone: "red" };
    if (days <= 30) return { label: `${days}d to expiry`, tone: "orange" };
    return { label: `Expires ${new Date(document.expiry_date).toLocaleDateString("en-GB")}`, tone: "slate" };
  })();

  return (
    <div
      className={`rounded-2xl border-2 p-3 shadow-[0_4px_14px_rgba(15,35,63,0.035)] transition ${
        isDeleted
          ? "border-slate-400 bg-slate-100/80"
          : "border-slate-300 bg-white hover:border-orange-400"
      }`}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSelected}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
              selected
                ? "border-[#0b2a57] bg-[#0b2a57] text-white"
                : "border-slate-300 bg-white text-slate-400"
            }`}
            title={selected ? "Unselect document" : "Select document"}
          >
            {selected ? (
              <CheckSquare size={15} style={{ color: "#ffffff" }} />
            ) : (
              <Square size={15} />
            )}
          </button>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-200 bg-orange-50 text-orange-600">
            <File size={17} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="max-w-full truncate text-sm font-black text-[#10233f]">
                {getFileName(document)}
              </p>

              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-black capitalize ${statusClass(
                  status,
                  isDeleted
                )}`}
              >
                {saving ? "saving..." : status}
              </span>
            </div>

            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {document.document_name || "Document"} · Updated{" "}
              {formatDate(document.updated_at || document.created_at)}
            </p>

            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                v{document.version || 1}
              </span>

              {document.document_category ? (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[9px] font-black uppercase text-orange-700">
                  {document.document_category}
                </span>
              ) : null}

              {expiryState ? (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                    expiryState.tone === "red"
                      ? "border-red-300 bg-red-50 text-red-800"
                      : expiryState.tone === "orange"
                      ? "border-orange-400 bg-orange-50 text-orange-800"
                      : "border-slate-300 bg-slate-50 text-slate-600"
                  }`}
                >
                  {expiryState.label}
                </span>
              ) : null}
            </div>

            {document.notes ? (
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {document.notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDeleted ? (
            <>
              <button
                type="button"
                onClick={onRestoreDeleted}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-blue-400 bg-blue-50 px-2.5 py-2 text-[11px] font-black text-blue-800"
              >
                <RotateCcw size={13} />
                Restore
              </button>

              <button
                type="button"
                onClick={onPermanentDelete}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-red-500 bg-red-50 px-2.5 py-2 text-[11px] font-black text-red-800"
              >
                <Trash2 size={13} />
                Delete forever
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onEditDetails}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#0b2a57] bg-white px-2.5 py-2 text-[11px] font-black text-[#0b2a57] transition hover:bg-slate-50 disabled:opacity-40"
              >
                <CalendarClock size={13} />
                Details
              </button>

          {document.file_url ? (
            <>
              <button
                type="button"
                onClick={onOpen}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-orange-300 sm:w-auto bg-orange-50 px-2.5 py-2 text-[11px] font-black text-orange-700 transition hover:bg-orange-100 disabled:opacity-40"
              >
                <Eye size={13} />
                Preview
              </button>

              <button
                type="button"
                onClick={onDownload}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-blue-300 sm:w-auto bg-blue-50 px-2.5 py-2 text-[11px] font-black text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
              >
                <Download size={13} />
                Download
              </button>
            </>
          ) : null}

          {!isArchived ? (
            status === "verified" ? (
              <button
                type="button"
                onClick={onUnverify}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 px-2.5 py-2 text-[11px] font-black text-amber-800 transition hover:bg-amber-100 disabled:opacity-40 sm:w-auto"
                title="Move this document back to review"
              >
                <RotateCcw size={13} />
                Unverify
              </button>
            ) : (
              <button
                type="button"
                onClick={onVerify}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40 sm:w-auto"
              >
                <BadgeCheck size={13} />
                Verify
              </button>
            )
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              disabled={busy}
              className="flex h-9 w-full items-center justify-center rounded-lg border-2 border-slate-300 sm:w-9 bg-white text-slate-500 transition hover:border-orange-300 hover:text-orange-600 disabled:opacity-40"
              aria-label="More document actions"
              title="More document actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-11 z-30 w-[min(13rem,calc(100vw-2rem))] overflow-hidden rounded-xl border-2 border-orange-300 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                {!isArchived ? (
                  <>
                    {status === "rejected" ? (
                      <MenuButton
                        icon={RotateCcw}
                        label="Return to review"
                        onClick={() => {
                          setMenuOpen(false);
                          onUnverify();
                        }}
                      />
                    ) : (
                      <MenuButton
                        icon={XCircle}
                        label="Reject with reason"
                        onClick={() => {
                          setMenuOpen(false);
                          onReject();
                        }}
                        tone="red"
                      />
                    )}

                    <MenuButton
                      icon={CalendarClock}
                      label="Edit details / expiry"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditDetails();
                      }}
                    />

                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-black text-[#10233f] transition hover:bg-orange-50 hover:text-orange-700">
                      <RotateCcw size={14} />
                      Replace file
                      <input
                        type="file"
                        className="hidden"
                        disabled={busy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) onReplace(file);
                          event.target.value = "";
                          setMenuOpen(false);
                        }}
                      />
                    </label>

                    <MenuButton
                      icon={Archive}
                      label="Archive"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive();
                      }}
                    />
                  </>
                ) : (
                  <MenuButton
                    icon={RotateCcw}
                    label="Restore to review"
                    onClick={() => {
                      setMenuOpen(false);
                      onRestore();
                    }}
                  />
                )}

                <div className="my-1 h-px bg-slate-200" />

                <MenuButton
                  icon={Trash2}
                  label="Permanently delete"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  tone="red"
                />
              </div>
            ) : null}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-black transition ${
        tone === "red"
          ? "text-red-700 hover:bg-red-50"
          : "text-[#10233f] hover:bg-orange-50 hover:text-orange-700"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

export default StudentDocumentsPanel;
