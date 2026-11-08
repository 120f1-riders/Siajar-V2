import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import {
  buildGoogleAuthUrl,
  getGoogleAccessToken
} from "@/lib/google";
import { getIntegrations, saveIntegrations } from "@/lib/integrations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireUser(["admin"]);

  const url = new URL(req.url);
  const jar = await cookies();
  const state = crypto.randomBytes(24).toString("hex");

  jar.set("siajar_google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 600,
  });

  const connection = getIntegrations();
  if (!connection.google_client_id) {
    const target = new URL("/admin/pengaturan", url.origin);
    target.searchParams.set("google", "error");
    target.searchParams.set(
      "pesan",
      "Isi Client ID dan Client Secret Google terlebih dahulu."
    );
    return NextResponse.redirect(target);
  }

  const scope = "openid email https://www.googleapis.com/auth/drive.file";
  const redirectUri = `${url.origin.replace(/\/+$/, "")}/api/google/callback`;

  const qs = new URLSearchParams({
    client_id: connection.google_client_id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  // Redirect ke Google OAuth tanpa try/catch; prepare folder dilakukan di callback
  // setelah token berhasil didapat dari pergantian authorization code.
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${qs.toString()}`;
  return NextResponse.redirect(authUrl, 307);
}
