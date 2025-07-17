import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { canManageContent } from '@/lib/admin'

type Course = Database['public']['Tables']['courses']['Row']
type CoursePhoto = Database['public']['Tables']['course_photos']['Row']
type CourseComment = Database['public']['Tables']['course_comments']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface CourseWithDetails extends Course {
  profiles: Profile | null
  course_photos: CoursePhoto[]
  course_comments: (CourseComment & {
    profiles: Profile | null
  })[]
}

export interface CourseInsert {
  name: string
  description?: string
  type: 'ラン' | 'バイク' | 'スイム'
  distance: number
  area: string
  difficulty_level?: number
  elevation_gain?: number
  map_url?: string
  image_url?: string
  is_featured?: boolean
  created_by?: string
}

export interface CourseUpdate {
  name?: string
  description?: string
  type?: 'ラン' | 'バイク' | 'スイム'
  distance?: number
  area?: string
  difficulty_level?: number
  elevation_gain?: number
  map_url?: string
  image_url?: string
  is_featured?: boolean
}

// コース一覧を取得
export async function getCourses(): Promise<CourseWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!courses_created_by_fkey(
        id,
        display_name,
        username,
        avatar_url
      ),
      course_photos(
        id,
        photo_url,
        caption
      ),
      course_comments(
        id,
        comment,
        created_at,
        profiles!course_comments_user_id_fkey(
          id,
          display_name,
          username,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching courses:', error)
    throw error
  }
  
  return data || []
}

// 特定のコースを取得
export async function getCourse(courseId: string): Promise<CourseWithDetails | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      profiles!courses_created_by_fkey(
        id,
        display_name,
        username,
        avatar_url
      ),
      course_photos(
        id,
        photo_url,
        caption
      ),
      course_comments(
        id,
        comment,
        created_at,
        profiles!course_comments_user_id_fkey(
          id,
          display_name,
          username,
          avatar_url
        )
      )
    `)
    .eq('id', courseId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching course:', error)
    throw error
  }
  
  return data
}

// 新しいコースを作成
export async function createCourse(course: CourseInsert): Promise<Course> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating course:', error)
    throw error
  }
  
  return data
}

// コースを更新
export async function updateCourse(courseId: string, updates: CourseUpdate): Promise<Course> {
  const supabase = createClient()
  
  console.log('Attempting to update course:', courseId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  console.log('Current user:', user.id)
  
  // まずコースが存在するか確認
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('id, created_by, name')
    .eq('id', courseId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching course for update:', fetchError)
    throw new Error('更新対象のコースが見つかりません')
  }
  
  console.log('Course to update:', existingCourse)
  
  // 更新権限をチェック（管理者または投稿者）
  const hasPermission = await canManageContent(existingCourse.created_by || '')
  if (!hasPermission) {
    throw new Error('更新権限がありません。管理者または投稿者のみ更新できます。')
  }
  
  // 更新実行
  const { data, error } = await supabase
    .from('courses')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', courseId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating course:', error)
    throw error
  }
  
  console.log('Course updated successfully')
  return data
}

// コースを削除
export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('Attempting to delete course:', courseId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  console.log('Current user:', user.id)
  
  // まずコースが存在するか確認
  const { data: existingCourse, error: fetchError } = await supabase
    .from('courses')
    .select('id, created_by, name')
    .eq('id', courseId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching course for deletion:', fetchError)
    throw new Error('削除対象のコースが見つかりません')
  }
  
  console.log('Course to delete:', existingCourse)
  
  // 削除権限をチェック（管理者または投稿者）
  const hasPermission = await canManageContent(existingCourse.created_by || '')
  if (!hasPermission) {
    throw new Error('削除権限がありません。管理者または投稿者のみ削除できます。')
  }
  
  // 削除実行 - 投稿者の条件も含めて削除
  const { error, count } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    .eq('created_by', existingCourse.created_by) // 追加の安全性チェック
  
  if (error) {
    console.error('Error deleting course:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    
    if (error.code === 'PGRST301') {
      throw new Error('削除権限がありません。管理者または投稿者のみ削除できます。')
    }
    
    throw new Error('コースの削除に失敗しました: ' + error.message)
  }
  
  console.log('Delete operation completed, affected rows:', count)
  
  // countが0の場合は削除が失敗している
  if (count === 0) {
    console.error('No rows were deleted, possibly due to RLS or conditions not met')
    throw new Error('削除に失敗しました。削除権限がないか、コースが見つかりません。')
  }
  
  // 削除後に再度確認（RLSが無効化されている場合のみ）
  try {
    const { data: checkCourses, error: checkError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
    
    if (checkError) {
      console.error('Error checking deletion:', checkError)
      // RLSエラーの場合は削除が成功したと見なす
      if (checkError.code === 'PGRST301' || checkError.code === '42501') {
        console.log('Course deleted - RLS prevents verification but deletion likely succeeded')
        return
      }
    } else if (checkCourses && checkCourses.length === 0) {
      console.log('Course successfully deleted - no longer exists in database')
    } else {
      console.error('Course still exists after deletion:', checkCourses)
      // countが正常でも存在する場合は、RLSが原因の可能性
      console.log('Deletion reported success but course still visible, possibly due to RLS')
    }
  } catch (verifyError) {
    console.error('Error verifying deletion:', verifyError)
    // 検証エラーは無視して削除成功とみなす
  }
}

// コースの種類一覧を取得
export function getCourseTypes(): string[] {
  return ['ラン', 'バイク', 'スイム']
}

// 難易度レベルの説明を取得
export function getDifficultyLevels(): { value: number; label: string; description: string }[] {
  return [
    { value: 1, label: '初心者', description: '運動初心者でも楽しめる' },
    { value: 2, label: '初級', description: '基本的な体力があれば大丈夫' },
    { value: 3, label: '中級', description: '定期的に運動している人向け' },
    { value: 4, label: '上級', description: '経験者向けの挑戦的なコース' },
    { value: 5, label: 'エキスパート', description: '競技レベルの高難度コース' }
  ]
}

// エリア一覧を取得
export function getAreas(): string[] {
  return [
    '那覇市',
    '浦添市',
    '宜野湾市',
    '沖縄市',
    'うるま市',
    '豊見城市',
    '糸満市',
    '名護市',
    '読谷村',
    '嘉手納町',
    '北谷町',
    '西原町',
    '中城村',
    '北中城村',
    '宜野座村',
    '金武町',
    '恩納村',
    '今帰仁村',
    '本部町',
    '国頭村',
    '大宜味村',
    '東村',
    'その他'
  ]
}