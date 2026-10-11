import { hasAnySocial } from "@/lib/socials";
import { requireAgent } from "@/lib/currentAgent";
import { OnboardingReviewView } from "@/components/onboarding/OnboardingReviewView";

export default async function Page() {
  const agent = await requireAgent();
  return (
    <OnboardingReviewView
      hasBio={agent.bio.trim().length > 0}
      hasPhoto={Boolean(agent.photoUrl)}
      hasSocial={hasAnySocial(agent) || agent.links.length > 0}
      initialSpecialities={agent.specialities}
      initialAreas={agent.areas}
      initialWhatsapp={agent.whatsapp}
    />
  );
}
