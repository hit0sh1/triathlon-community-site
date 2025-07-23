'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAdmin } from '@/lib/admin'
import EventScraper from '@/components/events/EventScraper'

export default function EventScrapePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isUserAdmin, setIsUserAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const adminStatus = await isAdmin()
        if (!adminStatus) {
          router.push('/events')
          return
        }
        setIsUserAdmin(true)
      } catch (error) {
        console.error('Admin check error:', error)
        router.push('/events')
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  const handleEventsImported = () => {
    // イベントがインポートされた後の処理
    // 大会一覧ページに戻る
    router.push('/events')
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-400">読み込み中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!isUserAdmin) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              アクセス権限がありません
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              この機能は管理者のみ利用できます。
            </p>
            <Button onClick={() => router.push('/events')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft size={16} className="mr-2" />
              大会一覧に戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/events')}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft size={16} className="mr-2" />
                大会一覧に戻る
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  大会情報スクレイピング
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  外部サイトから大会情報を自動取得・インポート
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">管理者機能</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            <EventScraper onEventsImported={handleEventsImported} />
          </div>

          {/* サイドバー - 使用方法とヒント */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                使用方法
              </h3>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">URL指定</h4>
                  <p>
                    特定の大会ページのURLを入力して、その大会の詳細情報を取得します。
                    JTU公認大会やM-SPOなどの大会詳細ページに対応しています。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">一括取得</h4>
                  <p>
                    主要な大会情報サイトから最新の大会情報を自動的に取得します。
                    定期的に実行することで、最新の大会情報を維持できます。
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">注意事項</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>取得した情報は必ず確認・編集してからインポートしてください</li>
                    <li>重複する大会は自動的にスキップされます</li>
                    <li>エラーが発生した場合は詳細を確認してください</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
                対応サイト
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-medium text-blue-900 dark:text-blue-200">JTU</div>
                  <div className="text-blue-700 dark:text-blue-300">日本トライアスロン連合公認大会</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-medium text-green-900 dark:text-green-200">M-SPO</div>
                  <div className="text-green-700 dark:text-green-300">大会エントリーサイト</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="font-medium text-orange-900 dark:text-orange-200">RUNNET</div>
                  <div className="text-orange-700 dark:text-orange-300">マラソン・ランニング大会</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}