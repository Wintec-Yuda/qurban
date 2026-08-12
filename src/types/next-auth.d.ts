import { DefaultSession } from "next-auth";

export type AppRole = "KETUA" | "SEKRETARIS" | "KETUA_GROUP";

declare module "next-auth" {
  interface User {
    role: AppRole;
    groupId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      groupId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: AppRole;
    groupId: string | null;
  }
}
