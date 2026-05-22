const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const safeText = (value: unknown) => {
  return String(value || "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const {
      full_name,
      name,
      email,
      phone,
      country,
      field_of_interest,
      study_level,
      counseling_mode,
      preferred_date,
      time_slot,
      city,
      message,
    } = await req.json();

    if (!email) {
      throw new Error("Student email is required.");
    }

    const studentName = safeText(full_name || name || "Student");
    const studentEmail = safeText(email);
    const studentPhone = safeText(phone);
    const studentCity = safeText(city);
    const preferredCountry = safeText(country);
    const field = safeText(field_of_interest);
    const studyLevel = safeText(study_level);
    const counselingMode = safeText(counseling_mode);
    const preferredDate = safeText(preferred_date);
    const timeSlot = safeText(time_slot);
    const studentMessage = safeText(message || "No message provided.");

    const adminEmailHtml = `
      <div style="margin:0; padding:0; background:#050505; font-family:Arial, sans-serif;">
        <div style="max-width:720px; margin:0 auto; padding:32px 18px;">
          <div style="border:1px solid rgba(212,175,55,0.35); border-radius:22px; background:#111111; overflow:hidden;">
            <div style="height:3px; background:linear-gradient(90deg, transparent, #D4AF37, transparent);"></div>

            <div style="padding:30px;">
              <p style="margin:0 0 10px; color:#D4AF37; font-size:12px; letter-spacing:3px; text-transform:uppercase;">
                Zaifan Consultancy
              </p>

              <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.3;">
                New Student Inquiry Received
              </h1>

              <p style="margin:14px 0 0; color:#bdbdbd; line-height:1.7;">
                A new student has submitted the contact form on the Zaifan Consultancy website.
              </p>

              <div style="margin-top:24px; padding:20px; border-radius:18px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">
                <h2 style="margin:0 0 14px; color:#D4AF37; font-size:18px;">
                  Student Details
                </h2>

                <p style="color:#eeeeee;"><strong>Name:</strong> ${studentName}</p>
                <p style="color:#eeeeee;"><strong>Email:</strong> ${studentEmail}</p>
                <p style="color:#eeeeee;"><strong>Phone:</strong> ${studentPhone}</p>
                <p style="color:#eeeeee;"><strong>City:</strong> ${studentCity}</p>
              </div>

              <div style="margin-top:18px; padding:20px; border-radius:18px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2);">
                <h2 style="margin:0 0 14px; color:#D4AF37; font-size:18px;">
                  Study Preferences
                </h2>

                <p style="color:#eeeeee;"><strong>Preferred Country:</strong> ${preferredCountry}</p>
                <p style="color:#eeeeee;"><strong>Field Of Interest:</strong> ${field}</p>
                <p style="color:#eeeeee;"><strong>Study Level:</strong> ${studyLevel}</p>
                <p style="color:#eeeeee;"><strong>Counseling Mode:</strong> ${counselingMode}</p>
                <p style="color:#eeeeee;"><strong>Preferred Date:</strong> ${preferredDate}</p>
                <p style="color:#eeeeee;"><strong>Time Slot:</strong> ${timeSlot}</p>
              </div>

              <div style="margin-top:18px; padding:20px; border-radius:18px; background:#0b0b0b; border:1px solid rgba(255,255,255,0.08);">
                <h2 style="margin:0 0 12px; color:#D4AF37; font-size:18px;">
                  Student Message
                </h2>

                <p style="margin:0; color:#dddddd; line-height:1.8;">
                  ${studentMessage}
                </p>
              </div>

              <p style="margin:24px 0 0; color:#8f8f8f; font-size:13px; line-height:1.7;">
                Tip: Contact the student as soon as possible for a better conversion rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    const studentEmailHtml = `
      <div style="margin:0; padding:0; background:#050505; font-family:Arial, sans-serif;">
        <div style="max-width:720px; margin:0 auto; padding:32px 18px;">
          <div style="border:1px solid rgba(212,175,55,0.35); border-radius:22px; background:#111111; overflow:hidden;">
            <div style="height:3px; background:linear-gradient(90deg, transparent, #D4AF37, transparent);"></div>

            <div style="padding:30px;">
              <p style="margin:0 0 10px; color:#D4AF37; font-size:12px; letter-spacing:3px; text-transform:uppercase;">
                Zaifan Consultancy
              </p>

              <h1 style="margin:0; color:#ffffff; font-size:28px; line-height:1.3;">
                Thank you, ${studentName}
              </h1>

              <p style="margin:18px 0 0; color:#dddddd; line-height:1.8; font-size:15px;">
                We have received your inquiry at <strong style="color:#D4AF37;">Zaifan Consultancy</strong>.
                Our team will review your details and contact you soon regarding your study abroad plans.
              </p>

              <div style="margin-top:24px; padding:20px; border-radius:18px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2);">
                <h2 style="margin:0 0 14px; color:#D4AF37; font-size:18px;">
                  Your Submitted Details
                </h2>

                <p style="color:#eeeeee;"><strong>Preferred Country:</strong> ${preferredCountry}</p>
                <p style="color:#eeeeee;"><strong>Field Of Interest:</strong> ${field}</p>
                <p style="color:#eeeeee;"><strong>Study Level:</strong> ${studyLevel}</p>
                <p style="color:#eeeeee;"><strong>Counseling Mode:</strong> ${counselingMode}</p>
                <p style="color:#eeeeee;"><strong>Preferred Date:</strong> ${preferredDate}</p>
                <p style="color:#eeeeee;"><strong>Phone:</strong> ${studentPhone}</p>
              </div>

              <div style="margin-top:22px; padding:20px; border-radius:18px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);">
                <h2 style="margin:0 0 12px; color:#ffffff; font-size:18px;">
                  What happens next?
                </h2>

                <p style="margin:0; color:#dddddd; line-height:1.8;">
                  Our team will check your information, understand your study goals,
                  and contact you through your provided phone number or email.
                  Please keep your academic documents, passport details, and previous education records ready.
                </p>
              </div>

              <p style="margin:26px 0 0; color:#dddddd; line-height:1.7;">
                Regards,<br />
                <strong style="color:#D4AF37;">Zaifan Consultancy Team</strong><br />
                <span style="color:#9f9f9f;">Your Gateway To Global Success</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    const adminResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zaifan Consultancy <onboarding@resend.dev>",
        to: ["zaifanconsultancy@gmail.com"],
        subject: `New Student Inquiry - ${studentName}`,
        html: adminEmailHtml,
      }),
    });

    const adminData = await adminResponse.json();

    const studentResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zaifan Consultancy <onboarding@resend.dev>",
        to: [email],
        subject: "We received your inquiry - Zaifan Consultancy",
        html: studentEmailHtml,
      }),
    });

    const studentData = await studentResponse.json();

    return new Response(
      JSON.stringify({
        adminEmail: adminData,
        studentEmail: studentData,
      }),
      {
        status: adminResponse.ok && studentResponse.ok ? 200 : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
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