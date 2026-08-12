import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Minimal 3 karakter"),
  password: z.string().min(6, "Minimal 6 karakter"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Wajib diisi"),
  password: z.string().min(1, "Wajib diisi"),
});

export const createAccountSchema = z.object({
  username: z.string().trim().min(3, "Minimal 3 karakter"),
  password: z.string().min(6, "Minimal 6 karakter"),
  role: z.enum(["SEKRETARIS", "KETUA_GROUP"]),
  groupName: z.string().trim().min(1).optional(),
});

export const panitiaSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
});

export const pesertaSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
});

export const totalKgSchema = z.object({
  totalKg: z.coerce.number().min(0, "Tidak boleh negatif"),
});

export const percentageSchema = z.object({
  percentage: z.coerce.number().min(0, "Tidak boleh negatif"),
});

export const bulkPercentageSchema = z.object({
  target: z.enum(["PANITIA", "GROUP"]),
  groupId: z.string().optional(),
  percentage: z.coerce.number().min(0, "Tidak boleh negatif"),
});

export const groupNameSchema = z.object({
  name: z.string().trim().min(1, "Nama group wajib diisi"),
});
