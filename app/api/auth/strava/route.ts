import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json()
    
    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Strava configuration missing' },
        { status: 500 }
      )
    }

    // Exchange authorization code for access token using PKCE
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Strava token exchange failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()
    
    // Get current user from Supabase
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return NextResponse.json(
        { error: 'User not authenticated', details: userError?.message },
        { status: 401 }
      )
    }

    // Save Strava connection to database
    const { error: insertError } = await supabase
      .from('strava_connections')
      .upsert({
        user_id: user.id,
        strava_athlete_id: tokenData.athlete.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        scope: tokenData.scope,
        athlete_data: tokenData.athlete,
        is_active: true,
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save connection' },
        { status: 500 }
      )
    }

    // Update user profile with Strava connection status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        strava_connected: true,
        strava_athlete_id: tokenData.athlete.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      athlete: tokenData.athlete,
    })

  } catch (error) {
    console.error('Strava auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}