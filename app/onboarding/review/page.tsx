import { requireAgent } from "@/lib/currentAgent";
import { OnboardingReviewView } from "@/components/onboarding/OnboardingReviewView";

export default async function Page() {
  const agent = await requireAgent();
  return (
    <OnboardingReviewView
      hasBio={agent.bio.trim().length > 0}
      hasPhoto={Boolean(agent.photoUrl)}
      hasSocial={Boolean(agent.instagramUrl || agent.linkedinUrl || agent.tiktokUrl || agent.links.length > 0)}
      initialSpecialities={agent.specialities}
      initialAreas={agent.areas}
      initialWhatsapp={agent.whatsapp}
    />
  );
}
