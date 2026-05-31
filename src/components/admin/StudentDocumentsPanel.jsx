import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 30000;
const STORAGE_BUCKET = "student-documents";

function StudentDocumentsPanel({ student }) {
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
        return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
      case "received":
        return "border-blue-400/25 bg-blue-500/10 text-blue-300";
      case "rejected":
        return "border-red-400/25 bg-red-500/10 text-red-300";
      default:
        return "border-yellow-400/25 bg-yellow-500/10 text-yellow-300";
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

      safeSet(() => {
        setSuccessMessage(`${documentName} marked as ${status}.`);
      });
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

      safeSet(() => {
        setSuccessMessage(`${documentName} uploaded successfully.`);
      });
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

      safeSet(() => {
        setSuccessMessage(`${documentName} file deleted.`);
      });
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
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          Student Documents
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Application Readiness Center
        </h2>

        <p className="mt-2 text-white/60">
          Upload, open, download, replace, delete, verify, reject, and track all
          student application documents.
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
            style={{ width: `${completion || 0}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-white/50">
          {completion || 0}% verified • {receivedCount}/
          {requiredDocuments.length} received
        </p>

        <button
          type="button"
          onClick={loadDocuments}
          disabled={loading || Boolean(savingKey)}
          className="mt-4 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Documents"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/50">
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
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{doc}</h3>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyle(
                    status
                  )}`}
                >
                  {isSaving ? "saving..." : status}
                </span>
              </div>

              <p className="mt-3 min-h-[40px] text-sm text-white/50">
                {existing?.notes || "No notes available."}
              </p>

              {hasFile ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                    Uploaded File
                  </p>

                  <p className="mt-2 break-all text-sm font-semibold text-white/75">
                    {getFileName(existing)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openDocument(existing)}
                      disabled={Boolean(savingKey)}
                      className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition hover:border-[#D4AF37]/45 disabled:opacity-50"
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadDocument(existing)}
                      disabled={Boolean(savingKey)}
                      className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300 transition hover:border-blue-400/45 disabled:opacity-50"
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDocumentFile(doc)}
                      disabled={Boolean(savingKey)}
                      className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:border-red-400/45 disabled:opacity-50"
                    >
                      Delete File
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                  {hasFile ? "Replace File" : "Upload File"}
                </p>

                <input
                  type="file"
                  disabled={Boolean(savingKey)}
                  onChange={(event) => {
                    uploadDocument(doc, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  className="block w-full text-xs text-white/50 file:mr-3 file:rounded-full file:border-0 file:bg-[#D4AF37] file:px-4 file:py-2 file:text-xs file:font-bold file:text-black disabled:opacity-50"
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
                          : "border-white/10 bg-white/[0.03] text-white/45 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
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