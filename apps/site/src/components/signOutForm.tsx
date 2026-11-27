/**
 * Client-side sign-out control for the page configured as NextAuth's
 * `pages.signOut`. The actual session invalidation is delegated to
 * `signOut()` from `next-auth/react`; this component owns only the pending,
 * error and locked states so the user gets feedback if the POST fails.
 */
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ROUTES } from "@/lib/routes";
import styles from "./auth.module.css";

/**
 * Renders the sign-out button and a link back to sign-in.
 *
 * @returns The accessible sign-out card content
 */
export default function SignOutForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Invalidates the session and returns to the landing page. */
  async function handleSignOut(): Promise<void> {
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // A full redirect is intentional: NextAuth clears the cookie and returns
      // the final URL, so no client-side session state needs to be updated.
      await signOut({ callbackUrl: ROUTES.home, redirect: true });
      // Normally the redirect unmounts the page; clearing the flag keeps the
      // button usable if the browser does not navigate.
      setBusy(false);
    } catch {
      // The button stays usable: a failed POST leaves the session untouched.
      setError("Unable to sign out right now. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.form}>
      {error ? (
        <p className={styles.alert} role="alert">
          <span className={styles.alertText}>{error}</span>
        </p>
      ) : null}
      <button
        type="button"
        className={styles.submit}
        onClick={() => void handleSignOut()}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      <p className={styles.footer}>
        Changed your mind?{" "}
        <a className={styles.alertLink} href={ROUTES.signIn}>
          Sign in
        </a>
      </p>
    </div>
  );
}
