import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    // 管理者権限チェック
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const body = await request.json()
    const { events, options = {} } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'インポートする大会データが必要です' }, { status: 400 })
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      imported_events: [] as any[]
    }

    for (const eventData of events) {
      try {
        // 必須フィールドのバリデーション
        if (!eventData.name || !eventData.location) {
          results.errors.push(`大会名または場所が不足しています: ${eventData.name || '名称未設定'}`)
          results.skipped++
          continue
        }

        // 重複チェック（名前と日付で判定）
        const { data: existingEvent, error: checkError } = await supabase
          .from('events')
          .select('id, name')
          .eq('name', eventData.name)
          .eq('event_date', eventData.event_date)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          results.errors.push(`重複チェックエラー: ${checkError.message}`)
          results.skipped++
          continue
        }

        if (existingEvent && !options.allow_duplicates) {
          results.errors.push(`重複する大会: ${eventData.name}`)
          results.skipped++
          continue
        }

        // 日付の正規化
        let normalizedDate = null
        if (eventData.event_date) {
          try {
            normalizedDate = new Date(eventData.event_date).toISOString().split('T')[0]
          } catch (dateError) {
            console.warn('日付の正規化に失敗:', eventData.event_date)
          }
        }

        // 大会データの挿入
        const insertData = {
          name: eventData.name,
          event_type: eventData.event_type || 'トライアスロン',
          event_date: normalizedDate,
          location: eventData.location,
          description: eventData.description || '',
          entry_status: eventData.entry_status || 'エントリー開始前',
          max_participants: eventData.max_participants || null,
          current_participants: eventData.current_participants || 0,
          entry_fee: eventData.entry_fee || null,
          entry_deadline: eventData.entry_deadline || null,
          entry_url: eventData.entry_url || null,
          image_url: eventData.image_url || null,
          website_url: eventData.website_url || null,
          created_by: user.id,
          source_type: 'scraped', // スクレイピングで取得したことを記録
          source_url: eventData.website_url || null
        }

        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert(insertData)
          .select()
          .single()

        if (insertError) {
          results.errors.push(`挿入エラー: ${insertError.message}`)
          results.skipped++
          continue
        }

        // 距離情報がある場合は追加
        if (eventData.distances && Array.isArray(eventData.distances)) {
          const distanceInserts = eventData.distances.map((dist: any) => ({
            event_id: newEvent.id,
            discipline: dist.discipline,
            distance: dist.distance
          }))

          const { error: distanceError } = await supabase
            .from('event_distances')
            .insert(distanceInserts)

          if (distanceError) {
            console.warn('距離情報の挿入に失敗:', distanceError)
          }
        }

        results.imported++
        results.imported_events.push({
          id: newEvent.id,
          name: newEvent.name,
          event_date: newEvent.event_date
        })

      } catch (eventError) {
        results.errors.push(`大会処理エラー: ${eventError instanceof Error ? eventError.message : '不明なエラー'}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      results: results,
      message: `${results.imported}件の大会をインポートしました（${results.skipped}件をスキップ）`
    })

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'インポートエラーが発生しました' },
      { status: 500 }
    )
  }
}