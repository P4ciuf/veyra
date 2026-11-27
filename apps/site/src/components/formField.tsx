/**
 * Reusable labelled text field for the account forms.
 * It wires the label, help text, error message and ARIA attributes together so
 * each field meets the Veyra input specification without repeating markup.
 */
"use client";

import { useState, type ReactNode } from "react";
import styles from "./auth.module.css";
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";

/** Props for {@link FormField}. */
export interface FormFieldProps {
  /** Unique id shared by the input and its label; also used as the error-summary target. */
  id: string;
  /** Form field name submitted with the form. */
  name: string;
  /** Visible label text; the required marker is added automatically. */
  label: string;
  /** Current value, controlled by the parent form. */
  value: string;
  /** Called with the new string on every change. */
  onChange: (value: string) => void;
  /** Called when the control loses focus, so the parent can validate on blur. */
  onBlur: () => void;
  /** Native input type; `password` adds a show/hide toggle. */
  type?: "text" | "email" | "password";
  /** Autocomplete hint required by WCAG 1.3.5. */
  autoComplete: string;
  /** Short in-field hint; placeholders are never used as labels. */
  placeholder?: string;
  /** Marks the control as required in both markup and the visible label. */
  required?: boolean;
  /** Validation message; switches the field into its error state. */
  error?: string;
  /** Persistent guidance shown under the control when there is no error. */
  help?: ReactNode;
  /** Disables the control while the form is submitting. */
  disabled?: boolean;
  /** Optimises the on-screen keyboard for email or plain text. */
  inputMode?: "text" | "email";
  /** Mirrors the server-side maximum length where one is defined. */
  maxLength?: number;
}

/**
 * Renders a labelled input with token-based states and accessible errors.
 *
 * @param props - See {@link FormFieldProps}
 * @returns A single form field with label, input and help/error region
 * @example
 * <FormField id="email" name="email" label="Email" value={email}
 *   onChange={setEmail} onBlur={validateEmail} type="email"
 *   autoComplete="email" required error={errors.email} />
 */
export default function FormField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  autoComplete,
  placeholder,
  required = false,
  error,
  help,
  disabled = false,
  inputMode,
  maxLength,
}: FormFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          className={`${styles.input} ${isPassword ? styles.inputWithAction : ""}`}
          name={name}
          type={isPassword && revealed ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : help ? helpId : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            aria-controls={id}
            disabled={disabled}
          >
            {revealed ? (
              <EyeOffIcon className={styles.icon} aria-hidden="true" />
            ) : (
              <EyeIcon className={styles.icon} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          <CircleAlertIcon className={styles.icon} aria-hidden="true" />
          {error}
        </p>
      ) : help ? (
        <div id={helpId} className={styles.help}>
          {help}
        </div>
      ) : null}
    </div>
  );
}
