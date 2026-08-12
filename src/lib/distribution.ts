import { prisma } from "@/lib/prisma";
import { calculateDistribution } from "@/lib/calc";
import { getPengaturan } from "@/lib/actions/pengaturan-actions";

export async function getFullDistribution() {
  const [pengaturan, panitia, groups] = await Promise.all([
    getPengaturan(),
    prisma.panitia.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.group.findMany({
      include: { peserta: { orderBy: { createdAt: "asc" } }, leader: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pesertaAktif = groups
    .filter((g) => g.isActive)
    .flatMap((g) => g.peserta);

  const result = calculateDistribution(pengaturan.totalKg, panitia, pesertaAktif);

  return { pengaturan, groups, panitia, result };
}
