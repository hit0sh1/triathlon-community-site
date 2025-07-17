import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Course = Database['public']['Tables']['courses']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface FeaturedCourse extends Course {
  profiles: Profile | null
  comment_count?: number
  rating?: number
}

export async function getFeaturedCourses(limit: number = 3): Promise<FeaturedCourse[]> {
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
      )
    `)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching featured courses:', error)
    throw error
  }
  
  // 各コースのコメント数を取得
  const coursesWithStats = await Promise.all(
    (data || []).map(async (course) => {
      const { count: commentCount } = await supabase
        .from('course_comments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
      
      // 実際の評価値を使用、なければ0
      const rating = course.average_rating || 0
      
      return {
        ...course,
        comment_count: commentCount || 0,
        rating: Math.round(rating * 10) / 10 // 小数点1位まで
      }
    })
  )
  
  return coursesWithStats
}

// is_featuredがfalseまたは存在しない場合の代替案として、
// 最近作成されたコースまたはコメントが多いコースを取得
export async function getRecommendedCourses(limit: number = 3): Promise<FeaturedCourse[]> {
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
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit * 2) // 多めに取得してソート
  
  if (error) {
    console.error('Error fetching recommended courses:', error)
    throw error
  }
  
  // 各コースのコメント数を取得してスコアで並び替え
  const coursesWithStats = await Promise.all(
    (data || []).map(async (course) => {
      const { count: commentCount } = await supabase
        .from('course_comments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id)
      
      // 新しさとコメント数でスコア計算
      const daysAgo = Math.floor((Date.now() - new Date(course.created_at).getTime()) / (1000 * 60 * 60 * 24))
      const recencyScore = Math.max(0, 30 - daysAgo) // 30日以内は高スコア
      const score = recencyScore + (commentCount || 0) * 5
      
      const rating = course.average_rating || 0
      
      return {
        ...course,
        comment_count: commentCount || 0,
        rating: Math.round(rating * 10) / 10,
        score
      }
    })
  )
  
  // スコアの高い順にソートして上位を返す
  return coursesWithStats
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...course }) => course)
}