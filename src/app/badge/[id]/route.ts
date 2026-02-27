import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("badge_mappings")
            .select("luma_url")
            .eq("badge_code", id)
            .single();

        if (error || !data?.luma_url) {
            return NextResponse.redirect(new URL("/unlinked", _request.url));
        }

        return NextResponse.redirect(data.luma_url, 307);
    } catch {
        return NextResponse.redirect(new URL("/unlinked", _request.url));
    }
}
