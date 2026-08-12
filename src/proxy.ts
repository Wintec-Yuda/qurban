import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ROLE_HOME: Record<string, string> = {
  KETUA: "/ketua",
  SEKRETARIS: "/sekretaris",
  KETUA_GROUP: "/kelompok",
};

const ROLE_PREFIX: Record<string, string> = {
  "/ketua": "KETUA",
  "/sekretaris": "SEKRETARIS",
  "/kelompok": "KETUA_GROUP",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = pathname === "/login" || pathname === "/register";

  // Not logged in -> only public pages allowed.
  if (!session?.user) {
    if (isPublic) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in but visiting login/register -> send to their dashboard.
  if (isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[session.user.role] ?? "/login";
    return NextResponse.redirect(url);
  }

  // Enforce role-based section access.
  const matchedPrefix = Object.keys(ROLE_PREFIX).find((prefix) =>
    pathname.startsWith(prefix)
  );
  if (matchedPrefix && ROLE_PREFIX[matchedPrefix] !== session.user.role) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[session.user.role] ?? "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
