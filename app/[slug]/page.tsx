import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getAgentBySlug } from "@/lib/agent";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/adminAuth";
import { LISTINGS_ENABLED } from "@/lib/constants";
import { ProfileView } from "@/components/ProfileView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAgentBySlug(slug);
  if (!data) return { title: "Agent not found" };
  const role = data.agent.role ? `, ${data.agent.role}` : "";
  const agency = data.agent.agency ? ` at ${data.agent.agency}` : "";
  return {
    title: `${data.agent.name} — agentprofile.ae`,
    description: `${data.agent.name}${role}${agency}.`,
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getAgentBySlug(slug);

  if (!data) notFound();

  const [session, isReviewer] = await Promise.all([auth(), isAdminAuthed()]);
  const isOwner = session?.user?.id === data.agent.id;

  const missingListing = LISTINGS_ENABLED && data.agent.properties.length === 0;
  const pendingApproval = !data.agent.isApproved;
  const isLive = !missingListing && !pendingApproval;

  if (!isLive && !isOwner && !isReviewer) notFound();

  if (!isOwner && !isReviewer) {
    await prisma.analyticsEvent
      .create({ data: { agentId: data.agent.id, type: "profile_view" } })
      .catch(() => {});
  }

  const previewNotice = isLive
    ? null
    : pendingApproval && missingListing
      ? "Preview only — add at least one listing and wait for team approval to go live."
      : pendingApproval
        ? "Preview only — your profile is pending team approval."
        : "Preview only — add at least one listing to go live.";

  return <ProfileView agent={data.agent} stats={data.stats} previewNotice={previewNotice} />;
}
