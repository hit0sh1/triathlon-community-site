import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
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

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
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

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { user_id, is_admin_deletion = false, deletion_reason } = body
    
    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }

    // カフェ投稿の詳細を取得
    const { data: cafePost, error: fetchError } = await supabase
      .from('cafe_posts')
      .select('title, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !cafePost) {
      return NextResponse.json({ error: 'Cafe post not found' }, { status: 404 })
    }

    if (is_admin_deletion) {
      // 管理者削除: 論理削除 + 削除理由記録 + 通知
      if (!deletion_reason) {
        return NextResponse.json({ error: 'Deletion reason is required for admin deletion' }, { status: 400 })
      }

      const { error } = await supabase
        .from('cafe_posts')
        .update({ 
          deleted_at: new Date().toISOString(),
          deletion_reason: deletion_reason,
          deleted_by: user_id
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete cafe post' }, { status: 500 })
      }

      // 投稿者が削除者と異なる場合のみ通知を送信
      if (cafePost.user_id !== user_id) {
        const { notifyAdminDeletion } = await import('@/lib/notifications')
        
        // 管理者情報を取得
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user_id)
          .single()

        await notifyAdminDeletion(
          cafePost.user_id,
          'cafe',
          cafePost.title,
          adminProfile?.display_name || '管理者',
          deletion_reason
        )
      }
    } else {
      // ユーザー削除: 論理削除のみ（自分の投稿のみ削除可能）
      const { error } = await supabase
        .from('cafe_posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user_id) // 自分の投稿のみ削除可能

      if (error) {
        return NextResponse.json({ error: 'Failed to delete cafe post' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}