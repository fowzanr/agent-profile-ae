import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");

  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Missing or invalid text" }, { status: 400 });
  }

  const buffer = await QRCode.toBuffer(text, {
    type: "png",
    width: 480,
    margin: 1,
    color: { dark: "#0A1220", light: "#FFFFFF" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
