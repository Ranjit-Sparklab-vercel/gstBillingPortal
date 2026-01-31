import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporarily disabled authentication - all routes are accessible
export function middleware(request: NextRequest) {
  // Allow all routes without authentication check
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
