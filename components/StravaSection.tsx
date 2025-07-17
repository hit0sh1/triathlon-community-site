'use client'

import { useState, useEffect } from 'react'
import { Activity, Clock, MapPin, TrendingUp, Zap, Heart, Mountain } from 'lucide-react'
import { stravaAPI, StravaConnection, StravaActivity } from '@/lib/strava'
import { useAuth } from '@/contexts/AuthContext'

interface StravaSectionProps {
  userId: string
}

export default function StravaSection({ userId }: StravaSectionProps) {
  const { user } = useAuth()
  const [connection, setConnection] = useState<StravaConnection | null>(null)
  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    fetchStravaData()
  }, [userId])

  const fetchStravaData = async () => {
    try {
      setLoading(true)
      
      // Strava接続状態を確認
      const stravaConnection = await stravaAPI.getStravaConnection(userId)
      setConnection(stravaConnection)
      
      if (stravaConnection) {
        // アクティビティデータを取得
        const userActivities = await stravaAPI.getUserActivities(userId, 10)
        setActivities(userActivities)
      }
    } catch (error) {
      console.error('Error fetching Strava data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!user) return
    
    setConnecting(true)
    try {
      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
      
      if (!clientId) {
        alert('Strava設定が正しくありません。環境変数を確認してください。')
        setConnecting(false)
        return
      }
      
      const redirectUri = `${window.location.origin}/auth/strava/callback`
      
      const authUrl = await stravaAPI.getAuthUrl(clientId, redirectUri)
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting to Strava:', error)
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!user || !connection) return
    
    if (!confirm('Strava連携を解除しますか？')) return
    
    try {
      await stravaAPI.disconnect()
      setConnection(null)
      setActivities([])
    } catch (error) {
      console.error('Error disconnecting Strava:', error)
    }
  }

  const handleSync = async () => {
    if (!user || !connection) return
    
    try {
      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
      const clientSecret = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET
      
      if (!clientId || !clientSecret) {
        alert('Strava設定が正しくありません。環境変数を確認してください。')
        return
      }
      
      await stravaAPI.syncActivities(user.id, clientId, clientSecret)
      await fetchStravaData()
    } catch (error) {
      console.error('Error syncing activities:', error)
      alert('同期に失敗しました。')
    }
  }

  const formatDistance = (distance: number) => {
    return (distance / 1000).toFixed(1)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  const formatSpeed = (distance: number, time: number) => {
    const kmh = (distance / 1000) / (time / 3600)
    return kmh.toFixed(1)
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return '🏃‍♂️'
      case 'ride':
        return '🚴‍♂️'
      case 'swim':
        return '🏊‍♂️'
      default:
        return '🏃‍♂️'
    }
  }

  const getActivityTypeJapanese = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return 'ラン'
      case 'ride':
        return 'バイク'
      case 'swim':
        return 'スイム'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="text-orange-500" size={24} />
          Strava
        </h3>
        
        {connection ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              同期
            </button>
            <button
              onClick={handleDisconnect}
              className="text-sm px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              連携解除
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {connecting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Activity size={16} />
            )}
            {connecting ? '連携中...' : 'Stravaと連携'}
          </button>
        )}
      </div>

      {connection ? (
        <div>
          {/* アスリート情報 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {connection.athlete_data?.profile_medium && (
                <img
                  src={connection.athlete_data.profile_medium}
                  alt={`${connection.athlete_data.firstname} ${connection.athlete_data.lastname}`}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {connection.athlete_data?.firstname} {connection.athlete_data?.lastname}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {connection.athlete_data?.city && connection.athlete_data?.state
                    ? `${connection.athlete_data.city}, ${connection.athlete_data.state}`
                    : connection.athlete_data?.country}
                </p>
              </div>
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              最近のアクティビティ
            </h4>
            
            {activities.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                アクティビティがありません
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {activity.activity_data?.name || `${getActivityTypeJapanese(activity.activity_type)}アクティビティ`}
                          </h5>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{getActivityTypeJapanese(activity.activity_type)}</span>
                            <span>•</span>
                            <span>{new Date(activity.start_date).toLocaleDateString('ja-JP')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">距離</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatDistance(activity.distance || 0)}km
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">時間</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatTime(activity.moving_time || 0)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-gray-500" />
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">平均速度</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatSpeed(activity.distance || 0, activity.moving_time || 1)}km/h
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mountain size={16} className="text-gray-500" />
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">標高</div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {Math.round(activity.total_elevation_gain || 0)}m
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="text-orange-600 dark:text-orange-400" size={32} />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Stravaと連携してアクティビティを表示
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Stravaアカウントを連携すると、あなたのトレーニングデータをここに表示できます
          </p>
        </div>
      )}
    </div>
  )
}