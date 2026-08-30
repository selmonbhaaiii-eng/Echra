import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

async function getBusinessId(userId: string) {
  const supabase = createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  return business?.id ?? null;
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = await getBusinessId(user.id);
  if (!businessId) {
    return NextResponse.json({ posts: [] });
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*, reviews(reviewer_name,rating,review_text)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ posts: posts ?? [] });
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const service = createServiceRoleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const postId = url.searchParams.get("post_id");
  if (!postId) {
    return NextResponse.json({ success: false, error: "post_id is required" }, { status: 400 });
  }

  const businessId = await getBusinessId(user.id);
  if (!businessId) {
    return NextResponse.json({ success: false, error: "No business found" }, { status: 404 });
  }

  // Clear foreign key from reviews to avoid constraint violation
  await service.from("reviews").update({ post_created: false, post_id: null }).eq("post_id", postId);

  const { error } = await service.from("posts").delete().eq("id", postId).eq("business_id", businessId);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
