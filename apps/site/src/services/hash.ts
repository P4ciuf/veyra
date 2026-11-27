/**
 * Password hashing helpers for the registration and credentials sign-in flows.
 *
 * Argon2id parameters are fixed here: the registration endpoint writes hashes
 * with them and the credentials provider verifies with the same settings, so
 * changing a parameter would invalidate hashes already stored in the database.
 */
import argon2 from "argon2";

/**
 * Creates an Argon2id hash for a plaintext password.
 *
 * @param password - Plaintext password supplied by the registration form
 * @returns The encoded hash stored in `User.passwordHash`
 */
export async function createHash(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verifies a plaintext password against a stored Argon2id hash.
 *
 * @param password - Plaintext password supplied by the sign-in form
 * @param hashedPassword - Encoded hash read from `User.passwordHash`
 * @returns `true` only when the password matches the stored hash
 */
export async function verifyHash(password: string, hashedPassword: string): Promise<boolean> {
  return argon2.verify(hashedPassword, password);
}
