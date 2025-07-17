'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, User } from 'lucide-react'
import StarRating from './StarRating'
import { 
  getCourseRatings, 
  getUserCourseRating, 
  upsertCourseRating, 
  deleteCourseRating,
  getCourseRatingStats,
  CourseRating 
} from '@/lib/course-ratings'
import { createClient } from '@/lib/supabase/client'

interface CourseRatingSectionProps {
  courseId: string
}

export default function CourseRatingSection({ courseId }: CourseRatingSectionProps) {
  const [ratings, setRatings] = useState<CourseRating[]>([])
  const [userRating, setUserRating] = useState<CourseRating | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [stats, setStats] = useState({
    averageRating: 0,
    ratingCount: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })

  useEffect(() => {
    fetchData()
  }, [courseId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // ユーザー情報を取得
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // 評価一覧を取得
      const ratingsData = await getCourseRatings(courseId)
      setRatings(ratingsData)

      // 統計を取得
      const statsData = await getCourseRatingStats(courseId)
      setStats(statsData)

      // ユーザーの評価を取得
      if (user) {
        const userRatingData = await getUserCourseRating(courseId, user.id)
        setUserRating(userRatingData)
        if (userRatingData) {
          setNewRating(userRatingData.rating)
          setNewComment(userRatingData.comment || '')
        }
      }
    } catch (error) {
      console.error('Error fetching rating data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!currentUser || newRating === 0) return

    try {
      setSubmitting(true)
      
      await upsertCourseRating({
        course_id: courseId,
        user_id: currentUser.id,
        rating: newRating,
        comment: newComment.trim() || undefined
      })

      // データを再取得
      await fetchData()
      setShowRatingForm(false)
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('評価の投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRating = async () => {
    if (!currentUser || !userRating) return

    if (!confirm('評価を削除しますか？')) return

    try {
      await deleteCourseRating(courseId, currentUser.id)
      await fetchData()
      setNewRating(0)
      setNewComment('')
      setShowRatingForm(false)
    } catch (error) {
      console.error('Error deleting rating:', error)
      alert('評価の削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">コース評価</h2>
      
      {/* 評価統計 */}
      <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-black dark:text-white">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '未評価'}
            </div>
            <StarRating rating={stats.averageRating} readonly showValue={false} />
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {stats.ratingCount}件の評価
          </div>
        </div>
        
        {/* 評価分布 */}
        {stats.ratingCount > 0 && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-600 dark:text-gray-400">{star}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ 
                      width: `${stats.ratingCount > 0 ? (stats.ratingDistribution[star as keyof typeof stats.ratingDistribution] / stats.ratingCount) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="w-8 text-xs text-gray-600 dark:text-gray-400">
                  {stats.ratingDistribution[star as keyof typeof stats.ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ユーザーの評価フォーム */}
      {currentUser && (
        <div className="mb-8 p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {userRating ? 'あなたの評価' : '評価を投稿'}
            </h3>
          </div>

          {userRating && !showRatingForm ? (
            <div>
              <StarRating rating={userRating.rating} readonly />
              {userRating.comment && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">{userRating.comment}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={handleDeleteRating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  評価
                </label>
                <StarRating 
                  rating={newRating} 
                  onRatingChange={setNewRating}
                  size="lg"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                  コメント（任意）
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white"
                  rows={3}
                  placeholder="コースの感想を書いてください..."
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitRating}
                  disabled={newRating === 0 || submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '投稿中...' : userRating ? '更新' : '投稿'}
                </button>
                {showRatingForm && (
                  <button
                    onClick={() => {
                      setShowRatingForm(false)
                      if (userRating) {
                        setNewRating(userRating.rating)
                        setNewComment(userRating.comment || '')
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 評価一覧 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
          みんなの評価 ({ratings.length})
        </h3>
        
        {ratings.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            まだ評価がありません
          </p>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    {rating.profiles?.avatar_url ? (
                      <img 
                        src={rating.profiles.avatar_url} 
                        alt={rating.profiles.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-black dark:text-white">
                        {rating.profiles?.display_name || 'ユーザー'}
                      </span>
                      <StarRating rating={rating.rating} readonly size="sm" />
                    </div>
                    {rating.comment && (
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{rating.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(rating.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}