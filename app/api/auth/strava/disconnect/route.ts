import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get Strava connection to revoke access token
    const { data: connection, error: connectionError } = await supabase
      .from('strava_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (connection && connection.access_token) {
      // Revoke Strava access token
      try {
        await fetch('https://www.strava.com/oauth/deauthorize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
          },
        })
      } catch (error) {
        console.error('Failed to revoke Strava token:', error)
        // Continue with local cleanup even if revocation fails
      }
    }

    // Deactivate Strava connection in database
    const { error: deactivateError } = await supabase
      .from('strava_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (deactivateError) {
      console.error('Failed to deactivate connection:', deactivateError)
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      )
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        strava_connected: false,
        strava_athlete_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: 'Strava connection disconnected successfully',
    })

  } catch (error) {
    console.error('Strava disconnect API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}