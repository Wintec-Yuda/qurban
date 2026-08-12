"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { totalKgSchema } from "@/lib/validations";

const SINGLETON_ID = "singleton";

export async function getPengaturan() {
  const existing = await prisma.pengaturan.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (existing) return existing;
  return prisma.pengaturan.create({ data: { id: SINGLETON_ID, totalKg: 0 } });
}

export async function setTotalKg(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "SEKRETARIS") return { error: "Tidak diizinkan" };

  const parsed = totalKgSchema.safeParse({ totalKg: formData.get("totalKg") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await prisma.pengaturan.upsert({
    where: { id: SINGLETON_ID },
    update: { totalKg: parsed.data.totalKg },
    create: { id: SINGLETON_ID, totalKg: parsed.data.totalKg },
  });
  revalidatePath("/sekretaris");
  revalidatePath("/ketua");
  return undefined;
}

// Ketua clicks "Selesai": save a one-line summary to history, then reset
// totalKg -> 0, all percentages -> 100, sudahMenerima -> false. Accounts,
// names, groups, and group active/inactive status are left untouched.
export async function finishEvent() {
  const session = await auth();
  if (session?.user.role !== "KETUA") throw new Error("Tidak diizinkan");

  const pengaturan = await getPengaturan();
  const [
    panitiaCount,
    pesertaAktifCount,
    panitiaPercentageAgg,
    pesertaAktifPercentageAgg,
  ] = await Promise.all([
    prisma.panitia.count(),
    prisma.peserta.count({ where: { group: { isActive: true } } }),
    prisma.panitia.aggregate({
      _sum: { percentage: true },
    }),
    prisma.peserta.aggregate({
      where: { group: { isActive: true } },
      _sum: { percentage: true },
    }),
  ]);
  const totalPenerima = panitiaCount + pesertaAktifCount;
  const totalPanitiaPercentage = panitiaPercentageAgg._sum.percentage ?? 0;
  const totalPesertaAktifPercentage = pesertaAktifPercentageAgg._sum.percentage ?? 0;
  const totalBobot = totalPanitiaPercentage + totalPesertaAktifPercentage;
  const nilaiPer1Persen = totalBobot > 0 ? pengaturan.totalKg / totalBobot : 0;
  const panitiaKg = totalPanitiaPercentage * nilaiPer1Persen;
  const pesertaKg = totalPesertaAktifPercentage * nilaiPer1Persen;
  const rataPanitia = panitiaCount > 0 ? panitiaKg / panitiaCount : 0;
  const rataPeserta = pesertaAktifCount > 0 ? pesertaKg / pesertaAktifCount : 0;

  const tanggal = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fmtKg = (n: number) =>
    n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  const summary = `${tanggal} — ${fmtKg(
    pengaturan.totalKg
  )} kg dibagi ke ${totalPenerima} penerima (${panitiaCount} panitia: ${fmtKg(
    panitiaKg
  )} kg / ±${fmtKg(
    rataPanitia
  )} kg per orang, ${pesertaAktifCount} peserta: ${fmtKg(
    pesertaKg
  )} kg / ±${fmtKg(rataPeserta)} kg per orang).`;

  await prisma.$transaction([
    prisma.historyEntry.create({
      data: { summary, createdById: session.user.id },
    }),
    prisma.pengaturan.upsert({
      where: { id: "singleton" },
      update: { totalKg: 0 },
      create: { id: "singleton", totalKg: 0 },
    }),
    prisma.panitia.updateMany({ data: { percentage: 100 } }),
    prisma.peserta.updateMany({
      data: { percentage: 100, sudahMenerima: false },
    }),
  ]);

  revalidatePath("/ketua");
  revalidatePath("/sekretaris");
  revalidatePath("/kelompok");
}

export async function listHistory() {
  const session = await auth();
  if (session?.user.role !== "KETUA") return [];
  return prisma.historyEntry.findMany({ orderBy: { createdAt: "desc" } });
}
