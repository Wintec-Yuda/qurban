"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireKetua() {
  const session = await auth();
  if (session?.user.role !== "KETUA") throw new Error("Tidak diizinkan");
  return session;
}

export async function setGroupActive(groupId: string, isActive: boolean) {
  await requireKetua();
  await prisma.group.update({
    where: { id: groupId },
    data: { isActive },
  });
  revalidatePath("/ketua");
}

export async function listGroupsWithLeaders() {
  return prisma.group.findMany({
    include: { leader: true, peserta: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listAccounts() {
  return prisma.user.findMany({
    where: { role: { in: ["SEKRETARIS", "KETUA_GROUP"] } },
    include: { group: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteAccount(userId: string) {
  await requireKetua();
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/ketua");
}
