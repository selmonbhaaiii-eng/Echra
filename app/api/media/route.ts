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
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const { data: images, error } = await supabase
      .from("business_images")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ images: images ?? [] });
  } catch (error) {
    console.error("GET /api/media error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const body = await request.json();
    const { url, category, label } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!category || !["product", "store", "staff", "offer"].includes(category)) {
      return NextResponse.json({ error: "Valid category is required" }, { status: 400 });
    }

    const { data: newImage, error } = await supabase
      .from("business_images")
      .insert({
        business_id: businessId,
        url,
        category,
        label: label ? label.trim() : null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, image: newImage });
  } catch (error) {
    console.error("POST /api/media error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const service = createServiceRoleClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const imageId = url.searchParams.get("image_id");

    if (!imageId) {
      return NextResponse.json({ error: "image_id is required" }, { status: 400 });
    }

    // Verify ownership first
    const { data: existingImage, error: fetchError } = await supabase
      .from("business_images")
      .select("id, url")
      .eq("id", imageId)
      .eq("business_id", businessId)
      .single();

    if (fetchError || !existingImage) {
      return NextResponse.json({ error: "Image not found or unauthorized" }, { status: 404 });
    }

    // Delete database record using service client to bypass complex policy issues if any,
    // though the standard client can also delete if RLS policy is set correctly.
    const { error: deleteError } = await service
      .from("business_images")
      .delete()
      .eq("id", imageId)
      .eq("business_id", businessId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/media error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getBusinessId(user.id);
    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, label } = body;

    if (!id) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    // Use service role to bypass missing UPDATE RLS policy
    const adminSupabase = createServiceRoleClient();
    const { data: updatedImage, error } = await adminSupabase
      .from("business_images")
      .update({ label: label ? label.trim() : null })
      .eq("id", id)
      .eq("business_id", businessId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (!updatedImage) {
      return NextResponse.json({ error: "Image not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error("PATCH /api/media error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
