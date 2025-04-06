import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.sub) {
      return NextResponse.json({ isVerified: false }, { status: 401 });
    }

    // Look up the user's profile in Supabase including World ID proof data
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_verified, world_id_nullifier_hash, world_id_proof, world_id_merkle_root, verification_payload")
      .eq("next_auth_sub", session.user.sub)
      .maybeSingle();

    if (error) {
      console.error("Error fetching verification status:", error);
      return NextResponse.json(
        { error: "Failed to check verification status" },
        { status: 500 },
      );
    }

    // Return the verification status and World ID proof data for contract interactions
    let worldIdProof = null;
    
    if (profile?.is_verified) {
      // Use the stored verification_payload object if available
      if (profile.verification_payload) {
        worldIdProof = profile.verification_payload;
      } else {
        // Fall back to constructing from individual fields
        worldIdProof = {
          proof: profile.world_id_proof,
          merkle_root: profile.world_id_merkle_root,
          nullifier_hash: profile.world_id_nullifier_hash
        };
      }
    }

    return NextResponse.json({
      isVerified: profile?.is_verified || false,
      worldIdProof
    });
  } catch (error: any) {
    console.error("Unexpected error checking verification status:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
