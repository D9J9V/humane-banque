import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  useSecureCookies: true, // <--- ADD THIS: Explicitly use secure cookies for HTTPS
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    {
      id: "worldcoin",
      name: "Worldcoin",
      type: "oauth",
      wellKnown: "https://id.worldcoin.org/.well-known/openid-configuration",
      authorization: { params: { scope: "openid" } },
      clientId: process.env.WLD_CLIENT_ID,
      clientSecret: process.env.WLD_CLIENT_SECRET,
      idToken: true,
      checks: ["state", "nonce", "pkce"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.sub,
          sub: profile.sub, // Ensure sub is included for our session usage
          verificationLevel:
            profile["https://id.worldcoin.org/v1"].verification_level,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      // Ensure session.user.sub is available
      if (session.user && token.sub) {
        session.user.sub = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Forward the sub from the user to the token
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn({ user }) {
      return true;
    },
  },
  // --- ADD THIS SECTION for explicit cookie configuration ---
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`, // Use secure prefix
      options: {
        httpOnly: true,
        sameSite: "none", // Important for cross-site context (WebView)
        path: "/",
        secure: true, // Required for SameSite=None
      },
    },
    // Consider adding for others if needed, start with sessionToken
    // callbackUrl: { name: `__Secure-next-auth.callback-url`, options: { sameSite: 'none', path: '/', secure: true } },
    // csrfToken: { name: `__Host-next-auth.csrf-token`, options: { httpOnly: true, sameSite: 'lax', path: '/', secure: true } },
  },
  // ---------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
};
