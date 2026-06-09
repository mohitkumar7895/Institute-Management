import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

function isPublicAdminApi(pathname: string): boolean {
  return (
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/admin/")) return NextResponse.next();
  if (isPublicAdminApi(pathname)) return NextResponse.next();

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Server misconfigured." }, { status: 500 });
  }

  const cookieToken = request.cookies.get("admin_token")?.value || "";
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "").trim() || "";
  // For admin APIs, prefer httpOnly cookie over localStorage bearer.
  // This avoids stale bearer tokens causing random data-load failures.
  const token = cookieToken || bearer;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);
    if (payload.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};

