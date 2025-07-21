import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  role: 'user' | 'admin';
}

// 管理者権限をチェックする関数（profilesテーブルのroleフィールドを使用）
export async function checkAdminPermission(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return false
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role === 'admin'
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

// 現在のユーザーのロールを取得
export async function getCurrentUserRole(): Promise<'user' | 'admin' | null> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role || null
  } catch (error) {
    console.error('Error getting current user role:', error)
    return null
  }
}

// 特定のユーザーが管理者かチェック
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    return profile?.role === 'admin'
  } catch (error) {
    console.error('Error checking user admin status:', error)
    return false
  }
}

// 管理者権限を付与（管理者のみが実行可能）
export async function grantAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // 現在のユーザーが管理者かチェック
    const currentUserIsAdmin = await isAdmin()
    if (!currentUserIsAdmin) {
      throw new Error('管理者権限が必要です')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error granting admin role:', error)
    return false
  }
}

// 管理者権限を削除（管理者のみが実行可能）
export async function revokeAdminRole(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // 現在のユーザーが管理者かチェック
    const currentUserIsAdmin = await isAdmin()
    if (!currentUserIsAdmin) {
      throw new Error('管理者権限が必要です')
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error revoking admin role:', error)
    return false
  }
}