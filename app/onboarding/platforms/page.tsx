import { requireAgent } from "@/lib/currentAgent";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import { OnboardingPlatformsView } from "@/components/onboarding/OnboardingPlatformsView";

export default async function Page() {
  const agent = await requireAgent();
  const initialSelected = SOCIAL_PLATFORMS.filter((p) => agent[p.field]).map((p) => p.key);

  return <OnboardingPlatformsView initialSelected={initialSelected} />;
}
