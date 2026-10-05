import crypto from "crypto";

// Verification/reset links carry a long random token. We only ever store its
// sha256 hash — if the database were ever exposed, a stored hash can't be
// replayed as a working link the way a raw token could.

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
