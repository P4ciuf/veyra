/**
 * Tests for the route entry points `app/signin/page.tsx` and
 * `app/register/page.tsx`. The form components are stubbed so these tests only
 * assert that each page exists, mounts the right form and exposes metadata.
 * The sign-in server page wraps the client form in a Suspense boundary because
 * the form reads the query string with `useSearchParams`.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/components/signInForm", () => ({
  default: () => <div data-testid="signin-form" />,
}));
vi.mock("@/components/registerForm", () => ({
  default: () => <div data-testid="register-form" />,
}));

import SignInPage, { metadata as signInMetadata } from "../../../apps/site/src/app/signin/page.tsx";
import RegisterPage, {
  metadata as registerMetadata,
} from "../../../apps/site/src/app/register/page.tsx";

afterEach(() => {
  cleanup();
});

describe("account route pages", () => {
  it("mounts the sign-in form at the configured signIn route", () => {
    render(<SignInPage />);

    expect(screen.getByTestId("signin-form")).toBeTruthy();
    expect(screen.queryByTestId("register-form")).toBeNull();
    expect(signInMetadata.title).toBe("Sign in | Veyra");
  });

  it("mounts the registration form at /register", () => {
    render(<RegisterPage />);

    expect(screen.getByTestId("register-form")).toBeTruthy();
    expect(screen.queryByTestId("signin-form")).toBeNull();
    expect(registerMetadata.title).toBe("Create an account | Veyra");
  });
});
