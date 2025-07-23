import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message_id, emoji_code } = body

    if (!message_id || !emoji_code) {
      return NextResponse.json(
        { error: 'Message ID and emoji code are required' },
        { status: 400 }
      )
    }

    // メッセージの存在確認
    const { data: message } = await supabase
      .from('messages')
      .select('id, author_id')
      .eq('id', message_id)
      .is('deleted_at', null)
      .single()

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 既存のリアクションを確認
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id')
      .eq('message_id', message_id)
      .eq('user_id', user.id)
      .eq('emoji_code', emoji_code)
      .single()

    if (existingReaction) {
      // 既存のリアクションを削除
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('Reaction deletion error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove reaction' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        action: 'removed',
        message: 'Reaction removed successfully' 
      })
    } else {
      // 新しいリアクションを追加
      const { data: reaction, error: insertError } = await supabase
        .from('reactions')
        .insert({
          message_id,
          user_id: user.id,
          emoji_code
        })
        .select(`
          id,
          emoji_code,
          created_at,
          user:profiles!reactions_user_id_fkey (
            id,
            username,
            display_name
          )
        `)
        .single()

      if (insertError) {
        console.error('Reaction creation error:', insertError)
        return NextResponse.json(
          { error: 'Failed to add reaction' },
          { status: 500 }
        )
      }

      // リアクション通知作成（自分以外のメッセージに対して）
      if (message.author_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: message.author_id,
            type: 'reaction',
            message_id: message_id
          })
      }

      return NextResponse.json({ 
        action: 'added',
        reaction,
        message: 'Reaction added successfully' 
      }, { status: 201 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const messageId = searchParams.get('message_id')

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // 指定されたメッセージのリアクションを取得
    const { data: reactions, error } = await supabase
      .from('reactions')
      .select(`
        id,
        emoji_code,
        created_at,
        user:profiles!reactions_user_id_fkey (
          id,
          username,
          display_name
        )
      `)
      .eq('message_id', messageId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Reactions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reactions })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}