import { signIn, signOut, useSession } from "next-auth/react";

export const SignInButton = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar bg-primary/10">
            <div className="rounded-full">
              <div className="flex h-full w-full items-center justify-center text-primary font-bold">
                {session.user?.name?.charAt(0) || "?"}
              </div>
            </div>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2"
          >
            <li className="menu-title font-medium">
              <span>
                {session.user?.name ?? "Profile"}
              </span>
              <span className="badge badge-sm badge-outline badge-primary">
                {session.user?.sub?.slice(0, 6) ?? "???"}...
              </span>
            </li>
            <li className="mt-2">
              <a 
                onClick={() => signOut()}
                className="text-error hover:bg-error/10"
              >
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  } else {
    return (
      <button
        onClick={() => signIn("worldcoin")}
        className="btn btn-primary btn-sm rounded-full px-4 shadow-sm"
      >
        Verify with World ID
      </button>
    );
  }
};
