'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Trophy, ArrowLeft, ExternalLink, Clock, Trash2, Edit } from 'lucide-react'
import { getEvent, EventWithDetails, deleteEventByUser } from '@/lib/events'
import { createClient } from '@/lib/supabase/client'
import { isAdmin } from '@/lib/admin'
import Link from 'next/link'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'エントリー受付中':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'エントリー終了':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'エントリー開始前':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const eventData = await getEvent(eventId)
        if (!eventData) {
          setError('大会が見つかりませんでした')
          return
        }
        setEvent(eventData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Admin状態もチェック
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)
    }

    if (eventId) {
      fetchEvent()
      fetchUser()
    }
  }, [eventId])

  // 距離情報を整理する関数
  const formatDistances = (distances: any[]) => {
    const distanceMap: { [key: string]: string } = {}
    distances.forEach(d => {
      distanceMap[d.discipline] = d.distance
    })
    return distanceMap
  }

  // 削除確認ダイアログを表示
  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  // 削除実行
  const handleDeleteConfirm = async () => {
    if (!event || !user) return

    setDeleting(true)
    setShowDeleteDialog(false)
    try {
      await deleteEventByUser(event.id)
      router.push('/events')
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  // 投稿者またはadminかどうかをチェック
  const canManage = user && event && (event.created_by === user.id || userIsAdmin)

  if (loading) {
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
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const distances = formatDistances(event.event_distances || [])
  const defaultImage = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&auto=format&fit=crop'

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>
          
          {/* 編集・削除ボタン（投稿者またはadmin） */}
          {canManage && (
            <div className="flex items-center gap-2">
              <Link
                href={`/events/${eventId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={16} />
                <span>編集</span>
              </Link>
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                <span>{deleting ? '削除中...' : '削除'}</span>
              </button>
            </div>
          )}
        </div>

        {/* メイン画像 */}
        <div className="aspect-video relative overflow-hidden rounded-2xl mb-8">
          <img
            src={event.image_url || defaultImage}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-full font-medium">
            {event.event_type}
          </div>
          <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-medium ${getStatusColor(event.entry_status || '')}`}>
            {event.entry_status || 'ステータス未設定'}
          </div>
        </div>

        {/* 大会情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メイン情報 */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4">{event.name}</h1>
            
            {/* 基本情報 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-primary" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">開催日</p>
                    <p className="font-medium text-black dark:text-white">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : '日程未定'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-primary" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">開催場所</p>
                    <p className="font-medium text-black dark:text-white">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-primary" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">参加者数</p>
                    <p className="font-medium text-black dark:text-white">
                      {event.current_participants || 0}
                      {event.max_participants && `/${event.max_participants}`}名
                    </p>
                  </div>
                </div>
                {event.entry_fee && (
                  <div className="flex items-center gap-3">
                    <Trophy size={20} className="text-primary" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">エントリー料</p>
                      <p className="font-medium text-black dark:text-white">{event.entry_fee}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 距離情報 */}
            {Object.keys(distances).length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white mb-3">競技距離</h2>
                <div className="flex flex-wrap gap-2">
                  {distances.swim && (
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg">
                      <span className="font-medium">スイム:</span> {distances.swim}
                    </div>
                  )}
                  {distances.bike && (
                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg">
                      <span className="font-medium">バイク:</span> {distances.bike}
                    </div>
                  )}
                  {distances.run && (
                    <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg">
                      <span className="font-medium">ラン:</span> {distances.run}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 大会説明 */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-3">大会について</h2>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {event.description || '大会の詳細情報が登録されていません。'}
                </p>
              </div>
            </div>

            {/* 主催者情報 */}
            {event.profiles && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-black dark:text-white mb-3">主催者</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="font-medium text-black dark:text-white">
                    {event.profiles.display_name || event.profiles.username}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">エントリー情報</h3>
              
              {/* エントリー期限 */}
              {event.entry_deadline && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">エントリー期限</span>
                  </div>
                  <p className="text-black dark:text-white">
                    {new Date(event.entry_deadline).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}

              {/* エントリー状況 */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">エントリー状況</p>
                <div className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(event.entry_status || '')}`}>
                  {event.entry_status || 'ステータス未設定'}
                </div>
              </div>

              {/* エントリーボタン */}
              {event.entry_status === 'エントリー受付中' && (
                <div className="mb-4">
                  {event.entry_url ? (
                    <a
                      href={event.entry_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    >
                      <span>エントリーする</span>
                      <ExternalLink size={16} />
                    </a>
                  ) : (
                    <div className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium text-center">
                      エントリーURL未設定
                    </div>
                  )}
                </div>
              )}

              {/* 公式サイト */}
              {event.website_url && (
                <div className="mb-4">
                  <a
                    href={event.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600"
                  >
                    <span>公式サイト</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}

              {/* 参加者数の進捗 */}
              {event.max_participants && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>参加者数</span>
                    <span>{event.current_participants || 0}/{event.max_participants}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((event.current_participants || 0) / event.max_participants) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">大会を削除</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              「{event?.name}」を削除しますか？
              <br />
              <br />
              この操作は取り消すことができません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}