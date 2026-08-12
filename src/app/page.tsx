import { redirect } from "next/navigation";
import { auth } from "@/auth";

const ROLE_HOME: Record<string, string> = {
  KETUA: "/ketua",
  SEKRETARIS: "/sekretaris",
  KETUA_GROUP: "/kelompok",
};

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(ROLE_HOME[session.user.role] ?? "/login");
}
