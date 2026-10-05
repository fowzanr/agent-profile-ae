import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { generateBio } from "@/lib/bioGenerator";

const schema = z.object({
  name: z.string(),
  role: z.string(),
  agency: z.string(),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  specialities: z.string(),
  areas: z.string(),
  languages: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const bio = generateBio(parsed.data);
  return NextResponse.json({ bio });
}
