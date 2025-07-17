'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Info, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
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

interface NotificationDropdownProps {
  onClose: () => void
  onNotificationRead: () => void
}

export default function NotificationDropdown({ onClose, onNotificationRead }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

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
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        onNotificationRead()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      onClose()
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-sm font-semibold text-gray-900">通知</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            読み込み中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            通知はありません
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${
                  !notification.is_read ? 'bg-blue-50' : ''
                } hover:bg-gray-50 transition-colors`}
              >
                {notification.link ? (
                  <Link
                    href={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className="block px-4 py-3"
                  >
                    <NotificationContent notification={notification} getIcon={getIcon} />
                  </Link>
                ) : (
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className="px-4 py-3 cursor-pointer"
                  >
                    <NotificationContent notification={notification} getIcon={getIcon} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          すべての通知を見る
        </Link>
      </div>
    </div>
  )
}

function NotificationContent({ 
  notification, 
  getIcon 
}: { 
  notification: Notification
  getIcon: (type: string) => JSX.Element 
}) {
  return (
    <>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {notification.message}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ja
            })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0 ml-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    </>
  )
}