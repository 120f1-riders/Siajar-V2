import { requireUser } from "@/lib/auth";
import { countPendingReset } from "@/lib/queries";
import { AppNav, type NavItem } from "@/components/app-nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const pendingReset = user.role === "admin" ? await countPendingReset() : 0;

  const items: NavItem[] = [{ href: "/dashboard", label: "Dasbor", icon: "home" }];

  if (user.role === "guru") {
    items.push({ href: "/guru", label: "Paket Soal", icon: "file" });
  }
  if (user.role === "kepala") {
    items.push({ href: "/kepala", label: "Tanda Tangan", icon: "pen" });
  }
  if (user.role === "admin") {
    items.push({ href: "/admin", label: "Pengguna & Reset", icon: "users", badge: pendingReset });
    items.push({ href: "/admin/pengaturan", label: "Kop Surat", icon: "settings" });
    items.push({ href: "/admin/integrasi", label: "Integrasi", icon: "plug" });
  }

  items.push({ href: "/akun", label: "Akun Saya", icon: "user" });

  return (
    <div className="min-h-screen">
      <AppNav items={items} user={{ nama: user.nama, role: user.role }} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
