/**
 * Tests for `apps/site/src/lib/authForm.ts`.
 * These are pure-function tests: they pin the client-side rules to the limits of
 * the existing registration endpoint without touching any authentication logic.
 */
import { describe, expect, it } from "vitest";
import {
  hasFieldErrors,
  validateRegister,
  validateSignIn,
  type RegisterValues,
} from "../../../apps/site/src/lib/authForm";

/** Valid registration values used as a baseline for the edge-case tests. */
const validRegistration: RegisterValues = {
  username: "veyra-user",
  email: "user@example.com",
  password: "long-enough",
  confirmPassword: "long-enough",
};

describe("validateSignIn", () => {
  it("accepts a well-formed email and a non-empty password", () => {
    expect(validateSignIn({ email: "user@example.com", password: "secret" })).toEqual({});
  });

  it("reports both missing fields", () => {
    expect(validateSignIn({ email: "", password: "" })).toEqual({
      email: "Enter your email address.",
      password: "Enter your password.",
    });
  });

  it("rejects malformed and overlong emails", () => {
    expect(validateSignIn({ email: "not-an-email", password: "secret" }).email).toBe(
      "Enter a valid email address.",
    );
    expect(
      validateSignIn({ email: `${"a".repeat(250)}@example.com`, password: "secret" }).email,
    ).toBe("Enter a valid email address.");
  });

  it("does not enforce the registration password policy on sign-in", () => {
    expect(validateSignIn({ email: "user@example.com", password: "x" })).toEqual({});
  });
});

describe("validateRegister", () => {
  it("accepts values that satisfy every rule", () => {
    expect(validateRegister(validRegistration)).toEqual({});
  });

  it("trims the username before checking its length", () => {
    expect(validateRegister({ ...validRegistration, username: "  ab  " }).username).toBe(
      "Username must be between 3 and 24 characters.",
    );
    expect(validateRegister({ ...validRegistration, username: "  abc  " })).toEqual({});
  });

  it("requires a username", () => {
    expect(validateRegister({ ...validRegistration, username: "   " }).username).toBe(
      "Enter a username.",
    );
  });

  it("enforces both username bounds", () => {
    expect(validateRegister({ ...validRegistration, username: "a".repeat(25) }).username).toBe(
      "Username must be between 3 and 24 characters.",
    );
  });

  it("enforces the email format", () => {
    expect(validateRegister({ ...validRegistration, email: "bad" }).email).toBe(
      "Enter a valid email address.",
    );
  });

  it("enforces the password length accepted by the endpoint", () => {
    expect(
      validateRegister({ ...validRegistration, password: "1234567", confirmPassword: "1234567" })
        .password,
    ).toBe("Password must be between 8 and 128 characters.");
    expect(
      validateRegister({
        ...validRegistration,
        password: "a".repeat(129),
        confirmPassword: "a".repeat(129),
      }).password,
    ).toBe("Password must be between 8 and 128 characters.");
  });

  it("requires password confirmation and detects a mismatch", () => {
    expect(validateRegister({ ...validRegistration, confirmPassword: "" }).confirmPassword).toBe(
      "Confirm your password.",
    );
    expect(
      validateRegister({ ...validRegistration, confirmPassword: "different" }).confirmPassword,
    ).toBe("Passwords do not match.");
  });
});

describe("hasFieldErrors", () => {
  it("is false for an empty validation result", () => {
    expect(hasFieldErrors(validateRegister(validRegistration))).toBe(false);
  });

  it("is true when at least one field has a message", () => {
    expect(hasFieldErrors(validateSignIn({ email: "", password: "secret" }))).toBe(true);
  });
});
