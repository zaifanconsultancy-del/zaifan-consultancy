// GPTCopilotPanel CASE BRIEF MAX V6.3 — PERMANENT PAID OUTPUT VAULT
// - automatic recovery backup immediately after every successful paid generation
// - automatic Supabase persistence with duplicate protection
// - permanent Open / Copy / Delete history and clipboard rescue import
// GPTCopilotPanel CASE BRIEF MAX V6.2 — FINAL SCANABILITY COMPRESSION
// - live CRM top strip, compact hero, evidence chips, 3-column system grid
// - explicit Problem → Evidence → Required Action cards
// - compact source chips and operations-first clipboard formatting
// GPTCopilotPanel CASE BRIEF MAX V6.1 — MODE-AWARE DEEP REASONING TIMEOUT
// - normal GPT modes remain 45s; Case Brief gets 125s for Student 360 structured reasoning
// GPTCopilotPanel CASE BRAIN V6 — RICH STUDENT OPERATIONS BRIEF
// Case Brief JSON is rendered as operational cards instead of a raw prose/pre block.
// GPTCopilotPanel CASE BRAIN V5.3 — VISA-STYLE GENERATE HOVER
// Exact interaction language copied from Refresh Visa OS: subtle lift + cream hover + shadow-md.
// - Generate buttons now make the real GPT request after one browser confirmation
// - removes confusing second inline Approve & Generate step
// GPTCopilotPanel STUDENT CASE BRAIN V5 — Student 360 + SOP/CV/Case Brief/Gap Audit
// GPTCopilotPanel V4 MAXIMUM — Paid GPT Counselor Copilot
// src/components/admin/GPTCopilotPanel.jsx

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  GraduationCap,
  HelpCircle,
  FolderOpen,
  Mail,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trash2,
  Upload,
  Wand2,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateGptCopilotText } from "../../../../services/gptCopilotService";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";
import {
  backupGptOutputLocally,
  clearGptOutputRecovery,
  deleteStudentGptOutput,
  listStudentGptOutputs,
  readGptOutputRecovery,
  saveStudentGptOutput,
} from "../../../../services/gptOutputStore";

const GENERATION_TIMEOUT_MS = 45_000;
const CASE_BRIEF_GENERATION_TIMEOUT_MS = 125_000;

function getGenerationTimeoutMs(modeId = "") {
  return modeId === "case_brief"
    ? CASE_BRIEF_GENERATION_TIMEOUT_MS
    : GENERATION_TIMEOUT_MS;
}
const MAX_HISTORY = 12;
const MAX_SAVED_OUTPUTS = 12;

const MODES = [
  { id: "summary", label: "Smart Summary", icon: FileText, text: "Senior counselor profile analysis.", category: "Analysis" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, text: "Personalized WhatsApp follow-up.", category: "Communication" },
  { id: "email", label: "Email", icon: Mail, text: "Professional email draft.", category: "Communication" },
  { id: "next_action", label: "Next Action", icon: Target, text: "Best counselor move.", category: "Strategy" },
  { id: "visa_risk", label: "Visa Risk", icon: ShieldAlert, text: "Visa preparation risk notes.", category: "Risk" },
  { id: "call_script", label: "Call Script", icon: PhoneCall, text: "Counselor call flow.", category: "Communication" },
  { id: "followup_plan", label: "7-Day Plan", icon: Brain, text: "Follow-up strategy.", category: "Strategy" },
  { id: "scholarship", label: "Scholarship", icon: GraduationCap, text: "Scholarship potential analysis.", category: "Analysis" },
  { id: "objection_analysis", label: "Objections", icon: HelpCircle, text: "Student objection detection.", category: "Risk" },
  { id: "counselor_strategy", label: "Strategy", icon: TrendingUp, text: "Senior counselor strategy.", category: "Strategy" },
  { id: "case_brief", label: "Case Brief", icon: Clipboard, text: "Full Student 360 counselor handover brief.", category: "Operations" },
  { id: "gap_audit", label: "Gap Audit", icon: ShieldAlert, text: "Find missing data, blockers and case inconsistencies.", category: "Operations" },
  { id: "sop_draft", label: "SOP Draft", icon: GraduationCap, text: "Evidence-only SOP draft using verified student facts.", category: "Documents" },
  { id: "cv_draft", label: "CV Draft", icon: FileText, text: "Evidence-only student CV draft with missing-fact flags.", category: "Documents" },
];

function safeString(value, fallback = "") {
  return value === null || value === undefined ? fallback : String(value);
}


function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseStructuredOutput(value) {
  const raw = safeString(value).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function parseCaseBriefOutput(value) {
  const parsed = parseStructuredOutput(value);
  if (!parsed) return null;

  if (
    typeof parsed.headline !== "string" ||
    !parsed.studentSnapshot ||
    !Array.isArray(parsed.systemStatus) ||
    !Array.isArray(parsed.nextActions)
  ) {
    return null;
  }

  return parsed;
}

function formatCaseBriefForClipboard(data) {
  if (!data) return "";

  const snapshot = data.studentSnapshot || {};
  const lines = [
    "ZAIFAN | STUDENT 360 OPERATIONS BRIEF",
    `${data.caseHealth || "UNKNOWN"} — ${compactCaseHeadline(data.headline)}`,
    data.healthReason ? `Case signal: ${data.healthReason}` : "",
    "",
    `Student: ${snapshot.name || "Unknown"}`,
    `Route: ${snapshot.route || "Unknown"}`,
    `Stage: ${snapshot.currentStage || "Unknown"}`,
    `Priority: ${snapshot.priority || "Unknown"} | Portal: ${snapshot.portalState || "Unknown"}`,
    "",
    "SYSTEM STATUS",
  ].filter(Boolean);

  safeArray(data.systemStatus).forEach((item) => {
    lines.push(
      `[${item.state || "Unknown"}] ${item.system || "System"} — ${item.headline || "No headline"}`,
      item.detail ? `  ${item.detail}` : "",
      `  Source: ${item.source || "Unknown"}`
    );
  });

  const appendObjects = (title, items, formatter) => {
    lines.push("", title);

    if (!safeArray(items).length) {
      lines.push("None supported by current Student 360 evidence.");
      return;
    }

    safeArray(items).forEach((item, index) => {
      lines.push(...formatter(item, index));
    });
  };

  appendObjects("CRITICAL BLOCKERS", data.criticalBlockers, (item, index) => [
    `${index + 1}. PROBLEM — ${item.blocker || "Blocker"}`,
    `   EVIDENCE — ${item.evidence || "Unknown"}`,
    `   ACTION — ${item.action || "Human review required"}`,
    `   SOURCE — ${item.source || "Unknown"}`,
  ]);

  appendObjects("NEXT ACTIONS", data.nextActions, (item, index) => [
    `${index + 1}. ${item.action || "Action"}`,
    `   ${item.reason || ""}`,
    `   Owner: ${item.owner || "Counselor"} | Timing: ${item.timing || "Next available"}`,
    `   Source: ${item.source || "Unknown"}`,
  ]);

  appendObjects("COMPLETED — DO NOT REPEAT", data.completedWork, (item) => [
    `✓ ${item.item || "Completed item"}`,
    item.evidence ? `  Evidence: ${item.evidence}` : "",
    `  Source: ${item.source || "Unknown"}`,
  ]);

  appendObjects("RECENT CHANGES", data.recentChanges, (item) => [
    `• ${item.change || "Case update"}${item.when ? ` — ${item.when}` : ""}`,
    `  Source: ${item.source || "Unknown"}`,
  ]);

  appendObjects("CONTRADICTIONS / HUMAN REVIEW", data.contradictions, (item) => [
    `! ${item.issue || "Conflicting case data"}`,
    `  Evidence A: ${item.evidenceA || "Unknown"}`,
    `  Evidence B: ${item.evidenceB || "Unknown"}`,
    `  Resolve: ${item.resolution || "Human review required"}`,
  ]);

  appendObjects("MISSING FACTS THAT MATTER", data.missingFacts, (item) => [
    `? ${item.fact || "Missing fact"}`,
    `  Why: ${item.whyNeeded || "Required for case decision"}`,
    `  Collect: ${item.howToCollect || "Verify with the student / case record"}`,
  ]);

  lines.push(
    "",
    "COUNSELOR HANDOVER",
    data.handoverNote || "No handover note generated."
  );

  return lines
    .filter((line) => line !== undefined && line !== null && line !== "")
    .join("\n");
}
function getCopyableOutput(output, modeId) {
  if (modeId === "case_brief") {
    const parsed = parseCaseBriefOutput(output);
    if (parsed) return formatCaseBriefForClipboard(parsed);
  }

  return output;
}

function getOutputPreview(output, modeId) {
  if (modeId === "case_brief") {
    const parsed = parseCaseBriefOutput(output);
    if (parsed) {
      return `${parsed.caseHealth || "Case"}: ${parsed.headline || "Student 360 Case Brief"}`;
    }
  }

  return safeString(output).slice(0, 220);
}

function valueOrFallback(value, fallback = "Not available") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function formatPercentLike(value) {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "number") return value <= 1 ? `${Math.round(value * 100)}%` : `${Math.round(value)}%`;

  const raw = String(value).trim();
  if (!raw) return "Not available";
  if (raw.includes("%")) return raw;

  const parsed = Number(raw);
  return Number.isFinite(parsed)
    ? parsed <= 1
      ? `${Math.round(parsed * 100)}%`
      : `${Math.round(parsed)}%`
    : raw;
}

function getErrorMessage(error, fallback = "GPT generation failed.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || error.details || error.hint || fallback;
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function GPTCopilotPanel({
  student = null,
  studentType = "inquiry",
  adminProfile = null,
  aiLead = null,
  crmContext = {},
}) {
  const reduceMotion = useReducedMotion();

  const [activeMode, setActiveMode] = useState("summary");
  const [output, setOutput] = useState("");
  const [lastMode, setLastMode] = useState("");
  const [lastGeneratedAt, setLastGeneratedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState([]);
  const [savedOutputsLoading, setSavedOutputsLoading] = useState(false);
  const [savingOutput, setSavingOutput] = useState(false);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [generationError, setGenerationError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingMode, setPendingMode] = useState("");
  const [showContext, setShowContext] = useState(true);

  const mountedRef = useRef(true);
  const generationTokenRef = useRef(0);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const studentIdentity = useMemo(
    () =>
      student
        ? `${studentType}:${student.id || student.student_id || student.email || student.phone || "unknown"}`
        : "",
    [student, studentType]
  );

  useEffect(() => {
    let cancelled = false;

    generationTokenRef.current += 1;
    setPendingMode("");
    setGenerationError("");
    setStatusMessage("");
    setOutput("");
    setLastMode("");
    setLastGeneratedAt("");
    setCopied(false);
    setSavedOutputs([]);
    setGenerationHistory([]);

    const studentId = String(student?.id || student?.student_id || "").trim();

    if (!studentIdentity || !studentId) {
      return () => {
        cancelled = true;
      };
    }

    const loadSavedWorkspace = async () => {
      setSavedOutputsLoading(true);

      try {
        const stored = await listStudentGptOutputs({
          studentId,
          studentType,
          limit: MAX_SAVED_OUTPUTS * 2,
        });

        if (!cancelled && mountedRef.current) {
          setSavedOutputs(stored.slice(0, MAX_SAVED_OUTPUTS));
        }
      } catch (error) {
        console.warn("Permanent GPT outputs could not load:", error);

        if (!cancelled && mountedRef.current) {
          setGenerationError(
            `${getErrorMessage(error)} Existing paid output is still protected by browser recovery when available.`
          );
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          setSavedOutputsLoading(false);
        }
      }

      const recovery = readGptOutputRecovery({
        studentId,
        studentType,
      });

      if (
        recovery?.output &&
        !cancelled &&
        mountedRef.current
      ) {
        setOutput(recovery.output);
        setLastMode(recovery.mode || "summary");
        setActiveMode(recovery.mode || "summary");
        setLastGeneratedAt(
          recovery.generatedAt
            ? new Date(recovery.generatedAt).toLocaleString()
            : "Recovered from browser safety backup"
        );
        setStatusMessage(
          "Recovered an unsaved paid GPT output from this browser. Save it permanently before clearing."
        );
      }
    };

    void loadSavedWorkspace();

    return () => {
      cancelled = true;
    };
  }, [studentIdentity, student?.id, student?.student_id, studentType]);

  if (!student) return null;

  const active = MODES.find((mode) => mode.id === activeMode) || MODES[0];
  const persistenceStudentId = String(
    student?.id || student?.student_id || ""
  ).trim();

  const currentOutputSaved = Boolean(
    output &&
      savedOutputs.some(
        (item) =>
          item?.output === output &&
          item?.mode === (lastMode || activeMode)
      )
  );

  const name = student.full_name || student.name || "Unnamed Student";
  const email = student.email || "No email";
  const phone = student.phone || student.phone_number || student.whatsapp || "No phone";
  const country = student.country || student.country_interest || student.preferred_country || "Not selected";
  const program =
    student.field_of_interest ||
    student.course ||
    student.program ||
    student.study_field ||
    student.consultation_type ||
    "Not selected";
  const status = student.status || student.appointment_stage || student.pipeline_stage || "Not selected";
  const priority = student.priority || "Not selected";

  const enrichedContext = useMemo(
    () => ({
      ...crmContext,
      leadScore: crmContext?.leadScore ?? aiLead?.ai_score ?? null,
      leadHealth: crmContext?.leadHealth ?? aiLead?.ai_tier?.label ?? null,
      overdueStatus: crmContext?.overdueStatus ?? aiLead?.ai_urgency?.label ?? null,
      extraContext: {
        ...(crmContext?.extraContext || {}),
        ai_score: aiLead?.ai_score,
        ai_tier: aiLead?.ai_tier?.label,
        ai_urgency: aiLead?.ai_urgency?.label,
        ai_conversion_probability: aiLead?.ai_conversion_probability,
        ai_recommended_action: aiLead?.ai_recommended_action,
      },
    }),
    [crmContext, aiLead]
  );

  const caseBriefData = useMemo(
    () =>
      lastMode === "case_brief" && output
        ? parseCaseBriefOutput(output)
        : null,
    [lastMode, output]
  );

  const contextRows = [
    ["Student", name],
    ["Type", studentType],
    ["Country", country],
    ["Program", program],
    ["Status", status],
    ["Priority", priority],
    ["Email", email],
    ["Phone", phone],
  ];

  const promptPreviewRows = [
    ["Selected GPT Mode", active.label],
    ["Mode Category", active.category],
    [
      "Lead Score",
      enrichedContext.leadScore === null || enrichedContext.leadScore === undefined
        ? "Not available"
        : `${enrichedContext.leadScore}/100`,
    ],
    ["Lead Health", valueOrFallback(enrichedContext.leadHealth)],
    ["Urgency", valueOrFallback(enrichedContext.overdueStatus)],
    ["Conversion", formatPercentLike(aiLead?.ai_conversion_probability)],
    ["Recommended Action", valueOrFallback(aiLead?.ai_recommended_action)],
    [
      "Student 360 Coverage",
      enrichedContext?.caseBrain?.version
        ? `${enrichedContext?.caseBrain?.dataSummary?.documents || 0} docs · ${enrichedContext?.caseBrain?.dataSummary?.applications || 0} apps · ${enrichedContext?.caseBrain?.dataSummary?.visaCases || 0} visa cases · ${enrichedContext?.caseBrain?.dataSummary?.supportRequests || 0} support requests`
        : "Profile-only fallback",
    ],
  ];

  const requestGeneration = (modeId = activeMode) => {
    if (loading) return;

    const selectedMode = MODES.find((mode) => mode.id === modeId) || active;

    setActiveMode(selectedMode.id);
    setPendingMode("");
    setGenerationError("");
    setStatusMessage("");

    const confirmed = window.confirm(
      `Generate ${selectedMode.label} for ${name}? This will make a real GPT/API request using this student's current Student 360 case context.`
    );

    if (!confirmed) return;

    void generate(selectedMode.id);
  };

  const cancelGenerationApproval = () => {
    if (!loading) setPendingMode("");
  };

  const generate = async (modeId = pendingMode || activeMode) => {
    if (loading) return;

    const selectedMode = MODES.find((mode) => mode.id === modeId) || active;
    const generationTimeoutMs = getGenerationTimeoutMs(selectedMode.id);
    const generationToken = generationTokenRef.current + 1;
    generationTokenRef.current = generationToken;

    try {
      setLoading(true);
      setCopied(false);
      setGenerationError("");
      setStatusMessage("");
      setPendingMode("");
      setActiveMode(selectedMode.id);

      const text = await withTimeout(
        Promise.resolve(
          generateGptCopilotText({
            mode: selectedMode.id,
            student,
            studentType,
            adminName:
              adminProfile?.full_name ||
              adminProfile?.name ||
              "Zaifan Consultancy Team",
            caseContext: enrichedContext,
            ...enrichedContext,
          })
        ),
        generationTimeoutMs,
        `${selectedMode.label} timed out after ${Math.round(
          generationTimeoutMs / 1000
        )} seconds. The workspace has been unlocked.`
      );

      if (!mountedRef.current || generationTokenRef.current !== generationToken) return;

      const cleanText = safeString(text).trim();
      if (!cleanText) throw new Error("GPT returned an empty response. No output was saved.");

      const generatedAtIso = new Date().toISOString();
      const generatedAt = new Date(generatedAtIso).toLocaleString();

      // Safety first: synchronously create a browser recovery copy before
      // any additional network request. This does not spend GPT credits.
      backupGptOutputLocally({
        studentId: persistenceStudentId,
        studentType,
        mode: selectedMode.id,
        label: selectedMode.label,
        output: cleanText,
        generatedAt: generatedAtIso,
      });

      setOutput(cleanText);
      setLastMode(selectedMode.id);
      setLastGeneratedAt(generatedAt);
      setStatusMessage(
        `${selectedMode.label} generated. Securing a permanent copy…`
      );
      setGenerationHistory((prev) =>
        [
          {
            id: `${selectedMode.id}-${Date.now()}`,
            mode: selectedMode.id,
            label: selectedMode.label,
            category: selectedMode.category,
            generatedAt,
            preview: getOutputPreview(cleanText, selectedMode.id),
          },
          ...prev,
        ].slice(0, MAX_HISTORY)
      );

      // Automatic permanent save: never require another paid generation just
      // because the counselor forgot to press Save.
      try {
        const saved = await saveStudentGptOutput({
          studentId: persistenceStudentId,
          studentType,
          mode: selectedMode.id,
          label: selectedMode.label,
          output: cleanText,
          generatedAt: generatedAtIso,
          adminProfile,
          metadata: {
            autosaved: true,
            category: selectedMode.category,
          },
        });

        if (mountedRef.current) {
          setSavedOutputs((previous) => [
            saved,
            ...previous.filter((item) => item.id !== saved.id),
          ].slice(0, MAX_SAVED_OUTPUTS));

          clearGptOutputRecovery({
            studentId: persistenceStudentId,
            studentType,
          });

          setStatusMessage(
            `${selectedMode.label} generated and permanently saved. No regeneration is required.`
          );
        }
      } catch (saveError) {
        console.error("GPT output auto-save failed:", saveError);

        if (mountedRef.current) {
          setGenerationError(
            `${getErrorMessage(saveError)} The generated output is still protected by browser recovery and remains on screen.`
          );
          setStatusMessage(
            `${selectedMode.label} generated. Permanent save needs attention, but the paid output has NOT been discarded.`
          );
        }
      }
    } catch (error) {
      console.error("GPT Copilot generation failed:", error);
      if (mountedRef.current && generationTokenRef.current === generationToken) {
        setGenerationError(getErrorMessage(error));
      }
    } finally {
      if (mountedRef.current && generationTokenRef.current === generationToken) {
        setLoading(false);
      }
    }
  };

  const copyOutput = async () => {
    if (!output) return;

    const copyValue = getCopyableOutput(output, lastMode || activeMode);

    if (!(await copyText(copyValue))) {
      setGenerationError("Output could not be copied. Select the text manually and copy it.");
      return;
    }

    setCopied(true);
    setStatusMessage("Output copied to clipboard.");
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setCopied(false);
    }, 1400);
  };

  const saveOutput = async () => {
    if (!output || savingOutput) return;

    const modeId = lastMode || activeMode;
    const mode = MODES.find((item) => item.id === modeId) || active;
    const generatedAtIso = lastGeneratedAt
      ? new Date(lastGeneratedAt).toISOString()
      : new Date().toISOString();

    backupGptOutputLocally({
      studentId: persistenceStudentId,
      studentType,
      mode: modeId,
      label: mode.label,
      output,
      generatedAt: generatedAtIso,
    });

    setSavingOutput(true);
    setGenerationError("");

    try {
      const saved = await saveStudentGptOutput({
        studentId: persistenceStudentId,
        studentType,
        mode: modeId,
        label: mode.label,
        output,
        generatedAt: generatedAtIso,
        adminProfile,
        metadata: {
          autosaved: false,
          manually_saved: true,
          category: mode.category,
        },
      });

      setSavedOutputs((previous) => [
        saved,
        ...previous.filter((item) => item.id !== saved.id),
      ].slice(0, MAX_SAVED_OUTPUTS));

      clearGptOutputRecovery({
        studentId: persistenceStudentId,
        studentType,
      });

      setStatusMessage(
        saved?.duplicate
          ? `${mode.label} was already saved permanently — no duplicate was created.`
          : `${mode.label} saved permanently. You can reopen it without another GPT call.`
      );
    } catch (error) {
      console.error("Permanent GPT save failed:", error);
      setGenerationError(
        `${getErrorMessage(error)} The browser recovery copy is still safe.`
      );
    } finally {
      if (mountedRef.current) setSavingOutput(false);
    }
  };

  const openSavedOutput = (savedOutput) => {
    if (!savedOutput?.output) return;

    setOutput(savedOutput.output);
    setLastMode(savedOutput.mode || "summary");
    setActiveMode(savedOutput.mode || "summary");
    setLastGeneratedAt(
      savedOutput.generatedAt
        ? new Date(savedOutput.generatedAt).toLocaleString()
        : savedOutput.savedAt || "Saved output"
    );
    setGenerationError("");
    setStatusMessage(
      `${savedOutput.label || "Saved output"} reopened. No GPT credits were used.`
    );

    window.requestAnimationFrame(() => {
      document
        .getElementById("gpt-workspace-output")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const deleteSavedOutput = async (savedOutput) => {
    if (!savedOutput?.id || savedOutput.id === "browser-recovery") return;

    const confirmed = window.confirm(
      `Delete this saved ${savedOutput.label || "GPT output"}? This does not regenerate or change the student case.`
    );

    if (!confirmed) return;

    try {
      await deleteStudentGptOutput(savedOutput.id);
      setSavedOutputs((previous) =>
        previous.filter((item) => item.id !== savedOutput.id)
      );
      setStatusMessage("Saved GPT output deleted.");
    } catch (error) {
      setGenerationError(getErrorMessage(error));
    }
  };

  const importClipboardBackup = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const cleanBackup = safeString(clipboardText).trim();

      if (!cleanBackup) {
        throw new Error("Clipboard is empty.");
      }

      const modeId = activeMode || "case_brief";
      const mode = MODES.find((item) => item.id === modeId) || active;
      const importedLabel = `${mode.label} · Imported Backup`;

      backupGptOutputLocally({
        studentId: persistenceStudentId,
        studentType,
        mode: modeId,
        label: importedLabel,
        output: cleanBackup,
        generatedAt: new Date().toISOString(),
      });

      const saved = await saveStudentGptOutput({
        studentId: persistenceStudentId,
        studentType,
        mode: modeId,
        label: importedLabel,
        output: cleanBackup,
        generatedAt: new Date().toISOString(),
        adminProfile,
        metadata: {
          imported_from_clipboard: true,
          no_paid_generation: true,
        },
      });

      setSavedOutputs((previous) => [
        saved,
        ...previous.filter((item) => item.id !== saved.id),
      ].slice(0, MAX_SAVED_OUTPUTS));

      clearGptOutputRecovery({
        studentId: persistenceStudentId,
        studentType,
      });

      setStatusMessage(
        "Clipboard backup imported and saved permanently. No GPT credits were used."
      );
    } catch (error) {
      console.error("GPT clipboard backup import failed:", error);
      setGenerationError(
        `${getErrorMessage(error)} Copy the old output first, then try Import Clipboard Backup again.`
      );
    }
  };

  const copySavedOutput = async (savedOutput) => {
    const copyValue = getCopyableOutput(
      savedOutput?.output,
      savedOutput?.mode
    );

    if (!(await copyText(copyValue))) {
      setGenerationError("Saved output could not be copied.");
      return;
    }
    setStatusMessage("Saved output copied.");
  };

  const clearOutput = () => {
    if (loading) return;
    setOutput("");
    setLastMode("");
    setLastGeneratedAt("");
    setCopied(false);
    setStatusMessage("Current GPT output cleared.");
  };

  const usageCards = [
    { label: "GPT Modes", value: MODES.length, icon: Brain, tone: "orange" },
    { label: "Current Mode", value: active.label, icon: Sparkles, tone: "navy" },
    { label: "Generations", value: generationHistory.length, icon: Target, tone: "orange" },
    { label: "Saved Outputs", value: savedOutputs.length, icon: Save, tone: "default" },
  ];

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-5 text-[#10233F]"
    >
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-[#FFB38A] bg-[#fffdf8] shadow-[0_18px_48px_rgba(15,35,63,0.08)]">
        <div className="grid xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 sm:p-6" style={{ color: "#FFFFFF" }}>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Sparkles} label="Real GPT Copilot" />
              <HeaderChip icon={ShieldCheck} label="Manual Credit Approval" />
            </div>

            <h2 className="mt-4 text-2xl font-black sm:text-3xl" style={{ color: "#FFFFFF" }}>
              Smart Counselor Generator
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6" style={{ color: "#F8FAFC" }}>
              Generate counselor summaries, WhatsApp messages, emails, call scripts,
              risk notes, scholarship analysis, objection handling, and strategy
              using the currently opened student CRM context.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Modes" value={MODES.length} />
              <DarkMetric label="History" value={generationHistory.length} />
              <DarkMetric label="Saved" value={savedOutputs.length} />
              <DarkMetric label="Timeout" value={`${Math.round(getGenerationTimeoutMs(activeMode) / 1000)}s`} />
            </div>
          </div>

          <div className="bg-[#FF5A0A] p-5 sm:p-6" style={{ color: "#FFFFFF" }}>
            <div className="flex items-center gap-2">
              <Wand2 size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Active Generation Mode
              </p>
            </div>

            <p className="mt-3 text-2xl font-black" style={{ color: "#FFFFFF" }}>{active.label}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em]" style={{ color: "#FFFFFF" }}>
              {active.category}
            </p>

            <p className="mt-4 text-xs font-semibold leading-5" style={{ color: "#FFF7ED" }}>
              GPT credits are used only after you explicitly approve a generation.
              This panel makes no background paid calls.
            </p>

            <button
              type="button"
              onClick={() => requestGeneration(activeMode)}
              disabled={loading}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-sm font-black text-[#C2410C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60" style={{ color: "#C2410C" }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? "Generating..." : `Generate ${active.label}`}
            </button>
          </div>
        </div>
      </div>

      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalCard
          label="Local Intelligence"
          value={valueOrFallback(enrichedContext.leadHealth, "Connected")}
          helper="Rule-based CRM context remains available without paid GPT."
          tone="navy"
        />
        <OperationalCard
          label="Lead Score"
          value={
            enrichedContext.leadScore === null || enrichedContext.leadScore === undefined
              ? "—"
              : `${enrichedContext.leadScore}/100`
          }
          helper="Current CRM intelligence signal."
          tone="orange"
        />
        <OperationalCard
          label="Paid Calls"
          value="Manual Only"
          helper="Every GPT generation asks once for confirmation, then runs immediately."
          tone="cream"
        />
        <OperationalCard
          label="Session Safety"
          value="Protected"
          helper="45s timeout and stale-response protection are active."
          tone="cream"
        />
      </div>

      {generationError ? (
        <FeedbackBanner tone="error" message={generationError} onClose={() => setGenerationError("")} />
      ) : null}

      {statusMessage ? (
        <FeedbackBanner tone="success" message={statusMessage} onClose={() => setStatusMessage("")} />
      ) : null}

      <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
        {usageCards.map((card) => <UsageCard key={card.label} card={card} />)}
      </div>

      <section className="rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-[#fffdf8] p-4 shadow-[0_10px_28px_rgba(15,35,63,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
              Generation Mode
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233F]">
              Choose what GPT should help with
            </h3>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#9B3E08]">
            Active · {active.category}
          </p>
        </div>

        <div className="mt-4 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (loading) return;
                  setActiveMode(mode.id);
                  setPendingMode("");
                  setGenerationError("");
                }}
                disabled={loading}
                className={`h-full rounded-[1.25rem] border-[3px] p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-60 ${
                  isActive
                    ? "border-[#FF5A0A] bg-[#FFF4EA]"
                    : "border-[#C9D7E6] bg-white hover:border-[#FFB38A]"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
                    isActive
                      ? "border-[#FFB38A] bg-white text-[#B84F0E]"
                      : "border-[#C9D7E6] bg-slate-50 text-[#10233F]"
                  }`}>
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${
                      isActive ? "text-[#B84F0E]" : "text-[#718096]"
                    }`}>
                      {mode.category}
                    </p>
                    <h4 className="mt-1 font-black text-[#10233F]">
                      {mode.label}
                    </h4>
                  </div>
                </div>

                <p className="mt-2 text-xs font-semibold leading-5 text-[#64748B]">
                  {mode.text}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_28px_rgba(15,35,63,0.05)] sm:p-5">
        <button
          type="button"
          onClick={() => setShowContext((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
          aria-expanded={showContext}
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
              GPT Input Visibility
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233F]">
              Student & Prompt Context
            </h3>
          </div>

          <span className="rounded-xl border-2 border-[#C9D7E6] bg-[#fffdf8] px-3 py-2 text-xs font-black text-[#10233F]">
            {showContext ? "Hide Context" : "Show Context"}
          </span>
        </button>

        {showContext ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <ContextPanel title="Student Context Sent to GPT" eyebrow="Profile Context" rows={contextRows} />
            <ContextPanel title="Prompt Preview" eyebrow="Generation Context" rows={promptPreviewRows} highlighted />
          </div>
        ) : null}
      </section>

      <section id="gpt-workspace-output" className="scroll-mt-6 rounded-[1.7rem] border-[3px] border-[#FFB38A] bg-white p-5 shadow-[0_12px_32px_rgba(15,35,63,0.055)]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
              GPT Output
            </p>
            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              {lastMode ? MODES.find((mode) => mode.id === lastMode)?.label || active.label : active.label}
            </h3>
            {lastGeneratedAt ? (
              <p className="mt-1 text-xs font-semibold text-[#65748B]">Generated {lastGeneratedAt}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveOutput()}
              disabled={!output || loading || savingOutput || currentOutputSaved}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 px-4 text-xs font-black transition disabled:cursor-not-allowed ${
                currentOutputSaved
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-[#FFB38A] bg-[#FFF4EA] text-[#9B3E08] hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFE6D5] hover:shadow-md"
              } disabled:opacity-70`}
            >
              {currentOutputSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {savingOutput
                ? "Saving Permanently…"
                : currentOutputSaved
                  ? "Saved ✓"
                  : (lastMode || activeMode) === "case_brief"
                    ? "Save Case Brief"
                    : "Save Output"}
            </button>

            <button
              type="button"
              onClick={() => void copyOutput()}
              disabled={!output || loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-xs font-black text-[#10233F] hover:border-[#FFB38A] hover:bg-[#FFF4EA] disabled:opacity-40"
            >
              <Clipboard size={14} />
              {copied ? "Copied" : "Copy Output"}
            </button>

            <button
              type="button"
              onClick={clearOutput}
              disabled={!output || loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-xs font-black text-[#51627A] hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
            >
              <X size={14} />
              Clear
            </button>
          </div>
        </div>

        <div className={`min-h-[170px] rounded-[1.3rem] border-[3px] border-[#C9D7E6] ${caseBriefData ? "bg-[#FFF8EF] p-3 sm:p-4" : "bg-[#fffdf8] p-4"}`}>
          {loading ? (
            <div className="flex min-h-[125px] flex-col items-center justify-center text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-600" />
              <p className="mt-4 font-black text-[#10233F]">GPT is generating {active.label}...</p>
              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#65748B]">
                The request will time out safely after {Math.round(getGenerationTimeoutMs(activeMode) / 1000)} seconds.
              </p>
            </div>
          ) : caseBriefData ? (
            <CaseBriefRenderer data={caseBriefData} student={student} />
          ) : output ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm font-medium leading-7 text-slate-700">
              {output}
            </pre>
          ) : (
            <div className="flex min-h-[125px] flex-col items-center justify-center text-center">
              <Brain className="h-9 w-9 text-[#D94B00]" />
              <h3 className="mt-3 text-base font-black text-[#10233F]">
                Ready for counselor-assisted GPT generation
              </h3>
              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#65748B]">
                Choose a mode, review CRM context, then explicitly approve paid GPT generation.
              </p>
            </div>
          )}
        </div>

        {output && !loading ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.07em] text-[#65748B]">
            <span>{output.length.toLocaleString()} characters</span>
            <button
              type="button"
              onClick={() => requestGeneration(lastMode || activeMode)}
              className="inline-flex items-center gap-1.5 text-[#B84F0E]"
            >
              <RefreshCw size={12} />
              Regenerate with approval
            </button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <HistoryPanel history={generationHistory} />
        <SavedOutputsPanel
          savedOutputs={savedOutputs}
          loading={savedOutputsLoading}
          onOpen={openSavedOutput}
          onCopy={copySavedOutput}
          onDelete={deleteSavedOutput}
          onImportClipboard={importClipboardBackup}
        />
      </div>

      <div className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4">
        <div className="flex min-w-0 items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#B84F0E]" />
          <div>
            <p className="font-black text-[#10233F]">GPT operating policy</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#51627A]">
              GPT output is counselor assistance, not an automatic CRM decision.
              Review visa, scholarship, admissions, and compliance-sensitive claims
              before sending them to a student. Successful generations are backed up
              immediately and then stored in Supabase for this signed-in staff account,
              so reopening a saved output never requires another paid GPT call.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/30 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em]"
      style={{ color: "#FFFFFF" }}
    >
      <Icon size={11} style={{ color: "#FDBA74" }} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return <ZaifanMetricCard level="baby" surface="navy" label={label} value={value} tone="navy" />;
}

function FeedbackBanner({ tone, message, onClose }) {
  const error = tone === "error";

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[1.3rem] border-[3px] p-4 ${
        error
          ? "border-red-300 bg-red-50 text-red-900"
          : "border-[#FFB38A] bg-[#FFF4EA] text-orange-900"
      }`}
    >
      {error ? <AlertTriangle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
      <p className="min-w-0 flex-1 text-sm font-bold leading-6">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss message"><X size={15} /></button>
    </div>
  );
}

function UsageCard({ card }) {
  const Icon = card.icon;
  const isNavy = card.tone === "navy";
  const isOrange = card.tone === "orange";

  const toneClass = isNavy
    ? "border-[#123865] bg-[#123865]"
    : isOrange
    ? "border-[#FFB38A] bg-[#FFF4EA]"
    : "border-[#C9D7E6] bg-white";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass}`}
      style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-[9px] font-black uppercase tracking-[0.1em]"
          style={{ color: isNavy ? "#F8FAFC" : "#475569" }}
        >
          {card.label}
        </p>

        <Icon
          className="h-5 w-5"
          style={{ color: isNavy ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-3 truncate text-xl font-black"
        style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
      >
        {card.value}
      </p>
    </div>
  );
}

function OperationalCard({ label, value, helper, tone = "cream" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} detail={helper} tone={toZaifanMetricTone(tone)} />;
}

function getCaseStateStyle(value = "Unknown") {
  const state = safeString(value, "Unknown").toLowerCase();

  if (state === "complete" || state === "clear" || state === "stable") {
    return {
      badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
      card: "border-emerald-300 bg-emerald-50/45",
    };
  }

  if (state === "blocked" || state === "critical" || state === "high risk") {
    return {
      badge: "border-red-300 bg-red-50 text-red-800",
      card: "border-red-300 bg-red-50/45",
    };
  }

  if (state === "attention") {
    return {
      badge: "border-orange-300 bg-orange-50 text-orange-800",
      card: "border-orange-300 bg-orange-50/45",
    };
  }

  if (state === "in progress") {
    return {
      badge: "border-sky-300 bg-sky-50 text-sky-800",
      card: "border-sky-300 bg-sky-50/45",
    };
  }

  return {
    badge: "border-slate-300 bg-slate-50 text-slate-700",
    card: "border-slate-300 bg-white",
  };
}

function getSystemIcon(system = "") {
  const key = safeString(system).toLowerCase();

  if (key.includes("univers")) return GraduationCap;
  if (key.includes("visa")) return ShieldAlert;
  if (key.includes("finance") || key.includes("payment")) return WalletCards;
  if (key.includes("support")) return HelpCircle;
  if (key.includes("communication")) return MessageCircle;
  if (key.includes("task") || key.includes("follow")) return Target;
  if (key.includes("portal")) return ShieldCheck;
  if (key.includes("document")) return Clipboard;
  return FileText;
}

function compactCaseText(value, maxLength = 52) {
  const text = safeString(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "Unknown";
  if (text.length <= maxLength) return text;

  const clipped = text.slice(0, Math.max(1, maxLength - 1));
  const lastSpace = clipped.lastIndexOf(" ");
  const safeClip = lastSpace >= Math.floor(maxLength * 0.65)
    ? clipped.slice(0, lastSpace)
    : clipped;

  return `${safeClip.trim()}…`;
}

function compactCaseHeadline(value) {
  const text = safeString(value, "Current student case briefing")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "Current student case briefing";
  if (text.length <= 68) return text;

  const colonIndex = text.indexOf(":");
  if (colonIndex >= 12 && colonIndex <= 64) {
    return text.slice(0, colonIndex).trim();
  }

  const sentence = text.split(/[.!?]/)[0]?.trim();
  if (sentence && sentence.length >= 12 && sentence.length <= 68) {
    return sentence;
  }

  return compactCaseText(text, 68);
}

function compactCaseStage(value) {
  const text = safeString(value).replace(/\s+/g, " ").trim();
  if (!text) return "Unknown";

  const firstClause = text
    .split(/[.;]/)[0]
    ?.split(/\s+[—–]\s+/)[0]
    ?.trim();

  if (firstClause && firstClause.length >= 4 && firstClause.length <= 46) {
    return firstClause;
  }

  return compactCaseText(text, 46);
}

function compactPortalState(value) {
  const text = safeString(value).replace(/\s+/g, " ").trim();
  const key = text.toLowerCase();

  if (!text) return "Unknown";
  if (
    key.includes("active") &&
    !key.includes("inactive") &&
    !key.includes("not active")
  ) {
    return "Active";
  }
  if (key.includes("inactive") || key.includes("deactivated")) return "Inactive";
  if (
    key.includes("no portal") ||
    key.includes("not created") ||
    key.includes("does not exist") ||
    key.includes("missing")
  ) {
    return "Not Created";
  }
  if (key.includes("locked")) return "Locked";

  return compactCaseText(text, 24);
}

function getLiveCaseSnapshot(data = {}, student = {}) {
  const snapshot = data?.studentSnapshot || {};

  const name =
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    snapshot.name ||
    "Unknown";

  const country =
    student?.country ||
    student?.country_interest ||
    student?.preferred_country ||
    "";

  const studyLevel =
    student?.study_level ||
    student?.level ||
    "";

  const program =
    student?.field_of_interest ||
    student?.course ||
    student?.program ||
    student?.study_field ||
    student?.consultation_type ||
    "";

  const liveRoute = [country, studyLevel, program]
    .map((item) => safeString(item).trim())
    .filter(Boolean)
    .join(" · ");

  const priority =
    student?.priority ||
    snapshot.priority ||
    "Unknown";

  return {
    name: compactCaseText(name, 34),
    route: compactCaseText(liveRoute || snapshot.route || "Unknown", 52),
    currentStage: compactCaseStage(snapshot.currentStage || "Unknown"),
    priority: compactCaseText(priority, 18),
    portalState: compactPortalState(snapshot.portalState),
  };
}

function normalizeCaseSourceLabel(value) {
  const raw = safeString(value).replace(/\s+/g, " ").trim();
  const key = raw.toLowerCase();

  if (!raw) return "Unknown";
  if (key.includes("application")) return "Applications";
  if (key.includes("visa")) return "Visa";
  if (
    key.includes("finance") ||
    key.includes("payment") ||
    key.includes("invoice") ||
    key.includes("receipt")
  ) {
    return "Finance";
  }
  if (key.includes("document")) return "Documents";
  if (key.includes("univers") || key.includes("requirement")) return "Universities";
  if (key.includes("support")) return "Support";
  if (
    key.includes("communication") ||
    key.includes("email") ||
    key.includes("whatsapp") ||
    key.includes("message")
  ) {
    return "Communications";
  }
  if (key.includes("task") || key.includes("follow")) return "Tasks & Follow-ups";
  if (key.includes("portal") || key.includes("account")) return "Portal";
  if (key.includes("timeline") || key.includes("event")) return "Timeline";
  if (
    key.includes("crm") ||
    key.includes("profile") ||
    key.includes("inquiry") ||
    key.includes("appointment")
  ) {
    return "CRM Profile";
  }

  return compactCaseText(raw, 24);
}

function getCaseSourceLabels(source) {
  const rawItems = Array.isArray(source)
    ? source
    : safeString(source)
        .split(/[|,;/]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  return Array.from(
    new Set(rawItems.map((item) => normalizeCaseSourceLabel(item)))
  ).slice(0, 4);
}

function CaseBriefRenderer({ data, student = {} }) {
  const healthStyle = getCaseStateStyle(data?.caseHealth);
  const snapshot = getLiveCaseSnapshot(data, student);
  const coverage = data?.dataCoverage || {};

  const coverageItems = [
    ["Documents", coverage.documents],
    ["Applications", coverage.applications],
    ["Universities", coverage.universities],
    ["Communications", coverage.communications],
    ["Tasks", coverage.tasks],
    ["Follow-ups", coverage.followUps],
    ["Visa", coverage.visaCases],
    ["Finance", coverage.financeRecords],
    ["Support", coverage.supportRequests],
    ["Timeline", coverage.timelineEvents],
  ];

  return (
    <div className="min-w-0 space-y-4">
      <section className="overflow-hidden rounded-[1.35rem] border-[3px] border-[#123865] bg-white shadow-[0_10px_24px_rgba(18,56,101,0.07)]">
        <div className="bg-[#123865] px-4 py-4 sm:px-5" style={{ color: "#FFFFFF" }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-200">
                Student 360 Operations Brief
              </p>
              <h4 className="mt-2 text-xl font-black leading-7 sm:text-2xl" style={{ color: "#FFFFFF" }}>
                {compactCaseHeadline(data.headline)}
              </h4>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6" style={{ color: "#E8EEF6" }}>
                {data.healthReason || "No health rationale supplied."}
              </p>
            </div>

            <span className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${healthStyle.badge}`}>
              {data.caseHealth || "Unknown"}
            </span>
          </div>
        </div>

        <div className="grid gap-2 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-3 sm:grid-cols-2 lg:grid-cols-5">
          <CaseBriefMini label="Student" value={snapshot.name || "Unknown"} />
          <CaseBriefMini label="Route" value={snapshot.route || "Unknown"} />
          <CaseBriefMini label="Current Stage" value={snapshot.currentStage || "Unknown"} />
          <CaseBriefMini label="Priority" value={snapshot.priority || "Unknown"} />
          <CaseBriefMini label="Portal" value={snapshot.portalState || "Unknown"} />
        </div>
      </section>

      <section className="rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">Evidence Coverage</p>
            <h4 className="text-base font-black text-[#10233F]">What the brief actually read</h4>
          </div>
          <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#51627A]">
            Student 360
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {coverageItems.map(([label, value]) => (
            <span
              key={label}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border-2 border-[#D5E0EA] bg-[#fffdf8] px-2.5 py-1.5"
            >
              <strong className="text-sm font-black text-[#10233F]">
                {Number(value) || 0}
              </strong>
              <span className="text-[8px] font-black uppercase tracking-[0.06em] text-[#65748B]">
                {label}
              </span>
            </span>
          ))}
        </div>
      </section>

      <section>
        <CaseSectionHeading eyebrow="Live Student OS" title="System Status" helper="Exact operational position by subsystem." />
        <div className="mt-3 grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
          {safeArray(data.systemStatus).map((item, index) => (
            <CaseSystemCard key={`${item.system || "system"}-${index}`} item={item} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <CaseListSection
          eyebrow="Needs Intervention"
          title="Critical Blockers"
          tone="danger"
          emptyText="No evidence-backed critical blocker was found."
          items={safeArray(data.criticalBlockers)}
          renderItem={(item, index) => (
            <div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.09em] text-red-700">
                    Problem
                  </p>
                  <p className="mt-0.5 font-black leading-5 text-[#10233F]">
                    {item.blocker || "Blocker"}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 grid gap-2">
                <CaseBriefFact
                  label="Evidence"
                  value={item.evidence || "No supporting evidence supplied."}
                  tone="neutral"
                />
                <CaseBriefFact
                  label="Required Action"
                  value={item.action || "Human review required."}
                  tone="danger"
                />
              </div>

              <CaseSource source={item.source} />
            </div>
          )}
        />

        <CaseListSection
          eyebrow="Do This Next"
          title="Next Actions"
          tone="action"
          emptyText="No next action was generated."
          items={safeArray(data.nextActions)}
          renderItem={(item, index) => (
            <div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#123865] text-[10px] font-black text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-black leading-5 text-[#10233F]">{item.action || "Action"}</p>
                  {item.reason ? (
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {item.reason}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <CasePill label="Owner" value={item.owner || "Counselor"} />
                <CasePill label="Timing" value={item.timing || "Next available"} />
              </div>
              <CaseSource source={item.source} />
            </div>
          )}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CaseListSection
          eyebrow="Do Not Repeat"
          title="Completed Work"
          tone="success"
          emptyText="No explicit completed work was found in the current case data."
          items={safeArray(data.completedWork)}
          renderItem={(item) => (
            <div>
              <p className="font-black text-[#10233F]">{item.item || "Completed item"}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.evidence}</p>
              <CaseSource source={item.source} />
            </div>
          )}
        />

        <CaseListSection
          eyebrow="What Changed"
          title="Recent Changes"
          tone="info"
          emptyText="No timestamped recent change was found."
          items={safeArray(data.recentChanges)}
          renderItem={(item) => (
            <div>
              <p className="font-black text-[#10233F]">{item.change || "Case update"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{item.when || "Timestamp unavailable"}</p>
              <CaseSource source={item.source} />
            </div>
          )}
        />
      </div>

      {safeArray(data.contradictions).length ? (
        <CaseListSection
          eyebrow="Data Quality Guard"
          title="Contradictions / Human Review"
          tone="warning"
          items={safeArray(data.contradictions)}
          renderItem={(item) => (
            <div>
              <p className="font-black text-[#10233F]">{item.issue || "Conflicting case data"}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <CaseEvidence label="Evidence A" value={item.evidenceA} />
                <CaseEvidence label="Evidence B" value={item.evidenceB} />
              </div>
              <CaseBriefFact
                label="Resolve"
                value={item.resolution || "Human review required."}
                tone="warning"
              />
            </div>
          )}
        />
      ) : null}

      <CaseListSection
        eyebrow="Still Unknown"
        title="Missing Facts That Matter"
        tone="neutral"
        emptyText="No decision-critical missing fact was identified."
        items={safeArray(data.missingFacts)}
        renderItem={(item) => (
          <div>
            <p className="font-black text-[#10233F]">{item.fact || "Missing fact"}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.whyNeeded}</p>
            <CaseBriefFact
              label="Collect"
              value={item.howToCollect || "Verify with the student / case record."}
              tone="info"
            />
          </div>
        )}
      />

      <section className="rounded-[1.25rem] border-[3px] border-[#123865] bg-[#123865] p-4 sm:p-5" style={{ color: "#FFFFFF" }}>
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-200">Counselor Handover</p>
        <h4 className="mt-1 text-lg font-black" style={{ color: "#FFFFFF" }}>Continue the case without re-reading the whole CRM</h4>
        <p className="mt-2.5 text-sm font-semibold leading-6" style={{ color: "#F8FAFC" }}>
          {data.handoverNote || "No handover note generated."}
        </p>
      </section>
    </div>
  );
}

function CaseBriefMini({ label, value }) {
  const displayValue = compactCaseText(value, 52);

  return (
    <div className="min-w-0 rounded-xl border-2 border-[#D5E0EA] bg-white px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-[#65748B]">{label}</p>
      <p
        className="mt-1 line-clamp-2 break-words text-xs font-black leading-4 text-[#10233F]"
        title={safeString(value)}
      >
        {displayValue}
      </p>
    </div>
  );
}

function CaseSystemCard({ item }) {
  const Icon = getSystemIcon(item?.system);
  const style = getCaseStateStyle(item?.state);

  return (
    <article className={`rounded-[1.05rem] border-[3px] p-3.5 ${style.card}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#65748B]">
              {item.system || "System"}
            </p>
            <p className="mt-0.5 line-clamp-2 font-black leading-5 text-[#10233F]" title={safeString(item.headline)}>
              {item.headline || "No operational headline"}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border-2 px-2 py-1 text-[8px] font-black uppercase tracking-[0.06em] ${style.badge}`}>
          {item.state || "Unknown"}
        </span>
      </div>

      <p
        className="mt-2.5 line-clamp-3 text-xs font-semibold leading-5 text-slate-600"
        title={safeString(item.detail)}
      >
        {item.detail || "No additional detail."}
      </p>

      <CaseSource source={item.source} />
    </article>
  );
}

function CaseSectionHeading({ eyebrow, title, helper }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#B84F0E]">{eyebrow}</p>
        <h4 className="mt-1 text-lg font-black text-[#10233F]">{title}</h4>
      </div>
      {helper ? <p className="text-xs font-semibold text-[#65748B]">{helper}</p> : null}
    </div>
  );
}

function CaseListSection({ eyebrow, title, items = [], renderItem, emptyText = "Nothing to show.", tone = "neutral" }) {
  const toneClass = {
    danger: "border-red-300 bg-red-50/45",
    action: "border-[#FFB38A] bg-[#FFF4EA]",
    success: "border-emerald-300 bg-emerald-50/40",
    info: "border-sky-300 bg-sky-50/40",
    warning: "border-orange-300 bg-orange-50/55",
    neutral: "border-[#C9D7E6] bg-white",
  }[tone] || "border-[#C9D7E6] bg-white";

  return (
    <section className={`rounded-[1.15rem] border-[3px] p-3.5 ${toneClass}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#B84F0E]">{eyebrow}</p>
      <h4 className="mt-1 text-lg font-black text-[#10233F]">{title}</h4>

      <div className="mt-2.5 space-y-2">
        {items.length ? items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-xl border-2 border-[#D5E0EA] bg-white p-3 shadow-[0_4px_12px_rgba(18,56,101,0.035)]">
            {renderItem(item, index)}
          </div>
        )) : (
          <div className="rounded-xl border-2 border-dashed border-[#D5E0EA] bg-white/75 px-3 py-4 text-center text-xs font-semibold text-slate-500">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

function CaseSource({ source }) {
  const labels = getCaseSourceLabels(source);

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
        Source
      </span>
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-md border border-[#D5E0EA] bg-[#FFF8EF] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.04em] text-[#65748B]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function CaseBriefFact({ label, value, tone = "neutral" }) {
  const toneClass = {
    danger: "border-red-200 bg-red-50 text-red-900",
    warning: "border-orange-200 bg-orange-50 text-orange-900",
    info: "border-sky-200 bg-sky-50 text-[#123865]",
    neutral: "border-[#D5E0EA] bg-[#fffdf8] text-[#10233F]",
  }[tone] || "border-[#D5E0EA] bg-[#fffdf8] text-[#10233F]";

  return (
    <div className={`rounded-xl border-2 px-3 py-2.5 ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.08em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5">
        {value || "Not available"}
      </p>
    </div>
  );
}

function CasePill({ label, value }) {
  return (
    <span className="rounded-lg border-2 border-[#D5E0EA] bg-white px-2.5 py-1.5 text-[9px] font-black text-[#51627A]">
      {label}: <span className="text-[#10233F]">{value}</span>
    </span>
  );
}

function CaseEvidence({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-orange-200 bg-white px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-orange-700">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{value || "Not available"}</p>
    </div>
  );
}

function ContextPanel({ title, eyebrow, rows = [], highlighted = false }) {
  return (
    <div className={`rounded-[1.4rem] border-[3px] p-4 ${
      highlighted ? "border-[#FFB38A] bg-[#FFF4EA]" : "border-[#C9D7E6] bg-[#fffdf8]"
    }`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FFB38A] bg-white text-[#B84F0E]">
          {highlighted ? <Zap size={17} /> : <FileText size={17} />}
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">{eyebrow}</p>
          <h3 className="text-base font-black text-[#10233F]">{title}</h3>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.08em] text-[#65748B]">{label}</p>
            <p className="mt-1 truncate text-xs font-black text-[#10233F]" title={safeString(value)}>
              {valueOrFallback(value, "-")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ history = [] }) {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">Session Memory</p>
          <h3 className="text-lg font-black text-[#10233F]">Generation History</h3>
        </div>
        <span className="rounded-full border-2 border-[#C9D7E6] bg-[#fffdf8] px-3 py-1 text-xs font-black text-[#51627A]">{history.length}</span>
      </div>

      {history.length ? (
        <div className="min-w-0 space-y-3">
          {history.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-xl border-2 border-[#C9D7E6] bg-[#fffdf8] p-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#10233F]">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-[#65748B]">{item.generatedAt} • {item.category}</p>
                </div>
                <span className="rounded-full border-2 border-[#FFB38A] bg-[#FFF4EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#9B3E08]">GPT</span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-[#51627A]">{item.preview}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel text="No GPT generations yet in this session." />
      )}
    </div>
  );
}

function SavedOutputsPanel({
  savedOutputs = [],
  loading = false,
  onOpen = () => {},
  onCopy = () => {},
  onDelete = () => {},
  onImportClipboard = () => {},
}) {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.04)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
            Permanent GPT Vault
          </p>
          <h3 className="text-lg font-black text-[#10233F]">
            Saved Student Outputs
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#65748B]">
            Reopen previous paid generations without calling GPT again.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void onImportClipboard()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-[10px] font-black text-[#10233F] transition hover:-translate-y-0.5 hover:border-[#FFB38A] hover:bg-[#FFF4EA]"
            title="Use this once to rescue an output you copied before installing permanent storage."
          >
            <Upload size={12} />
            Import Clipboard Backup
          </button>

          <span className="rounded-full border-2 border-[#FFB38A] bg-[#FFF4EA] px-3 py-1 text-xs font-black text-[#9B3E08]">
            {loading ? "…" : savedOutputs.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[150px] items-center justify-center rounded-xl border-[3px] border-dashed border-[#C9D7E6] bg-[#fffdf8]">
          <RefreshCw className="h-6 w-6 animate-spin text-[#D94B00]" />
        </div>
      ) : savedOutputs.length ? (
        <div className="min-w-0 space-y-3">
          {savedOutputs.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border-2 border-[#C9D7E6] bg-[#fffdf8] p-4"
            >
              <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[#10233F]">{item.label}</p>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-emerald-700">
                      Permanent
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#65748B]">
                    Saved: {item.savedAt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102F56] hover:shadow-md"
                  >
                    <FolderOpen size={12} />
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() => void onCopy(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-1.5 text-[10px] font-black text-[#10233F] transition hover:-translate-y-0.5 hover:border-[#FFB38A] hover:bg-[#FFF4EA]"
                  >
                    <Copy size={12} />
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDelete(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-700 transition hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-[#51627A]">
                {item.preview || getOutputPreview(item.output, item.mode)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel text="No permanent GPT outputs saved for this student yet." />
      )}
    </div>
  );
}

function EmptyPanel({ text }) {
  return (
    <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border-[3px] border-dashed border-[#C9D7E6] bg-[#fffdf8] p-5 text-center">
      <CheckCircle2 className="h-9 w-9 text-[#D94B00]" />
      <p className="mt-3 text-sm font-semibold text-[#65748B]">{text}</p>
    </div>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (
    value.includes("blue") ||
    value.includes("cyan") ||
    value.includes("teal") ||
    value.includes("info")
  ) return "blue";
  if (
    value.includes("slate") ||
    value.includes("gray") ||
    value.includes("grey") ||
    value.includes("muted") ||
    value.includes("neutral") ||
    value.includes("default")
  ) return "slate";

  return "navy";
}

export default GPTCopilotPanel;
