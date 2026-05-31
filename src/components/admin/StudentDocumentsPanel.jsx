import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
      setTimeout(() => reject(new Error(message)), 12000)
    ),
  ]);

  const loadDocuments = async () => {
    if (!studentId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      safeSet(() => {
        setDocuments(data || []);
      });
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Failed to load documents.");
        setDocuments([]);
      });
    } finally {
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

    const previousDocuments = documents;

    setSavingKey(documentName);
    setError("");
    setSuccessMessage("");

    updateLocalDocument(documentName, {
      status,
      notes,
      updated_at: new Date().toISOString(),
    });

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

      const result = await withTimeout(
  existing && !String(existing.id).startsWith("temp-")
    ? supabase
        .from("student_documents")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single()
    : supabase
        .from("student_documents")
        .insert(payload)
        .select()
        .single(),
  "Document update timed out. Please try again."
);

      if (result.error) throw result.error;

      updateLocalDocument(documentName, result.data);
      setSuccessMessage(`${documentName} marked as ${status}.`);
    } catch (error) {
      setDocuments(previousDocuments);
      setError(error.message || "Document update failed.");
    } finally {
      setSavingKey("");
    }
  };

  const uploadDocument = async (documentName, file) => {
    if (!file || !studentId || savingKey) return;

    const existing = documents.find(
      (item) => item.document_name === documentName
    );

    const previousDocuments = documents;

    setSavingKey(documentName);
    setError("");
    setSuccessMessage("");

    try {
      const safeName = documentName.toLowerCase().replaceAll(" ", "-");
      const safeFileName = file.name.replace(/[^\w.\-]+/g, "-");
      const filePath = `${studentId}/${safeName}-${Date.now()}-${safeFileName}`;

      const uploadResult = await supabase.storage
        .from("student-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadResult.error) throw uploadResult.error;

      const { data: publicUrlData } = supabase.storage
        .from("student-documents")
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

      const result =
        existing && !String(existing.id).startsWith("temp-")
          ? await supabase
              .from("student_documents")
              .update(payload)
              .eq("id", existing.id)
              .select()
              .single()
          : await supabase
              .from("student_documents")
              .insert(payload)
              .select()
              .single();

      if (result.error) throw result.error;

      updateLocalDocument(documentName, result.data);
      setSuccessMessage(`${documentName} uploaded successfully.`);
    } catch (error) {
      setDocuments(previousDocuments);
      setError(error.message || "Upload failed.");
    } finally {
      setSavingKey("");
    }
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
          Upload, verify, reject, and track all student application documents.
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
            style={{ width: `${completion || 0}%` }}
          />
        </div>

        <p className="mt-2 text-sm text-white/50">
          {completion || 0}% verified • {receivedCount}/{requiredDocuments.length} received
        </p>
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

              {existing?.file_url ? (
                <a
                  href={existing.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-[#D4AF37] hover:underline"
                >
                  View uploaded file
                </a>
              ) : null}

              <div className="mt-4">
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