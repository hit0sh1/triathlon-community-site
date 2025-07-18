import { createClient } from '@supabase/supabase-js'

// service roleキーを使用してSupabaseクライアントを作成（動的に作成）
const getSupabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase environment variables not found')
    // ビルド時のために一時的なクライアントを返す
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    )
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export interface NotificationData {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
  show_on_homepage?: boolean
  priority?: number
  expires_at?: string
}

export interface CreateNotificationOptions {
  user_id?: string
  user_ids?: string[]
  all_users?: boolean
}

/**
 * 通知を作成する関数
 */
export async function createNotification(
  data: NotificationData,
  options: CreateNotificationOptions
) {
  try {
    const { title, message, type = 'info', link, show_on_homepage = false, priority = 0, expires_at } = data
    const { user_id, user_ids, all_users } = options

    let targetUserIds: string[] = []

    if (all_users) {
      // 全ユーザーへの通知
      const { data: users, error: usersError } = await getSupabaseAdmin().auth.admin.listUsers()
      if (usersError) throw usersError
      targetUserIds = users.users.map(user => user.id)
    } else if (user_ids) {
      // 指定されたユーザーIDsへの通知
      targetUserIds = user_ids
    } else if (user_id) {
      // 単一ユーザーへの通知
      targetUserIds = [user_id]
    } else {
      throw new Error('通知の送信先が指定されていません')
    }

    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      link,
      show_on_homepage,
      priority,
      expires_at
    }))

    const { data: result, error } = await getSupabaseAdmin()
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) throw error

    return {
      success: true,
      notifications: result,
      count: result.length
    }
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * 特定のユーザーに通知を送信
 */
export async function sendNotificationToUser(
  userId: string,
  data: NotificationData
) {
  return createNotification(data, { user_id: userId })
}

/**
 * 複数のユーザーに通知を送信
 */
export async function sendNotificationToUsers(
  userIds: string[],
  data: NotificationData
) {
  return createNotification(data, { user_ids: userIds })
}

/**
 * 全ユーザーに通知を送信
 */
export async function sendNotificationToAllUsers(data: NotificationData) {
  return createNotification(data, { all_users: true })
}

/**
 * 新規投稿時の通知
 */
export async function notifyNewPost(
  postTitle: string,
  postId: string,
  authorName: string,
  excludeUserId?: string
) {
  const { data: users, error } = await getSupabaseAdmin().auth.admin.listUsers()
  if (error) throw error

  const targetUsers = excludeUserId 
    ? users.users.filter(user => user.id !== excludeUserId)
    : users.users

  return createNotification(
    {
      title: '新しい投稿があります',
      message: `${authorName}さんが「${postTitle}」を投稿しました`,
      type: 'info',
      link: `/board/${postId}`
    },
    { user_ids: targetUsers.map(user => user.id) }
  )
}

/**
 * イベント開催通知
 */
export async function notifyEventAnnouncement(
  eventTitle: string,
  eventId: string,
  eventDate: string
) {
  return sendNotificationToAllUsers({
    title: '新しいイベントが開催されます',
    message: `${eventTitle}が${eventDate}に開催されます`,
    type: 'info',
    link: `/events/${eventId}`,
    show_on_homepage: true,
    priority: 5
  })
}

/**
 * システムメンテナンス通知
 */
export async function notifySystemMaintenance(
  maintenanceDate: string,
  duration: string
) {
  return sendNotificationToAllUsers({
    title: 'システムメンテナンスのお知らせ',
    message: `${maintenanceDate}に${duration}のメンテナンスを行います`,
    type: 'warning',
    show_on_homepage: true,
    priority: 10
  })
}

/**
 * ウェルカム通知（新規ユーザー向け）
 */
export async function sendWelcomeNotification(userId: string) {
  return sendNotificationToUser(userId, {
    title: '沖縄トライアスロンコミュニティへようこそ！',
    message: 'アカウント作成ありがとうございます。プロフィールを設定して、コミュニティに参加しましょう。',
    type: 'success',
    link: '/profile'
  })
}

/**
 * コメント通知
 */
export async function notifyNewComment(
  postId: string,
  postTitle: string,
  commenterName: string,
  postAuthorId: string
) {
  return sendNotificationToUser(postAuthorId, {
    title: 'あなたの投稿にコメントがありました',
    message: `${commenterName}さんが「${postTitle}」にコメントしました`,
    type: 'info',
    link: `/board/${postId}`
  })
}