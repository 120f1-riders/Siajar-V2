import "server-only";
import crypto from "node:crypto";
import { getIntegrations, saveIntegrations } from "./integrations";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL =
  process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const USERINFO_URL =
  process.env.GOOGLE_USERINFO_URL ||
  "https://openidconnect.googleapis.com/v1/userinfo";
const UPLOAD_URL =
  process.env.GOOGLE_DRIVE_UPLOAD_URL ||
  "https://www.googleapis.com/upload/drive/v3/files";
const SCOPE = "openid email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly";

export function googleRedirectUri(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/api/google/callback`;
}

export async function buildGoogleAuthUrl(
  origin: string,
  state: string,
  params?: URLSearchParams
): Promise<string> {
  const connection = await getIntegrations();
  if (!connection.google_client_id) throw new Error("GOOGLE_NOT_CONFIGURED");
  const baseParams = new URLSearchParams({
    client_id: connection.google_client_id,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });  const base = new URLSearchParams(baseParams);
  if (params) {
    for (const [k, v] of params) base.set(k, v);
  }
  return `${AUTH_URL}?${base.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(
      data.error_description ||
        data.error ||
        `Google menolak permintaan token (${res.status}).`
    );
  }
  return data;
}

export async function connectGoogleAccount(
  origin: string,
  code: string
): Promise<string> {
  const connection = await getIntegrations();
  if (!connection.google_client_id || !connection.google_client_secret) {
    throw new Error("GOOGLE_NOT_CONFIGURED");
  }

  const token = await postToken({
    code,
    client_id: connection.google_client_id,
    client_secret: connection.google_client_secret,
    redirect_uri: googleRedirectUri(origin),
    grant_type: "authorization_code",
  });

  if (!token.refresh_token) {
    throw new Error(
      "Google tidak mengirim refresh token. Coba hubungkan ulang dengan izin akses penuh."
    );
  }
  if (!token.access_token) {
    throw new Error("Google tidak mengirim access token.");
  }

  const info = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const profile = info.ok
    ? ((await info.json()) as { email?: string })
    : { email: "" };

  await saveIntegrations({
    google_refresh_token: token.refresh_token,
    google_email: profile.email ?? "",
    google_connected_at: new Date().toISOString(),
  });

  // Buat folder tujuan bila belum ada
  try {
    let folderId = (await getIntegrations()).google_folder_id;
    if (!folderId) {
      const created = await ensureGoogleFolder(token.access_token);
      if (created) {
        folderId = created;
        await saveIntegrations({ google_folder_id: folderId });
      }
    }
  } catch {
    // Bila gagal buat folder, koneksi tetap dianggap berhasil; folder bisa dipilih nanti.
  }

  resetGoogleTokenCache();
  return profile.email ?? "";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export function resetGoogleTokenCache() {
  cachedToken = null;
}

export async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const connection = await getIntegrations();
  if (!connection.google_refresh_token)
    throw new Error("GOOGLE_NOT_CONNECTED");
  if (!connection.google_client_id || !connection.google_client_secret) {
    throw new Error("GOOGLE_NOT_CONFIGURED");
  }

  const token = await postToken({
    grant_type: "refresh_token",
    refresh_token: connection.google_refresh_token,
    client_id: connection.google_client_id,
    client_secret: connection.google_client_secret,
  });
  if (!token.access_token) throw new Error("Google tidak mengirim access token.");

  cachedToken = {
    token: token.access_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  };
  return token.access_token;
}

export async function uploadToDrive({
  name,
  sourceMime,
  targetMime,
  data,
  parentFolderId,
}: {
  name: string;
  sourceMime: string;
  targetMime: string;
  data: Buffer;
  parentFolderId?: string;
}): Promise<{ id: string; name: string; url: string }> {
  const accessToken = await getGoogleAccessToken();
  const boundary = `siajar_${crypto.randomBytes(12).toString("hex")}`;
  const metadata = JSON.stringify({
    name,
    mimeType: targetMime,
    ...(parentFolderId ? { parents: [parentFolderId] } : {}),
  });

  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      "utf8"
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Type: ${sourceMime}\r\n\r\n`,
      "utf8"
    ),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"),
  ]);

  const res = await fetch(
    `${UPLOAD_URL}?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
      cache: "no-store",
    }
  );

  const payload = (await res.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    webViewLink?: string;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(
      payload.error?.message ||
        `Google Drive menolak unggahan (${res.status}).`
    );
  }
  if (!payload.webViewLink) {
    throw new Error("Google Drive tidak mengembalikan tautan file.");
  }

  return {
    id: payload.id ?? "",
    name: payload.name ?? name,
    url: payload.webViewLink,
  };
}

async function ensureGoogleFolder(accessToken: string): Promise<string | null> {
  const name = "SIAJAR Folder Soal Google";

  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
      }),
    }
  );

  if (createRes.ok) {
    const data = (await createRes.json()) as { id?: string };
    if (data.id) return data.id;
  }

  // Cari folder yang sudah ada atas nama yang sama
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false`
  );
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&corpora=user&maxResults=10`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (listRes.ok) {
    const listData = (await listRes.json()) as { files?: Array<{ id: string }> };
    if (listData.files?.length) return listData.files[0].id;
  }

  return null;
}

export async function listDriveFolders(
  accessToken: string
): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&pageSize=100",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gagal membaca daftar folder Drive (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { files?: Array<{ id: string; name: string }> };
  return data.files ?? [];
}
