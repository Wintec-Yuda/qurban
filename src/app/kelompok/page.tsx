import { requireRole } from "@/lib/actions/auth-actions";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard-header";
import { PesertaManager } from "@/components/kelompok/peserta-manager";

export default async function KelompokPage() {
  const session = await requireRole("KETUA_GROUP");

  const group = await prisma.group.findUnique({
    where: { id: session.user.groupId! },
    include: { peserta: { orderBy: { createdAt: "asc" } } },
  });

  if (!group) {
    return (
      <div className="p-6">
        <p>Group Anda tidak ditemukan. Hubungi Ketua.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <DashboardHeader
        title={`Group: ${group.name}`}
        subtitle={
          group.isActive
            ? "Group aktif — kelola daftar penerima"
            : "Group nonaktif — tidak ikut dalam pembagian saat ini"
        }
      />
      <main className="mx-auto max-w-3xl p-6">
        <PesertaManager initialPeserta={group.peserta} />
      </main>
    </div>
  );
}
