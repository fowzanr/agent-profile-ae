import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const limit = rateLimit(`agent-login:${getClientIp(request)}`, 10, 15 * 60 * 1000);
        if (!limit.ok) return null;

        // passwordHash is omitted globally (lib/prisma.ts); login is the one place that reads it.
        const agent = await prisma.agent.findUnique({ where: { email }, omit: { passwordHash: false } });
        if (!agent) return null;

        const valid = await bcrypt.compare(password, agent.passwordHash);
        if (!valid) return null;

        return {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          slug: agent.slug,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.slug = (user as { slug: string }).slug;
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string; slug?: string }).id = token.id as string;
        (session.user as { id?: string; slug?: string }).slug = token.slug as string;
      }
      return session;
    },
  },
});
