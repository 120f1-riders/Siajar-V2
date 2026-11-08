"use client";

import { useEffect, useState } from "react";
import { LEVEL_KOGNITIF } from "@/lib/konstanta";
import type { EditorButir } from "@/components/paket-editor";
import { AiDraftList } from "@/components/ai-draft-list";

const JENIS = [
  { id: "pg", label: "Pilihan ganda", skor: 1, awal: 10 },
  { id: "pgk", label: "PG kompleks", skor: 2, awal: 0 },
  { id: "bs", label: "Benar / salah", skor: 1, awal: 0 },
  { id: "menjodohkan", label: "Menjodohkan", skor: 4, awal: 0 },
  { id: "isian", label: "Isian singkat", skor: 2, awal: 5 },
  { id: "uraian", label: "Esai / uraian", skor: 5, awal: 2 },
];
const LEVEL_CAMPURAN = ["C1", "C2", "C3", "C2", "C3", "C4", "C3", "C4", "C5", "C6"];
const UKURAN_BATCH = 5;
const MAKS_SEKALI = 50;

export type Draft = EditorButir & { key: string };

type Props = {
  mapel: string;
  kelas: string;
  kurikulum: string;
  jenisPenilaian: string;
  acuanLabel: string;
  acuanPlaceholder: string;
  sisaSlot: number;
  onSave: (butir: EditorButir[]) => Promise<boolean>;
};

export function AiGeneratorPanel(props: Props) {
  const [materi, setMateri] = useState("");
  const [acuan, setAcuan] = useState("");
  const [level, setLevel] = useState("campuran");
  const [jumlah, setJumlah] = useState<Record<string, number>>(
    Object.fromEntries(JENIS.map((j) => [j.id, j.awal]))
  );
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const total = JENIS.reduce((s, j) => s + (jumlah[j.id] || 0), 0);
  const running = progress !== null;

  useEffect(() => {
    if (drafts.length === 0 && !running) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [drafts.length, running]);

  function rencana() {
    const list: { bentuk: string; level: string }[] = [];
    for (const j of JENIS) {
      for (let i = 0; i < (jumlah[j.id] || 0); i++) {
        const lv = level === "campuran" ? LEVEL_CAMPURAN[list.length % LEVEL_CAMPURAN.length] : level;
        list.push({ bentuk: j.id, level: lv });
      }
    }
    return list;
  }

  async function mintaBatch(items: { bentuk: string; level: string }[], hindari: string[]) {
    const res = await fetch("/api/ai/butir/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mapel: props.mapel,
        kelas: props.kelas,
        kurikulum: props.kurikulum,
        jenis_penilaian: props.jenisPenilaian,
        materi,
        acuan,
        items,
        hindari,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Gagal membuat soal.");
    return data.butir as Array<Omit<EditorButir, "materi" | "acuan" | "skor">>;
  }

  async function buatSemua() {
    setError("");
    const kurang = [
      !props.mapel.trim() && "mata pelajaran",
      !props.kelas.trim() && "kelas",
      !materi.trim() && !acuan.trim() && "materi",
    ].filter(Boolean);
    if (kurang.length) {
      setError(`Lengkapi dulu: ${kurang.join(", ")}.`);
      return;
    }
    if (total < 1) {
      setError("Tentukan jumlah soal minimal 1.");
      return;
    }
    if (total > MAKS_SEKALI) {
      setError(`Maksimal ${MAKS_SEKALI} soal dalam satu kali pembuatan.`);
      return;
    }
    if (total + drafts.length > props.sisaSlot) {
      setError(`Paket hanya bisa menampung ${props.sisaSlot - drafts.length} butir lagi (batas 200).`);
      return;
    }

    const plan = rencana();
    const hindari = drafts.map((d) => d.soal.slice(0, 140));
    let done = 0;
    let gagal = 0;
    setProgress({ done: 0, total: plan.length });

    for (let i = 0; i < plan.length; i += UKURAN_BATCH) {
      const chunk = plan.slice(i, i + UKURAN_BATCH);
      let hasil: Awaited<ReturnType<typeof mintaBatch>> = [];
      for (let coba = 0; coba < 2 && hasil.length === 0; coba++) {
        try {
          hasil = await mintaBatch(chunk, hindari);
        } catch (e) {
          if (coba === 1) setError(e instanceof Error ? e.message : "Gagal membuat soal.");
        }
      }
      gagal += chunk.length - hasil.length;
      const baru: Draft[] = hasil.map((h) => {
        const opsi = [...(h.opsi ?? [])];
        while (opsi.length < 5) opsi.push("");
        return {
          ...h,
          opsi: opsi.slice(0, 5),
          materi: materi.trim(),
          acuan: acuan.trim(),
          skor: JENIS.find((j) => j.id === h.bentuk)?.skor ?? 1,
          key: `${Date.now()}-${Math.random()}`,
        };
      });
      hindari.push(...baru.map((b) => b.soal.slice(0, 140)));
      setDrafts((prev) => [...prev, ...baru]);
      done += chunk.length;
      setProgress({ done, total: plan.length });
    }

    setProgress(null);
    if (gagal > 0) {
      setError((prev) => `${gagal} soal gagal dibuat. ${prev}`.trim());
    }
  }

  async function simpan() {
    setSaving(true);
    const ok = await props.onSave(drafts.map(({ key: _key, ...b }) => b));
    setSaving(false);
    if (ok) setDrafts([]);
  }

  return (
    <section className="card mb-6 overflow-hidden border-brand-200" data-testid="ai-generator-panel">
      <div className="border-b border-brand-100 bg-brand-50 px-5 py-4">
        <h2 className="text-sm font-bold text-brand-900">Buat Banyak Soal Sekaligus dengan AI</h2>
        <p className="text-xs text-brand-800/80">
          Isi materi dan jumlah tiap jenis soal, lalu klik sekali. Hasilnya tampil dulu untuk
          Anda periksa sebelum disimpan ke paket, dan tetap bisa diedit setelahnya.
        </p>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="label">Materi</label>
            <input
              className="input"
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              placeholder="Contoh: Sistem pencernaan manusia"
              disabled={running}
              data-testid="ai-gen-materi-input"
            />
          </div>
          <div>
            <label className="label">{props.acuanLabel} (opsional)</label>
            <textarea
              className="textarea min-h-[64px]"
              value={acuan}
              onChange={(e) => setAcuan(e.target.value)}
              placeholder={props.acuanPlaceholder}
              disabled={running}
              data-testid="ai-gen-acuan-input"
            />
          </div>
          <div>
            <label className="label">Level kognitif</label>
            <select
              className="select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={running}
              data-testid="ai-gen-level-select"
            >
              <option value="campuran">Campuran C1–C6 (disarankan)</option>
              {LEVEL_KOGNITIF.map((l) => (
                <option key={l.id} value={l.id}>
                  Semua {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Jumlah soal per jenis</label>
          <div className="grid grid-cols-2 gap-2">
            {JENIS.map((j) => (
              <label
                key={j.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
              >
                <span>{j.label}</span>
                <input
                  type="number"
                  min={0}
                  max={MAKS_SEKALI}
                  value={jumlah[j.id]}
                  onChange={(e) =>
                    setJumlah((p) => ({
                      ...p,
                      [j.id]: Math.min(MAKS_SEKALI, Math.max(0, Number(e.target.value) || 0)),
                    }))
                  }
                  disabled={running}
                  className="w-14 rounded-md border border-stone-200 px-1.5 py-1 text-center text-sm font-bold focus:border-brand-500 focus:outline-none"
                  data-testid={`ai-gen-jumlah-${j.id}`}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={buatSemua}
            disabled={running || total < 1}
            className="btn btn-primary mt-4 w-full"
            data-testid="ai-gen-submit-button"
          >
            {running
              ? `Menyusun soal... ${progress.done}/${progress.total}`
              : `Buatkan ${total} Soal Sekaligus`}
          </button>
          {running ? (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100" data-testid="ai-gen-progress">
              <div
                className="h-full bg-brand-600 transition-[width] duration-500"
                style={{ width: `${Math.max(4, (progress.done / progress.total) * 100)}%` }}
              />
            </div>
          ) : null}
          {error ? (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" data-testid="ai-gen-error">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      {drafts.length > 0 ? (
        <AiDraftList
          drafts={drafts}
          setDrafts={setDrafts}
          saving={saving}
          running={running}
          onSave={simpan}
        />
      ) : null}
    </section>
  );
}
