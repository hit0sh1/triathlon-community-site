import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// service roleキーを使用してSupabaseクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, user_ids, title, message, type = 'info', link } = body

    // 入力検証
    if (!title || !message) {
      return NextResponse.json(
        { error: 'タイトルとメッセージは必須です' },
        { status: 400 }
      )
    }

    if (!user_id && !user_ids) {
      return NextResponse.json(
        { error: 'user_idまたはuser_idsが必要です' },
        { status: 400 }
      )
    }

    // 通知の作成
    const notifications = []
    
    if (user_id) {
      // 単一ユーザーへの通知
      notifications.push({
        user_id,
        title,
        message,
        type,
        link
      })
    } else if (user_ids && Array.isArray(user_ids)) {
      // 複数ユーザーへの通知
      notifications.push(...user_ids.map(id => ({
        user_id: id,
        title,
        message,
        type,
        link
      })))
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('Error creating notifications:', error)
      return NextResponse.json(
        { error: '通知の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: data,
      count: data.length
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 全ユーザーへの一括通知
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { title, message, type = 'info', link } = body

    // 入力検証
    if (!title || !message) {
      return NextResponse.json(
        { error: 'タイトルとメッセージは必須です' },
        { status: 400 }
      )
    }

    // 全ユーザーのIDを取得
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'ユーザーの取得に失敗しました' },
        { status: 500 }
      )
    }

    // 各ユーザーへの通知を作成
    const notifications = users.users.map(user => ({
      user_id: user.id,
      title,
      message,
      type,
      link
    }))

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('Error creating notifications:', error)
      return NextResponse.json(
        { error: '通知の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: data,
      count: data.length
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}