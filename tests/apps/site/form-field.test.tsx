/**
 * Tests for `apps/site/src/components/formField.tsx`.
 *
 * The component is the shared input primitive for both account forms, so the
 * suite pins its labelling, ARIA wiring, error/help exclusivity, controlled
 * callbacks and password reveal state through accessible queries.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import FormField, { type FormFieldProps } from "../../../apps/site/src/components/formField.tsx";

/** Renders a field with sensible defaults and records its callbacks. */
function renderField(overrides: Partial<FormFieldProps> = {}) {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const props: FormFieldProps = {
    id: "email",
    name: "email",
    label: "Email",
    value: "",
    onChange,
    onBlur,
    autoComplete: "email",
    ...overrides,
  };

  return { ...render(<FormField {...props} />), onChange, onBlur };
}

afterEach(cleanup);

describe("FormField", () => {
  it("associates the label, required marker and help text with the input", () => {
    renderField({ required: true, help: "We never share it." });

    const input = screen.getByRole("textbox", { name: /^Email/ });
    expect(input.id).toBe("email");
    expect(input).toHaveProperty("required", true);
    expect(input.getAttribute("autocomplete")).toBe("email");
    expect(input.getAttribute("aria-describedby")).toBe("email-help");
    expect(screen.getByText("We never share it.").id).toBe("email-help");
    expect(screen.getByText("*")).toBeTruthy();
  });

  it("switches help text for an accessible error message", () => {
    renderField({ error: "Enter a valid email address.", help: "Ignored guidance" });

    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-error");
    expect(screen.getByRole("alert").textContent).toContain("Enter a valid email address.");
    expect(screen.queryByText("Ignored guidance")).toBeNull();
  });

  it("forwards changes and blur to the parent form", () => {
    const { onChange, onBlur } = renderField();
    const input = screen.getByRole("textbox", { name: "Email" });

    fireEvent.change(input, { target: { value: "ada@example.com" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith("ada@example.com");
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("toggles a password field with an accessible pressed state", () => {
    renderField({
      id: "password",
      name: "password",
      label: "Password",
      type: "password",
      autoComplete: "new-password",
    });

    const input = screen.getByLabelText("Password");
    expect(input.getAttribute("type")).toBe("password");

    const show = screen.getByRole("button", { name: "Show password" });
    expect(show.getAttribute("aria-pressed")).toBe("false");
    expect(show.getAttribute("aria-controls")).toBe("password");

    fireEvent.click(show);
    expect(input.getAttribute("type")).toBe("text");

    const hide = screen.getByRole("button", { name: "Hide password" });
    expect(hide.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(hide);
    expect(input.getAttribute("type")).toBe("password");
  });

  it("forwards native attributes while disabling the control and reveal button", () => {
    renderField({
      disabled: true,
      placeholder: "you@example.com",
      inputMode: "email",
      maxLength: 254,
      type: "password",
    });

    const input = screen.getByLabelText("Email");
    expect(input).toHaveProperty("disabled", true);
    expect(input.getAttribute("placeholder")).toBe("you@example.com");
    expect(input.getAttribute("inputmode")).toBe("email");
    expect(input.getAttribute("maxlength")).toBe("254");
    expect(screen.getByRole("button", { name: "Show password" })).toHaveProperty("disabled", true);
  });
});
