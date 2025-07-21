'use client'

import { AlertTriangle, Eye, RotateCcw, Trash2, Clock } from 'lucide-react'
import { getSeverityIcon, getSeverityStyle } from '@/lib/content-actions'

interface ActionLogProps {
  log: {
    id: string
    action_type: string
    content_type: string
    content_title: string | null
    created_at: string
    deletion_reasons?: {
      name: string
      severity: string
    } | null
    custom_reason?: string | null
    performed_by?: {
      display_name: string
      username: string
    } | null
  }
}

export default function ActionLogCard({ log }: ActionLogProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'delete':
        return <Trash2 size={16} className="text-red-500" />
      case 'hide':
        return <Eye size={16} className="text-yellow-500" />
      case 'restore':
        return <RotateCcw size={16} className="text-green-500" />
      case 'warn':
        return <AlertTriangle size={16} className="text-orange-500" />
      default:
        return <Clock size={16} className="text-gray-500" />
    }
  }

  const getActionText = (actionType: string, contentType: string) => {
    const contentTypeNames = {
      'event': '大会情報',
      'board_post': '掲示板投稿',
      'board_reply': '返信',
      'column': 'コラム',
      'column_comment': 'コメント'
    }
    
    const contentTypeName = contentTypeNames[contentType as keyof typeof contentTypeNames] || 'コンテンツ'
    
    switch (actionType) {
      case 'delete':
        return `${contentTypeName}が削除されました`
      case 'hide':
        return `${contentTypeName}が非表示になりました`
      case 'restore':
        return `${contentTypeName}が復元されました`
      case 'warn':
        return `${contentTypeName}について警告`
      default:
        return `${contentTypeName}についてのアクション`
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'delete':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
      case 'hide':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case 'restore':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
      case 'warn':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const reason = log.deletion_reasons?.name || log.custom_reason

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${getActionColor(log.action_type)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getActionIcon(log.action_type)}
          <div className="flex-1">
            <h4 className="font-medium text-black dark:text-white">
              {getActionText(log.action_type, log.content_type)}
            </h4>
            
            {log.content_title && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                「{log.content_title}」
              </p>
            )}
            
            {reason && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  {log.deletion_reasons && (
                    <>
                      <span className="text-sm">{getSeverityIcon(log.deletion_reasons.severity)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityStyle(log.deletion_reasons.severity)}`}>
                        {log.deletion_reasons.name}
                      </span>
                    </>
                  )}
                </div>
                {log.custom_reason && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {log.custom_reason}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>{formatDate(log.created_at)}</span>
              {log.performed_by && (
                <span>実行者: {log.performed_by.display_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}