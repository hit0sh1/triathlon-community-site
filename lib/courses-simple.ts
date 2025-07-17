import { createClient } from '@/lib/supabase/client'

// シンプルなコース削除機能（テスト用）
export async function deleteCourseDirect(courseId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('Attempting direct delete of course:', courseId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  console.log('Current user:', user.id)
  
  // 直接削除を試行（RLSが無効化されていることを前提）
  const { error, count } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
  
  console.log('Delete result:', { error, count })
  
  if (error) {
    console.error('Error deleting course:', error)
    throw new Error('コースの削除に失敗しました: ' + error.message)
  }
  
  if (count === 0) {
    throw new Error('削除対象のコースが見つかりませんでした')
  }
  
  console.log('Course deleted successfully, affected rows:', count)
}

// さらにシンプルなテスト関数
export async function testDeleteCourse(courseId: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    console.log('Testing delete for course:', courseId)
    
    // まずコースが存在するかチェック
    const { data: existing, error: checkError } = await supabase
      .from('courses')
      .select('id, name, created_by')
      .eq('id', courseId)
      .single()
    
    if (checkError) {
      console.error('Error checking course existence:', checkError)
      return false
    }
    
    console.log('Course exists:', existing)
    
    // 削除を試行
    const { error: deleteError, count } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    console.log('Delete attempt result:', { deleteError, count })
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return false
    }
    
    return count > 0
  } catch (error) {
    console.error('Test delete error:', error)
    return false
  }
}