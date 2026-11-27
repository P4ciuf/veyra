/**
 * Builds the NextAuth configuration for the site.
 *
 * The function is pure apart from the injected adapter, so the provider
 * registration, scopes and session policy can be unit-tested without starting
 * NextAuth or importing the Prisma singleton.
 */
import { randomBytes, randomUUID } from "crypto";
import type { NextAuthOptions, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { logger } from "shared";
import { ROUTES } from "@/lib/routes";
import { getUser } from "@/services/auth";
import { verifyHash } from "@/services/hash";

/** Subset of `process.env` consumed by the auth handler. */
export interface AuthEnvironment {
  /** GitHub OAuth application client id. */
  GITHUB_CLIENT_ID?: string;
  /** GitHub OAuth application client secret. */
  GITHUB_CLIENT_SECRET?: string;
  /** Google OAuth client id. */
  GOOGLE_CLIENT_ID?: string;
  /** Google OAuth client secret. */
  GOOGLE_CLIENT_SECRET?: string;
  /** Discord application id used as the OAuth client id. */
  DISCORD_CLIENT_ID?: string;
  /** Discord OAuth client secret. */
  DISCORD_CLIENT_SECRET?: string;
  /** Public site URL; its protocol decides whether cookies are `Secure`. */
  NEXTAUTH_URL?: string;
  /** Secret used to sign the session token. */
  NEXTAUTH_SECRET?: string;
  /** Set to `development` to enable NextAuth debug logging. */
  NODE_ENV?: string;
}

/** GitHub `/user` profile fields used by this application. */
interface GitHubProfile {
  id: number;
  login?: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

/** Google OpenID profile fields used by this application. */
interface GoogleProfile {
  sub: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

/** Discord `/users/@me` profile fields used by this application. */
interface DiscordProfile {
  id: string;
  username?: string;
  global_name?: string | null;
  discriminator?: string;
  email?: string | null;
  avatar?: string | null;
}

/** NextAuth user carrying the Discord snowflake id needed by the platform. */
interface DiscordAuthUser extends User {
  /** Stable Discord account id from the `/users/@me` profile. */
  discordId: string;
}

/**
 * Persists a Discord account id on the platform user row.
 *
 * Injected into `buildAuthOptions` so the auth configuration stays pure and the
 * database write can be unit-tested without a Prisma client. Resolves `true` when
 * the id is stored or already present, `false` when another user owns it.
 */
export type DiscordIdPersister = (userId: string, discordId: string) => Promise<boolean>;

/**
 * Builds the Discord avatar URL, including animated avatars and the default one.
 *
 * @param profile - Discord profile returned by `/users/@me`
 * @returns A CDN URL, or `null` only when the id itself is missing
 */
function discordAvatarUrl(profile: DiscordProfile): string | null {
  if (!profile.id) {
    return null;
  }
  if (profile.avatar) {
    const extension = profile.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}`;
  }
  const fallback = Number(profile.discriminator ?? "0") % 5;
  const index = Number.isFinite(fallback) ? fallback : 0;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

/**
 * Creates the complete NextAuth options object.
 *
 * `allowDangerousEmailAccountLinking` is intentionally left at its safe default
 * (`false`) for every OAuth provider: an existing account is never taken over
 * merely because an unverified email matches. A signed-in user can still link a
 * provider explicitly, which NextAuth handles by linking the provider account
 * to the current session user.
 *
 * JWT sessions are required because NextAuth's Credentials provider cannot use
 * database sessions; keeping `strategy: "database"` would leave the existing
 * email/password login without a usable session.
 *
 * @param env - Environment snapshot; missing OAuth values are passed as empty strings so NextAuth reports a configuration error instead of crashing
 * @param adapter - Prisma-backed adapter, injected to keep this function testable
 * @param persistDiscordId - Writes the Discord id to the user row after sign-in
 * @returns Options ready to pass to `NextAuth()`
 */
export function buildAuthOptions(
  env: AuthEnvironment,
  adapter: Adapter,
  persistDiscordId: DiscordIdPersister,
): NextAuthOptions {
  // HTTP-based local development must not receive Secure cookies; behind the
  // HTTPS proxy NEXTAUTH_URL is https:// and cookies stay Secure.
  const useSecureCookies = env.NEXTAUTH_URL?.startsWith("https://") ?? true;

  return {
    adapter,
    providers: [
      GitHubProvider({
        clientId: env.GITHUB_CLIENT_ID ?? "",
        clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
        authorization: { params: { scope: "read:user user:email" } },
        /** Maps a GitHub profile to the NextAuth user shape. */
        profile(profile: GitHubProfile): User {
          return {
            id: String(profile.id),
            name: profile.name ?? profile.login ?? null,
            email: profile.email ?? null,
            image: profile.avatar_url ?? null,
          };
        },
      }),
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        authorization: { params: { scope: "openid email profile" } },
        /** Maps a Google profile to the NextAuth user shape. */
        profile(profile: GoogleProfile): User {
          return {
            id: profile.sub,
            name: profile.name ?? profile.email ?? null,
            email: profile.email ?? null,
            image: profile.picture ?? null,
          };
        },
      }),
      DiscordProvider({
        clientId: env.DISCORD_CLIENT_ID ?? "",
        clientSecret: env.DISCORD_CLIENT_SECRET ?? "",
        authorization: {
          url: "https://discord.com/api/oauth2/authorize",
          params: { scope: "identify email" },
        },
        /**
         * Maps a Discord profile to the NextAuth user shape, keeping the stable
         * account id as `discordId` so the adapter stores it on first sign-in.
         */
        profile(profile: DiscordProfile): DiscordAuthUser {
          return {
            id: String(profile.id),
            discordId: profile.id,
            name: profile.global_name ?? profile.username ?? null,
            email: profile.email ?? null,
            image: discordAvatarUrl(profile),
          };
        },
      }),
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        /** Validates email/password against the existing hashed-password user row. */
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await getUser({ email: credentials.email });

          if (!user?.passwordHash) {
            return null;
          }

          const isValid = await verifyHash(String(credentials.password), user.passwordHash);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            name: user.username,
            email: user.email,
            image: user.avatarUrl,
          };
        },
      }),
    ],
    session: {
      strategy: "jwt",
      maxAge: 14 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
      generateSessionToken: () => randomUUID?.() ?? randomBytes(32).toString("hex"),
    },
    events: {
      /**
       * Persists the Discord id on every Discord sign-in. First-time users are
       * already created with it by the adapter, but returning and explicitly
       * linked accounts reuse their row without a call to `updateUser`, so the
       * id is written here as well; other providers and credentials are ignored.
       *
       * A failed write is logged but never thrown: the OAuth exchange already
       * succeeded at this point, so propagating a database error would turn a
       * valid login into an error redirect without undoing the issued session.
       */
      async signIn({ user, account, profile }) {
        if (account?.provider !== "discord") {
          return;
        }
        const discordId = (profile as Partial<DiscordAuthUser> | undefined)?.discordId;
        if (typeof discordId !== "string" || discordId.length === 0) {
          return;
        }
        try {
          await persistDiscordId(user.id, discordId);
        } catch (error) {
          logger.error("discord id persistence failed", {
            userId: user.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
    // Errors are rendered on the sign-in page as generic messages instead of
    // NextAuth's default error page (or a crash on missing configuration).
    pages: { signIn: ROUTES.signIn, signOut: ROUTES.signOut, error: ROUTES.signIn },
    secret: env.NEXTAUTH_SECRET,
    useSecureCookies,
    debug: env.NODE_ENV === "development",
  };
}
