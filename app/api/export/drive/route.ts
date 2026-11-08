import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getButir, getPaket, getSettings } from "@/lib/queries";
import { getIntegrations } from "@/lib/integrations";
import { uploadToDrive } from "@/lib/google";
import { buildKartuDocx, buildNaskahDocx, type ExportData } from "@/lib/export/docx";
import { buildKisiXlsx } from "@/lib/export/xlsx";
import type { Paket } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const GDOC_MIME = "application/vnd.google-apps.document";
const GSHEET_MIME = "application/vnd.google-apps.spreadsheet";

const JENIS = {
  soal: { label: "Naskah Soal", target: GDOC_MIME },
  kisi: { label: "Kisi-kisi", target: GSHEET_MIME },
  kartu: { label: "Kartu Soal", target: GDOC_MIME },
} as const;

type Jenis = keyof typeof JENIS;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function fileName(paket: Paket, label: string): string {
  const base = `SIAJAR - ${paket.mapel || "Paket Soal"} - ${paket.kelas || "Kelas"} - ${label}`;
  return base.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Belum masuk." }, 401);
  if (user.role !== "guru" && user.role !== "kepala") {
    return json({ error: "Ekspor hanya tersedia untuk guru dan kepala madrasah." }, 403);
  }
  if (!isSameOrigin(req)) {
    return json({ error: "Origin tidak diizinkan." }, 403);
  }

  const body = (await req.json().catch(() => null)) as
    | { paketId?: unknown; jenis?: unknown }
    | null;
  const paketId = Number(body?.paketId);
  const jenis = String(body?.jenis ?? "") as Jenis;
  if (!Number.isInteger(paketId) || !(jenis in JENIS)) {
    return json({ error: "Permintaan ekspor tidak valid." }, 400);
  }

  const paket = getPaket(paketId);
  if (!paket) return json({ error: "Paket soal tidak ditemukan." }, 404);
  if (user.role === "guru" && paket.guru_id !== user.id) {
    return json({ error: "Paket ini bukan milik Anda." }, 403);
  }

  const butir = getButir(paketId);
  if (butir.length === 0) {
    return json({ error: "Tambahkan butir soal terlebih dahulu." }, 400);
  }

  if (!getIntegrations().google_refresh_token) {
    return json(
      {
        error:
          "Akun Google belum terhubung. Buka Pengaturan Admin lalu hubungkan akun Google.",
      },
      400
    );
  }

  const integrations = getIntegrations();
  const parentFor = (target: string) => {
    if (target === GSHEET_MIME && integrations.google_folder_id)
      return integrations.google_folder_id;
    if (target === GDOC_MIME && integrations.google_folder_id)
      return integrations.google_folder_id;
    return null;
  };

  const data: ExportData = { paket, butir, settings: getSettings() };
  const name = fileName(paket, JENIS[jenis].label);

  async function upload(buffer: Buffer, targetMime: string) {
    const parentId = parentFor(targetMime);
    return uploadToDrive({
      name,
      sourceMime: targetMime === GSHEET_MIME ? XLSX_MIME : DOCX_MIME,
      targetMime,
      data: buffer,
      parentFolderId: (parentId ?? undefined) as string | undefined,
    });
  }

  try {
    if (jenis === "kisi") {
      const buffer = await buildKisiXlsx(data);
      return json({ ...(await upload(buffer, JENIS[jenis].target)), jenis });
    }

    const buffer =
      jenis === "soal" ? await buildNaskahDocx(data) : await buildKartuDocx(data);
    return json({ ...(await upload(buffer, JENIS[jenis].target)), jenis });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gagal mengekspor ke Google Drive:", message);

    if (message === "GOOGLE_NOT_CONNECTED") {
      return json(
        { error: "Akun Google belum terhubung. Hubungkan melalui Pengaturan Admin." },
        400
      );
    }
    if (message === "GOOGLE_NOT_CONFIGURED") {
      return json(
        { error: "Kredensial Google belum lengkap. Periksa Pengaturan Admin." },
        400
      );
    }
    return json(
      {
        error:
          "Gagal mengirim file ke Google Drive. Periksa koneksi dan izin akun Google, lalu coba lagi.",
      },
      502
    );
  }
}
