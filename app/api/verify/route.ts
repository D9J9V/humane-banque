import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WLD_APP_ID = process.env.WLD_APP_ID!;

// Initialize Supabase client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to ensure hex prefix
const ensureHexPrefix = (hash: string) =>
  hash.startsWith("0x") ? hash : `0x${hash}`;

export async function POST(request: Request) {
  try {
    // 1. Authentication Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.sub) {
      console.log("Verification attempt failed: Unauthorized (No session/sub)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const nextAuthSub = session.user.sub;

    // 2. Get the verification payload from the frontend
    const verificationPayload = await request.json();
    console.log("Received verification payload:", JSON.stringify(verificationPayload));

    // 3. Basic validation
    if (
      !verificationPayload ||
      !verificationPayload.proof ||
      !verificationPayload.merkle_root ||
      !verificationPayload.nullifier_hash ||
      !verificationPayload.verification_level
    ) {
      console.error(
        "Invalid payload received from client:",
        verificationPayload,
      );
      return NextResponse.json(
        { error: "Missing required fields in verification payload" },
        { status: 400 },
      );
    }

    // 4. Prepare World ID API call
    const verifyUrl = `https://developer.worldcoin.org/api/v2/verify/${WLD_APP_ID}`;
    console.log("Using verification URL:", verifyUrl);
    console.log("Using World ID App ID:", WLD_APP_ID);
    const actionName = "verify-humane-banque";

    // Prepare the World ID payload exactly as specified in the API docs
    // Note: When no signal is provided, World ID API uses the hash of an empty string by default
    const worldIdPayload = {
      nullifier_hash: ensureHexPrefix(verificationPayload.nullifier_hash),
      merkle_root: ensureHexPrefix(verificationPayload.merkle_root),
      proof: ensureHexPrefix(verificationPayload.proof),
      verification_level: verificationPayload.verification_level,
      action: actionName,
      // Omitting signal_hash to use the default (hash of empty string)
    };

    console.log("Sending payload to World ID:", JSON.stringify(worldIdPayload));

    // 5. Call the World ID Verification API (V2)
    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Humane-Banque-MiniApp/1.0",
      },
      body: JSON.stringify(worldIdPayload),
    });

    // 6. Process the response
    const verifyResultJson = await verifyRes.json();
    console.log("World ID V2 Verification Response Status:", verifyRes.status);
    console.log(
      "World ID V2 Verification Response Body:",
      JSON.stringify(verifyResultJson),
    );

    // 7. Handle error response
    if (!verifyRes.ok) {
      const errorDetail =
        (verifyResultJson as { detail?: string }).detail ||
        "Unknown verification error from World ID V2";
      const errorCode = (verifyResultJson as { code?: string }).code;
      console.error(
        "World ID V2 Verification Failed:",
        "Status:",
        verifyRes.status,
        "Full Response:",
        JSON.stringify(verifyResultJson),
        "Error Detail:",
        errorDetail,
        "Code:",
        errorCode,
      );
      return NextResponse.json(
        {
          error: `World ID V2 Verification Failed: ${errorDetail}`,
          code: errorCode,
          fullResponse: verifyResultJson,
        },
        { status: verifyRes.status },
      );
    }

    // 8. Extract Verified Nullifier Hash from the successful response
    const verifiedNullifierHash = (
      verifyResultJson as { nullifier_hash?: string }
    ).nullifier_hash;

    if (!verifiedNullifierHash) {
      console.error(
        "Nullifier hash missing from successful World ID V2 response. Body:",
        verifyResultJson,
      );
      return NextResponse.json(
        {
          error:
            "Verification successful but nullifier hash missing in response.",
        },
        { status: 500 },
      );
    }

    // --- Database Operations ---

    // 9. Check defaulter list
    const { data: defaulterCheck, error: defaulterError } = await supabaseAdmin
      .from("defaulters")
      .select("id")
      .eq("nullifier_hash", verifiedNullifierHash)
      .maybeSingle();

    if (defaulterError) {
      console.error("Database error checking defaulter list:", defaulterError);
      return NextResponse.json(
        { error: "Database error checking defaulter status" },
        { status: 500 },
      );
    }
    if (defaulterCheck) {
      console.warn(
        `Verification attempt by defaulted user: ${verifiedNullifierHash}`,
      );
      return NextResponse.json(
        {
          error:
            "Verification failed: Associated identity has previously defaulted.",
        },
        { status: 403 },
      );
    }

    // 10. Find or Create User Profile
    let profile;
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_verified, world_id_nullifier_hash")
      .eq("next_auth_sub", nextAuthSub)
      .maybeSingle();

    if (profileError) {
      console.error("Database error finding profile:", profileError);
      return NextResponse.json(
        { error: "Database error looking up profile" },
        { status: 500 },
      );
    }

    if (!existingProfile) {
      console.log(
        `No profile found for user ${nextAuthSub}. Creating one now.`,
      );
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({ next_auth_sub: nextAuthSub })
        .select("id, is_verified, world_id_nullifier_hash")
        .single();

      if (createError || !newProfile) {
        console.error("Database error creating profile:", createError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 },
        );
      }
      profile = newProfile;
      console.log(`Created new profile ${profile.id} for user ${nextAuthSub}`);
    } else {
      profile = existingProfile;
    }

    // 11. Update Profile if Not Verified
    if (
      !profile.is_verified ||
      profile.world_id_nullifier_hash !== verifiedNullifierHash
    ) {
      if (
        profile.is_verified &&
        profile.world_id_nullifier_hash !== verifiedNullifierHash
      ) {
        console.warn(
          `Profile ${profile.id} was verified with a different nullifier hash. Updating to new hash: ${verifiedNullifierHash}`,
        );
      }

      // Store the complete World ID proof data, ensuring we store data exactly as needed for contracts
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_verified: true,
          world_id_nullifier_hash: verifiedNullifierHash,
          world_id_proof: verificationPayload.proof, // Raw proof string
          world_id_merkle_root: verificationPayload.merkle_root,
          verification_payload: {
            proof: verificationPayload.proof,
            merkle_root: verificationPayload.merkle_root,
            nullifier_hash: verifiedNullifierHash
          }, // Store complete object as JSON for easier retrieval
          last_verification_time: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Database error updating profile:", updateError);
        if (updateError.code === "23505") {
          return NextResponse.json(
            {
              error:
                "This World ID has already been linked to another account.",
            },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: "Failed to update profile verification status" },
          { status: 500 },
        );
      }
      console.log(
        `Profile ${profile.id} successfully verified with hash ${verifiedNullifierHash}.`,
      );
    } else {
      console.log(
        `Profile ${profile.id} was already verified with the correct hash.`,
      );
    }

    // 12. Return Success Response
    return NextResponse.json(
      { success: true, nullifier_hash: verifiedNullifierHash },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Unexpected error in /api/verify route handler:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid JSON payload received from client." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
