import { supabase } from "../lib/supabaseClient";

const GPT_MODES = {
summary: {
label: "Smart Summary",
category: "analysis",
},

whatsapp: {
label: "WhatsApp Generator",
category: "communication",
},

email: {
label: "Email Generator",
category: "communication",
},

next_action: {
label: "Next Action",
category: "strategy",
},

visa_risk: {
label: "Visa Risk",
category: "risk",
},

call_script: {
label: "Call Script",
category: "communication",
},

followup_plan: {
label: "Follow-Up Plan",
category: "strategy",
},

scholarship: {
label: "Scholarship Analysis",
category: "analysis",
},

objection_analysis: {
label: "Objection Analysis",
category: "risk",
},

counselor_strategy: {
label: "Counselor Strategy",
category: "strategy",
},
};

function sanitizeArray(value) {
return Array.isArray(value) ? value : [];
}

function sanitizeObject(value) {
return value && typeof value === "object" ? value : {};
}

export async function generateGptCopilotText({
mode = "summary",
student = {},
studentType = "inquiry",
adminName = "Zaifan Consultancy Team",

timeline = [],
followUps = [],
appointments = [],
reminders = [],
activityLogs = [],
documents = [],

leadScore = null,
leadHealth = null,
lastActivity = null,
overdueStatus = null,

extraContext = {},
}) {
const selectedMode = GPT_MODES[mode] || GPT_MODES.summary;

const crmContext = {
timeline: sanitizeArray(timeline),
followUps: sanitizeArray(followUps),
appointments: sanitizeArray(appointments),
reminders: sanitizeArray(reminders),
activityLogs: sanitizeArray(activityLogs),
documents: sanitizeArray(documents),

leadScore,
leadHealth,
lastActivity,
overdueStatus,

generatedAt: new Date().toISOString(),
generatedBy: adminName,
modeCategory: selectedMode.category,

extraContext: sanitizeObject(extraContext),

};

const payload = {
mode,
modeLabel: selectedMode.label,

student,
studentType,

adminName,

crmContext,

};

const startedAt = Date.now();

const { data, error } = await supabase.functions.invoke(
"zaifan-gpt-copilot",
{
body: payload,
}
);

const durationMs = Date.now() - startedAt;

console.log(
`[GPT Copilot] ${selectedMode.label} completed in ${durationMs}ms`
);

if (error) {
console.error("[GPT Copilot Error]", error);

```
throw new Error(
  error.message ||
    "Unable to contact GPT Copilot service."
);
```

}

if (!data?.success) {
throw new Error(
data?.error ||
"GPT Copilot returned an invalid response."
);
}

return data.text || "";
}

export { GPT_MODES };
