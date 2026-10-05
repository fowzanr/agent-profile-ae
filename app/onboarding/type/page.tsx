import { requireAgent } from "@/lib/currentAgent";
import { OnboardingTypeView } from "@/components/onboarding/OnboardingTypeView";

export default async function Page() {
  const agent = await requireAgent();
  return <OnboardingTypeView initialType={agent.accountType === "agency" ? "agency" : "agent"} />;
}
