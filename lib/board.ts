import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { logContentAction, sendDeletionNotification, DeleteContentOptions } from '@/lib/content-actions'

type BoardCategory = Database['public']['Tables']['board_categories']['Row']
type BoardPost = Database['public']['Tables']['board_posts']['Row']
type BoardReply = Database['public']['Tables']['board_replies']['Row']

export interface BoardPostWithDetails extends BoardPost {
  board_categories: BoardCategory
  profiles: {
    display_name: string
    username: string
    avatar_url: string | null
  }
  reply_count: number
}

export interface PostInsert {
  title: string
  content: string
  category_id: string
  author_id: string
}

export interface ReplyInsert {
  content: string
  post_id: string
  author_id: string
  parent_reply_id?: string | null
}

// カテゴリー一覧を取得
export async function getBoardCategories(): Promise<BoardCategory[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('board_categories')
    .select('*')
    .order('sort_order')
  
  if (error) {
    console.error('Error fetching board categories:', error)
    throw error
  }
  
  return data || []
}

// 投稿一覧を取得（カテゴリー、作成者、返信数を含む）
export async function getBoardPosts(categoryId?: string): Promise<BoardPostWithDetails[]> {
  const supabase = createClient()
  
  let query = supabase
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching board posts:', error)
    throw error
  }
  
  // 各投稿の返信数を取得（削除されていない返信のみカウント）
  const postsWithReplyCount = await Promise.all(
    (data || []).map(async (post) => {
      const { count } = await supabase
        .from('board_replies')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .is('deleted_at', null)
      
      return {
        ...post,
        reply_count: count || 0
      }
    })
  )
  
  return postsWithReplyCount
}

// 新しい投稿を作成
export async function createBoardPost(post: PostInsert): Promise<BoardPost> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('board_posts')
    .insert([post])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating board post:', error)
    throw error
  }
  
  return data
}

// 投稿の閲覧数を増加
export async function incrementViewCount(postId: string): Promise<void> {
  const supabase = createClient()
  
  // まず現在の閲覧数を取得
  const { data: post, error: fetchError } = await supabase
    .from('board_posts')
    .select('view_count')
    .eq('id', postId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching post view count:', fetchError)
    throw fetchError
  }
  
  // 閲覧数を増加させて更新
  const newViewCount = (post.view_count || 0) + 1
  
  const { error: updateError } = await supabase
    .from('board_posts')
    .update({ view_count: newViewCount })
    .eq('id', postId)
  
  if (updateError) {
    console.error('Error incrementing view count:', updateError)
    throw updateError
  }
}

// 新しい返信を作成
export async function createBoardReply(reply: ReplyInsert): Promise<BoardReply> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('board_replies')
    .insert([reply])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating board reply:', error)
    throw error
  }
  
  return data
}

// ユーザーによる自己削除
export async function deleteBoardPostByUser(postId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('User attempting to delete own post:', postId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // まず投稿が存在し、削除されていないか確認
  const { data: existingPost, error: fetchError } = await supabase
    .from('board_posts')
    .select('id, author_id, title, deleted_at')
    .eq('id', postId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching post for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象の投稿が見つからないか、既に削除されています')
    }
    throw new Error('削除対象の投稿が見つかりません')
  }
  
  // 削除権限をチェック（自分の投稿のみ）
  if (existingPost.author_id !== user.id) {
    throw new Error('削除権限がありません。自分の投稿のみ削除できます。')
  }
  
  // シンプルな論理削除実行
  const { error } = await supabase
    .from('board_posts')
    .update({ 
      deleted_at: new Date().toISOString(),
      deleted_by_id: user.id,
      deletion_reason_id: await getSelfDeleteReasonId()
    })
    .eq('id', postId)
    .eq('author_id', existingPost.author_id)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error soft deleting board post:', error)
    throw error
  }
  
  // 簡単なログ記録（通知なし）
  try {
    await logContentAction({
      actionType: 'delete',
      contentType: 'board_post',
      contentId: postId,
      contentTitle: existingPost.title,
      contentAuthorId: existingPost.author_id,
      deletionReasonId: await getSelfDeleteReasonId()
    })
  } catch (logError) {
    console.error('Error logging user deletion:', logError)
  }
  
  console.log('User self-deletion completed successfully')
}

// 管理者による削除（削除理由・通知付き）
export async function deleteBoardPostByAdmin(postId: string, options: DeleteContentOptions): Promise<void> {
  const supabase = createClient()
  
  console.log('Admin attempting to delete post:', postId)
  
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
  
  // まず投稿が存在し、削除されていないか確認
  const { data: existingPost, error: fetchError } = await supabase
    .from('board_posts')
    .select('id, author_id, title, deleted_at')
    .eq('id', postId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching post for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象の投稿が見つからないか、既に削除されています')
    }
    throw new Error('削除対象の投稿が見つかりません')
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
    .from('board_posts')
    .update(updateData)
    .eq('id', postId)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error admin deleting board post:', error)
    throw error
  }
  
  // 詳細なアクションログを記録
  const actionLog = await logContentAction({
    actionType: 'delete',
    contentType: 'board_post',
    contentId: postId,
    contentTitle: existingPost.title,
    contentAuthorId: existingPost.author_id,
    deletionReasonId: options.reasonId,
    customReason: options.customReason,
    adminNotes: options.adminNotes
  })
  
  // ユーザーに通知を送信
  await sendDeletionNotification(
    existingPost.author_id,
    actionLog,
    existingPost.title
  )
  
  console.log('Admin deletion completed successfully')
}

// ユーザーによる返信の自己削除
export async function deleteBoardReplyByUser(replyId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('User attempting to delete own reply:', replyId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // まず返信が存在し、削除されていないか確認
  const { data: existingReply, error: fetchError } = await supabase
    .from('board_replies')
    .select('id, author_id, content, deleted_at')
    .eq('id', replyId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching reply for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象の返信が見つからないか、既に削除されています')
    }
    throw new Error('削除対象の返信が見つかりません')
  }
  
  // 削除権限をチェック（自分の返信のみ）
  if (existingReply.author_id !== user.id) {
    throw new Error('削除権限がありません。自分の返信のみ削除できます。')
  }
  
  // シンプルな論理削除実行
  const { error } = await supabase
    .from('board_replies')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_id: user.id,
      deletion_reason_id: await getSelfDeleteReasonId()
    })
    .eq('id', replyId)
    .eq('author_id', existingReply.author_id)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error soft deleting board reply:', error)
    throw error
  }
  
  // 簡単なログ記録（通知なし）
  try {
    await logContentAction({
      actionType: 'delete',
      contentType: 'board_reply',
      contentId: replyId,
      contentTitle: existingReply.content?.substring(0, 50) + '...',
      contentAuthorId: existingReply.author_id,
      deletionReasonId: await getSelfDeleteReasonId()
    })
  } catch (logError) {
    console.error('Error logging user deletion:', logError)
  }
  
  console.log('User self-deletion completed successfully')
}

// 管理者による返信削除（削除理由・通知付き）
export async function deleteBoardReplyByAdmin(replyId: string, options: DeleteContentOptions): Promise<void> {
  const supabase = createClient()
  
  console.log('Admin attempting to delete reply:', replyId)
  
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
  
  // まず返信が存在し、削除されていないか確認
  const { data: existingReply, error: fetchError } = await supabase
    .from('board_replies')
    .select('id, author_id, content, deleted_at')
    .eq('id', replyId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching reply for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象の返信が見つからないか、既に削除されています')
    }
    throw new Error('削除対象の返信が見つかりません')
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
    .from('board_replies')
    .update(updateData)
    .eq('id', replyId)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error admin deleting board reply:', error)
    throw error
  }
  
  // 詳細なアクションログを記録
  const actionLog = await logContentAction({
    actionType: 'delete',
    contentType: 'board_reply',
    contentId: replyId,
    contentTitle: existingReply.content?.substring(0, 50) + '...',
    contentAuthorId: existingReply.author_id,
    deletionReasonId: options.reasonId,
    customReason: options.customReason,
    adminNotes: options.adminNotes
  })
  
  // ユーザーに通知を送信
  await sendDeletionNotification(
    existingReply.author_id,
    actionLog,
    existingReply.content?.substring(0, 50) + '...' || '返信'
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

// 返信にいいねを追加
export async function likeBoardReply(replyId: string, userId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('Attempting to like reply:', { replyId, userId })
  
  const { error } = await supabase
    .from('board_reply_likes')
    .insert([{ reply_id: replyId, user_id: userId }])
  
  if (error) {
    console.error('Error liking board reply:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    
    if (error.code === '23505') { // Unique constraint violation
      // すでにいいね済み
      return
    }
    
    // テーブルが存在しない場合のエラー
    if (error.code === '42P01') {
      throw new Error('いいね機能を利用するためのテーブルが存在しません。管理者にお問い合わせください。')
    }
    
    throw error
  }
  
  // いいね数を更新
  await updateReplyLikeCount(replyId)
}

// 返信のいいねを削除
export async function unlikeBoardReply(replyId: string, userId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('board_reply_likes')
    .delete()
    .eq('reply_id', replyId)
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error unliking board reply:', error)
    throw error
  }
  
  // いいね数を更新
  await updateReplyLikeCount(replyId)
}

// 返信のいいね数を更新
async function updateReplyLikeCount(replyId: string): Promise<void> {
  const supabase = createClient()
  
  // いいね数を取得
  const { count, error: countError } = await supabase
    .from('board_reply_likes')
    .select('*', { count: 'exact', head: true })
    .eq('reply_id', replyId)
  
  if (countError) {
    console.error('Error counting likes:', countError)
    throw countError
  }
  
  // 返信のいいね数を更新
  const { error: updateError } = await supabase
    .from('board_replies')
    .update({ like_count: count || 0 })
    .eq('id', replyId)
  
  if (updateError) {
    console.error('Error updating like count:', updateError)
    throw updateError
  }
}

// ユーザーが返信にいいねしているかチェック
export async function checkUserLikedReply(replyId: string, userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('board_reply_likes')
    .select('id')
    .eq('reply_id', replyId)
    .eq('user_id', userId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない = いいねしていない
      return false
    }
    if (error.code === '42P01') {
      // テーブルが存在しない
      console.warn('board_reply_likes table does not exist')
      return false
    }
    console.error('Error checking user liked reply:', error)
    return false
  }
  
  return !!data
}

// いいねテーブルが存在するかチェック
export async function checkLikeTableExists(): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('board_reply_likes')
      .select('id')
      .limit(1)
    
    return !error || error.code !== '42P01'
  } catch (err) {
    return false
  }
}