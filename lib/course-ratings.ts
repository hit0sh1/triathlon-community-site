import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

// 型定義（データベース型が更新されるまでの一時的な定義）
export interface CourseRating {
  id: string
  course_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  profiles?: {
    display_name: string
    username: string
    avatar_url: string | null
  }
}

export interface CourseRatingInsert {
  course_id: string
  user_id: string
  rating: number
  comment?: string
}

export interface CourseRatingUpdate {
  rating?: number
  comment?: string
}

// コースの評価一覧を取得
export async function getCourseRatings(courseId: string): Promise<CourseRating[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('course_ratings')
    .select(`
      *,
      profiles!course_ratings_user_id_fkey(
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching course ratings:', error)
    throw error
  }
  
  return data || []
}

// ユーザーの特定コースへの評価を取得
export async function getUserCourseRating(courseId: string, userId: string): Promise<CourseRating | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('course_ratings')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない場合
      return null
    }
    console.error('Error fetching user course rating:', error)
    throw error
  }
  
  return data
}

// コース評価を作成
export async function createCourseRating(rating: CourseRatingInsert): Promise<CourseRating> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('course_ratings')
    .insert([rating])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating course rating:', error)
    throw error
  }
  
  return data
}

// コース評価を更新
export async function updateCourseRating(
  courseId: string, 
  userId: string, 
  updates: CourseRatingUpdate
): Promise<CourseRating> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('course_ratings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating course rating:', error)
    throw error
  }
  
  return data
}

// コース評価を削除
export async function deleteCourseRating(courseId: string, userId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('course_ratings')
    .delete()
    .eq('course_id', courseId)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error deleting course rating:', error)
    throw error
  }
}

// コース評価を作成または更新（upsert）
export async function upsertCourseRating(rating: CourseRatingInsert): Promise<CourseRating> {
  const supabase = createClient()
  
  // 既存の評価をチェック
  const existingRating = await getUserCourseRating(rating.course_id, rating.user_id)
  
  if (existingRating) {
    // 更新
    return await updateCourseRating(rating.course_id, rating.user_id, {
      rating: rating.rating,
      comment: rating.comment
    })
  } else {
    // 新規作成
    return await createCourseRating(rating)
  }
}

// コースの評価統計を取得
export async function getCourseRatingStats(courseId: string): Promise<{
  averageRating: number
  ratingCount: number
  ratingDistribution: { [key: number]: number }
}> {
  const supabase = createClient()
  
  // 評価一覧を取得
  const { data: ratings, error } = await supabase
    .from('course_ratings')
    .select('rating')
    .eq('course_id', courseId)
  
  if (error) {
    console.error('Error fetching course rating stats:', error)
    throw error
  }
  
  if (!ratings || ratings.length === 0) {
    return {
      averageRating: 0,
      ratingCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }
  
  // 統計を計算
  const ratingValues = ratings.map(r => r.rating)
  const averageRating = ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
  
  // 評価分布を計算
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratingValues.forEach(rating => {
    ratingDistribution[rating as keyof typeof ratingDistribution]++
  })
  
  return {
    averageRating: Math.round(averageRating * 10) / 10, // 小数点1位まで
    ratingCount: ratings.length,
    ratingDistribution
  }
}