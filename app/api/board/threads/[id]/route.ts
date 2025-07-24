import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
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

    const resolvedParams = await params
    
    // スレッドの親メッセージを取得
    const { data: threadMessage, error: threadError } = await supabase
      .from('messages')
      .select(`
        id,
        channel_id,
        thread_id,
        content,
        image_url,
        image_urls,
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
      .eq('id', resolvedParams.id)
      .is('deleted_at', null)
      .single()

    if (threadError || !threadMessage) {
      return NextResponse.json(
        { error: 'Thread message not found' },
        { status: 404 }
      )
    }

    // スレッドの返信メッセージを取得
    const { data: replies, error: repliesError } = await supabase
      .from('messages')
      .select(`
        id,
        channel_id,
        thread_id,
        content,
        image_url,
        image_urls,
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
      .eq('thread_id', resolvedParams.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (repliesError) {
      console.error('Thread replies fetch error:', repliesError)
      return NextResponse.json(
        { error: 'Failed to fetch thread replies' },
        { status: 500 }
      )
    }

    // Parse image_urls from JSONB to array
    const parsedThreadMessage = {
      ...threadMessage,
      image_urls: threadMessage.image_urls ? (typeof threadMessage.image_urls === 'string' ? JSON.parse(threadMessage.image_urls) : threadMessage.image_urls) : [],
      thread_reply_count: replies?.length || 0,
      is_thread_starter: true,
      thread_replies: replies || []
    }

    const parsedReplies = replies?.map(reply => ({
      ...reply,
      image_urls: reply.image_urls ? (typeof reply.image_urls === 'string' ? JSON.parse(reply.image_urls) : reply.image_urls) : []
    })) || []

    return NextResponse.json({ 
      thread_message: parsedThreadMessage,
      replies: parsedReplies
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  console.log('=== Thread API POST called ===')
  const resolvedParams = await params
  console.log('Thread ID:', resolvedParams.id)
  
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
    
    console.log('Thread API Auth debug:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    })
    
    if (!user) {
      console.log('Thread API: Unauthorized - No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content } = body

    console.log('Thread reply request data:', { 
      threadId: resolvedParams.id, 
      content: content?.substring(0, 50) + '...',
      hasContent: !!content?.trim(),
      userId: user.id
    })

    if (!content || !content.trim()) {
      console.log('Thread reply: Missing content')
      return NextResponse.json(
        { error: 'Reply content is required' },
        { status: 400 }
      )
    }

    // 親メッセージの存在確認
    const { data: parentMessage } = await supabase
      .from('messages')
      .select('id, channel_id, author_id')
      .eq('id', resolvedParams.id)
      .is('deleted_at', null)
      .single()

    console.log('Parent message check:', { 
      threadId: resolvedParams.id, 
      found: !!parentMessage,
      parentMessage: parentMessage ? {
        id: parentMessage.id,
        channel_id: parentMessage.channel_id,
        author_id: parentMessage.author_id
      } : null
    })

    if (!parentMessage) {
      console.log('Thread reply: Parent message not found')
      return NextResponse.json(
        { error: 'Parent message not found' },
        { status: 404 }
      )
    }

    // メンションを解析
    const mentionMatches = content.match(/@(\w+)/g) || []
    const mentionUsernames = mentionMatches.map((match: string) => match.substring(1))

    // スレッド返信作成
    const insertData = {
      channel_id: parentMessage.channel_id,
      thread_id: resolvedParams.id,
      author_id: user.id,
      content: content.trim(),
      message_type: 'thread_reply'
    }
    
    console.log('Inserting thread reply:', insertData)
    
    const { data: reply, error: replyError } = await supabase
      .from('messages')
      .insert(insertData)
      .select(`
        id,
        channel_id,
        thread_id,
        content,
        image_url,
        image_urls,
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

    if (replyError) {
      console.error('Thread reply creation error:', {
        error: replyError,
        message: replyError.message,
        details: replyError.details,
        hint: replyError.hint,
        code: replyError.code
      })
      return NextResponse.json(
        { error: 'Failed to create thread reply', details: replyError.message },
        { status: 500 }
      )
    }

    // メンションの処理
    if (mentionUsernames.length > 0) {
      // ユーザー名からIDを取得
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id, username')
        .in('username', mentionUsernames)

      if (mentionedUsers && mentionedUsers.length > 0) {
        // メンションレコード作成
        const mentionInserts = mentionedUsers.map(mentionedUser => ({
          message_id: reply.id,
          mentioned_user_id: mentionedUser.id
        }))

        await supabase.from('mentions').insert(mentionInserts)

        // 通知作成（メンション対象者に）
        const notificationInserts = mentionedUsers
          .filter(mentionedUser => mentionedUser.id !== user.id)
          .map(mentionedUser => ({
            user_id: mentionedUser.id,
            type: 'mention' as const,
            message_id: reply.id
          }))

        if (notificationInserts.length > 0) {
          await supabase.from('notifications').insert(notificationInserts)
        }
      }
    }

    // 返信通知は自動でトリガー関数により作成される

    // レスポンス用にデータを整形
    ;(reply as any).reactions = []
    ;(reply as any).mentions = []
    ;(reply as any).thread_reply_count = 0
    ;(reply as any).is_thread_starter = false
    ;(reply as any).thread_replies = []

    console.log('Thread reply created successfully:', {
      replyId: reply.id,
      threadId: resolvedParams.id,
      content: reply.content.substring(0, 50) + '...'
    })

    return NextResponse.json({ reply }, { status: 201 })

  } catch (error) {
    console.error('Thread POST API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}