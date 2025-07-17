import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // フォームデータから認証情報を取得
    const formData = await request.formData()
    const userId = formData.get('userId') as string
    const file = formData.get('file') as File

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 })
    }
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ファイルサイズチェック (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // ファイル名を生成（ユーザーID + タイムスタンプ + 拡張子）
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `${userId}/${timestamp}.${extension}`

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from('cafe-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('cafe-images')
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: publicUrl,
      path: fileName
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}