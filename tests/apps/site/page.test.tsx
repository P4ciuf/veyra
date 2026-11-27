/**
 * Tests for `apps/site/src/app/page.tsx`.
 *
 * The placeholder home page exposes a single "Sign In" button. It is a client
 * component: `next/navigation`'s `useRouter` is mocked so the suite can verify
 * that navigation happens only on click, never while rendering. The jsdom
 * environment is requested per file (the pragma below) so the rest of the
 * suite keeps running in the cheaper node one.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

import Home from "../../../apps/site/src/app/page.tsx";

afterEach(() => {
  // Vitest globals are off, so the testing library's automatic cleanup hook
  // never registers; without an explicit cleanup, renders from one test leak
  // into the queries of the next one.
  cleanup();
  mocks.push.mockClear();
});

describe("Home page", () => {
  it("renders a single Sign In button and no headings", () => {
    render(<Home />);

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeTruthy();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("does not navigate during render", () => {
    render(<Home />);

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("navigates to /signin when the button is clicked", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(mocks.push).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith("/signin");
  });
});
