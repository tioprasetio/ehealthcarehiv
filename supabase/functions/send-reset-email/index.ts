import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetEmailRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: ResetEmailRequest = await req.json();

    console.log("Sending reset email to:", email);
    console.log("Reset link:", resetLink);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HIV Care <noreply@hiv.esgul.com>",
        to: [email],
        subject: "Reset Password - HIV Care",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">HIV Care</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Sistem Manajemen Kesehatan</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Reset Password</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                  Jika Anda tidak meminta reset password, abaikan email ini. Link akan kadaluarsa dalam 1 jam.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Jika tombol tidak berfungsi, salin dan tempel link berikut ke browser Anda:
                </p>
                <p style="color: #0d9488; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
                  ${resetLink}
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  © 2024 HIV Care. Semua hak dilindungi.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reset-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
