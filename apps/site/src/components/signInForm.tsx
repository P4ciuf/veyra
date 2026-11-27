/**
 * Client-side sign-in form. It validates locally, then delegates to the existing
 * NextAuth credentials handler through `next-auth/react`; no authentication
 * logic is implemented here. The three OAuth buttons start the provider
 * redirect through the same helper and share the credentials post-login target.
 */
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthShell from "./authShell";
import FormField from "./formField";
import { ROUTES } from "@/lib/routes";
import { OAUTH_PROVIDER_OPTIONS, type OAuthProviderId } from "@/lib/oauth";
import { PROVIDER_FAILURE_MESSAGE, readAuthErrorMessage } from "@/lib/authError";
import {
  hasFieldErrors,
  validateSignIn,
  type FieldErrors,
  type SignInValues,
} from "@/lib/authForm";
import styles from "./auth.module.css";
import { Check, CircleAlertIcon } from "lucide-react";
import { FaGithub, FaGoogle, FaDiscord } from "react-icons/fa";
import type { IconType } from "react-icons";

/** Visual state of the credentials sign-in attempt. */
type SignInStatus = "idle" | "loading" | "error" | "success";

/** Visible names for the fields referenced by the error summary. */
const FIELD_LABELS: Record<keyof SignInValues, string> = {
  email: "Email",
  password: "Password",
};

/** Brand icon component for each registered OAuth provider button. */
const PROVIDER_ICONS: Record<OAuthProviderId, IconType> = {
  github: FaGithub,
  google: FaGoogle,
  discord: FaDiscord,
};

/**
 * Renders the sign-in form with validation, loading, error and success states,
 * plus one button per registered OAuth provider.
 *
 * @returns The sign-in card, including the provider options and a link to registration
 */
export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<SignInValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<SignInValues>>({});
  const [status, setStatus] = useState<SignInStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [providerLoading, setProviderLoading] = useState<OAuthProviderId | null>(null);

  const busy = status === "loading";
  const locked = busy || status === "success" || providerLoading !== null;
  const displayedError = formError ?? readAuthErrorMessage(searchParams.get("error"));

  /** Stores a new value for one field. */
  function updateValue(field: keyof SignInValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** Validates a single field on blur, without announcing unrelated fields. */
  function validateField(field: keyof SignInValues): void {
    const message = validateSignIn(values)[field];
    setErrors((current) => ({ ...current, [field]: message }));
  }

  /** Validates and submits the form to the configured credentials provider. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (locked) {
      return;
    }

    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setStatus("loading");
    setFormError(null);

    try {
      const result = await signIn("credentials", {
        email: values.email.trim(),
        password: values.password,
        redirect: false,
      });

      if (!result || result.error) {
        setFormError("Invalid email or password.");
        setStatus("error");
        return;
      }

      setStatus("success");
      router.push(ROUTES.home);
      router.refresh();
    } catch {
      setFormError("Unable to sign in right now. Please try again.");
      setStatus("error");
    }
  }

  /**
   * Starts the OAuth redirect for one provider. Provider errors come back as a
   * query parameter and are rendered from {@link readAuthErrorMessage}; only a
   * failed client-side start is handled here.
   *
   * @param provider - Registered provider id from {@link OAUTH_PROVIDER_OPTIONS}
   */
  async function handleProviderSignIn(provider: OAuthProviderId): Promise<void> {
    if (locked) {
      return;
    }

    setProviderLoading(provider);
    setFormError(null);

    try {
      // A full redirect is intentional: NextAuth owns the provider callback,
      // the state/CSRF check and the session cookie before returning home.
      await signIn(provider, { callbackUrl: ROUTES.home });
      // Normally the navigation unmounts this component; clearing the flag
      // avoids a permanently locked UI if the redirect does not happen.
      setProviderLoading(null);
    } catch {
      setFormError(PROVIDER_FAILURE_MESSAGE);
      setProviderLoading(null);
    }
  }

  const errorEntries = (
    Object.entries(errors) as [keyof SignInValues, string | undefined][]
  ).filter(([, message]) => message !== undefined);

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to continue to Veyra."
      footer={
        <p>
          {`Don't have an account? `}
          <Link className={styles.footerLink} href={ROUTES.register}>
            Create one
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
                  <a className={styles.alertLink} href={`#signin-${field}`}>
                    {FIELD_LABELS[field]}: {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {displayedError ? (
        <div className={styles.alert} role="alert">
          <CircleAlertIcon className={styles.alertIcon} aria-hidden="true" />
          <div className={styles.alertBody}>
            <p className={styles.alertTitle}>Sign in failed</p>
            <p className={styles.alertText}>{displayedError}</p>
          </div>
        </div>
      ) : null}

      {status === "success" ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          <Check className={styles.alertIcon} aria-hidden="true" />
          <div className={styles.alertBody}>
            <p className={styles.alertTitle}>Signed in</p>
            <p className={styles.alertText}>Redirecting to the home page…</p>
          </div>
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={busy}>
        <FormField
          id="signin-email"
          name="email"
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={values.email}
          onChange={(value) => updateValue("email", value)}
          onBlur={() => validateField("email")}
          error={errors.email}
          disabled={locked}
        />
        <FormField
          id="signin-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          value={values.password}
          onChange={(value) => updateValue("password", value)}
          onBlur={() => validateField("password")}
          error={errors.password}
          disabled={locked}
        />
        <button
          type="submit"
          className={`${styles.submit} ${busy ? styles.submitLoading : ""}`}
          disabled={locked}
          aria-busy={busy}
        >
          {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
          Sign in
          {busy ? <span className={styles.srOnly}>Loading</span> : null}
        </button>
      </form>

      <div className={styles.divider}>or continue with</div>
      <div className={styles.providers}>
        {OAUTH_PROVIDER_OPTIONS.map(({ id, label }) => {
          const Icon = PROVIDER_ICONS[id];
          const isLoading = providerLoading === id;

          return (
            <button
              key={id}
              type="button"
              className={`${styles.providerButton} ${isLoading ? styles.providerLoading : ""}`}
              onClick={() => void handleProviderSignIn(id)}
              disabled={locked}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <Icon className={styles.providerIcon} aria-hidden="true" />
              )}
              {label}
              {isLoading ? <span className={styles.srOnly}>Loading</span> : null}
            </button>
          );
        })}
      </div>
    </AuthShell>
  );
}
