const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-5.5";

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const body = await req.json();

    const {
      mode = "summary",
      student = {},
      studentType = "inquiry",
      adminName = "Zaifan Consultancy Team",
      crmContext = {},
    } = body;

    const prompt = buildPrompt({
      mode,
      student,
      studentType,
      adminName,
      crmContext,
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
        temperature: 0.35,
        max_output_tokens: 1200,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", result);
      throw new Error(result?.error?.message || "OpenAI request failed.");
    }

    const text =
      result.output_text ||
      result.output?.[0]?.content?.[0]?.text ||
      "No AI response generated.";

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        text,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("GPT Copilot Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "AI generation failed.",
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

function buildPrompt({ mode, student, studentType, adminName, crmContext }) {
  const safe = (value: unknown) => String(value || "Not provided");

  const getFirstName = () => {
    const fullName =
      student.full_name || student.name || student.student_name || "";
    return String(fullName).trim().split(" ")[0] || "there";
  };

  const summarizeArray = (items: unknown, label: string) => {
    if (!Array.isArray(items) || items.length === 0) {
      return `${label}: None provided`;
    }

    return `${label}:\n${items
      .slice(0, 8)
      .map((item, index) => {
        if (!item || typeof item !== "object") {
          return `${index + 1}. ${String(item)}`;
        }

        const entry = item as Record<string, unknown>;

        return `${index + 1}. ${Object.entries(entry)
          .slice(0, 8)
          .map(([key, value]) => `${key}: ${safe(value)}`)
          .join(" | ")}`;
      })
      .join("\n")}`;
  };

  const studentData = `
Student Type: ${studentType}
Name: ${safe(student.full_name || student.name || student.student_name)}
First Name: ${getFirstName()}
Email: ${safe(student.email)}
Phone: ${safe(student.phone || student.phone_number || student.whatsapp)}
Country Interest: ${safe(
    student.country || student.country_interest || student.preferred_country
  )}
Field / Program: ${safe(
    student.field_of_interest ||
      student.course ||
      student.program ||
      student.consultation_type
  )}
Study Level: ${safe(student.study_level)}
Status: ${safe(
    student.status || student.appointment_stage || student.pipeline_stage
  )}
Priority: ${safe(student.priority)}
Appointment Date: ${safe(student.appointment_date)}
Appointment Time: ${safe(student.appointment_time)}
Message / Notes: ${safe(
    student.message || student.notes || student.consultation_notes
  )}
Created At: ${safe(student.created_at)}
Assigned Counselor: ${safe(student.assigned_admin_name || adminName)}
`;

  const contextData = `
Lead Score: ${safe(crmContext?.leadScore)}
Lead Health: ${safe(crmContext?.leadHealth)}
Last Activity: ${safe(crmContext?.lastActivity)}
Overdue Status: ${safe(crmContext?.overdueStatus)}

${summarizeArray(crmContext?.timeline, "Timeline")}
${summarizeArray(crmContext?.followUps, "Follow-Ups")}
${summarizeArray(crmContext?.appointments, "Appointments")}
${summarizeArray(crmContext?.reminders, "Reminders")}
${summarizeArray(crmContext?.activityLogs, "Activity Logs")}
${summarizeArray(crmContext?.documents, "Documents")}
`;

  const baseRules = `
You are Zaifan GPT Counselor Brain V2.

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

You specialize in:
- Canada
- United Kingdom
- Australia
- USA
- Europe
- General international admissions strategy

Your job is not to sound like a generic chatbot.
Your job is to help a real counselor make a better decision.

Core behavior:
- Be practical, direct, and counselor-focused.
- Think like a senior consultant, not a marketing writer.
- Use the available student data only.
- If information is missing, say what is missing.
- Do not invent grades, IELTS scores, budgets, documents, deadlines, scholarships, universities, or visa outcomes.
- Do not guarantee admission, scholarship, or visa approval.
- Do not make legal/immigration guarantees.
- Always give useful next steps.
- Prefer clear headings and short paragraphs.
- Keep output easy to read inside a CRM modal.
- Be honest when the student profile is weak or incomplete.
- Mention risk without sounding scary.
- Mention opportunity without overpromising.

Counselor intelligence rules:
- If country + program are provided, treat the lead as more qualified than a generic inquiry.
- If documents are pending, treat that as the biggest operational blocker.
- If phone/email are present, recommend direct counselor contact.
- If the student has no IELTS, grades, budget, intake, or documents listed, flag those as missing qualification data.
- If the lead is vague, recommend trust-building before pushing application fees.
- If the lead is specific, recommend moving toward document collection and eligibility assessment.
- If status is documents_pending, focus on document collection and urgency.
- If appointment exists, focus on preparation and conversion.
- If priority is high, recommend fast contact.
- If timeline/follow-up context exists, use it to judge engagement and urgency.
- If overdue follow-ups exist, recommend immediate reactivation.
- If activity history is empty, say the counselor needs first meaningful contact.
`;

  const modeInstructions: Record<string, string> = {
    summary: `
Generate a Senior Counselor Smart Summary.

Output exactly these sections:

1. Executive Student Summary
Briefly explain who this student is and what they want.

2. Intent Level
Choose: Low / Medium / High.
Explain why using student data and CRM context.

3. Conversion Probability
Give an estimated percentage range, for example 40–55%.
Base it only on available CRM data and CRM context.

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

  return `
${baseRules}

AI Task:
${modeInstructions[mode] || modeInstructions.summary}

Student CRM Data:
${studentData}

Additional CRM Context:
${contextData}
`;
}