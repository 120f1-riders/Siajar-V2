import "server-only";
import { getDb } from "./db";

export type Integrations = {
  ai_api_key: string;
  ai_api_base: string;
  ai_model: string;
  google_client_id: string;
  google_client_secret: string;
  google_refresh_token: string;
  google_email: string;
  google_connected_at: string | null;
  google_folder_id: string;
};

const EMPTY: Integrations = {
  ai_api_key: "",
  ai_api_base: "",
  ai_model: "",
  google_client_id: "",
  google_client_secret: "",
  google_refresh_token: "",
  google_email: "",
  google_connected_at: null,
  google_folder_id: "",
};

export function getIntegrations(): Integrations {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO integrations (id) VALUES (1)").run();
  const row = db
    .prepare("SELECT * FROM integrations WHERE id = 1")
    .get() as Record<string, unknown> | undefined;
  if (!row) return { ...EMPTY };

  return {
    ai_api_key: String(row.ai_api_key ?? ""),
    ai_api_base: String(row.ai_api_base ?? ""),
    ai_model: String(row.ai_model ?? ""),
    google_client_id: String(row.google_client_id ?? ""),
    google_client_secret: String(row.google_client_secret ?? ""),
    google_refresh_token: String(row.google_refresh_token ?? ""),
    google_email: String(row.google_email ?? ""),
    google_connected_at: row.google_connected_at
      ? String(row.google_connected_at)
      : null,
    google_folder_id: String(row.google_folder_id ?? ""),
  };
}

export function saveIntegrations(values: Partial<Integrations>) {
  const allowed: (keyof Integrations)[] = [
    "ai_api_key",
    "ai_api_base",
    "ai_model",
    "google_client_id",
    "google_client_secret",
    "google_refresh_token",
    "google_email",
    "google_connected_at",
    "google_folder_id",
  ];

  const updates: string[] = [];
  const params: (string | null)[] = [];
  for (const key of allowed) {
    if (!(key in values)) continue;
    updates.push(`${key} = ?`);
    params.push(values[key] ?? null);
  }
  if (updates.length === 0) return;

  getDb()
    .prepare(`UPDATE integrations SET ${updates.join(", ")} WHERE id = 1`)
    .run(...params);
}

export function getAiConfig() {
  const row = getIntegrations();
  return {
    apiKey: row.ai_api_key || process.env.ANTHROPIC_API_KEY || "",
    base:
      row.ai_api_base ||
      process.env.ANTHROPIC_API_BASE ||
      "https://api.anthropic.com/v1",
    model: row.ai_model || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
  };
}

export function googleConnected(): boolean {
  return Boolean(getIntegrations().google_refresh_token);
}

export function googleFolderId(): string {
  return getIntegrations().google_folder_id || "";
}
