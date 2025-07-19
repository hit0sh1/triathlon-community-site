const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const cyclingEvent = {
  name: '北海道洞爺湖サイクリング大会 2025',
  event_type: 'サイクリング',
  event_date: '2025-08-10',
  location: '北海道虻田郡洞爺湖町',
  description: '洞爺湖を一周する美しいサイクリングコース。夏の北海道の爽やかな気候の中、カルデラ湖の絶景を楽しみながらペダルを漕ぐことができます。家族連れから本格派サイクリストまで楽しめる複数のコースを用意。',
  entry_status: 'エントリー受付中',
  max_participants: 1200,
  current_participants: 650,
  entry_fee: 'ロングコース: 6,000円、ファミリーコース: 3,000円',
  entry_deadline: '2025-07-20',
  entry_url: 'https://example.com/toyako-cycling',
  website_url: 'https://toyako-cycling.hokkaido.jp',
  image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
  distances: [
    { discipline: 'bike', distance: '43km' }
  ]
}

async function addCyclingEvent() {
  try {
    console.log('サイクリング大会データを追加中...')

    const { distances, ...eventInfo } = cyclingEvent

    // 大会を作成
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([eventInfo])
      .select()
      .single()

    if (eventError) {
      console.error('大会作成エラー:', eventError)
      return
    }

    console.log(`大会「${event.name}」を作成しました (ID: ${event.id})`)

    // 距離情報を追加
    for (const distance of distances) {
      const { error: distanceError } = await supabase
        .from('event_distances')
        .insert([{
          event_id: event.id,
          discipline: distance.discipline,
          distance: distance.distance
        }])

      if (distanceError) {
        console.error('距離情報追加エラー:', distanceError)
      }
    }

    console.log(`「${event.name}」の距離情報を追加しました`)
    console.log('サイクリング大会の追加が完了しました！')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

addCyclingEvent()