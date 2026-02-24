import { type NextRequest, NextResponse } from "next/server";
import { infuseRequestCspHeaders, infuseResponseCspHeaders } from "nextjs-secure-config";

export function proxy(request: NextRequest) {
  const requestHeaders = infuseRequestCspHeaders(request.headers);
  return infuseResponseCspHeaders(
    requestHeaders,
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
