import { requireAgent } from "@/lib/currentAgent";
import { socialUrlsOf } from "@/lib/socials";
import { OnboardingLinksView } from "@/components/onboarding/OnboardingLinksView";

export default async function Page({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const agent = await requireAgent();
  const { p } = await searchParams;
  const platforms = p ? p.split(",").filter(Boolean) : [];

  return (
    <OnboardingLinksView
      platforms={platforms}
      initialUrls={socialUrlsOf(agent)}
      initialLinks={agent.links.map((l) => ({ id: l.id, label: l.label, url: l.url }))}
    />
  );
}
