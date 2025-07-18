'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Activity, FileText, Mountain, Upload, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

const types = ['ラン', 'バイク', 'スイム']

export default function CreateCoursePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    type: '',
    distance: '',
    description: '',
    image_url: '',
    difficulty_level: 1,
    elevation_gain: '',
    map_url: '',
    is_featured: false
  })
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'コース名は必須です'
    if (!formData.area.trim()) newErrors.area = 'エリアは必須です'
    if (!formData.type) newErrors.type = '種目を選択してください'
    if (!formData.distance || parseFloat(formData.distance) <= 0) newErrors.distance = '正しい距離を入力してください'
    if (!formData.description.trim()) newErrors.description = '説明は必須です'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('ログインが必要です。')
        return
      }
      
      const supabaseClient = createClient()
      
      // ファイル名を生成（ユーザーIDとタイムスタンプを使用）
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `courses/${fileName}`

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabaseClient.storage
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
      const { data: { publicUrl } } = supabaseClient.storage
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      // エラーメッセージをクリア
      setErrorMessage(null)
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErrorMessage('投稿するにはログインが必要です')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
        return
      }

      // Insert course data
      const { error } = await supabase
        .from('courses')
        .insert([{
          name: formData.name,
          description: formData.description,
          type: formData.type,
          distance: parseFloat(formData.distance),
          area: formData.area,
          difficulty_level: formData.difficulty_level,
          elevation_gain: formData.elevation_gain ? parseInt(formData.elevation_gain) : null,
          map_url: formData.map_url || null,
          image_url: formData.image_url || null,
          is_featured: formData.is_featured,
          created_by: user.id
        }])

      if (error) {
        console.error('Error creating course:', error)
        setErrorMessage('コースの投稿に失敗しました: ' + error.message)
        return
      }

      setSuccessMessage('コースが正常に投稿されました！')
      setTimeout(() => {
        router.push('/courses')
      }, 2000)
    } catch (error) {
      console.error('Error creating course:', error)
      setErrorMessage('コースの投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white py-16">
        <div className="container-premium">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/courses"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              戻る
            </Link>
          </div>
          <h1 className="heading-1 mb-4 japanese-text">新しいコースを投稿</h1>
          <p className="body-large">あなたのおすすめコースをコミュニティと共有しましょう</p>
        </div>
      </div>

      <div className="container-premium py-8">
        <div className="max-w-2xl mx-auto">
          {/* 成功メッセージ */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-400 font-medium">{successMessage}</p>
            </div>
          )}
          
          {/* エラーメッセージ */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-400 font-medium">{errorMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6 japanese-text text-gray-900 dark:text-white">基本情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <FileText size={16} className="inline mr-2" />
                    コース名 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="例: 海中道路サイクリングコース"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <MapPin size={16} className="inline mr-2" />
                    エリア *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.area ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="例: うるま市"
                  />
                  {errors.area && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.area}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">種目 *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  >
                    <option value="">種目を選択</option>
                    {types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <Activity size={16} className="inline mr-2" />
                    距離 (km) *
                  </label>
                  <input
                    type="number"
                    name="distance"
                    value={formData.distance}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.distance ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="例: 25.5"
                  />
                  {errors.distance && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.distance}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">説明 *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="コースの特徴、見どころ、注意点などを詳しく説明してください"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6 japanese-text text-gray-900 dark:text-white">詳細情報</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">難易度 (1-5)</label>
                    <select
                      name="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value={1}>1 - 初心者向け</option>
                      <option value={2}>2 - 初級</option>
                      <option value={3}>3 - 中級</option>
                      <option value={4}>4 - 上級</option>
                      <option value={5}>5 - エキスパート</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      <Mountain size={16} className="inline mr-2" />
                      標高差 (m)
                    </label>
                    <input
                      type="number"
                      name="elevation_gain"
                      value={formData.elevation_gain}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="例: 150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">マップURL</label>
                  <input
                    type="url"
                    name="map_url"
                    value={formData.map_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="例: https://maps.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    <Upload size={16} className="inline mr-2" />
                    コース画像
                  </label>
                  <div className="space-y-4">
                    {formData.image_url && (
                      <div className="relative">
                        <img
                          src={formData.image_url}
                          alt="コース画像プレビュー"
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
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

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      おすすめコースとして表示する
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/courses"
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '投稿中...' : 'コースを投稿'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}