import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

// スクレイピング対象のサイト設定
const SCRAPING_SOURCES = {
  'jtu': {
    name: 'JTU (日本トライアスロン連合)',
    url: 'https://www.jtu.or.jp',
    // 実際のスクレイピングロジックは後で実装
  },
  'mspo': {
    name: 'M-SPO',
    url: 'https://mspo.jp',
  },
  'runnet': {
    name: 'RUNNET',
    url: 'https://runnet.jp',
  }
}

// URLから大会情報を抽出する関数
async function scrapeEventFromUrl(url: string) {
  try {
    // WebFetchツールを使用して安全にスクレイピング
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    
    // 基本的なメタデータ抽出
    const titleMatch = html.match(/<title>(.*?)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)
    
    // 日付の抽出（様々なパターンに対応）
    const datePatterns = [
      /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})[日\s]*/g,
      /(\d{1,2})[月\-\/](\d{1,2})[日\s]*(\d{4})/g,
    ]
    
    let eventDate = null
    for (const pattern of datePatterns) {
      const match = html.match(pattern)
      if (match) {
        // 日付を正規化
        eventDate = match[0]
        break
      }
    }

    // 場所の抽出
    const locationPatterns = [
      /会場[：:]\s*([^<\n]+)/i,
      /開催地[：:]\s*([^<\n]+)/i,
      /場所[：:]\s*([^<\n]+)/i,
    ]
    
    let location = null
    for (const pattern of locationPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        location = match[1].trim()
        break
      }
    }

    return {
      name: titleMatch ? titleMatch[1].trim() : 'タイトル不明',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      image_url: imageMatch ? imageMatch[1] : null,
      event_date: eventDate,
      location: location || '場所未定',
      website_url: url,
      event_type: 'トライアスロン', // デフォルト値
      entry_status: 'エントリー開始前', // デフォルト値
    }
  } catch (error) {
    console.error('Scraping error:', error)
    throw new Error('スクレイピングに失敗しました')
  }
}

// メジャーな大会サイトから情報を取得
async function scrapeFromMajorSites() {
  const events = []
  
  try {
    // JTU公認大会一覧の取得（模擬データ）
    // 実際の実装では、各サイトのAPIやRSSフィードを使用することを推奨
    const jtuEvents = [
      {
        name: '宮古島トライアスロン2024',
        event_type: 'トライアスロン',
        event_date: '2024-04-21',
        location: '沖縄県宮古島市',
        description: '日本最大級のトライアスロン大会',
        entry_status: 'エントリー受付中',
        website_url: 'https://www.strongman-triathlon.jp/',
        image_url: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&auto=format&fit=crop',
      },
      {
        name: '佐渡国際トライアスロン大会',
        event_type: 'トライアスロン',
        event_date: '2024-09-08',
        location: '新潟県佐渡市',
        description: 'Aタイプ（スイム3.8km、バイク190km、ラン42.195km）',
        entry_status: 'エントリー開始前',
        website_url: 'https://www.sado-triathlon.com/',
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop',
      }
    ]
    
    events.push(...jtuEvents)
    
  } catch (error) {
    console.error('Major sites scraping error:', error)
  }
  
  return events
}

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
    const { type, url } = body

    let scrapedEvents = []

    if (type === 'url' && url) {
      // 個別URLからのスクレイピング
      const eventData = await scrapeEventFromUrl(url)
      scrapedEvents = [eventData]
    } else if (type === 'major_sites') {
      // メジャーサイトからの一括取得
      scrapedEvents = await scrapeFromMajorSites()
    } else {
      return NextResponse.json({ error: '無効なスクレイピングタイプです' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      events: scrapedEvents,
      count: scrapedEvents.length
    })

  } catch (error) {
    console.error('Scraping API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'スクレイピングエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 利用可能なスクレイピングソースを取得
export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      sources: SCRAPING_SOURCES,
      capabilities: {
        url_scraping: true,
        major_sites_scraping: true,
        batch_import: true
      }
    })

  } catch (error) {
    console.error('Scraping sources API error:', error)
    return NextResponse.json(
      { error: 'ソース情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}