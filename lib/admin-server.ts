import { createClient } from '@/lib/supabase/server'

// サーバーサイド用のadmin権限チェック（API routes用）
export async function checkAdminPermissionServer(): Promise<{ isAdmin: boolean; user: any | null }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { isAdmin: false, user: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return { 
      isAdmin: profile?.role === 'admin', 
      user 
    }
  } catch (error) {
    console.error('Error checking admin permission on server:', error)
    return { isAdmin: false, user: null }
  }
}

// API routes用のadmin権限確認ヘルパー
export async function requireAdminServer() {
  const { isAdmin, user } = await checkAdminPermissionServer()
  
  if (!isAdmin) {
    throw new Error('管理者権限が必要です')
  }
  
  return user
}