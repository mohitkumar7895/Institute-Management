/**
 * Which URL paths require an ATC/Admin staff session (handled by AuthContext).
 * Student and marketing routes are excluded so users are not sent to ATC login.
 */
export function requiresStaffSession(pathname: string): boolean {
  if (pathname.startsWith("/student")) return false;
  if (pathname.startsWith("/verification")) return false;

  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/login")) {
    return true;
  }
  if (pathname.startsWith("/atc/") && !pathname.startsWith("/atc/login")) {
    return true;
  }
  return false;
}
