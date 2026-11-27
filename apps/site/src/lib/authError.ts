/**
 * Maps NextAuth error codes to short, user-facing messages.
 *
 * Raw codes, provider descriptions and stack traces are deliberately never
 * rendered: NextAuth already logs them server-side, and echoing them in the UI
 * can leak provider internals or confirm which accounts exist.
 */

/** Messages for the error codes NextAuth can place in `?error=`. */
const AUTH_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  /** No email auto-link is allowed, so the provider identity must be linked explicitly. */
  OAuthAccountNotLinked:
    "This provider is not linked to your account yet. Sign in with your usual method first, then try again.",
  /** The user declined consent at the provider or the callback could not be verified. */
  AccessDenied: "Sign-in was cancelled or denied. Please try again if you changed your mind.",
  /** Missing or invalid client credentials / secret on the server. */
  Configuration: "Sign-in is not configured correctly at the moment. Please try again later.",
  /** Provider returned an error or an invalid callback (state, nonce or PKCE check). */
  OAuthCallback: "The provider could not complete sign-in. Please try again.",
  /** Generic callback failure, including a cancelled consent at some providers. */
  Callback: "Sign-in could not be completed. Please try again.",
  /** The provider profile could not be turned into a user. */
  OAuthCreateAccount: "We could not create your account from this provider. Please try again.",
  /** Raised for email-provider flows; kept for a complete mapping. */
  EmailCreateAccount: "We could not create your account. Please try again.",
  /** Initial redirect to the provider failed. */
  OAuthSignin: "We could not start sign-in with that provider. Please try again.",
  /** Verification token error for email-provider flows. */
  Verification: "The sign-in link is invalid or has expired. Please request a new one.",
};

/** Generic fallback used for unknown or absent codes. */
const GENERIC_MESSAGE = "We could not sign you in. Please try again.";

/**
 * Resolves a safe message for a NextAuth error code.
 *
 * @param code - The `error` query parameter, or `null` when there is none
 * @returns A user-facing message, or `null` when no error should be displayed
 * @example
 * readAuthErrorMessage("OAuthAccountNotLinked"); // "This provider is not linked ..."
 * readAuthErrorMessage(undefined); // null
 */
export function readAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  return AUTH_ERROR_MESSAGES[code] ?? GENERIC_MESSAGE;
}

/** Message used when the client-side `signIn()` promise itself rejects. */
export const PROVIDER_FAILURE_MESSAGE =
  "We could not start sign-in with that provider. Please try again.";
