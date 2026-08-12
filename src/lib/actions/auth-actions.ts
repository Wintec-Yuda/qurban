"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/auth";
import { registerSchema, createAccountSchema } from "@/lib/validations";

export type ActionState = { error?: string } | undefined;

// Anyone can register as Ketua (no invite/first-user restriction).
export async function registerKetua(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { error: "Username sudah dipakai" };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      username: parsed.data.username,
      password: hashed,
      role: "KETUA",
    },
  });

  await signIn("credentials", {
    username: parsed.data.username,
    password: parsed.data.password,
    redirectTo: "/ketua",
  });
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "type" in err) {
      return { error: "Username atau password salah" };
    }
    throw err;
  }
}

// Ketua registers Sekretaris & Ketua Group accounts. If role is KETUA_GROUP,
// a new Group is created (or reused if groupName matches an existing group
// without a leader) and linked one-to-one.
export async function createAccount(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (session?.user.role !== "KETUA") {
    return { error: "Tidak diizinkan" };
  }

  const parsed = createAccountSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
    groupName: formData.get("groupName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  if (parsed.data.role === "KETUA_GROUP" && !parsed.data.groupName) {
    return { error: "Nama group wajib diisi untuk Ketua Group" };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { error: "Username sudah dipakai" };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  if (parsed.data.role === "SEKRETARIS") {
    await prisma.user.create({
      data: {
        username: parsed.data.username,
        password: hashed,
        role: "SEKRETARIS",
        createdById: session.user.id,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        username: parsed.data.username,
        password: hashed,
        role: "KETUA_GROUP",
        createdById: session.user.id,
        group: {
          create: {
            name: parsed.data.groupName!,
          },
        },
      },
    });
  }

  return undefined;
}

export async function logoutAction() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/login" });
}

export async function requireRole(role: "KETUA" | "SEKRETARIS" | "KETUA_GROUP") {
  const session = await auth();
  if (session?.user.role !== role) {
    redirect("/login");
  }
  return session;
}
