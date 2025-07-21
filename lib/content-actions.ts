import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type DeletionReason = Database['public']['Tables']['deletion_reasons']['Row']
type ContentActionLog = Database['public']['Tables']['content_action_logs']['Row']

export interface DeletionReasonOption {
  id: string
  name: string
  description: string | null
  severity: string
}

export interface ContentActionData {
  actionType: 'delete' | 'restore' | 'hide' | 'warn'
  contentType: 'event' | 'board_post' | 'board_reply' | 'column' | 'column_comment'
  contentId: string
  contentTitle?: string
  contentAuthorId?: string
  deletionReasonId?: string
  customReason?: string
  adminNotes?: string
}

export interface DeleteContentOptions {
  reasonId?: string
  customReason?: string
  adminNotes?: string
  notifyUser?: boolean
}

// 削除理由一覧を取得
export async function getDeletionReasons(): Promise<DeletionReasonOption[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('deletion_reasons')
    .select('*')
    .eq('is_active', true)
    .order('severity', { ascending: false })
    .order('name')
  
  if (error) {
    console.error('Error fetching deletion reasons:', error)
    throw error
  }
  
  return data || []
}

// アクションログを記録
export async function logContentAction(actionData: ContentActionData): Promise<ContentActionLog> {
  const supabase = createClient()
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  const logEntry = {
    action_type: actionData.actionType,
    content_type: actionData.contentType,
    content_id: actionData.contentId,
    content_title: actionData.contentTitle || null,
    content_author_id: actionData.contentAuthorId || null,
    performed_by_id: user.id,
    deletion_reason_id: actionData.deletionReasonId || null,
    custom_reason: actionData.customReason || null,
    admin_notes: actionData.adminNotes || null,
    is_notification_sent: false
  }
  
  const { data, error } = await supabase
    .from('content_action_logs')
    .insert([logEntry])
    .select()
    .single()
  
  if (error) {
    console.error('Error logging content action:', error)
    throw error
  }
  
  return data
}

// ユーザーのアクションログを取得
export async function getUserActionLogs(userId?: string): Promise<ContentActionLog[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('content_action_logs')
    .select(`
      *,
      deletion_reasons(name, severity),
      performed_by:profiles!content_action_logs_performed_by_id_fkey(display_name, username)
    `)
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('content_author_id', userId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching user action logs:', error)
    throw error
  }
  
  return data || []
}

// 通知を送信する
export async function sendDeletionNotification(
  recipientId: string,
  actionLog: ContentActionLog,
  contentTitle: string
): Promise<void> {
  const supabase = createClient()
  
  // 削除理由を取得
  let reasonText = '指定されていません'
  if (actionLog.deletion_reason_id) {
    const { data: reason } = await supabase
      .from('deletion_reasons')
      .select('name')
      .eq('id', actionLog.deletion_reason_id)
      .single()
    
    if (reason) {
      reasonText = reason.name
    }
  } else if (actionLog.custom_reason) {
    reasonText = actionLog.custom_reason
  }
  
  // 通知タイトルと内容を生成
  const getNotificationContent = (actionType: string, contentType: string) => {
    const contentTypeNames = {
      'event': '大会情報',
      'board_post': '掲示板投稿',
      'board_reply': '返信',
      'column': 'コラム',
      'column_comment': 'コメント'
    }
    
    const contentTypeName = contentTypeNames[contentType as keyof typeof contentTypeNames] || 'コンテンツ'
    
    switch (actionType) {
      case 'delete':
        return {
          title: `${contentTypeName}が削除されました`,
          message: `あなたの${contentTypeName}「${contentTitle}」が削除されました。理由: ${reasonText}`
        }
      case 'hide':
        return {
          title: `${contentTypeName}が非表示になりました`,
          message: `あなたの${contentTypeName}「${contentTitle}」が非表示にされました。理由: ${reasonText}`
        }
      case 'warn':
        return {
          title: `${contentTypeName}について警告`,
          message: `あなたの${contentTypeName}「${contentTitle}」について警告があります。理由: ${reasonText}`
        }
      case 'restore':
        return {
          title: `${contentTypeName}が復元されました`,
          message: `あなたの${contentTypeName}「${contentTitle}」が復元されました。`
        }
      default:
        return {
          title: `${contentTypeName}についてのお知らせ`,
          message: `あなたの${contentTypeName}「${contentTitle}」についてアクションが実行されました。`
        }
    }
  }
  
  const { title, message } = getNotificationContent(actionLog.action_type, actionLog.content_type)
  
  // 通知を作成
  const notification = {
    user_id: recipientId,
    title: title,
    message: message,
    type: 'moderation',
    is_read: false,
    metadata: {
      action_log_id: actionLog.id,
      content_type: actionLog.content_type,
      content_id: actionLog.content_id,
      action_type: actionLog.action_type
    }
  }
  
  const { error } = await supabase
    .from('notifications')
    .insert([notification])
  
  if (error) {
    console.error('Error creating notification:', error)
    throw error
  }
  
  // 通知送信フラグを更新
  await supabase
    .from('content_action_logs')
    .update({ is_notification_sent: true })
    .eq('id', actionLog.id)
  
  console.log('Deletion notification sent successfully')
}

// 削除理由の重要度に基づくスタイルクラスを取得
export function getSeverityStyle(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// 削除理由の重要度に基づくアイコンを取得
export function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return '🚨'
    case 'high':
      return '⚠️'
    case 'medium':
      return '⚡'
    case 'low':
      return 'ℹ️'
    default:
      return '📝'
  }
}