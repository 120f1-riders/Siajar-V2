import { getDb } from "@/lib/db";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { getButir, getPaket } from "@/lib/queries";
import { BENTUK_SOAL } from "@/lib/konstanta";

export const runtime = "nodejs";

type ButirPayload = {
  bentuk?: string;
  materi?: string;
  acuan?: string;
  indikator?: string;
  level?: string;
  soal?: string;
  opsi?: string[];
  kunci?: string;
  skor?: number;
};

function text(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

function canEdit(status: string): boolean {
  return status === "draft" || status === "dikembalikan";
}

export async function PUT(
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
  if (paket.guru_id !== user.id) {
    return Response.json({ error: "Anda tidak berhak mengubah paket ini." }, { status: 403 });
  }
  if (!canEdit(paket.status)) {
    return Response.json(
      { error: "Paket yang sudah diajukan atau disahkan tidak dapat diubah." },
      { status: 409 }
    );
  }

  const body = (await req.json()) as {
    mapel?: string;
    kelas?: string;
    semester?: string;
    tahun_ajaran?: string;
    kurikulum?: string;
    jenis_penilaian?: string;
    alokasi_waktu?: string;
    petunjuk?: string;
    cetak_kunci?: boolean;
    butir?: ButirPayload[];
  };

  const mapel = text(body.mapel, 120).trim();
  const kelas = text(body.kelas, 40).trim();
  const tahunAjaran = text(body.tahun_ajaran, 20).trim();

  if (!mapel) return Response.json({ error: "Mata pelajaran wajib diisi." }, { status: 400 });
  if (!kelas) return Response.json({ error: "Kelas wajib diisi." }, { status: 400 });
  if (!tahunAjaran) {
    return Response.json({ error: "Tahun pelajaran wajib diisi." }, { status: 400 });
  }

  const kurikulum = body.kurikulum === "kbc" ? "kbc" : "merdeka";
  const butir = Array.isArray(body.butir) ? body.butir.slice(0, 200) : [];

  const preparedButir = butir.map((item, index) => {
    const bentuk = BENTUK_SOAL[String(item.bentuk ?? "")]
      ? String(item.bentuk)
      : "pg";
    const opsi = Array.isArray(item.opsi)
      ? item.opsi.slice(0, 5).map((v) => text(v, 600))
      : [];
    while (opsi.length < 5) opsi.push("");
    return {
      nomor: index + 1,
      bentuk,
      materi: text(item.materi, 300),
      acuan: text(item.acuan, 1200),
      indikator: text(item.indikator, 1200),
      level: text(item.level, 10) || "C2",
      soal: text(item.soal, 6000),
      opsi: JSON.stringify(opsi),
      kunci: text(item.kunci, 2000),
      skor: Math.max(0, Math.min(100, Number(item.skor) || 0)),
    };
  });

  const db = getDb();
  const now = new Date().toISOString();

  try {
    await db.transaction(async (tx) => {
      await tx.prepare(
        `UPDATE paket SET mapel = ?, kelas = ?, semester = ?, tahun_ajaran = ?,
                kurikulum = ?, jenis_penilaian = ?, alokasi_waktu = ?, petunjuk = ?,
                cetak_kunci = ?, updated_at = ?
          WHERE id = ?`
      ).run(
        mapel,
        kelas,
        body.semester === "Genap" ? "Genap" : "Ganjil",
        tahunAjaran,
        kurikulum,
        text(body.jenis_penilaian, 160) || "Asesmen Sumatif Akhir Semester",
        text(body.alokasi_waktu, 60),
        text(body.petunjuk, 4000),
        body.cetak_kunci ? 1 : 0,
        now,
        id
      );
      await tx.prepare("DELETE FROM butir WHERE paket_id = ?").run(id);
      const insert = tx.prepare(
        `INSERT INTO butir (paket_id, nomor, bentuk, materi, acuan, indikator, level, soal, opsi, kunci, skor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const item of preparedButir) {
        await insert.run(
          id,
          item.nomor,
          item.bentuk,
          item.materi,
          item.acuan,
          item.indikator,
          item.level,
          item.soal,
          item.opsi,
          item.kunci,
          item.skor
        );
      }
    });
  } catch (error) {
    console.error("Gagal menyimpan paket", error);
    return Response.json(
      { error: "Gagal menyimpan paket. Silakan coba lagi." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, updated_at: now, butir: await getButir(id) });
}

export async function DELETE(
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
  if (paket.guru_id !== user.id && user.role !== "admin") {
    return Response.json({ error: "Anda tidak berhak menghapus paket ini." }, { status: 403 });
  }
  if (paket.status === "disahkan" && user.role !== "admin") {
    return Response.json(
      { error: "Paket yang telah disahkan tidak dapat dihapus." },
      { status: 409 }
    );
  }

  const db = getDb();
  await db.prepare("DELETE FROM butir WHERE paket_id = ?").run(id);
  await db.prepare("DELETE FROM paket WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
