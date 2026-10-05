import { requireAgent } from "@/lib/currentAgent";
import { OnboardingPhotoBioView } from "@/components/onboarding/OnboardingPhotoBioView";

export default async function Page() {
  const agent = await requireAgent();
  return <OnboardingPhotoBioView initialPhotoUrl={agent.photoUrl} initialBio={agent.bio} slug={agent.slug} />;
}
