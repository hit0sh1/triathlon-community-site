'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Activity, Filter, Star, Plus } from 'lucide-react'
import StarRating from '@/components/StarRating'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

type Course = Database['public']['Tables']['courses']['Row'] & {
  average_rating?: number
  rating_count?: number
}

const types = ['すべて', 'ラン', 'バイク', 'スイム']

export default function CoursesPage() {
  const [selectedArea, setSelectedArea] = useState('すべて')
  const [selectedType, setSelectedType] = useState('すべて')
  const [showFilters, setShowFilters] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [areas, setAreas] = useState<string[]>(['すべて'])
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  useEffect(() => {
    fetchCourses()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin()
      setUserIsAdmin(adminStatus)
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching courses:', error)
        return
      }

      setCourses(data || [])
      
      // Extract unique areas from the courses
      const uniqueAreas = Array.from(new Set(data?.map(course => course.area) || []))
      setAreas(['すべて', ...uniqueAreas])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter((course) => {
    const areaMatch = selectedArea === 'すべて' || course.area === selectedArea
    const typeMatch = selectedType === 'すべて' || course.type === selectedType
    return areaMatch && typeMatch
  })

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

  return (
    <div className="bg-white dark:bg-black min-h-screen">
      <div className="gradient-premium text-white py-16">
        <div className="container-premium">
          {/* PC Layout */}
          <div className="hidden lg:flex justify-between items-center">
            <div>
              <h1 className="heading-1 mb-4 japanese-text text-white">おすすめコース</h1>
              <p className="body-large text-white">沖縄の美しい自然を満喫できるトレーニングコース</p>
            </div>
            {userIsAdmin && (
              <Link
                href="/courses/create"
                className="btn-primary bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 font-bold shadow-xl cursor-pointer"
                onClick={() => console.log('Create course button clicked (PC)')}
              >
                <Plus size={20} className="mr-2" />
                新しいコースを投稿
              </Link>
            )}
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="text-center mb-8">
              <h1 className="heading-1 mb-4 japanese-text text-white">おすすめコース</h1>
              <p className="body-large text-white">沖縄の美しい自然を満喫できるトレーニングコース</p>
            </div>
            {userIsAdmin && (
              <div className="text-center">
                <Link
                  href="/courses/create"
                  className="btn-primary bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 font-bold shadow-xl cursor-pointer"
                  onClick={() => console.log('Create course button clicked (Mobile)')}
                >
                  <Plus size={20} className="mr-2" />
                  新しいコースを投稿
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-premium py-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Filter button clicked, current showFilters:', showFilters)
              setShowFilters(!showFilters)
            }}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer z-10 relative text-gray-900 dark:text-white"
            style={{ pointerEvents: 'auto' }}
          >
            <Filter size={20} />
            フィルター {showFilters ? '(閉じる)' : '(開く)'}
          </button>

          {showFilters && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">種目</label>
                  <div className="flex flex-wrap gap-2">
                    {types.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Type button clicked:', type)
                          setSelectedType(type)
                        }}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-300 cursor-pointer relative z-10 ${
                          selectedType === type
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-white">エリア</label>
                  <div className="flex flex-wrap gap-2">
                    {areas.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('Area button clicked:', area)
                          setSelectedArea(area)
                        }}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-300 cursor-pointer relative z-10 ${
                          selectedArea === area
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">読み込み中...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden hover:shadow-2xl dark:hover:shadow-gray-900/80 transition-all duration-500 hover:scale-105 border border-gray-200 dark:border-gray-700"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={course.image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'}
                      alt={course.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-black/30 dark:bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/20">
                      <span className="text-lg mr-2">{getTypeIcon(course.type)}</span>
                      <span className="text-sm font-semibold text-white">{course.type}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800">
                    <h3 className="text-xl font-bold mb-2 japanese-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-gray-900 dark:text-white">{course.name}</h3>
                    
                    {/* 評価表示 */}
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating 
                        rating={course.average_rating || 0} 
                        readonly 
                        size="sm" 
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {course.average_rating ? `${course.average_rating.toFixed(1)} (${course.rating_count || 0})` : '未評価'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin size={16} />
                        <span className="text-sm font-medium">{course.area}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Activity size={16} />
                        <span className="text-sm font-bold">{course.distance}km</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredCourses.length === 0 && !loading && (
              <div className="text-center py-16">
                <p className="text-gray-600 dark:text-gray-300">
                  該当するコースが見つかりませんでした
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}