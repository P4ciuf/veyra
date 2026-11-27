/**
 * Tests for `apps/site/src/components/signOutForm.tsx`.
 *
 * `next-auth/react` is mocked at the boundary that clears the cookie; the
 * component's own pending, locked and error states are exercised with real
 * rendering and pointer events in jsdom.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("next-auth/react", () => ({ signOut: mocks.signOut }));

import SignOutForm from "../../../apps/site/src/components/signOutForm.js";

beforeEach(() => {
  mocks.signOut.mockReset();
  mocks.signOut.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe("SignOutForm", () => {
  it("calls signOut with the home callback when the button is pressed", async () => {
    render(<SignOutForm />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/", redirect: true });
    });
  });

  it("locks the button while the sign-out call is pending", async () => {
    let release!: () => void;
    mocks.signOut.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    render(<SignOutForm />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    const pending = screen.getByRole("button", { name: "Signing out…" });
    expect(pending).toHaveProperty("disabled", true);
    expect(pending.getAttribute("aria-busy")).toBe("true");

    release();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign out" })).not.toHaveProperty("disabled", true);
    });
  });

  it("shows an accessible error and allows a retry when signOut rejects", async () => {
    mocks.signOut.mockRejectedValue(new Error("csrf failed"));
    render(<SignOutForm />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Unable to sign out right now. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).not.toHaveProperty("disabled", true);
  });
});
