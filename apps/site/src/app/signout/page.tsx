/**
 * Sign-out route served at the path configured as NextAuth's `pages.signOut`.
 * The page owns metadata and the shared account shell; the button that calls
 * `signOut()` lives in a dedicated client component.
 */
import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/authShell";
import SignOutForm from "@/components/signOutForm";
import { ROUTES } from "@/lib/routes";
import styles from "@/components/auth.module.css";

/** Browser-tab metadata for the sign-out page. */
export const metadata: Metadata = {
  title: "Sign out | Veyra",
  description: "End your Veyra session.",
};

/**
 * Renders the sign-out confirmation screen.
 *
 * @returns The sign-out control inside the shared account shell
 */
export default function SignOutPage() {
  return (
    <AuthShell
      title="Sign out"
      description="End your session on this device."
      footer={
        <p>
          <Link className={styles.alertLink} href={ROUTES.home}>
            Back to home
          </Link>
        </p>
      }
    >
      <SignOutForm />
    </AuthShell>
  );
}
