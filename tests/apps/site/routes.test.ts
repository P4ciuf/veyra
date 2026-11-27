/**
 * Tests for `apps/site/src/lib/routes.ts`.
 * The constants are the frontend's single source of truth for account paths;
 * these assertions keep `signIn`/`signOut` aligned with the NextAuth `pages`
 * configuration and pin the registration convention.
 */
import { describe, expect, it } from "vitest";
import { ROUTES } from "../../../apps/site/src/lib/routes";

describe("ROUTES", () => {
  it("matches the paths configured in the NextAuth pages block", () => {
    expect(ROUTES.signIn).toBe("/signin");
    expect(ROUTES.signOut).toBe("/signout");
  });

  it("uses the same naming convention for the registration page and endpoint", () => {
    expect(ROUTES.register).toBe("/register");
    expect(ROUTES.registerApi).toBe("/api/auth/register");
  });

  it("sends both login methods to the same post-login destination", () => {
    expect(ROUTES.home).toBe("/");
  });

  it("exposes the account settings page and its API route", () => {
    expect(ROUTES.account).toBe("/account");
    expect(ROUTES.accountProvidersApi).toBe("/api/account/providers");
  });
});
