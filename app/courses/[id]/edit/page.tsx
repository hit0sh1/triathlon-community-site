'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { getCourse, updateCourse, getCourseTypes, getDifficultyLevels, getAreas, CourseWithDetails } from '@/lib/courses'
import { canManageContent } from '@/lib/admin'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<CourseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ラン' as 'ラン' | 'バイク' | 'スイム',
    distance: '',
    area: '',
    difficulty_level: '',
    elevation_gain: '',
    map_url: '',
    image_url: '',
    is_featured: false,
  })

  const courseTypes = getCourseTypes()
  const difficultyLevels = getDifficultyLevels()
  const areas = getAreas()

  useEffect(() => {
    const fetchCourseAndCheckPermission = async () => {
      try {
        setLoading(true)
        
        // ユーザー情報を取得
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)
        
        // コース情報を取得
        const courseData = await getCourse(courseId)
        if (!courseData) {
          setError('コースが見つかりませんでした')
          return
        }
        setCourse(courseData)
        
        // 権限チェック
        const permission = await canManageContent(courseData.created_by || '')
        if (!permission) {
          setError('編集権限がありません。管理者または投稿者のみ編集できます。')
          return
        }
        setHasPermission(true)
        
        // フォームデータを設定
        setFormData({
          name: courseData.name || '',
          description: courseData.description || '',
          type: courseData.type as 'ラン' | 'バイク' | 'スイム',
          distance: courseData.distance ? courseData.distance.toString() : '',
          area: courseData.area || '',
          difficulty_level: courseData.difficulty_level ? courseData.difficulty_level.toString() : '',
          elevation_gain: courseData.elevation_gain ? courseData.elevation_gain.toString() : '',
          map_url: courseData.map_url || '',
          image_url: courseData.image_url || '',
          is_featured: courseData.is_featured || false,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourseAndCheckPermission()
    }
  }, [courseId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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
      const filePath = `courses/${fileName}`

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!course || !hasPermission) return

    setSaving(true)
    setError(null)

    try {
      // 基本的なバリデーション
      if (!formData.name || !formData.type || !formData.distance || !formData.area) {
        throw new Error('必須フィールドを入力してください')
      }

      // 更新データを準備
      const updateData = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        distance: parseFloat(formData.distance),
        area: formData.area,
        difficulty_level: formData.difficulty_level ? parseInt(formData.difficulty_level) : undefined,
        elevation_gain: formData.elevation_gain ? parseInt(formData.elevation_gain) : undefined,
        map_url: formData.map_url || undefined,
        image_url: formData.image_url || undefined,
        is_featured: formData.is_featured,
      }

      await updateCourse(courseId, updateData)
      router.push(`/courses/${courseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コースの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course || !hasPermission) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">エラー: {error || 'コースが見つかりませんでした'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </button>
          <h1 className="text-3xl font-bold text-black dark:text-white">コースを編集</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            コース情報を更新してください
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">基本情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  コース名 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  種目 *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                  required
                >
                  {courseTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  距離 (km) *
                </label>
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  エリア *
                </label>
                <select
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                  required
                >
                  <option value="">選択してください</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  難易度
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                >
                  <option value="">選択してください</option>
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label} - {level.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  標高差 (m)
                </label>
                <input
                  type="number"
                  name="elevation_gain"
                  value={formData.elevation_gain}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                コース説明
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                placeholder="コースの特徴や注意点を入力してください"
              />
            </div>
          </div>

          {/* その他の情報 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-4">その他</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  地図URL
                </label>
                <input
                  type="url"
                  name="map_url"
                  value={formData.map_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-black dark:text-white"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    おすすめコースとして表示する
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={20} />
              <span>{saving ? '更新中...' : '更新'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}