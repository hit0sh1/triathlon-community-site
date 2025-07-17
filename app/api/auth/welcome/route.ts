import { NextResponse } from 'next/server'
import { sendWelcomeNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    await sendWelcomeNotification(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending welcome notification:', error)
    return NextResponse.json(
      { error: 'ウェルカム通知の送信に失敗しました' },
      { status: 500 }
    )
  }
}