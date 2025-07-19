'use client'

import Link from 'next/link'
import { MapPin, Wifi, Car, Zap, Star, ArrowRight, Coffee, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface CafePost {
  id: string
  title: string
  description: string
  address: string
  phone?: string
  website?: string
  opening_hours?: string
  latitude?: number
  longitude?: number
  image_url?: string
  tags: string[]
  wifi_available: boolean
  bike_parking: boolean
  has_power_outlet: boolean
  is_approved: boolean
  user_id: string
  created_at: string
  updated_at: string
  average_rating: number
  review_count: number
  favorite_count: number
}

const defaultImage = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop'

export default function CafesPage() {
  const [cafes, setCafes] = useState<CafePost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    fetchCafes()
  }, [search, selectedTags])

  const fetchCafes = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      
      const response = await fetch(`/api/cafes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCafes(data.cafes)
        
        // 全てのタグを集計
        const tags = new Set<string>()
        data.cafes.forEach((cafe: CafePost) => {
          cafe.tags.forEach(tag => tags.add(tag))
        })
        setAllTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Error fetching cafes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">カフェ情報</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">トライアスロン仲間におすすめのカフェ</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">読み込み中...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">カフェ情報</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">トライアスロン仲間におすすめのカフェ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* カフェ投稿ボタン */}
        {user && (
          <div className="mb-6">
            <Link
              href="/cafes/new"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus size={20} />
              カフェを投稿
            </Link>
          </div>
        )}

        {/* 検索・フィルター */}
        <div className="mb-8 space-y-4">
          {/* 検索バー */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="カフェ名や住所で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* タグフィルター */}
          {allTags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">タグで絞り込み</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {cafes.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">該当するカフェがありません</p>
            {user && (
              <Link
                href="/cafes/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                最初のカフェを投稿する
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafes.map((cafe) => (
              <Link
                key={cafe.id}
                href={`/cafes/${cafe.id}`}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={cafe.image_url || defaultImage}
                    alt={cafe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {cafe.wifi_available && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Wifi size={12} />
                        WiFi
                      </div>
                    )}
                    {cafe.bike_parking && (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Car size={12} />
                        サイクルラック
                      </div>
                    )}
                    {cafe.has_power_outlet && (
                      <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Zap size={12} />
                        電源
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{cafe.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{cafe.address}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">
                        {cafe.average_rating > 0 ? cafe.average_rating.toFixed(1) : '未評価'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({cafe.review_count}件のレビュー)
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {cafe.description}
                  </p>
                  
                  {/* タグ表示 */}
                  {cafe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {cafe.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {cafe.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                          +{cafe.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-600">詳細を見る</span>
                      <ArrowRight size={16} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}