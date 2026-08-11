// student-analysis STUDENT CASE BRAIN V3
// Stored GPT Intelligence now reasons over the same Student 360 package as GPT Workspace.
// Uses the same Luna/Terra/Sol production model router and Responses API.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const allowedAnalysisTypes = [
  "student_analysis",
  "risk_analysis",
  "university_recommendation",
  "counselor_copilot",
  "email_draft",
  "whatsapp_draft",
  "case_summary",
  "gap_audit",
  "sop_draft",
  "cv_draft",
] as const;

type AnalysisType = (typeof allowedAnalysisTypes)[number];

type ModelRouter = {
  luna: string;
  terra: string;
  sol: string;
};

function safeString(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function safeJson(value: unknown, maxLength = 65000) {
  try {
    const text = JSON.stringify(value ?? null, null, 2);
    return text.length > maxLength
      ? `${text.slice(0, maxLength)}\n[context truncated]`
      : text;
  } catch {
    return "Unavailable";
  }
}

function selectModel(analysisType: AnalysisType, models: ModelRouter) {
  if (["email_draft", "whatsapp_draft"].includes(analysisType)) {
    return { model: models.luna, effort: "none", maxOutputTokens: 1400 };
  }

  if (["risk_analysis", "university_recommendation", "gap_audit", "sop_draft"].includes(analysisType)) {
    return {
      model: models.sol,
      effort: analysisType === "sop_draft" ? "high" : "medium",
      maxOutputTokens: analysisType === "sop_draft" ? 3200 : 2400,
    };
  }

  return {
    model: models.terra,
    effort: "medium",
    maxOutputTokens: analysisType === "cv_draft" ? 2800 : 2200,
  };
}

function getStudentBasics(body: any) {
  return `Student Name: ${safeString(body?.studentName, "Unknown Student")}
Student ID: ${safeString(body?.studentId, "Unknown")}
Student Type: ${safeString(body?.studentType, "Unknown")}
Country: ${safeString(body?.country, "Not specified")}
Status: ${safeString(body?.status, "Not specified")}`;
}

function buildDataContext(body: any) {
  return `
STUDENT CASE BRAIN:
${safeJson(body?.caseBrain || {})}

STUDENT PROFILE:
${safeJson(body?.student || {})}

DOCUMENTS:
${safeJson(body?.documents || [])}

DOCUMENT REQUIREMENTS:
${safeJson(body?.documentRequirements || [])}

TASKS:
${safeJson(body?.tasks || [])}

COMMUNICATIONS:
${safeJson(body?.communications || [])}

FOLLOW-UPS:
${safeJson(body?.followUps || [])}

UNIVERSITIES:
${safeJson(body?.universities || [])}

UNIVERSITY REQUIREMENTS:
${safeJson(body?.universityRequirements || [])}

UNIVERSITY EVENTS:
${safeJson(body?.universityEvents || [])}

APPLICATIONS:
${safeJson(body?.applications || [])}

APPLICATION REQUIREMENTS:
${safeJson(body?.applicationRequirements || [])}

APPLICATION EVENTS:
${safeJson(body?.applicationEvents || [])}

VISA CASES:
${safeJson(body?.visaCases || [])}

VISA REQUIREMENTS:
${safeJson(body?.visaRequirements || [])}

VISA EVENTS:
${safeJson(body?.visaEvents || [])}

FINANCE — INVOICES:
${safeJson(body?.invoices || [])}

FINANCE — PAYMENTS:
${safeJson(body?.payments || [])}

FINANCE — RECEIPTS:
${safeJson(body?.receipts || [])}

FINANCE — COUNSELOR PAYMENT REQUESTS:
${safeJson(body?.paymentRequests || [])}

SUPPORT REQUESTS:
${safeJson(body?.supportRequests || [])}

SUPPORT CONVERSATION:
${safeJson(body?.supportMessages || [])}

PORTAL STATE:
${safeJson(body?.portal || null)}

TIMELINE:
${safeJson(body?.timeline || [])}

DATA GAPS:
${safeJson(body?.dataGaps || [])}

DATA SUMMARY:
${safeJson(body?.dataSummary || {})}

SOURCE HEALTH:
${safeJson(body?.sourceHealth || {})}

PACKAGE WARNINGS:
${safeJson(body?.packageWarnings || [])}
`;
}

function baseRules() {
  return `
Core rules:
- Use only facts present in the Student 360 CRM package.
- Never invent grades, IELTS/PTE/Duolingo scores, budget, employment, projects, skills, achievements, family background, finances, visa history, deadlines, documents, university outcomes, scholarship outcomes, admission outcomes or motivations.
- If important information is absent, identify it as missing CRM information.
- Distinguish VERIFIED CRM FACTS from AI INFERENCE when the distinction matters.
- Internal/staff-only notes may inform counselor reasoning, but do not expose private internal notes inside student-facing email/WhatsApp drafts.
- Never guarantee admission, scholarship or visa approval.
- Keep counselor recommendations operational and specific to this student.
- Return ONLY valid JSON. No markdown fences. No prose before or after the JSON.
`;
}

function getPromptByType(analysisType: AnalysisType, body: any) {
  const basics = getStudentBasics(body);
  const dataContext = buildDataContext(body);
  const rules = baseRules();

  if (analysisType === "risk_analysis") {
    return `${rules}
You are Zaifan's senior international student risk analyst.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "riskScore": 0,
  "visaRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "documentRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "applicationRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "universityRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "financeRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "supportRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "timelineRisk": {"level": "Low | Medium | High | Critical", "reason": "", "actions": []},
  "risks": [],
  "recommendedActions": [],
  "missingInformation": []
}

riskScore: 0 = lowest risk, 100 = highest risk.
readinessScore: 0 = not ready, 100 = fully ready based on available evidence.`;
  }

  if (analysisType === "university_recommendation") {
    return `${rules}
You are Zaifan's senior university matching advisor.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "dreamUniversities": [],
  "targetUniversities": [],
  "safeUniversities": [],
  "recommendedCountries": [],
  "profileGaps": [],
  "existingUniversityAssessment": [],
  "recommendedActions": []
}

Prefer universities already present in the student's CRM shortlist when evidence is insufficient to responsibly introduce new institutions. Each university item should include university, country, reason, riskLevel and requiredNextStep.`;
  }

  if (analysisType === "counselor_copilot") {
    return `${rules}
You are Zaifan's senior counselor copilot. Tell the counselor exactly what to do next.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "priorityActions": [],
  "nextCallScript": "",
  "internalNotes": [],
  "followUpPlan": [],
  "completedWorkToAvoidRepeating": [],
  "recommendedActions": [],
  "missingInformation": []
}

Focus first on real blockers and the next 24–72 hours.`;
  }

  if (analysisType === "email_draft") {
    return `${rules}
Generate a professional student-facing email based only on student-safe facts.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "subject": "",
  "emailBody": "",
  "tone": "",
  "recommendedActions": []
}

Do not expose internal notes, staff-only reasoning or CRM terminology.`;
  }

  if (analysisType === "whatsapp_draft") {
    return `${rules}
Generate a short student-facing WhatsApp follow-up based only on student-safe facts.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "whatsappMessage": "",
  "tone": "",
  "recommendedActions": []
}

Keep the message friendly, concise and action-focused. Do not expose internal notes or CRM terminology.`;
  }

  if (analysisType === "case_summary") {
    return `${rules}
Create a complete Student 360 counselor handover summary.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "studentSnapshot": {},
  "journeyPosition": {},
  "completedWork": [],
  "activeBlockers": [],
  "financePosition": {},
  "supportPosition": {},
  "latestEngagement": [],
  "nextActions": [],
  "questionsStillNeeded": []
}`;
  }

  if (analysisType === "gap_audit") {
    return `${rules}
Audit the entire Student 360 case for missing data, unresolved requirements, stale work and contradictions.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "criticalGaps": [],
  "applicationGaps": [],
  "universityGaps": [],
  "documentGaps": [],
  "visaGaps": [],
  "financeGaps": [],
  "supportCommunicationGaps": [],
  "taskFollowUpGaps": [],
  "dataConflicts": [],
  "recommendedFixOrder": []
}`;
  }

  if (analysisType === "sop_draft") {
    return `${rules}
Draft an evidence-only Statement of Purpose.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "sopReadiness": "Ready | Partial | Not Ready",
  "verifiedFactsUsed": [],
  "missingFactsNeeded": [],
  "sopDraft": "",
  "verificationChecklist": []
}

Use [MISSING: specific fact needed] inside the draft where a necessary personal fact is absent. Never fabricate motivation, projects, work experience, achievements, skills, family background or career history.`;
  }

  if (analysisType === "cv_draft") {
    return `${rules}
Draft an evidence-only student CV.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "cvReadiness": "Ready | Partial | Not Ready",
  "verifiedFactsUsed": [],
  "missingFactsNeeded": [],
  "cvDraft": "",
  "verificationChecklist": []
}

Never infer skills from the desired study program and never fabricate institutions, dates, grades, jobs, projects, responsibilities, awards or languages.`;
  }

  return `${rules}
You are Zaifan's senior international student counselor.
Analyze the complete Student 360 case.

${basics}
${dataContext}

Return exactly:
{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "risks": [],
  "completedWork": [],
  "activeBlockers": [],
  "recommendedActions": [],
  "missingInformation": []
}`;
}

function extractResponseText(result: any) {
  if (typeof result?.output_text === "string" && result.output_text.trim()) {
    return result.output_text.trim();
  }

  const parts: string[] = [];
  if (Array.isArray(result?.output)) {
    for (const item of result.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const content of item.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          parts.push(content.text.trim());
        }
      }
    }
  }

  return parts.join("\n").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");

    const models: ModelRouter = {
      luna: Deno.env.get("OPENAI_MODEL_LUNA") || "gpt-5.6-luna",
      terra: Deno.env.get("OPENAI_MODEL_TERRA") || "gpt-5.6-terra",
      sol: Deno.env.get("OPENAI_MODEL_SOL") || "gpt-5.6-sol",
    };

    const body = await req.json();
    const requestedType = safeString(body?.analysisType, "student_analysis");
    const analysisType = allowedAnalysisTypes.includes(requestedType as AnalysisType)
      ? (requestedType as AnalysisType)
      : "student_analysis";

    const prompt = getPromptByType(analysisType, body);
    const route = selectModel(analysisType, models);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: route.model,
        input: prompt,
        reasoning: { effort: route.effort },
        max_output_tokens: route.maxOutputTokens,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("student-analysis OpenAI error:", result);
      throw new Error(result?.error?.message || "OpenAI request failed.");
    }

    const text = extractResponseText(result);
    if (!text) throw new Error("Student analysis returned an empty response.");

    // Validate JSON before returning it to the frontend/storage layer.
    try {
      JSON.parse(text);
    } catch {
      throw new Error("Student analysis returned invalid JSON. Please re-run the analysis.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysisType,
        analysis: text,
        model: route.model,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Student analysis failed.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
