'use client'

import Link from 'next/link'
import { Star, ArrowRight, MoreHorizontal, Edit, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { deleteGearReview } from '@/lib/gear'
import type { GearReviewWithDetails } from '@/lib/gear'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface GearReviewCardProps {
  review: any
  onEdit: (review: any) => void
  onDelete: () => void
}

const defaultImage = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop'

export default function GearReviewCard({ review, onEdit, onDelete }: GearReviewCardProps) {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('このレビューを削除しますか？')) return

    setDeleting(true)
    try {
      const success = await deleteGearReview(review.id)
      if (success) {
        onDelete()
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

  const isOwner = user?.id === review.user_id

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={review.image_url || defaultImage}
          alt={review.product_name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          {review.gear_categories?.name || 'その他'}
        </div>
        {isOwner && (
          <div className="absolute top-4 right-4">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors shadow-lg"
                disabled={deleting}
              >
                <MoreHorizontal size={16} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => {
                      onEdit(review)
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Edit size={14} />
                    編集
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 size={14} />
                    {deleting ? '削除中...' : '削除'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold line-clamp-2 flex-1 text-gray-900 dark:text-white">
            {review.product_name}
          </h3>
        </div>
        
        {review.brand && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
            ブランド: {review.brand}
          </p>
        )}
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
          </div>
          {review.price && (
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 ml-auto">
              {review.price}
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
          {review.summary}
        </p>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {review.gear_review_pros.slice(0, 2).map((pro: any, index: number) => (
              <span
                key={index}
                className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-2 py-1 rounded font-medium"
              >
                ✓ {pro.pro_point}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {review.gear_review_cons.slice(0, 2).map((con: any, index: number) => (
              <span
                key={index}
                className="text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-2 py-1 rounded font-medium"
              >
                ✗ {con.con_point}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {review.profiles?.avatar_url ? (
                <img 
                  src={review.profiles.avatar_url} 
                  alt={review.profiles.display_name} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <User size={14} className="text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-white">
                {review.profiles?.display_name || 'ユーザー'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(review.created_at), { 
                  addSuffix: true, 
                  locale: ja 
                })}
              </div>
            </div>
          </div>
          <Link
            href={`/gear/${review.id}`}
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium"
          >
            <span className="text-sm">詳細を見る</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}