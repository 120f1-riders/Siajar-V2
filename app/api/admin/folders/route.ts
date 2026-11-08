import { getCurrentUser } from "@/lib/auth";
import { listDriveFolders, getGoogleAccessToken } from "@/lib/google";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  try {
    const token = await getGoogleAccessToken();
    const folders = await listDriveFolders(token);
    return Response.json(folders);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: message || "Gagal membaca daftar folder." },
      { status: 500 }
    );
  }
}
