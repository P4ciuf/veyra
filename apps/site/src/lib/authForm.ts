/**
 * Form value types and client-side validation for the sign-in and registration
 * pages. The limits mirror the existing `POST /api/auth/register` contract so
 * the UI never rejects a payload the API would accept, nor accepts one it would
 * reject. No extra password policy is invented here.
 */

/** Minimum username length accepted by the registration endpoint. */
const USERNAME_MIN_LENGTH = 3;
/** Maximum username length accepted by the registration endpoint. */
const USERNAME_MAX_LENGTH = 24;
/** Maximum email length accepted by the registration endpoint. */
const EMAIL_MAX_LENGTH = 254;
/** Minimum password length accepted by the registration endpoint. */
const PASSWORD_MIN_LENGTH = 8;
/** Maximum password length accepted by the registration endpoint. */
const PASSWORD_MAX_LENGTH = 128;
/** Same email shape used by the registration endpoint. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Values collected by the sign-in form. */
export interface SignInValues {
  /** User's email address. */
  email: string;
  /** User's password, sent only to the existing credentials provider. */
  password: string;
}

/** Values collected by the registration form. */
export interface RegisterValues {
  /** Public username, 3–24 characters after trimming. */
  username: string;
  /** Email address, normalised by the registration endpoint. */
  email: string;
  /** New password, 8–128 characters. */
  password: string;
  /** Repeated password, required only by the client to catch typos. */
  confirmPassword: string;
}

/** Per-field validation messages, keyed by the corresponding form value. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Validates sign-in input. Only presence and email shape are checked: the
 * credentials provider owns authentication and password policy.
 *
 * @param values - Current values of the sign-in form
 * @returns Messages keyed by invalid field; empty when the form is valid
 * @example
 * validateSignIn({ email: "", password: "" });
 * // → { email: "Enter your email address.", password: "Enter your password." }
 */
export function validateSignIn(values: SignInValues): FieldErrors<SignInValues> {
  const errors: FieldErrors<SignInValues> = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

/**
 * Validates registration input against the existing registration endpoint's
 * constraints, plus an explicit password-confirmation check.
 *
 * @param values - Current values of the registration form
 * @returns Messages keyed by invalid field; empty when the form is valid
 * @example
 * validateRegister({ username: "ab", email: "a@b.co", password: "12345678", confirmPassword: "12345678" });
 * // → { username: "Username must be between 3 and 24 characters." }
 */
export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  const username = values.username.trim();
  const email = values.email.trim();

  if (!username) {
    errors.username = "Enter a username.";
  } else if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    errors.username = "Username must be between 3 and 24 characters.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter a password.";
  } else if (
    values.password.length < PASSWORD_MIN_LENGTH ||
    values.password.length > PASSWORD_MAX_LENGTH
  ) {
    errors.password = "Password must be between 8 and 128 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/**
 * Reports whether a validation result contains at least one message.
 *
 * @template T - Shape of the validated form values
 * @param errors - Validation result to inspect
 * @returns `true` when any field has an error
 */
export function hasFieldErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some((message) => message !== undefined);
}
