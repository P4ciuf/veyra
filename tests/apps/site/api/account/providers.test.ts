/**
 * Tests for `GET`/`DELETE /api/account/providers`.
 *
 * The JWT decoder and the provider service are mocked because they are the
 * external boundaries (cookie cryptography and the database); `NextResponse`
 * stays real so status codes and JSON bodies are the ones clients receive.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  listLinkedProviders: vi.fn(),
  unlinkProvider: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({ getToken: mocks.getToken }));
vi.mock("@/services/accountProviders", () => ({
  listLinkedProviders: mocks.listLinkedProviders,
  unlinkProvider: mocks.unlinkProvider,
}));
vi.mock("shared", () => ({ logger: { error: mocks.loggerError } }));

import { DELETE, GET } from "../../../../../apps/site/src/app/api/account/providers/route.js";

/** Request type inferred from the route so the test needs no `next/server` import. */
type RouteRequest = Parameters<typeof GET>[0];

/**
 * Builds a request-shaped object exposing the mocked JSON body.
 *
 * @param body - Body returned by `req.json()`
 * @returns A request carrying that body
 */
function request(body?: unknown): RouteRequest {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as RouteRequest;
}

/** Request reused by the assertions on the JWT options. */
let currentRequest: RouteRequest;
/** Saved environment values, restored after every test. */
let savedSecret: string | undefined;
let savedUrl: string | undefined;

beforeEach(() => {
  savedSecret = process.env.NEXTAUTH_SECRET;
  savedUrl = process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  vi.clearAllMocks();
  mocks.getToken.mockResolvedValue({ sub: "user-1" });
  mocks.listLinkedProviders.mockResolvedValue(["github", "discord"]);
  mocks.unlinkProvider.mockResolvedValue("unlinked");
  currentRequest = request({ provider: "github" });
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.NEXTAUTH_SECRET;
  else process.env.NEXTAUTH_SECRET = savedSecret;
  if (savedUrl === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = savedUrl;
});

describe("GET /api/account/providers", () => {
  it("returns the linked providers of the session user", async () => {
    const response = await GET(currentRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ providers: ["github", "discord"] });
    expect(mocks.listLinkedProviders).toHaveBeenCalledWith("user-1");
    expect(mocks.getToken).toHaveBeenCalledWith({
      req: currentRequest,
      secret: "test-secret",
      secureCookie: false,
    });
  });

  it("uses the Secure cookie name when the public URL is HTTPS", async () => {
    process.env.NEXTAUTH_URL = "https://veyra.example";

    await GET(currentRequest);

    expect(mocks.getToken).toHaveBeenCalledWith({
      req: currentRequest,
      secret: "test-secret",
      secureCookie: true,
    });
  });

  it("returns 401 when the cookie has no usable session user", async () => {
    mocks.getToken.mockResolvedValue(null);

    const response = await GET(currentRequest);

    expect(response.status).toBe(401);
    expect(mocks.listLinkedProviders).not.toHaveBeenCalled();
  });

  it("returns 500 when the auth secret is missing", async () => {
    delete process.env.NEXTAUTH_SECRET;

    const response = await GET(currentRequest);

    expect(response.status).toBe(500);
    expect(mocks.getToken).not.toHaveBeenCalled();
  });

  it("logs and returns 500 when the provider query fails", async () => {
    mocks.listLinkedProviders.mockRejectedValue(new Error("db down"));

    const response = await GET(currentRequest);

    expect(response.status).toBe(500);
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "Could not list linked providers:",
      expect.any(Error),
    );
  });
});

describe("DELETE /api/account/providers", () => {
  it("unlinks the requested provider and returns the remaining ones", async () => {
    const response = await DELETE(currentRequest);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ providers: ["github", "discord"] });
    expect(mocks.unlinkProvider).toHaveBeenCalledWith("user-1", "github");
  });

  it("returns 400 for malformed JSON and for a missing provider field", async () => {
    const badJson = request();
    vi.mocked(badJson.json).mockRejectedValue(new SyntaxError("bad json"));

    expect((await DELETE(badJson)).status).toBe(400);
    expect((await DELETE(request(null))).status).toBe(400);
    expect((await DELETE(request({ provider: 42 }))).status).toBe(400);
    expect(mocks.unlinkProvider).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    mocks.getToken.mockResolvedValue(null);

    expect((await DELETE(currentRequest)).status).toBe(401);
    expect(mocks.unlinkProvider).not.toHaveBeenCalled();
  });

  it("maps each business outcome to the documented status", async () => {
    mocks.unlinkProvider.mockResolvedValueOnce("invalid-provider");
    mocks.unlinkProvider.mockResolvedValueOnce("not-linked");
    mocks.unlinkProvider.mockResolvedValueOnce("unknown-user");
    mocks.unlinkProvider.mockResolvedValueOnce("last-sign-in-method");

    expect((await DELETE(currentRequest)).status).toBe(400);
    expect((await DELETE(currentRequest)).status).toBe(404);
    expect((await DELETE(currentRequest)).status).toBe(401);
    const conflict = await DELETE(currentRequest);
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toEqual({
      error: "Add another sign-in method before unlinking this one",
    });
  });

  it("logs and returns 500 when unlinking fails unexpectedly", async () => {
    mocks.unlinkProvider.mockRejectedValue(new Error("db down"));

    const response = await DELETE(currentRequest);

    expect(response.status).toBe(500);
    expect(mocks.loggerError).toHaveBeenCalledWith("Could not unlink provider:", expect.any(Error));
  });
});
