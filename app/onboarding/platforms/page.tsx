import { requireAgent } from "@/lib/currentAgent";
import { OnboardingPlatformsView } from "@/components/onboarding/OnboardingPlatformsView";

export default async function Page() {
  const agent = await requireAgent();
  const initialSelected: string[] = [];
  if (agent.instagramUrl) initialSelected.push("instagram");
  if (agent.linkedinUrl) initialSelected.push("linkedin");
  if (agent.tiktokUrl) initialSelected.push("tiktok");

  return <OnboardingPlatformsView initialSelected={initialSelected} />;
}
