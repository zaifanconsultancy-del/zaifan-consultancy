const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const studentName = full_name || name || "Student";

    const adminResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zaifan Consultancy <onboarding@resend.dev>",
        to: ["zaifanconsultancy@gmail.com"],
        subject: "New Student Inquiry - Zaifan Consultancy",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 28px; background:#080807;">
            <div style="max-width:680px; margin:auto; background:#111111; padding:28px; border-radius:18px; border:1px solid rgba(212,175,55,0.35); color:#ffffff;">
              <h2 style="margin:0 0 18px; color:#D4AF37;">🎓 New Student Inquiry</h2>

              <div style="background:rgba(255,255,255,0.04); padding:18px; border-radius:14px; border:1px solid rgba(255,255,255,0.08);">
                <p><strong>Name:</strong> ${studentName}</p>
                <p><strong>Email:</strong> ${email || "-"}</p>
                <p><strong>Phone:</strong> ${phone || "-"}</p>
                <p><strong>City:</strong> ${city || "-"}</p>
              </div>

              <div style="margin-top:18px; background:rgba(212,175,55,0.08); padding:18px; border-radius:14px; border:1px solid rgba(212,175,55,0.18);">
                <p><strong>Preferred Country:</strong> ${country || "-"}</p>
                <p><strong>Field Of Interest:</strong> ${field_of_interest || "-"}</p>
                <p><strong>Study Level:</strong> ${study_level || "-"}</p>
                <p><strong>Counseling Mode:</strong> ${counseling_mode || "-"}</p>
                <p><strong>Preferred Date:</strong> ${preferred_date || "-"}</p>
                <p><strong>Time Slot:</strong> ${time_slot || "-"}</p>
              </div>

              <div style="margin-top:18px;">
                <p style="color:#D4AF37;"><strong>Message:</strong></p>
                <p style="line-height:1.7; color:#dddddd;">${message || "No message provided."}</p>
              </div>
            </div>
          </div>
        `,
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
        subject: "Thank you for contacting Zaifan Consultancy",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 28px; background:#080807;">
            <div style="max-width:680px; margin:auto; background:#111111; padding:30px; border-radius:18px; border:1px solid rgba(212,175,55,0.35); color:#ffffff;">
              <h2 style="margin:0; color:#D4AF37;">Thank you, ${studentName} 🎓</h2>

              <p style="font-size:15px; color:#dddddd; line-height:1.7; margin-top:18px;">
                We have received your inquiry at <strong>Zaifan Consultancy</strong>.
                Our team will review your details and contact you soon.
              </p>

              <div style="background:rgba(212,175,55,0.08); padding:18px; border-radius:14px; margin:22px 0; border:1px solid rgba(212,175,55,0.18);">
                <p><strong>Preferred Country:</strong> ${country || "-"}</p>
                <p><strong>Study Level:</strong> ${study_level || "-"}</p>
                <p><strong>Counseling Mode:</strong> ${counseling_mode || "-"}</p>
                <p><strong>Phone:</strong> ${phone || "-"}</p>
              </div>

              <p style="font-size:15px; color:#dddddd; line-height:1.7;">
                Please keep your academic documents, passport details, and previous education records ready.
              </p>

              <p style="margin-top:26px; color:#dddddd;">
                Regards,<br />
                <strong style="color:#D4AF37;">Zaifan Consultancy Team</strong><br />
                Your Gateway To Global Success
              </p>
            </div>
          </div>
        `,
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});