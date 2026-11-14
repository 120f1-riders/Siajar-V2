import { getCurrentUser } from "@/lib/auth";
import { buatTemplate } from "@/lib/excel-soal";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Belum masuk." }, { status: 401 });
  const buf = await buatTemplate();
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-soal-siajar.xlsx"',
    },
  });
}
