"use client";

import { useRef, useState } from "react";
import { BENTUK_LIST, HOTS_LEVELS, HURUF_OPSI, LEVEL_KOGNITIF, bentukInfo } from "@/lib/konstanta";
import type { EditorButir } from "@/components/paket-editor";

type Row = EditorButir & { baris: number; catatan: string[] };

type Props = {
  mapel: string;
  kelas: string;
  materiPaket: string;
  sisaSlot: number;
  onSave: (butir: EditorButir[]) => Promise<boolean>;
};

export function ExcelImportPanel({ mapel, kelas, materiPaket, sisaSlot, onSave }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pakaiAi, setPakaiAi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [pesan, setPesan] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function unggah() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setPesan({ tone: "err", text: "Pilih file Excel (.xlsx) terlebih dahulu." });
    if (!/\.xlsx$/i.test(file.name)) {
      return setPesan({ tone: "err", text: "File harus berformat .xlsx (Excel), bukan foto/gambar." });
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mapel", mapel);
    fd.append("kelas", kelas);
    fd.append("materi", materiPaket);
    fd.append("pakai_ai", pakaiAi ? "1" : "0");
    setLoading(true);
    setPesan(null);
    try {
      const res = await fetch("/api/soal/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membaca file.");
      setRows(data.rows);
      setPesan({ tone: "ok", text: `${data.rows.length} soal terbaca. ${data.aiInfo || ""} Periksa pratinjau di bawah.` });
    } catch (err) {
      setPesan({ tone: "err", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function simpan() {
    if (rows.length > sisaSlot) {
      return setPesan({ tone: "err", text: `Sisa slot paket hanya ${sisaSlot} butir. Hapus sebagian soal dari pratinjau.` });
    }
    setSaving(true);
    const ok = await onSave(rows.map(({ baris: _b, catatan: _c, ...b }) => b));
    setSaving(false);
    if (ok) {
      setRows([]);
      if (fileRef.current) fileRef.current.value = "";
      setPesan({ tone: "ok", text: "Soal dari Excel tersimpan ke paket." });
    } else {
      setPesan({
        tone: "err",
        text: "Gagal menyimpan. Pastikan Mata Pelajaran, Kelas, dan Tahun Pelajaran di bagian atas sudah diisi, lalu coba lagi.",
      });
    }
  }

  return (
    <section className="card mb-6 p-5" data-testid="excel-import-panel">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-stone-800">Upload Soal dari Excel</h2>
        <p className="text-xs text-stone-500">
          Isi template, unggah file .xlsx, lalu periksa pratinjau sebelum disimpan. Isi sel dibaca sebagai teks, bukan foto.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a href="/api/soal/template" className="btn btn-outline btn-sm" data-testid="excel-template-download">
          Unduh Template Excel
        </a>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="block text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          data-testid="excel-file-input"
        />
        <label className="flex items-center gap-2 text-xs text-stone-700">
          <input type="checkbox" checked={pakaiAi} onChange={(e) => setPakaiAi(e.target.checked)} className="h-4 w-4 accent-brand-700" data-testid="excel-ai-checkbox" />
          Lengkapi indikator &amp; level yang kosong dengan AI
        </label>
        <button type="button" onClick={unggah} disabled={loading || saving} className="btn btn-primary btn-sm" data-testid="excel-upload-button">
          {loading ? "Membaca file..." : "Baca File"}
        </button>
      </div>
      {pesan ? (
        <p className={`mt-3 rounded-lg px-3 py-2 text-xs ${pesan.tone === "ok" ? "bg-brand-50 text-brand-800" : "bg-red-50 text-red-700"}`} data-testid="excel-import-message">
          {pesan.text}
        </p>
      ) : null}
      {rows.length ? <PreviewList rows={rows} setRows={setRows} saving={saving} onSave={simpan} /> : null}
    </section>
  );
}

function PreviewList({ rows, setRows, saving, onSave }: { rows: Row[]; setRows: (f: (p: Row[]) => Row[]) => void; saving: boolean; onSave: () => void }) {
  const ubah = (i: number, patch: Partial<Row>) => setRows((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="mt-4 border-t border-stone-100 pt-4" data-testid="excel-preview-list">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-stone-800">Pratinjau: {rows.length} soal</p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-outline btn-sm" disabled={saving} onClick={() => window.confirm("Buang semua pratinjau?") && setRows(() => [])} data-testid="excel-preview-discard">
            Buang Semua
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={onSave} data-testid="excel-preview-save">
            {saving ? "Menyimpan..." : `Simpan ${rows.length} Soal ke Paket`}
          </button>
        </div>
      </div>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <PreviewItem key={`${r.baris}-${i}`} r={r} i={i} ubah={ubah} hapus={() => setRows((p) => p.filter((_, j) => j !== i))} />
        ))}
      </ol>
    </div>
  );
}

function PreviewItem({ r, i, ubah, hapus }: { r: Row; i: number; ubah: (i: number, p: Partial<Row>) => void; hapus: () => void }) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-3" data-testid={`excel-preview-item-${i}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-brand-700">{i + 1}.</span>
        <span className="text-stone-400">baris {r.baris}</span>
        <select className="select !w-auto !py-1 text-xs" value={r.bentuk} onChange={(e) => ubah(i, { bentuk: e.target.value })} data-testid={`excel-preview-bentuk-${i}`}>
          {BENTUK_LIST.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <select className="select !w-auto !py-1 text-xs" value={r.level} onChange={(e) => ubah(i, { level: e.target.value, hots: HOTS_LEVELS.includes(e.target.value) ? 1 : 0 })} data-testid={`excel-preview-level-${i}`}>
          {LEVEL_KOGNITIF.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <label className="flex items-center gap-1 text-stone-600">
          Skor
          <input type="number" min={0} max={100} className="input !w-16 !py-1 text-xs" value={r.skor} onChange={(e) => ubah(i, { skor: Number(e.target.value) || 0 })} data-testid={`excel-preview-skor-${i}`} />
        </label>
        {r.hots ? <span className="badge border-amber-200 bg-amber-50 text-amber-700">HOTS</span> : null}
        <span className="flex-1" />
        <button type="button" onClick={hapus} className="rounded px-2 py-0.5 text-stone-400 hover:bg-red-50 hover:text-red-700" data-testid={`excel-preview-remove-${i}`}>Hapus</button>
      </div>
      <div className="grid gap-2 text-xs md:grid-cols-2">
        <input className="input text-xs" value={r.materi} onChange={(e) => ubah(i, { materi: e.target.value })} placeholder="Materi" data-testid={`excel-preview-materi-${i}`} />
        <input className="input text-xs" value={r.acuan} onChange={(e) => ubah(i, { acuan: e.target.value })} placeholder="Nilai cinta & capaian pembelajaran" data-testid={`excel-preview-acuan-${i}`} />
        <input className="input text-xs md:col-span-2" value={r.indikator} onChange={(e) => ubah(i, { indikator: e.target.value })} placeholder="Indikator soal" data-testid={`excel-preview-indikator-${i}`} />
      </div>
      <textarea className="textarea mt-2 min-h-[60px] text-sm" value={r.soal} onChange={(e) => ubah(i, { soal: e.target.value })} data-testid={`excel-preview-soal-${i}`} />
      {bentukInfo(r.bentuk).pakaiOpsi ? (
        <ul className="mt-1.5 grid gap-x-4 text-xs text-stone-600 sm:grid-cols-2">
          {r.opsi.map((o, oi) => (o ? <li key={oi}><b>{HURUF_OPSI[oi]}.</b> {o}</li> : null))}
        </ul>
      ) : null}
      <label className="mt-2 flex items-center gap-2 text-xs text-stone-700">
        <b>Kunci:</b>
        <input className="input !py-1 text-xs" value={r.kunci} onChange={(e) => ubah(i, { kunci: e.target.value })} data-testid={`excel-preview-kunci-${i}`} />
      </label>
      {r.catatan.length ? <p className="mt-1.5 text-xs text-amber-700">{r.catatan.join(" ")}</p> : null}
    </li>
  );
}
