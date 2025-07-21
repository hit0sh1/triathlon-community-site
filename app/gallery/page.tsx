'use client'

import { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Filter, Plus, X, Upload, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'
import ImageUploader from '@/components/ImageUploader'

type Photo = Database['public']['Tables']['gallery_photos']['Row'] & {
  profiles: {
    display_name: string
    username: string
  }
  gallery_photo_tags: {
    tag: string
  }[]
}

type NewPhotoForm = {
  photo_url: string
  caption: string
  category: string
  tags: string
}

export default function GalleryPage() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState('全て')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postForm, setPostForm] = useState<NewPhotoForm>({
    photo_url: '',
    caption: '',
    category: '練習',
    tags: ''
  })
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const categories = ['全て', '大会', '練習']

  const filteredPhotos = selectedCategory === '全て' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('gallery_photos')
        .select(`
          *,
          profiles (display_name, username),
          gallery_photo_tags (tag)
        `)
        .order('created_at', { ascending: false })

      // deleted_atカラムが存在する場合のみフィルタリング
      try {
        query = query.is('deleted_at', null)
      } catch (filterError) {
        console.log('deleted_at column not found, skipping filter')
      }

      const { data, error } = await query

      if (error) throw error
      setPhotos(data as Photo[])
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostPhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setUploading(true)
      
      // Insert photo
      const { data: photoData, error: photoError } = await supabase
        .from('gallery_photos')
        .insert({
          user_id: user.id,
          photo_url: postForm.photo_url,
          caption: postForm.caption,
          category: postForm.category
        })
        .select()
        .single()

      if (photoError) throw photoError

      // Insert tags
      if (postForm.tags.trim()) {
        const tags = postForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        const tagInserts = tags.map(tag => ({
          photo_id: photoData.id,
          tag: tag.startsWith('#') ? tag : `#${tag}`
        }))
        
        const { error: tagError } = await supabase
          .from('gallery_photo_tags')
          .insert(tagInserts)
        
        if (tagError) throw tagError
      }

      // Reset form and refresh photos
      setPostForm({
        photo_url: '',
        caption: '',
        category: '練習',
        tags: ''
      })
      setShowPostForm(false)
      await fetchPhotos()
    } catch (error) {
      console.error('Error posting photo:', error)
      alert('写真の投稿に失敗しました。もう一度お試しください。')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!user) return
    
    if (!confirm('この写真を削除してもよろしいですか？')) return

    try {
      // ユーザー削除: 論理削除のみ（自分の写真のみ削除可能）
      const { error } = await supabase
        .from('gallery_photos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', photoId)
        .eq('user_id', user.id) // 自分の写真のみ削除可能

      if (error) throw error
      
      await fetchPhotos()
      setSelectedPhoto(null)
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('写真の削除に失敗しました。')
    }
  }

  const handleDeletePhotoByAdmin = async (photoId: string, deletionReason: string) => {
    if (!user) return
    
    if (!deletionReason) {
      alert('削除理由を入力してください。')
      return
    }
    
    const confirmMessage = `この写真を管理者として削除してもよろしいですか？\n理由: ${deletionReason}`
    if (!confirm(confirmMessage)) return

    try {
      // 写真の詳細を取得（通知用）
      const photoToDelete = selectedPhoto || photos.find(p => p.id === photoId)
      
      // 管理者削除: 論理削除 + 削除理由記録
      const { error } = await supabase
        .from('gallery_photos')
        .update({ 
          deleted_at: new Date().toISOString(),
          deletion_reason: deletionReason,
          deleted_by: user.id
        })
        .eq('id', photoId)

      if (error) throw error

      // 投稿者が削除者と異なる場合のみ通知を送信
      if (photoToDelete && photoToDelete.user_id !== user.id) {
        try {
          const { notifyAdminDeletion } = await import('@/lib/notifications')
          
          // 管理者情報を取得
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single()

          await notifyAdminDeletion(
            photoToDelete.user_id,
            'gallery',
            photoToDelete.caption || 'ギャラリー写真',
            adminProfile?.display_name || '管理者',
            deletionReason
          )
        } catch (notificationError) {
          console.error('Error sending deletion notification:', notificationError)
          // 通知エラーは削除処理を失敗させない
        }
      }
      
      await fetchPhotos()
      setSelectedPhoto(null)
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('写真の削除に失敗しました。')
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-4">フォトギャラリー</h1>
              <p className="text-xl">メンバーが投稿した練習・大会の写真</p>
            </div>
            {user && (
              <button
                onClick={() => setShowPostForm(true)}
                className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg"
              >
                <Plus size={20} />
                写真を投稿
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-black dark:text-white">カテゴリー</h2>
          </div>
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'ギャラリー写真'}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {photo.category}
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium mb-2 text-black dark:text-white">{photo.caption || 'キャプションなし'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{photo.profiles?.display_name || 'Unknown'}</span>
                  <span>•</span>
                  <span>{new Date(photo.created_at).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                      <Heart size={16} />
                      <span className="text-sm">{photo.like_count}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                      <MessageCircle size={16} />
                      <span className="text-sm">{photo.comment_count}</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {photo.gallery_photo_tags?.map((tagObj, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                    >
                      {tagObj.tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
              >
                <X size={20} />
              </button>
              {user && user.id === selectedPhoto.user_id && (
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="absolute top-4 right-16 text-white bg-red-500/80 rounded-full p-2 hover:bg-red-600/90 transition-colors z-10"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.caption || 'ギャラリー写真'}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">{selectedPhoto.caption || 'キャプションなし'}</h2>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-4">
                <span>{selectedPhoto.profiles?.display_name || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(selectedPhoto.created_at).toLocaleDateString('ja-JP')}</span>
                <span>•</span>
                <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                  {selectedPhoto.category}
                </span>
              </div>
              <div className="flex items-center gap-6 mb-4">
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
                  <Heart size={20} />
                  <span>{selectedPhoto.like_count} いいね</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  <MessageCircle size={20} />
                  <span>{selectedPhoto.comment_count} コメント</span>
                </button>
                <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors">
                  <Share2 size={20} />
                  <span>シェア</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPhoto.gallery_photo_tags?.map((tagObj, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm"
                  >
                    {tagObj.tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPostForm && user && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">写真を投稿</h2>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handlePostPhoto} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">写真</label>
                  <ImageUploader
                    onImageUpload={(url) => setPostForm({...postForm, photo_url: url})}
                    currentImage={postForm.photo_url}
                    onImageRemove={() => setPostForm({...postForm, photo_url: ''})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">キャプション</label>
                  <textarea
                    value={postForm.caption}
                    onChange={(e) => setPostForm({...postForm, caption: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={3}
                    placeholder="写真についてのコメント"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">カテゴリー</label>
                  <select
                    value={postForm.category}
                    onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="練習">練習</option>
                    <option value="大会">大会</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">タグ (カンマ区切り)</label>
                  <input
                    type="text"
                    value={postForm.tags}
                    onChange={(e) => setPostForm({...postForm, tags: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="トライアスロン, 沖縄, スイム"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPostForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {uploading ? '投稿中...' : '投稿'}
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