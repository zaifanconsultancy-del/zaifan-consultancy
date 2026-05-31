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
    temperature: number;
  }
> = {
  summary: {
    label: "Smart Summary",
    category: "analysis",
    maxOutputTokens: 1400,
    temperature: 0.35,
  },
  whatsapp: {
    label: "WhatsApp Generator",
    category: "communication",
    maxOutputTokens: 700,
    temperature: 0.4,
  },
  email: {
    label: "Email Generator",
    category: "communication",
    maxOutputTokens: 1000,
    temperature: 0.35,
  },
  next_action: {
    label: "Next Action",
    category: "strategy",
    maxOutputTokens: 1200,
    temperature: 0.3,
  },
  visa_risk: {
    label: "Visa Risk",
    category: "risk",
    maxOutputTokens: 1400,
    temperature: 0.25,
  },
  call_script: {
    label: "Call Script",
    category: "communication",
    maxOutputTokens: 1300,
    temperature: 0.4,
  },
  followup_plan: {
    label: "7-Day Follow-Up Plan",
    category: "strategy",
    maxOutputTokens: 1400,
    temperature: 0.35,
  },
  scholarship: {
    label: "Scholarship Analysis",
    category: "analysis",
    maxOutputTokens: 1200,
    temperature: 0.3,
  },
  objection_analysis: {
    label: "Objection Analysis",
    category: "risk",
    maxOutputTokens: 1200,
    temperature: 0.3,
  },
  counselor_strategy: {
    label: "Counselor Strategy",
    category: "strategy",
    maxOutputTokens: 1400,
    temperature: 0.35,
  },
  lead_reanalysis: {
    label: "Fast Lead Reanalysis",
    category: "analysis",
    maxOutputTokens: 650,
    temperature: 0.2,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.5";

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

    const promptInput: PromptInput = {
      mode,
      modeLabel: modeLabel || selectedMode.label,
      student: sanitizeObject(student),
      studentType: safeString(studentType, "inquiry"),
      adminName: safeString(adminName, "Zaifan Consultancy Team"),
      crmContext: sanitizeObject(crmContext),
    };

    const prompt = buildPrompt(promptInput);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
        temperature: selectedMode.temperature,
        max_output_tokens: selectedMode.maxOutputTokens,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", result);
      throw new Error(result?.error?.message || "OpenAI request failed.");
    }

    const text = extractResponseText(result);
    const durationMs = Date.now() - startedAt;

    return jsonResponse({
      success: true,
      mode,
      modeLabel: selectedMode.label,
      category: selectedMode.category,
      model: OPENAI_MODEL,
      durationMs,
      text: text || "No AI response generated.",
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

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
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
  const timeline = sanitizeArray(crmContext.timeline);
  const followUps = sanitizeArray(crmContext.followUps);
  const appointments = sanitizeArray(crmContext.appointments);
  const reminders = sanitizeArray(crmContext.reminders);
  const activityLogs = sanitizeArray(crmContext.activityLogs);
  const documents = sanitizeArray(crmContext.documents);

  return `
Timeline Count: ${timeline.length}
Follow-Up Count: ${followUps.length}
Appointment Context Count: ${appointments.length}
Reminder Count: ${reminders.length}
Activity Log Count: ${activityLogs.length}
Document Count: ${documents.length}
`;
}

function buildContextData(crmContext: CrmContext) {
  return `
${summarizeArray(crmContext.timeline, "Timeline")}
${summarizeArray(crmContext.followUps, "Follow-Ups")}
${summarizeArray(crmContext.appointments, "Appointments")}
${summarizeArray(crmContext.reminders, "Reminders")}
${summarizeArray(crmContext.activityLogs, "Activity Logs")}
${summarizeArray(crmContext.documents, "Documents")}
`;
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
