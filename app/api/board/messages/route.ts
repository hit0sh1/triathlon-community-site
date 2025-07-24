import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channel_id')
    const threadId = searchParams.get('thread_id')
    const popular = searchParams.get('popular') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    // 人気投稿取得（ホームページ用）
    if (popular) {
      const { data: messages, error } = await supabase
        .from('messages')
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
          channel:channels!messages_channel_id_fkey (
            id,
            name,
            category:board_categories!channels_category_id_fkey (
              id,
              name,
              color
            )
          ),
          reactions (
            id,
            emoji_code,
            user_id,
            created_at
          ),
          mentions (
            id,
            mentioned_user_id
          )
        `)
        .is('thread_id', null) // チャンネル直接投稿のみ
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Popular messages fetch error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch popular messages' },
          { status: 500 }
        )
      }

      // スレッド返信数を追加
      for (const message of messages || []) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', message.id)
          .is('deleted_at', null)

        ;(message as any).thread_reply_count = count || 0
        ;(message as any).is_thread_starter = true
        ;(message as any).thread_replies = []
      }

      return NextResponse.json({ messages })
    }

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('messages')
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
      .eq('channel_id', channelId)
      .is('deleted_at', null)

    // スレッド返信の場合
    if (threadId) {
      query = query.eq('thread_id', threadId)
    } else {
      // チャンネル直接投稿のみ
      query = query.is('thread_id', null)
    }

    const { data: messages, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Messages fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // 各チャンネル投稿のスレッド返信数を取得
    if (!threadId) {
      for (const message of messages || []) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', message.id)
          .is('deleted_at', null)

        ;(message as any).thread_reply_count = count || 0
        ;(message as any).is_thread_starter = true
        ;(message as any).thread_replies = []
      }
    }

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    // デバッグ情報
    console.log('API Auth debug:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
      cookieHeader: request.headers.get('cookie')?.includes('sb-'),
    })
    
    if (!user) {
      console.log('Unauthorized: No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { channel_id, thread_id, content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (!channel_id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }

    // チャンネルの存在確認
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('id', channel_id)
      .single()

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // スレッド返信の場合、親メッセージの存在確認
    if (thread_id) {
      const { data: parentMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('id', thread_id)
        .eq('channel_id', channel_id)
        .is('deleted_at', null)
        .single()

      if (!parentMessage) {
        return NextResponse.json(
          { error: 'Parent message not found' },
          { status: 404 }
        )
      }
    }

    const messageType = thread_id ? 'thread_reply' : 'channel'

    // メンションを解析 (display_nameに対応するため空白を含む可能性を考慮)
    const mentionMatches = content.match(/@([^\s@]+(?:\s+[^\s@]+)*)/g) || []
    const mentionNames = mentionMatches.map((match: string) => match.substring(1).trim())

    // メッセージ作成
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        channel_id,
        thread_id: thread_id || null,
        author_id: user.id,
        content: content.trim(),
        message_type: messageType
      })
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
        )
      `)
      .single()

    if (messageError) {
      console.error('Message creation error:', messageError)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // メンションの処理
    if (mentionNames.length > 0) {
      // display_nameまたはusernameからIDを取得
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .or(mentionNames.map((name: string) => `username.eq.${name},display_name.eq.${name}`).join(','))

      if (mentionedUsers && mentionedUsers.length > 0) {
        // メンションレコード作成
        const mentionInserts = mentionedUsers.map(mentionedUser => ({
          message_id: message.id,
          mentioned_user_id: mentionedUser.id
        }))

        await supabase.from('mentions').insert(mentionInserts)

        // 通知作成（メンション対象者に）
        const notificationInserts = mentionedUsers
          .filter(mentionedUser => mentionedUser.id !== user.id) // 自分をメンションした場合は通知しない
          .map(mentionedUser => ({
            user_id: mentionedUser.id,
            type: 'mention' as const,
            message_id: message.id
          }))

        if (notificationInserts.length > 0) {
          await supabase.from('notifications').insert(notificationInserts)
        }
      }
    }

    // レスポンス用にデータを整形
    ;(message as any).reactions = []
    ;(message as any).mentions = []
    ;(message as any).thread_reply_count = 0
    ;(message as any).is_thread_starter = false
    ;(message as any).thread_replies = []

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}