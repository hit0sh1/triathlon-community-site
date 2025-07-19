const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleEvents = [
  {
    name: '湘南国際村トライアスロン大会 2025',
    event_type: 'トライアスロン',
    event_date: '2025-07-13',
    location: '神奈川県三浦郡葉山町',
    description: '相模湾の美しい海を舞台にしたトライアスロン大会。湘南の夏の風物詩として親しまれ、初心者向けのスプリント距離から上級者向けのオリンピックディスタンスまで幅広いカテゴリーを用意。海の家での表彰式も人気です。',
    entry_status: 'エントリー受付中',
    max_participants: 800,
    current_participants: 420,
    entry_fee: 'スプリント: 12,000円、オリンピック: 15,000円',
    entry_deadline: '2025-06-15',
    entry_url: 'https://example.com/shonan-triathlon',
    website_url: 'https://shonan-triathlon.jp',
    image_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&auto=format&fit=crop',
    distances: [
      { discipline: 'swim', distance: '1.5km' },
      { discipline: 'bike', distance: '40km' },
      { discipline: 'run', distance: '10km' }
    ]
  },
  {
    name: '富士山マラソン 2025',
    event_type: 'マラソン',
    event_date: '2025-07-27',
    location: '山梨県富士吉田市',
    description: '富士山を望む絶景コースを走るマラソン大会。標高差のあるチャレンジングなコースですが、富士五湖の美しい景色と富士山の雄大な姿を楽しみながら走ることができます。完走後の達成感は格別です。',
    entry_status: 'エントリー受付中',
    max_participants: 12000,
    current_participants: 8500,
    entry_fee: 'フルマラソン: 8,000円、ハーフマラソン: 5,500円',
    entry_deadline: '2025-06-30',
    entry_url: 'https://example.com/fujisan-marathon',
    website_url: 'https://fujisan-marathon.com',
    image_url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&auto=format&fit=crop',
    distances: [
      { discipline: 'run', distance: '42.195km' }
    ]
  },
  {
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
  },
  {
    name: '熱海温泉リゾートトライアスロン 2025',
    event_type: 'トライアスロン',
    event_date: '2025-08-24',
    location: '静岡県熱海市',
    description: '温泉リゾート地熱海で開催される夏のトライアスロン大会。相模湾でのスイム、伊豆半島の風光明媚なバイクコース、熱海の街中を駆け抜けるランコースが特徴。大会後は温泉でリフレッシュできます。',
    entry_status: 'エントリー受付中',
    max_participants: 600,
    current_participants: 380,
    entry_fee: 'スタンダード: 18,000円、リレー: 24,000円',
    entry_deadline: '2025-07-31',
    entry_url: 'https://example.com/atami-triathlon',
    website_url: 'https://atami-triathlon.com',
    image_url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&auto=format&fit=crop',
    distances: [
      { discipline: 'swim', distance: '1.5km' },
      { discipline: 'bike', distance: '40km' },
      { discipline: 'run', distance: '10km' }
    ]
  }
]

async function addSampleEvents() {
  try {
    console.log('サンプル大会データを追加中...')

    for (const eventData of sampleEvents) {
      const { distances, ...eventInfo } = eventData

      // 大会を作成
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert([eventInfo])
        .select()
        .single()

      if (eventError) {
        console.error('大会作成エラー:', eventError)
        continue
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
    }

    console.log('サンプルデータの追加が完了しました！')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

addSampleEvents()