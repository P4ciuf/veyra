/**
 * Tests for `apps/site/src/services/hash.ts`.
 *
 * argon2 is replaced at the native-binding boundary: the suite pins the fixed
 * Argon2id parameters shared by registration and sign-in without performing real
 * (intentionally expensive) key derivation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hash: vi.fn(),
  verify: vi.fn(),
  argon2id: Symbol("argon2id"),
}));

vi.mock("argon2", () => ({
  default: { hash: mocks.hash, verify: mocks.verify, argon2id: mocks.argon2id },
}));

import { createHash, verifyHash } from "../../../apps/site/src/services/hash";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createHash", () => {
  it("derives an Argon2id hash with the fixed parameters", async () => {
    mocks.hash.mockResolvedValue("$argon2id$stored");

    await expect(createHash("correct horse")).resolves.toBe("$argon2id$stored");
    expect(mocks.hash).toHaveBeenCalledWith("correct horse", {
      type: mocks.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  });

  it("propagates a hashing failure", async () => {
    mocks.hash.mockRejectedValue(new Error("hashing failed"));

    await expect(createHash("x")).rejects.toThrow("hashing failed");
  });
});

describe("verifyHash", () => {
  it("verifies the plaintext against the stored hash in the right order", async () => {
    mocks.verify.mockResolvedValue(true);

    await expect(verifyHash("secret", "$argon2id$stored")).resolves.toBe(true);
    expect(mocks.verify).toHaveBeenCalledWith("$argon2id$stored", "secret");
  });

  it("returns false for a mismatched password", async () => {
    mocks.verify.mockResolvedValue(false);

    await expect(verifyHash("wrong", "$argon2id$stored")).resolves.toBe(false);
  });

  it("propagates a verification failure", async () => {
    mocks.verify.mockRejectedValue(new Error("corrupt hash"));

    await expect(verifyHash("secret", "bad")).rejects.toThrow("corrupt hash");
  });
});
