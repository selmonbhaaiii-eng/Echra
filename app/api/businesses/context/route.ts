import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateContextCompletion } from "@/lib/ai/context-builder";

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    
    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get business for this user
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_context")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 3. Parse body — partial context update
    const body = await request.json();
    
    // 4. Merge with existing business_context JSONB
    const currentContext = (business.business_context as any) || {};
    const mergedContext = { ...currentContext, ...body };
    
    // 5. Recalculate completion percentage
    const newPercent = calculateContextCompletion(mergedContext);

    // 6. Update businesses table
    const { error } = await supabase
      .from("businesses")
      .update({
        business_context: mergedContext,
        context_completion_percent: newPercent,
        context_completed: newPercent >= 70,
      })
      .eq("id", business.id);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // 7. Return success
    return NextResponse.json({ success: true, completion: newPercent });
  } catch (error) {
    console.error("Context Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
