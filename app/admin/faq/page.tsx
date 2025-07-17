'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

type FAQ = Database['public']['Tables']['faqs']['Row']
type FAQInsert = Database['public']['Tables']['faqs']['Insert']
type FAQUpdate = Database['public']['Tables']['faqs']['Update']

export default function AdminFAQPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    display_order: 0,
    is_published: true
  })
  const supabase = createClient()

  const categories = [
    { value: 'general', label: '一般的な質問' },
    { value: 'getting-started', label: '始める前に' },
    { value: 'training', label: 'トレーニング' },
    { value: 'equipment', label: '装備・道具' },
    { value: 'competition', label: '大会について' }
  ]

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchFAQs()
  }, [user, router])

  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error fetching FAQs:', error)
        toast.error('FAQの読み込みに失敗しました')
        return
      }

      setFaqs(data || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      toast.error('FAQの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!user || !formData.question.trim() || !formData.answer.trim()) {
      toast.error('質問と回答を入力してください')
      return
    }

    try {
      const insertData: FAQInsert = {
        ...formData,
        created_by: user.id,
        updated_by: user.id
      }

      const { error } = await supabase
        .from('faqs')
        .insert(insertData)

      if (error) {
        console.error('Error adding FAQ:', error)
        toast.error('FAQの追加に失敗しました')
        return
      }

      toast.success('FAQを追加しました')
      setShowAddForm(false)
      setFormData({
        question: '',
        answer: '',
        category: 'general',
        display_order: 0,
        is_published: true
      })
      fetchFAQs()
    } catch (error) {
      console.error('Error adding FAQ:', error)
      toast.error('FAQの追加に失敗しました')
    }
  }

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'general',
      display_order: faq.display_order || 0,
      is_published: faq.is_published ?? true
    })
  }

  const handleUpdate = async (id: string) => {
    if (!user || !formData.question.trim() || !formData.answer.trim()) {
      toast.error('質問と回答を入力してください')
      return
    }

    try {
      const updateData: FAQUpdate = {
        ...formData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('faqs')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating FAQ:', error)
        toast.error('FAQの更新に失敗しました')
        return
      }

      toast.success('FAQを更新しました')
      setEditingId(null)
      fetchFAQs()
    } catch (error) {
      console.error('Error updating FAQ:', error)
      toast.error('FAQの更新に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('このFAQを削除しますか？')) {
      return
    }

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting FAQ:', error)
        toast.error('FAQの削除に失敗しました')
        return
      }

      toast.success('FAQを削除しました')
      fetchFAQs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('FAQの削除に失敗しました')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      display_order: 0,
      is_published: true
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
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
      
      {/* Header */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">FAQ管理</h1>
          <p className="text-xl opacity-90">
            よくある質問の作成・編集・削除ができます
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Add Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            新しいFAQを追加
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">新しいFAQを追加</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  質問
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="質問を入力してください"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  回答
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="回答を入力してください"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    表示順序
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    公開状態
                  </label>
                  <select
                    value={formData.is_published ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'true' })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="true">公開</option>
                    <option value="false">非公開</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Save size={16} />
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition-colors"
                >
                  <X size={16} />
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              {editingId === faq.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      質問
                    </label>
                    <input
                      type="text"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      回答
                    </label>
                    <textarea
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        カテゴリー
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        表示順序
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        公開状態
                      </label>
                      <select
                        value={formData.is_published ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'true' })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="true">公開</option>
                        <option value="false">非公開</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(faq.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      <Save size={16} />
                      更新
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} />
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          faq.is_published 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {faq.is_published ? '公開' : '非公開'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                          {categories.find(c => c.value === faq.category)?.label || faq.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          順序: {faq.display_order}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {faqs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg">
              FAQがまだ登録されていません
            </div>
          </div>
        )}
      </div>
    </div>
  )
}