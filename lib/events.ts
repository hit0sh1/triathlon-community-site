import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

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

// 大会を削除
export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = createClient()
  
  console.log('Attempting to delete event:', eventId)
  
  // 現在のユーザーを取得
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ログインが必要です')
  }
  
  console.log('Current user:', user.id)
  
  // まず大会が存在するか確認
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('id, created_by, name')
    .eq('id', eventId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching event for deletion:', fetchError)
    throw new Error('削除対象の大会が見つかりません')
  }
  
  console.log('Event to delete:', existingEvent)
  
  // 削除権限をチェック
  if (existingEvent.created_by !== user.id) {
    throw new Error('削除権限がありません。自分が投稿した大会のみ削除できます。')
  }
  
  // 削除実行
  const { error, count } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('created_by', existingEvent.created_by) // 追加の安全性チェック
  
  if (error) {
    console.error('Error deleting event:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    
    if (error.code === 'PGRST301') {
      throw new Error('削除権限がありません。自分が投稿した大会のみ削除できます。')
    }
    
    throw error
  }
  
  console.log('Delete operation completed, affected rows:', count)
}

// 大会の種別一覧を取得
export function getEventTypes(): string[] {
  return ['トライアスロン', 'マラソン', 'サイクリング', 'スイム', 'ラン']
}

// 大会のステータス一覧を取得
export function getEventStatuses(): string[] {
  return ['エントリー受付中', 'エントリー終了', 'エントリー開始前']
}