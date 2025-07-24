'use client'

import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { X, Send, Smile, MoreVertical, MessageSquare, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { EMOJI_REACTIONS } from '@/lib/types/slack-board'
import * as boardApi from '@/lib/api/board'
import type { MessageWithDetails } from '@/lib/api/board'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface MentionUser {
  id: string
  username: string
  display_name: string
}

interface ThreadViewProps {
  threadMessage: MessageWithDetails
  onClose: () => void
  onSendReply: (content: string) => void
  onAddReaction: (messageId: string, emojiCode: string) => void
}

interface MessageComponentProps {
  message: MessageWithDetails
  isThreadStarter?: boolean
  user: any
  showMessageActions: string | null
  setShowMessageActions: (id: string | null) => void
  editingMessageId: string | null
  setEditingMessageId: (id: string | null) => void
  editContent: {[key: string]: string}
  setEditContent: React.Dispatch<React.SetStateAction<{[key: string]: string}>>
  cursorPositions: {[key: string]: number}
  setCursorPositions: React.Dispatch<React.SetStateAction<{[key: string]: number}>>
  textareaRefs: React.MutableRefObject<{[key: string]: HTMLTextAreaElement}>
  loadThreadReplies: () => void
  renderMessageWithMentions: (content: string) => React.ReactNode
  formatTime: (timestamp: string) => string
  handleReactionClick: (messageId: string, emojiCode: string) => Promise<void>
  setShowEmojiPicker: (id: string | null) => void
  showEmojiPicker: string | null
  emojiPickerRef: React.RefObject<HTMLDivElement | null>
  boardApi: any
  setEnlargedImage: (url: string | null) => void
}

// 外部のMessageComponentを定義してコンポーネントの再作成を防ぐ
const ExternalMessageComponent = memo(({ 
  message, 
  isThreadStarter = false, 
  user, 
  showMessageActions, 
  setShowMessageActions,
  editingMessageId,
  setEditingMessageId,
  editContent,
  setEditContent,
  cursorPositions, 
  setCursorPositions,
  textareaRefs,
  loadThreadReplies,
  renderMessageWithMentions,
  formatTime,
  handleReactionClick,
  setShowEmojiPicker,
  showEmojiPicker,
  emojiPickerRef,
  boardApi,
  setEnlargedImage
}: MessageComponentProps) => {
  // For thread modal, we need to track reactions separately
  const [localReactions, setLocalReactions] = useState(message.reactions)
  
  const isActionsOpen = showMessageActions === message.id
  const isEditing = editingMessageId === message.id
  // 編集中は親の状態を使用
  const currentEditContent = isEditing ? (editContent[message.id] ?? message.content) : message.content
  
  // カーソル位置を復元するuseEffect（二重保険）
  useEffect(() => {
    if (isEditing && textareaRefs.current[message.id]) {
      const textarea = textareaRefs.current[message.id]
      const savedPosition = cursorPositions[message.id]
      
      if (savedPosition !== undefined && savedPosition > 0) {
        // 複数のタイミングで復元を試行
        const restore = () => {
          if (textarea && textarea.selectionStart !== savedPosition) {
            textarea.setSelectionRange(savedPosition, savedPosition)
            console.log(`Restored cursor position (useEffect) for ${message.id}:`, savedPosition)
          }
        }
        
        setTimeout(restore, 0)
        requestAnimationFrame(restore)
      }
    }
  }, [currentEditContent, isEditing, message.id, cursorPositions, textareaRefs])
  
  console.log(`Message ${message.id}: isEditing=${isEditing}, isActionsOpen=${isActionsOpen}`)
  console.log(`Message ${message.id} currentEditContent:`, currentEditContent)
  
  // デバッグ: isEditingの変更を監視
  useEffect(() => {
    console.log(`Message ${message.id} isEditing changed to:`, isEditing)
  }, [isEditing, message.id])
  
  const handleLocalReactionClick = async (messageId: string, emojiCode: string) => {
    if (!user) return
    
    // Update local state for UI responsiveness
    setLocalReactions(prevReactions => {
      const existingReactionIndex = prevReactions.findIndex(
        reaction => reaction.emoji_code === emojiCode && reaction.user_id === user.id
      )
      
      if (existingReactionIndex !== -1) {
        // Remove reaction
        return prevReactions.filter(
          reaction => !(reaction.emoji_code === emojiCode && reaction.user_id === user.id)
        )
      } else {
        // Add reaction
        const newReaction = {
          id: `reaction-${Date.now()}`,
          message_id: messageId,
          user_id: user.id,
          emoji_code: emojiCode,
          created_at: new Date().toISOString(),
          user: {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            display_name: user.user_metadata?.display_name || user.user_metadata?.username || 'ユーザー',
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'user' as const,
            bio: null,
            location: null,
            website: null,
            created_at: user.created_at || '2025-01-01T00:00:00Z',
            updated_at: user.updated_at || '2025-01-01T00:00:00Z'
          }
        }
        return [...prevReactions, newReaction]
      }
    })
    
    // Call the parent handler which will persist the reaction
    handleReactionClick(messageId, emojiCode)
    // Close emoji picker after selection
    setShowEmojiPicker(null)
  }

  const handleEdit = async () => {
    if (!currentEditContent.trim() || currentEditContent === message.content) {
      setEditingMessageId(null)
      return
    }

    try {
      await boardApi.updateMessage(message.id, { content: currentEditContent })
      setEditingMessageId(null)
      // Reload thread to get updated content
      loadThreadReplies()
    } catch (error) {
      console.error('Failed to update message:', error)
      setEditContent(prev => ({ ...prev, [message.id]: message.content }))
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('このメッセージを削除しますか？')) return

    try {
      await boardApi.deleteMessage(message.id)
      // Reload thread to reflect deletion
      loadThreadReplies()
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }
  
  return (
    <div className={`group flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-3 rounded-lg ${isThreadStarter ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Link href={`/user/${message.author.username}`}>
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors cursor-pointer">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {message.author.display_name?.[0] || message.author.username?.[0] || '?'}
            </span>
          </div>
        </Link>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Author and Timestamp */}
        <div className="flex items-center space-x-2 mb-1">
          <Link href={`/user/${message.author.username}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {message.author.display_name || message.author.username}
          </Link>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.created_at)}
          </span>
          {isThreadStarter && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
              スレッド開始
            </span>
          )}
        </div>

        {/* Message Text */}
        {isEditing ? (
          <div className="mb-2">
            <textarea
              ref={(el) => {
                if (el) {
                  textareaRefs.current[message.id] = el
                }
              }}
              value={currentEditContent}
              onChange={(e) => {
                const newValue = e.target.value
                const cursorPosition = e.target.selectionStart || 0
                console.log('Textarea onChange:', newValue)
                console.log('Current cursor position:', cursorPosition)
                
                // カーソル位置を保存
                setCursorPositions(prev => ({ ...prev, [message.id]: cursorPosition }))
                
                // 親の状態を更新
                setEditContent(prev => {
                  const updated = { ...prev, [message.id]: newValue }
                  console.log('Updated editContent:', updated)
                  
                  // 状態更新後すぐにカーソル位置を復元
                  setTimeout(() => {
                    const textarea = textareaRefs.current[message.id]
                    if (textarea) {
                      textarea.setSelectionRange(cursorPosition, cursorPosition)
                      console.log(`Restored cursor immediately for ${message.id}:`, cursorPosition)
                    }
                  }, 0)
                  
                  return updated
                })
              }}
              onSelect={(e) => {
                // テキスト選択やカーソル移動時にも位置を保存
                const cursorPosition = e.currentTarget.selectionStart || 0
                setCursorPositions(prev => ({ ...prev, [message.id]: cursorPosition }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleEdit()
                }
                if (e.key === 'Escape') {
                  setEditingMessageId(null)
                  setEditContent(prev => ({ ...prev, [message.id]: message.content }))
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditingMessageId(null)
                  setEditContent(prev => ({ ...prev, [message.id]: message.content }))
                }}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.content && (
              <div className="text-sm text-gray-900 dark:text-white mb-2">
                {renderMessageWithMentions(message.content)}
                {message.updated_at !== message.created_at && (
                  <span className="text-xs text-gray-400 ml-2">(編集済み)</span>
                )}
              </div>
            )}
            
            {/* Message Image */}
            {/* Display multiple images */}
            {(message.image_urls && message.image_urls.length > 0) ? (
              <div className="mb-2">
                <div className={`grid gap-2 ${
                  message.image_urls.length === 1 ? 'grid-cols-1' :
                  message.image_urls.length === 2 ? 'grid-cols-2' :
                  message.image_urls.length === 3 ? 'grid-cols-3' :
                  'grid-cols-2'
                } max-w-md`}>
                  {message.image_urls.slice(0, 4).map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <Image 
                        src={imageUrl} 
                        alt={`Attached image ${index + 1}`}
                        width={100}
                        height={100}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity object-cover w-24 h-24"
                        onClick={() => setEnlargedImage(imageUrl)}
                      />
                      {index === 3 && message.image_urls.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer" onClick={() => setEnlargedImage(imageUrl)}>
                          <span className="text-white font-semibold">+{message.image_urls.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : message.image_url && (
              <div className="mb-2">
                <Image 
                  src={message.image_url} 
                  alt="Attached image"
                  width={100}
                  height={100}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity object-cover w-24 h-24"
                  onClick={() => setEnlargedImage(message.image_url)}
                />
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        <div className="flex items-center flex-wrap gap-1">
          {localReactions.length > 0 && (
            Object.entries(
              localReactions.reduce((acc, reaction) => {
                const key = reaction.emoji_code
                if (!acc[key]) {
                  acc[key] = {
                    emoji: EMOJI_REACTIONS.find(e => e.code === reaction.emoji_code)?.emoji || '👍',
                    count: 0,
                    hasUserReaction: false
                  }
                }
                acc[key].count++
                if (reaction.user_id === user?.id) {
                  acc[key].hasUserReaction = true
                }
                return acc
              }, {} as Record<string, { emoji: string, count: number, hasUserReaction: boolean }>)
            ).map(([emojiCode, data]) => (
              <button
                key={emojiCode}
                onClick={() => handleLocalReactionClick(message.id, emojiCode)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  data.hasUserReaction
                    ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{data.emoji}</span>
                <span className={data.hasUserReaction ? 'text-blue-800 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'}>
                  {data.count}
                </span>
              </button>
            ))
          )}
          
          {/* Emoji Picker Button */}
          <div className="relative" ref={showEmojiPicker === message.id ? emojiPickerRef : null}>
            <button
              onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
            >
              <Smile size={14} />
            </button>
            
            {/* Emoji Picker Dropdown */}
            {showEmojiPicker === message.id && (
              <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="grid grid-cols-5 gap-2" style={{ minWidth: '250px' }}>
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button
                      key={emoji.code}
                      onClick={() => handleLocalReactionClick(message.id, emoji.code)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xl"
                      title={emoji.name}
                    >
                      {emoji.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Actions */}
      {user && message.author.id === user.id && (
        <div className="md:opacity-0 md:group-hover:opacity-100 opacity-100 relative" data-thread-message-actions>
          <button
            onClick={() => setShowMessageActions(isActionsOpen ? null : message.id)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
          >
            <MoreVertical size={16} />
          </button>
          
          {isActionsOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {!isEditing && (
                <button
                  onClick={() => {
                    console.log('Edit button clicked for message:', message.id)
                    console.log('Original message content:', message.content)
                    setEditContent(prev => {
                      const updated = { ...prev, [message.id]: message.content }
                      console.log('Setting editContent:', updated)
                      return updated
                    })
                    setEditingMessageId(message.id)
                    setShowMessageActions(null)
                    console.log('Edit mode activated for message:', message.id)
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit size={14} />
                  編集
                </button>
              )}
              <button
                onClick={() => {
                  handleDelete()
                  setShowMessageActions(null)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Trash2 size={14} />
                削除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default function ThreadView({ threadMessage, onClose, onSendReply, onAddReaction }: ThreadViewProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [replyContent, setReplyContent] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [replies, setReplies] = useState<MessageWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([])
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<{[key: string]: string}>({})
  const [cursorPositions, setCursorPositions] = useState<{[key: string]: number}>({})
  const [isComposing, setIsComposing] = useState<{[key: string]: boolean}>({})
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const textareaRefs = useRef<{[key: string]: HTMLTextAreaElement}>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const threadMessagesRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load thread replies and mention users on mount
  useEffect(() => {
    loadThreadReplies()
    loadMentionUsers()
  }, [threadMessage.id])

  // 返信が追加された時に最新メッセージまでスクロール
  useEffect(() => {
    if (replies.length > 0 && threadMessagesRef.current) {
      setTimeout(() => {
        threadMessagesRef.current?.scrollTo({
          top: threadMessagesRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [replies.length])

  const loadMentionUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .not('username', 'is', null)
        .not('display_name', 'is', null)
        .order('display_name')
        .limit(50)
      
      if (error) {
        console.error('Failed to load mention users:', error)
        return
      }
      
      setMentionUsers(users || [])
    } catch (error) {
      console.error('Failed to load mention users:', error)
    }
  }

  // Close emoji picker, mention suggestions, and message actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(null)
      }
      
      // Close mention suggestions if clicking outside the textarea or dropdown
      const isTextarea = textareaRef.current?.contains(target)
      const isMentionDropdown = target.closest('.mention-dropdown')
      
      if (!isTextarea && !isMentionDropdown) {
        setShowMentionSuggestions(false)
      }
      
      // Close message actions menu if clicking outside
      if (showMessageActions && !target.closest('[data-thread-message-actions]')) {
        setShowMessageActions(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMessageActions])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const adjustHeight = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }

    adjustHeight()
  }, [replyContent])

  // Set up real-time subscription for thread replies
  useEffect(() => {
    if (!threadMessage.id || !user) return

    const replySubscription = supabase
      .channel(`thread-replies-${threadMessage.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadMessage.id}`
        },
        async (payload) => {
          // Fetch the complete reply with relations
          try {
            const { data } = await supabase
              .from('messages')
              .select(`
                id,
                channel_id,
                thread_id,
                content,
                message_type,
                like_count,
                created_at,
                updated_at,
                author:profiles!messages_author_id_fkey (
                  id,
                  username,
                  display_name,
                  avatar_url,
                  role
                ),
                reactions:reactions (
                  id,
                  emoji_code,
                  user_id,
                  created_at,
                  user:profiles!reactions_user_id_fkey (
                    id,
                    username,
                    display_name
                  )
                ),
                mentions:mentions (
                  id,
                  mentioned_user_id,
                  user:profiles!mentions_mentioned_user_id_fkey (
                    id,
                    username,
                    display_name
                  )
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              const replyWithDetails = {
                ...data,
                thread_reply_count: 0,
                is_thread_starter: false,
                thread_replies: []
              } as unknown as MessageWithDetails
              
              setReplies((prev) => {
                // Avoid duplicates
                if (prev.find(reply => reply.id === replyWithDetails.id)) {
                  return prev
                }
                return [...prev, replyWithDetails]
              })
            }
          } catch (error) {
            console.error('Failed to fetch new thread reply:', error)
          }
        }
      )
      .subscribe()

    return () => {
      replySubscription.unsubscribe()
    }
  }, [threadMessage.id, user])

  const loadThreadReplies = async () => {
    try {
      setLoading(true)
      const { replies: fetchedReplies } = await boardApi.fetchThread(threadMessage.id)
      setReplies(fetchedReplies)
    } catch (error) {
      console.error('Failed to load thread replies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMentionInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value
    setReplyContent(value)
    
    // Handle @ mention detection
    const cursorPosition = event.target.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Check if we're in a valid mention context (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        const query = textAfterAt.toLowerCase()
        setMentionQuery(query)
        setShowMentionSuggestions(true)
        setSelectedMentionIndex(0)
        
        // Calculate position for dropdown
        const textarea = event.target
        const rect = textarea.getBoundingClientRect()
        setMentionPosition({
          top: rect.bottom + 5,
          left: rect.left + 10
        })
      } else {
        setShowMentionSuggestions(false)
        setSelectedMentionIndex(0)
      }
    } else {
      setShowMentionSuggestions(false)
      setSelectedMentionIndex(0)
    }
  }
  
  const getFilteredMentionUsers = () => {
    return mentionUsers.filter(user => 
      user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      user.display_name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 8)
  }

  const insertMention = (user: MentionUser) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = replyContent.substring(0, cursorPosition)
    const textAfterCursor = replyContent.substring(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = replyContent.substring(0, lastAtIndex)
      const newContent = beforeAt + `@${user.display_name} ` + textAfterCursor
      setReplyContent(newContent)
      
      // Set cursor position after the inserted mention
      setTimeout(() => {
        const newCursorPosition = beforeAt.length + user.display_name.length + 2
        textarea.setSelectionRange(newCursorPosition, newCursorPosition)
        textarea.focus()
      }, 0)
    }
    
    setShowMentionSuggestions(false)
    setMentionQuery('')
    setSelectedMentionIndex(0)
  }

  const handleSendReply = async () => {
    if ((!replyContent.trim() && selectedImages.length === 0) || !user) return
    
    console.log('Thread reply attempt:', {
      threadId: threadMessage.id,
      content: replyContent.trim().substring(0, 50) + '...',
      hasContent: !!replyContent.trim(),
      hasImages: selectedImages.length
    })
    
    try {
      // 画像をアップロード（選択されている場合）
      let imageUrls: string[] = []
      if (selectedImages.length > 0) {
        imageUrls = await handleImageUpload()
        if (imageUrls.length === 0 && !replyContent.trim()) {
          // 画像アップロードに失敗し、テキストもない場合は送信をキャンセル
          return
        }
      }

      const result = await boardApi.createMessage({
        channel_id: threadMessage.channel_id,
        thread_id: threadMessage.id,
        content: replyContent.trim(),
        image_urls: imageUrls
      })
      
      console.log('Thread reply success:', result)
      
      // メッセージ送信後はスレッドをリロードして最新状態を取得
      await loadThreadReplies()
      
      // 親に通知（ログ用）
      onSendReply(replyContent)
      
      setReplyContent('')
      clearSelectedImages()
      
      // textareaの高さをリセット
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px'
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 最大5枚まで
    if (selectedImages.length + files.length > 5) {
      alert('画像は最大5枚まで選択できます')
      return
    }

    const validFiles: File[] = []
    const newPreviewUrls: string[] = []

    for (const file of files) {
      // ファイルサイズチェック（10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}: 画像サイズは10MB以下にしてください`)
        continue
      }

      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}: 画像ファイルを選択してください`)
        continue
      }

      validFiles.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
    }

    setSelectedImages(prev => [...prev, ...validFiles])
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const handleImageUpload = async (): Promise<string[]> => {
    if (selectedImages.length === 0 || !user) return []

    setUploadingImage(true)
    try {
      const uploadPromises = selectedImages.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('userId', user.id)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      return uploadedUrls
    } catch (error) {
      console.error('Image upload error:', error)
      alert('画像のアップロードに失敗しました')
      return []
    } finally {
      setUploadingImage(false)
    }
  }

  const clearSelectedImages = () => {
    setSelectedImages([])
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
    setImagePreviewUrls([])
  }

  const removeSelectedImage = (index: number) => {
    const urlToRevoke = imagePreviewUrls[index]
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke)
    }
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }


  const handleReactionClick = async (messageId: string, emojiCode: string) => {
    try {
      await boardApi.addReaction(messageId, emojiCode)
      setShowEmojiPicker(null)
      // Reload thread to get updated reactions
      loadThreadReplies()
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const renderMessageWithMentions = (content: string) => {
    // @usernameの形式のメンションを検出してスタイリング
    // \w+ではなく[^\s@]+を使用して、空白と@以外の文字をすべてキャプチャ
    const mentionRegex = /@([^\s@]+)/g
    const parts = content.split(mentionRegex)
    
    return parts.map((part, index) => {
      // 奇数インデックスはメンションされたユーザー名
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="text-blue-600 dark:text-blue-400 font-medium"
          >
            @{part}
          </span>
        )
      } else {
        // 改行を<br>タグに変換
        return part.split('\n').map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line}
            {lineIndex < part.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))
      }
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl h-3/4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageSquare size={20} className="text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">スレッド</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={threadMessagesRef}>
          {/* Original Message (Thread Starter) */}
          <ExternalMessageComponent 
            key={`thread-starter-${threadMessage.id}`} 
            message={threadMessage} 
            isThreadStarter={true}
            user={user}
            showMessageActions={showMessageActions}
            setShowMessageActions={setShowMessageActions}
            editingMessageId={editingMessageId}
            setEditingMessageId={setEditingMessageId}
            editContent={editContent}
            setEditContent={setEditContent}
            cursorPositions={cursorPositions}
            setCursorPositions={setCursorPositions}
            textareaRefs={textareaRefs}
            loadThreadReplies={loadThreadReplies}
            renderMessageWithMentions={renderMessageWithMentions}
            formatTime={formatTime}
            handleReactionClick={handleReactionClick}
            setShowEmojiPicker={setShowEmojiPicker}
            showEmojiPicker={showEmojiPicker}
            emojiPickerRef={emojiPickerRef}
            boardApi={boardApi}
            setEnlargedImage={setEnlargedImage}
          />
          
          {/* Thread Replies */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">返信を読み込み中...</p>
              </div>
            </div>
          ) : (
            replies.map((reply) => (
              <ExternalMessageComponent 
                key={reply.id} 
                message={reply}
                user={user}
                showMessageActions={showMessageActions}
                setShowMessageActions={setShowMessageActions}
                editingMessageId={editingMessageId}
                setEditingMessageId={setEditingMessageId}
                editContent={editContent}
                setEditContent={setEditContent}
                cursorPositions={cursorPositions}
                setCursorPositions={setCursorPositions}
                textareaRefs={textareaRefs}
                loadThreadReplies={loadThreadReplies}
                renderMessageWithMentions={renderMessageWithMentions}
                formatTime={formatTime}
                handleReactionClick={handleReactionClick}
                setShowEmojiPicker={setShowEmojiPicker}
                showEmojiPicker={showEmojiPicker}
                emojiPickerRef={emojiPickerRef}
                boardApi={boardApi}
                setEnlargedImage={setEnlargedImage}
              />
            ))
          )}
        </div>

        {/* Reply Input - moved to bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {/* Image Preview */}
          {imagePreviewUrls.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative inline-block">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      onClick={() => removeSelectedImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {selectedImages.length < 5 && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedImages.length}/5枚 選択中（最大5枚まで）
                </p>
              )}
            </div>
          )}

          <div className="flex items-center space-x-3">
            {/* Image Upload Button */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ImageIcon size={20} />
              </button>
            </div>
            <div className="flex-1">
              <div className="relative">
                {/* Highlighted text overlay */}
                <div 
                  className="absolute inset-0 px-3 py-2 text-gray-900 dark:text-white pointer-events-none whitespace-pre-wrap break-words overflow-hidden rounded-lg"
                  style={{ 
                    font: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    fontFamily: 'inherit',
                    fontWeight: 'inherit'
                  }}
                >
                  {renderMessageWithMentions(replyContent)}
                </div>
                <textarea
                  ref={textareaRef}
                  value={replyContent}
                  onChange={handleMentionInput}
                  onKeyDown={(e) => {
                    if (showMentionSuggestions) {
                      const filteredUsers = getFilteredMentionUsers()
                      
                      if (e.key === 'Escape') {
                        setShowMentionSuggestions(false)
                        setSelectedMentionIndex(0)
                        return
                      }
                      
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setSelectedMentionIndex(prev => 
                          prev < filteredUsers.length - 1 ? prev + 1 : 0
                        )
                        return
                      }
                      
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        setSelectedMentionIndex(prev => 
                          prev > 0 ? prev - 1 : filteredUsers.length - 1
                        )
                        return
                      }
                      
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (filteredUsers[selectedMentionIndex]) {
                          insertMention(filteredUsers[selectedMentionIndex])
                        }
                        return
                      }
                    }
                    
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = '40px'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                  }}
                  placeholder={
                    typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)
                      ? 'スレッドに返信...'
                      : `スレッドに返信... (${window.navigator?.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enterで送信)`
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-transparent caret-gray-900 dark:caret-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[120px] leading-normal relative z-10"
                  rows={1}
                />
                
                {/* Mention Suggestions Dropdown */}
                {showMentionSuggestions && (
                  <div className="mention-dropdown absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {getFilteredMentionUsers().map((user, index) => (
                        <button
                          key={user.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            insertMention(user)
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault()
                          }}
                          onMouseEnter={() => setSelectedMentionIndex(index)}
                          className={`w-full px-3 py-2 text-left flex items-center space-x-2 min-w-[200px] ${
                            index === selectedMentionIndex 
                              ? 'bg-blue-100 dark:bg-blue-900' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {user.display_name?.[0] || user.username?.[0] || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.display_name || user.username}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              @{user.username}
                            </div>
                          </div>
                        </button>
                      ))
                    }
                    {getFilteredMentionUsers().length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        該当するユーザーが見つかりません
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSendReply}
              disabled={(!replyContent.trim() && selectedImages.length === 0) || uploadingImage}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {uploadingImage ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
            <Image
              src={enlargedImage}
              alt="Enlarged image"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}