import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { logContentAction, sendDeletionNotification, DeleteContentOptions } from '@/lib/content-actions'

type Event = Database['public']['Tables']['events']['Row']
type EventDistance = Database['public']['Tables']['event_distances']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface EventWithDetails extends Event {
  profiles: Profile | null
  event_distances: EventDistance[]
}

export interface EventInsert {
  name: string
  event_type: string
  event_date: string
  location: string
  description?: string
  entry_status?: string
  max_participants?: number
  current_participants?: number
  entry_fee?: string
  entry_deadline?: string
  entry_url?: string
  image_url?: string
  website_url?: string
  created_by?: string
}

export interface EventDistanceInsert {
  event_id: string
  discipline: 'swim' | 'bike' | 'run'
  distance: string
}

// 大会一覧を取得
export async function getEvents(): Promise<EventWithDetails[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles!events_created_by_fkey(
        display_name,
        username
      ),
      event_distances(
        discipline,
        distance
      )
    `)
    .is('deleted_at', null)
    .order('event_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching events:', error)
    throw error
  }
  
  return data || []
}

// 特定の大会を取得
export async function getEvent(eventId: string): Promise<EventWithDetails | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      profiles!events_created_by_fkey(
        display_name,
        username
      ),
      event_distances(
        discipline,
        distance
      )
    `)
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching event:', error)
    throw error
  }
  
  return data
}

// 新しい大会を作成
export async function createEvent(event: EventInsert): Promise<Event> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating event:', error)
    throw error
  }
  
  return data
}

// 大会の距離情報を作成
export async function createEventDistance(distance: EventDistanceInsert): Promise<EventDistance> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('event_distances')
    .insert([distance])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating event distance:', error)
    throw error
  }
  
  return data
}

// ユーザーによる自己削除（シンプルな論理削除）
export async function deleteEventByUser(eventId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('User attempting to delete own event:', eventId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // まず大会が存在し、削除されていないか確認
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('id, created_by, name, deleted_at')
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching event for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象の大会が見つからないか、既に削除されています')
    }
    throw new Error('削除対象の大会が見つかりません')
  }
  
  // 削除権限をチェック（自分の投稿のみ）
  if (existingEvent.created_by !== user.id) {
    throw new Error('削除権限がありません。自分が投稿した大会のみ削除できます。')
  }
  
  // シンプルな論理削除実行
  const { error } = await supabase
    .from('events')
    .update({ 
      deleted_at: new Date().toISOString(),
      deleted_by_id: user.id,
      deletion_reason_id: await getSelfDeleteReasonId() // 自己削除理由ID
    })
    .eq('id', eventId)
    .eq('created_by', existingEvent.created_by)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error soft deleting event:', error)
    throw error
  }
  
  // 簡単なログ記録（通知なし）
  try {
    await logContentAction({
      actionType: 'delete',
      contentType: 'event',
      contentId: eventId,
      contentTitle: existingEvent.name,
      contentAuthorId: existingEvent.created_by,
      deletionReasonId: await getSelfDeleteReasonId()
    })
  } catch (logError) {
    console.error('Error logging user deletion:', logError)
  }
  
  console.log('User self-deletion completed successfully')
}

// 管理者による削除（削除理由・通知付き）
export async function deleteEventByAdmin(eventId: string, options: DeleteContentOptions): Promise<void> {
  const supabase = createClient()
  
  console.log('Admin attempting to delete event:', eventId)
  
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
  
  // まず大会が存在し、削除されていないか確認
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('id, created_by, name, deleted_at')
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching event for deletion:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('削除対象の大会が見つからないか、既に削除されています')
    }
    throw new Error('削除対象の大会が見つかりません')
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
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .is('deleted_at', null)
  
  if (error) {
    console.error('Error admin deleting event:', error)
    throw error
  }
  
  // 詳細なアクションログを記録
  const actionLog = await logContentAction({
    actionType: 'delete',
    contentType: 'event',
    contentId: eventId,
    contentTitle: existingEvent.name,
    contentAuthorId: existingEvent.created_by,
    deletionReasonId: options.reasonId,
    customReason: options.customReason,
    adminNotes: options.adminNotes
  })
  
  // ユーザーに通知を送信
  await sendDeletionNotification(
    existingEvent.created_by,
    actionLog,
    existingEvent.name
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

// 大会を復元（admin用）
export async function restoreEvent(eventId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('Attempting to restore event:', eventId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  // 削除された大会が存在するか確認
  const { data: deletedEvent, error: fetchError } = await supabase
    .from('events')
    .select('id, created_by, name, deleted_at')
    .eq('id', eventId)
    .not('deleted_at', 'is', null)
    .single()
  
  if (fetchError) {
    console.error('Error fetching deleted event for restoration:', fetchError)
    if (fetchError.code === 'PGRST116') {
      throw new Error('復元対象の大会が見つからないか、削除されていません')
    }
    throw new Error('復元対象の大会が見つかりません')
  }
  
  console.log('Event to restore:', deletedEvent)
  
  // 復元実行
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: null })
    .eq('id', eventId)
    .not('deleted_at', 'is', null) // 削除されていることを確認
  
  if (error) {
    console.error('Error restoring event:', error)
    throw error
  }
  
  console.log('Event restoration completed successfully')
}

// 大会を更新
export async function updateEvent(eventId: string, eventData: Partial<EventInsert>): Promise<Event> {
  const supabase = createClient()
  
  // 現在のユーザーを取得
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('認証が必要です')
  }
  
  // 既存の大会を取得して権限をチェック
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching event for update:', fetchError)
    throw new Error('更新対象の大会が見つかりません')
  }
  
  // 権限チェック（投稿者本人またはadmin）
  // admin権限は呼び出し元でチェック済みとする
  if (existingEvent.created_by !== user.id) {
    // admin権限のチェックは呼び出し元で既に完了しているものとする
    console.log('User is not the creator, assuming admin permission has been verified')
  }
  
  // 更新実行
  const { data, error } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', eventId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating event:', error)
    throw error
  }
  
  return data
}

// 大会の種別一覧を取得
export function getEventTypes(): string[] {
  return ['トライアスロン', 'マラソン', 'サイクリング', 'スイム', 'ラン']
}

// 大会のステータス一覧を取得
export function getEventStatuses(): string[] {
  return ['エントリー受付中', 'エントリー終了', 'エントリー開始前']
}