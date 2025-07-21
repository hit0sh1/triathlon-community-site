'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Clock, User, Reply, Heart, Trash2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { incrementViewCount, createBoardReply, deleteBoardReplyByUser, likeBoardReply, unlikeBoardReply, checkUserLikedReply, checkLikeTableExists } from '@/lib/board'
import { useAuth } from '@/contexts/AuthContext'
import { ensureProfileExists } from '@/lib/profile'

type BoardPost = Database['public']['Tables']['board_posts']['Row']
type BoardReply = Database['public']['Tables']['board_replies']['Row']
type BoardCategory = Database['public']['Tables']['board_categories']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface PostWithDetails extends BoardPost {
  board_categories: BoardCategory
  profiles: Profile
}

interface ReplyWithProfile extends BoardReply {
  profiles: Profile
  isLiked?: boolean
  like_count?: number
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const [post, setPost] = useState<PostWithDetails | null>(null)
  const [replies, setReplies] = useState<ReplyWithProfile[]>([])
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [likeTableExists, setLikeTableExists] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null)
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false)
  const { user } = useAuth()
  
  useEffect(() => {
    setMounted(true)
    // いいねテーブルが存在するかチェック（一時的に無効化）
    // checkLikeTableExists().then(setLikeTableExists)
    setLikeTableExists(false) // 一時的に無効化
  }, [])

  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log('Fetching post with ID:', postId)
        setLoading(true)
        const supabase = createClient()
        
        // 投稿を取得
        const { data: postData, error: postError } = await supabase
          .from('board_posts')
          .select(`
            *,
            board_categories(*),
            profiles(*)
          `)
          .eq('id', postId)
          .single()
        
        if (postError) {
          console.error('Error fetching post:', postError)
          console.error('Post ID:', postId)
          console.error('Error details:', postError.message, postError.details)
          setError(`投稿の取得に失敗しました: ${postError.message}`)
          return
        }
        
        if (!postData) {
          setError('投稿が見つかりません')
          return
        }
        
        setPost(postData)
        
        // 閲覧数を増加（エラーが発生してもページ表示は続行）
        try {
          await incrementViewCount(postId)
        } catch (err) {
          console.error('Error incrementing view count:', err)
          // エラーが発生してもページの表示は続行
        }
        
        // 返信を取得
        const { data: repliesData, error: repliesError } = await supabase
          .from('board_replies')
          .select(`
            *,
            profiles(*)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true })
        
        if (repliesError) {
          console.error('Error fetching replies:', repliesError)
        } else {
          // 各返信に対してユーザーがいいねしているかチェック（テーブルが存在する場合のみ）
          const repliesWithLikeStatus = await Promise.all(
            (repliesData || []).map(async (reply) => {
              const isLiked = user && likeTableExists ? await checkUserLikedReply(reply.id, user.id) : false
              return {
                ...reply,
                isLiked
              }
            })
          )
          setReplies(repliesWithLikeStatus)
        }
        
      } catch (err) {
        console.error('Error:', err)
        setError('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPost()
  }, [postId])

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      alert('返信内容を入力してください')
      return
    }

    if (!user) {
      alert('ログインが必要です')
      return
    }

    setSubmitting(true)
    
    try {
      // プロフィールの存在を確認し、必要に応じて作成
      await ensureProfileExists(user.id, user.email || '')
      
      const replyData = {
        content: replyText.trim(),
        post_id: postId,
        author_id: user.id,
      }

      await createBoardReply(replyData)
      
      // 返信一覧を再取得
      const supabase = createClient()
      const { data: repliesData, error: repliesError } = await supabase
        .from('board_replies')
        .select(`
          *,
          profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      
      if (repliesError) {
        console.error('Error fetching replies:', repliesError)
      } else {
        // 各返信に対してユーザーがいいねしているかチェック（テーブルが存在する場合のみ）
        const repliesWithLikeStatus = await Promise.all(
          (repliesData || []).map(async (reply) => {
            const isLiked = user && likeTableExists ? await checkUserLikedReply(reply.id, user.id) : false
            return {
              ...reply,
              isLiked
            }
          })
        )
        setReplies(repliesWithLikeStatus)
      }
      
      // フォームをリセット
      setReplyText('')
      
    } catch (err) {
      console.error('返信の投稿に失敗しました:', err)
      alert(`返信の投稿に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!user) {
      alert('ログインが必要です')
      return
    }

    setReplyToDelete(replyId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteReply = async () => {
    if (!replyToDelete) return

    try {
      console.log('Deleting reply:', replyToDelete)
      await deleteBoardReplyByUser(replyToDelete)
      console.log('Reply deleted successfully')
      
      // 返信一覧を更新
      setReplies(replies.filter(reply => reply.id !== replyToDelete))
      
      // データベースから再取得して確認
      const supabase = createClient()
      const { data: repliesData, error: repliesError } = await supabase
        .from('board_replies')
        .select(`
          *,
          profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      
      if (repliesError) {
        console.error('Error refetching replies:', repliesError)
      } else {
        console.log('Refetched replies:', repliesData)
        const repliesWithLikeStatus = (repliesData || []).map(reply => ({
          ...reply,
          isLiked: false
        }))
        setReplies(repliesWithLikeStatus)
      }
      
    } catch (err) {
      console.error('返信の削除に失敗しました:', err)
      console.error('Error details:', err)
      alert(`返信の削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    } finally {
      setShowDeleteConfirm(false)
      setReplyToDelete(null)
    }
  }

  const cancelDeleteReply = () => {
    setShowDeleteConfirm(false)
    setReplyToDelete(null)
  }

  const handleDeletePost = () => {
    if (!user) {
      alert('ログインが必要です')
      return
    }

    setShowPostDeleteConfirm(true)
  }

  const confirmDeletePost = async () => {
    if (!postId) return

    try {
      console.log('Deleting post:', postId)
      await deleteBoardPost(postId)
      console.log('Post deleted successfully')
      
      // 削除成功後、掲示板一覧に戻る
      router.push('/board')
      
    } catch (err) {
      console.error('投稿の削除に失敗しました:', err)
      console.error('Error details:', err)
      alert(`投稿の削除に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    } finally {
      setShowPostDeleteConfirm(false)
    }
  }

  const cancelDeletePost = () => {
    setShowPostDeleteConfirm(false)
  }

  const handleToggleLike = async (replyId: string) => {
    if (!user) {
      alert('ログインが必要です')
      return
    }

    if (!likeTableExists) {
      alert('いいね機能を利用するためのテーブルが存在しません。管理者にお問い合わせください。')
      return
    }

    try {
      await ensureProfileExists(user.id, user.email || '')
      
      const reply = replies.find(r => r.id === replyId)
      if (!reply) return

      if (reply.isLiked) {
        await unlikeBoardReply(replyId, user.id)
      } else {
        await likeBoardReply(replyId, user.id)
      }
      
      // 返信一覧を更新
      setReplies(replies.map(r => 
        r.id === replyId 
          ? { 
              ...r, 
              isLiked: !r.isLiked, 
              like_count: (r.like_count || 0) + (r.isLiked ? -1 : 1)
            }
          : r
      ))
      
    } catch (err) {
      console.error('いいねの更新に失敗しました:', err)
      console.error('Error details:', err)
      alert(`いいねの更新に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-black dark:text-white">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">{error || '投稿が見つかりません'}</h1>
          <Link href="/board" className="text-primary hover:underline">
            掲示板に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/board"
          className="inline-flex items-center gap-2 text-black dark:text-white hover:text-primary mb-6"
        >
          <ArrowLeft size={20} />
          掲示板に戻る
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm text-primary mb-2">{post.board_categories.name}</div>
                <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">{post.title}</h1>
                <div className="flex items-center gap-4 text-sm text-black dark:text-white">
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span>{post.profiles.display_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{mounted && post.created_at ? new Date(post.created_at).toLocaleDateString('ja-JP') : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={16} />
                    <span>返信 {replies.length}</span>
                  </div>
                  <div>閲覧 {post.view_count || 0}</div>
                </div>
              </div>
              
              {user && user.id === post.author_id && (
                <button
                  onClick={handleDeletePost}
                  className="text-red-500 hover:text-red-700 p-2 rounded"
                  title="投稿を削除"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-black dark:text-white">{post.content}</pre>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-black dark:text-white">
            <Reply size={20} />
            返信 ({replies.length})
          </h2>

          <div className="space-y-4">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-black dark:text-white">
                    <div className="flex items-center gap-1">
                      <User size={16} />
                      <span className="font-medium">{reply.profiles.display_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{mounted && reply.created_at ? new Date(reply.created_at).toLocaleDateString('ja-JP') : ''}</span>
                    </div>
                  </div>
                  
                  {user && user.id === reply.author_id && (
                    <button
                      onClick={() => handleDeleteReply(reply.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="prose dark:prose-invert mb-4">
                  <p className="text-black dark:text-white">{reply.content}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {likeTableExists && (
                    <button
                      onClick={() => handleToggleLike(reply.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                        reply.isLiked 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Heart size={14} fill={reply.isLiked ? 'currentColor' : 'none'} />
                      <span>{reply.like_count || 0}</span>
                    </button>
                  )}
                  
                  {!likeTableExists && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                      <Heart size={14} />
                      <span>-</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">返信を投稿</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="返信を入力してください..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitReply}
                disabled={submitting || !replyText.trim()}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '投稿中...' : '返信を投稿'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
              返信を削除
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              この返信を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelDeleteReply}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDeleteReply}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 投稿削除確認ダイアログ */}
      {showPostDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white">
              投稿を削除
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              この投稿を削除しますか？この操作は取り消せません。<br />
              関連する返信もすべて削除されます。
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelDeletePost}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDeletePost}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}