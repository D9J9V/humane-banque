import { signIn, signOut, useSession } from "next-auth/react";

export const SignInButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {/* ... existing dropdown ... */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            {/* ... avatar content ... */}
          </label>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <span className="justify-between">
                {/* Use session.user.sub from the JWT/Session callback */}
                {session.user?.name ?? "Profile"}
                <span className="badge badge-ghost badge-sm">
                  {session.user?.sub?.slice(0, 6) ?? "???"}...
                </span>
              </span>
            </li>
            <li>
              <a onClick={() => signOut()}>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    );
  } else {
    return (
      <button
        // Ensure this 'worldcoin' matches the provider ID in authOptions
        onClick={() => signIn("worldcoin")}
        className="btn btn-primary btn-sm"
      >
        Sign In
      </button>
    );
  }
};
