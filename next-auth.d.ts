// types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt"; // Import even if only extending Session/User for consistency

declare module "next-auth" {
  /**
   * Extends the built-in session types to include the 'sub' property from World ID.
   */
  interface Session {
    user: {
      sub: string; // The user's World ID unique identifier (Subject ID)
    } & DefaultSession["user"]; // Keep the default properties like name?, email?, image?
    id_token?: string; // Optional: if you pass the ID token to the session
  }

  /**
   * Extends the built-in User model type.
   */
  interface User {
    // This ensures the user object passed during sign-in callbacks has 'sub'
    sub: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type.
   */
  interface JWT {
    // This ensures the token object in the jwt callback has 'sub'
    sub: string;
    id_token?: string; // Optional: if you store the ID token in the JWT
  }
}
