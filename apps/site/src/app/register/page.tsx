/**
 * Registration route. No NextAuth `pages` entry exists for registration, so the
 * page follows the same convention as `/signin` and calls the existing API route.
 * The page is a server component so it can own metadata; the interactive form
 * lives in a dedicated client component.
 */
import type { Metadata } from "next";
import RegisterForm from "@/components/registerForm";

/** Browser-tab metadata for the registration page. */
export const metadata: Metadata = {
  title: "Create an account | Veyra",
  description: "Create a Veyra account to submit bots and manage your downloads.",
};

/**
 * Renders the registration screen.
 *
 * @returns The client-side registration form inside the shared auth shell
 */
export default function RegisterPage() {
  return <RegisterForm />;
}
