import { Resend } from "resend";

const isConfigured = (key: string | undefined): key is string => {
  return Boolean(key && key.trim() !== "" && !key.startsWith("your_") && !key.startsWith("re_your"));
};

interface ReminderEmailParams {
  to: string;
  ownerName: string;
  businessName: string;
  alertType: "never_connected_gbp" | "idle_client" | "posts_waiting_approval";
}

export async function sendReminderEmail(params: ReminderEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!params.to || !isConfigured(apiKey)) {
    console.warn("Skipping reminder email - Resend API key not configured or email missing.");
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let subject = "";
  let emailHtml = "";

  if (params.alertType === "never_connected_gbp") {
    subject = `Action Required: Connect your Google Business Profile to Echra`;
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #141618;">
        <h2 style="color: #0C0E0F;">👋 Hello ${params.ownerName || "there"},</h2>
        <p>You signed up for <strong>Echra</strong> for your business <strong>${params.businessName}</strong>, but your Google Business Profile is not connected yet.</p>
        <p>Echra needs access to pull your Google reviews and automate reply drafts and GBP post updates.</p>
        
        <p><a href="${appUrl}/dashboard" style="display: inline-block; background-color: #B8FF57; color: #0C0E0F; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Connect GBP Now</a></p>
        
        <p>If you need any help getting set up, just reply to this email!</p>
        <p>Best,<br>The Echra Team</p>
      </div>
    `;
  } else if (params.alertType === "idle_client") {
    subject = `We miss you at Echra!`;
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #141618;">
        <h2 style="color: #0C0E0F;">✨ Hey ${params.ownerName || "there"},</h2>
        <p>We noticed there hasn't been any activity on your Echra dashboard for <strong>${params.businessName}</strong> lately.</p>
        <p>Our AI engines are still ready to turn your reviews into Google Business Profile content and handle customer replies automatically.</p>
        
        <p><a href="${appUrl}/dashboard" style="display: inline-block; background-color: #B8FF57; color: #0C0E0F; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Dashboard</a></p>
        
        <p>Come back and see what's new!</p>
        <p>Best,<br>The Echra Team</p>
      </div>
    `;
  } else if (params.alertType === "posts_waiting_approval") {
    subject = `You have posts pending approval in Echra`;
    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #141618;">
        <h2 style="color: #0C0E0F;">🔔 Attention ${params.ownerName || "there"},</h2>
        <p>Our AI engine just generated new Google Business Profile posts for <strong>${params.businessName}</strong> that are waiting for your approval.</p>
        <p>Reviewing and approving posts keeps your Google Business Profile active and boosts local SEO ranking!</p>
        
        <p><a href="${appUrl}/dashboard/queue" style="display: inline-block; background-color: #B8FF57; color: #0C0E0F; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Review Pending Posts</a></p>
        
        <p>Best,<br>The Echra Team</p>
      </div>
    `;
  }

  try {
    await resend.emails.send({
      from: "Echra <notifications@resend.dev>",
      to: params.to,
      subject,
      html: emailHtml,
    });
    console.log(`✉️ Reminder email sent to ${params.to} for alert ${params.alertType}`);
    return { skipped: false };
  } catch (error) {
    console.error("❌ Failed to send reminder email:", error);
    return { skipped: true, error };
  }
}
