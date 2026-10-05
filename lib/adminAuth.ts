import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_auth";

function expectedToken(): string {
  return crypto
    .createHash("sha256")
    .update(`${process.env.ADMIN_PASSWORD ?? ""}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

export function computeAdminToken(): string {
  return expectedToken();
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return Boolean(token) && token === expectedToken();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
