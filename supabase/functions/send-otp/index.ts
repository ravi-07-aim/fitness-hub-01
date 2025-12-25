import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email: string;
  action: "send" | "verify";
  otp?: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, otp }: OTPRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === "send") {
      // Generate OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTPs for this email
      await supabase
        .from("email_verifications")
        .delete()
        .eq("email", email);

      // Store OTP in database
      const { error: insertError } = await supabase
        .from("email_verifications")
        .insert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt.toISOString(),
          verified: false,
        });

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        throw new Error("Failed to generate OTP");
      }

      // Send email with OTP using Resend API
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Fitness Hub <onboarding@resend.dev>",
          to: [email],
          subject: "Your Verification Code - Fitness Hub",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%); border-radius: 16px; padding: 40px; border: 2px solid #ff3333; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #ff3333; font-size: 28px; font-weight: bold; text-shadow: 0 0 10px rgba(255, 51, 51, 0.5); }
                .otp-box { background: rgba(255, 51, 51, 0.1); border: 2px solid #ff3333; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
                .otp-code { font-size: 36px; font-weight: bold; color: #ff3333; letter-spacing: 8px; text-shadow: 0 0 20px rgba(255, 51, 51, 0.5); }
                .message { color: #cccccc; line-height: 1.6; text-align: center; }
                .warning { color: #ff6666; font-size: 14px; margin-top: 20px; text-align: center; }
                .footer { margin-top: 30px; text-align: center; color: #666666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🏋️ FITNESS HUB</div>
                </div>
                <p class="message">Your email verification code is:</p>
                <div class="otp-box">
                  <div class="otp-code">${otpCode}</div>
                </div>
                <p class="message">Enter this code to verify your email and complete your registration.</p>
                <p class="warning">⚠️ This code expires in 10 minutes. Do not share it with anyone.</p>
                <div class="footer">
                  <p>If you didn't request this code, please ignore this email.</p>
                  <p>© ${new Date().getFullYear()} Fitness Hub. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      const emailResult = await emailResponse.json();
      console.log("Email sent:", emailResult);

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "verify") {
      // Verify OTP
      const { data: verification, error: selectError } = await supabase
        .from("email_verifications")
        .select("*")
        .eq("email", email)
        .eq("otp_code", otp)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (selectError || !verification) {
        console.log("OTP verification failed:", selectError);
        return new Response(
          JSON.stringify({ success: false, message: "Invalid or expired OTP" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark as verified
      await supabase
        .from("email_verifications")
        .update({ verified: true })
        .eq("id", verification.id);

      return new Response(
        JSON.stringify({ success: true, message: "Email verified successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
