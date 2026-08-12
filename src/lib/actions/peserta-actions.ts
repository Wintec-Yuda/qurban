"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { pesertaSchema, percentageSchema } from "@/lib/validations";

async function requireKetuaGroupWithGroup() {
  const session = await auth();
  if (session?.user.role !== "KETUA_GROUP" || !session.user.groupId) {
    throw new Error("Tidak diizinkan");
  }
  return session;
}

async function requireSekretaris() {
  const session = await auth();
  if (session?.user.role !== "SEKRETARIS") throw new Error("Tidak diizinkan");
  return session;
}

async function assertOwnsPeserta(groupId: string, pesertaId: string) {
  const peserta = await prisma.peserta.findUnique({ where: { id: pesertaId } });
  if (!peserta || peserta.groupId !== groupId) {
    throw new Error("Peserta tidak ditemukan di group Anda");
  }
}

export async function addPeserta(_prev: unknown, formData: FormData) {
  const session = await requireKetuaGroupWithGroup();
  const parsed = pesertaSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await prisma.peserta.create({
    data: { name: parsed.data.name, groupId: session.user.groupId! },
  });
  revalidatePath("/kelompok");
  return undefined;
}

export async function editPesertaName(pesertaId: string, name: string) {
  const session = await requireKetuaGroupWithGroup();
  await assertOwnsPeserta(session.user.groupId!, pesertaId);
  await prisma.peserta.update({ where: { id: pesertaId }, data: { name } });
  revalidatePath("/kelompok");
}

export async function deletePeserta(pesertaId: string) {
  const session = await requireKetuaGroupWithGroup();
  await assertOwnsPeserta(session.user.groupId!, pesertaId);
  await prisma.peserta.delete({ where: { id: pesertaId } });
  revalidatePath("/kelompok");
}

export async function toggleSudahMenerima(pesertaId: string, value: boolean) {
  const session = await requireKetuaGroupWithGroup();
  await assertOwnsPeserta(session.user.groupId!, pesertaId);
  await prisma.peserta.update({
    where: { id: pesertaId },
    data: { sudahMenerima: value },
  });
  revalidatePath("/kelompok");
}

// --- Sekretaris: percentage editing ---

export async function editPesertaPercentage(pesertaId: string, percentage: number) {
  await requireSekretaris();
  const parsed = percentageSchema.safeParse({ percentage });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
  await prisma.peserta.update({
    where: { id: pesertaId },
    data: { percentage: parsed.data.percentage },
  });
  revalidatePath("/sekretaris");
}

// Bulk-set percentage for every active peserta in one group.
export async function bulkSetGroupPercentage(groupId: string, percentage: number) {
  await requireSekretaris();
  const parsed = percentageSchema.safeParse({ percentage });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
  await prisma.peserta.updateMany({
    where: { groupId },
    data: { percentage: parsed.data.percentage },
  });
  revalidatePath("/sekretaris");
}
