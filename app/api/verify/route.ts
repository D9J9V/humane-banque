import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust path if needed
import { createClient } from "@supabase/supabase-js";
import type { MiniAppVerifyActionSuccessPayload } from "@worldcoin/minikit-js"; // Get the correct type

// Ensure these are loaded server-side from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEV_PORTAL_API_KEY = process.env.DEV_PORTAL_API_KEY!;
const WLD_APP_ID = process.env.NEXT_PUBLIC_WLD_APP_ID!; // Your World ID App ID

// Initialize Supabase client with Service Role Key - ONLY FOR SERVER-SIDE USE
// Consider creating a reusable server-side client instance in a lib file
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  try {
    // 1. Authentication Check: Ensure user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const nextAuthSub = session.user.sub;

    // 2. Get Proof from Request Body
    const {
      proof,
      merkle_root,
      signal,
      nullifier_hash: clientNullifierHash,
    } = await request.json(); // Destructure expected fields from MiniKit

    if (!proof || !merkle_root || !clientNullifierHash) {
      return NextResponse.json(
        { error: "Missing verification parameters" },
        { status: 400 },
      );
    }

    // 3. Call World ID Developer Portal /verify Endpoint
    const verifyUrl = `https://developer.worldcoin.org/api/v1/verify/${WLD_APP_ID}`;
    console.log("Verifying with World ID:", {
      WLD_APP_ID,
      merkle_root,
      clientNullifierHash,
      proof,
      signal,
    }); // Log for debugging

    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEV_PORTAL_API_KEY}`, // Use API Key for auth
      },
      body: JSON.stringify({
        merkle_root: merkle_root,
        nullifier_hash: clientNullifierHash,
        proof: proof,
        signal: signal, // Include signal if you're using one
        action: "verify-humane-banque", // IMPORTANT: Use the Action Name configured in Dev Portal! Ensure it matches your VerifyButton config
        // action_id: "YOUR_ACTION_ID" // DEPRECATED - Use action name string above
      }),
    });

    const verifyResultJson = await verifyRes.json();

    console.log("World ID Verification Response Status:", verifyRes.status);
    console.log("World ID Verification Response Body:", verifyResultJson);

    if (!verifyRes.ok) {
      // Log detailed error from World ID if available
      const errorDetail =
        (verifyResultJson as { code?: string; detail?: string }).detail ||
        "Unknown verification error";
      const errorCode = (verifyResultJson as { code?: string }).code;
      console.error(
        "World ID Verification Failed:",
        errorDetail,
        "Code:",
        errorCode,
      );
      return NextResponse.json(
        {
          error: `World ID Verification Failed: ${errorDetail}`,
          code: errorCode,
        },
        { status: verifyRes.status }, // Use the actual status code from the API
      );
    }

    // If verifyRes.ok is true, the verification was successful according to World ID API
    // Now, extract the nullifier hash directly from the response body
    const verifiedNullifierHash = (
      verifyResultJson as { nullifier_hash?: string }
    ).nullifier_hash;

    if (!verifiedNullifierHash) {
      console.error(
        "Nullifier hash missing from successful World ID response (Status 200)",
      );
      return NextResponse.json(
        {
          error:
            "Verification successful but nullifier hash missing in response.",
        },
        { status: 500 }, // Internal Server Error - unexpected response format
      );
    }

    // --- Database Operations ---

    // 4. Check Defaulter List (Using the verified hash)
    const { data: defaulterCheck, error: defaulterError } = await supabaseAdmin
      .from("defaulters")
      .select("id")
      .eq("nullifier_hash", verifiedNullifierHash)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

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
        { status: 403 },
      ); // Forbidden
    }

    // 5. Find User Profile in Supabase
    let profile;
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_verified") // Select existing status
      .eq("next_auth_sub", nextAuthSub)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 result gracefully

    if (profileError) {
      console.error("Error finding profile:", profileError);
      return NextResponse.json(
        { error: "Database error looking up profile" },
        { status: 500 },
      );
    }

    // If no profile exists, create one
    if (!existingProfile) {
      console.log(
        `No profile found for user ${nextAuthSub}. Creating one now.`,
      );

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({ next_auth_sub: nextAuthSub })
        .select("id, is_verified")
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

    // 6. Update Profile if Not Already Verified
    if (!profile.is_verified) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_verified: true,
          world_id_nullifier_hash: verifiedNullifierHash, // Store the verified hash
        })
        .eq("id", profile.id); // Update using the profile's primary key

      if (updateError) {
        console.error(
          "Error updating profile verification status:",
          updateError,
        );
        // Handle potential unique constraint violation if nullifier hash already exists for another user (should be rare if World ID works)
        if (updateError.code === "23505") {
          // Unique violation code in Postgres
          return NextResponse.json(
            {
              error:
                "This World ID has already been linked to another account.",
            },
            { status: 409 },
          ); // Conflict
        }
        return NextResponse.json(
          { error: "Failed to update profile verification status" },
          { status: 500 },
        );
      }
      console.log(`Profile ${profile.id} successfully verified.`);
    } else {
      console.log(`Profile ${profile.id} was already verified.`);
      // Optional: Check if stored nullifier matches the newly verified one. Log warning if different.
    }

    // 7. Return Success Response
    return NextResponse.json(
      { success: true, nullifier_hash: verifiedNullifierHash },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Unexpected error in /api/verify:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
