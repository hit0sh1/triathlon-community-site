import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<Params> }) {
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
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    const resolvedParams = await params
    
    // メッセージの存在確認と権限チェック
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id, author_id, content')
      .eq('id', resolvedParams.id)
      .is('deleted_at', null)
      .single()

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 作成者または管理者のみ編集可能
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingMessage.author_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // メッセージ更新
    const { data: message, error } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select(`
        id,
        channel_id,
        thread_id,
        content,
        message_type,
        like_count,
        created_at,
        updated_at,
        author:profiles!messages_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          role
        ),
        reactions (
          id,
          emoji_code,
          user_id,
          created_at,
          user:profiles!reactions_user_id_fkey (
            id,
            username,
            display_name
          )
        ),
        mentions (
          id,
          mentioned_user_id,
          user:profiles!mentions_mentioned_user_id_fkey (
            id,
            username,
            display_name
          )
        )
      `)
      .single()

    if (error) {
      console.error('Message update error:', error)
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    // レスポンス用にデータを整形
    ;(message as any).thread_reply_count = 0
    ;(message as any).is_thread_starter = false
    ;(message as any).thread_replies = []

    return NextResponse.json({ message })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
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

    const resolvedParams = await params
    
    // メッセージの存在確認と権限チェック
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id, author_id')
      .eq('id', resolvedParams.id)
      .is('deleted_at', null)
      .single()

    if (!existingMessage) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 作成者または管理者のみ削除可能
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingMessage.author_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // 論理削除（deleted_atに現在時刻を設定）
    const { error } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by_id: user.id
      })
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Message deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete message' },
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