/**
 * Client-side navigation paths used by the site.
 *
 * `signIn` and `signOut` mirror the `pages` block configured for NextAuth in
 * `src/app/api/auth/[...nextauth]/route.ts`. That module is server-only and is
 * intentionally left untouched, so links target these constants instead of
 * repeating route strings across pages. `register` follows the same naming
 * convention; registration itself is served by the existing API route, not by
 * NextAuth's `pages` configuration.
 */
export const ROUTES = {
  /** Sign-in page, matching `pages.signIn` in the NextAuth handler. */
  signIn: "/signin",
  /** Sign-out route, matching `pages.signOut` in the NextAuth handler. */
  signOut: "/signout",
  /** Registration page; no NextAuth counterpart exists. */
  register: "/register",
  /** Existing registration endpoint called by the registration form. */
  registerApi: "/api/auth/register",
  /** Destination after a successful credentials sign-in. */
  home: "/",
} as const;

/** Union of every path exposed by {@link ROUTES}. */
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
