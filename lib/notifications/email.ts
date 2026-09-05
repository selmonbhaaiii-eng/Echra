import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPostGeneratedEmail(params: {
  clientEmail: string;
  ownerName: string;
  businessName: string;
  postContent: string;
  reviewerName?: string;
  dashboardUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY missing, skipping email.");
    return;
  }

  const {
    clientEmail,
    ownerName,
    businessName,
    postContent,
    reviewerName,
    dashboardUrl,
  } = params;

  let reviewerContext = "";
  if (reviewerName) {
    reviewerContext = `<p>This post was generated from <strong>${reviewerName}</strong>'s recent review. Echra automatically turns your best reviews into Google content.</p>`;
  }

  const emailTemplate = `
    <div style="font-family: sans-serif; max-w-xl; color: #333;">
      <h2 style="color: #000;">✨ New post ready for approval — ${businessName}</h2>
      <p>Hi ${ownerName},</p>
      <p>Echra just generated a new Google Business Profile post for ${businessName}.</p>
      
      <div style="padding: 16px; background-color: #f9f9f9; border-left: 4px solid #B8FF57; margin: 20px 0;">
        <p style="white-space: pre-wrap; font-size: 16px;">${postContent}</p>
      </div>

      <p>Approve it now to schedule publishing:</p>
      <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #B8FF57; color: #000; text-decoration: none; font-weight: bold; border-radius: 8px;">Approve Post &rarr;</a>
      
      ${reviewerContext}
      
      <p>Best,<br>The Echra Team</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Echra <notifications@resend.dev>',
      to: clientEmail,
      subject: `New post ready — ${businessName}`,
      html: emailTemplate,
    });

    if (error) {
      console.error("❌ Resend API Error:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ Email sent successfully! ID:", data?.id);
    }
  } catch (error) {
    console.error("❌ Resend System Error:", error);
  }
}
