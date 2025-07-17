'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MapPin, Phone, Globe, Clock, Wifi, Car, Zap, Star, Heart, Edit, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
  has_cycle_rack: boolean
  has_power_outlet: boolean
  is_approved: boolean
  user_id: string
  created_at: string
  updated_at: string
  average_rating: number
  review_count: number
  favorite_count: number
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    display_name: string
    avatar_url?: string
  }
}

const defaultImage = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop'

export default function CafeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [cafe, setCafe] = useState<CafePost | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    fetchCafeDetail()
  }, [params.id])

  const fetchCafeDetail = async () => {
    try {
      // 直接Supabaseから取得
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: cafe, error } = await supabase
        .from('cafe_stats')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error || !cafe) {
        router.push('/cafes')
        return
      }

      setCafe(cafe)

      // レビューも取得
      const { data: reviews } = await supabase
        .from('cafe_post_reviews')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('cafe_post_id', params.id)
        .order('created_at', { ascending: false })

      setReviews(reviews || [])
    } catch (error) {
      console.error('Error fetching cafe:', error)
      router.push('/cafes')
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!user) return

    try {
      const method = isFavorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/cafes/${params.id}/favorite`, { method })
      
      if (response.ok) {
        setIsFavorited(!isFavorited)
        if (cafe) {
          setCafe({
            ...cafe,
            favorite_count: cafe.favorite_count + (isFavorited ? -1 : 1)
          })
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submittingReview) return

    setSubmittingReview(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: review, error } = await supabase
        .from('cafe_post_reviews')
        .insert([{
          cafe_post_id: params.id,
          user_id: user.id,
          rating: newReview.rating,
          comment: newReview.comment
        }])
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error submitting review:', error)
        return
      }

      setReviews([review, ...reviews])
      setNewReview({ rating: 5, comment: '' })
      fetchCafeDetail() // 評価を再取得
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このカフェ情報を削除しますか？')) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('cafe_posts')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error deleting cafe:', error)
        return
      }

      router.push('/cafes')
    } catch (error) {
      console.error('Error deleting cafe:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">カフェが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/cafes"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <ArrowLeft size={20} />
            カフェ一覧に戻る
          </Link>
          
          {user && user.id === cafe.user_id && (
            <div className="flex gap-2">
              <Link
                href={`/cafes/${cafe.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={16} />
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                削除
              </button>
            </div>
          )}
        </div>

        {/* メイン情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側 - 画像と基本情報 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={cafe.image_url || defaultImage}
                  alt={cafe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {cafe.wifi_available && (
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Wifi size={16} />
                      WiFi
                    </div>
                  )}
                  {cafe.has_cycle_rack && (
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Car size={16} />
                      サイクルラック
                    </div>
                  )}
                  {cafe.has_power_outlet && (
                    <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Zap size={16} />
                      電源
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{cafe.title}</h1>
                  {user && (
                    <button
                      onClick={handleFavorite}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                        isFavorited
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Heart size={16} className={isFavorited ? 'fill-current' : ''} />
                      {cafe.favorite_count}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star size={20} className="text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold">
                      {cafe.average_rating > 0 ? cafe.average_rating.toFixed(1) : '未評価'}
                    </span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    ({cafe.review_count}件のレビュー)
                  </span>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {cafe.description}
                </p>

                {/* タグ */}
                {cafe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cafe.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 詳細情報 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin size={20} className="text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{cafe.address}</span>
                  </div>
                  
                  {cafe.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={20} className="text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{cafe.phone}</span>
                    </div>
                  )}
                  
                  {cafe.website && (
                    <div className="flex items-center gap-3">
                      <Globe size={20} className="text-gray-400" />
                      <a
                        href={cafe.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        {cafe.website}
                      </a>
                    </div>
                  )}
                  
                  {cafe.opening_hours && (
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{cafe.opening_hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右側 - レビュー */}
          <div className="space-y-6">
            {/* レビュー投稿フォーム */}
            {user && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">レビューを投稿</h2>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      評価
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`text-2xl ${
                            star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      コメント
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="カフェの感想を書いてください..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? '投稿中...' : 'レビューを投稿'}
                  </button>
                </form>
              </div>
            )}

            {/* レビュー一覧 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">レビュー</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  まだレビューがありません
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <img
                          src={review.profiles.avatar_url || `https://ui-avatars.com/api/?name=${review.profiles.display_name}&background=0ea5e9&color=fff`}
                          alt={review.profiles.display_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {review.profiles.display_name}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={`${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}