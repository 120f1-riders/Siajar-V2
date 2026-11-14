"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BENTUK_LIST,
  BENTUK_SOAL,
  HURUF_OPSI,
  JENIS_PENILAIAN,
  KELAS,
  KURIKULUM,
  MAPEL_LAINNYA,
  MAPEL_MADRASAH,
  MAPEL_SEMUA,
  MAPEL_UMUM,
  LEVEL_KOGNITIF,
  HOTS_LEVELS,
  bentukInfo,
  kurikulumInfo,
} from "@/lib/konstanta";
import { statusInfo } from "@/lib/format";
import { DriveExport } from "@/components/drive-export";
import { AiGeneratorPanel } from "@/components/ai-generator-panel";
import { SoalJadiForm } from "@/components/soal-jadi-form";
import { ExcelImportPanel } from "@/components/excel-import-panel";

export type EditorButir = {
  bentuk: string;
  materi: string;
  acuan: string;
  indikator: string;
  level: string;
  hots: number;
  soal: string;
  opsi: string[];
  kunci: string;
  skor: number;
};

export type EditorPaket = {
  id: number;
  mapel: string;
  kelas: string;
  semester: string;
  tahun_ajaran: string;
  kurikulum: string;
  jenis_penilaian: string;
  alokasi_waktu: string;
  materi: string;
  petunjuk: string;
  cetak_kunci: number;
  status: string;
  catatan_kepala: string | null;
  butir: EditorButir[];
};

const KUNCI_HINT: Record<string, string> = {
  pg: "Contoh: B",
  pgk: "Contoh: A, C, D",
  bs: "Benar atau Salah",
  isian: "Jawaban singkat",
  uraian: "Kunci jawaban / rubrik penskoran",
  menjodohkan: "Pasangan jawaban",
};

function butirBaru(): EditorButir {
  return {
    bentuk: "pg",
    materi: "",
    acuan: "",
    indikator: "",
    level: "C2",
    hots: 0,
    soal: "",
    opsi: ["", "", "", "", ""],
    kunci: "",
    skor: 1,
  };
}

export function PaketEditor({
  paket,
  googleConnected,
  googleEmail,
}: {
  paket: EditorPaket;
  googleConnected: boolean;
  googleEmail: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditorPaket>(paket);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null
  );

  const readonly = form.status !== "draft" && form.status !== "dikembalikan";
  const info = kurikulumInfo(form.kurikulum);
  const status = statusInfo(form.status);
  const mapelSelect = MAPEL_SEMUA.includes(form.mapel) ? form.mapel : MAPEL_LAINNYA;
  const totalSkor = form.butir.reduce((sum, b) => sum + (Number(b.skor) || 0), 0);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function setField<K extends keyof EditorPaket>(key: K, value: EditorPaket[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function updateButir(index: number, patch: Partial<EditorButir>) {
    setForm((prev) => ({
      ...prev,
      butir: prev.butir.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
    setDirty(true);
  }

  function tambahButir() {
    if (form.butir.length >= 200) return;
    setForm((prev) => ({ ...prev, butir: [...prev.butir, butirBaru()] }));
    setDirty(true);
  }

  function tambahSoalJadi(butir: EditorButir) {
    if (form.butir.length >= 200) {
      setMessage({ tone: "err", text: "Paket sudah mencapai batas 200 butir." });
      return;
    }
    setForm((prev) => ({ ...prev, butir: [...prev.butir, butir] }));
    setDirty(true);
    setMessage({
      tone: "ok",
      text: "Soal jadi ditambahkan ke daftar butir. Klik Simpan Paket agar tersimpan.",
    });
  }

  function hapusButir(index: number) {
    setForm((prev) => ({
      ...prev,
      butir: prev.butir.filter((_, i) => i !== index),
    }));
    setDirty(true);
  }

  function geserButir(index: number, arah: -1 | 1) {
    const target = index + arah;
    if (target < 0 || target >= form.butir.length) return;
    setForm((prev) => {
      const next = [...prev.butir];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, butir: next };
    });
    setDirty(true);
  }

  async function persist(data: EditorPaket = form): Promise<boolean> {
    if (!data.mapel.trim()) {
      setMessage({ tone: "err", text: "Pilih atau tulis mata pelajaran terlebih dahulu." });
      return false;
    }
    if (!data.kelas.trim()) {
      setMessage({ tone: "err", text: "Kelas wajib diisi." });
      return false;
    }
    if (!data.tahun_ajaran.trim()) {
      setMessage({ tone: "err", text: "Tahun pelajaran wajib diisi." });
      return false;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/paket/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const hasil = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "err", text: hasil.error ?? "Gagal menyimpan paket." });
        return false;
      }
      setDirty(false);
      setMessage({ tone: "ok", text: "Paket soal berhasil disimpan." });
      router.refresh();
      return true;
    } catch {
      setMessage({ tone: "err", text: "Gagal menyimpan. Periksa koneksi lalu coba lagi." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function ubahStatus(action: "ajukan" | "tarik") {
    setBusy(action);
    setMessage(null);

    if (action === "ajukan") {
      const saved = await persist();
      if (!saved) {
        setBusy(null);
        return;
      }
    }

    try {
      const res = await fetch(`/api/paket/${form.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "err", text: data.error ?? "Gagal mengubah status paket." });
      } else {
        setForm((prev) => ({ ...prev, status: data.status }));
        setMessage({
          tone: "ok",
          text:
            action === "ajukan"
              ? "Paket diajukan. Menunggu tanda tangan kepala madrasah."
              : "Pengajuan ditarik. Paket dapat diubah kembali.",
        });
        router.refresh();
      }
    } catch {
      setMessage({ tone: "err", text: "Gagal menghubungi server." });
    } finally {
      setBusy(null);
    }
  }

  async function hapusPaket() {
    if (!window.confirm("Hapus paket soal ini beserta seluruh butirnya? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    setBusy("hapus");
    try {
      const res = await fetch(`/api/paket/${form.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/guru");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setMessage({ tone: "err", text: data.error ?? "Gagal menghapus paket." });
      setBusy(null);
    } catch {
      setMessage({ tone: "err", text: "Gagal menghapus paket." });
      setBusy(null);
    }
  }

  async function buatDenganAi(index: number) {
    const butir = form.butir[index];
    if (!butir) return;
    if (!form.mapel.trim()) {
      setMessage({ tone: "err", text: "Pilih mata pelajaran terlebih dahulu." });
      return;
    }
    if (!form.kelas.trim()) {
      setMessage({ tone: "err", text: "Isi kelas terlebih dahulu." });
      return;
    }
    if (!butir.materi.trim() && !butir.acuan.trim()) {
      setMessage({
        tone: "err",
        text: "Isi materi atau capaian pembelajaran sebagai dasar pembuatan soal.",
      });
      return;
    }
    const sudahAda =
      butir.indikator.trim() || butir.soal.trim() || butir.opsi.some((o) => o.trim());
    if (
      sudahAda &&
      !window.confirm(
        `Timpa level, indikator, soal, dan pilihan jawaban butir ${index + 1} dengan draf AI?`
      )
    ) {
      return;
    }

    setAiLoading(index);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/butir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel: form.mapel,
          kelas: form.kelas,
          kurikulum: form.kurikulum,
          jenis_penilaian: form.jenis_penilaian,
          bentuk: butir.bentuk,
          level: butir.level,
          materi: butir.materi,
          acuan: butir.acuan,
          indikator: butir.indikator,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ tone: "err", text: data.error ?? "Gagal membuat draf soal." });
        return;
      }

      const opsi = Array.isArray(data.opsi)
        ? data.opsi.map((item: unknown) => String(item ?? ""))
        : [];
      while (opsi.length < 5) opsi.push("");

      updateButir(index, {
        level:
          typeof data.level === "string" && /^C[1-6]$/.test(data.level)
            ? data.level
            : butir.level,
        indikator:
          typeof data.indikator === "string" ? data.indikator : butir.indikator,
        soal: typeof data.soal === "string" ? data.soal : butir.soal,
        opsi: opsi.slice(0, 5),
        kunci: typeof data.kunci === "string" ? data.kunci : butir.kunci,
      });
      setMessage({
        tone: "ok",
        text: `Draf butir ${index + 1} dibuat. Semua kolom masih bisa Anda edit manual.`,
      });
    } catch {
      setMessage({
        tone: "err",
        text: "Gagal menghubungi layanan AI. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setAiLoading(null);
    }
  }

  async function simpanDariAi(baru: EditorButir[]): Promise<boolean> {
    const next = { ...form, butir: [...form.butir, ...baru].slice(0, 200) };
    const ok = await persist(next);
    if (ok) {
      setForm(next);
      setMessage({
        tone: "ok",
        text: `${baru.length} soal baru disimpan ke paket. Semua butir masih bisa Anda edit di bawah.`,
      });
    }
    return ok;
  }


  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-stone-200 bg-[#f7f6f3]/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/guru" className="text-xs font-semibold text-stone-500 hover:text-brand-700">
              ← Daftar paket soal
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-stone-900">
                {form.mapel || "Paket tanpa mata pelajaran"}
                {form.kelas ? ` · Kelas ${form.kelas}` : ""}
              </h1>
              <span className={`badge ${status.badge}`}>{status.label}</span>
              {dirty ? (
                <span className="text-[11px] font-semibold text-amber-600">
                  ● perubahan belum disimpan
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readonly ? (
              <button
                type="button"
                onClick={() => persist()}
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            ) : null}

            {(form.status === "draft" || form.status === "dikembalikan") ? (
              <button
                type="button"
                onClick={() => ubahStatus("ajukan")}
                disabled={busy !== null}
                className="btn btn-outline btn-sm"
              >
                {busy === "ajukan" ? "Mengajukan..." : "Ajukan Tanda Tangan"}
              </button>
            ) : null}

            {form.status === "diajukan" ? (
              <button
                type="button"
                onClick={() => ubahStatus("tarik")}
                disabled={busy !== null}
                className="btn btn-outline btn-sm"
              >
                {busy === "tarik" ? "Menarik..." : "Tarik Pengajuan"}
              </button>
            ) : null}

            {readonly ? (
              <div className="flex gap-2">
                <Link href={`/cetak/${form.id}/soal`} target="_blank" className="btn btn-outline btn-sm">
                  Naskah
                </Link>
                <Link href={`/cetak/${form.id}/kisi-kisi`} target="_blank" className="btn btn-outline btn-sm">
                  Kisi-kisi
                </Link>
                <Link href={`/cetak/${form.id}/kartu-soal`} target="_blank" className="btn btn-outline btn-sm">
                  Kartu
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {message ? (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            message.tone === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {readonly ? (
        <div className="mb-5 rounded-xl border border-gold-300 bg-gold-100 px-4 py-3 text-sm text-gold-700">
          <p className="font-semibold">{status.hint}</p>
          <p className="mt-0.5 text-xs">
            {form.status === "diajukan"
              ? "Tarik pengajuan bila masih perlu memperbaiki paket ini."
              : "Dokumen sudah final dan siap dicetak atau disimpan sebagai PDF."}
          </p>
        </div>
      ) : null}

      {form.status === "dikembalikan" && form.catatan_kepala ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Catatan kepala madrasah</p>
          <p className="mt-0.5 whitespace-pre-line">{form.catatan_kepala}</p>
        </div>
      ) : null}

      <section className="card mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-800">Identitas Paket</h2>
            <p className="text-xs text-stone-500">
              Data ini muncul pada kop dokumen soal, kisi-kisi, dan kartu soal.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="label">Mata pelajaran</label>
            <select
              className="select"
              value={mapelSelect}
              onChange={(e) =>
                setField("mapel", e.target.value === MAPEL_LAINNYA ? "" : e.target.value)
              }
              disabled={readonly}
            >
              <option value={MAPEL_LAINNYA}>Lainnya — tulis sendiri</option>
              <optgroup label="Mata pelajaran umum">
                {MAPEL_UMUM.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Madrasah / keagamaan">
                {MAPEL_MADRASAH.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
            </select>
            {mapelSelect === MAPEL_LAINNYA ? (
              <input
                className="input mt-2"
                value={form.mapel}
                onChange={(e) => setField("mapel", e.target.value)}
                placeholder="Tulis nama mata pelajaran, contoh: Bahasa Sunda"
                disabled={readonly}
              />
            ) : null}
          </div>

          <div>
            <label className="label">Kelas</label>
            <input
              className="input"
              list="daftar-kelas"
              value={form.kelas}
              onChange={(e) => setField("kelas", e.target.value)}
              placeholder="Contoh: VIII"
              disabled={readonly}
            />
            <datalist id="daftar-kelas">
              {KELAS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="label">Semester</label>
            <select
              className="select"
              value={form.semester}
              onChange={(e) => setField("semester", e.target.value)}
              disabled={readonly}
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          <div>
            <label className="label">Tahun pelajaran</label>
            <input
              className="input"
              value={form.tahun_ajaran}
              onChange={(e) => setField("tahun_ajaran", e.target.value)}
              placeholder="2026/2027"
              disabled={readonly}
            />
          </div>

          <div>
            <label className="label">Kurikulum</label>
            <select
              className="select"
              value={form.kurikulum}
              onChange={(e) => setField("kurikulum", e.target.value)}
              disabled={readonly}
            >
              {Object.values(KURIKULUM).map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jenis penilaian</label>
            <input
              className="input"
              list="daftar-penilaian"
              value={form.jenis_penilaian}
              onChange={(e) => setField("jenis_penilaian", e.target.value)}
              placeholder="Asesmen Sumatif Akhir Semester"
              disabled={readonly}
            />
            <datalist id="daftar-penilaian">
              {JENIS_PENILAIAN.map((j) => (
                <option key={j} value={j} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="label">Alokasi waktu</label>
            <input
              className="input"
              value={form.alokasi_waktu}
              onChange={(e) => setField("alokasi_waktu", e.target.value)}
              placeholder="90 menit"
              disabled={readonly}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.cetak_kunci === 1}
                onChange={(e) => setField("cetak_kunci", e.target.checked ? 1 : 0)}
                disabled={readonly}
                className="h-4 w-4 accent-brand-700"
              />
              Sertakan halaman kunci jawaban pada naskah soal
            </label>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
              <span className="font-semibold">{info.label}.</span> {info.deskripsi}
            </p>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="label">Materi pembelajaran</label>
            <textarea
              className="textarea min-h-[110px]"
              value={form.materi}
              onChange={(e) => setField("materi", e.target.value)}
              placeholder={"Tulis materi pokok, satu materi per baris. Contoh:\nOperasi hitung bilangan bulat\nPecahan dan desimal"}
              disabled={readonly}
            />
            <p className="mt-1.5 text-[11px] text-stone-500">
              Baris pertama dipakai sebagai materi bawaan butir baru dan menjadi bahan
              panel AI. Setiap butir tetap punya kolom materi sendiri.
            </p>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="label">Petunjuk pengerjaan</label>
            <textarea
              className="textarea min-h-[110px]"
              value={form.petunjuk}
              onChange={(e) => setField("petunjuk", e.target.value)}
              placeholder="Ditulis pada halaman pertama naskah soal."
              disabled={readonly}
            />
          </div>
        </div>
      </section>

      <section className="card mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-800">Butir Soal</h2>
            <p className="text-xs text-stone-500">
              {form.butir.length} butir · total skor {totalSkor} · isian butir sekaligus
              menjadi isi kisi-kisi dan kartu soal.
            </p>
            <p className="mt-0.5 text-[11px] text-stone-400">
              Isi bentuk, skor, materi, dan nilai/capaian. Tombol Bantu AI mengisi level,
              indikator, soal, pilihan, dan kunci. Semua kolom tetap bisa diedit manual.
            </p>
          </div>
        </div>
      </section>
      {!readonly ? (
        <SoalJadiForm materiPaket={form.materi} onAdd={tambahSoalJadi} />
      ) : null}

      {!readonly ? (
        <ExcelImportPanel
          mapel={form.mapel}
          kelas={form.kelas}
          materiPaket={form.materi}
          sisaSlot={200 - form.butir.length}
          onSave={simpanDariAi}
        />
      ) : null}

      {!readonly ? (
        <AiGeneratorPanel
          mapel={form.mapel}
          kelas={form.kelas}
          kurikulum={form.kurikulum}
          jenisPenilaian={form.jenis_penilaian}
          acuanLabel={info.acuanLabel}
          acuanPlaceholder={info.acuanPlaceholder}
          materiAwal={form.materi}
          sisaSlot={200 - form.butir.length}
          onSave={simpanDariAi}
        />
      ) : null}

      {form.butir.length === 0 ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <p className="text-sm font-semibold text-stone-700">Belum ada butir soal</p>
          <p className="mt-1 max-w-sm text-xs text-stone-500">
            Gunakan panel AI di atas untuk membuat soal, atau tambahkan butir kosong.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {form.butir.map((b, index) => {
            const bentuk = bentukInfo(b.bentuk);
            return (
              <div key={index} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 bg-stone-50/80 px-4 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="badge border-stone-200 bg-white text-stone-600">
                    {bentuk.label}
                  </span>
                  {b.hots ? (
                    <span className="badge border-amber-200 bg-amber-50 text-amber-700">
                      HOTS
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-sm text-stone-600">
                    {b.materi || "Materi belum diisi"}
                  </span>
                  <span className="text-xs font-semibold text-stone-400">
                    {b.skor} poin
                  </span>
                  {!readonly ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => buatDenganAi(index)}
                        disabled={aiLoading !== null}
                        className="btn btn-outline btn-sm mr-1"
                        title="Buat draf indikator, soal, pilihan, dan kunci dengan AI"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M12 3l1.7 4.6 4.6 1.7-4.6 1.7L12 15.6l-1.7-4.6L5.7 9.3l4.6-1.7L12 3z" />
                          <path d="M18 16l.8 2.2 2.2.8-2.2.8L18 22l-.8-2.2-2.2-.8 2.2-.8L18 16z" />
                        </svg>
                        {aiLoading === index ? "Menyusun..." : "Bantu AI"}
                      </button>
                      <span className="mx-1 h-4 w-px bg-stone-200" aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => geserButir(index, -1)}
                        disabled={index === 0}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 disabled:opacity-30"
                        title="Naikkan"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path d="M18 15l-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => geserButir(index, 1)}
                        disabled={index === form.butir.length - 1}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 disabled:opacity-30"
                        title="Turunkan"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => hapusButir(index)}
                        className="rounded-md p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-700"
                        title="Hapus butir"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-3">
                  <div>
                    <label className="label">Bentuk soal</label>
                    <select
                      className="select"
                      value={b.bentuk}
                      onChange={(e) => updateButir(index, { bentuk: e.target.value })}
                      disabled={readonly}
                    >
                      {BENTUK_LIST.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Level kognitif</label>
                    <select
                      className="select"
                      value={b.level}
                      onChange={(e) => {
                        const level = e.target.value;
                        updateButir(index, {
                          level,
                          hots: HOTS_LEVELS.includes(level) ? 1 : b.hots,
                        });
                      }}
                      disabled={readonly}
                    >
                      {LEVEL_KOGNITIF.map((l) => (
                        <option key={l.id} value={l.id}>
                          {HOTS_LEVELS.includes(l.id) ? `${l.label} · HOTS` : l.label}
                        </option>
                      ))}
                    </select>
                    <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-600">
                      <input
                        type="checkbox"
                        checked={Boolean(b.hots)}
                        onChange={(e) =>
                          updateButir(index, {
                            hots: e.target.checked ? 1 : 0,
                            level:
                              e.target.checked && !HOTS_LEVELS.includes(b.level)
                                ? "C4"
                                : b.level,
                          })
                        }
                        disabled={readonly}
                        className="h-3.5 w-3.5 accent-brand-700"
                      />
                      Soal HOTS (C4–C6)
                    </label>
                  </div>
                  <div>
                    <label className="label">Skor / bobot</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input"
                      value={b.skor}
                      onChange={(e) =>
                        updateButir(index, { skor: Number(e.target.value) || 0 })
                      }
                      disabled={readonly}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="label">Materi</label>
                    <input
                      className="input"
                      value={b.materi}
                      onChange={(e) => updateButir(index, { materi: e.target.value })}
                      placeholder="Contoh: Operasi hitung bilangan bulat"
                      disabled={readonly}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="label">{info.acuanLabel}</label>
                    <textarea
                      className="textarea min-h-[64px]"
                      value={b.acuan}
                      onChange={(e) => updateButir(index, { acuan: e.target.value })}
                      placeholder={info.acuanPlaceholder}
                      disabled={readonly}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="label">Indikator soal</label>
                    <textarea
                      className="textarea min-h-[64px]"
                      value={b.indikator}
                      onChange={(e) => updateButir(index, { indikator: e.target.value })}
                      placeholder="Contoh: Disajikan soal cerita, peserta didik dapat menentukan hasil operasi bilangan bulat."
                      disabled={readonly}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="label">Butir soal</label>
                    <textarea
                      className="textarea min-h-[110px]"
                      value={b.soal}
                      onChange={(e) => updateButir(index, { soal: e.target.value })}
                      placeholder={
                        b.bentuk === "menjodohkan"
                          ? "Tulis pernyataan dan daftar pasangan jawaban."
                          : "Tulis pertanyaan atau pernyataan soal."
                      }
                      disabled={readonly}
                    />
                  </div>

                  {bentuk.pakaiOpsi ? (
                    <div className="lg:col-span-3">
                      <label className="label">
                        Pilihan jawaban{b.bentuk === "pgk" ? " (jawaban benar bisa lebih dari satu)" : ""}
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {HURUF_OPSI.map((huruf, oi) => (
                          <div key={huruf} className="flex items-center gap-2">
                            <span className="w-4 text-xs font-bold text-stone-500">{huruf}.</span>
                            <input
                              className="input"
                              value={b.opsi[oi] ?? ""}
                              onChange={(e) => {
                                const opsi = [...b.opsi];
                                while (opsi.length < 5) opsi.push("");
                                opsi[oi] = e.target.value;
                                updateButir(index, { opsi });
                              }}
                              placeholder={`Pilihan ${huruf}`}
                              disabled={readonly}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="lg:col-span-3">
                    <label className="label">Kunci jawaban</label>
                    <input
                      className="input"
                      value={b.kunci}
                      onChange={(e) => updateButir(index, { kunci: e.target.value })}
                      placeholder={KUNCI_HINT[b.bentuk] ?? "Kunci jawaban"}
                      disabled={readonly}
                    />
                    {b.bentuk === "bs" ? (
                      <p className="mt-1 text-[11px] text-stone-400">
                        Pilihan Benar/Salah dicetak otomatis pada naskah soal.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!readonly ? (
        <button
          type="button"
          onClick={tambahButir}
          disabled={form.butir.length >= 200}
          data-testid="tambah-butir-btn"
          className="btn btn-outline btn-sm mt-3"
        >
          + Tambah Butir Soal
        </button>
      ) : null}

      {!readonly ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => persist()}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Menyimpan..." : "Simpan Paket"}
          </button>
        </div>
      ) : null}

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-bold text-stone-800">Pratinjau Dokumen</h2>
        <p className="mt-0.5 text-xs text-stone-500">
          Tiga dokumen dibuat otomatis dari paket ini. Buka lalu pilih Cetak / Simpan PDF.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link
            href={`/cetak/${form.id}/soal`}
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Naskah Soal <span aria-hidden="true">↗</span>
          </Link>
          <Link
            href={`/cetak/${form.id}/kisi-kisi`}
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Kisi-kisi <span aria-hidden="true">↗</span>
          </Link>
          <Link
            href={`/cetak/${form.id}/kartu-soal`}
            target="_blank"
            className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Kartu Soal <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {dirty ? (
          <p className="mt-2 text-[11px] font-medium text-amber-600">
            Simpan perubahan terlebih dahulu agar dokumen memuat data terbaru.
          </p>
        ) : null}
      </section>

      <DriveExport
        paketId={form.id}
        connected={googleConnected}
        email={googleEmail}
        dirty={dirty}
      />

      {form.status !== "disahkan" ? (
        <section className="mt-6 rounded-xl border border-red-100 bg-red-50/40 p-5">
          <h2 className="text-sm font-bold text-red-800">Hapus Paket</h2>
          <p className="mt-0.5 text-xs text-red-700/80">
            Paket beserta seluruh butir soal akan dihapus permanen.
          </p>
          <button
            type="button"
            onClick={hapusPaket}
            disabled={busy === "hapus"}
            className="btn btn-danger btn-sm mt-3"
          >
            {busy === "hapus" ? "Menghapus..." : "Hapus Paket Soal"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
