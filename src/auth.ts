import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// "Unlimited" session: NextAuth requires a maxAge, so we use a very large
// value (100 years) instead of the default 30-day expiry. The JWT is
// refreshed on every request (updateAge left at default), so as long as the
// user keeps the cookie the session effectively never expires.
const HUNDRED_YEARS = 60 * 60 * 24 * 365 * 100;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: HUNDRED_YEARS,
  },
  jwt: {
    maxAge: HUNDRED_YEARS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username },
          include: { group: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          groupId: user.group?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.groupId = user.groupId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "KETUA" | "SEKRETARIS" | "KETUA_GROUP";
        session.user.groupId = (token.groupId as string | null) ?? null;
      }
      return session;
    },
  },
});
