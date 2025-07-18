import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('Auth callback - code:', code)
    console.log('Auth callback - next:', next)
    console.log('Auth callback - origin:', origin)

    if (code) {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Auth callback - exchange result:', { data, error })
      
      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        console.log('Auth callback - isLocalEnv:', isLocalEnv)
        console.log('Auth callback - forwardedHost:', forwardedHost)
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      } else {
        console.error('Auth callback - exchange error:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
      }
    }

    console.log('Auth callback - no code provided')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
  } catch (err) {
    console.error('Auth callback - unexpected error:', err)
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=unexpected_error`)
  }
}