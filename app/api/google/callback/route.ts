import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { connectGoogleAccount } from "@/lib/google";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  await requireUser(["admin"]);

  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get("siajar_google_state")?.value;
  jar.set("siajar_google_state", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 0,
  });

  const back = (status: string, message: string) => {
    const target = new URL("/admin/pengaturan", url.origin);
    target.searchParams.set("google", status);
    target.searchParams.set("pesan", message.slice(0, 300));
    return NextResponse.redirect(target);
  };

  if (url.searchParams.get("error")) {
    return back("error", "Akses Google dibatalkan atau ditolak.");
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!expected || !state || state !== expected || !code) {
    return back("error", "Sesi koneksi Google tidak valid. Silakan coba lagi.");
  }

  try {
    const email = await connectGoogleAccount(url.origin, code);
    return back(
      "ok",
      email
        ? `Akun Google ${email} berhasil terhubung.`
        : "Akun Google berhasil terhubung."
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Koneksi Google gagal.";
    if (message === "GOOGLE_NOT_CONFIGURED") {
      return back("error", "Client ID atau Client Secret Google belum diisi.");
    }
    return back("error", message);
  }
}
