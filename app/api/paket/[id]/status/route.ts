import { getDb } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getButir, getPaket } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  if (!isSameOrigin(req)) {
    return Response.json({ error: "Origin tidak diizinkan." }, { status: 403 });
  }

  const { id: rawId } = await ctx.params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Paket tidak valid." }, { status: 400 });
  }
  const paket = await getPaket(id);
  if (!paket) return Response.json({ error: "Paket tidak ditemukan." }, { status: 404 });

  const body = (await req.json()) as { action?: string; catatan?: string };
  const action = body.action;
  const db = getDb();
  const now = new Date().toISOString();

  const isOwner = paket.guru_id === user.id;
  const isSigner = user.role === "kepala" || user.role === "admin";

  if (action === "ajukan") {
    if (!isOwner) {
      return Response.json({ error: "Hanya pemilik paket yang dapat mengajukan." }, { status: 403 });
    }
    if (paket.status !== "draft" && paket.status !== "dikembalikan") {
      return Response.json({ error: "Paket tidak dapat diajukan saat ini." }, { status: 409 });
    }
    const butir = await getButir(id);
    if (butir.length === 0) {
      return Response.json({ error: "Tambahkan minimal satu butir soal." }, { status: 400 });
    }
    if (!paket.mapel || !paket.kelas || !paket.tahun_ajaran) {
      return Response.json(
        { error: "Lengkapi identitas paket sebelum diajukan." },
        { status: 400 }
      );
    }
    const kosong = butir.find((b) => !b.soal.trim());
    if (kosong) {
      return Response.json(
        { error: `Butir nomor ${kosong.nomor} belum berisi soal.` },
        { status: 400 }
      );
    }

    await db.prepare(
      `UPDATE paket SET status = 'diajukan', submitted_at = ?, updated_at = ?,
              catatan_kepala = NULL WHERE id = ?`
    ).run(now, now, id);
    return Response.json({ ok: true, status: "diajukan" });
  }

  if (action === "tarik") {
    if (!isOwner) {
      return Response.json({ error: "Hanya pemilik paket yang dapat menarik pengajuan." }, { status: 403 });
    }
    if (paket.status !== "diajukan") {
      return Response.json({ error: "Paket tidak sedang diajukan." }, { status: 409 });
    }
    await db.prepare(
      "UPDATE paket SET status = 'draft', submitted_at = NULL, updated_at = ? WHERE id = ?"
    ).run(now, id);
    return Response.json({ ok: true, status: "draft" });
  }

  if (action === "sahkan") {
    if (!isSigner) {
      return Response.json(
        { error: "Hanya kepala madrasah yang dapat menandatangani." },
        { status: 403 }
      );
    }
    if (paket.status !== "diajukan") {
      return Response.json(
        { error: "Hanya paket yang sudah diajukan dapat disahkan." },
        { status: 409 }
      );
    }
    const butir = await getButir(id);
    if (butir.length === 0) {
      return Response.json({ error: "Paket belum memiliki butir soal." }, { status: 400 });
    }
    await db.prepare(
      `UPDATE paket SET status = 'disahkan', signed_by = ?, signed_at = ?,
              updated_at = ?, catatan_kepala = NULL WHERE id = ?`
    ).run(user.id, now, now, id);
    return Response.json({ ok: true, status: "disahkan" });
  }

  if (action === "kembalikan") {
    if (!isSigner) {
      return Response.json(
        { error: "Hanya kepala madrasah yang dapat mengembalikan paket." },
        { status: 403 }
      );
    }
    if (paket.status !== "diajukan") {
      return Response.json({ error: "Paket tidak sedang diajukan." }, { status: 409 });
    }
    const catatan = String(body.catatan ?? "").trim().slice(0, 500);
    await db.prepare(
      `UPDATE paket SET status = 'dikembalikan', catatan_kepala = ?, updated_at = ?,
              signed_by = NULL, signed_at = NULL WHERE id = ?`
    ).run(catatan, now, id);
    return Response.json({ ok: true, status: "dikembalikan" });
  }

  return Response.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
