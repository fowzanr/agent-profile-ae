import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAgent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const agent = await prisma.agent.findUnique({
    where: { id: session.user.id },
    include: { links: { orderBy: { order: "asc" } } },
  });

  if (!agent) redirect("/login");
  return agent;
}
