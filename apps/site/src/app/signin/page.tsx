/**
 * Sign-in route, served at the path configured as NextAuth's `pages.signIn`.
 * The page is a server component so it can own metadata; the interactive form
 * lives in a dedicated client component. The form reads `?error=` with
 * `useSearchParams`, so it is wrapped in Suspense to keep the route
 * prerenderable with `cacheComponents` enabled.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import SignInForm from "@/components/signInForm";

/** Browser-tab metadata for the sign-in page. */
export const metadata: Metadata = {
  title: "Sign in | Veyra",
  description: "Sign in to your Veyra account to submit bots and manage downloads.",
};

/**
 * Renders the sign-in screen inside a Suspense boundary.
 *
 * @returns The client-side sign-in form with a streaming fallback
 */
export default function SignInPage() {
  return (
    <Suspense fallback={<p>Loading sign-in…</p>}>
      <SignInForm />
    </Suspense>
  );
}
