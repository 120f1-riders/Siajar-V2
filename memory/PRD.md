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
