'use client'

import { useEffect } from 'react'

/**
 * Google Maps API関連のエラーを適切に処理するコンポーネント
 * gen_204エラーなどの無害なエラーをコンソールから隠し、
 * 実際の問題のみを表示します
 */
export default function GoogleMapsErrorHandler() {
  useEffect(() => {
    // 元のconsole.errorとconsole.warnを保存
    const originalError = console.error
    const originalWarn = console.warn

    // Google Maps関連の無害なエラーをフィルタリング
    const filterGoogleMapsNoise = (originalMethod: any) => (...args: any[]) => {
      // argsの最初の要素が文字列の場合のみフィルタリングを適用
      const firstArg = args[0]
      let message = ''
      
      if (typeof firstArg === 'string') {
        message = firstArg
      } else if (firstArg && typeof firstArg.toString === 'function') {
        message = firstArg.toString()
      } else {
        message = args.join(' ')
      }
      
      // Google Maps APIの分析エンドポイント(gen_204)エラーを除外
      if (
        message.includes('gen_204') ||
        message.includes('ERR_BLOCKED_BY_CONTENT_BLOCKER') ||
        message.includes('mapsjs/gen_204') ||
        (message.includes('Failed to fetch') && message.includes('googleapis.com'))
      ) {
        // 開発モードでのみ詳細情報を表示
        if (process.env.NODE_ENV === 'development') {
          console.info('🗺️ Google Maps: Analytics endpoint blocked by content blocker (this is normal and does not affect map functionality)')
        }
        return
      }
      
      // その他のエラーは通常通り表示
      originalMethod.apply(console, args)
    }

    // コンソールメソッドをオーバーライド
    console.error = filterGoogleMapsNoise(originalError)
    console.warn = filterGoogleMapsNoise(originalWarn)

    // クリーンアップ
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null
}