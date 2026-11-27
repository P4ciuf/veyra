/**
 * Account settings route for reviewing and unlinking OAuth providers.
 *
 * The page is a server component so it can own metadata; the list and the
 * unlink actions are handled by a client component that calls the authenticated
 * account API route. No session data is read during server rendering, so the
 * page stays prerenderable with `cacheComponents` enabled.
 */
import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/authShell";
import AccountProviders from "@/components/accountProviders";
import { ROUTES } from "@/lib/routes";
import styles from "@/components/auth.module.css";

/** Browser-tab metadata for the account page. */
export const metadata: Metadata = {
  title: "Account | Veyra",
  description: "Manage the providers linked to your Veyra account.",
};

/**
 * Renders the account settings screen.
 *
 * @returns The linked-provider manager inside the shared account shell
 */
export default function AccountPage() {
  return (
    <AuthShell
      title="Account"
      description="Review the providers linked to your account and remove the ones you no longer use."
      footer={
        <p>
          <Link className={styles.alertLink} href={ROUTES.signOut}>
            Sign out
          </Link>
        </p>
      }
    >
      <AccountProviders />
    </AuthShell>
  );
}
