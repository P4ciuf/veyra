/**
 * Tests for `apps/site/src/lib/oauth.ts`.
 *
 * The provider ids are shared between the server configuration and the sign-in
 * buttons, so these assertions keep the UI from drifting away from the providers
 * registered by `buildAuthOptions`. The type guard is also checked against
 * untrusted values because it is meant to validate query-string input.
 */
import { describe, expect, it } from "vitest";
import {
  OAUTH_PROVIDER_IDS,
  OAUTH_PROVIDER_OPTIONS,
  isOAuthProviderId,
} from "../../../apps/site/src/lib/oauth";

describe("OAuth provider metadata", () => {
  it("registers exactly the providers built by the NextAuth configuration", () => {
    expect(OAUTH_PROVIDER_IDS).toEqual(["github", "google", "discord"]);
    expect(OAUTH_PROVIDER_OPTIONS.map((option) => option.id)).toEqual(OAUTH_PROVIDER_IDS);
  });

  it("labels every option in display order with the Continue with convention", () => {
    expect(OAUTH_PROVIDER_OPTIONS.map((option) => option.label)).toEqual([
      "Continue with GitHub",
      "Continue with Google",
      "Continue with Discord",
    ]);
  });
});

describe("isOAuthProviderId", () => {
  it("accepts each registered provider id", () => {
    for (const id of OAUTH_PROVIDER_IDS) {
      expect(isOAuthProviderId(id)).toBe(true);
    }
  });

  it("rejects unknown, empty and differently cased values", () => {
    for (const value of ["twitter", "", "GitHub", "github "]) {
      expect(isOAuthProviderId(value)).toBe(false);
    }
  });
});
