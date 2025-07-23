import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('=== Channel creation API called ===')
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { hasUser: !!user, userId: user?.id, authError: authError?.message })
    
    if (!user) {
      console.log('No user found, returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 管理者権限チェック（一般ユーザーでもチャンネル作成を許可）
    // 現在はRLSポリシーでadminのみに制限されているため、API側でのチェックは無効化

    const body = await request.json()
    const { category_id, name, description } = body
    console.log('Request body:', { category_id, name, description })

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // カテゴリーの存在確認
    const { data: category } = await supabase
      .from('board_categories')
      .select('id')
      .eq('id', category_id)
      .single()

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // チャンネル名を小文字・ハイフン区切りに変換
    const channelName = name.trim().toLowerCase().replace(/\s+/g, '-')

    // 同一カテゴリー内での重複チェック
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('category_id', category_id)
      .eq('name', channelName)
      .single()

    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel name already exists in this category' },
        { status: 409 }
      )
    }

    // 新しいsort_orderを取得
    const { data: maxSortOrder } = await supabase
      .from('channels')
      .select('sort_order')
      .eq('category_id', category_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (maxSortOrder?.sort_order || 0) + 1

    // チャンネル作成
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        category_id,
        name: channelName,
        description: description?.trim() || null,
        sort_order: nextSortOrder,
        created_by_id: user.id
      })
      .select(`
        id,
        name,
        description,
        sort_order,
        created_at,
        updated_at,
        created_by_id
      `)
      .single()

    if (error) {
      console.error('Channel creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create channel' },
        { status: 500 }
      )
    }

    // メッセージ数を追加
    ;(channel as any)._count = { messages: 0 }

    return NextResponse.json({ channel }, { status: 201 })

  } catch (error) {
    console.error('Channel creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, description } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      )
    }

    // チャンネルの存在確認と権限チェック
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id, created_by_id, category_id')
      .eq('id', id)
      .single()

    if (!existingChannel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // 権限チェック（作成者または管理者のみ）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingChannel.created_by_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // チャンネル名を小文字・ハイフン区切りに変換
    const channelName = name.trim().toLowerCase().replace(/\s+/g, '-')

    // 同一カテゴリー内での重複チェック（自分以外）
    const { data: duplicateChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('category_id', existingChannel.category_id)
      .eq('name', channelName)
      .neq('id', id)
      .single()

    if (duplicateChannel) {
      return NextResponse.json(
        { error: 'Channel name already exists in this category' },
        { status: 409 }
      )
    }

    // チャンネル更新
    const { data: channel, error } = await supabase
      .from('channels')
      .update({
        name: channelName,
        description: description?.trim() || null
      })
      .eq('id', id)
      .select(`
        id,
        name,
        description,
        sort_order,
        created_at,
        updated_at,
        created_by_id
      `)
      .single()

    if (error) {
      console.error('Channel update error:', error)
      return NextResponse.json(
        { error: 'Failed to update channel' },
        { status: 500 }
      )
    }

    return NextResponse.json({ channel })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('id')

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    // チャンネルの存在確認と権限チェック
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id, created_by_id')
      .eq('id', channelId)
      .single()

    if (!existingChannel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // 権限チェック（作成者または管理者のみ）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingChannel.created_by_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // チャンネルにメッセージが存在するかチェック
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('channel_id', channelId)
      .is('deleted_at', null)
      .limit(1)

    if (messages && messages.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete channel with existing messages' },
        { status: 400 }
      )
    }

    // チャンネル削除
    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)

    if (error) {
      console.error('Channel deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete channel' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}