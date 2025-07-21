import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type BoardPost = Database['public']['Tables']['board_posts']['Row']
type BoardCategory = Database['public']['Tables']['board_categories']['Row']

export interface PopularPost extends BoardPost {
  board_categories: BoardCategory
  profiles: {
    display_name: string
    username: string
    avatar_url: string | null
  }
  reply_count: number
}

export async function getPopularPosts(limit: number = 3): Promise<PopularPost[]> {
  try {
    const supabase = await createClient()
    
    // 過去7日間の投稿から、返信数といいね数の合計が多い順に取得
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data, error } = await supabase
      .from('board_posts')
      .select(`
        *,
        board_categories!board_posts_category_id_fkey(
          id,
          name,
          description,
          color
        ),
        profiles!board_posts_author_id_fkey(
          display_name,
          username,
          avatar_url
        )
      `)
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // 多めに取得して後でソート
    
    if (error) {
      console.error('Error fetching popular posts:', error)
      return [] // エラーの場合は空配列を返す
    }
    
    if (!data || data.length === 0) {
      console.log('No popular posts found')
      return []
    }
  
    // 各投稿の返信数を取得してスコアでソート
    const postsWithStats = await Promise.all(
      (data || []).map(async (post) => {
        const { count: replyCount } = await supabase
          .from('board_replies')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .is('deleted_at', null)
        
        // 返信のいいね数も取得（board_reply_likesテーブルが存在する場合）
        let totalLikes = 0
        try {
          const { data: replies } = await supabase
            .from('board_replies')
            .select('like_count')
            .eq('post_id', post.id)
            .is('deleted_at', null)
          
          if (replies) {
            totalLikes = replies.reduce((sum, reply) => sum + (reply.like_count || 0), 0)
          }
        } catch (err) {
          // テーブルが存在しない場合は無視
        }
        
        return {
          ...post,
          reply_count: replyCount || 0,
          score: (replyCount || 0) * 2 + totalLikes + (post.view_count || 0) * 0.1
        }
      })
    )
    
    // スコアの高い順にソートして上位を返す
    return postsWithStats
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...post }) => post)
      
  } catch (error) {
    console.error('Caught error in getPopularPosts:', error)
    return [] // エラーの場合は空配列を返す
  }
}