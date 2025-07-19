import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // 公開通知を取得
    const { data: publicAnnouncements, error: publicError } = await supabase
      .from('public_announcements')
      .select('id, title, message, type, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (publicError) {
      console.error('Error fetching public announcements:', publicError)
    }

    let userNotifications: any[] = []
    
    // ユーザーがログインしている場合は個人通知も取得
    if (user) {
      const { data: notifications, error: userError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (userError) {
        console.error('Error fetching user notifications:', userError)
      } else {
        userNotifications = notifications || []
      }
    }

    // 公開通知と個人通知をマージ
    const allNotifications = [
      ...(publicAnnouncements || []).map(n => ({ ...n, is_read: false })),
      ...userNotifications
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // リミットを適用
    const limitedNotifications = limit 
      ? allNotifications.slice(0, parseInt(limit))
      : allNotifications

    return NextResponse.json({ notifications: limitedNotifications })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}