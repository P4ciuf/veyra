/**
 * Tests for `apps/site/src/components/registerForm.tsx`.
 * `fetch` is the only external boundary mocked; the endpoint itself is not
 * changed or reimplemented. Everything else is rendered and queried through
 * accessible roles and labels.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import RegisterForm from "../../../apps/site/src/components/registerForm.tsx";

/** Creates a minimal `Response`-shaped value for the mocked fetch call. */
function jsonResponse(body: unknown, status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

/** Fills every field with values accepted by client-side validation. */
function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText(/Username/), { target: { value: "  veyra-user  " } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: "  user@example.com " } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "long-enough" } });
  fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: "long-enough" } });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(jsonResponse({ message: "Account created successfully" }, 201));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("RegisterForm", () => {
  it("renders four labelled fields, the password rule and a sign-in link", () => {
    const { container } = render(<RegisterForm />);

    expect(screen.getByRole("heading", { level: 1, name: "Create your account" })).toBeTruthy();
    expect(screen.getByLabelText(/Username/)).toBeTruthy();
    expect(screen.getByLabelText(/Email/)).toBeTruthy();
    expect(screen.getByLabelText(/^Password/)).toBeTruthy();
    expect(screen.getByLabelText(/Confirm password/)).toBeTruthy();
    expect(screen.getByText("8–128 characters")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/signin");
    expect(container.querySelector("form")).toBeTruthy();
  });

  it("shows a linked error summary for an empty submit and skips the request", async () => {
    render(<RegisterForm />);

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText("There is a problem")).toBeTruthy());
    expect(
      screen.getByRole("link", { name: /Username: Enter a username/ }).getAttribute("href"),
    ).toBe("#register-username");
    expect(screen.getByLabelText(/Confirm password/).getAttribute("aria-invalid")).toBe("true");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects a password confirmation mismatch", async () => {
    render(<RegisterForm />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/Confirm password/), { target: { value: "different" } });

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getAllByText("Passwords do not match.").length).toBeGreaterThan(0),
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("shows the satisfied password rule after a valid value is typed", () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "long-enough" } });

    expect(
      screen
        .getByText("8–128 characters")
        .parentElement?.querySelector("svg")
        ?.getAttribute("class"),
    ).toContain("ruleMet");
  });

  it("locks the form while submitting and shows a focused success state", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    mocks.fetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const { container } = render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create account/ })).toHaveProperty(
        "disabled",
        true,
      );
    });
    expect(container.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByLabelText(/Email/)).toHaveProperty("disabled", true);

    resolveFetch(jsonResponse({ message: "Account created successfully" }, 201));

    await waitFor(() => expect(screen.getByText("Account created")).toBeTruthy());
    expect(screen.getByRole("status")).toBeTruthy();
    expect(document.activeElement?.id).toBe("auth-title");
    expect(mocks.fetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "veyra-user",
        email: "user@example.com",
        password: "long-enough",
      }),
    });
  });

  it("surfaces a duplicate-email response", async () => {
    mocks.fetch.mockResolvedValue(jsonResponse({ error: "Email already registered" }, 409));
    render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText("Email already registered.")).toBeTruthy());
    expect(screen.getByText("Registration failed")).toBeTruthy();
  });

  it("uses the server message for a validation response", async () => {
    mocks.fetch.mockResolvedValue(jsonResponse({ error: "Invalid username" }, 400));
    render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText("Invalid username")).toBeTruthy());
  });

  it("uses a generic message for server and network failures", async () => {
    mocks.fetch.mockResolvedValue(jsonResponse({}, 500));
    const { unmount } = render(<RegisterForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByText("Unable to create your account. Please try again.")).toBeTruthy(),
    );
    unmount();

    mocks.fetch.mockRejectedValue(new Error("offline"));
    render(<RegisterForm />);
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(
        screen.getAllByText("Unable to create your account. Please try again.").length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByRole("button", { name: "Create account" })).toHaveProperty(
      "disabled",
      false,
    );
  });
});
