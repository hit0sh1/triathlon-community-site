'use client'

import { useState } from 'react'
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface CafePost {
  id: string
  title: string
  content: string
  image_url?: string
  user_id: string
  user: {
    display_name: string
    avatar_url?: string
  }
  like_count: number
  comment_count: number
  created_at: string
  is_liked?: boolean
  comments?: CafePostComment[]
}

interface CafePostComment {
  id: string
  comment: string
  user_id: string
  user: {
    display_name: string
    avatar_url?: string
  }
  created_at: string
}

interface CafePostProps {
  post: CafePost
  currentUserId?: string
  onLike: (postId: string, isLiked: boolean) => void
  onComment: (postId: string, comment: string) => void
  onEdit: (postId: string, data: { title: string; content: string }) => void
  onDelete: (postId: string) => void
}

export default function CafePost({ post, currentUserId, onLike, onComment, onEdit, onDelete }: CafePostProps) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editContent, setEditContent] = useState(post.content)
  const [showMenu, setShowMenu] = useState(false)

  const handleLike = () => {
    onLike(post.id, post.is_liked || false)
  }

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    onComment(post.id, newComment.trim())
    setNewComment('')
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editContent.trim()) return

    onEdit(post.id, {
      title: editTitle.trim(),
      content: editContent.trim()
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('この投稿を削除しますか？')) {
      onDelete(post.id)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {post.user.avatar_url ? (
              <img src={post.user.avatar_url} alt={post.user.display_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={20} className="text-gray-500" />
            )}
          </div>
          <div>
            <h4 className="font-medium">{post.user.display_name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ja })}
            </p>
          </div>
        </div>

        {currentUserId === post.user_id && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal size={16} />
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit size={14} />
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                >
                  <Trash2 size={14} />
                  削除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-4">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            required
          />
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              更新
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              キャンセル
            </Button>
          </div>
        </form>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
          
          {post.image_url && (
            <div className="mb-4">
              <img
                src={post.image_url}
                alt="投稿画像"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                post.is_liked
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart size={16} className={post.is_liked ? 'fill-current' : ''} />
              <span className="text-sm">{post.like_count}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-3 py-1 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <MessageCircle size={16} />
              <span className="text-sm">{post.comment_count}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-3 mb-4">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      {comment.user.avatar_url ? (
                        <img src={comment.user.avatar_url} alt={comment.user.display_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={14} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user.display_name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ja })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              {currentUserId ? (
                <form onSubmit={handleComment} className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを入力..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    送信
                  </Button>
                </form>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  コメントするには<a href="/auth/signin" className="text-primary hover:underline">ログイン</a>が必要です
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}