'use client'

import { useState } from 'react'
import { Bell, Send, Users, User, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [link, setLink] = useState('')
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all')
  const [userIds, setUserIds] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const notificationData = {
        title,
        message,
        type,
        link: link || undefined
      }

      let endpoint = '/api/notifications/create'
      let method = 'POST'
      let body: any = notificationData

      if (targetType === 'all') {
        method = 'PUT'
      } else {
        const userIdArray = userIds.split(',').map(id => id.trim()).filter(id => id)
        if (userIdArray.length === 0) {
          throw new Error('ユーザーIDを入力してください')
        }
        body = { ...notificationData, user_ids: userIdArray }
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '通知の作成に失敗しました')
      }

      setResult({
        success: true,
        message: `通知を${data.count}件作成しました`,
        count: data.count
      })

      // フォームをリセット
      setTitle('')
      setMessage('')
      setType('info')
      setLink('')
      setUserIds('')
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '通知の作成に失敗しました'
      })
    } finally {
      setLoading(false)
    }
  }

  const typeIcons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />
  }

  const typeLabels = {
    info: '情報',
    success: '成功',
    warning: '警告',
    error: 'エラー'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                通知作成
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* タイトル */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="通知のタイトルを入力してください"
                />
              </div>

              {/* メッセージ */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メッセージ *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="通知のメッセージを入力してください"
                />
              </div>

              {/* 通知タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  通知タイプ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={key}
                        checked={type === key}
                        onChange={(e) => setType(e.target.value as any)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="flex items-center space-x-2">
                        {typeIcons[key as keyof typeof typeIcons]}
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* リンク */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  リンク（オプション）
                </label>
                <input
                  type="text"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="/events/123"
                />
              </div>

              {/* 送信先 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  送信先
                </label>
                <div className="space-y-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      value="all"
                      checked={targetType === 'all'}
                      onChange={(e) => setTargetType(e.target.value as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">全ユーザー</span>
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      value="specific"
                      checked={targetType === 'specific'}
                      onChange={(e) => setTargetType(e.target.value as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">特定のユーザー</span>
                    </span>
                  </label>
                  
                  {targetType === 'specific' && (
                    <div className="ml-6">
                      <input
                        type="text"
                        value={userIds}
                        onChange={(e) => setUserIds(e.target.value)}
                        placeholder="ユーザーIDをカンマ区切りで入力"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        例: user1, user2, user3
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>送信中...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>通知を送信</span>
                  </>
                )}
              </button>
            </form>

            {/* 結果表示 */}
            {result && (
              <div className={`mt-6 p-4 rounded-md ${
                result.success 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">{result.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}