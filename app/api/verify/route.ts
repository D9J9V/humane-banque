import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust path if needed
import { createClient } from "@supabase/supabase-js";

// Ensure these are loaded server-side from environment variables
// Use the names consistent with your .env.local file
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WLD_APP_ID = process.env.WLD_APP_ID!;

// Initialize Supabase client with Service Role Key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  try {
    // 1. Authentication Check: Ensure user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const nextAuthSub = session.user.sub; // Keep for DB operations

    // 2. Get the *entire* verification payload object from the frontend request
    const verificationPayload = await request.json();

    // 3. Basic validation on the received payload object
    if (
      !verificationPayload || // Check if payload exists
      !verificationPayload.proof ||
      !verificationPayload.merkle_root ||
      !verificationPayload.nullifier_hash ||
      !verificationPayload.verification_level
      // Optional: !verificationPayload.signal if signal is always expected
    ) {
      console.error(
        "Invalid payload received from client:",
        verificationPayload,
      );
      return NextResponse.json(
        {
          error:
            "Missing expected fields in verification payload from client (proof, merkle_root, nullifier_hash, verification_level required)",
        },
        { status: 400 },
      );
    }

    // 4. Call World ID Developer Portal /verify Endpoint
    const verifyUrl = `https://developer.worldcoin.org/api/v1/verify/${WLD_APP_ID}`;
    const actionName = "verify-humane-banque"; // Define action name clearly

    console.log(`Verifying with World ID API V1 for Action: ${actionName}`, {
      WLD_APP_ID,
      // Log key identifiers from the received payload for debugging
      signal: verificationPayload.signal,
      nullifier_hash: verificationPayload.nullifier_hash,
      verification_level: verificationPayload.verification_level,
    });

    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header needed for V1 /verify typically
      },
      // Pass the received payload directly, ensuring the action is correctly set/overridden
      body: JSON.stringify({
        ...verificationPayload, // Spread all fields received from frontend
        action: actionName, // Ensure the correct action name is sent
      }),
    });

    const verifyResultJson = await verifyRes.json();
    console.log("World ID Verification Response Status:", verifyRes.status);
    console.log("World ID Verification Response Body:", verifyResultJson);

    if (!verifyRes.ok) {
      const errorDetail =
        (verifyResultJson as { detail?: string }).detail ||
        "Unknown verification error from World ID";
      const errorCode = (verifyResultJson as { code?: string }).code;
      console.error(
        "World ID Verification Failed:",
        errorDetail,
        "Code:",
        errorCode,
      );
      // Pass back the specific error from World ID
      return NextResponse.json(
        {
          error: `World ID Verification Failed: ${errorDetail}`,
          code: errorCode,
        },
        { status: verifyRes.status },
      );
    }

    // 5. Extract Verified Nullifier Hash (needed for DB logic)
    // Note: Use the nullifier hash returned by the *World ID API* response, not the one sent by the client initially
    const verifiedNullifierHash = (
      verifyResultJson as { nullifier_hash?: string }
    ).nullifier_hash;

    if (!verifiedNullifierHash) {
      console.error(
        "Nullifier hash missing from successful World ID response (Status 200). Body:",
        verifyResultJson,
      );
      return NextResponse.json(
        {
          error:
            "Verification successful but nullifier hash missing in World ID response.",
        },
        { status: 500 },
      );
    }

    // --- Database Operations (Using nextAuthSub and verifiedNullifierHash) ---

    // 6. Check Defaulter List
    const { data: defaulterCheck, error: defaulterError } = await supabaseAdmin
      .from("defaulters")
      .select("id")
      .eq("nullifier_hash", verifiedNullifierHash)
      .maybeSingle();

    if (defaulterError) {
      console.error("Error checking defaulter list:", defaulterError);
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
        { status: 403 }, // Forbidden
      );
    }

    // 7. Find or Create User Profile
    let profile;
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_verified, world_id_nullifier_hash") // Select existing hash too
      .eq("next_auth_sub", nextAuthSub) // Find by the logged-in user's ID
      .maybeSingle();

    if (profileError) {
      console.error("Error finding profile:", profileError);
      return NextResponse.json(
        { error: "Database error looking up profile" },
        { status: 500 },
      );
    }

    if (!existingProfile) {
      // Create profile if it doesn't exist
      console.log(
        `No profile found for user ${nextAuthSub}. Creating one now.`,
      );
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({ next_auth_sub: nextAuthSub }) // Only insert necessary fields
        .select("id, is_verified, world_id_nullifier_hash")
        .single();

      if (createError || !newProfile) {
        console.error("Error creating profile:", createError);
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

    // 8. Update Profile if Not Verified (or if nullifier changed - optional check)
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

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_verified: true,
          world_id_nullifier_hash: verifiedNullifierHash, // Store the verified hash from World ID API
        })
        .eq("id", profile.id); // Update using the profile's primary key

      if (updateError) {
        console.error(
          "Error updating profile verification status:",
          updateError,
        );
        if (updateError.code === "23505") {
          // Handle unique constraint violation on nullifier hash
          return NextResponse.json(
            {
              error:
                "This World ID has already been linked to another account.",
            },
            { status: 409 }, // Conflict
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

    // 9. Return Success Response
    return NextResponse.json(
      { success: true, nullifier_hash: verifiedNullifierHash },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Unexpected error in /api/verify:", error);
    // Check if the error is due to invalid JSON in the request
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
