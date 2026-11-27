/**
 * Shared centred card shell for the account screens.
 * It owns the page landmark, the skip link, the single `<h1>` and the footer
 * slot so sign-in and registration stay visually and semantically consistent.
 */
import type { ReactNode } from "react";
import styles from "./auth.module.css";

/** Props for {@link AuthShell}. */
export interface AuthShellProps {
  /** Text of the page-level heading; the only `<h1>` on the screen. */
  title: string;
  /** Short explanation rendered under the heading. */
  description: string;
  /** The form or status content displayed inside the card. */
  children: ReactNode;
  /** Cross-link or other content rendered at the bottom of the card. */
  footer: ReactNode;
}

/**
 * Renders the accessible shell shared by the authentication pages.
 *
 * @param props - See {@link AuthShellProps}
 * @returns The skip link and the card containing heading, content and footer
 * @example
 * <AuthShell title="Sign in" description="Welcome back." footer={<p>...</p>}>
 *   <form>...</form>
 * </AuthShell>
 */
export default function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1} className={styles.page}>
        <section className={styles.card} aria-labelledby="auth-title">
          <header className={styles.header}>
            <p className={styles.brand}>Veyra</p>
            <h1 id="auth-title" className={styles.title} tabIndex={-1}>
              {title}
            </h1>
            <p className={styles.description}>{description}</p>
          </header>
          {children}
          <footer className={styles.footer}>{footer}</footer>
        </section>
      </main>
    </>
  );
}
