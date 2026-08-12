"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { panitiaSchema, percentageSchema } from "@/lib/validations";

async function requireSekretaris() {
  const session = await auth();
  if (session?.user.role !== "SEKRETARIS") throw new Error("Tidak diizinkan");
  return session;
}

export async function addPanitia(_prev: unknown, formData: FormData) {
  await requireSekretaris();
  const parsed = panitiaSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await prisma.panitia.create({ data: { name: parsed.data.name } });
  revalidatePath("/sekretaris");
  return undefined;
}

export async function editPanitiaName(id: string, name: string) {
  await requireSekretaris();
  await prisma.panitia.update({ where: { id }, data: { name } });
  revalidatePath("/sekretaris");
}

export async function deletePanitia(id: string) {
  await requireSekretaris();
  await prisma.panitia.delete({ where: { id } });
  revalidatePath("/sekretaris");
}

export async function editPanitiaPercentage(id: string, percentage: number) {
  await requireSekretaris();
  const parsed = percentageSchema.safeParse({ percentage });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
  await prisma.panitia.update({
    where: { id },
    data: { percentage: parsed.data.percentage },
  });
  revalidatePath("/sekretaris");
}

// Bulk-set percentage for all Panitia at once.
export async function bulkSetPanitiaPercentage(percentage: number) {
  await requireSekretaris();
  const parsed = percentageSchema.safeParse({ percentage });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
  await prisma.panitia.updateMany({
    data: { percentage: parsed.data.percentage },
  });
  revalidatePath("/sekretaris");
}
