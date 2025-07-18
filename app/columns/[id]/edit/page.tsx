'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, Upload, X, Tag, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getColumn, updateColumn, getColumnCategories, ColumnWithDetails } from '@/lib/columns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function EditColumnPage() {
  const params = useParams()
  const router = useRouter()
  const columnId = params.id as string
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [column, setColumn] = useState<ColumnWithDetails | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    category: 'general',
    tags: [] as string[],
    is_published: false,
    is_featured: false,
  })
  const [newTag, setNewTag] = useState('')
  const [preview, setPreview] = useState(false)

  const categories = getColumnCategories()

  useEffect(() => {
    fetchColumn()
  }, [columnId])

  const fetchColumn = async () => {
    try {
      setInitialLoading(true)
      const columnData = await getColumn(columnId)
      if (!columnData) {
        toast.error('コラムが見つかりません')
        router.push('/columns')
        return
      }
      
      if (user && columnData.created_by !== user.id) {
        toast.error('このコラムを編集する権限がありません')
        router.push('/columns')
        return
      }

      setColumn(columnData)
      setFormData({
        title: columnData.title,
        content: columnData.content,
        excerpt: columnData.excerpt || '',
        image_url: columnData.image_url || '',
        category: columnData.category || '',
        tags: columnData.tags || [],
        is_published: columnData.is_published ?? false,
        is_featured: columnData.is_featured ?? false,
      })
    } catch (error) {
      console.error('Error fetching column:', error)
      toast.error('コラムの取得に失敗しました')
      router.push('/columns')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !column) return

    setLoading(true)
    try {
      await updateColumn(columnId, formData)
      toast.success('コラムを更新しました')
      router.push(`/columns/${columnId}`)
    } catch (error) {
      console.error('Error updating column:', error)
      toast.error('コラムの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // ファイル種類とサイズの確認
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください。')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB制限
      toast.error('ファイルサイズは5MB以下にしてください。')
      return
    }

    try {
      setUploadingImage(true)
      
      const supabase = createClient()
      
      // ファイル名を生成（ユーザーIDとタイムスタンプを使用）
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `columns/${fileName}`

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('画像のアップロードに失敗しました。')
        return
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // フォームデータを更新
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }))

      toast.success('画像がアップロードされました。')

    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('画像のアップロードに失敗しました。')
    } finally {
      setUploadingImage(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container-premium py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">ログインが必要です</h1>
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container-premium py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            href={`/columns/${columnId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            コラムに戻る
          </Link>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye size={16} />
              {preview ? 'エディター' : 'プレビュー'}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-black dark:text-white japanese-text mb-8">
            コラムを編集
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                タイトル *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="コラムのタイトルを入力してください"
                required
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                概要
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="コラムの概要を入力してください（オプション）"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                カテゴリー
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                タグ
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="タグを入力してEnterで追加"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      <Tag size={14} />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                コラム画像
              </label>
              <div className="space-y-4">
                {formData.image_url && (
                  <div className="relative">
                    <img
                      src={formData.image_url}
                      alt="コラム画像プレビュー"
                      className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('image_url', '')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">クリックして画像をアップロード</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG、JPG、GIF (最大5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    アップロード中...
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-2">
                内容 *
              </label>
              
              {preview ? (
                <div className="min-h-[400px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, '<br>') }}
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={20}
                  placeholder="コラムの内容を入力してください"
                  required
                />
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm text-black dark:text-white">
                  公開する
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="text-sm text-black dark:text-white">
                  注目記事にする
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? '更新中...' : 'コラムを更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}