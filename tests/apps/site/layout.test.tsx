/**
 * Tests for `apps/site/src/app/layout.tsx`.
 *
 * The layout is verified through the DOM contract it documents: it mounts the
 * two Google-font CSS variables and the base utility classes on `<html>`, lays
 * `<body>` out as a full-height column, and renders whatever children the
 * active route provides. The jsdom environment is requested per file (the
 * pragma below) so the rest of the suite keeps running in the cheaper node
 * one.
 *
 * `next/font/google` is mocked because its real module is a build-time stub
 * (the runtime file is empty and fonts are resolved by the Next.js compiler),
 * so the loaders are asserted through their recorded call arguments and the
 * CSS variables they feed into `<html>`. `./globals.css` is handled by Vite's
 * default CSS stubbing.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "../../../apps/site/src/app/layout.tsx";

/**
 * Font-loader call recording shared between the `vi.mock` factory and the
 * tests. Plain functions with closure arrays are used instead of `vi.fn()`
 * mocks: with plugin-react transforming `.tsx` files, the hoisted `vi.fn`
 * instance that module evaluation calls at import time is not the same
 * recorder instance the test scope sees, so `mock.calls` stays empty — while
 * a closure array always sees the call regardless of which instance ran.
 */
const fontCalls = vi.hoisted(() => ({
  geist: [] as unknown[],
  geistMono: [] as unknown[],
}));

vi.mock("next/font/google", () => ({
  Geist: (options: Record<string, unknown>) => {
    fontCalls.geist.push(options);
    return { variable: "--font-geist-sans" };
  },
  Geist_Mono: (options: Record<string, unknown>) => {
    fontCalls.geistMono.push(options);
    return { variable: "--font-geist-mono" };
  },
}));

afterEach(() => {
  // Vitest globals are off, so the testing library's automatic cleanup hook
  // never registers; without an explicit cleanup, renders from one test leak
  // into the queries of the next one. Mocks are intentionally NOT cleared:
  // the font loaders are invoked once at module evaluation, and the recorded
  // calls are what the wiring test below asserts on.
  cleanup();
});

describe("RootLayout", () => {
  // React 19 hoists document-level elements (<html>/<body>) rendered inside a
  // plain container out into the live document, so the shell is asserted on
  // the document itself rather than on the render container.
  it("renders children inside the document shell", () => {
    render(
      <RootLayout>
        <p>route content</p>
      </RootLayout>,
    );

    expect(screen.getByText("route content")).toBeTruthy();
    expect(document.documentElement.tagName).toBe("HTML");
  });

  it("mounts the font CSS variables and base utilities on <html>", () => {
    render(
      <RootLayout>
        <p>route content</p>
      </RootLayout>,
    );

    const html = document.documentElement;
    expect(html.getAttribute("lang")).toBe("en");
    const classes = html.className.split(" ");
    expect(classes).toContain("--font-geist-sans");
    expect(classes).toContain("--font-geist-mono");
    expect(classes).toContain("antialiased");
  });

  it("lays <body> out as a full-height column", () => {
    render(
      <RootLayout>
        <p>route content</p>
      </RootLayout>,
    );

    expect(document.body.className).toBe("min-h-full flex flex-col");
  });

  it("configures both Google fonts as CSS variables for the latin subset", () => {
    render(
      <RootLayout>
        <p>route content</p>
      </RootLayout>,
    );

    // The loaders are invoked once at module evaluation; the closure arrays
    // pin the exact options they were configured with.
    expect(fontCalls.geist).toEqual([{ variable: "--font-geist-sans", subsets: ["latin"] }]);
    expect(fontCalls.geistMono).toEqual([{ variable: "--font-geist-mono", subsets: ["latin"] }]);
  });
});

describe("metadata", () => {
  it("brands the browser tab with the Veyra description", () => {
    expect(metadata.title).toBe("Veyra");
    expect(metadata.description).toContain("Discord bots");
  });
});
