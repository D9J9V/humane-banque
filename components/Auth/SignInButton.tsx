"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export const SignInButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        {/* Optional: User info display */}
        {/* <span className="text-sm hidden sm:block">
           {session.user?.name ? `Hi, ${session.user.name.split(" ")[0]}` : "Signed In"}
         </span> */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
            <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
              {/* Placeholder avatar - replace with actual image or initials if available */}
              <span className="text-neutral-content text-xs">
                {session.user?.name?.[0] || "U"}
              </span>
            </div>
          </label>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <span className="justify-between">
                {session.user?.name
                  ? `${session.user.name.split(" ")[0]}`
                  : "Profile"}
                <span className="badge badge-ghost badge-sm">
                  {session.user?.sub?.slice(0, 6) ?? "???"}...
                </span>
              </span>
            </li>
            {/* Add other profile/settings links here */}
            <li>
              <a onClick={() => signOut()}>Logout</a>
            </li>
          </ul>
        </div>

        {/* Original Sign Out button - can be removed if using dropdown */}
        {/* <button
          onClick={() => signOut()}
          className="btn btn-outline btn-error btn-sm"
        >
          Sign Out
        </button> */}
      </div>
    );
  } else {
    return (
      <button
        onClick={() => signIn("worldcoin")}
        className="btn btn-primary btn-sm" // Use DaisyUI button classes
      >
        Sign In
      </button>
    );
  }
};
