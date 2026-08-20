import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // "s/" = halaman card publik hasil scan QR (lihat src/app/s/), read-only
  // tanpa login. "uploads/barang/" & "uploads/prasarana/" = foto yang perlu
  // ikut publik supaya bisa dimuat dari halaman itu — foto peminjaman &
  // laporan kerusakan TIDAK dikecualikan, tetap wajib login.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|s/|uploads/barang/|uploads/prasarana/).*)",
  ],
};
