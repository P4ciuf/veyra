/**
 * Account-provider helpers used by the account settings API.
 *
 * Only the three OAuth providers registered by `buildAuthOptions` can be
 * unlinked, and the last remaining sign-in method is never removed: a user with
 * no password hash and one linked provider would otherwise lose access to the
 * account. Unlinking removes the `Account` row only; platform data keyed by
 * `User.discordId` is left intact so tickets and warnings keep their references.
 */
import { prisma } from "database";
import { isOAuthProviderId, OAUTH_PROVIDER_IDS, type OAuthProviderId } from "@/lib/oauth";

/** Result of an unlink attempt, mapped to an HTTP status by the API route. */
export type UnlinkOutcome =
  /** The provider row was deleted. */
  | "unlinked"
  /** The provider id is not one of the registered OAuth providers. */
  | "invalid-provider"
  /** The user has no linked row for that provider. */
  | "not-linked"
  /** The user row no longer exists (stale session). */
  | "unknown-user"
  /** Deleting it would leave the user without any way to sign in. */
  | "last-sign-in-method";

/**
 * Lists the OAuth providers linked to a user, in the sign-in screen's order.
 *
 * Unknown provider values stored by an older configuration are ignored so a
 * stale row cannot make the UI offer an option the server does not support.
 *
 * @param userId - Primary key of the current user
 * @returns Registered provider ids that have an `Account` row for the user
 */
export async function listLinkedProviders(userId: string): Promise<OAuthProviderId[]> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true },
  });
  const linked = accounts
    .map((account) => account.provider)
    .filter((provider): provider is OAuthProviderId => isOAuthProviderId(provider));

  return OAUTH_PROVIDER_IDS.filter((id) => linked.includes(id));
}

/**
 * Unlinks one OAuth provider from a user after checking the sign-in safety rule.
 *
 * @param userId - Primary key of the current user
 * @param provider - Candidate provider id from the request body
 * @returns The outcome to report to the caller; never throws for business rules
 */
export async function unlinkProvider(userId: string, provider: string): Promise<UnlinkOutcome> {
  if (!isOAuthProviderId(provider)) {
    return "invalid-provider";
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, accounts: { select: { provider: true } } },
  });
  if (!user) {
    return "unknown-user";
  }

  const linked = user.accounts.map((account) => account.provider);
  if (!linked.includes(provider)) {
    return "not-linked";
  }
  if (!user.passwordHash && linked.length === 1) {
    return "last-sign-in-method";
  }

  // deleteMany also covers historical duplicate rows for the same provider.
  const { count } = await prisma.account.deleteMany({ where: { userId, provider } });
  return count > 0 ? "unlinked" : "not-linked";
}
