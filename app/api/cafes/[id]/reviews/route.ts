import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, comment } = body

    // 入力検証
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '評価は1〜5の間で入力してください' },
        { status: 400 }
      )
    }

    const { id } = await params
    const { data: review, error } = await supabase
      .from('cafe_reviews')
      .upsert({
        cafe_post_id: id,
        user_id: user.id,
        rating: parseInt(rating),
        comment: comment || ''
      })
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating review:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}