import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password || typeof password !== "string") {
            return NextResponse.json({ ok: false, message: "Password required" }, { status: 400 });
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("staff_settings")
            .select("value")
            .eq("key", "staff_password")
            .single();

        if (error || !data) {
            return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
        }

        if (data.value === password) {
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: false, message: "Incorrect password" }, { status: 401 });
    } catch {
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
