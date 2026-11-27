/**
 * Tests for the public-facing error mapping used by the sign-in screen.
 * The mapping must stay generic: raw NextAuth codes and provider text are
 * logged server-side and must never be rendered verbatim in the UI.
 */
import { describe, expect, it } from "vitest";
import {
  PROVIDER_FAILURE_MESSAGE,
  readAuthErrorMessage,
} from "../../../apps/site/src/lib/authError";

describe("readAuthErrorMessage", () => {
  it("returns null when there is no error code", () => {
    expect(readAuthErrorMessage(undefined)).toBeNull();
    expect(readAuthErrorMessage(null)).toBeNull();
    expect(readAuthErrorMessage("")).toBeNull();
  });

  it("explains the safe account-linking decision without revealing account data", () => {
    const message = readAuthErrorMessage("OAuthAccountNotLinked");
    expect(message).toContain("not linked");
    expect(message).toContain("Sign in with your usual method first");
    expect(message).not.toContain("OAuthAccountNotLinked");
  });

  it("maps provider, cancellation and configuration failures to safe messages", () => {
    for (const code of ["OAuthCallback", "Callback", "OAuthSignin"]) {
      const message = readAuthErrorMessage(code);
      expect(message).toBeTruthy();
      expect(message).not.toContain(code);
    }
    expect(readAuthErrorMessage("AccessDenied")).toContain("cancelled or denied");
    expect(readAuthErrorMessage("Configuration")).toContain("not configured correctly");
  });

  it("uses a generic fallback for unknown codes", () => {
    expect(readAuthErrorMessage("some.internal.detail=secret")).toBe(
      "We could not sign you in. Please try again.",
    );
  });

  it("exposes one generic message for a rejected client-side redirect", () => {
    expect(PROVIDER_FAILURE_MESSAGE).toBe(
      "We could not start sign-in with that provider. Please try again.",
    );
  });
});
