/**
 * Tests for `apps/site/src/app/api/auth/register/route.ts`.
 *
 * Only the real boundaries are mocked: the `database` barrel (the route needs just
 * the `Prisma` error class, so the generated client is never loaded), the shared
 * logger (file I/O) and the two data-access helpers. `NextResponse.json` is
 * exercised for real, so the assertions cover the actual status, content type and
 * JSON body Next.js returns to the client.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  /** Minimal stand-in for Prisma's unique-constraint error, carrying its code. */
  class PrismaClientKnownRequestErrorStub extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }

  return {
    PrismaClientKnownRequestError: PrismaClientKnownRequestErrorStub,
    getUser: vi.fn(),
    createUser: vi.fn(),
    loggerError: vi.fn(),
  };
});

vi.mock("database", () => ({
  Prisma: { PrismaClientKnownRequestError: mocks.PrismaClientKnownRequestError },
}));

vi.mock("shared", () => ({ logger: { error: mocks.loggerError } }));

vi.mock("@/services/auth", () => ({ getUser: mocks.getUser, createUser: mocks.createUser }));

import { POST } from "../../../../../apps/site/src/app/api/auth/register/route.js";

/** Builds a request-shaped object exposing the mocked JSON body. */
function request(body: unknown): Parameters<typeof POST>[0] {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as Parameters<typeof POST>[0];
}

/** Valid payload used as the baseline for the failure cases. */
const validBody = { username: "  ada  ", email: "  ADA@Example.COM ", password: "long-enough" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue(null);
  mocks.createUser.mockResolvedValue({ id: "u-1", email: "ada@example.com" });
});

describe("POST /api/auth/register", () => {
  it("normalises the profile fields and returns the created user with 201", async () => {
    const response = await POST(request(validBody));

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      message: "Account created successfully",
      user: { id: "u-1", email: "ada@example.com" },
    });
    expect(mocks.getUser).toHaveBeenCalledWith({ email: "ada@example.com" });
    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "long-enough",
      username: "ada",
    });
  });

  it("rejects a body with a missing or non-string field with 400", async () => {
    for (const body of [
      { email: "ada@example.com", password: "long-enough" },
      { username: 12, email: "ada@example.com", password: "long-enough" },
      {},
      [],
      "text",
      42,
    ]) {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid request body" });
    }
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects a null body with 400 before destructuring it", async () => {
    const response = await POST(request(null));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid request body" });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.loggerError).not.toHaveBeenCalled();
  });

  it("rejects a username outside 3–24 characters after trimming", async () => {
    for (const username of ["  ab  ", "a".repeat(25)]) {
      const response = await POST(request({ ...validBody, username }));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid username" });
    }
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed or overlong email after normalisation", async () => {
    for (const email of ["not-an-email", `${"a".repeat(250)}@example.com`]) {
      const response = await POST(request({ ...validBody, email }));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid email" });
    }
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("rejects a password outside 8–128 characters", async () => {
    for (const password of ["short", "a".repeat(129)]) {
      const response = await POST(request({ ...validBody, password }));
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Password must be between 8 and 128 characters",
      });
    }
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("returns 409 for an email that already exists before the insert", async () => {
    mocks.getUser.mockResolvedValue({ id: "existing" });

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Email already registered" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("maps a P2002 insert race to the same 409 response", async () => {
    mocks.createUser.mockRejectedValue(
      new mocks.PrismaClientKnownRequestError("duplicate key", { code: "P2002" }),
    );

    const response = await POST(request(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Email already registered" });
  });

  it("logs and returns 500 for an unexpected failure", async () => {
    const failure = new Error("db down");
    mocks.getUser.mockRejectedValue(failure);

    const response = await POST(request(validBody));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
    expect(mocks.loggerError).toHaveBeenCalledWith("Registration error:", failure);
  });

  it("returns 400 for malformed or empty JSON", async () => {
    for (const message of ["Unexpected token", "Unexpected end of JSON input"]) {
      const malformed = {
        json: vi.fn().mockRejectedValue(new SyntaxError(message)),
      } as unknown as Parameters<typeof POST>[0];

      const response = await POST(malformed);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid request body" });
      expect(mocks.loggerError).not.toHaveBeenCalled();
    }
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
});
