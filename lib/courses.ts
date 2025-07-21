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
  
  let query = supabase
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

  // deleted_atカラムが存在する場合のみフィルタリング
  try {
    query = query.is('deleted_at', null)
  } catch (error) {
    console.log('deleted_at column not found, skipping filter')
  }

  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching courses:', error)
    throw error
  }
  
  return data || []
}

// 特定のコースを取得
export async function getCourse(courseId: string): Promise<CourseWithDetails | null> {
  const supabase = createClient()
  
  let query = supabase
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

  // deleted_atカラムが存在する場合のみフィルタリング
  try {
    query = query.is('deleted_at', null)
  } catch (error) {
    console.log('deleted_at column not found, skipping filter')
  }

  const { data, error } = await query.single()
  
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

// ユーザーが自分のコースを削除
export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('User attempting to delete own course:', courseId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // ユーザー削除: 論理削除のみ（自分の投稿のみ削除可能）
  const { error, count } = await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', courseId)
    .eq('created_by', user.id) // 自分の投稿のみ削除可能
  
  if (error) {
    console.error('Error deleting course:', error)
    throw new Error('コースの削除に失敗しました: ' + error.message)
  }
  
  if (count === 0) {
    throw new Error('削除権限がないか、コースが見つかりません。')
  }
  
  console.log('Course successfully deleted by user')
}

// 管理者がコースを削除
export async function deleteCourseByAdmin(courseId: string, deletionReason: string): Promise<void> {
  const supabase = createClient()
  
  console.log('Admin attempting to delete course:', courseId)
  
  // 現在のユーザー（管理者）を取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // 管理者権限をチェック
  const hasAdminPermission = await canManageContent('')
  if (!hasAdminPermission) {
    throw new Error('管理者権限が必要です')
  }
  
  if (!deletionReason) {
    throw new Error('管理者削除には削除理由が必要です')
  }
  
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
  
  // 管理者削除: 論理削除 + 削除理由記録
  const { error, count } = await supabase
    .from('courses')
    .update({ 
      deleted_at: new Date().toISOString(),
      deletion_reason: deletionReason,
      deleted_by: user.id
    })
    .eq('id', courseId)
  
  if (error) {
    console.error('Error deleting course:', error)
    throw new Error('コースの削除に失敗しました: ' + error.message)
  }
  
  if (count === 0) {
    throw new Error('削除に失敗しました。')
  }

  // 投稿者が削除者と異なる場合のみ通知を送信
  if (existingCourse.created_by !== user.id) {
    try {
      const { notifyAdminDeletion } = await import('./notifications')
      
      // 管理者情報を取得
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      await notifyAdminDeletion(
        existingCourse.created_by,
        'course',
        existingCourse.name,
        adminProfile?.display_name || '管理者',
        deletionReason
      )
    } catch (notificationError) {
      console.error('Error sending deletion notification:', notificationError)
      // 通知エラーは削除処理を失敗させない
    }
  }
  
  console.log('Course successfully deleted by admin with notification sent')
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