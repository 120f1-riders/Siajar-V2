"use client";

import { useState } from "react";
import {
  BENTUK_LIST,
  HOTS_LEVELS,
  HURUF_OPSI,
  LEVEL_KOGNITIF,
  bentukInfo,
} from "@/lib/konstanta";
import type { EditorButir } from "@/components/paket-editor";

const OPSI_KOSONG = ["", "", "", "", ""];

type Props = {
  materiPaket?: string;
  onAdd: (butir: EditorButir) => void;
};

export function SoalJadiForm({ materiPaket = "", onAdd }: Props) {
  const [buka, setBuka] = useState(false);
  const [bentuk, setBentuk] = useState("pg");
  const [level, setLevel] = useState("C2");
  const [hots, setHots] = useState(false);
  const [skor, setSkor] = useState(1);
  const [materi, setMateri] = useState("");
  const [indikator, setIndikator] = useState("");
  const [soal, setSoal] = useState("");
  const [opsi, setOpsi] = useState<string[]>([...OPSI_KOSONG]);
  const [kunci, setKunci] = useState("");
  const [pesan, setPesan] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const pakaiOpsi = bentukInfo(bentuk).pakaiOpsi;

  function tambah() {
    if (!soal.trim()) {
      setPesan({ tone: "err", text: "Tulis dulu isi soal yang sudah jadi." });
      return;
    }
    const isiOpsi = opsi.map((o) => o.trim());
    if (pakaiOpsi && isiOpsi.filter(Boolean).length < 2) {
      setPesan({ tone: "err", text: "Isi minimal dua pilihan jawaban." });
      return;
    }

    const levelAkhir = hots && !HOTS_LEVELS.includes(level) ? "C4" : level;
    onAdd({
      bentuk,
      level: levelAkhir,
      hots: hots || HOTS_LEVELS.includes(levelAkhir) ? 1 : 0,
      materi: materi.trim() || materiPaket.split("\n")[0].trim(),
      acuan: "",
      indikator: indikator.trim(),
      soal: soal.trim(),
      opsi: pakaiOpsi ? isiOpsi : [...OPSI_KOSONG],
      kunci: kunci.trim(),
      skor: Math.max(0, Number(skor) || 0),
    });

    setSoal("");
    setOpsi([...OPSI_KOSONG]);
    setKunci("");
    setIndikator("");
    setPesan({
      tone: "ok",
      text: "Soal ditambahkan ke daftar butir. Periksa lalu klik Simpan Paket.",
    });
  }

  if (!buka) {
    return (
      <section className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-sm font-bold text-stone-800">Masukkan Soal yang Sudah Jadi</h2>
          <p className="text-xs text-stone-500">
            Sudah punya soal? Tempel di sini tanpa membuat butir kosong lebih dulu.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setBuka(true)}>
          Buka Form Soal Jadi
        </button>
      </section>
    );
  }

  return (
    <section className="card mb-6 border-brand-200 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-stone-800">Masukkan Soal yang Sudah Jadi</h2>
          <p className="text-xs text-stone-500">
            Isi soal yang sudah Anda susun; butir langsung masuk ke daftar di bawah.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setBuka(false)}>
          Tutup
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Bentuk soal</label>
          <select className="select" value={bentuk} onChange={(e) => setBentuk(e.target.value)}>
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
            value={level}
            onChange={(e) => {
              const next = e.target.value;
              setLevel(next);
              if (HOTS_LEVELS.includes(next)) setHots(true);
            }}
          >
            {LEVEL_KOGNITIF.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Skor / bobot</label>
          <input
            type="number"
            min={0}
            max={100}
            className="input"
            value={skor}
            onChange={(e) => setSkor(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={hots}
              onChange={(e) => {
                setHots(e.target.checked);
                if (e.target.checked && !HOTS_LEVELS.includes(level)) setLevel("C4");
              }}
              className="h-4 w-4 accent-brand-700"
            />
            Soal HOTS
          </label>
        </div>

        <div className="lg:col-span-2">
          <label className="label">Materi</label>
          <input
            className="input"
            value={materi}
            onChange={(e) => setMateri(e.target.value)}
            placeholder="Contoh: Operasi hitung bilangan bulat"
          />
        </div>
        <div className="lg:col-span-2">
          <label className="label">Indikator soal (opsional)</label>
          <input
            className="input"
            value={indikator}
            onChange={(e) => setIndikator(e.target.value)}
            placeholder="Contoh: Peserta didik dapat menentukan hasil operasi bilangan bulat."
          />
        </div>

        <div className="lg:col-span-4">
          <label className="label">Butir soal</label>
          <textarea
            className="textarea min-h-[110px]"
            value={soal}
            onChange={(e) => setSoal(e.target.value)}
            placeholder="Tempel atau tulis pertanyaan lengkap beserta konteksnya."
          />
        </div>

        {pakaiOpsi ? (
          <div className="lg:col-span-4">
            <label className="label">Pilihan jawaban</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {HURUF_OPSI.map((huruf, oi) => (
                <div key={huruf} className="flex items-center gap-2">
                  <span className="w-4 text-xs font-bold text-stone-500">{huruf}.</span>
                  <input
                    className="input"
                    value={opsi[oi] ?? ""}
                    onChange={(e) => {
                      const next = [...opsi];
                      while (next.length < 5) next.push("");
                      next[oi] = e.target.value;
                      setOpsi(next);
                    }}
                    placeholder={`Pilihan ${huruf}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="lg:col-span-4">
          <label className="label">Kunci jawaban</label>
          <input
            className="input"
            value={kunci}
            onChange={(e) => setKunci(e.target.value)}
            placeholder={pakaiOpsi ? "Contoh: B atau A, C" : "Jawaban singkat / rubrik"}
          />
        </div>
      </div>

      {pesan ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            pesan.tone === "ok" ? "bg-brand-50 text-brand-800" : "bg-red-50 text-red-700"
          }`}
        >
          {pesan.text}
        </p>
      ) : null}

      <button type="button" onClick={tambah} className="btn btn-primary btn-sm mt-3">
        Tambahkan ke Paket
      </button>
    </section>
  );
}
