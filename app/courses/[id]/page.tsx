'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Activity, ArrowLeft, Trash2, Mountain, Star, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import CourseRatingSection from '@/components/CourseRatingSection'
import { getCourse, CourseWithDetails } from '@/lib/courses'
import { deleteCourseDirect } from '@/lib/courses-simple'
import { canManageContent } from '@/lib/admin'
import { createClient } from '@/lib/supabase/client'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const [course, setCourse] = useState<CourseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [canManage, setCanManage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourseAndCheckPermissions()
  }, [courseId])

  const fetchCourseAndCheckPermissions = async () => {
    try {
      setLoading(true)
      
      // ユーザー情報を取得
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // コース情報を取得
      const courseData = await getCourse(courseId)
      if (!courseData) {
        return
      }
      setCourse(courseData)

      // 管理権限をチェック
      if (user && courseData.created_by) {
        const permission = await canManageContent(courseData.created_by)
        setCanManage(permission)
      }
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!course || !currentUser) return

    setDeleting(true)
    setShowDeleteConfirm(false)
    try {
      // まずシンプルな削除機能を試す
      await deleteCourseDirect(courseId)
      
      // 削除成功時のメッセージを表示
      setTimeout(() => {
        router.push('/courses')
      }, 1000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'コースの削除に失敗しました'
      setError(errorMessage)
      setTimeout(() => {
        setError(null)
      }, 5000)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-black dark:text-white">コースが見つかりません</h1>
          <Link href="/courses" className="text-blue-600 hover:underline">
            コース一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ラン':
        return '🏃'
      case 'バイク':
        return '🚴'
      case 'スイム':
        return '🏊'
      default:
        return '🏃'
    }
  }

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return '初心者向け'
      case 2: return '初級'
      case 3: return '中級'
      case 4: return '上級'
      case 5: return 'エキスパート'
      default: return '未設定'
    }
  }

  return (
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            コース一覧に戻る
          </Link>
          
          {/* 管理者または投稿者のみ編集・削除ボタンを表示 */}
          {canManage && (
            <div className="flex items-center gap-2">
              <Link
                href={`/courses/${courseId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit size={16} />
                編集
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                {deleting ? '削除中...' : '削除'}
              </button>
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="aspect-video relative">
            <img
              src={course.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'}
              alt={course.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full">
              <span className="text-3xl mr-2">{getTypeIcon(course.type)}</span>
              <span className="text-lg font-medium text-black dark:text-white">{course.type}</span>
            </div>
          </div>

          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4 text-black dark:text-white">{course.name}</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin size={20} />
                <span>{course.area}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Activity size={20} />
                <span>{course.distance}km</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Star size={20} />
                <span>{getDifficultyText(course.difficulty_level || 1)}</span>
              </div>
              {course.elevation_gain && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mountain size={20} />
                  <span>{course.elevation_gain}m</span>
                </div>
              )}
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
            </div>

            {course.map_url && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">コースマップ</h2>
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <iframe
                    src={course.map_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            )}

            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                投稿日: {course.created_at ? new Date(course.created_at).toLocaleDateString('ja-JP') : '不明'}
              </p>
            </div>
          </div>
        </div>

        {/* Course Rating Section */}
        <div className="mt-8">
          <CourseRatingSection courseId={courseId} />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 text-black dark:text-white">コースを削除しますか？</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                この操作は取り消せません。本当にこのコースを削除しますか？
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}