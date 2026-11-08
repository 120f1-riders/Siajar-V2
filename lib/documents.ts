import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./auth";
import { getButir, getPaket, getSettings } from "./queries";
import { tanggalId } from "./format";
import type { Paket, Settings } from "./types";

export async function loadDokumen(id: number) {
  const user = await requireUser();
  if (!Number.isInteger(id)) notFound();

  const paket = getPaket(id);
  if (!paket) notFound();
  if (user.role === "guru" && paket.guru_id !== user.id) notFound();

  return {
    user,
    paket,
    butir: getButir(id),
    settings: getSettings(),
  };
}

export function dokumenBackHref(role: string, paketId: number): string {
  if (role === "guru") return `/guru/paket/${paketId}`;
  if (role === "kepala") return `/kepala/${paketId}`;
  return "/dashboard";
}

export function kepalaPenandaTangan(paket: Paket, settings: Settings) {
  return {
    nama: paket.signed_nama || settings.kepala_nama || "",
    nip: paket.signed_nip || settings.kepala_nip || "",
    ttd: paket.signed_ttd_path || settings.kepala_ttd_path || "",
  };
}

export function tanggalTandaTangan(paket: Paket, settings: Settings): string {
  const kota = settings.kota?.trim();
  const tanggal = paket.signed_at ? tanggalId(paket.signed_at) : "........................";
  return kota ? `${kota}, ${tanggal}` : tanggal;
}

export function jumlahSkor(butir: { skor: number }[]): number {
  return butir.reduce((sum, item) => sum + (Number(item.skor) || 0), 0);
}
