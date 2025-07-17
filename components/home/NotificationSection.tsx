'use client'

import { useEffect, useState } from 'react'
import { Bell, Info, CheckCircle, AlertCircle, XCircle, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link?: string
  created_at: string
}

interface NotificationSectionProps {
  limit?: number
  showTitle?: boolean
  isLoggedIn?: boolean
}

export default function NotificationSection({ 
  limit = 5, 
  showTitle = true,
  isLoggedIn = false
}: NotificationSectionProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => [...prev, notificationId])
  }

  const markAsRead = async (notificationId: string) => {
    if (!isLoggedIn) return

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      default:
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (isLoggedIn && !notification.is_read) {
      markAsRead(notification.id)
    }
  }

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id))

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {showTitle && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                お知らせ
              </h2>
            </div>
            {isLoggedIn && (
              <Link
                href="/notifications"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 flex items-center space-x-1"
              >
                <span>すべて見る</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative ${getTypeColor(notification.type)}`}
          >
            <div className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    {notification.link && isLoggedIn ? (
                      <Link
                        href={notification.link}
                        onClick={() => handleNotificationClick(notification)}
                        className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-3 -my-2 px-3 py-2 rounded-md transition-colors"
                      >
                        <NotificationContent notification={notification} />
                      </Link>
                    ) : (
                      <div
                        onClick={() => handleNotificationClick(notification)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-3 -my-2 px-3 py-2 rounded-md transition-colors"
                      >
                        <NotificationContent notification={notification} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isLoggedIn && !notification.is_read && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  )}
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="通知を非表示"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        {notification.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
        {notification.message}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {formatDistanceToNow(new Date(notification.created_at), {
          addSuffix: true,
          locale: ja
        })}
      </p>
    </>
  )
}