import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";

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
];

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? [], null, 2);
  } catch {
    return "[]";
  }
}

function getStudentBasics(body: any) {
  return `
Student Name: ${body?.studentName || "Unknown Student"}
Student ID: ${body?.studentId || "Unknown"}
Student Type: ${body?.studentType || "Unknown"}
Country: ${body?.country || "Not specified"}
Status: ${body?.status || "Not specified"}
`;
}

function buildDataContext(body: any) {
  return `
STUDENT PROFILE:
${safeStringify(body?.student || {})}

DOCUMENTS:
${safeStringify(body?.documents || [])}

TASKS:
${safeStringify(body?.tasks || [])}

COMMUNICATIONS:
${safeStringify(body?.communications || [])}

UNIVERSITIES:
${safeStringify(body?.universities || [])}

APPLICATIONS:
${safeStringify(body?.applications || [])}

TIMELINE:
${safeStringify(body?.timeline || [])}

DATA SUMMARY:
${safeStringify(body?.dataSummary || {})}

PACKAGE WARNINGS:
${safeStringify(body?.packageWarnings || [])}
`;
}

function getPromptByType(analysisType: string, body: any) {
  const basics = getStudentBasics(body);
  const dataContext = buildDataContext(body);

  if (analysisType === "risk_analysis") {
    return `
You are a senior international student risk analyst.

Analyze ONLY the student's risks based on the CRM data.

${basics}

${dataContext}

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "riskScore": 0,
  "visaRisk": {
    "level": "Low | Medium | High | Critical",
    "reason": "",
    "actions": []
  },
  "documentRisk": {
    "level": "Low | Medium | High | Critical",
    "reason": "",
    "actions": []
  },
  "applicationRisk": {
    "level": "Low | Medium | High | Critical",
    "reason": "",
    "actions": []
  },
  "universityRisk": {
    "level": "Low | Medium | High | Critical",
    "reason": "",
    "actions": []
  },
  "timelineRisk": {
    "level": "Low | Medium | High | Critical",
    "reason": "",
    "actions": []
  },
  "risks": [],
  "recommendedActions": []
}

Rules:
- Do not invent data.
- If data is missing, state that the risk is caused by missing CRM information.
- riskScore must be 0 to 100, where 100 is highest risk.
- readinessScore must be 0 to 100, where 100 is fully ready.
- Keep recommendations practical for a study abroad counselor.
`;
  }

  if (analysisType === "university_recommendation") {
    return `
You are a senior university matching advisor for international students.

Recommend suitable universities based on the student's CRM data.

${basics}

${dataContext}

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "dreamUniversities": [],
  "targetUniversities": [],
  "safeUniversities": [],
  "recommendedCountries": [],
  "profileGaps": [],
  "recommendedActions": []
}

Rules:
- Do not pretend the student has grades, IELTS, budget, or documents unless present in CRM data.
- If profile data is missing, recommend what must be collected before final matching.
- Each university item should include university, country, reason, riskLevel, requiredNextStep.
`;
  }

  if (analysisType === "counselor_copilot") {
    return `
You are a senior counselor copilot.

Tell the counselor exactly what to do next for this student.

${basics}

${dataContext}

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "priorityActions": [],
  "nextCallScript": "",
  "internalNotes": [],
  "followUpPlan": [],
  "recommendedActions": []
}

Rules:
- Be practical.
- Focus on next 24-72 hours.
- Mention urgent blockers first.
- Do not invent missing student data.
`;
  }

  if (analysisType === "email_draft") {
    return `
You are a professional study abroad counselor.

Generate a student email draft based on the CRM data.

${basics}

${dataContext}

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "subject": "",
  "emailBody": "",
  "tone": "",
  "recommendedActions": []
}

Rules:
- Write directly to the student.
- Keep it professional, clear, and helpful.
- Do not mention internal CRM terms.
`;
  }

  if (analysisType === "whatsapp_draft") {
    return `
You are a professional study abroad counselor.

Generate a WhatsApp follow-up message based on the CRM data.

${basics}

${dataContext}

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "whatsappMessage": "",
  "tone": "",
  "recommendedActions": []
}

Rules:
- Write directly to the student.
- Keep it short, friendly, and action-focused.
- Do not mention internal CRM terms.
`;
  }

  return `
You are a senior international student counselor.

Analyze this student based on the full CRM operating system data.

${basics}

${dataContext}

Return ONLY valid JSON in this exact structure:

{
  "summary": "",
  "riskLevel": "Low | Medium | High | Critical",
  "readinessScore": 0,
  "risks": [],
  "recommendedActions": []
}

Rules:
- Do not invent data.
- Use the documents, tasks, universities, applications, communications, and timeline data.
- If important data is missing, say what needs to be collected.
- Keep recommendations practical for a study abroad counselor.
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing");
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const body = await req.json();

    const analysisType = allowedAnalysisTypes.includes(body?.analysisType)
      ? body.analysisType
      : "student_analysis";

    const prompt = getPromptByType(analysisType, body);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature:
        analysisType === "email_draft" || analysisType === "whatsapp_draft"
          ? 0.55
          : 0.35,
      messages: [
        {
          role: "system",
          content:
            "You are an expert international student counselor. Return only valid JSON. Do not use markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        success: true,
        analysisType,
        analysis: result,
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
        error: error?.message || "Student analysis failed.",
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