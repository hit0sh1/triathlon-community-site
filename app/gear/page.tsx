'use client'

import { Filter, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getGearReviews, getGearCategories } from '@/lib/gear'
import GearReviewCard from '@/components/gear/GearReviewCard'
import GearReviewForm from '@/components/gear/GearReviewForm'
import type { GearReviewWithDetails, GearCategory } from '@/lib/gear'

export default function GearPage() {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [reviews, setReviews] = useState<any[]>([])
  const [categories, setCategories] = useState<GearCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingReview, setEditingReview] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [selectedCategory])

  const fetchData = async () => {
    try {
      const [reviewsData, categoriesData] = await Promise.all([
        getGearReviews(),
        getGearCategories()
      ])
      setReviews(reviewsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const reviewsData = await getGearReviews(selectedCategory || undefined)
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleFormSubmit = () => {
    setEditingReview(null)
    fetchReviews()
  }

  const handleEdit = (review: GearReviewWithDetails) => {
    setEditingReview(review)
    setIsModalOpen(true)
  }

  const handleDelete = () => {
    fetchReviews()
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || '全て'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">ギアレビュー</h1>
            <p className="text-xl">実際に使用したギアのレビューと評価</p>
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">ギアレビュー</h1>
          <p className="text-xl text-blue-100">実際に使用したギアのレビューと評価</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Filter size={20} className="text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">カテゴリー</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                全て
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category.id === selectedCategory
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {user && (
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  setEditingReview(null)
                  setIsModalOpen(true)
                }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Plus size={18} />
                レビューを投稿
              </button>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {selectedCategory ? `${getCategoryName(selectedCategory)}のレビューがありません` : 'レビューがありません'}
              </p>
              {user && (
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  最初のレビューを投稿してみませんか？
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <GearReviewCard
                key={review.id}
                review={review}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!user && (
          <div className="mt-8 text-center py-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-blue-700 dark:text-blue-300 mb-2">
              レビューを投稿するにはログインが必要です
            </p>
            <a 
              href="/auth/login" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              ログインはこちら
            </a>
          </div>
        )}
      </div>

      <GearReviewForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        editingReview={editingReview}
      />
    </div>
  )
}