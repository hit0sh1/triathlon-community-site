'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CafePost from './CafePost'
import CafePostForm from './CafePostForm'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface CafePostListProps {
  cafeId: string
}

export default function CafePostList({ cafeId }: CafePostListProps) {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [cafeId])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      // まずは基本的な投稿データを取得
      const { data, error } = await supabase
        .from('cafe_posts')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        setPosts([])
        return
      }
      
      // モックデータでユーザー情報を追加
      const postsWithMockData = (data || []).map(post => ({
        ...post,
        user: {
          display_name: 'テストユーザー',
          avatar_url: null
        },
        comments: [],
        is_liked: false
      }))
      
      setPosts(postsWithMockData)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (data: { title: string; content: string; image?: File }) => {
    try {
      if (!user) {
        alert('ログインが必要です')
        return
      }

      const { data: postData, error } = await supabase
        .from('cafe_posts')
        .insert({
          cafe_id: cafeId,
          user_id: user.id,
          title: data.title,
          content: data.content,
          image_url: data.image ? URL.createObjectURL(data.image) : null
        })
        .select()

      if (error) throw error

      setShowForm(false)
      await fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('投稿の作成に失敗しました')
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (!user) {
        alert('ログインが必要です')
        return
      }

      if (isLiked) {
        await supabase
          .from('cafe_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('cafe_post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })
      }

      await fetchPosts()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleComment = async (postId: string, comment: string) => {
    try {
      if (!user) {
        alert('ログインが必要です')
        return
      }

      const { error } = await supabase
        .from('cafe_post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          comment: comment
        })

      if (error) throw error

      await fetchPosts()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('コメントの追加に失敗しました')
    }
  }

  const handleEdit = async (postId: string, data: { title: string; content: string }) => {
    try {
      const { error } = await supabase
        .from('cafe_posts')
        .update({
          title: data.title,
          content: data.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)

      if (error) throw error

      await fetchPosts()
    } catch (error) {
      console.error('Error editing post:', error)
      alert('投稿の編集に失敗しました')
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('cafe_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      await fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('投稿の削除に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">投稿一覧</h2>
        {user ? (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            投稿する
          </Button>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            投稿するには<a href="/auth/signin" className="text-primary hover:underline">ログイン</a>が必要です
          </div>
        )}
      </div>

      {showForm && (
        <CafePostForm
          cafeId={cafeId}
          onSubmit={handleCreatePost}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            読み込み中...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            まだ投稿がありません
          </div>
        ) : (
          posts.map((post) => (
            <CafePost
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onLike={handleLike}
              onComment={handleComment}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}