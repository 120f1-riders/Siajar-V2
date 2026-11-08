import { NextResponse } from "next/server";
import { getAiConfig } from "@/lib/integrations";

export async function GET() {
  if (process.env.VERCEL) return new Response("Not found", { status: 404 });
  const config = await getAiConfig();
  return NextResponse.json({
    apiKeyPresent: Boolean(config.apiKey),
    apiKeyPrefix: config.apiKey.slice(0, 12),
    base: config.base,
    model: config.model,
  });
}
