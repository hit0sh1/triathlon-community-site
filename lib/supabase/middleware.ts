import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Skip authentication for static files and PWA assets
  const pathname = request.nextUrl.pathname;
  
  // List of paths that should bypass authentication
  const publicPaths = [
    '/_next/',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/apple-touch-icon.png',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.svg',
    '/icon-192.svg',
    '/icon-512.svg',
    '/logo.svg',
    '/next.svg',
    '/vercel.svg',
    '/file.svg',
    '/globe.svg',
    '/window.svg'
  ];

  // Check if path should be public
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path) || pathname === path
  ) || /\.(svg|png|jpg|jpeg|gif|webp|ico|json|js)$/.test(pathname);

  if (isPublicPath) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    request.nextUrl.pathname !== "/"
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // 元のURLとクエリパラメータを保存
    const originalUrl = request.nextUrl.pathname + request.nextUrl.search;
    url.searchParams.set("redirect", originalUrl);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object here instead of the supabaseResponse object

  return supabaseResponse;
}
