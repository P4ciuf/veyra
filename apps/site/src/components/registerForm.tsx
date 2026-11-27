/**
 * Client-side registration form. It validates locally against the limits of the
 * existing registration endpoint and posts only the fields that endpoint accepts.
 * No account or session logic is implemented here.
 */
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthShell from "./authShell";
import FormField from "./formField";
import { ROUTES } from "@/lib/routes";
import {
  hasFieldErrors,
  validateRegister,
  type FieldErrors,
  type RegisterValues,
} from "@/lib/authForm";
import styles from "./auth.module.css";
import { Check, CheckIcon, CircleAlertIcon, CrossIcon } from "lucide-react";

/** Visual state of the registration attempt. */
type RegisterStatus = "idle" | "loading" | "error" | "success";

/** Visible names for the fields referenced by the error summary. */
const FIELD_LABELS: Record<keyof RegisterValues, string> = {
  username: "Username",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
};

/**
 * Extracts the endpoint's error message from an unknown JSON payload.
 *
 * @param payload - Parsed response body, or `null` when it was not valid JSON
 * @returns The server message when present, otherwise `null`
 */
function readApiError(payload: unknown): string | null {
  if (typeof payload === "object" && payload !== null && "error" in payload) {
    const message = (payload as { error: unknown }).error;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return null;
}

/**
 * Renders the registration form with validation, loading, error and success states.
 *
 * @returns The registration card, including a link back to the sign-in page
 */
export default function RegisterForm() {
  const [values, setValues] = useState<RegisterValues>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors<RegisterValues>>({});
  const [status, setStatus] = useState<RegisterStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const busy = status === "loading";
  const locked = busy || status === "success";
  const passwordRuleMet = values.password.length >= 8 && values.password.length <= 128;

  // Move focus to the heading so assistive technology announces the completed flow.
  useEffect(() => {
    if (status === "success") {
      document.getElementById("auth-title")?.focus();
    }
  }, [status]);

  /** Stores a new value for one field. */
  function updateValue(field: keyof RegisterValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** Validates a single field on blur, without announcing unrelated fields. */
  function validateField(field: keyof RegisterValues): void {
    const message = validateRegister(values)[field];
    setErrors((current) => ({ ...current, [field]: message }));
  }

  /** Validates and submits the form to the existing registration endpoint. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (locked) {
      return;
    }

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setStatus("loading");
    setFormError(null);

    try {
      const response = await fetch(ROUTES.registerApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setFormError(
          response.status === 409
            ? "Email already registered."
            : (readApiError(payload) ?? "Unable to create your account. Please try again."),
        );
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setFormError("Unable to create your account. Please try again.");
      setStatus("error");
    }
  }

  const errorEntries = (
    Object.entries(errors) as [keyof RegisterValues, string | undefined][]
  ).filter(([, message]) => message !== undefined);

  return (
    <AuthShell
      title="Create your account"
      description="Register to submit bots and manage your downloads."
      footer={
        <p>
          {`Already have an account? `}
          <Link className={styles.footerLink} href={ROUTES.signIn}>
            Sign in
          </Link>
        </p>
      }
    >
      {errorEntries.length > 0 ? (
        <div className={styles.alert} role="alert">
          <CircleAlertIcon className={styles.alertIcon} aria-hidden="true" />
          <div className={styles.alertBody}>
            <p className={styles.alertTitle}>There is a problem</p>
            <ul className={styles.alertList}>
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <a className={styles.alertLink} href={`#register-${field}`}>
                    {FIELD_LABELS[field]}: {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {formError ? (
        <div className={styles.alert} role="alert">
          <CircleAlertIcon className={styles.alertIcon} aria-hidden="true" />
          <div className={styles.alertBody}>
            <p className={styles.alertTitle}>Registration failed</p>
            <p className={styles.alertText}>{formError}</p>
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          <Check className={styles.alertIcon} aria-hidden="true" />
          <div className={styles.alertBody}>
            <p className={styles.alertTitle}>Account created</p>
            <p className={styles.alertText}>
              Your account is ready.{" "}
              <Link className={styles.alertLink} href={ROUTES.signIn}>
                Sign in to continue
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={busy}>
        <FormField
          id="register-username"
          name="username"
          label="Username"
          autoComplete="username"
          placeholder="Choose a username"
          required
          maxLength={24}
          value={values.username}
          onChange={(value) => updateValue("username", value)}
          onBlur={() => validateField("username")}
          error={errors.username}
          help="3–24 characters."
          disabled={locked}
        />
        <FormField
          id="register-email"
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
          value={values.email}
          onChange={(value) => updateValue("email", value)}
          onBlur={() => validateField("email")}
          error={errors.email}
          disabled={locked}
        />
        <FormField
          id="register-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          required
          value={values.password}
          onChange={(value) => updateValue("password", value)}
          onBlur={() => validateField("password")}
          error={errors.password}
          disabled={locked}
          help={
            <ul className={styles.rules}>
              <li className={styles.rule}>
                {passwordRuleMet ? (
                  <CheckIcon
                    className={`${styles.ruleIcon} ${styles.ruleMet}`}
                    aria-hidden="true"
                  />
                ) : (
                  <CrossIcon
                    className={`${styles.ruleIcon} ${styles.ruleUnmet}`}
                    aria-hidden="true"
                  />
                )}
                8–128 characters
              </li>
            </ul>
          }
        />
        <FormField
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          required
          value={values.confirmPassword}
          onChange={(value) => updateValue("confirmPassword", value)}
          onBlur={() => validateField("confirmPassword")}
          error={errors.confirmPassword}
          disabled={locked}
        />
        <button
          type="submit"
          className={`${styles.submit} ${busy ? styles.submitLoading : ""}`}
          disabled={locked}
          aria-busy={busy}
        >
          {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
          Create account
          {busy ? <span className={styles.srOnly}>Loading</span> : null}
        </button>
      </form>
    </AuthShell>
  );
}
