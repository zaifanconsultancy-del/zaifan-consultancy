// zaifan-gpt-copilot CASE BRAIN V5.2 — OUTPUT-FIRST STRUCTURED CASE BRIEF
// - Case Brief gets enough token budget for reasoning + strict structured visible output
// - empty/incomplete HTTP-200 responses trigger one output-first retry instead of fake success
// - no visible output now returns a diagnostic error with status/token details
// zaifan-gpt-copilot STUDENT CASE BRAIN V4 — full Student 360 + evidence-only document drafting
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type GptMode =
  | "summary"
  | "whatsapp"
  | "email"
  | "next_action"
  | "visa_risk"
  | "call_script"
  | "followup_plan"
  | "scholarship"
  | "objection_analysis"
  | "counselor_strategy"
  | "case_brief"
  | "gap_audit"
  | "sop_draft"
  | "cv_draft"
  | "lead_reanalysis"
  | string;

type StudentRecord = Record<string, unknown>;
type CrmContext = Record<string, unknown>;

type PromptInput = {
  mode: GptMode;
  modeLabel?: string;
  student: StudentRecord;
  studentType: string;
  adminName: string;
  crmContext: CrmContext;
};

const MODE_CONFIG: Record<
  string,
  {
    label: string;
    category: "analysis" | "communication" | "strategy" | "risk";
    maxOutputTokens: number;
    reasoningEffort: "none" | "low" | "medium" | "high";
  }
> = {
  summary: {
    label: "Smart Summary",
    category: "analysis",
    maxOutputTokens: 1400,
    reasoningEffort: "low",
  },
  whatsapp: {
    label: "WhatsApp Generator",
    category: "communication",
    maxOutputTokens: 700,
    reasoningEffort: "none",
  },
  email: {
    label: "Email Generator",
    category: "communication",
    maxOutputTokens: 1000,
    reasoningEffort: "none",
  },
  next_action: {
    label: "Next Action",
    category: "strategy",
    maxOutputTokens: 1200,
    reasoningEffort: "low",
  },
  visa_risk: {
    label: "Visa Risk",
    category: "risk",
    maxOutputTokens: 1400,
    reasoningEffort: "medium",
  },
  call_script: {
    label: "Call Script",
    category: "communication",
    maxOutputTokens: 1300,
    reasoningEffort: "low",
  },
  followup_plan: {
    label: "7-Day Follow-Up Plan",
    category: "strategy",
    maxOutputTokens: 1400,
    reasoningEffort: "low",
  },
  scholarship: {
    label: "Scholarship Analysis",
    category: "analysis",
    maxOutputTokens: 1200,
    reasoningEffort: "low",
  },
  objection_analysis: {
    label: "Objection Analysis",
    category: "risk",
    maxOutputTokens: 1200,
    reasoningEffort: "medium",
  },
  counselor_strategy: {
    label: "Counselor Strategy",
    category: "strategy",
    maxOutputTokens: 1400,
    reasoningEffort: "medium",
  },
  case_brief: {
    label: "Student 360 Case Brief",
    category: "strategy",
    // Responses API max_output_tokens includes reasoning + visible output.
    // Leave enough room for the strict Student 360 JSON schema to actually render.
    maxOutputTokens: 6500,
    reasoningEffort: "medium",
  },

  gap_audit: {
    label: "Student 360 Gap Audit",
    category: "risk",
    maxOutputTokens: 1800,
    reasoningEffort: "medium",
  },

  sop_draft: {
    label: "Evidence-Only SOP Draft",
    category: "analysis",
    maxOutputTokens: 2800,
    reasoningEffort: "high",
  },

  cv_draft: {
    label: "Evidence-Only CV Draft",
    category: "analysis",
    maxOutputTokens: 2400,
    reasoningEffort: "medium",
  },

  lead_reanalysis: {
    label: "Fast Lead Reanalysis",
    category: "analysis",
    maxOutputTokens: 650,
    reasoningEffort: "none",
  },
};

const CASE_BRIEF_TEXT_FORMAT = {
  type: "json_schema",
  name: "zaifan_student_360_case_brief",
  description:
    "Evidence-grounded Student 360 operational case brief for a Zaifan counselor.",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: { type: "string" },
      caseHealth: {
        type: "string",
        enum: [
          "Clear",
          "Stable",
          "Attention",
          "High Risk",
          "Critical",
          "Insufficient Data"
        ]
      },
      healthReason: { type: "string" },
      studentSnapshot: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          route: { type: "string" },
          currentStage: { type: "string" },
          priority: { type: "string" },
          portalState: { type: "string" }
        },
        required: ["name", "route", "currentStage", "priority", "portalState"]
      },
      dataCoverage: {
        type: "object",
        additionalProperties: false,
        properties: {
          documents: { type: "number" },
          applications: { type: "number" },
          universities: { type: "number" },
          communications: { type: "number" },
          tasks: { type: "number" },
          followUps: { type: "number" },
          visaCases: { type: "number" },
          financeRecords: { type: "number" },
          supportRequests: { type: "number" },
          timelineEvents: { type: "number" }
        },
        required: [
          "documents",
          "applications",
          "universities",
          "communications",
          "tasks",
          "followUps",
          "visaCases",
          "financeRecords",
          "supportRequests",
          "timelineEvents"
        ]
      },
      systemStatus: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            system: { type: "string" },
            state: {
              type: "string",
              enum: [
                "Complete",
                "In Progress",
                "Attention",
                "Blocked",
                "Not Started",
                "Unknown"
              ]
            },
            headline: { type: "string" },
            detail: { type: "string" },
            source: { type: "string" }
          },
          required: ["system", "state", "headline", "detail", "source"]
        }
      },
      criticalBlockers: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            priority: { type: "number" },
            blocker: { type: "string" },
            evidence: { type: "string" },
            whyItMatters: { type: "string" },
            action: { type: "string" },
            source: { type: "string" }
          },
          required: ["priority", "blocker", "evidence", "whyItMatters", "action", "source"]
        }
      },
      completedWork: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            item: { type: "string" },
            evidence: { type: "string" },
            source: { type: "string" }
          },
          required: ["item", "evidence", "source"]
        }
      },
      recentChanges: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            change: { type: "string" },
            when: { type: "string" },
            source: { type: "string" }
          },
          required: ["change", "when", "source"]
        }
      },
      contradictions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            issue: { type: "string" },
            evidenceA: { type: "string" },
            evidenceB: { type: "string" },
            resolution: { type: "string" }
          },
          required: ["issue", "evidenceA", "evidenceB", "resolution"]
        }
      },
      nextActions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            priority: { type: "number" },
            action: { type: "string" },
            owner: { type: "string" },
            timing: { type: "string" },
            reason: { type: "string" },
            source: { type: "string" }
          },
          required: ["priority", "action", "owner", "timing", "reason", "source"]
        }
      },
      missingFacts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            fact: { type: "string" },
            whyNeeded: { type: "string" },
            howToCollect: { type: "string" }
          },
          required: ["fact", "whyNeeded", "howToCollect"]
        }
      },
      handoverNote: { type: "string" }
    },
    required: [
      "headline",
      "caseHealth",
      "healthReason",
      "studentSnapshot",
      "dataCoverage",
      "systemStatus",
      "criticalBlockers",
      "completedWork",
      "recentChanges",
      "contradictions",
      "nextActions",
      "missingFacts",
      "handoverNote"
    ]
  }
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    // Optional tier overrides let production change models without another deploy.
    // The old global OPENAI_MODEL secret is intentionally ignored by this router.
    const OPENAI_MODEL_LUNA =
      Deno.env.get("OPENAI_MODEL_LUNA") || "gpt-5.6-luna";
    const OPENAI_MODEL_TERRA =
      Deno.env.get("OPENAI_MODEL_TERRA") || "gpt-5.6-terra";
    const OPENAI_MODEL_SOL =
      Deno.env.get("OPENAI_MODEL_SOL") || "gpt-5.6-sol";

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const body = await req.json();

    const {
      mode = "summary",
      modeLabel = "",
      student = {},
      studentType = "inquiry",
      adminName = "Zaifan Consultancy Team",
      crmContext = {},
    } = body || {};

    const selectedMode = MODE_CONFIG[mode] || MODE_CONFIG.summary;

    const selectedModel = selectModelForMode(mode, {
      luna: OPENAI_MODEL_LUNA,
      terra: OPENAI_MODEL_TERRA,
      sol: OPENAI_MODEL_SOL,
    });

    const promptInput: PromptInput = {
      mode,
      modeLabel: modeLabel || selectedMode.label,
      student: sanitizeObject(student),
      studentType: safeString(studentType, "inquiry"),
      adminName: safeString(adminName, "Zaifan Consultancy Team"),
      crmContext: sanitizeObject(crmContext),
    };

    const prompt = buildPrompt(promptInput);

    const openAIRequest: Record<string, unknown> = {
      model: selectedModel,
      input: prompt,
      store: false,
      reasoning: {
        effort: selectedMode.reasoningEffort,
      },
      max_output_tokens: selectedMode.maxOutputTokens,
    };

    if (mode === "case_brief") {
      openAIRequest.text = {
        format: CASE_BRIEF_TEXT_FORMAT,
        verbosity: "medium",
      };
    }

    let result: Record<string, unknown>;
    let modelUsed = selectedModel;
    let transportFallback = false;

    try {
      result = await callOpenAIResponses({
        apiKey: OPENAI_API_KEY,
        requestBody: openAIRequest,
        attemptLabel: `${selectedModel} primary`,
      });
    } catch (firstError) {
      const retryable = isRetryableOpenAIError(firstError);

      if (!retryable) {
        throw firstError;
      }

      console.warn(
        "OpenAI primary request had a transient transport/upstream failure. Retrying once.",
        getErrorText(firstError)
      );

      await sleep(650);

      try {
        result = await callOpenAIResponses({
          apiKey: OPENAI_API_KEY,
          requestBody: openAIRequest,
          attemptLabel: `${selectedModel} retry`,
        });
      } catch (secondError) {
        const secondRetryable = isRetryableOpenAIError(secondError);

        // Case Brief is high-value, so if Sol has a transient transport/gateway
        // failure twice, preserve Structured Outputs and retry once on Terra.
        // Do NOT fall back for genuine 4xx/configuration/schema errors.
        if (
          mode === "case_brief" &&
          secondRetryable &&
          selectedModel !== OPENAI_MODEL_TERRA
        ) {
          console.warn(
            "Case Brief Sol transport failed twice. Falling back to Terra with the same structured-output contract.",
            getErrorText(secondError)
          );

          const terraRequest = {
            ...openAIRequest,
            model: OPENAI_MODEL_TERRA,
            reasoning: {
              effort: "medium",
            },
          };

          result = await callOpenAIResponses({
            apiKey: OPENAI_API_KEY,
            requestBody: terraRequest,
            attemptLabel: `${OPENAI_MODEL_TERRA} fallback`,
          });

          modelUsed = OPENAI_MODEL_TERRA;
          transportFallback = true;
        } else {
          throw secondError;
        }
      }
    }

    let generatedText = extractResponseText(result);
    let contentRetry = false;

    // A Responses request can be HTTP 200 yet still be incomplete, especially
    // when max_output_tokens is exhausted by reasoning before visible output is
    // produced. Never report that as a successful empty generation.
    if (!generatedText && mode === "case_brief") {
      const responseStatus = safeString(result?.status);
      const incompleteDetails = sanitizeObject(result?.incomplete_details);
      const incompleteReason = safeString(incompleteDetails?.reason);

      const shouldRetryContent =
        responseStatus === "incomplete" ||
        incompleteReason === "max_output_tokens" ||
        Array.isArray(result?.output);

      if (shouldRetryContent) {
        console.warn("Case Brief returned no visible output. Retrying with output-first settings.", {
          responseStatus,
          incompleteReason,
          usage: result?.usage || null,
        });

        const outputFirstRequest = {
          ...openAIRequest,
          model: modelUsed,
          reasoning: {
            effort: "low",
          },
          max_output_tokens: 8000,
          text: {
            format: CASE_BRIEF_TEXT_FORMAT,
            verbosity: "low",
          },
        };

        result = await callOpenAIResponses({
          apiKey: OPENAI_API_KEY,
          requestBody: outputFirstRequest,
          attemptLabel: `${modelUsed} case-brief output retry`,
        });

        generatedText = extractResponseText(result);
        contentRetry = true;
      }
    }

    if (!generatedText) {
      const responseStatus = safeString(result?.status, "unknown");
      const incompleteDetails = sanitizeObject(result?.incomplete_details);
      const incompleteReason = safeString(incompleteDetails?.reason, "none");
      const usage = sanitizeObject(result?.usage);
      const outputDetails = sanitizeObject(usage?.output_tokens_details);
      const reasoningTokens = safeString(outputDetails?.reasoning_tokens, "unknown");
      const outputTokens = safeString(usage?.output_tokens, "unknown");

      throw new Error(
        `OpenAI returned no visible Case Brief output. Response status: ${responseStatus}. ` +
          `Incomplete reason: ${incompleteReason}. Output tokens: ${outputTokens}. ` +
          `Reasoning tokens: ${reasoningTokens}.`
      );
    }

    const durationMs = Date.now() - startedAt;

    return jsonResponse({
      success: true,
      mode,
      modeLabel: selectedMode.label,
      category: selectedMode.category,
      model: modelUsed,
      requestedModel: selectedModel,
      transportFallback,
      contentRetry,
      reasoningEffort:
        contentRetry
          ? "low"
          : transportFallback && mode === "case_brief"
            ? "medium"
            : selectedMode.reasoningEffort,
      durationMs,
      text: generatedText,
      usage: result?.usage || null,
    });
  } catch (error) {
    console.error("GPT Copilot Error:", error);

    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "AI generation failed.",
      },
      500
    );
  }
});

function selectModelForMode(
  mode: GptMode,
  models: {
    luna: string;
    terra: string;
    sol: string;
  }
) {
  // Cheapest tier: high-volume or mostly templated work.
  const lunaModes = new Set([
    "lead_reanalysis",
    "whatsapp",
    "email",
  ]);

  // Balanced tier: everyday counselor intelligence.
  const terraModes = new Set([
    "summary",
    "next_action",
    "call_script",
    "followup_plan",
    "scholarship",
    "cv_draft",
  ]);

  // Frontier tier: reserve the expensive model for higher-stakes reasoning.
  const solModes = new Set([
    "visa_risk",
    "objection_analysis",
    "counselor_strategy",
    "case_brief",
    "gap_audit",
    "sop_draft",
  ]);

  if (solModes.has(mode)) return models.sol;
  if (terraModes.has(mode)) return models.terra;
  if (lunaModes.has(mode)) return models.luna;

  // Unknown/new modes default to Terra rather than Sol to avoid surprise cost.
  // A legacy OPENAI_MODEL secret is intentionally NOT allowed to override
  // routing, because that would silently put every request on one model.
  return models.terra;
}

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}


type OpenAITransportError = Error & {
  status?: number;
  retryable?: boolean;
  responsePreview?: string;
  attemptLabel?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorText(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error || "Unknown OpenAI error");
}

function isRetryableOpenAIError(error: unknown) {
  const candidate = error as OpenAITransportError | null;

  if (!candidate) return false;

  return candidate.retryable === true;
}

function cleanResponsePreview(value: string, maxLength = 320) {
  const compact = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) return "";

  return compact.length > maxLength
    ? `${compact.slice(0, maxLength)}…`
    : compact;
}

async function callOpenAIResponses({
  apiKey,
  requestBody,
  attemptLabel,
}: {
  apiKey: string;
  requestBody: Record<string, unknown>;
  attemptLabel: string;
}) {
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (networkError) {
    const error = new Error(
      `${attemptLabel}: OpenAI network request failed: ${getErrorText(networkError)}`
    ) as OpenAITransportError;

    error.retryable = true;
    error.attemptLabel = attemptLabel;
    throw error;
  }

  let rawBody = "";

  try {
    rawBody = await response.text();
  } catch (bodyError) {
    const error = new Error(
      `${attemptLabel}: OpenAI response body could not be read (HTTP ${response.status}): ${getErrorText(bodyError)}`
    ) as OpenAITransportError;

    error.status = response.status;
    error.retryable =
      response.status >= 500 ||
      response.status === 408 ||
      response.status === 409 ||
      response.status === 429;
    error.attemptLabel = attemptLabel;
    throw error;
  }

  let parsed: Record<string, unknown> | null = null;

  if (rawBody.trim()) {
    try {
      const value = JSON.parse(rawBody);

      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed = value as Record<string, unknown>;
      }
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const apiError = parsed?.error;
    const apiErrorRecord =
      apiError && typeof apiError === "object" && !Array.isArray(apiError)
        ? (apiError as Record<string, unknown>)
        : null;

    const apiMessage =
      typeof apiErrorRecord?.message === "string"
        ? apiErrorRecord.message
        : typeof parsed?.message === "string"
          ? parsed.message
          : "";

    const preview = cleanResponsePreview(rawBody);

    const looksHtml =
      /^\s*<!doctype html/i.test(rawBody) ||
      /^\s*<html/i.test(rawBody);

    const error = new Error(
      apiMessage ||
        (
          looksHtml
            ? `${attemptLabel}: OpenAI upstream returned an HTML gateway response (HTTP ${response.status}).`
            : `${attemptLabel}: OpenAI request failed with HTTP ${response.status}${preview ? `: ${preview}` : ""}`
        )
    ) as OpenAITransportError;

    error.status = response.status;
    error.retryable =
      response.status >= 500 ||
      response.status === 408 ||
      response.status === 409 ||
      response.status === 429 ||
      (looksHtml && response.status >= 500);
    error.responsePreview = preview;
    error.attemptLabel = attemptLabel;

    console.error("OpenAI request failed:", {
      attemptLabel,
      status: response.status,
      contentType: response.headers.get("content-type"),
      parsed: Boolean(parsed),
      looksHtml,
      preview,
    });

    throw error;
  }

  if (!parsed) {
    const preview = cleanResponsePreview(rawBody);
    const looksHtml =
      /^\s*<!doctype html/i.test(rawBody) ||
      /^\s*<html/i.test(rawBody);

    const error = new Error(
      looksHtml
        ? `${attemptLabel}: OpenAI returned HTML instead of JSON despite HTTP ${response.status}.`
        : `${attemptLabel}: OpenAI returned a non-JSON response despite HTTP ${response.status}${preview ? `: ${preview}` : ""}`
    ) as OpenAITransportError;

    error.status = response.status;
    error.retryable = true;
    error.responsePreview = preview;
    error.attemptLabel = attemptLabel;

    throw error;
  }

  return parsed;
}

function safeString(value: unknown, fallback = "Not provided") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function sanitizeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function sanitizeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractResponseText(result: Record<string, unknown>) {
  const outputText = result.output_text;

  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const output = result.output;

  if (Array.isArray(output)) {
    const textParts: string[] = [];

    output.forEach((item) => {
      const record = item as Record<string, unknown>;
      const content = record.content;

      if (Array.isArray(content)) {
        content.forEach((contentItem) => {
          const contentRecord = contentItem as Record<string, unknown>;
          const text = contentRecord.text;

          if (typeof text === "string" && text.trim()) {
            textParts.push(text.trim());
          }
        });
      }
    });

    if (textParts.length) return textParts.join("\n\n");
  }

  return "";
}

function buildPrompt({
  mode,
  modeLabel,
  student,
  studentType,
  adminName,
  crmContext,
}: PromptInput) {
  const selectedMode = MODE_CONFIG[mode] || MODE_CONFIG.summary;

  const studentData = buildStudentData({ student, studentType, adminName });
  const contextData = buildContextData(crmContext);
  const localAiData = buildLocalAiData(crmContext);
  const operationalData = buildOperationalData(crmContext);

  const taskInstruction = getModeInstruction({
    mode,
    modeLabel: modeLabel || selectedMode.label,
    adminName,
  });

  return `
${buildBaseRules(mode)}

GPT Mode:
- Mode ID: ${safeString(mode)}
- Mode Label: ${safeString(modeLabel || selectedMode.label)}
- Mode Category: ${selectedMode.category}

AI Task:
${taskInstruction}

Student CRM Data:
${studentData}

Local CRM AI Signals:
${localAiData}

Operational CRM Context:
${operationalData}

Additional CRM Context:
${contextData}

Final Quality Rules:
- Make the answer useful to a real counselor today.
- Do not write generic content that could apply to any student.
- Use the student's name, country, program, stage, priority, and AI signals when available.
- If data is missing, clearly say what is missing and how to collect it.
- Avoid fake certainty.
- Avoid overpromising.
- Make output clean enough to paste into CRM notes or counselor communication.
`.trim();
}

function buildBaseRules(mode: GptMode) {
  if (mode === "lead_reanalysis") {
    return `
You are Zaifan GPT Lead Reanalysis Engine.

You are running a fast, low-cost CRM intelligence update.
Your job is to return structured JSON only.

Rules:
- Use only the available CRM data.
- Do not invent grades, IELTS, budget, intake, documents, universities, scholarships, or visa outcomes.
- Do not guarantee admission, scholarship, or visa approval.
- Be practical and conservative.
- Return valid JSON only.
- Do not wrap JSON in markdown.
- Do not add commentary before or after JSON.
`;
  }

  if (mode === "case_brief") {
    return `
You are Zaifan Student Case Operating Intelligence.

Your job is to reconstruct the CURRENT operational state of one student from the supplied Student 360 Case Brain.
This is not a lead-analysis exercise and not a marketing summary.

Hard rules:
- Treat CRM records as evidence. Do not replace exact records with generic counseling language.
- Prefer exact names, statuses, counts, amounts, dates and workflow stages whenever present.
- Never say vague phrases such as "payment activity exists", "documents are present", "there are some requirements", or "the student appears engaged" when the actual records let you say exactly what happened.
- Do not spend output repeating obvious profile facts unless they affect a decision.
- Do not calculate or invent conversion probability, intent level, psychology, scholarship chance, visa chance or admission chance.
- Do not invent missing academic, financial, document, visa, university or communication facts.
- If a subsystem has no usable evidence, mark it Unknown or Not Started.
- Distinguish a true operational blocker from merely missing CRM information.
- Internal notes are staff context; do not treat them as student-facing communication.
- Draft/failed/cancelled communications are not proof of student contact.
- Payment requests are workflow requests, not confirmed money received.
- Use confirmed payments/receipts/invoices to discuss finance; do not merge them into one vague "payment activity" statement.
- A completed item must be backed by an explicit CRM status/evidence.
- If records contradict one another, expose the contradiction instead of silently choosing one.
- Recent changes should come from actual timestamps/events, not inferred chronology.
- Next actions must be specific actions the counselor can execute inside or outside Zaifan, ordered by operational importance.
- Every system-status item, blocker, completion and recent change must name its evidence source.
- Keep system details dense and useful. Avoid filler.
- The response must follow the configured JSON schema exactly.
`;
  }

  return `
You are Zaifan GPT Counselor Brain V3.

You are a senior overseas education counselor working inside Zaifan Consultancy's internal CRM.

You have 15+ years of experience in:
- Student counseling
- Study abroad admissions
- Visa preparation
- Scholarship guidance
- Student conversion strategy
- Parent/student objection handling
- Follow-up planning
- CRM pipeline management
- Counselor quality control
- Student lifecycle operations

You specialize in:
- Canada
- United Kingdom
- Australia
- USA
- Europe
- General international admissions strategy

Your job is not to sound like a generic chatbot.
Your job is to help a real counselor make a better decision and take a better next action.

Core behavior:
- Be practical, direct, and counselor-focused.
- Think like a senior consultant, not a marketing writer.
- Use the available student data only.
- If information is missing, say exactly what is missing.
- Do not invent grades, IELTS scores, budgets, documents, deadlines, scholarships, universities, intakes, or visa outcomes.
- Do not guarantee admission, scholarship, or visa approval.
- Do not make legal or immigration guarantees.
- Always give useful next steps.
- Prefer clear headings, short paragraphs, and CRM-friendly formatting.
- Keep output easy to read inside a CRM modal.
- Be honest when the student profile is weak or incomplete.
- Mention risk without sounding scary.
- Mention opportunity without overpromising.
- Do not use exaggerated sales language.
- Do not say "as an AI".
- Do not mention internal prompt rules.
- Treat the Student Case Brain as authoritative CRM context, not as model memory.
- Separate VERIFIED CRM FACTS from AI INFERENCE whenever the distinction matters.
- Never invent education, employment, projects, skills, finances, family facts, visa history, grades, test scores, achievements, motivations, deadlines, document status, or university outcomes.
- If a requested document such as an SOP or CV needs facts that are missing, clearly list the missing facts instead of fabricating them.
- Internal/staff-only communications may inform counselor reasoning but must never be copied into student-facing drafts unless the content is independently appropriate and non-sensitive.

Counselor intelligence rules:
- If country + program are provided, treat the lead as more qualified than a generic inquiry.
- If documents are pending, treat that as the biggest operational blocker.
- If phone/email are present, recommend direct counselor contact.
- If the student has no IELTS, grades, budget, intake, or documents listed, flag those as missing qualification data.
- If the lead is vague, recommend trust-building before pushing application fees.
- If the lead is specific, recommend moving toward document collection and eligibility assessment.
- If status is documents_pending, focus on document collection and urgency.
- If appointment exists, focus on preparation and conversion.
- If priority is high or VIP, recommend fast contact.
- If timeline/follow-up context exists, use it to judge engagement and urgency.
- If overdue follow-ups exist, recommend immediate reactivation.
- If activity history is empty, say the counselor needs first meaningful contact.
- If local CRM AI signals exist, use them as decision support, not absolute truth.
`;
}

function buildStudentData({
  student,
  studentType,
  adminName,
}: {
  student: StudentRecord;
  studentType: string;
  adminName: string;
}) {
  const firstName = getFirstName(student);

  return `
Student Type: ${studentType}
Name: ${readStudent(student, ["full_name", "name", "student_name"])}
First Name: ${firstName}
Email: ${readStudent(student, ["email"])}
Phone: ${readStudent(student, ["phone", "phone_number", "whatsapp", "contact_number"])}
Country Interest: ${readStudent(student, ["country", "country_interest", "preferred_country"])}
Field / Program: ${readStudent(student, ["field_of_interest", "course", "program", "study_field", "consultation_type"])}
Study Level: ${readStudent(student, ["study_level", "level"])}
Status: ${readStudent(student, ["status", "appointment_stage", "pipeline_stage", "stage"])}
Priority: ${readStudent(student, ["priority"])}
Appointment Date: ${readStudent(student, ["appointment_date", "date", "preferred_date"])}
Appointment Time: ${readStudent(student, ["appointment_time", "time", "time_slot"])}
Budget: ${readStudent(student, ["budget", "budget_range"])}
IELTS / English Score: ${readStudent(student, ["ielts_score", "english_score", "pte_score", "duolingo_score"])}
Academic Score: ${readStudent(student, ["academic_score", "marks", "cgpa", "percentage"])}
Intake: ${readStudent(student, ["intake", "preferred_intake"])}
Message / Notes: ${readStudent(student, ["message", "notes", "consultation_notes"])}
Created At: ${readStudent(student, ["created_at"])}
Assigned Counselor: ${readStudent(student, ["assigned_admin_name", "assigned_to_name", "assigned_to", "assigned_admin_email"], adminName)}
`;
}

function buildLocalAiData(crmContext: CrmContext) {
  const extraContext = sanitizeObject(crmContext.extraContext);

  return `
Lead Score: ${safeString(crmContext.leadScore)}
Lead Health: ${safeString(crmContext.leadHealth)}
Overdue Status: ${safeString(crmContext.overdueStatus)}
Last Activity: ${safeString(crmContext.lastActivity)}
AI Score: ${safeString(extraContext.ai_score)}
AI Tier: ${safeString(extraContext.ai_tier)}
AI Urgency: ${safeString(extraContext.ai_urgency)}
AI Conversion Probability: ${safeString(extraContext.ai_conversion_probability)}
AI Recommended Action: ${safeString(extraContext.ai_recommended_action)}
AI Intent Score: ${safeString(extraContext.ai_intent_score)}
AI Intent Level: ${safeString(extraContext.ai_intent_level)}
AI Risk Score: ${safeString(extraContext.ai_risk_score)}
AI Risk Level: ${safeString(extraContext.ai_risk_level)}
AI Data Completeness Score: ${safeString(extraContext.ai_data_completeness_score)}
AI Visa Readiness Score: ${safeString(extraContext.ai_visa_readiness_score)}
Missing Items: ${summarizeSimpleList(extraContext.missing_items)}
Risk Signals: ${summarizeSimpleList(extraContext.risk_signals)}
Opportunity Signals: ${summarizeSimpleList(extraContext.opportunity_signals)}
`;
}

function buildOperationalData(crmContext: CrmContext) {
  const caseBrain = sanitizeObject(crmContext.caseBrain);
  const dataSummary = sanitizeObject(caseBrain.dataSummary || crmContext.dataSummary);

  const sections = {
    timeline: sanitizeArray(crmContext.timeline),
    followUps: sanitizeArray(crmContext.followUps),
    appointments: sanitizeArray(crmContext.appointments),
    reminders: sanitizeArray(crmContext.reminders),
    activityLogs: sanitizeArray(crmContext.activityLogs),
    documents: sanitizeArray(crmContext.documents),
    documentRequirements: sanitizeArray(crmContext.documentRequirements),
    applications: sanitizeArray(crmContext.applications),
    applicationRequirements: sanitizeArray(crmContext.applicationRequirements),
    applicationEvents: sanitizeArray(crmContext.applicationEvents),
    universities: sanitizeArray(crmContext.universities),
    universityRequirements: sanitizeArray(crmContext.universityRequirements),
    universityEvents: sanitizeArray(crmContext.universityEvents),
    tasks: sanitizeArray(crmContext.tasks),
    communications: sanitizeArray(crmContext.communications),
    invoices: sanitizeArray(crmContext.invoices),
    payments: sanitizeArray(crmContext.payments),
    receipts: sanitizeArray(crmContext.receipts),
    paymentRequests: sanitizeArray(crmContext.paymentRequests),
    supportRequests: sanitizeArray(crmContext.supportRequests),
    supportMessages: sanitizeArray(crmContext.supportMessages),
    visaCases: sanitizeArray(crmContext.visaCases),
    visaRequirements: sanitizeArray(crmContext.visaRequirements),
    visaEvents: sanitizeArray(crmContext.visaEvents),
  };

  return `
Student 360 Brain Version: ${safeString(caseBrain.version)}
Student 360 Generated At: ${safeString(caseBrain.generatedAt)}
Data Summary: ${safeJson(dataSummary)}
Data Gaps: ${safeJson(caseBrain.dataGaps || crmContext.dataGaps || [])}
Source Health: ${safeJson(caseBrain.sourceHealth || crmContext.sourceHealth || {})}

Live Section Counts:
- Timeline: ${sections.timeline.length}
- Follow-Ups: ${sections.followUps.length}
- Appointments: ${sections.appointments.length}
- Reminders: ${sections.reminders.length}
- Activity Logs: ${sections.activityLogs.length}
- Documents: ${sections.documents.length}
- Document Requirements: ${sections.documentRequirements.length}
- Applications: ${sections.applications.length}
- Application Requirements: ${sections.applicationRequirements.length}
- Application Events: ${sections.applicationEvents.length}
- Universities: ${sections.universities.length}
- University Requirements: ${sections.universityRequirements.length}
- University Events: ${sections.universityEvents.length}
- Tasks: ${sections.tasks.length}
- Communications: ${sections.communications.length}
- Invoices: ${sections.invoices.length}
- Payments: ${sections.payments.length}
- Receipts: ${sections.receipts.length}
- Payment Requests: ${sections.paymentRequests.length}
- Support Requests: ${sections.supportRequests.length}
- Support Messages: ${sections.supportMessages.length}
- Visa Cases: ${sections.visaCases.length}
- Visa Requirements: ${sections.visaRequirements.length}
- Visa Events: ${sections.visaEvents.length}
  `;
}

function buildContextData(crmContext: CrmContext) {
  const caseBrain = sanitizeObject(crmContext.caseBrain);

  return `
CASE BRAIN SNAPSHOT:
${safeJson({
    identity: caseBrain.identity,
    caseSnapshot: caseBrain.caseSnapshot,
    summaries: caseBrain.summaries,
    dataGaps: caseBrain.dataGaps,
  })}

${summarizeArray(crmContext.applications, "Applications")}
${summarizeArray(crmContext.applicationRequirements, "Application Requirements")}
${summarizeArray(crmContext.applicationEvents, "Application Events")}
${summarizeArray(crmContext.universities, "Universities")}
${summarizeArray(crmContext.universityRequirements, "University Requirements")}
${summarizeArray(crmContext.universityEvents, "University Events")}
${summarizeArray(crmContext.documents, "Documents")}
${summarizeArray(crmContext.documentRequirements, "Document Requirements")}
${summarizeArray(crmContext.visaCases, "Visa Cases")}
${summarizeArray(crmContext.visaRequirements, "Visa Requirements")}
${summarizeArray(crmContext.visaEvents, "Visa Events")}
${summarizeArray(crmContext.invoices, "Invoices")}
${summarizeArray(crmContext.payments, "Payments")}
${summarizeArray(crmContext.receipts, "Receipts")}
${summarizeArray(crmContext.paymentRequests, "Payment Requests")}
${summarizeArray(crmContext.supportRequests, "Support Requests")}
${summarizeArray(crmContext.supportMessages, "Support Conversation")}
${summarizeArray(crmContext.tasks, "Tasks")}
${summarizeArray(crmContext.followUps, "Follow-Ups")}
${summarizeArray(crmContext.communications, "Communications")}
${summarizeArray(crmContext.timeline, "Timeline")}
${summarizeArray(crmContext.appointments, "Appointments")}
${summarizeArray(crmContext.reminders, "Reminders")}
${summarizeArray(crmContext.activityLogs, "Activity Logs")}
  `;
}

function safeJson(value: unknown) {
  try {
    const text = JSON.stringify(value ?? null, null, 2);
    return text.length > 18000 ? `${text.slice(0, 18000)}\n[context truncated]` : text;
  } catch {
    return "Unavailable";
  }
}

function getModeInstruction({
  mode,
  modeLabel,
  adminName,
}: {
  mode: GptMode;
  modeLabel: string;
  adminName: string;
}) {
  const modeInstructions: Record<string, string> = {
    lead_reanalysis: `
Return valid JSON only with this exact schema:
{
  "score": 0,
  "intent_level": "Low | Medium | High",
  "risk_level": "Low | Medium | High | Unknown",
  "conversion_probability": "0-20% | 20-40% | 40-60% | 60-75% | 75-90%",
  "priority": "Cold Lead | Nurture Lead | Warm Lead | Hot Lead",
  "next_action": "one practical counselor action",
  "summary": "2-3 sentence CRM summary",
  "counselor_strategy": "2-4 sentence practical strategy",
  "confidence": "low | medium | high",
  "missing_data": ["item 1", "item 2"],
  "risk_signals": ["risk 1", "risk 2"],
  "opportunity_signals": ["opportunity 1", "opportunity 2"]
}

Scoring rules:
- score must be 0 to 100.
- Do not copy local AI score blindly; adjust if CRM data supports it.
- If profile is incomplete, lower confidence and list missing data.
- Keep next_action short and actionable.
- Return JSON only.
`,

    summary: `
Generate a Senior Counselor Smart Summary.

Output exactly these sections:

1. Executive Student Summary
Briefly explain who this student is and what they want.

2. Intent Level
Choose: Low / Medium / High.
Explain why using student data, CRM context, and local AI signals.

3. Conversion Probability
Give an estimated percentage range, for example 40–55%.
Base it only on available CRM data, CRM context, and local AI signals.

4. Main Opportunity
Explain the best opportunity for the counselor.

5. Main Risk
Explain the biggest risk or blocker.

6. Missing Qualification Data
List the important missing details the counselor should collect.

7. Counselor Strategy
Explain how the counselor should approach this student.

8. Next Best Action
Give one clear next step.

9. Suggested Follow-Up Timing
Give a realistic follow-up timing.
`,

    whatsapp: `
Write a ready-to-send WhatsApp message.

Tone:
- Warm
- Professional
- Human
- Short
- Not robotic
- Not desperate

Rules:
- Start with the student's first name if available.
- Mention Zaifan Consultancy naturally.
- Refer to their country/program interest if available.
- Ask for missing documents or missing details if relevant.
- Use CRM context if follow-up history exists.
- End with a clear reply request.
- Keep it under 120 words.
- Do not include placeholders like [Name] unless the CRM data is missing.
`,

    email: `
Write a ready-to-send professional email.

Include:
- Subject line
- Greeting
- Short context
- What Zaifan can help with
- Missing information or documents needed
- Clear next step
- Professional closing from ${adminName}

Tone:
Professional, polished, and trustworthy.
Do not overpromise admission, scholarship, or visa outcomes.
`,

    next_action: `
Generate next-best-action advice for the counselor.

Output exactly these sections:

1. Immediate Action
What should the counselor do now?

2. Best Contact Channel
Choose WhatsApp / Phone Call / Email / Appointment.
Explain why.

3. Key Questions To Ask
List the most important questions.

4. Objection To Watch
Predict the likely objection.

5. CRM Stage Suggestion
Suggest the best pipeline/status movement if appropriate.

6. Counselor Warning
Mention any risk of losing the lead.
`,

    visa_risk: `
Analyze visa risk only as a counselor preparation note.

Output exactly these sections:

1. Risk Level
Choose Low / Medium / High / Unknown.

2. Why This Risk Level
Explain based only on available CRM data.

3. Possible Red Flags
List possible red flags, but do not invent facts.

4. Missing Visa Information
List what must be checked.

5. Documents To Verify
List documents the counselor should request.

6. Safer Next Steps
Give practical next steps.

Important:
Do not say the visa will be approved.
Do not say the visa will be refused.
Do not make legal guarantees.
`,

    call_script: `
Create a counselor call script.

Output exactly these sections:

1. Opening
A natural opening line.

2. Qualification Questions
Ask about academics, IELTS, budget, intake, country, and documents.

3. Program/Country Discussion
Guide the counselor on how to discuss the student's interest.

4. Objection Handling
Include likely objections and how to respond.

5. Closing Next Step
End with a clear action.

Tone:
Confident, respectful, and consultative.
`,

    followup_plan: `
Create a 7-day follow-up plan.

Output exactly:

Day 1:
Day 2:
Day 3:
Day 5:
Day 7:

Each day should include:
- Contact channel
- Message/action goal
- Counselor objective

Use CRM context if previous follow-ups, reminders, or overdue status exist.
The plan should be realistic for a consultancy CRM.
`,

    scholarship: `
Analyze scholarship potential.

Output exactly these sections:

1. Scholarship Potential
Choose Low / Medium / High / Unknown.

2. Reason
Explain based only on available data.

3. Missing Scholarship Data
List missing academics, IELTS, financial, and extracurricular details.

4. Counselor Strategy
Explain how to position scholarship discussion.

5. Recommended Next Step
Give one clear next action.
`,

    objection_analysis: `
Analyze possible student objections.

Output exactly these sections:

1. Likely Objections
List likely objections.

2. Hidden Concerns
Predict concerns the student may not directly say.

3. Counselor Response Strategy
Explain how to handle each concern.

4. What Not To Do
Mention mistakes the counselor should avoid.

5. Best Next Message
Write a short message the counselor can send.
`,

    counselor_strategy: `
Create a senior counselor strategy note.

Output exactly these sections:

1. Lead Quality
Choose Weak / Average / Good / Strong.

2. Student Psychology
Explain likely mindset.

3. Conversion Strategy
Explain how to move this student forward.

4. Trust Building Angle
What should the counselor emphasize?

5. Urgency Angle
How should urgency be created without pressure?

6. Final Recommendation
One decisive recommendation.
`,

    case_brief: `
Build a high-density Student 360 OPERATIONS BRIEF, not a generic counselor essay.

Required analysis behavior:
- Reconstruct the exact current state of Applications, Universities/Requirements, Documents, Visa, Finance, Support, Communications, Tasks/Follow-ups and Portal.
- systemStatus should normally contain one row for each of those major systems.
- Use exact record names/statuses/counts/amounts when available.
- dataCoverage must be calculated from the supplied Student 360 context, not guessed. Finance records = invoices + payments + receipts + payment requests.
- criticalBlockers must contain only issues that actually block or materially threaten progress. Missing profile facts belong in missingFacts unless they are currently blocking a workflow.
- completedWork must list concrete completed/verified actions so another counselor does not repeat them.
- recentChanges should prioritize the most recent meaningful operational changes; use the record timestamp when available, otherwise say "Timestamp unavailable".
- contradictions must expose conflicting CRM facts or suspicious data labels. Return [] when there is no supported contradiction.
- nextActions must be ordered, concrete and case-specific. Prefer 3-5 actions. Do not default to "contact the student" unless the evidence actually makes contact the best next move.
- missingFacts should contain only facts not present in Zaifan that are genuinely needed for the next decision.
- handoverNote should be a compact operational paragraph another counselor could use to continue the case immediately.

Source labels should be human-readable, for example: Applications, University Requirements, Documents, Visa OS, Finance, Support, Communications, Tasks, Follow-ups, Timeline, Portal Access, Student Profile.

Do NOT produce numbered prose sections. Return only the schema-configured JSON.
`,

    gap_audit: `
Audit the entire Student 360 case for missing data, unresolved requirements, stale work and contradictions.

Output exactly these sections:

1. Critical Gaps
2. Application Gaps
3. University / Requirement Gaps
4. Document Gaps
5. Visa Gaps
6. Finance Gaps
7. Support / Communication Gaps
8. Task / Follow-Up Gaps
9. Data Quality Conflicts
10. Recommended Fix Order

Rules:
- Distinguish a true blocker from merely missing CRM information.
- Do not invent deadlines or requirements.
- If two CRM records conflict, quote the two conflicting facts briefly and mark them for human review.
`,

    sop_draft: `
Draft an evidence-only Statement of Purpose using the student's verified CRM facts.

Output exactly these sections:

1. SOP Readiness
Choose Ready / Partial / Not Ready and explain why.

2. Verified Facts Used
List the facts actually found in the Student 360 data.

3. Missing Facts Needed
List anything required for a strong SOP that is not present, such as motivation, projects, work experience, achievements, career goals, university-specific reasons or personal background.

4. SOP Draft
Write the strongest possible draft using only known facts. Where a necessary personal fact is missing, use a visible marker such as [MISSING: specific fact needed] rather than inventing content.

5. Counselor Review Checklist
List claims that should be verified with the student before submission.

Important:
- Never fabricate work experience, projects, achievements, family background, motivations, grades, skills or career history.
- Do not claim the draft is submission-ready when important facts are missing.
`,

    cv_draft: `
Draft an evidence-only student CV from the Student 360 Case Brain.

Output exactly these sections:

1. CV Readiness
Choose Ready / Partial / Not Ready.

2. Verified Facts Used
List the education, scores, skills, experience, projects, awards, languages and contact details actually present.

3. Missing CV Facts
List missing facts that should be collected.

4. CV Draft
Use clean professional sections: Header, Profile, Education, Experience, Projects, Skills, Certifications/Awards, Languages, Additional Information. Omit empty sections or use [MISSING: ...] where clarification is essential.

5. Verification Checklist
List all claims the counselor/student should confirm before use.

Important:
- Never fabricate institutions, dates, grades, jobs, projects, responsibilities, skills, awards or languages.
- Do not infer a skill from a desired study program.
`,
  };

  return modeInstructions[mode] || modeInstructions.summary || `Generate ${modeLabel}.`;
}

function readStudent(
  student: StudentRecord,
  keys: string[],
  fallback = "Not provided"
) {
  for (const key of keys) {
    const value = student[key];
    const text = safeString(value, "");
    if (text) return text;
  }

  return fallback;
}

function getFirstName(student: StudentRecord) {
  const fullName = readStudent(student, ["full_name", "name", "student_name"], "");
  return fullName.trim().split(" ")[0] || "there";
}

function summarizeArray(items: unknown, label: string) {
  if (!Array.isArray(items) || items.length === 0) {
    return `${label}: None provided`;
  }

  return `${label}:\n${items
    .slice(0, 10)
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return `${index + 1}. ${String(item)}`;
      }

      const entry = item as Record<string, unknown>;

      return `${index + 1}. ${Object.entries(entry)
        .slice(0, 10)
        .map(([key, value]) => `${key}: ${safeString(value)}`)
        .join(" | ")}`;
    })
    .join("\n")}`;
}

function summarizeSimpleList(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "None provided";

  return value
    .slice(0, 10)
    .map((item) => safeString(item))
    .join("; ");
}
