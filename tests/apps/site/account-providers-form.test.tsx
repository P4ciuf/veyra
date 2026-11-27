/**
 * Tests for `apps/site/src/components/accountProviders.tsx`.
 *
 * `fetch` is replaced at the network boundary; rendering, loading states and
 * the unlink flow run against real React state. The assertions cover which
 * providers are visible, the DELETE body, error feedback and the update of the
 * list after a successful unlink.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AccountProviders from "../../../apps/site/src/components/accountProviders.js";

/** Mocked network calls recorded by the component. */
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));

/**
 * Builds a minimal `Response`-shaped value for the component's fetch calls.
 *
 * @param body - JSON payload returned by `json()`
 * @param status - HTTP status reported to the component
 * @returns A response-like object
 */
function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.fetch.mockResolvedValue(response({ providers: ["github", "discord"] }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AccountProviders", () => {
  it("renders only the providers returned by the API", async () => {
    render(<AccountProviders />);

    expect(await screen.findByRole("button", { name: "Unlink GitHub" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unlink Discord" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Unlink Google" })).toBeNull();
    expect(mocks.fetch).toHaveBeenCalledWith("/api/account/providers", expect.any(Object));
  });

  it("sends a DELETE with the selected provider and refreshes the list", async () => {
    mocks.fetch
      .mockResolvedValueOnce(response({ providers: ["github"] }))
      .mockResolvedValueOnce(response({ providers: [] }));
    render(<AccountProviders />);

    fireEvent.click(await screen.findByRole("button", { name: "Unlink GitHub" }));

    await waitFor(() => {
      expect(mocks.fetch).toHaveBeenCalledWith("/api/account/providers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "github" }),
      });
    });
    expect((await screen.findByText("No providers are linked.")).textContent).toBe(
      "No providers are linked.",
    );
    expect((await screen.findByRole("status")).textContent).toContain("GitHub has been unlinked.");
  });

  it("shows the server's message when the last sign-in method cannot be removed", async () => {
    mocks.fetch
      .mockResolvedValueOnce(response({ providers: ["discord"] }))
      .mockResolvedValueOnce(
        response({ error: "Add another sign-in method before unlinking this one" }, 409),
      );
    render(<AccountProviders />);

    fireEvent.click(await screen.findByRole("button", { name: "Unlink Discord" }));

    expect((await screen.findByRole("status")).textContent).toContain(
      "Add another sign-in method before unlinking this one",
    );
    expect(screen.getByRole("button", { name: "Unlink Discord" })).not.toHaveProperty(
      "disabled",
      true,
    );
  });

  it("reports a failed provider list load", async () => {
    mocks.fetch.mockResolvedValue(response({ error: "Not authenticated" }, 401));
    render(<AccountProviders />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Unable to load linked providers.",
    );
  });

  it("ignores unknown provider ids returned by a stale API", async () => {
    mocks.fetch.mockResolvedValue(response({ providers: ["github", "myspace"] }));
    render(<AccountProviders />);

    expect(await screen.findByRole("button", { name: "Unlink GitHub" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Unlink myspace/ })).toBeNull();
  });
});
