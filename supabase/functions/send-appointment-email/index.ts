import "@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const VERIFIED_EMAIL = "zaifanconsultancy@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Zaifan Consultancy <onboarding@resend.dev>",
      to: VERIFIED_EMAIL,
      subject,
      html,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY missing");
    }

    const body = await req.json();

    const fullName = body.fullName || "Student";
    const studentEmail = body.email || "Not provided";
    const phone = body.phone || "Not provided";
    const country = body.country || "Not provided";
    const service = body.service || "Not provided";
    const appointmentDate = body.appointmentDate || "Not provided";
    const appointmentTime = body.appointmentTime || "Not provided";
    const message = body.message || "No message provided";

    const studentMail = await sendEmail(
      "Appointment Confirmation - Zaifan Consultancy",
      `
      <div style="font-family:Arial;background:#050505;color:white;padding:30px;">
        <div style="max-width:600px;margin:auto;background:#111;border:1px solid #D4AF37;border-radius:18px;padding:30px;">
          <h1 style="color:#D4AF37;">Zaifan Consultancy</h1>
          <h2>Appointment Request Received</h2>

          <p>Dear ${fullName},</p>

          <p>Thank you for booking an appointment with Zaifan Consultancy.</p>

          <div style="background:#1a1a1a;padding:18px;border-radius:12px;margin:20px 0;">
            <p><strong>Date:</strong> ${appointmentDate}</p>
            <p><strong>Time:</strong> ${appointmentTime}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Preferred Country:</strong> ${country}</p>
          </div>

          <p>Our team will contact you soon to confirm your consultation.</p>

          <p style="color:#D4AF37;font-weight:bold;">
            Your gateway to global success.
          </p>

          <p>
            Regards,<br/>
            Zaifan Consultancy Team
          </p>

          <hr style="border:none;border-top:1px solid #333;margin:25px 0;" />

          <p style="font-size:13px;color:#aaa;">
            Testing note: This confirmation was requested for ${studentEmail}. 
            Resend testing mode currently sends only to the verified Resend account email.
          </p>
        </div>
      </div>
      `
    );

    const adminMail = await sendEmail(
      "New Appointment Booking - Zaifan Consultancy",
      `
      <div style="font-family:Arial;background:#f6f6f6;padding:25px;">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:14px;padding:25px;border:1px solid #ddd;">
          <h2>New Appointment Booking</h2>

          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Student Email:</strong> ${studentEmail}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Preferred Country:</strong> ${country}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      </div>
      `
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Appointment emails sent successfully to verified Resend email",
        studentMail,
        adminMail,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.log("EDGE FUNCTION ERROR:", error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});