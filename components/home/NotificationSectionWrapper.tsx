'use client'

import { useAuth } from '@/contexts/AuthContext'
import NotificationSection from './NotificationSection'

interface NotificationSectionWrapperProps {
  limit?: number
  showTitle?: boolean
}

export default function NotificationSectionWrapper({ 
  limit = 5, 
  showTitle = true 
}: NotificationSectionWrapperProps) {
  const { user } = useAuth()

  return (
    <NotificationSection 
      limit={limit} 
      showTitle={showTitle} 
      isLoggedIn={!!user} 
    />
  )
}