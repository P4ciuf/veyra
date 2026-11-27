/**
 * Adapts a NextAuth user object to the platform's `User` columns.
 *
 * The NextAuth Prisma adapter writes only the standard fields (`name`, `email`,
 * `image`, `emailVerified`), but the platform table also requires `username`
 * and mirrors the avatar in `avatarUrl`. Filling both here keeps first-time
 * OAuth users consistent with users created by `/api/auth/register`.
 */
import { randomBytes } from "crypto";

/** Standard user fields supplied by the adapter when it creates a user. */
export interface NewOAuthUserData {
  /** Display name from the provider profile, when it provided one. */
  name?: string | null;
  /** Email from the provider profile; `null` when the provider omitted it. */
  email?: string | null;
  /** Avatar URL from the provider profile. */
  image?: string | null;
  /** Email verification timestamp; OAuth users created by NextAuth keep it `null`. */
  emailVerified?: Date | null;
}

/** Platform-specific columns added before the row is inserted. */
export interface PlatformUserFields {
  /** Required display name; falls back to the local generated-name convention. */
  username: string;
  /** Avatar mirrored from `image` so existing site code keeps working. */
  avatarUrl: string | null;
}

/**
 * Derives the required `username` from the provider display name or email.
 *
 * @param name - Display name supplied by the provider
 * @param email - Email supplied by the provider
 * @returns A non-empty username using the existing `user-<hex>` fallback
 */
function deriveUsername(name: string | null | undefined, email: string | null | undefined): string {
  const candidate = name?.trim() || email?.split("@")[0]?.trim();
  return candidate || `user-${randomBytes(12).toString("hex")}`;
}

/**
 * Builds the platform-specific columns for a newly created OAuth user.
 *
 * @param input - Standard user fields from the NextAuth adapter
 * @returns The `username` and `avatarUrl` values to merge into the insert
 * @example
 * completePlatformUser({ name: "Octocat", image: "https://…" });
 * // → { username: "Octocat", avatarUrl: "https://…" }
 */
export function completePlatformUser(input: NewOAuthUserData): PlatformUserFields {
  return {
    username: deriveUsername(input.name, input.email),
    avatarUrl: input.image ?? null,
  };
}
