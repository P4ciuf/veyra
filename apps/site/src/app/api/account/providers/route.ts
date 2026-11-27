/**
 * Account settings endpoints for the OAuth providers linked to the current user.
 *
 * The session is read from the NextAuth JWT cookie with `getToken`, which keeps
 * the route independent of `SessionProvider` while still authenticating every
 * request. The account id is always taken from the token; the request body only
 * selects which provider to unlink.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { logger } from "shared";
import { listLinkedProviders, unlinkProvider } from "@/services/accountProviders";

/**
 * Reads the user id from the signed NextAuth JWT.
 *
 * @param req - Incoming request carrying the session cookie
 * @returns The `sub` claim, or `null` when there is no valid session
 */
async function currentUserId(req: NextRequest): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return null;
  }

  const token = await getToken({
    req,
    secret,
    // Mirrors `useSecureCookies` in buildAuthOptions so the right cookie name is read.
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? true,
  });
  return typeof token?.sub === "string" ? token.sub : null;
}

/**
 * Handles `GET /api/account/providers`.
 *
 * @param req - Authenticated request
 * @returns 200 with `{ providers }`, 500 when auth is not configured or the query fails, 401 without a session
 */
export async function GET(req: NextRequest) {
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 500 });
  }

  const userId = await currentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const providers = await listLinkedProviders(userId);
    return NextResponse.json({ providers });
  } catch (err) {
    logger.error("Could not list linked providers:", err);
    return NextResponse.json({ error: "Unable to load linked providers" }, { status: 500 });
  }
}

/**
 * Handles `DELETE /api/account/providers` with a `{ provider }` JSON body.
 *
 * @param req - Authenticated request whose body names the provider to unlink
 * @returns 200 with the remaining providers, 400 for a bad body or provider id,
 * 401 without a valid session, 404 when the provider is not linked, 409 when it
 * is the last sign-in method, and 500 for unexpected failures
 */
export async function DELETE(req: NextRequest) {
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 500 });
  }

  const userId = await currentUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    throw error;
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const provider = (body as Record<string, unknown>).provider;
  if (typeof provider !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const outcome = await unlinkProvider(userId, provider);
    switch (outcome) {
      case "unlinked":
        return NextResponse.json({ providers: await listLinkedProviders(userId) });
      case "invalid-provider":
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
      case "not-linked":
        return NextResponse.json({ error: "Provider is not linked" }, { status: 404 });
      case "unknown-user":
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      case "last-sign-in-method":
        return NextResponse.json(
          { error: "Add another sign-in method before unlinking this one" },
          { status: 409 },
        );
    }
  } catch (err) {
    logger.error("Could not unlink provider:", err);
    return NextResponse.json({ error: "Unable to unlink provider" }, { status: 500 });
  }
}
