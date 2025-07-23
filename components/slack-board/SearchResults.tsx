'use client'

import { Hash, MessageSquare, Calendar, Folder } from 'lucide-react'
import type { SearchResult } from '@/lib/api/board'

interface SearchResultsProps {
  results: SearchResult | null
  onSelectChannel: (channelId: string) => void
  onSelectMessage: (message: any) => void
  onSelectCategory?: (categoryId: string) => void
  isVisible: boolean
}

export default function SearchResults({ 
  results, 
  onSelectChannel, 
  onSelectMessage,
  onSelectCategory,
  isVisible 
}: SearchResultsProps) {
  if (!isVisible || !results) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const highlightQuery = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            "{results.query}" の検索結果
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {results.total_results} 件
          </span>
        </div>

        {results.total_results === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">検索結果が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Categories */}
            {results.categories.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  カテゴリー
                </h4>
                <div className="space-y-1">
                  {results.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => onSelectCategory?.(category.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {highlightQuery(category.name, results.query)}
                          </p>
                          {category.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {highlightQuery(category.description, results.query)}
                            </p>
                          )}
                        </div>
                        <Folder size={14} className="text-gray-400 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Channels */}
            {results.channels.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  チャンネル
                </h4>
                <div className="space-y-1">
                  {results.channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => onSelectChannel(channel.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Hash size={14} className="text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {highlightQuery(channel.name, results.query)}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: channel.category.color }}
                            />
                            <span>{channel.category.name}</span>
                            {channel.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {highlightQuery(channel.description, results.query)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {results.messages.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  メッセージ
                </h4>
                <div className="space-y-1">
                  {results.messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => onSelectMessage(message)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <MessageSquare size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {message.author.display_name || message.author.username}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(message.created_at)}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: message.channel.category.color }}
                              />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {message.channel.category.name}
                              </span>
                              <Hash size={10} className="text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {message.channel.name}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {highlightQuery(message.content, results.query)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}