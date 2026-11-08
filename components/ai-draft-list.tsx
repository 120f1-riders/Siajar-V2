"use client";

import type { Dispatch, SetStateAction } from "react";
import { HURUF_OPSI, bentukInfo } from "@/lib/konstanta";
import type { Draft } from "@/components/ai-generator-panel";

type Props = {
  drafts: Draft[];
  setDrafts: Dispatch<SetStateAction<Draft[]>>;
  saving: boolean;
  running: boolean;
  onSave: () => void;
};

export function AiDraftList({ drafts, setDrafts, saving, running, onSave }: Props) {
  function ubah(key: string, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  return (
    <div className="border-t border-stone-100 bg-stone-50/60 p-5" data-testid="ai-draft-list">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-stone-800">
          Hasil AI: {drafts.length} soal · periksa, edit, atau hapus sebelum disimpan
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.confirm("Buang semua hasil AI?") && setDrafts([])}
            disabled={saving || running}
            className="btn btn-outline btn-sm"
            data-testid="ai-draft-discard-button"
          >
            Buang Semua
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || running}
            className="btn btn-primary btn-sm"
            data-testid="ai-draft-save-button"
          >
            {saving ? "Menyimpan..." : `Simpan ${drafts.length} Soal ke Paket`}
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {drafts.map((d, i) => (
          <li key={d.key} className="rounded-lg border border-stone-200 bg-white p-3" data-testid={`ai-draft-item-${i}`}>
            <div className="mb-1.5 flex items-center gap-2 text-xs">
              <span className="font-bold text-brand-700">{i + 1}.</span>
              <span className="badge border-stone-200 bg-stone-50 text-stone-600">{bentukInfo(d.bentuk).label}</span>
              <span className="badge border-stone-200 bg-stone-50 text-stone-600">{d.level}</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => setDrafts((prev) => prev.filter((x) => x.key !== d.key))}
                className="rounded px-2 py-0.5 text-stone-400 hover:bg-red-50 hover:text-red-700"
                data-testid={`ai-draft-remove-${i}`}
              >
                Hapus
              </button>
            </div>
            <textarea
              className="textarea min-h-[60px] text-sm"
              value={d.soal}
              onChange={(e) => ubah(d.key, { soal: e.target.value })}
              data-testid={`ai-draft-soal-${i}`}
            />
            {bentukInfo(d.bentuk).pakaiOpsi ? (
              <ul className="mt-1.5 grid gap-x-4 text-xs text-stone-600 sm:grid-cols-2">
                {d.opsi.map((o, oi) =>
                  o ? (
                    <li key={oi}>
                      <b>{HURUF_OPSI[oi]}.</b> {o}
                    </li>
                  ) : null
                )}
              </ul>
            ) : null}
            <p className="mt-1.5 text-xs text-stone-500">
              <b className="text-stone-700">Kunci:</b> {d.kunci}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
