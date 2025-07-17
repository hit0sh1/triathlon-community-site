import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

export type Column = Database['public']['Tables']['columns']['Row']
export type ColumnComment = Database['public']['Tables']['column_comments']['Row']

export interface ColumnWithDetails extends Column {
  column_comments: ColumnComment[]
}

export interface ColumnInsert {
  title: string
  content: string
  excerpt?: string
  image_url?: string
  category?: string
  tags?: string[]
  is_published?: boolean
  is_featured?: boolean
  created_by?: string
}

export interface ColumnUpdate {
  title?: string
  content?: string
  excerpt?: string
  image_url?: string
  category?: string
  tags?: string[]
  is_published?: boolean
  is_featured?: boolean
}

// コラム一覧を取得
export async function getColumns(): Promise<ColumnWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('columns')
    .select(`
      *,
      column_comments(
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching columns:', error)
    throw error
  }
  
  return data || []
}

// 特定のコラムを取得
export async function getColumn(columnId: string): Promise<ColumnWithDetails | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('columns')
    .select(`
      *,
      column_comments(
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('id', columnId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching column:', error)
    throw error
  }
  
  return data
}

// 新しいコラムを作成
export async function createColumn(column: ColumnInsert): Promise<Column> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('columns')
    .insert([column])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating column:', error)
    throw error
  }
  
  return data
}

// コラムを更新
export async function updateColumn(columnId: string, updates: ColumnUpdate): Promise<Column> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('columns')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', columnId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating column:', error)
    throw error
  }
  
  return data
}

// コラムを削除
export async function deleteColumn(columnId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('columns')
    .delete()
    .eq('id', columnId)
  
  if (error) {
    console.error('Error deleting column:', error)
    throw error
  }
}

// 閲覧数を増加
export async function incrementViewCount(columnId: string): Promise<void> {
  const supabase = createClient()
  
  // まず現在のview_countを取得
  const { data: currentColumn, error: fetchError } = await supabase
    .from('columns')
    .select('view_count')
    .eq('id', columnId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching current view count:', fetchError)
    return
  }
  
  // view_countを増加
  const newViewCount = (currentColumn?.view_count || 0) + 1
  
  const { error } = await supabase
    .from('columns')
    .update({ view_count: newViewCount })
    .eq('id', columnId)
  
  if (error) {
    console.error('Error incrementing view count:', error)
  }
}

// コメントを追加
export async function addComment(columnId: string, content: string): Promise<ColumnComment> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }
  
  const { data, error } = await supabase
    .from('column_comments')
    .insert([{
      column_id: columnId,
      user_id: user.id,
      content
    }])
    .select()
    .single()
  
  if (error) {
    console.error('Error adding comment:', error)
    throw error
  }
  
  return data
}

// コメントを削除
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('column_comments')
    .delete()
    .eq('id', commentId)
  
  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

// 注目コラムを取得
export async function getFeaturedColumns(limit: number = 3): Promise<ColumnWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('columns')
    .select(`
      *,
      column_comments(
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching featured columns:', error)
    throw error
  }
  
  return data || []
}

// 人気コラムを取得（閲覧数順）
export async function getPopularColumns(limit: number = 3): Promise<ColumnWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('columns')
    .select(`
      *,
      column_comments(
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('is_published', true)
    .order('view_count', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching popular columns:', error)
    throw error
  }
  
  return data || []
}

// カテゴリ別コラムを取得
export async function getColumnsByCategory(category: string, limit?: number): Promise<ColumnWithDetails[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('columns')
    .select(`
      *,
      column_comments(
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('is_published', true)
    .eq('category', category)
    .order('created_at', { ascending: false })
  
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching columns by category:', error)
    throw error
  }
  
  return data || []
}

// 自分のコラムを取得（下書き含む）
export async function getMyColumns(): Promise<ColumnWithDetails[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('ログインが必要です')
  }
  
  const { data, error } = await supabase
    .from('columns')
    .select(`
      *,
      column_comments(
        id,
        content,
        created_at,
        user_id
      )
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching my columns:', error)
    throw error
  }
  
  return data || []
}

// コラムカテゴリ一覧を取得
export function getColumnCategories(): { id: string; name: string; icon: string }[] {
  return [
    { id: 'training', name: 'トレーニング', icon: '🏃‍♂️' },
    { id: 'nutrition', name: '栄養・食事', icon: '🥗' },
    { id: 'gear', name: 'ギア・装備', icon: '⚙️' },
    { id: 'race', name: 'レース', icon: '🏆' },
    { id: 'beginner', name: '初心者向け', icon: '🌟' },
    { id: 'general', name: '一般', icon: '📝' },
  ]
}