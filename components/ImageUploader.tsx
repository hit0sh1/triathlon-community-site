'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploaderProps {
  onImageUpload: (url: string) => void
  currentImage?: string
  onImageRemove?: () => void
}

export default function ImageUploader({ onImageUpload, currentImage, onImageRemove }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileUpload = async (file: File) => {
    if (!file) return
    
    const fileExt = file.name.split('.').pop()
    const fileName = `gallery/${Date.now()}.${fileExt}`
    
    setIsUploading(true)
    
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      onImageUpload(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('画像のアップロードに失敗しました。')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  if (currentImage) {
    return (
      <div className="relative">
        <img 
          src={currentImage} 
          alt="アップロード済み画像" 
          className="w-full h-48 object-cover rounded-lg"
        />
        <button
          onClick={onImageRemove}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">アップロード中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 mb-4">
              <ImageIcon size={32} className="text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              画像をドラッグ&ドロップするか、クリックして選択
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              JPG、PNG、GIF対応
            </p>
          </div>
        )}
      </div>
    </div>
  )
}