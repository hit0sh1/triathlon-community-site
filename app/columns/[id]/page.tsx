'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Eye, User, Edit, Trash2, MessageSquare, BookOpen, Tag, Share2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getColumn, ColumnWithDetails, incrementViewCount, addComment } from '@/lib/columns'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

export default function ColumnDetailPage() {
  const params = useParams()
  const router = useRouter()
  const columnId = params.id as string
  const [column, setColumn] = useState<ColumnWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchColumn()
  }, [columnId])

  const fetchColumn = async () => {
    try {
      setLoading(true)
      const columnData = await getColumn(columnId)
      if (!columnData) {
        router.push('/columns')
        return
      }
      setColumn(columnData)
      
      // 閲覧数を増加
      await incrementViewCount(columnId)
    } catch (error) {
      console.error('Error fetching column:', error)
      toast.error('コラムの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!column) return

    setDeleting(true)
    setShowDeleteConfirm(false)
    try {
      await deleteColumn(columnId)
      toast.success('コラムを削除しました')
      router.push('/columns')
    } catch (error) {
      console.error('Error deleting column:', error)
      toast.error('コラムの削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !user) return

    setSubmittingComment(true)
    try {
      await addComment(columnId, comment)
      setComment('')
      await fetchColumn() // コメントを再取得
      toast.success('コメントを投稿しました')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('コメントの投稿に失敗しました')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      await deleteComment(commentId)
      await fetchColumn() // コメントを再取得
      toast.success('コメントを削除しました')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('コメントの削除に失敗しました')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: column?.title,
          text: column?.excerpt || 'トライアスロンコラム',
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('URLをコピーしました')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training':
        return '🏃‍♂️'
      case 'nutrition':
        return '🥗'
      case 'gear':
        return '⚙️'
      case 'race':
        return '🏆'
      case 'beginner':
        return '🌟'
      default:
        return '📝'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'training':
        return 'トレーニング'
      case 'nutrition':
        return '栄養・食事'
      case 'gear':
        return 'ギア・装備'
      case 'race':
        return 'レース'
      case 'beginner':
        return '初心者向け'
      default:
        return '一般'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container-premium py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!column) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container-premium py-8">
          <div className="text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">コラムが見つかりません</h1>
            <Link href="/columns" className="text-blue-600 hover:underline">
              コラム一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container-premium py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/columns"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            コラム一覧に戻る
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Share2 size={16} />
              共有
            </button>
            
            {user && column.created_by === user.id && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/columns/${columnId}/edit`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  編集
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Article */}
        <article className="max-w-4xl mx-auto">
          {/* Header Image */}
          {column.image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
              <img
                src={column.image_url}
                alt={column.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title and Meta */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                {getCategoryIcon(column.category || '')} {getCategoryName(column.category || '')}
              </span>
              {column.is_featured && (
                <span className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 px-3 py-1 rounded-full text-sm font-semibold">
                  注目
                </span>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white japanese-text mb-6">
              {column.title}
            </h1>
            
            <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>作成者</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{new Date(column.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span>{column.view_count || 0} 閲覧</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {column.tags && column.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag size={16} className="text-gray-400" />
                {column.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12 dark:prose-invert">
            <div
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: column.content.replace(/\n/g, '<br>') }}
            />
          </div>


          {/* Comments Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
            <h2 className="text-2xl font-bold text-black dark:text-white japanese-text mb-6 flex items-center gap-2">
              <MessageSquare size={24} />
              コメント ({column.column_comments?.length || 0})
            </h2>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex gap-4">
                  <img
                    src={user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=40&h=40&fit=crop&crop=face'}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="コメントを入力してください..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      required
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={submittingComment || !comment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {submittingComment ? '投稿中...' : 'コメントする'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  コメントを投稿するにはログインしてください
                </p>
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  ログイン
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {column.column_comments?.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <img
                    src={'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=40&h=40&fit=crop&crop=face'}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-black dark:text-white">
                        コメンター
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      {user && comment.user_id === user.id && (
                        <button
                          onClick={() => handleCommentDelete(comment.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          削除
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white">コラムを削除しますか？</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                この操作は取り消せません。本当にこのコラムを削除しますか？
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}