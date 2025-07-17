import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// メール送信用のトランスポーター設定
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, category, message } = body

    // バリデーション
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      )
    }

    // カテゴリーのラベル取得
    const categoryLabels: { [key: string]: string } = {
      general: '一般的なお問い合わせ',
      technical: '技術的な問題',
      event: '大会について',
      membership: '会員について',
      partnership: '提携・協力について',
      other: 'その他',
    }

    // メール内容の作成
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_TO || process.env.GMAIL_USER, // 受信メールアドレス
      subject: `[トライアスロンコミュニティ] ${subject || 'お問い合わせ'}`,
      html: `
        <h2>お問い合わせを受信しました</h2>
        <hr />
        <p><strong>お名前:</strong> ${name}</p>
        <p><strong>メールアドレス:</strong> ${email}</p>
        <p><strong>件名:</strong> ${subject || '件名なし'}</p>
        <p><strong>カテゴリー:</strong> ${categoryLabels[category] || '不明'}</p>
        <hr />
        <p><strong>お問い合わせ内容:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          このメールは、トライアスロンコミュニティのお問い合わせフォームから送信されました。<br />
          送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
        </p>
      `,
      replyTo: email, // 返信先を送信者のメールアドレスに設定
    }

    // 自動返信メールの内容
    const autoReplyOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'お問い合わせありがとうございます - トライアスロンコミュニティ',
      html: `
        <h2>${name} 様</h2>
        <p>この度は、トライアスロンコミュニティへお問い合わせいただき、誠にありがとうございます。</p>
        <p>以下の内容でお問い合わせを受け付けました。</p>
        <hr />
        <p><strong>件名:</strong> ${subject || '件名なし'}</p>
        <p><strong>カテゴリー:</strong> ${categoryLabels[category] || '不明'}</p>
        <p><strong>お問い合わせ内容:</strong></p>
        <p style="white-space: pre-wrap; background-color: #f5f5f5; padding: 10px;">${message}</p>
        <hr />
        <p>
          お問い合わせいただいた内容については、1-2営業日以内にご返信させていただきます。<br />
          今しばらくお待ちくださいますよう、お願い申し上げます。
        </p>
        <p>
          ※このメールは自動送信されています。このメールへの返信はできません。<br />
          ※追加のご質問等がございましたら、改めてお問い合わせフォームよりご連絡ください。
        </p>
        <br />
        <p>
          トライアスロンコミュニティ<br />
          <a href="https://triathlon-community.jp">https://triathlon-community.jp</a>
        </p>
      `,
    }

    // メール送信
    await transporter.sendMail(mailOptions)
    
    // 自動返信メール送信
    await transporter.sendMail(autoReplyOptions)

    return NextResponse.json(
      { message: 'お問い合わせを送信しました' },
      { status: 200 }
    )
  } catch (error) {
    console.error('メール送信エラー:', error)
    return NextResponse.json(
      { error: 'メール送信に失敗しました' },
      { status: 500 }
    )
  }
}