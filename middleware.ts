import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: any) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (Service Worker)
     * - PWA icons and static assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|apple-touch-icon\\.png|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}