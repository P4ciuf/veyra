/**
 * Registration endpoint for the site.
 *
 * It validates the three form fields, rejects a duplicate email with 409 and
 * stores the new user through the shared database service. Unique-constraint
 * races are mapped to the same 409 response as a pre-check duplicate.
 */
import { Prisma } from "database";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "shared";
import { createUser, getUser } from "@/services/auth";

/**
 * Handles `POST /api/auth/register`.
 *
 * @param req - Request whose JSON body contains `username`, `email` and `password`
 * @returns 201 with the created user, 400 for malformed JSON or invalid input,
 * 409 for a duplicate email and 500 for any unexpected failure
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      // JSON.parse throws SyntaxError for empty and malformed bodies; those are
      // client errors, while other failures keep the generic 500 response.
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }
      throw error;
    }

    // JSON can parse to null, arrays or scalars; reject all of them before
    // destructuring so no value reaches the field checks as `undefined`.
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { username, email, password } = body as Record<string, unknown>;

    if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 24) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 },
      );
    }

    const existingUser = await getUser({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await createUser({
      email: normalizedEmail,
      password,
      username: normalizedUsername,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    // P2002 is the unique-constraint violation raised when another request
    // inserts the same email between the lookup above and this insert.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    logger.error("Registration error:", error);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
