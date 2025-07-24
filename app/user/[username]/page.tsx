'use client'

import { useState, useEffect, use } from 'react'
import { Calendar, MapPin, MessageCircle, Activity, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = Database['public']['Tables']['profiles']['Row']
type MessageWithDetails = {
  id: string
  content: string
  created_at: string
  channel: {
    id: string
    name: string
  }
  reactions: Array<{
    id: string
    emoji_code: string
    user_id: string
  }>
  thread_reply_count: number
}

interface UserProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const supabase = createClient()
  
  // params を use() で unwrap
  const resolvedParams = use(params)

  useEffect(() => {
    fetchUserProfile()
  }, [resolvedParams.username])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      
      // ユーザープロフィールを取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', resolvedParams.username)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        if (profileError.code === 'PGRST116') {
          // ユーザーが見つからない場合
          router.push('/board')
        }
        return
      }

      setProfile(profileData)

      // ユーザーの最近のメッセージを取得
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          channel:channels!messages_channel_id_fkey (
            id,
            name
          ),
          reactions:reactions (
            id,
            emoji_code,
            user_id
          ),
          thread_reply_count
        `)
        .eq('author_id', profileData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!messagesError && messagesData) {
        setRecentMessages(messagesData as any[])
      }

      // メッセージ総数を取得
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profileData.id)

      setMessageCount(count || 0)

    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ユーザーが見つかりません
            </h1>
            <Link 
              href="/board"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft size={16} className="mr-2" />
              掲示板に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/board"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            掲示板に戻る
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0 mb-6 lg:mb-0">
              <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-gray-300">
                {profile.display_name?.[0] || profile.username?.[0] || '?'}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    @{profile.username}
                  </p>
                  {profile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4 lg:mb-0">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {isOwnProfile && (
                  <Link
                    href="/profile"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors self-start lg:self-auto"
                  >
                    プロフィールを編集
                  </Link>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                {profile.location && (
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-1" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  {formatDate(profile.created_at)}に参加
                </div>
                <div className="flex items-center">
                  <MessageCircle size={16} className="mr-1" />
                  {messageCount}件の投稿
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            最近の投稿
          </h2>

          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                まだ投稿がありません
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div 
                  key={message.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      #{message.channel.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 dark:text-white mb-3">
                    {truncateContent(message.content)}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    {message.reactions.length > 0 && (
                      <span>{message.reactions.length} リアクション</span>
                    )}
                    {message.thread_reply_count > 0 && (
                      <span>{message.thread_reply_count} 返信</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}