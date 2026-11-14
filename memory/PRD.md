# SIAJAR – PRD
Original: "di akun guru bisa sekali klik langsung membuatkan banyak soal sekaligus"
Stack: Next.js 15 (root /app), node:sqlite (/app/data), OpenAI-compatible AI (Z.ai default; key via Admin → Integrasi or .env.local).
Preview-only scaffolding: /app/frontend/package.json (runs next dev on 3000), /app/backend/server.py (proxies /api → Next), SERVER_ACTIONS_ALLOWED_ORIGINS env.

## Done (Jun 2026)
- Panel "Buat Banyak Soal Sekaligus dengan AI" in paket editor: materi + CP, level (campuran/fixed), count per type (PG, PGK, B/S, menjodohkan, isian, uraian), one click → batches of 5 via /api/ai/butir/generate, progress bar, no-duplicate hints.
- Review list (edit soal text, remove, discard) → "Simpan ke Paket" appends + persists; editable afterwards.
- Fixed missing mockDraft in lib/ai.ts; removed dead half-built bulk code.
## Backlog
- Edit options/kunci inside draft review; regenerate single draft; split paket-editor.tsx.

## Jun 2026 – AI keys
- AI now: Gemini primary (GEMINI_API_KEY, model GEMINI_MODEL default gemini-3.1-flash-lite), Claude fallback (ANTHROPIC_API_KEY, ANTHROPIC_MODEL default claude-haiku-5-5, x-api-key header). Keys stored via platform secrets (env), not in code.
- Fixed Anthropic base double /v1 bug; env keys override DB-saved key.
- gemini-3.8-flash hangs >60s (high demand) so lite used by default. Claude key valid but account has no credit.
- Restored typescript ^5 (next dev had auto-installed TS 7 which breaks next.config.ts).
- Fonts: dokumen (cetak HTML, DOCX, XLSX) teks Indonesia Arial 12pt, teks Arab Traditional Arabic 18pt (DOCX: run terpisah + RTL/bidi; HTML: @font-face "Arab Soal" unicode-range + size-adjust 150%; XLSX: sel berisi Arab → Traditional Arabic 18). Kop/judul tetap ukuran semula.

## Jun 2026 – Upload soal Excel
- Panel "Upload Soal dari Excel" di editor paket: unduh template (GET /api/soal/template; kolom Bentuk, Level, Skor, Materi, Nilai Cinta & CP, Indikator, Butir Soal, Pilihan A–E, Kunci; dropdown + sheet Petunjuk), unggah .xlsx (POST /api/soal/import, isi sel dibaca sebagai teks, foto/.xls ditolak), pratinjau yang bisa diedit/hapus → simpan ke paket.
- AI opsional melengkapi indikator/level kosong (lib/ai.ts lengkapiIndikator). Kunci Emergent (EMERGENT_LLM_KEY, gpt-5.4, .env.local) hanya cadangan untuk fitur ini bila Gemini/OpenAI/Claude gagal.
- Fix: simpan dari pratinjau/AI yang gagal tidak lagi menggandakan butir. TypeScript dikembalikan ke ^5.
- Backlog: verifikasi jalur cadangan Emergent saat kunci utama mati; dukung gambar soal dari Excel.
- Jun 2026: Kunci Emergent kini cadangan terakhir untuk SEMUA fitur AI (callAi). Diverifikasi: saat OpenAI/ZyRouter gagal → Emergent menjawab. Catatan: ZyRouter key membalas 401 (perlu diperbarui user).
