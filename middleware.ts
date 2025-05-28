import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Define public routes that don't require authentication
const publicRoutes = [
  "/", 
  "/login", 
  "/register", 
  "/reset-password", 
  "/update-password", 
  "/welcome", 
  "/features", 
  "/pricing",
  "/auth/callback"
]

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // Allow public routes
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
      return response
    }

    // Check for admin routes
    if (pathname.startsWith("/admin")) {
      // For admin routes, we need stricter checking
      const supabase = createMiddlewareClient({ req: request, res: response })
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // No session, redirect to login
          return NextResponse.redirect(new URL("/login", request.url))
        }

        // Check if user is admin in database
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (!adminData) {
          // Not an admin, redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }

        // Set admin cookie for client-side checks
        response.cookies.set("isAdmin", "true", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24, // 1 day
          path: "/",
        })

        return response
      } catch (error) {
        console.error("Admin check error:", error)
        return NextResponse.redirect(new URL("/login", request.url))
      }
    }

    // For all other protected routes, check if user is authenticated
    const supabase = createMiddlewareClient({ req: request, res: response })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return NextResponse.redirect(new URL("/login", request.url))
      }

      return response
    } catch (error) {
      console.error("Auth check error:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to proceed for non-admin routes
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}