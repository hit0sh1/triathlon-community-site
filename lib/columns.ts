import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { logContentAction, sendDeletionNotification, DeleteContentOptions } from '@/lib/content-actions'

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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching columns:', error)
    throw error
  }
  
  // 削除されていないコメントのみフィルタリング
  const filteredData = (data || []).map(column => ({
    ...column,
    column_comments: column.column_comments?.filter((comment: any) => !comment.deleted_at) || []
  }))
  
  return filteredData
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
    .is('deleted_at', null)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching column:', error)
    throw error
  }
  
  // 削除されていないコメントのみフィルタリング
  const filteredData = {
    ...data,
    column_comments: data?.column_comments?.filter((comment: any) => !comment.deleted_at) || []
  }
  
  return filteredData
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

// ユーザーによるコラム自己削除
export async function deleteColumnByUser(columnId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('User attempting to delete own column:', columnId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // まずコラムが存在し、削除されていないか確認
  const { data: existingColumn, error: fetchError } = await supabase
    .from('columns')
    .select('id, created_by, title, deleted_at')
    .eq('id', columnId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching column for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象のコラムが見つからないか、既に削除されています')
    }
    throw new Error('削除対象のコラムが見つかりません')
  }
  
  // 削除権限をチェック（自分のコラムのみ）
  if (existingColumn.created_by !== user.id) {
    throw new Error('削除権限がありません。自分のコラムのみ削除できます。')
  }
  
  // シンプルな論理削除実行
  const { error } = await supabase
    .from('columns')
    .update({ 
      deleted_at: new Date().toISOString(),
      deleted_by_id: user.id,
      deletion_reason_id: await getSelfDeleteReasonId()
    })
    .eq('id', columnId)
    .eq('created_by', existingColumn.created_by)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error soft deleting column:', error)
    throw error
  }
  
  // 簡単なログ記録（通知なし）
  try {
    await logContentAction({
      actionType: 'delete',
      contentType: 'column',
      contentId: columnId,
      contentTitle: existingColumn.title,
      contentAuthorId: existingColumn.created_by,
      deletionReasonId: await getSelfDeleteReasonId()
    })
  } catch (logError) {
    console.error('Error logging user deletion:', logError)
  }
  
  console.log('User self-deletion completed successfully')
}

// 管理者によるコラム削除（削除理由・通知付き）
export async function deleteColumnByAdmin(columnId: string, options: DeleteContentOptions): Promise<void> {
  const supabase = createClient()
  
  console.log('Admin attempting to delete column:', columnId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // 管理者権限をチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error('管理者権限が必要です')
  }
  
  // まずコラムが存在し、削除されていないか確認
  const { data: existingColumn, error: fetchError } = await supabase
    .from('columns')
    .select('id, created_by, title, deleted_at')
    .eq('id', columnId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching column for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象のコラムが見つからないか、既に削除されています')
    }
    throw new Error('削除対象のコラムが見つかりません')
  }
  
  // 管理者による論理削除実行（削除理由付き）
  const updateData: any = {
    deleted_at: new Date().toISOString(),
    deleted_by_id: user.id
  }
  
  if (options.reasonId) {
    updateData.deletion_reason_id = options.reasonId
  }
  if (options.customReason) {
    updateData.deletion_custom_reason = options.customReason
  }
  
  const { error } = await supabase
    .from('columns')
    .update(updateData)
    .eq('id', columnId)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error admin deleting column:', error)
    throw error
  }
  
  // 詳細なアクションログを記録
  const actionLog = await logContentAction({
    actionType: 'delete',
    contentType: 'column',
    contentId: columnId,
    contentTitle: existingColumn.title,
    contentAuthorId: existingColumn.created_by,
    deletionReasonId: options.reasonId,
    customReason: options.customReason,
    adminNotes: options.adminNotes
  })
  
  // ユーザーに通知を送信
  await sendDeletionNotification(
    existingColumn.created_by,
    actionLog,
    existingColumn.title
  )
  
  console.log('Admin deletion completed successfully')
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

// ユーザーによるコメント自己削除
export async function deleteCommentByUser(commentId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('User attempting to delete own comment:', commentId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // まずコメントが存在し、削除されていないか確認
  const { data: existingComment, error: fetchError } = await supabase
    .from('column_comments')
    .select('id, user_id, content, deleted_at')
    .eq('id', commentId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching comment for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象のコメントが見つからないか、既に削除されています')
    }
    throw new Error('削除対象のコメントが見つかりません')
  }
  
  // 削除権限をチェック（自分のコメントのみ）
  if (existingComment.user_id !== user.id) {
    throw new Error('削除権限がありません。自分のコメントのみ削除できます。')
  }
  
  // シンプルな論理削除実行
  const { error } = await supabase
    .from('column_comments')
    .update({ 
      deleted_at: new Date().toISOString(),
      deleted_by_id: user.id,
      deletion_reason_id: await getSelfDeleteReasonId()
    })
    .eq('id', commentId)
    .eq('user_id', existingComment.user_id)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error soft deleting comment:', error)
    throw error
  }
  
  // 簡単なログ記録（通知なし）
  try {
    await logContentAction({
      actionType: 'delete',
      contentType: 'column_comment',
      contentId: commentId,
      contentTitle: existingComment.content?.substring(0, 50) + '...',
      contentAuthorId: existingComment.user_id,
      deletionReasonId: await getSelfDeleteReasonId()
    })
  } catch (logError) {
    console.error('Error logging user deletion:', logError)
  }
  
  console.log('User self-deletion completed successfully')
}

// 管理者によるコメント削除（削除理由・通知付き）
export async function deleteCommentByAdmin(commentId: string, options: DeleteContentOptions): Promise<void> {
  const supabase = createClient()
  
  console.log('Admin attempting to delete comment:', commentId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // 管理者権限をチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    throw new Error('管理者権限が必要です')
  }
  
  // まずコメントが存在し、削除されていないか確認
  const { data: existingComment, error: fetchError } = await supabase
    .from('column_comments')
    .select('id, user_id, content, deleted_at')
    .eq('id', commentId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching comment for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象のコメントが見つからないか、既に削除されています')
    }
    throw new Error('削除対象のコメントが見つかりません')
  }
  
  // 管理者による論理削除実行（削除理由付き）
  const updateData: any = {
    deleted_at: new Date().toISOString(),
    deleted_by_id: user.id
  }
  
  if (options.reasonId) {
    updateData.deletion_reason_id = options.reasonId
  }
  if (options.customReason) {
    updateData.deletion_custom_reason = options.customReason
  }
  
  const { error } = await supabase
    .from('column_comments')
    .update(updateData)
    .eq('id', commentId)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error admin deleting comment:', error)
    throw error
  }
  
  // 詳細なアクションログを記録
  const actionLog = await logContentAction({
    actionType: 'delete',
    contentType: 'column_comment',
    contentId: commentId,
    contentTitle: existingComment.content?.substring(0, 50) + '...',
    contentAuthorId: existingComment.user_id,
    deletionReasonId: options.reasonId,
    customReason: options.customReason,
    adminNotes: options.adminNotes
  })
  
  // ユーザーに通知を送信
  await sendDeletionNotification(
    existingComment.user_id,
    actionLog,
    existingComment.content?.substring(0, 50) + '...' || 'コメント'
  )
  
  console.log('Admin deletion completed successfully')
}

// 自己削除用の理由IDを取得
async function getSelfDeleteReasonId(): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase
    .from('deletion_reasons')
    .select('id')
    .eq('name', '自己削除')
    .single()
  
  return data?.id || ''
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching featured columns:', error)
    throw error
  }
  
  // 削除されていないコメントのみフィルタリング
  const filteredData = (data || []).map(column => ({
    ...column,
    column_comments: column.column_comments?.filter((comment: any) => !comment.deleted_at) || []
  }))
  
  return filteredData
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
    .is('deleted_at', null)
    .order('view_count', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching popular columns:', error)
    throw error
  }
  
  // 削除されていないコメントのみフィルタリング
  const filteredData = (data || []).map(column => ({
    ...column,
    column_comments: column.column_comments?.filter((comment: any) => !comment.deleted_at) || []
  }))
  
  return filteredData
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching columns by category:', error)
    throw error
  }
  
  // 削除されていないコメントのみフィルタリング
  const filteredData = (data || []).map(column => ({
    ...column,
    column_comments: column.column_comments?.filter((comment: any) => !comment.deleted_at) || []
  }))
  
  return filteredData
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching my columns:', error)
    throw error
  }
  
  // 削除されていないコメントのみフィルタリング
  const filteredData = (data || []).map(column => ({
    ...column,
    column_comments: column.column_comments?.filter((comment: any) => !comment.deleted_at) || []
  }))
  
  return filteredData
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