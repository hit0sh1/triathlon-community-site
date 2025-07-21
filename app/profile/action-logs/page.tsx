'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserActionLogs } from '@/lib/content-actions'
import ActionLogCard from '@/components/moderation/ActionLogCard'
import { History, AlertCircle } from 'lucide-react'

interface ActionLog {
  id: string
  action_type: string
  content_type: string
  content_title: string | null
  created_at: string
  deletion_reasons?: {
    name: string
    severity: string
  } | null
  custom_reason?: string | null
  performed_by?: {
    display_name: string
    username: string
  } | null
}

export default function ActionLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadActionLogs()
    }
  }, [user])

  const loadActionLogs = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const data = await getUserActionLogs(user.id)
      setLogs(data as ActionLog[])
    } catch (err) {
      console.error('Error loading action logs:', err)
      setError('アクションログの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">ログインが必要です</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-black rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <History size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-black dark:text-white">
              アクションログ
            </h1>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            あなたのコンテンツに対して実行されたモデレーションアクションの履歴です。
          </p>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">アクションログを読み込み中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={loadActionLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                再試行
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                アクションログはありません
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                まだモデレーションアクションは実行されていません。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  アクション履歴（{logs.length}件）
                </h2>
                <button
                  onClick={loadActionLogs}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  更新
                </button>
              </div>
              
              <div className="space-y-3">
                {logs.map((log) => (
                  <ActionLogCard key={log.id} log={log} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
            アクションログについて
          </h3>
          <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
            <p>• <strong>削除</strong>: コンテンツが削除されました</p>
            <p>• <strong>非表示</strong>: コンテンツが一時的に非表示にされました</p>
            <p>• <strong>復元</strong>: 削除または非表示にされたコンテンツが復元されました</p>
            <p>• <strong>警告</strong>: コンテンツについて警告が発行されました</p>
          </div>
        </div>
      </div>
    </div>
  )
}