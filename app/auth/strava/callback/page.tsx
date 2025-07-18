'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { stravaAPI } from '@/lib/strava'

function StravaCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        
        if (error) {
          setStatus('error')
          setMessage(`認証がキャンセルされました: ${error}`)
          return
        }
        
        if (!code) {
          setStatus('error')
          setMessage('認証コードが見つかりません')
          return
        }
        
        if (!user) {
          setStatus('error')
          setMessage('ユーザーが見つかりません。再度ログインしてください')
          return
        }

        // 認証コードをトークンに交換（PKCE対応）
        try {
          const result = await stravaAPI.exchangeCodeForToken(code)
          setStatus('success')
          setMessage('Strava連携が完了しました！')
        } catch (error) {
          setStatus('error')
          setMessage(`連携に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
          return
        }
        
        // 3秒後にプロフィールページへリダイレクト
        setTimeout(() => {
          router.push('/profile')
        }, 3000)

      } catch (error) {
        console.error('Strava callback error:', error)
        setStatus('error')
        setMessage(`連携に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
      }
    }

    handleCallback()
  }, [searchParams, user, router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Strava連携中...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                しばらくお待ちください
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                連携完了！
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {message}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                プロフィールページへリダイレクトしています...
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                連携失敗
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {message}
              </p>
              <button
                onClick={() => router.push('/profile')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                プロフィールページに戻る
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StravaCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              読み込み中...
            </h2>
          </div>
        </div>
      </div>
    }>
      <StravaCallbackContent />
    </Suspense>
  )
}