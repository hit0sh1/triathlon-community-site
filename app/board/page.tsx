'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Users, Trophy, Coffee, Plus, Clock, User, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getBoardCategories, getBoardPosts, createBoardPost, BoardPostWithDetails } from '@/lib/board'
import { ensureProfileExists } from '@/lib/profile'
import { Database } from '@/types/database'

type BoardCategory = Database['public']['Tables']['board_categories']['Row']

const categoryIconMap = {
  '初心者質問': MessageSquare,
  '練習仲間募集': Users,
  '大会情報': Trophy,
  '雑談': Coffee,
}

export default function BoardPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPostForm, setShowPostForm] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    categoryId: ''
  })
  const [posts, setPosts] = useState<BoardPostWithDetails[]>([])
  const [categories, setCategories] = useState<BoardCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category_id === selectedCategory)

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)
  }

  const getCategoryIcon = (categoryName: string) => {
    return categoryIconMap[categoryName as keyof typeof categoryIconMap] || MessageSquare
  }

  // データベースからカテゴリーと投稿を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [categoriesData, postsData] = await Promise.all([
          getBoardCategories(),
          getBoardPosts()
        ])
        
        setCategories(categoriesData)
        setPosts(postsData)
        
        // 最初のカテゴリーをデフォルトとして設定
        if (categoriesData.length > 0) {
          setNewPost(prev => ({ ...prev, categoryId: categoriesData[0].id }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('タイトルと内容を入力してください')
      return
    }

    if (!user) {
      alert('ログインが必要です')
      return
    }

    try {
      // プロフィールの存在を確認し、必要に応じて作成
      await ensureProfileExists(user.id, user.email || '')
      
      const postData = {
        title: newPost.title,
        content: newPost.content,
        category_id: newPost.categoryId,
        author_id: user.id,
      }

      await createBoardPost(postData)
      
      // 投稿一覧を再取得
      const updatedPosts = await getBoardPosts()
      setPosts(updatedPosts)
      
      // フォームをリセット
      setNewPost({ title: '', content: '', categoryId: categories[0]?.id || '' })
      setShowPostForm(false)
      
    } catch (err) {
      console.error('投稿に失敗しました:', err)
      alert(`投稿に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`)
    }
  }

  const handleCancelPost = () => {
    setNewPost({ title: '', content: '', categoryId: categories[0]?.id || '' })
    setShowPostForm(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">掲示板</h1>
          <p className="text-xl">トライアスロン仲間と情報交換しよう</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">カテゴリー</h2>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-black dark:text-white ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    すべて
                  </button>
                </li>
                {categories.map((category) => {
                  const CategoryIcon = getCategoryIcon(category.name)
                  return (
                    <li key={category.id}>
                      <button
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-black dark:text-white ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <CategoryIcon size={18} className={selectedCategory === category.id ? 'text-white' : ''} style={{ color: selectedCategory === category.id ? 'white' : category.color || '#3B82F6' }} />
                        {category.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            <button
              onClick={() => setShowPostForm(true)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              新規投稿
            </button>
          </aside>

          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  {selectedCategory === 'all' ? 'すべての投稿' : getCategoryInfo(selectedCategory)?.name}
                </h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => {
                  const category = getCategoryInfo(post.category_id!)
                  const CategoryIcon = category ? getCategoryIcon(category.name) : MessageSquare
                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        router.push(`/board/posts/${post.id}`)
                      }}
                      className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative z-10 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {category && (
                              <div className="flex items-center gap-1 text-sm" style={{ color: category.color || '#3B82F6' }}>
                                <CategoryIcon size={16} />
                                <span>{category.name}</span>
                              </div>
                            )}
                          </div>
                          <h3 className="text-lg font-medium mb-2 text-black dark:text-white">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span>{post.profiles?.display_name || post.profiles?.username || '匿名ユーザー'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('ja-JP') : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div>返信 {post.reply_count}</div>
                          <div>閲覧 {post.view_count || 0}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {loading && (
                <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                  読み込み中...
                </div>
              )}
              
              {error && (
                <div className="p-16 text-center text-red-500">
                  エラー: {error}
                </div>
              )}
              
              {!loading && !error && filteredPosts.length === 0 && (
                <div className="p-16 text-center text-gray-500 dark:text-gray-400">
                  該当する投稿がありません
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 投稿フォームモーダル */}
      {showPostForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black dark:text-white">新規投稿</h2>
                <button
                  onClick={handleCancelPost}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitPost} className="space-y-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-black dark:text-white mb-2">
                    カテゴリー
                  </label>
                  <select
                    id="category"
                    value={newPost.categoryId}
                    onChange={(e) => setNewPost({ ...newPost, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-black dark:text-white mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="投稿のタイトルを入力してください"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-black dark:text-white mb-2">
                    内容
                  </label>
                  <textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                    placeholder="投稿の内容を入力してください"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    投稿する
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPost}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-black dark:text-white py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}