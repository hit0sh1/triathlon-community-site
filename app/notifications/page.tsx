'use client'

import { useEffect, useState } from 'react'
import { Bell, Info, CheckCircle, AlertCircle, XCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read)
    await Promise.all(unreadNotifications.map(n => markAsRead(n.id)))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (user && !notification.is_read) {
      markAsRead(notification.id)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              ホームに戻る
            </Link>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  通知
                </h1>
                {user && unreadCount > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-semibold rounded-full">
                    {unreadCount}件の未読
                  </span>
                )}
              </div>
              
              {user && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  すべて既読にする
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">通知はありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                    user && !notification.is_read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => handleNotificationClick(notification)}
                      className="block p-6"
                    >
                      <NotificationContent notification={notification} getIcon={getIcon} isLoggedIn={!!user} />
                    </Link>
                  ) : (
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="p-6 cursor-pointer"
                    >
                      <NotificationContent notification={notification} getIcon={getIcon} isLoggedIn={!!user} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NotificationContent({ 
  notification, 
  getIcon,
  isLoggedIn
}: { 
  notification: Notification
  getIcon: (type: string) => React.ReactElement
  isLoggedIn: boolean
}) {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0">
        {getIcon(notification.type)}
      </div>
      <div className="ml-4 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ja
              })}
            </p>
          </div>
          {isLoggedIn && !notification.is_read && (
            <div className="flex-shrink-0 ml-4">
              <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}