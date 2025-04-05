import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust path if needed
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

// Ensure these are loaded server-side from environment variables
// Use the names consistent with your .env.local file
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WLD_APP_ID = process.env.WLD_APP_ID!; // Your World ID App ID from environment variables

// Initialize Supabase client with Service Role Key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function hashSignal(signal: string): string {
  return ethers.solidityPackedKeccak256(["string"], [signal]);
}

export async function POST(request: Request) {
  try {
    // 1. Authentication Check: Ensure user is logged in via NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.sub) {
      // If no session or no 'sub' identifier, user is not authorized
      console.log("Verification attempt failed: Unauthorized (No session/sub)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const nextAuthSub = session.user.sub; // Logged-in user's identifier

    // 2. Get the verification payload object from the frontend request body
    // This payload should contain the *raw* signal sent by the client
    const verificationPayload = await request.json();

    // 3. Basic validation on the received payload object from the client
    if (
      !verificationPayload || // Check if payload exists
      !verificationPayload.proof ||
      !verificationPayload.merkle_root ||
      !verificationPayload.nullifier_hash ||
      !verificationPayload.verification_level ||
      !verificationPayload.signal // Ensure raw signal is present
    ) {
      // Log the invalid payload for debugging
      console.error(
        "Invalid or incomplete payload received from client:",
        verificationPayload,
      );
      return NextResponse.json(
        {
          error:
            "Missing expected fields in verification payload from client (proof, merkle_root, nullifier_hash, verification_level, signal required)",
        },
        { status: 400 }, // Bad Request
      );
    }

    // 4. Calculate the signal_hash from the received raw signal
    const rawSignal = verificationPayload.signal; // The raw signal (e.g., user ID) from the frontend
    const signalHash = hashSignal(rawSignal); // Calculate the Keccak-256 hash

    // 5. Prepare to call World ID Developer Portal /verify Endpoint - Using API V2
    const verifyUrl = `https://developer.worldcoin.org/api/v2/verify/${WLD_APP_ID}`; // Use v2 endpoint
    const actionName = "verify-humane-banque"; // Define action name clearly - MUST match Dev Portal

    // Log key identifiers being sent to World ID API for debugging, including the *hashed* signal
    console.log(`Verifying with World ID API V2 for Action: ${actionName}`, {
      WLD_APP_ID,
      nullifier_hash: verificationPayload.nullifier_hash,
      merkle_root: verificationPayload.merkle_root,
      proof: verificationPayload.proof,
      verification_level: verificationPayload.verification_level,
      action: actionName, // Action Name configured in Dev Portal
      signal_hash: signalHash, // Log the level from the client
    });

    // 6. Call the World ID Verification API (V2)
    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header needed for V2 /verify typically
      },
      // Construct the body according to the curl example: send signal_hash, not raw signal
      body: JSON.stringify({
        nullifier_hash: verificationPayload.nullifier_hash,
        merkle_root: verificationPayload.merkle_root,
        proof: verificationPayload.proof,
        verification_level: verificationPayload.verification_level,
        action: actionName, // Action Name configured in Dev Portal
        signal_hash: signalHash, // <-- Send the calculated hash
      }),
    });

    // 7. Process the response from the World ID API
    const verifyResultJson = await verifyRes.json();
    console.log("World ID V2 Verification Response Status:", verifyRes.status);
    console.log("World ID V2 Verification Response Body:", verifyResultJson);

    // Handle failed verification attempts reported by World ID API
    if (!verifyRes.ok) {
      const errorDetail =
        (verifyResultJson as { detail?: string }).detail ||
        "Unknown verification error from World ID V2";
      const errorCode = (verifyResultJson as { code?: string }).code;
      console.error(
        "World ID V2 Verification Failed:",
        errorDetail,
        "Code:",
        errorCode,
      );
      // Return the specific error from World ID API to the client
      return NextResponse.json(
        {
          error: `World ID V2 Verification Failed: ${errorDetail}`,
          code: errorCode,
        },
        { status: verifyRes.status }, // Use the status code returned by World ID API (e.g., 400)
      );
    }

    // 8. Extract Verified Nullifier Hash from the successful World ID API response
    // IMPORTANT: Use the nullifier hash returned by the API for security/DB operations
    const verifiedNullifierHash = (
      verifyResultJson as { nullifier_hash?: string }
    ).nullifier_hash;

    // Optional: Check 'verified' field if present in v2 response (belt-and-suspenders check)
    const isVerifiedByApi = (verifyResultJson as { verified?: boolean })
      .verified;
    if (isVerifiedByApi === false) {
      // Check if verified field is present and explicitly false
      console.error(
        "World ID V2 response indicates not verified, even with status 200. Body:",
        verifyResultJson,
      );
      return NextResponse.json(
        {
          error: "World ID V2 API reported verification failed despite 200 OK.",
        },
        { status: 500 },
      );
    }

    // Ensure nullifier hash is present in the successful response
    if (!verifiedNullifierHash) {
      console.error(
        "Nullifier hash missing from successful World ID V2 response (Status 200). Body:",
        verifyResultJson,
      );
      return NextResponse.json(
        {
          error:
            "Verification successful but nullifier hash missing in World ID V2 response.",
        },
        { status: 500 }, // Internal Server Error - unexpected response format
      );
    }

    // --- Database Operations (Using nextAuthSub from session and verifiedNullifierHash from World ID API) ---

    // 9. Check if the verified World ID hash is on the defaulter list
    const { data: defaulterCheck, error: defaulterError } = await supabaseAdmin
      .from("defaulters")
      .select("id")
      .eq("nullifier_hash", verifiedNullifierHash)
      .maybeSingle(); // Handles 0 or 1 result gracefully

    if (defaulterError) {
      console.error("Database error checking defaulter list:", defaulterError);
      return NextResponse.json(
        { error: "Database error checking defaulter status" },
        { status: 500 },
      );
    }
    if (defaulterCheck) {
      // If a record exists, this user (identified by nullifier hash) has defaulted previously
      console.warn(
        `Verification attempt by defaulted user (nullifier hash): ${verifiedNullifierHash}`,
      );
      return NextResponse.json(
        {
          error:
            "Verification failed: Associated identity has previously defaulted.",
        },
        { status: 403 }, // Forbidden status code
      );
    }

    // 10. Find or Create User Profile in Supabase linked to NextAuth identity
    let profile;
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, is_verified, world_id_nullifier_hash") // Select existing verification status and hash
      .eq("next_auth_sub", nextAuthSub) // Find profile using the logged-in user's NextAuth subject ID
      .maybeSingle();

    if (profileError) {
      console.error("Database error finding profile:", profileError);
      return NextResponse.json(
        { error: "Database error looking up profile" },
        { status: 500 },
      );
    }

    if (!existingProfile) {
      // If no profile exists for this NextAuth user, create one
      console.log(
        `No profile found for user ${nextAuthSub}. Creating one now.`,
      );
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({ next_auth_sub: nextAuthSub }) // Insert based on NextAuth subject ID
        .select("id, is_verified, world_id_nullifier_hash") // Select the fields of the newly created row
        .single(); // Expect exactly one row to be created

      if (createError || !newProfile) {
        console.error("Database error creating profile:", createError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 },
        );
      }
      profile = newProfile; // Use the newly created profile data
      console.log(`Created new profile ${profile.id} for user ${nextAuthSub}`);
    } else {
      // Use the existing profile data
      profile = existingProfile;
    }

    // 11. Update Profile if Not Verified or if nullifier hash has changed
    //    (Handles re-verification or linking World ID to an existing account)
    if (
      !profile.is_verified ||
      profile.world_id_nullifier_hash !== verifiedNullifierHash
    ) {
      // Log if we are updating a hash for an already verified user (should be rare)
      if (
        profile.is_verified &&
        profile.world_id_nullifier_hash !== verifiedNullifierHash
      ) {
        console.warn(
          `Profile ${profile.id} was verified with a different nullifier hash (${profile.world_id_nullifier_hash}). Updating to new hash: ${verifiedNullifierHash}`,
        );
      }

      // Update the profile row identified by its primary key ('id')
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_verified: true, // Mark as verified
          world_id_nullifier_hash: verifiedNullifierHash, // Store the verified nullifier hash from World ID
        })
        .eq("id", profile.id); // Ensure we update the correct profile row

      if (updateError) {
        console.error(
          "Database error updating profile verification status:",
          updateError,
        );
        // Handle potential unique constraint violation on 'world_id_nullifier_hash'
        // This means another user profile already has this nullifier hash linked
        if (updateError.code === "23505") {
          // Check for PostgreSQL unique violation error code
          return NextResponse.json(
            {
              error:
                "This World ID has already been linked to another account.",
            },
            { status: 409 }, // Conflict status code
          );
        }
        // Handle other database update errors
        return NextResponse.json(
          { error: "Failed to update profile verification status" },
          { status: 500 },
        );
      }
      console.log(
        `Profile ${profile.id} successfully verified with hash ${verifiedNullifierHash}.`,
      );
    } else {
      // Profile was already verified with the correct nullifier hash
      console.log(
        `Profile ${profile.id} was already verified with the correct hash.`,
      );
    }

    // 12. Return Success Response to the client
    // Include the verified nullifier hash, which might be useful client-side
    return NextResponse.json(
      { success: true, nullifier_hash: verifiedNullifierHash },
      { status: 200 }, // OK status
    );
  } catch (error: any) {
    // Catch-all for unexpected errors during the process
    console.error("Unexpected error in /api/verify route handler:", error);
    // Check if the error is due to invalid JSON being received in the request body
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid JSON payload received from client." },
        { status: 400 },
      );
    }
    // Return a generic internal server error response
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
} // End of POST function
