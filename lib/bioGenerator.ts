import { csvToList } from "@/lib/format";

function humanJoin(items: string[]): string {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

export function generateBio(input: {
  name: string;
  role: string;
  agency: string;
  yearsExperience: number;
  specialities: string;
  areas: string;
  languages: string;
}): string {
  const firstName = input.name.trim().split(/\s+/)[0] || "This agent";
  const role = input.role.trim() || "real estate agent";
  const agency = input.agency.trim();
  const specialities = humanJoin(csvToList(input.specialities)) || "residential sales and rentals";
  const areas = humanJoin(csvToList(input.areas)) || "the UAE";
  const languageList = csvToList(input.languages);
  const years = input.yearsExperience > 0 ? input.yearsExperience : null;

  const atAgency = agency ? ` at ${agency}` : "";
  const experiencePhrase = years
    ? years === 1
      ? "with a year of hands-on experience"
      : `with ${years} years of hands-on experience`
    : "newly licensed and ready to prove it";
  const languageSentence =
    languageList.length > 0 ? ` Fluent in ${humanJoin(languageList)}, so nothing gets lost in translation.` : "";

  const templates = [
    `${firstName} is a ${role}${atAgency}, ${experiencePhrase} in ${specialities} across ${areas}. Clients know ${firstName} for being responsive, detail-oriented, and genuinely invested in getting the deal right.${languageSentence}`,
    `${firstName} helps buyers, sellers, and tenants navigate ${areas} with confidence, specialising in ${specialities}. ${agency ? `At ${agency}, ${firstName}` : firstName} is known for clear communication and follow-through from first call to keys in hand.${languageSentence}`,
    `As a ${role}${atAgency}, ${firstName} has built a track record in ${specialities} throughout ${areas}, ${experiencePhrase}. The focus is simple: make the process smooth and keep clients informed at every step.${languageSentence}`,
  ];

  return templates[Math.floor(Math.random() * templates.length)].replace(/\s+/g, " ").trim();
}
