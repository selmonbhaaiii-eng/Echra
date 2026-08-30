import { NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/sync/review-sync";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await request.json();
    if (!businessId) {
      return NextResponse.json({ error: "Missing business ID" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .single();

    if (!business || !business.gbp_connected || !business.gbp_location_name) {
      return NextResponse.json({ error: "Business not connected to GBP or missing location name" }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(business as any);
    
    // Fetch the specific location they are connected to
    const res = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${business.gbp_location_name}?readMask=name,title`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch location from Google API");
    }
    
    const location = await res.json();
    const locationLabel = location.title || location.name;

    const service = createServiceRoleClient();
    await service
      .from("businesses")
      .update({
        name: locationLabel,
      })
      .eq("id", businessId);

    return NextResponse.json({ success: true, name: locationLabel });
  } catch (error: any) {
    console.error("Sync GBP Profile Error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync profile" }, { status: 500 });
  }
}
