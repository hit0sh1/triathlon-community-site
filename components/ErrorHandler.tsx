'use client'

import { useEffect } from 'react'
import { clearSupabaseCookies } from '@/lib/utils/cookies'

export default function ErrorHandler() {
  useEffect(() => {
    // グローバルエラーハンドラーを設定
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message

      // Supabaseクッキー関連のエラーをチェック
      const errorMessage = error?.message || event.message || ''
      const errorStack = error?.stack || event.error?.stack || ''
      
      if (
        errorMessage.includes('Failed to parse cookie string') ||
        errorMessage.includes('Unexpected token') ||
        errorMessage.includes('base64-') ||
        errorMessage.includes('is not valid JSON') ||
        errorStack.includes('__loadSession') ||
        errorStack.includes('getItem') ||
        errorStack.includes('JSON.parse')
      ) {
        console.warn('🍪 Supabase cookie error detected, attempting auto-recovery')
        
        // クッキーをクリアして再読み込み
        clearSupabaseCookies()
        
        // 少し待ってからページを再読み込み（ユーザー体験を考慮）
        setTimeout(() => {
          console.log('🔄 Reloading page to recover from cookie error')
          window.location.reload()
        }, 2000)
        
        // エラーの伝播を停止
        event.preventDefault()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason

      // Promise rejectionでもクッキーエラーをチェック
      const errorMessage = error?.message || ''
      const errorStack = error?.stack || ''
      
      if (
        errorMessage.includes('Failed to parse cookie string') ||
        errorMessage.includes('Unexpected token') ||
        errorMessage.includes('base64-') ||
        errorMessage.includes('is not valid JSON') ||
        errorStack.includes('__loadSession') ||
        errorStack.includes('getItem') ||
        errorStack.includes('JSON.parse')
      ) {
        console.warn('🍪 Supabase cookie promise rejection detected, attempting auto-recovery')
        
        clearSupabaseCookies()
        
        setTimeout(() => {
          console.log('🔄 Reloading page to recover from cookie error')
          window.location.reload()
        }, 2000)
        
        event.preventDefault()
        return false
      }
    }

    // イベントリスナーを追加
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 開発環境でのデバッグ情報
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 ErrorHandler: Monitoring for Supabase cookie errors')
      
      // 開発環境では手動でクッキーデバッグ機能を提供
      ;(window as any).debugSupabaseCookies = () => {
        import('@/lib/utils/cookies').then(({ debugCookies }) => {
          debugCookies()
        })
      }
      
      ;(window as any).clearSupabaseCookies = () => {
        clearSupabaseCookies()
        console.log('🧹 Supabase cookies cleared manually')
      }
    }

    // クリーンアップ
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // このコンポーネントは何も描画しない
}