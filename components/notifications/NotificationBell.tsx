'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const fetchUnreadCount = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/notifications/unread-count?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      } else {
        console.error('Failed to fetch unread count:', response.status)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      // 30秒ごとに未読数を更新
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleNotificationRead = () => {
    fetchUnreadCount()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
        aria-label="通知"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown
          onClose={() => setShowDropdown(false)}
          onNotificationRead={handleNotificationRead}
        />
      )}
    </div>
  )
}