"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/**
 * Landing page served at `/`.
 *
 * The page is a placeholder; the real Veyra catalog experience described in
 * `README.md` and `ROADMAP.md` is not implemented yet. It is a client component
 * because navigation is triggered from a button click: `redirect` from
 * `next/navigation` performs a server-side redirect during render and cannot
 * be used as an event handler.
 *
 * @returns The placeholder home page with a client-side sign-in navigation button
 */
export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <button
        className="bg-primary-500 text-primary-500"
        onClick={() => router.push(ROUTES.signIn)}
      >
        Sign In
      </button>
    </div>
  );
}
