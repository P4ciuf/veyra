/**
 * Metadata shared by the NextAuth configuration and the sign-in screen.
 * Keeping the provider ids in one place prevents the UI from offering an
 * option that the server handler does not register (and vice versa).
 */

/** Provider ids registered by `buildAuthOptions`. */
export const OAUTH_PROVIDER_IDS = ["github", "google", "discord"] as const;

/** A provider id accepted by `signIn()` on the sign-in screen. */
export type OAuthProviderId = (typeof OAUTH_PROVIDER_IDS)[number];

/** One provider button rendered on the sign-in screen. */
export interface OAuthProviderOption {
  /** NextAuth provider id passed to `signIn()`. */
  id: OAuthProviderId;
  /** Accessible, visible button label. */
  label: string;
}

/** Provider buttons in display order; labels follow the "Continue with …" convention. */
export const OAUTH_PROVIDER_OPTIONS: readonly OAuthProviderOption[] = [
  { id: "github", label: "Continue with GitHub" },
  { id: "google", label: "Continue with Google" },
  { id: "discord", label: "Continue with Discord" },
];

/**
 * Type guard for a value coming from untrusted input (for example a query string).
 *
 * @param value - Candidate provider id
 * @returns `true` only when `value` matches a registered provider id
 * @example
 * isOAuthProviderId("github"); // true
 * isOAuthProviderId("twitter"); // false
 */
export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return (OAUTH_PROVIDER_IDS as readonly string[]).includes(value);
}
