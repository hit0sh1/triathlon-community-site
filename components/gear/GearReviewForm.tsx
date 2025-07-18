'use client'

import { useState, useEffect } from 'react'
import { X, Star, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getGearCategories, createGearReview, updateGearReview } from '@/lib/gear'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import type { GearCategory, GearReviewWithDetails } from '@/lib/gear'

interface GearReviewFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  editingReview?: any
}

interface FormData {
  productName: string
  brand: string
  categoryId: string
  rating: number
  price: string
  summary: string
  detailedReview: string
  pros: string[]
  cons: string[]
  imageUrl: string
}

export default function GearReviewForm({ isOpen, onClose, onSubmit, editingReview }: GearReviewFormProps) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<GearCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    brand: '',
    categoryId: '',
    rating: 5,
    price: '',
    summary: '',
    detailedReview: '',
    pros: ['', '', ''],
    cons: ['', '', ''],
    imageUrl: ''
  })

  useEffect(() => {
    async function fetchCategories() {
      const categoriesData = await getGearCategories()
      setCategories(categoriesData)
      if (categoriesData.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: categoriesData[0].id }))
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (editingReview) {
      setFormData({
        productName: editingReview.product_name,
        brand: editingReview.brand || '',
        categoryId: editingReview.category_id || '',
        rating: editingReview.rating,
        price: editingReview.price || '',
        summary: editingReview.summary || '',
        detailedReview: editingReview.detailed_review || '',
        pros: [
          ...editingReview.gear_review_pros.map((p: any) => p.pro_point),
          ...Array(Math.max(0, 3 - editingReview.gear_review_pros.length)).fill('')
        ].slice(0, 3),
        cons: [
          ...editingReview.gear_review_cons.map((c: any) => c.con_point),
          ...Array(Math.max(0, 3 - editingReview.gear_review_cons.length)).fill('')
        ].slice(0, 3),
        imageUrl: editingReview.image_url || ''
      })
    } else {
      setFormData({
        productName: '',
        brand: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        rating: 5,
        price: '',
        summary: '',
        detailedReview: '',
        pros: ['', '', ''],
        cons: ['', '', ''],
        imageUrl: ''
      })
    }
  }, [editingReview, categories])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: 'pros' | 'cons', index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData(prev => ({
      ...prev,
      [field]: newArray
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
      const filePath = `gear-reviews/${fileName}`

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
        imageUrl: publicUrl
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
    
    if (!user) {
      alert('ログインが必要です')
      return
    }

    if (!formData.productName.trim() || !formData.categoryId) {
      alert('商品名とカテゴリーは必須です')
      return
    }

    setLoading(true)

    try {
      const reviewData = {
        categoryId: formData.categoryId,
        userId: user.id,
        productName: formData.productName.trim(),
        brand: formData.brand.trim() || undefined,
        rating: formData.rating,
        price: formData.price.trim() || undefined,
        imageUrl: formData.imageUrl || undefined,
        summary: formData.summary.trim() || undefined,
        detailedReview: formData.detailedReview.trim() || undefined,
        pros: formData.pros.filter(pro => pro.trim()),
        cons: formData.cons.filter(con => con.trim())
      }

      let success = false

      if (editingReview) {
        success = await updateGearReview(editingReview.id, reviewData)
      } else {
        const reviewId = await createGearReview(reviewData)
        success = reviewId !== null
      }

      if (success) {
        onSubmit()
        onClose()
      } else {
        alert('レビューの投稿に失敗しました')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('レビューの投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!editingReview) {
      setFormData({
        productName: '',
        brand: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        rating: 5,
        price: '',
        summary: '',
        detailedReview: '',
        pros: ['', '', ''],
        cons: ['', '', ''],
        imageUrl: ''
      })
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingReview ? 'レビューを編集' : 'レビューを投稿'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">商品名 *</label>
            <Input
              type="text"
              value={formData.productName}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              placeholder="例: ZOOT トライスーツ Ultra 2.0"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">ブランド</label>
            <Input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="例: ZOOT"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">カテゴリー *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">評価 *</label>
            <div className="flex gap-1 items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleInputChange('rating', star)}
                  className={`p-1 transition-colors ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} hover:scale-110`}
                >
                  <Star size={24} className="fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                {formData.rating}/5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">価格</label>
            <Input
              type="text"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="例: 25,000円"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              <Upload size={16} className="inline mr-2" />
              商品画像
            </label>
            <div className="space-y-4">
              {formData.imageUrl && (
                <div className="relative">
                  <img
                    src={formData.imageUrl}
                    alt="商品画像プレビュー"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
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
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">レビュー要約 *</label>
            <Textarea
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              rows={3}
              placeholder="商品の総合的な感想を入力してください..."
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">詳細レビュー</label>
            <Textarea
              value={formData.detailedReview}
              onChange={(e) => handleInputChange('detailedReview', e.target.value)}
              rows={5}
              placeholder="商品の詳細な使用感やレビューを入力してください..."
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">良い点</label>
            {formData.pros.map((pro, index) => (
              <Input
                key={index}
                type="text"
                value={pro}
                onChange={(e) => handleArrayChange('pros', index, e.target.value)}
                placeholder={`良い点 ${index + 1}`}
                className="mb-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">悪い点</label>
            {formData.cons.map((con, index) => (
              <Input
                key={index}
                type="text"
                value={con}
                onChange={(e) => handleArrayChange('cons', index, e.target.value)}
                placeholder={`悪い点 ${index + 1}`}
                className="mb-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? '投稿中...' : editingReview ? '更新する' : '投稿する'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}