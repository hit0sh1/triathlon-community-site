'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, Trophy, ArrowRight, Plus, Grid, CalendarDays } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getEvents, getEventTypes, EventWithDetails } from '@/lib/events'
import EventCalendar from '@/components/events/EventCalendar'

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

export default function EventsPage() {
  const [selectedType, setSelectedType] = useState('全て')
  const [selectedRegion, setSelectedRegion] = useState('全国')
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const eventTypes = ['全て', ...getEventTypes()]
  const regions = [
    '全国', '北海道', '東北', '関東', '中部', '関西', '中国', '四国', '九州・沖縄',
    '東京都', '神奈川県', '千葉県', '埼玉県', '大阪府', '京都府', '兵庫県', '愛知県',
    '福岡県', '沖縄県', '静岡県', '長野県', '群馬県', '栃木県', '茨城県'
  ]

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const eventsData = await getEvents()
        setEvents(eventsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    const typeMatch = selectedType === '全て' || event.event_type === selectedType
    const regionMatch = selectedRegion === '全国' || event.location?.includes(selectedRegion)
    return typeMatch && regionMatch
  })

  // 距離情報を整理する関数
  const formatDistances = (distances: any[]) => {
    const distanceMap: { [key: string]: string } = {}
    distances.forEach(d => {
      distanceMap[d.discipline] = d.distance
    })
    return distanceMap
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">大会情報</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">全国で開催されるトライアスロン・マラソン・サイクリング大会</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 space-y-6">
          {/* View Mode Toggle and Post Button */}
          <div className="space-y-4">
            {/* PC表示：横並び */}
            <div className="hidden md:flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-black dark:text-white">表示形式</h2>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Grid size={16} />
                    一覧
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'calendar'
                        ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <CalendarDays size={16} />
                    カレンダー
                  </button>
                </div>
              </div>
              <Link
                href="/events/new"
                className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                <span>大会を投稿</span>
              </Link>
            </div>

            {/* モバイル表示：縦並び */}
            <div className="md:hidden space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-black dark:text-white">表示形式</h2>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Grid size={16} />
                    一覧
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'calendar'
                        ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <CalendarDays size={16} />
                    カレンダー
                  </button>
                </div>
              </div>
              <Link
                href="/events/new"
                className="w-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                <span>大会を投稿</span>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-semibold mb-3 text-black dark:text-white">種目別フィルター</h3>
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      type === selectedType
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-semibold mb-3 text-black dark:text-white">地域別フィルター</h3>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      region === selectedRegion
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">エラー: {error}</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <EventCalendar
            events={events}
            selectedRegion={selectedRegion}
            selectedType={selectedType}
          />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">該当する大会が見つかりませんでした。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const distances = formatDistances(event.event_distances || [])
              const defaultImage = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&auto=format&fit=crop'
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={event.image_url || defaultImage}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-full text-sm font-medium">
                      {event.event_type}
                    </div>
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.entry_status || '')}`}>
                      {event.entry_status || 'ステータス未設定'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">{event.name}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.event_date ? new Date(event.event_date).toLocaleDateString('ja-JP') : '日程未定'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {event.current_participants || 0}/{event.max_participants || '制限なし'}名
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {event.description || '詳細情報はこちらをご確認ください。'}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      {distances.swim && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          スイム {distances.swim}
                        </span>
                      )}
                      {distances.bike && (
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          バイク {distances.bike}
                        </span>
                      )}
                      {distances.run && (
                        <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                          ラン {distances.run}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">詳細を見る</span>
                      <ArrowRight size={16} className="text-gray-600 dark:text-gray-400" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}