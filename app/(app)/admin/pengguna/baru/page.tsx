import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CreateUserForm } from "@/components/admin/user-forms";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PenggunaBaruPage() {
  await requireUser(["admin"]);

  return (
    <div>
      <PageHeader
        title="Tambah Pengguna"
        description="Buat akun guru, kepala madrasah, atau administrator baru."
      >
        <Link href="/admin" className="btn btn-outline">
          ← Kembali
        </Link>
      </PageHeader>

      <div className="card max-w-3xl p-5">
        <CreateUserForm />
      </div>
    </div>
  );
}
