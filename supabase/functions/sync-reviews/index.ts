// @ts-nocheck
// Supabase Edge Function scheduled every 2 hours.
// It calls the Next.js internal sync endpoint so the app can reuse its Node crypto token decryptor.

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  const appUrl = Deno.env.get("APP_URL");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!appUrl) {
    return Response.json(
      { error: "APP_URL secret is required, for example https://yourdomain.com" },
      { status: 500 },
    );
  }

  const response = await fetch(`${appUrl}/api/internal/sync-reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  return Response.json(payload, { status: response.status });
});
