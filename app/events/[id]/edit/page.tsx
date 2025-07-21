'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getEvent, updateEvent, EventWithDetails } from '@/lib/events'
import { isAdmin } from '@/lib/admin'
import toast, { Toaster } from 'react-hot-toast'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [event, setEvent] = useState<EventWithDetails | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    event_type: '',
    event_date: '',
    location: '',
    description: '',
    entry_status: 'エントリー受付中',
    max_participants: '',
    current_participants: '0',
    entry_fee: '',
    entry_deadline: '',
    entry_url: '',
    image_url: '',
    website_url: '',
  })

  useEffect(() => {
    const checkAuthAndFetchEvent = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // イベントデータを取得
        const eventData = await getEvent(eventId)
        if (!eventData) {
          toast.error('大会が見つかりません')
          router.push('/events')
          return
        }

        // 管理権限をチェック
        const adminStatus = await isAdmin()
        const canManage = eventData.created_by === user.id || adminStatus

        if (!canManage) {
          toast.error('この大会を編集する権限がありません')
          router.push(`/events/${eventId}`)
          return
        }

        setUser(user)
        setEvent(eventData)
        
        // フォームデータを設定
        setFormData({
          name: eventData.name || '',
          event_type: eventData.event_type || '',
          event_date: eventData.event_date ? eventData.event_date.split('T')[0] : '',
          location: eventData.location || '',
          description: eventData.description || '',
          entry_status: eventData.entry_status || 'エントリー受付中',
          max_participants: eventData.max_participants?.toString() || '',
          current_participants: eventData.current_participants?.toString() || '0',
          entry_fee: eventData.entry_fee || '',
          entry_deadline: eventData.entry_deadline ? eventData.entry_deadline.split('T')[0] : '',
          entry_url: eventData.entry_url || '',
          image_url: eventData.image_url || '',
          website_url: eventData.website_url || '',
        })
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : '初期化に失敗しました')
      } finally {
        setFetchLoading(false)
      }
    }

    if (eventId) {
      checkAuthAndFetchEvent()
    }
  }, [eventId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !event) return

    setLoading(true)
    try {
      const eventData = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        current_participants: formData.current_participants ? parseInt(formData.current_participants) : 0,
        entry_deadline: formData.entry_deadline || undefined,
      }

      await updateEvent(eventId, eventData)
      toast.success('大会情報を更新しました')
      router.push(`/events/${eventId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (fetchLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">エラー: {error || '大会が見つかりませんでした'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <Toaster />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>
          <h1 className="text-3xl font-bold text-black dark:text-white">大会情報を編集</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 基本情報 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">基本情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black dark:text-white mb-2">
                  大会名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="event_type" className="block text-sm font-medium text-black dark:text-white mb-2">
                  種目 <span className="text-red-500">*</span>
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">選択してください</option>
                  <option value="トライアスロン">トライアスロン</option>
                  <option value="マラソン">マラソン</option>
                  <option value="サイクリング">サイクリング</option>
                  <option value="アクアスロン">アクアスロン</option>
                  <option value="デュアスロン">デュアスロン</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>
          </div>

          {/* 日程・場所 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">日程・場所</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="event_date" className="block text-sm font-medium text-black dark:text-white mb-2">
                  開催日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-black dark:text-white mb-2">
                  開催場所 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="例: 沖縄県那覇市"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* エントリー情報 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">エントリー情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entry_status" className="block text-sm font-medium text-black dark:text-white mb-2">
                  エントリー状況
                </label>
                <select
                  id="entry_status"
                  name="entry_status"
                  value={formData.entry_status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="エントリー開始前">エントリー開始前</option>
                  <option value="エントリー受付中">エントリー受付中</option>
                  <option value="エントリー終了">エントリー終了</option>
                </select>
              </div>
              <div>
                <label htmlFor="entry_deadline" className="block text-sm font-medium text-black dark:text-white mb-2">
                  エントリー期限
                </label>
                <input
                  type="date"
                  id="entry_deadline"
                  name="entry_deadline"
                  value={formData.entry_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-black dark:text-white mb-2">
                  定員
                </label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  placeholder="制限なしの場合は空欄"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="entry_fee" className="block text-sm font-medium text-black dark:text-white mb-2">
                  エントリー料
                </label>
                <input
                  type="text"
                  id="entry_fee"
                  name="entry_fee"
                  value={formData.entry_fee}
                  onChange={handleChange}
                  placeholder="例: 5,000円"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* URL情報 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">URL情報</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="entry_url" className="block text-sm font-medium text-black dark:text-white mb-2">
                  エントリーURL
                </label>
                <input
                  type="url"
                  id="entry_url"
                  name="entry_url"
                  value={formData.entry_url}
                  onChange={handleChange}
                  placeholder="https://example.com/entry"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="website_url" className="block text-sm font-medium text-black dark:text-white mb-2">
                  公式サイトURL
                </label>
                <input
                  type="url"
                  id="website_url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-black dark:text-white mb-2">
                  画像URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 説明 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">大会説明</h2>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black dark:text-white mb-2">
                説明・詳細
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="大会の詳細情報、コースの特徴、注意事項など"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}