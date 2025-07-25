import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdminServer } from '@/lib/admin-server'

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit')
  const offset = searchParams.get('offset')
  const search = searchParams.get('search')
  const tags = searchParams.get('tags')

  try {
    let query = supabase
      .from('cafe_stats')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    // 検索条件を追加
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // タグフィルタを追加
    if (tags) {
      const tagArray = tags.split(',')
      query = query.overlaps('tags', tagArray)
    }

    // ページネーション
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || '10') - 1)
    }

    const { data: cafes, error } = await query

    if (error) {
      console.error('Error fetching cafes:', error)
      return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 })
    }

    return NextResponse.json({ cafes })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Admin権限チェック
    const user = await requireAdminServer()
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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

    // 認証チェック
    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    // 入力検証
    if (!title || !description || !address) {
      return NextResponse.json(
        { error: 'タイトル、説明、住所は必須です' },
        { status: 400 }
      )
    }

    console.log('Attempting to insert cafe post with data:', {
      user_id,
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
      has_power_outlet: has_power_outlet || false,
      is_approved: false
    })

    // Create the cafe post using service role (bypasses RLS)
    const insertData = {
      user_id: user_id,
      title,
      description,
      address,
      phone: phone || null,
      website: website || null,
      opening_hours: opening_hours || null,
      image_url: image_url || null,
      tags: tags || [],
      wifi_available: wifi_available || false,
      bike_parking: has_cycle_rack || false,
      has_power_outlet: has_power_outlet || false,
      is_approved: true // 開発環境では自動承認
    }
    
    console.log('Final insert data:', insertData)
    
    const { data: cafe, error } = await supabase
      .from('cafe_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating cafe post:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: 'Failed to create cafe post', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ cafe })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    if (error?.message === '管理者権限が必要です') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}