/**
 * Tests for `apps/site/src/components/authShell.tsx`.
 *
 * The shell owns the accessibility contract shared by both account screens:
 * one page heading, a skip link, a labelled region, the main landmark and a
 * footer slot. These assertions query those semantics through accessible roles.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AuthShell from "../../../apps/site/src/components/authShell.tsx";

afterEach(cleanup);

describe("AuthShell", () => {
  it("renders a skip link, a single heading, the description, children and footer", () => {
    const { container } = render(
      <AuthShell title="Sign in" description="Welcome back." footer={<p>Create one</p>}>
        <form aria-label="credentials" />
      </AuthShell>,
    );

    expect(screen.getByRole("link", { name: "Skip to main content" }).getAttribute("href")).toBe(
      "#main-content",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeTruthy();
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(screen.getByText("Welcome back.")).toBeTruthy();
    expect(screen.getByRole("form", { name: "credentials" })).toBeTruthy();
    expect(screen.getByText("Create one")).toBeTruthy();
    expect(container.querySelector("footer")).toBeTruthy();
  });

  it("labels the card region with the heading id and exposes the main landmark", () => {
    render(
      <AuthShell title="Create your account" description="Join us." footer={null}>
        <p>Form content</p>
      </AuthShell>,
    );

    expect(screen.getByRole("region", { name: "Create your account" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).getAttribute("id")).toBe("auth-title");
  });
});
