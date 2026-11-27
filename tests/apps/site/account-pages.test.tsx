/**
 * Tests for the account-related App Router pages.
 *
 * The interactive children are stubbed so these tests only assert that each
 * route exists, mounts the right component and exposes metadata; real rendering
 * of those children is covered by their own component tests.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/components/signOutForm", () => ({
  default: () => <div data-testid="signout-form" />,
}));
vi.mock("@/components/accountProviders", () => ({
  default: () => <div data-testid="account-providers" />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import AccountPage, {
  metadata as accountMetadata,
} from "../../../apps/site/src/app/account/page.js";
import SignOutPage, {
  metadata as signOutMetadata,
} from "../../../apps/site/src/app/signout/page.js";

afterEach(() => {
  cleanup();
});

describe("account route pages", () => {
  it("mounts the provider manager at /account", () => {
    render(<AccountPage />);

    expect(screen.getByTestId("account-providers")).toBeTruthy();
    expect(screen.queryByTestId("signout-form")).toBeNull();
    expect(accountMetadata.title).toBe("Account | Veyra");
  });

  it("mounts the sign-out control at the configured signOut route", () => {
    render(<SignOutPage />);

    expect(screen.getByTestId("signout-form")).toBeTruthy();
    expect(screen.queryByTestId("account-providers")).toBeNull();
    expect(signOutMetadata.title).toBe("Sign out | Veyra");
  });
});
