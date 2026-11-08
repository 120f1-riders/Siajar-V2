import { NextResponse } from "next/server";
import { getAiConfig } from "@/lib/integrations";

export async function GET() {
  const config = getAiConfig();
  return NextResponse.json({
    apiKeyPresent: Boolean(config.apiKey),
    apiKeyPrefix: config.apiKey.slice(0, 12),
    base: config.base,
    model: config.model,
  });
}
