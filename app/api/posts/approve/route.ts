import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const body = await request.json();
    const { post_id, action, edited_content, image_url } = body;

    if (!post_id || !action) {
      return NextResponse.json({ error: "Missing post_id or action" }, { status: 400 });
    }

    // Get the post and its business
    const { data: post } = await supabase
      .from("posts")
      .select("id, business_id, scheduled_at")
      .eq("id", post_id)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify ownership or admin
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", post.business_id || "")
      .single();

    if (!business || (business.owner_id !== user.id && profile?.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized access to this post" }, { status: 403 });
    }

    const now = new Date();
    // Schedule 15 minutes from now for approval if not already scheduled
    const scheduledTime = post.scheduled_at 
      ? post.scheduled_at 
      : new Date(now.getTime() + 15 * 60000).toISOString();

    if (action === "approve") {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: now.toISOString(),
          scheduled_at: scheduledTime,
          image_url: image_url !== undefined ? image_url : undefined,
        })
        .eq("id", post_id);

      if (error) throw error;
      
    } else if (action === "reject") {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "draft",
        })
        .eq("id", post_id);

      if (error) throw error;

    } else if (action === "draft") {
      const { error } = await supabase
        .from("posts")
        .update({
          content: edited_content,
          status: "draft",
          image_url: image_url !== undefined ? image_url : undefined,
        })
        .eq("id", post_id);

      if (error) throw error;

    } else if (action === "edit") {
      if (!edited_content) {
        return NextResponse.json({ error: "edited_content is required for edit action" }, { status: 400 });
      }
      
      const { error } = await supabase
        .from("posts")
        .update({
          content: edited_content,
          status: "approved",
          approved_by: user.id,
          approved_at: now.toISOString(),
          scheduled_at: scheduledTime,
          image_url: image_url !== undefined ? image_url : undefined,
        })
        .eq("id", post_id);

      if (error) throw error;
      
    } else if (action === "update-image") {
      const { error } = await supabase
        .from("posts")
        .update({
          image_url: image_url,
        })
        .eq("id", post_id);

      if (error) throw error;

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Invalidate dashboard actions cache since queue changed
    await supabase.from("businesses").update({
      dashboard_actions_updated_at: null
    }).eq("id", post.business_id || "");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve Post API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
