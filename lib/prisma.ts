import { PrismaClient, type Agent } from "@prisma/client";

// Secret Agent columns are omitted from every query by default, so they can never be
// passed to a client component or returned from an API by accident. Code that genuinely
// needs one (login, password reset, email verification) selects it explicitly.
export const AGENT_SECRET_FIELDS = {
  passwordHash: true,
  emailVerificationTokenHash: true,
  emailVerificationExpiresAt: true,
  passwordResetTokenHash: true,
  passwordResetExpiresAt: true,
} as const;

export type SafeAgent = Omit<Agent, keyof typeof AGENT_SECRET_FIELDS>;
/** What visitors to a public profile may see: no secrets and no private login email. */
export type PublicAgent = Omit<SafeAgent, "email">;

function createClient() {
  return new PrismaClient({ omit: { agent: AGENT_SECRET_FIELDS } });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
