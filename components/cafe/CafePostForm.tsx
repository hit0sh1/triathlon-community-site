'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageIcon, X } from 'lucide-react'

interface CafePostFormProps {
  cafeId: string
  onSubmit: (data: { title: string; content: string; image?: File }) => void
  onCancel: () => void
}

export default function CafePostForm({ cafeId, onSubmit, onCancel }: CafePostFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      image: image || undefined
    })

    setTitle('')
    setContent('')
    setImage(null)
    setImagePreview(null)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">新しい投稿</h3>
      
      <div className="space-y-4">
        <div>
          <Input
            placeholder="タイトルを入力してください"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <Textarea
            placeholder="内容を入力してください"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            required
          />
        </div>

        {imagePreview && (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <ImageIcon size={16} />
            画像を追加
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            投稿する
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    </form>
  )
}