import { csvToList } from "@/lib/format";
import { BIO_MAX_LENGTH } from "@/lib/constants";

function shortJoin(items: string[], sep: string): string {
  return items.map((i) => i.trim()).filter(Boolean).join(sep);
}

/** "A", "A & B", "A, B & C" */
function andJoin(items: string[]): string {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  return `${clean.slice(0, -1).join(", ")} & ${clean[clean.length - 1]}`;
}

/**
 * Builds a short, Instagram-style bio (at most BIO_MAX_LENGTH characters) as up
 * to three lines: who you are, what and where you sell, and experience/languages.
 * When everything doesn't fit, the least important details are dropped first.
 */
export function generateBio(input: {
  name: string;
  role: string;
  agency: string;
  yearsExperience: number;
  specialities: string;
  areas: string;
  languages: string;
}): string {
  const role = input.role.trim() || "Real estate agent";
  const agency = input.agency.trim();
  let specialities = csvToList(input.specialities);
  let areas = csvToList(input.areas);
  const languages = csvToList(input.languages);
  const years = input.yearsExperience > 0 ? input.yearsExperience : 0;

  const experience = years === 0 ? "Newly licensed" : years === 1 ? "1 year experience" : `${years} years experience`;

  let withAgency = Boolean(agency);
  let withLanguages = languages.length > 0;

  const build = () => {
    const who = withAgency ? `${role} at ${agency}` : role;
    const what = andJoin(specialities) || "Residential sales & rentals";
    const where = shortJoin(areas, ", ") || "across the UAE";
    const extra = withLanguages ? `${experience} · ${shortJoin(languages, ", ")}` : experience;
    return [who, `${what} · ${where}`, extra].join("\n");
  };

  // Drop detail in order of importance until it fits.
  let bio = build();
  if (bio.length > BIO_MAX_LENGTH && withLanguages) {
    withLanguages = false;
    bio = build();
  }
  while (bio.length > BIO_MAX_LENGTH && (specialities.length > 1 || areas.length > 1)) {
    if (areas.length >= specialities.length && areas.length > 1) areas = areas.slice(0, -1);
    else specialities = specialities.slice(0, -1);
    bio = build();
  }
  if (bio.length > BIO_MAX_LENGTH && withAgency) {
    withAgency = false;
    bio = build();
  }
  return truncateBio(bio);
}

/** Cuts text to BIO_MAX_LENGTH at a word boundary, adding an ellipsis if shortened. */
export function truncateBio(text: string): string {
  if (text.length <= BIO_MAX_LENGTH) return text;
  const cut = text.slice(0, BIO_MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > BIO_MAX_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
