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
    const { name, email, phone, country, message } = await req.json();

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
          <div style="font-family: Arial, sans-serif; padding: 24px; background:#f8f5ef;">
            <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:14px;">
              <h2>🎓 New Student Inquiry</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Preferred Country:</strong> ${country}</p>
              <p><strong>Message:</strong></p>
              <p>${message || "No message provided."}</p>
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
          <div style="font-family: Arial, sans-serif; padding: 24px; background:#f8f5ef;">
            <div style="max-width:600px; margin:auto; background:#ffffff; padding:28px; border-radius:14px; border:1px solid #ead9a8;">
              <h2 style="color:#1f1a12;">Thank you, ${name} 🎓</h2>

              <p style="font-size:15px; color:#333; line-height:1.7;">
                We have received your inquiry at <strong>Zaifan Consultancy</strong>.
                Our team will review your details and contact you soon.
              </p>

              <div style="background:#fbf7eb; padding:16px; border-radius:12px; margin:20px 0;">
                <p><strong>Preferred Country:</strong> ${country}</p>
                <p><strong>Phone:</strong> ${phone}</p>
              </div>

              <p style="font-size:15px; color:#333; line-height:1.7;">
                Please keep your academic documents, passport details, and previous education records ready.
              </p>

              <p style="margin-top:24px;">
                Regards,<br />
                <strong>Zaifan Consultancy Team</strong><br />
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
        status: adminResponse.ok ? 200 : 500,
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