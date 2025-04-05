import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.sub) {
      return NextResponse.json({ isVerified: false }, { status: 401 });
    }

    // Look up the user's profile in Supabase
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_verified")
      .eq("next_auth_sub", session.user.sub)
      .maybeSingle();

    if (error) {
      console.error("Error fetching verification status:", error);
      return NextResponse.json(
        { error: "Failed to check verification status" },
        { status: 500 },
      );
    }

    // Return the verification status
    return NextResponse.json({
      isVerified: profile?.is_verified || false,
    });
  } catch (error: any) {
    console.error("Unexpected error checking verification status:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
