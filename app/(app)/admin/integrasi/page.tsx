import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getIntegrations } from "@/lib/integrations";
import { IntegrationForm, type IntegrationView } from "@/components/admin/integration-form";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function IntegrasiPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; pesan?: string }>;
}) {
  await requireUser(["admin"]);

  const [integrations, params, headerList] = await Promise.all([
    getIntegrations(),
    searchParams,
    headers(),
  ]);

  const host = headerList.get("host") ?? "localhost:3000";
  const proto = (headerList.get("x-forwarded-proto") ?? "http")
    .split(",")[0]
    .trim();

  const view: IntegrationView = {
    aiKeySet: Boolean(
      integrations.ai_api_key || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY
    ),
    aiKeyFromEnv: Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY),
    aiApiBase: integrations.ai_api_base,
    aiModel: integrations.ai_model,
    googleClientId: integrations.google_client_id,
    googleSecretSet: Boolean(integrations.google_client_secret),
    googleEmail: integrations.google_email,
    googleConnected: Boolean(integrations.google_refresh_token),
    redirectUri: `${proto}://${host}/api/google/callback`,
    googleFolderId: integrations.google_folder_id,
  };

  const notice = params.google
    ? {
        tone:
          params.google === "ok" || params.google === "off" ? "ok" : "err",
        text:
          params.pesan ||
          (params.google === "off"
            ? "Koneksi Google diputuskan."
            : "Terjadi kendala saat menghubungkan Google."),
      }
    : null;

  return (
    <div>
      <PageHeader
        title="Integrasi AI &amp; Google Drive"
        description="Kunci API AI dan koneksi Google Drive untuk ekspor naskah, kisi-kisi, dan kartu soal."
      />

      {notice ? (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            notice.tone === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <IntegrationForm view={view} />
    </div>
  );
}
