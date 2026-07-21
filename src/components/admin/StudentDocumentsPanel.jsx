// StudentDocumentsPanel V2 — Document Operations Center
// Preserves Supabase document CRUD, storage upload/replacement/deletion,
// public URLs, timeline events, optimistic local updates, timeouts and parent refresh.
// Full mature file retained; visual layer aligned with Zaifan Admin OS.

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 30000;
const STORAGE_BUCKET = "student-documents";

function StudentDocumentsPanel({
  student,
  sharedDocuments = [],
  onSharedDataChange = null,
}) {
  const requiredDocuments = useMemo(
    () => [
      "Passport",
      "Transcript",
      "Degree",
      "IELTS",
      "Personal Statement",
      "CV",
      "Financial Documents",
    ],
    []
  );

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);

  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!Array.isArray(sharedDocuments) || sharedDocuments.length === 0) return;
    setDocuments(sharedDocuments);
  }, [sharedDocuments]);

  useEffect(() => {
    loadDocuments();
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

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
        setTimeout(() => reject(new Error("Student OS refresh timed out.")), 10000)
      ),
    ]);
  } catch (error) {
    console.warn("Documents saved, but parent Student OS refresh failed:", error);
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
    // Timeline should never break documents
  }
}; 
  const getFileName = (item) => {
    if (!item?.file_path) return "Student document";
    return item.file_path.split("/").pop() || "Student document";
  };

  const buildStoragePath = (documentName, file) => {
    const safeName = documentName.toLowerCase().replaceAll(" ", "-");
    const safeFileName = file.name.replace(/[^\w.\-]+/g, "-");
    return `${studentId}/${safeName}-${Date.now()}-${safeFileName}`;
  };

  const loadDocuments = async () => {
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
      setError("");
      setSuccessMessage("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: true }),
        "Document loading timed out. Please refresh this panel."
      );

      if (loadRequestRef.current !== requestId) return;
      if (error) throw error;

      safeSet(() => {
        setDocuments(data || []);
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setError(error.message || "Failed to load documents.");
        setDocuments([]);
      });
    } finally {
      if (loadRequestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "verified":
        return "border-emerald-300 bg-emerald-50 text-emerald-700";
      case "received":
        return "border-blue-300 bg-blue-50 text-blue-700";
      case "rejected":
        return "border-red-300 bg-red-50 text-red-700";
      default:
        return "border-amber-300 bg-amber-50 text-amber-800";
    }
  };

  const updateLocalDocument = (documentName, patch) => {
    setDocuments((prev) => {
      const existing = prev.find((item) => item.document_name === documentName);

      if (!existing) {
        return [
          ...prev,
          {
            id: `temp-${documentName}`,
            student_id: studentId,
            student_type: studentType,
            document_name: documentName,
            ...patch,
          },
        ];
      }

      return prev.map((item) =>
        item.document_name === documentName ? { ...item, ...patch } : item
      );
    });
  };

  const upsertDocument = async ({ documentName, status, notes = "" }) => {
    if (!studentId || savingKey) return;

    const existing = documents.find(
      (item) => item.document_name === documentName
    );

    safeSet(() => {
      setSavingKey(documentName);
      setError("");
      setSuccessMessage("");
    });

    const patch = {
      status,
      notes,
      updated_at: new Date().toISOString(),
    };

    updateLocalDocument(documentName, patch);

    try {
      const payload = {
        student_id: studentId,
        student_type: studentType,
        document_name: documentName,
        status,
        notes,
        file_path: existing?.file_path || null,
        file_url: existing?.file_url || null,
        updated_at: new Date().toISOString(),
      };

      if (existing && !String(existing.id).startsWith("temp-")) {
        const result = await withTimeout(
          supabase
            .from("student_documents")
            .update(payload)
            .eq("id", existing.id),
          "Document update timed out. Please try again."
        );

        if (result.error) throw result.error;

        updateLocalDocument(documentName, payload);
      } else {
        const result = await withTimeout(
          supabase
            .from("student_documents")
            .insert(payload)
            .select()
            .single(),
          "Document create timed out. Please try again."
        );

        if (result.error) throw result.error;

        updateLocalDocument(documentName, result.data);
      }

      await createTimelineEvent({
  eventType: `document_${status}`,
  title: `Document ${status}`,
  description: `${documentName} marked as ${status}.`,
  newValue: documentName,
});

safeSet(() => {
  setSuccessMessage(`${documentName} marked as ${status}.`);
});

await notifyParent();
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Document update failed.");
      });
    } finally {
      safeSet(() => {
        setSavingKey("");
      });
    }
  };

  const uploadDocument = async (documentName, file) => {
    if (!file || !studentId || savingKey) return;

    const existing = documents.find(
      (item) => item.document_name === documentName
    );

    safeSet(() => {
      setSavingKey(documentName);
      setError("");
      setSuccessMessage("");
    });

    try {
      const oldFilePath = existing?.file_path || "";
      const filePath = buildStoragePath(documentName, file);

      const uploadResult = await withTimeout(
        supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        }),
        "Document upload timed out. Please check your storage bucket and try again."
      );

      if (uploadResult.error) throw uploadResult.error;

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const payload = {
        student_id: studentId,
        student_type: studentType,
        document_name: documentName,
        status: "received",
        file_path: filePath,
        file_url: publicUrlData?.publicUrl || "",
        notes: existing?.notes || "Document uploaded.",
        updated_at: new Date().toISOString(),
      };

      if (existing && !String(existing.id).startsWith("temp-")) {
        const result = await withTimeout(
          supabase
            .from("student_documents")
            .update(payload)
            .eq("id", existing.id),
          "Document upload record update timed out. Please refresh."
        );

        if (result.error) throw result.error;

        updateLocalDocument(documentName, {
          ...existing,
          ...payload,
        });
      } else {
        const result = await withTimeout(
          supabase
            .from("student_documents")
            .insert(payload)
            .select()
            .single(),
          "Document upload record create timed out. Please refresh."
        );

        if (result.error) throw result.error;

        updateLocalDocument(documentName, result.data);
      }

      if (oldFilePath && oldFilePath !== filePath) {
        supabase.storage.from(STORAGE_BUCKET).remove([oldFilePath]);
      }

      await createTimelineEvent({
  eventType: "document_uploaded",
  title: "Document Uploaded",
  description: `${documentName} uploaded.`,
  newValue: documentName,
});

safeSet(() => {
  setSuccessMessage(`${documentName} uploaded successfully.`);
});

await notifyParent();
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Upload failed.");
      });
    } finally {
      safeSet(() => {
        setSavingKey("");
      });
    }
  };

  const deleteDocumentFile = async (documentName) => {
    if (!studentId || savingKey) return;

    const existing = documents.find(
      (item) => item.document_name === documentName
    );

    if (!existing || !existing.id || String(existing.id).startsWith("temp-")) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the uploaded file for ${documentName}?`
    );

    if (!confirmed) return;

    safeSet(() => {
      setSavingKey(documentName);
      setError("");
      setSuccessMessage("");
    });

    try {
      const oldFilePath = existing.file_path;

      const payload = {
        status: "missing",
        file_path: null,
        file_url: null,
        notes: `${documentName} file deleted.`,
        updated_at: new Date().toISOString(),
      };

      updateLocalDocument(documentName, payload);

      const result = await withTimeout(
        supabase
          .from("student_documents")
          .update(payload)
          .eq("id", existing.id),
        "Document delete update timed out. Please refresh."
      );

      if (result.error) throw result.error;

      if (oldFilePath) {
        supabase.storage.from(STORAGE_BUCKET).remove([oldFilePath]);
      }

      await createTimelineEvent({
  eventType: "document_deleted",
  title: "Document Deleted",
  description: `${documentName} file deleted.`,
  newValue: documentName,
});

safeSet(() => {
  setSuccessMessage(`${documentName} file deleted.`);
});

await notifyParent();
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Delete failed.");
      });
    } finally {
      safeSet(() => {
        setSavingKey("");
      });
    }
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

  const verifiedCount = documents.filter(
    (item) => item.status === "verified"
  ).length;

  const receivedCount = documents.filter((item) =>
    ["received", "verified"].includes(item.status)
  ).length;

  const completion = Math.round(
    (verifiedCount / requiredDocuments.length) * 100
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
          Student Documents
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Application Readiness Center
        </h2>

        <p className="mt-2 text-slate-200">
          Upload, open, download, replace, delete, verify, reject, and track all
          student application documents.
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${completion || 0}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-slate-200">
          {completion || 0}% verified • {receivedCount}/
          {requiredDocuments.length} received
        </p>

        <button
          type="button"
          onClick={loadDocuments}
          disabled={loading || Boolean(savingKey)}
          className="mt-4 rounded-full border border-orange-400/50 bg-orange-500 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Documents"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-700">
          Loading documents...
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {requiredDocuments.map((doc) => {
          const existing = documents.find((item) => item.document_name === doc);
          const status = existing?.status || "missing";
          const isSaving = savingKey === doc;
          const hasFile = Boolean(existing?.file_url);

          return (
            <div
              key={doc}
              className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black text-[#10233f]">{doc}</h3>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(
                    status
                  )}`}
                >
                  {isSaving ? "saving..." : status}
                </span>
              </div>

              <p className="mt-3 min-h-[40px] text-sm text-slate-600">
                {existing?.notes || "No notes available."}
              </p>

              {hasFile ? (
                <div className="mt-4 rounded-2xl border border-slate-300 bg-[#fffaf2] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    Uploaded File
                  </p>

                  <p className="mt-2 break-all text-sm font-black text-[#10233f]/75">
                    {getFileName(existing)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openDocument(existing)}
                      disabled={Boolean(savingKey)}
                      className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700 transition hover:border-[#D4AF37]/45 disabled:opacity-50"
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadDocument(existing)}
                      disabled={Boolean(savingKey)}
                      className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:border-blue-400/45 disabled:opacity-50"
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDocumentFile(doc)}
                      disabled={Boolean(savingKey)}
                      className="rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-black text-red-700 transition hover:border-red-400/45 disabled:opacity-50"
                    >
                      Delete File
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {hasFile ? "Replace File" : "Upload File"}
                </p>

                <input
                  type="file"
                  disabled={Boolean(savingKey)}
                  onChange={(event) => {
                    uploadDocument(doc, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white disabled:opacity-50"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["missing", "received", "verified", "rejected"].map(
                  (statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      disabled={Boolean(savingKey)}
                      onClick={() =>
                        upsertDocument({
                          documentName: doc,
                          status: statusOption,
                          notes:
                            existing?.notes ||
                            `${doc} marked as ${statusOption}.`,
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        status === statusOption
                          ? getStatusStyle(statusOption)
                          : "border-slate-300 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                      }`}
                    >
                      {statusOption}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentDocumentsPanel;