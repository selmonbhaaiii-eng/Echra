import { Resend } from "resend";

type PostReadyEmailParams = {
  to: string | null | undefined;
  ownerName: string | null | undefined;
  businessName: string;
  postContent: string;
  reviewerName?: string | null;
  appUrl?: string;
};

function isConfigured(value: string | undefined) {
  return Boolean(value && !value.startsWith("your_"));
}

export async function sendPostReadyEmail(params: PostReadyEmailParams) {
  if (!params.to || !isConfigured(process.env.RESEND_API_KEY)) {
    return { skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const queueUrl = `${params.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ""}/dashboard/queue`;
  const reviewerLine = params.reviewerName
    ? `<p>This post was generated from ${params.reviewerName}'s recent review.</p>`
    : "";

  await resend.emails.send({
    from: "Echra <noreply@echra.app>",
    to: params.to,
    subject: `New post ready - ${params.businessName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#141618">
        <p>Hi ${params.ownerName || "there"},</p>
        <p>Echra just generated a new Google Business Profile post for <strong>${params.businessName}</strong>.</p>
        <blockquote style="border-left:4px solid #B8FF57;margin:20px 0;padding:12px 16px;background:#f6f6f6">${params.postContent}</blockquote>
        <p><a href="${queueUrl}" style="display:inline-block;background:#B8FF57;color:#0C0E0F;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:bold">Approve Post</a></p>
        ${reviewerLine}
        <p>The Echra Team</p>
      </div>
    `,
  });

  return { skipped: false };
}
