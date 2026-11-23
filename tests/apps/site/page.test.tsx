/**
 * Tests for `apps/site/src/app/page.tsx`.
 *
 * The page is a plain function component, so it is exercised the same way a
 * browser would see it: rendered into a jsdom document and queried through
 * accessible roles. The jsdom environment is requested per file (the pragma
 * below) so the rest of the suite keeps running in the cheaper node one.
 * Content and styling are still create-next-app placeholders; these tests
 * pin the current contract so a future implementation change is visible.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Home from "../../../apps/site/src/app/page.tsx";

afterEach(() => {
  // Vitest globals are off, so the testing library's automatic cleanup hook
  // never registers; without an explicit cleanup, renders from one test leak
  // into the queries of the next one.
  cleanup();
});

describe("Home page", () => {
  it("renders the placeholder landing heading", () => {
    render(<Home />);

    // getByRole asserts accessibility semantics: the title must be reachable
    // as the single top-level heading, not just present in the markup.
    expect(screen.getByRole("heading", { level: 1, name: "Hello World" })).toBeTruthy();
  });

  it("renders no other headings", () => {
    render(<Home />);

    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });
});
