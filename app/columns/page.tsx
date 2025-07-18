'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, Calendar, Eye, User, Edit, Trash2, Search, Filter, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getColumns, deleteColumn, Column } from '@/lib/columns'
import { toast } from 'react-hot-toast'

export default function ColumnsPage() {
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const { user } = useAuth()

  useEffect(() => {
    fetchColumns()
  }, [])

  const fetchColumns = async () => {
    try {
      const data = await getColumns()
      setColumns(data)
    } catch (error) {
      console.error('Error fetching columns:', error)
      toast.error('コラムの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (columnId: string) => {
    if (!confirm('このコラムを削除してもよろしいですか？')) return

    try {
      await deleteColumn(columnId)
      setColumns(columns.filter(column => column.id !== columnId))
      toast.success('コラムを削除しました')
    } catch (error) {
      console.error('Error deleting column:', error)
      toast.error('コラムの削除に失敗しました')
    }
  }

  const filteredColumns = columns.filter(column => {
    const matchesSearch = column.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         column.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || column.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const sortedColumns = [...filteredColumns].sort((a, b) => {
    switch (sortBy) {
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'title':
        return a.title.localeCompare(b.title)
      case 'view_count':
        return (b.view_count || 0) - (a.view_count || 0)
      default:
        return 0
    }
  })

  const categories = [
    { id: 'all', name: 'すべて' },
    { id: 'training', name: 'トレーニング' },
    { id: 'nutrition', name: '栄養・食事' },
    { id: 'gear', name: 'ギア・装備' },
    { id: 'race', name: 'レース' },
    { id: 'beginner', name: '初心者向け' },
    { id: 'general', name: '一般' },
  ]

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training':
        return '🏃‍♂️'
      case 'nutrition':
        return '🥗'
      case 'gear':
        return '⚙️'
      case 'race':
        return '🏆'
      case 'beginner':
        return '🌟'
      default:
        return '📝'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="container-premium py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="container-premium py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-black dark:text-white japanese-text mb-2">
              トライアスロンコラム
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              専門家による役立つ情報をお届けします
            </p>
          </div>
          {user && (
            <Link
              href="/columns/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Plus size={20} />
              新しいコラムを作成
            </Link>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="コラムを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">新しい順</option>
              <option value="title">タイトル順</option>
              <option value="view_count">閲覧数順</option>
            </select>
          </div>
        </div>

        {/* Featured Columns */}
        {columns.some(column => column.is_featured) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black dark:text-white japanese-text mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={24} />
              注目のコラム
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {columns.filter(column => column.is_featured).slice(0, 3).map((column) => (
                <Link
                  key={column.id}
                  href={`/columns/${column.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-video">
                    <img
                      src={column.image_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop'}
                      alt={column.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        注目
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {getCategoryIcon(column.category || '')} {categories.find(c => c.id === column.category)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-blue-600 transition-colors mb-2">
                      {column.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {column.excerpt || column.content.substring(0, 100) + '...'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(column.created_at).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye size={16} />
                        {column.view_count || 0}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Columns */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-black dark:text-white japanese-text mb-4">
            すべてのコラム ({sortedColumns.length})
          </h2>
        </div>

        {sortedColumns.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'all' ? '条件に一致するコラムが見つかりませんでした' : 'まだコラムがありません'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedColumns.map((column) => (
              <div key={column.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                <Link href={`/columns/${column.id}`} className="group block">
                  <div className="relative aspect-video">
                    <img
                      src={column.image_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop'}
                      alt={column.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {getCategoryIcon(column.category || '')} {categories.find(c => c.id === column.category)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-blue-600 transition-colors mb-2">
                      {column.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {column.excerpt || column.content.substring(0, 100) + '...'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {new Date(column.created_at).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye size={16} />
                        {column.view_count || 0}
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Author Actions */}
                {user && column.created_by === user.id && (
                  <div className="px-6 pb-4 flex items-center gap-2">
                    <Link
                      href={`/columns/${column.id}/edit`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Edit size={16} />
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(column.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                    >
                      <Trash2 size={16} />
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}