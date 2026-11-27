/**
 * Client-side account settings for OAuth providers.
 *
 * The page fetches the linked providers from the authenticated API route and
 * unlinks them through the same route. Only provider ids are rendered; no token
 * or account secret is ever sent to the browser.
 */
"use client";

import { useEffect, useState } from "react";
import { FaDiscord, FaGithub, FaGoogle } from "react-icons/fa";
import type { IconType } from "react-icons";
import { ROUTES } from "@/lib/routes";
import { isOAuthProviderId, OAUTH_PROVIDER_OPTIONS, type OAuthProviderId } from "@/lib/oauth";
import styles from "./auth.module.css";

/** Brand icon for each provider shown on the sign-in screen. */
const PROVIDER_ICONS: Record<OAuthProviderId, IconType> = {
  github: FaGithub,
  google: FaGoogle,
  discord: FaDiscord,
};

/** Human-readable names used in confirmation messages. */
const PROVIDER_NAMES: Record<OAuthProviderId, string> = {
  github: "GitHub",
  google: "Google",
  discord: "Discord",
};

/** Loading state of the provider list. */
type LoadStatus = "loading" | "ready" | "error";

/**
 * Renders the linked-provider list with an unlink action per provider.
 *
 * @returns The status, provider rows and accessible result message
 */
export default function AccountProviders() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [providers, setProviders] = useState<OAuthProviderId[]>([]);
  const [busy, setBusy] = useState<OAuthProviderId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    /** Loads the provider list, ignoring results after the component unmounts. */
    async function load(): Promise<void> {
      try {
        const response = await fetch(ROUTES.accountProvidersApi, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as { providers?: unknown };
        if (!Array.isArray(data.providers)) {
          throw new Error("Malformed provider list");
        }
        setProviders(
          data.providers.filter(
            (value): value is OAuthProviderId =>
              typeof value === "string" && isOAuthProviderId(value),
          ),
        );
        setStatus("ready");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  /**
   * Removes one provider after checking the server's answer.
   *
   * @param provider - Provider id selected by the user
   */
  async function handleUnlink(provider: OAuthProviderId): Promise<void> {
    if (busy) {
      return;
    }

    setBusy(provider);
    setMessage(null);
    try {
      const response = await fetch(ROUTES.accountProvidersApi, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        providers?: unknown;
        error?: unknown;
      };

      if (!response.ok) {
        setMessage(readFailure(response.status, data.error));
        return;
      }

      if (Array.isArray(data.providers)) {
        setProviders(
          data.providers.filter(
            (value): value is OAuthProviderId =>
              typeof value === "string" && isOAuthProviderId(value),
          ),
        );
      }
      setMessage(`${PROVIDER_NAMES[provider]} has been unlinked.`);
    } catch {
      setMessage("Unable to unlink the provider. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.brand}>Linked providers</h2>
      {status === "loading" ? <p>Loading providers…</p> : null}
      {status === "error" ? (
        <p className={styles.alert} role="alert">
          <span className={styles.alertText}>Unable to load linked providers.</span>
        </p>
      ) : null}
      {status === "ready" && providers.length === 0 ? <p>No providers are linked.</p> : null}
      {status === "ready" && providers.length > 0 ? (
        <ul className={styles.providers}>
          {OAUTH_PROVIDER_OPTIONS.filter((option) => providers.includes(option.id)).map(
            (option) => {
              const Icon = PROVIDER_ICONS[option.id];
              return (
                <li key={option.id} className={styles.field}>
                  <button
                    type="button"
                    className={styles.providerButton}
                    onClick={() => void handleUnlink(option.id)}
                    disabled={busy !== null}
                    aria-busy={busy === option.id}
                  >
                    <Icon aria-hidden="true" />
                    {busy === option.id
                      ? `Unlinking ${PROVIDER_NAMES[option.id]}…`
                      : `Unlink ${PROVIDER_NAMES[option.id]}`}
                  </button>
                </li>
              );
            },
          )}
        </ul>
      ) : null}
      {message ? (
        <p className={styles.alert} role="status">
          <span className={styles.alertText}>{message}</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Maps an API failure to a user-facing message.
 *
 * @param status - HTTP status returned by the account providers endpoint
 * @param serverError - Generic error string from the response, when present
 * @returns A message that never exposes provider tokens or internal details
 */
function readFailure(status: number, serverError: unknown): string {
  if (typeof serverError === "string" && serverError.length > 0) {
    return serverError;
  }
  if (status === 401) {
    return "Your session has expired. Sign in again.";
  }
  if (status === 404) {
    return "That provider is not linked to your account.";
  }
  if (status === 409) {
    return "Add another sign-in method before unlinking this one.";
  }
  return "Unable to unlink the provider. Please try again.";
}
