'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import CafePostForm from '@/components/cafes/CafePostForm'

export default function EditCafePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [cafe, setCafe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchCafe()
  }, [user, params.id])

  const fetchCafe = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        'https://glkltvfyvgtfwjzlfjin.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsa2x0dmZ5dmd0ZndqemxmamluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc4NzEsImV4cCI6MjA2ODAzMzg3MX0.6C5C9YlkyQVROB91mk31K4qaWHIHjkH1QIv1ONInHZM'
      )

      const { data: cafeData, error } = await supabase
        .from('cafe_posts')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error || !cafeData) {
        router.push('/cafes')
        return
      }

      setCafe(cafeData)
    } catch (error) {
      console.error('Error fetching cafe:', error)
      router.push('/cafes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg">カフェが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <CafePostForm initialData={cafe} isEdit={true} />
    </div>
  )
}