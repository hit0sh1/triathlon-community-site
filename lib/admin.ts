import { createClient } from '@/lib/supabase/client'

// 管理者権限の判定に使用する管理者のメールアドレス
// 実際の管理者メールアドレスに変更してください
const ADMIN_EMAILS = [
  'admin@example.com',
  'moderator@example.com',
  // 必要に応じて追加してください
  // 'your-email@example.com',
]

// 管理者権限をチェックする関数
export async function checkAdminPermission(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return false
    }

    // ユーザーのメールアドレスが管理者リストに含まれているかチェック
    return ADMIN_EMAILS.includes(user.email || '')
  } catch (error) {
    console.error('Error checking admin permission:', error)
    return false
  }
}

// 現在のユーザーが管理者かチェック
export async function isAdmin(): Promise<boolean> {
  return await checkAdminPermission()
}

// 管理者権限が必要な操作を実行する際のヘルパー関数
export async function requireAdmin(): Promise<boolean> {
  const adminStatus = await isAdmin()
  if (!adminStatus) {
    throw new Error('管理者権限が必要です')
  }
  return true
}

// 管理者または投稿者の権限をチェック
export async function canManageContent(createdBy: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return false
    }

    // 管理者または投稿者本人の場合は権限あり
    const isAdminUser = await isAdmin()
    const isOwner = user.id === createdBy
    
    return isAdminUser || isOwner
  } catch (error) {
    console.error('Error checking content management permission:', error)
    return false
  }
}

// 現在のユーザーのメールアドレスを取得（管理者設定用）
export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user.email || null
  } catch (error) {
    console.error('Error getting current user email:', error)
    return null
  }
}