import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/admin/settings-form";
import { KopSurat } from "@/components/dokumen";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PengaturanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser(["admin"]);

  const [settings, params] = await Promise.all([
    getSettings(),
    searchParams,
  ]);

  const notice =
    params.ok === "kop"
      ? { tone: "ok" as const, text: "Kop surat berhasil diperbarui." }
      : null;

  return (
    <div>
      <PageHeader
        title="Pengaturan Kop Surat"
        description="Baris kop, identitas madrasah, logo, dan tanda tangan kepala madrasah bawaan."
      />

      {notice ? (
        <div
          className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900"
        >
          {notice.text}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <SettingsForm settings={settings} />
        </section>

        <aside className="space-y-4">
          <div className="card p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-stone-500">
              Pratinjau Kop Surat
            </p>
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
              <KopSurat s={settings} />
              <div className="text-center font-serif text-[11pt] font-bold uppercase tracking-wide">
                Naskah Soal
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-stone-400">
              Pratinjau mengikuti data yang sudah tersimpan. Simpan perubahan untuk
              memperbarui tampilan ini.
            </p>
          </div>

          <div className="rounded-xl border border-gold-300 bg-gold-100 p-4 text-xs text-gold-700">
            <p className="font-semibold">Tips gambar</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>Logo: PNG transparan, ukuran disarankan 500 × 500 piksel.</li>
              <li>Tanda tangan: PNG transparan berlatar kosong, lebar ± 600 piksel.</li>
              <li>Ukuran maksimal setiap gambar 3 MB.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
