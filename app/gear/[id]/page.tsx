'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, ArrowLeft, Edit, Trash2, User, Calendar, Package, Tag, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getGearReviewById, deleteGearReview } from '@/lib/gear'
import GearReviewForm from '@/components/gear/GearReviewForm'
import type { GearReviewWithDetails } from '@/lib/gear'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

const defaultImage = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop'

export default function GearReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [review, setReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [id, setId] = useState('')

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!id) return
    
    async function fetchReview() {
      try {
        const reviewData = await getGearReviewById(id)
        setReview(reviewData)
      } catch (error) {
        console.error('Error fetching review:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReview()
  }, [id])

  const handleDelete = async () => {
    if (!review || !confirm('このレビューを削除しますか？')) return

    setDeleting(true)
    try {
      const success = await deleteGearReview(review.id)
      if (success) {
        router.push('/gear')
      } else {
        alert('レビューの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('レビューの削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const handleEditSubmit = async () => {
    setIsEditModalOpen(false)
    // Re-fetch the review to get updated data
    if (id) {
      const reviewData = await getGearReviewById(id)
      setReview(reviewData)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 dark:text-gray-400">読み込み中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">レビューが見つかりません</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              指定されたレビューは存在しないか、削除されました。
            </p>
            <Button onClick={() => router.push('/gear')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft size={16} className="mr-2" />
              レビュー一覧に戻る
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === review.user_id

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/gear')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              レビュー一覧に戻る
            </Button>
            
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  <Edit size={16} className="mr-2" />
                  編集
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleting ? '削除中...' : '削除'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="aspect-square relative overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={review.image_url || defaultImage}
                  alt={review.product_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  {review.gear_categories?.name || 'その他'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {review.product_name}
                </h1>
                {review.brand && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {review.brand}
                  </p>
                )}
                
                {/* Rating & Price */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={20}
                          className={`${
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                  
                  {review.price && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-gray-500" />
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {review.price}
                      </span>
                    </div>
                  )}
                </div>

                {/* Author & Date */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {review.profiles?.avatar_url ? (
                        <img
                          src={review.profiles.avatar_url}
                          alt={review.profiles.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-gray-500" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {review.profiles?.display_name || 'ユーザー'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  レビュー要約
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {review.summary}
                </p>
              </div>

              {/* Detailed Review */}
              {review.detailed_review && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    詳細レビュー
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {review.detailed_review}
                  </div>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pros */}
                {review.gear_review_pros.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      良い点
                    </h3>
                    <ul className="space-y-2">
                      {review.gear_review_pros.map((pro: any) => (
                        <li
                          key={pro.id}
                          className="flex items-start gap-2 text-green-700 dark:text-green-300"
                        >
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{pro.pro_point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cons */}
                {review.gear_review_cons.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      悪い点
                    </h3>
                    <ul className="space-y-2">
                      {review.gear_review_cons.map((con: any) => (
                        <li
                          key={con.id}
                          className="flex items-start gap-2 text-red-700 dark:text-red-300"
                        >
                          <span className="text-red-500 mt-1">✗</span>
                          <span>{con.con_point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <GearReviewForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        editingReview={review}
      />
    </div>
  )
}