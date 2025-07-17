import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request, context: { params: { id: string } }) {
  const { id } = context.params
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data: cafe, error } = await supabase
      .from('cafe_stats')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 })
    }

    const { data: reviews } = await supabase
      .from('cafe_reviews')
      .select('*')
      .eq('cafe_post_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ 
      cafe,
      reviews: reviews || []
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const { id } = context.params
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const {
      title,
      description,
      address,
      phone,
      website,
      opening_hours,
      image_url,
      tags,
      wifi_available,
      has_cycle_rack,
      has_power_outlet,
      user_id
    } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const { data: cafe, error } = await supabase
      .from('cafe_posts')
      .update({
        title,
        description,
        address,
        phone,
        website,
        opening_hours,
        image_url,
        tags: tags || [],
        wifi_available: wifi_available || false,
        bike_parking: has_cycle_rack || false,
        has_power_outlet: has_power_outlet || false
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update cafe post' }, { status: 500 })
    }

    return NextResponse.json({ cafe })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { id } = context.params
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { user_id } = body
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    const { error } = await supabase
      .from('cafe_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete cafe post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}