'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Trophy, MessageCircle, FileText, Activity, Edit, Save, X, TrendingUp, Target, Clock, Award } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import StravaSection from '@/components/StravaSection'
import { getAvailableAchievements, addAchievement, deleteAchievement, checkAndGrantAchievements, AchievementTemplate, getUserAchievements, getUserStats, cleanupDuplicateAchievements } from '@/lib/achievements'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
type TrainingLog = Database['public']['Tables']['training_logs']['Row']
type BoardPost = Database['public']['Tables']['board_posts']['Row'] & {
  board_categories: {
    name: string
  }
}
type BoardReply = Database['public']['Tables']['board_replies']['Row'] & {
  board_posts: {
    title: string
  }
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [availableAchievements, setAvailableAchievements] = useState<AchievementTemplate[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [replies, setReplies] = useState<BoardReply[]>([])
  const [trainingData, setTrainingData] = useState<{
    thisMonth: { swim: number; bike: number; run: number }
    lastMonth: { swim: number; bike: number; run: number }
  }>({
    thisMonth: { swim: 0, bike: 0, run: 0 },
    lastMonth: { swim: 0, bike: 0, run: 0 }
  })
  const [editData, setEditData] = useState({
    display_name: '',
    bio: '',
    location: '',
    avatar_url: ''
  })
  const [updating, setUpdating] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchUserData()
  }, [user, router])

  const fetchUserData = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // プロフィール情報を取得
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        // プロフィールが存在しない場合は作成する
        if (profileError.code === 'PGRST116') {
          await createProfile()
        }
      } else {
        setProfile(profileData)
        setEditData({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          avatar_url: profileData.avatar_url || ''
        })
      }

      // 重複と英語の実績を削除
      await cleanupDuplicateAchievements(user.id)

      // 実績を取得
      const achievementsData = await getUserAchievements(user.id)
      setAchievements(achievementsData)

      // 自動的に新しい実績をチェックして付与
      try {
        const newAchievements = await checkAndGrantAchievements(user.id)
        if (newAchievements.length > 0) {
          // 新しい実績が付与された場合、実績リストを更新
          const updatedAchievements = await getUserAchievements(user.id)
          setAchievements(updatedAchievements)
          
          // 新しい実績の通知
          newAchievements.forEach(achievement => {
            toast.success(`🏆 新しい実績を獲得: ${achievement.title}`, {
              duration: 5000
            })
          })
        }
      } catch (error) {
        console.error('Error checking achievements:', error)
      }

      // ユーザー統計を取得
      const stats = await getUserStats(user.id)
      setUserStats(stats)

      // 利用可能な実績テンプレートを取得
      const allAchievements = getAvailableAchievements()
      const earnedTitles = new Set(achievementsData.map(a => a.title))
      const availableTemplates = allAchievements.filter(template => !earnedTitles.has(template.title))
      setAvailableAchievements(availableTemplates)

      // 投稿履歴を取得
      const { data: postsData, error: postsError } = await supabase
        .from('board_posts')
        .select(`
          *,
          board_categories (name)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
      } else {
        setPosts(postsData || [])
      }

      // コメント履歴を取得
      const { data: repliesData, error: repliesError } = await supabase
        .from('board_replies')
        .select(`
          *,
          board_posts (title)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (repliesError) {
        console.error('Error fetching replies:', repliesError)
      } else {
        setReplies(repliesData || [])
      }

      // トレーニングデータを取得
      await fetchTrainingData()

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) return

    try {
      const displayName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.email?.split('@')[0] || 
                         'ユーザー'
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: null,
          location: null
        })

      if (error) {
        console.error('Error creating profile:', error)
      } else {
        // 再取得
        await fetchUserData()
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const fetchTrainingData = async () => {
    if (!user) return

    try {
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      // 今月のデータ
      const { data: thisMonthData, error: thisMonthError } = await supabase
        .from('training_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thisMonth.toISOString().split('T')[0])
        .lt('date', nextMonth.toISOString().split('T')[0])

      // 先月のデータ
      const { data: lastMonthData, error: lastMonthError } = await supabase
        .from('training_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', lastMonth.toISOString().split('T')[0])
        .lt('date', thisMonth.toISOString().split('T')[0])

      if (thisMonthError || lastMonthError) {
        console.error('Error fetching training data:', thisMonthError || lastMonthError)
        return
      }

      // データを集計
      const aggregateData = (data: TrainingLog[]) => {
        const result = { swim: 0, bike: 0, run: 0 }
        data.forEach(log => {
          if (log.activity_type === 'スイム') result.swim += log.distance || 0
          else if (log.activity_type === 'バイク') result.bike += log.distance || 0
          else if (log.activity_type === 'ラン') result.run += log.distance || 0
        })
        return result
      }

      setTrainingData({
        thisMonth: aggregateData(thisMonthData || []),
        lastMonth: aggregateData(lastMonthData || [])
      })

    } catch (error) {
      console.error('Error fetching training data:', error)
    }
  }

  const handleSave = async () => {
    if (!user || !profile) return

    try {
      setUpdating(true)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editData.display_name,
          bio: editData.bio,
          location: editData.location,
          avatar_url: editData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        toast.error('プロフィールの更新に失敗しました。')
        return
      }

      // 成功したらローカルデータを更新
      setProfile(prev => prev ? {
        ...prev,
        display_name: editData.display_name,
        bio: editData.bio,
        location: editData.location,
        avatar_url: editData.avatar_url
      } : null)

      setIsEditing(false)
      toast.success('プロフィールが更新されました。')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('プロフィールの更新に失敗しました。')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        avatar_url: profile.avatar_url || ''
      })
    }
    setIsEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingAvatar(true)
      
      // ファイル名を生成（ユーザーIDとタイムスタンプを使用）
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

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

      // editDataを更新
      setEditData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }))

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('画像のアップロードに失敗しました。')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                まだ投稿がありません
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-primary mb-1">{post.board_categories?.name}</div>
                      <h3 className="font-medium mb-2 text-gray-900 dark:text-white">{post.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                        <div className="flex items-center gap-1">
                          <span>❤️ {post.like_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          <span>{post.view_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      case 'comments':
        return (
          <div className="space-y-4">
            {replies.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                まだコメントがありません
              </div>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-primary mb-1">投稿: {reply.board_posts?.title}</div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{reply.content}</p>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(reply.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )
      case 'training':
        return (
          <TrainingContent trainingData={trainingData} user={user} />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">プロフィールが見つかりません</div>
      </div>
    )
  }

  const totalDistance = trainingData.thisMonth.swim + trainingData.thisMonth.bike + trainingData.thisMonth.run

  const getProgressForAchievement = (template: AchievementTemplate) => {
    if (!userStats || !template.threshold) return null
    
    let current = 0
    switch (template.category) {
      case 'posts':
        current = userStats.postCount
        break
      case 'comments':
        current = userStats.commentCount
        break
      case 'training':
        current = userStats.totalDistance
        break
      case 'races':
        current = userStats.raceCount
        break
      case 'community':
        current = userStats.membershipMonths
        break
      default:
        return null
    }
    
    return {
      current,
      target: template.threshold,
      percentage: Math.min((current / template.threshold) * 100, 100)
    }
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
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop'}
              alt={profile.display_name || 'プロフィール'}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{isEditing ? editData.display_name : profile.display_name}</h1>
              <div className="flex items-center gap-4 text-lg opacity-90">
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <span>{new Date(profile.joined_date).toLocaleDateString('ja-JP')}〜</span>
                </div>
                {(isEditing ? editData.location : profile.location) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={20} />
                    <span>{isEditing ? editData.location : profile.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={updating}
                    className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Save size={20} />
                    {updating ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <X size={20} />
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit size={20} />
                  編集
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">プロフィール</h2>
              {isEditing ? (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      名前
                    </label>
                    <input
                      type="text"
                      value={editData.display_name}
                      onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      所在地
                    </label>
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      アバター画像
                    </label>
                    <div className="flex items-center gap-4">
                      {editData.avatar_url && (
                        <img
                          src={editData.avatar_url}
                          alt="アバタープレビュー"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                        />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        {uploadingAvatar && (
                          <div className="text-sm text-gray-500 mt-1">アップロード中...</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          JPG、PNG、GIF形式、最大5MB
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      自己紹介
                    </label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={4}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 mb-6">{profile.bio || '自己紹介が設定されていません'}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profile.post_count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">投稿</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profile.comment_count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">コメント</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{profile.achievement_count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">実績</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalDistance.toFixed(1)}km</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">今月の距離</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    投稿履歴
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'comments'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    コメント履歴
                  </button>
                  <button
                    onClick={() => setActiveTab('training')}
                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                      activeTab === 'training'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    記録データ
                  </button>
                </nav>
              </div>
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">今月の記録</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">スイム</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{trainingData.thisMonth.swim.toFixed(1)}km</div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      +{(trainingData.thisMonth.swim - trainingData.lastMonth.swim).toFixed(1)}km
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">バイク</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{trainingData.thisMonth.bike.toFixed(1)}km</div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      +{(trainingData.thisMonth.bike - trainingData.lastMonth.bike).toFixed(1)}km
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">ラン</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{trainingData.thisMonth.run.toFixed(1)}km</div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      +{(trainingData.thisMonth.run - trainingData.lastMonth.run).toFixed(1)}km
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">実績</h3>
              <div className="space-y-3">
                {achievements.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    まだ実績がありません
                  </div>
                ) : (
                  achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl">{achievement.icon || '🏆'}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{achievement.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {achievement.description}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(achievement.achievement_date).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {availableAchievements.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">利用可能な実績</h3>
                <div className="space-y-3">
                  {availableAchievements.slice(0, 5).map((template, index) => {
                    const progress = getProgressForAchievement(template)
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-75">
                        <div className="text-2xl grayscale">{template.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-700 dark:text-gray-300">{template.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                            {template.description}
                          </div>
                          {progress && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600 mb-1">
                                <span>進捗: {progress.current}/{progress.target}</span>
                                <span>{Math.round(progress.percentage)}%</span>
                              </div>
                              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {template.threshold && !progress && (
                            <div className="text-xs text-gray-400 dark:text-gray-600">
                              目標: {template.threshold} {template.category === 'training' ? 'km' : '回'}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {availableAchievements.length > 5 && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                      他に{availableAchievements.length - 5}個の実績があります
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Strava Section */}
            <StravaSection userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

const TrainingContent = ({ trainingData, user }: { trainingData: any, user: any }) => {
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [trainingAchievements, setTrainingAchievements] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchTrainingDetails()
  }, [user])

  const fetchTrainingDetails = async () => {
    if (!user) return

    try {
      // 最近のワークアウトを取得
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('training_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5)

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError)
      } else {
        setRecentWorkouts(workoutsData || [])
      }

      // 仮の目標データ（後で実際のデータベースから取得）
      setGoals([
        {
          id: 1,
          title: '月間ラン距離',
          current: trainingData.thisMonth.run,
          target: 120,
          unit: 'km',
          color: 'bg-orange-500',
        },
        {
          id: 2,
          title: '月間バイク距離',
          current: trainingData.thisMonth.bike,
          target: 300,
          unit: 'km',
          color: 'bg-green-500',
        },
        {
          id: 3,
          title: '月間スイム距離',
          current: trainingData.thisMonth.swim,
          target: 50,
          unit: 'km',
          color: 'bg-blue-500',
        },
      ])

      // 仮の達成記録データ
      setTrainingAchievements([
        {
          id: 1,
          title: '月間目標達成',
          description: '3種目すべてで月間目標を達成',
          date: '2024-06-30',
          icon: '🏆',
        },
        {
          id: 2,
          title: '連続練習記録',
          description: '30日連続でトレーニング実施',
          date: '2024-06-15',
          icon: '🔥',
        },
        {
          id: 3,
          title: 'ベストタイム更新',
          description: '10kmランでベストタイム更新',
          date: '2024-06-01',
          icon: '⚡',
        },
      ])

    } catch (error) {
      console.error('Error fetching training details:', error)
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'スイム':
        return 'bg-blue-500'
      case 'バイク':
        return 'bg-green-500'
      case 'ラン':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getActivityTypeDisplay = (type: string) => {
    switch (type) {
      case 'スイム':
        return 'スイム'
      case 'バイク':
        return 'バイク'
      case 'ラン':
        return 'ラン'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* 今月の統計 */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">今月の統計</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {trainingData.thisMonth.swim.toFixed(1)}km
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">スイム</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {trainingData.thisMonth.bike.toFixed(1)}km
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">バイク</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {trainingData.thisMonth.run.toFixed(1)}km
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">ラン</div>
          </div>
        </div>
      </div>

      {/* 最近のワークアウト */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">最近のワークアウト</h4>
        <div className="space-y-3">
          {recentWorkouts.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              まだトレーニング記録がありません
            </div>
          ) : (
            recentWorkouts.map((workout) => (
              <div key={workout.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${getActivityColor(workout.activity_type)}`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{getActivityTypeDisplay(workout.activity_type)}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{workout.date}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {workout.distance}km • {workout.duration}分
                  </div>
                  {workout.notes && (
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {workout.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 月間目標 */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">月間目標</h4>
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{goal.title}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.current.toFixed(1)}/{goal.target}{goal.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${goal.color}`}
                  style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {Math.round((goal.current / goal.target) * 100)}% 達成
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 今週の予定 */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">今週の予定</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">スイム練習</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">7月15日 6:00</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Calendar size={16} className="text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">バイク練習</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">7月16日 7:00</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Calendar size={16} className="text-orange-600 dark:text-orange-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">ラン練習</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">7月17日 6:30</div>
            </div>
          </div>
        </div>
      </div>

      {/* 達成記録 */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">達成記録</h4>
        <div className="space-y-3">
          {trainingAchievements.map((achievement) => (
            <div key={achievement.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{achievement.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {achievement.description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {achievement.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 外部連携 */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">外部連携</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
            <div className="text-orange-500 mb-2">
              <TrendingUp size={32} className="mx-auto" />
            </div>
            <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Strava連携</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Stravaアカウントと連携してワークアウトを自動同期
            </p>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors">
              連携する
            </button>
          </div>
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center">
            <div className="text-blue-500 mb-2">
              <Activity size={32} className="mx-auto" />
            </div>
            <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Garmin連携</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Garmin Connectと連携してデータを取得
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
              連携する
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}