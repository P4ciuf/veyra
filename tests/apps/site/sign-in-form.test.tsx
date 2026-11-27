/**
 * Tests for `apps/site/src/components/signInForm.tsx`.
 * The only mocked boundaries are the existing NextAuth client helper (network),
 * the Next router (navigation) and `next/link` (framework routing). The form
 * itself is rendered and exercised through accessible queries.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next-auth/react", () => ({ signIn: mocks.signIn }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => mocks.searchParams,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import SignInForm from "../../../apps/site/src/components/signInForm.tsx";

/** Fills the two fields with values that pass client-side validation. */
function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByLabelText(/Password/), {
    target: { value: "a-valid-password" },
  });
}

beforeEach(() => {
  mocks.signIn.mockResolvedValue({ error: null, status: 200, ok: true, url: "/" });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.searchParams = new URLSearchParams();
});

describe("SignInForm", () => {
  it("renders a labelled form, a single h1 and a link to registration", () => {
    const { container } = render(<SignInForm />);

    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeTruthy();
    expect(screen.getByLabelText(/Email/)).toBeTruthy();
    expect(screen.getByLabelText(/Password/)).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create one" }).getAttribute("href")).toBe("/register");
    expect(container.querySelector("form")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sign in/ }).getAttribute("type")).toBe("submit");
  });

  it("shows an error summary and marks fields invalid on empty submit", async () => {
    render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Email: Enter your email address/ })).toBeTruthy();
    });
    expect(
      screen.getByRole("link", { name: /Email: Enter your email address/ }).getAttribute("href"),
    ).toBe("#signin-email");
    expect(screen.getByLabelText(/Email/).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText(/Email/).getAttribute("aria-describedby")).toBe(
      "signin-email-error",
    );
    expect(screen.getByLabelText(/Password/).getAttribute("aria-invalid")).toBe("true");
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("validates a field on blur without submitting", () => {
    render(<SignInForm />);

    fireEvent.blur(screen.getByLabelText(/Email/));

    expect(screen.getAllByText("Enter your email address.").length).toBeGreaterThan(0);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("disables the form while signing in and navigates on success", async () => {
    let resolveSignIn: (value: unknown) => void = () => {};
    mocks.signIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    const { container } = render(<SignInForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sign in/ })).toHaveProperty("disabled", true);
    });
    expect(container.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByLabelText(/Email/)).toHaveProperty("disabled", true);

    resolveSignIn({ error: null, status: 200, ok: true, url: "/" });

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/"));
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(screen.getByText("Signed in")).toBeTruthy();
    expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "a-valid-password",
      redirect: false,
    });
  });

  it("shows a persistent error alert when credentials are rejected", async () => {
    mocks.signIn.mockResolvedValue({
      error: "CredentialsSignin",
      status: 401,
      ok: false,
      url: null,
    });
    render(<SignInForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));

    await waitFor(() => expect(screen.getByText("Invalid email or password.")).toBeTruthy());
    expect(screen.getByText("Sign in failed")).toBeTruthy();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("recovers from a rejected sign-in promise", async () => {
    mocks.signIn.mockRejectedValue(new Error("offline"));
    render(<SignInForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /Sign in/ }));

    await waitFor(() =>
      expect(screen.getByText("Unable to sign in right now. Please try again.")).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: /Sign in/ })).toHaveProperty("disabled", false);
  });

  it("toggles password visibility with an accessible pressed state", () => {
    render(<SignInForm />);
    const password = screen.getByLabelText(/Password/);

    expect(password.getAttribute("type")).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(password.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("renders one labelled button per OAuth provider with decorative icons", () => {
    const { container } = render(<SignInForm />);

    for (const name of ["Continue with GitHub", "Continue with Google", "Continue with Discord"]) {
      const button = screen.getByRole("button", { name });
      expect(button.getAttribute("type")).toBe("button");
      expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    }
    expect(screen.getByText("or continue with")).toBeTruthy();
    expect(container.querySelectorAll("form")).toHaveLength(1);
  });

  it("starts each provider redirect with the same post-login destination", async () => {
    render(<SignInForm />);

    for (const [name, id] of [
      ["Continue with GitHub", "github"],
      ["Continue with Google", "google"],
      ["Continue with Discord", "discord"],
    ] as const) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(mocks.signIn).toHaveBeenCalledWith(id, { callbackUrl: "/" });
      await waitFor(() =>
        expect(screen.getByRole("button", { name })).toHaveProperty("disabled", false),
      );
    }
    expect(mocks.signIn).toHaveBeenCalledTimes(3);
  });

  it("locks the whole form while a provider redirect is pending", async () => {
    let resolveSignIn: (value: unknown) => void = () => {};
    mocks.signIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    const { container } = render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with GitHub" }));

    const githubButton = screen.getByRole("button", { name: /Continue with GitHub/ });
    await waitFor(() => expect(githubButton).toHaveProperty("disabled", true));
    expect(githubButton.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByLabelText(/Email/)).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: /Sign in/ })).toHaveProperty("disabled", true);
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();

    resolveSignIn(undefined);
    await waitFor(() => expect(githubButton).toHaveProperty("disabled", false));
  });

  it("shows a generic error when the provider redirect cannot start", async () => {
    mocks.signIn.mockRejectedValueOnce(new Error("network down"));
    render(<SignInForm />);

    fireEvent.click(screen.getByRole("button", { name: "Continue with Discord" }));

    await waitFor(() =>
      expect(
        screen.getByText("We could not start sign-in with that provider. Please try again."),
      ).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: /Continue with Discord/ })).toHaveProperty(
      "disabled",
      false,
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("renders a safe message for a NextAuth error code without leaking the code", () => {
    mocks.searchParams = new URLSearchParams("error=OAuthAccountNotLinked");
    render(<SignInForm />);

    expect(
      screen.getByText(
        "This provider is not linked to your account yet. Sign in with your usual method first, then try again.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/OAuthAccountNotLinked/)).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Sign in failed");
  });
});
