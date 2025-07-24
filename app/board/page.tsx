'use client'

import { useState, useEffect, useRef } from 'react'
import { Hash, Plus, ChevronDown, ChevronRight, Search, Send, Smile, MessageSquare, X, Bell, Menu, MoreVertical, Edit, Trash2, Settings } from 'lucide-react'
import { EMOJI_REACTIONS } from '@/lib/types/slack-board'
import { useAuth } from '@/contexts/AuthContext'
import ThreadView from '@/components/slack-board/ThreadView'
import SearchResults from '@/components/slack-board/SearchResults'
import * as boardApi from '@/lib/api/board'
import type { BoardCategory, Channel, MessageWithDetails, SearchResult } from '@/lib/api/board'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface MentionUser {
  id: string
  username: string
  display_name: string
}

export default function SlackBoardPage() {
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  const [userProfile, setUserProfile] = useState<{ role: string } | null>(null)
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([])
  const [categories, setCategories] = useState<BoardCategory[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [messages, setMessages] = useState<MessageWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedThread, setSelectedThread] = useState<MessageWithDetails | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [showCreateChannelModal, setShowCreateChannelModal] = useState<string | null>(null)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const [showCategoryActions, setShowCategoryActions] = useState<string | null>(null)
  const [showChannelActions, setShowChannelActions] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<BoardCategory | null>(null)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryDescription, setEditCategoryDescription] = useState('')
  const [editCategoryColor, setEditCategoryColor] = useState('#3B82F6')
  const [editChannelName, setEditChannelName] = useState('')
  const [editChannelDescription, setEditChannelDescription] = useState('')

  const selectedChannel = categories
    .flatMap(cat => cat.channels || [])
    .find(channel => channel.id === selectedChannelId)

  // Load categories and user profile on mount
  useEffect(() => {
    loadCategories()
    if (user) {
      loadUserProfile()
      loadMentionUsers()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setUserProfile(profile)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

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

  // Set up real-time subscriptions for categories and channels
  useEffect(() => {
    if (!user) return

    // Subscribe to new categories
    const categorySubscription = supabase
      .channel('board-categories')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_categories'
        },
        (payload) => {
          const newCategory = {
            ...payload.new,
            channels: []
          } as unknown as BoardCategory
          setCategories((prev) => [...prev, newCategory])
          // Auto-expand new categories
          setExpandedCategories((prev) => new Set([...prev, newCategory.id]))
        }
      )
      .subscribe()

    // Subscribe to new channels
    const channelSubscription = supabase
      .channel('channels')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channels'
        },
        (payload) => {
          const newChannel = payload.new as Channel
          setCategories((prev) => 
            prev.map(category => 
              category.id === newChannel.category_id
                ? {
                    ...category,
                    channels: [...(category.channels || []), newChannel]
                  }
                : category
            )
          )
        }
      )
      .subscribe()

    // Subscribe to notifications (mentions)
    const notificationSubscription = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // Fetch complete notification data
          const { data: notification } = await supabase
            .from('notifications')
            .select(`
              id,
              type,
              content,
              is_read,
              created_at,
              message:messages!notifications_message_id_fkey (
                id,
                content,
                channel:channels!messages_channel_id_fkey (
                  id,
                  name,
                  category:board_categories!channels_category_id_fkey (
                    name,
                    color
                  )
                ),
                author:profiles!messages_author_id_fkey (
                  display_name,
                  username
                )
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (notification) {
            setNotifications((prev) => [notification, ...prev])
            
            // Show browser notification for mentions
            if (notification.type === 'mention' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(`${(notification as any).message.author.display_name}さんがあなたをメンションしました`, {
                  body: (notification as any).message.content,
                  icon: '/favicon.ico'
                })
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                  if (permission === 'granted') {
                    new Notification(`${(notification as any).message.author.display_name}さんがあなたをメンションしました`, {
                      body: (notification as any).message.content,
                      icon: '/favicon.ico'
                    })
                  }
                })
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      categorySubscription.unsubscribe()
      channelSubscription.unsubscribe()
      notificationSubscription.unsubscribe()
    }
  }, [user])

  // Set up presence tracking
  useEffect(() => {
    if (!user || !selectedChannelId) return

    const presenceChannel = supabase.channel(`presence-${selectedChannelId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState()
        const userIds = Object.keys(newState)
        setOnlineUsers(new Set(userIds))
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            username: user.email?.split('@')[0] || '',
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [user, selectedChannelId])

  // Handle typing indicators
  const handleTyping = () => {
    if (!user || !selectedChannelId) return

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Broadcast typing event
    const typingChannel = supabase.channel(`typing-${selectedChannelId}`)
    typingChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        typingChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            username: user.email?.split('@')[0] || '',
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
          }
        })
      }
    })

    // Set timeout to stop typing after 3 seconds
    const timeout = setTimeout(() => {
      typingChannel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { user_id: user.id }
      })
      typingChannel.unsubscribe()
    }, 3000)

    setTypingTimeout(timeout)
  }

  // Set up typing subscription
  useEffect(() => {
    if (!selectedChannelId || !user) return

    const typingChannel = supabase
      .channel(`typing-${selectedChannelId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTypingUsers(prev => new Set([...prev, payload.user_id]))
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(payload.user_id)
          return newSet
        })
      })
      .subscribe()

    return () => {
      typingChannel.unsubscribe()
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  }, [selectedChannelId, user])

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannelId) {
      loadMessages(selectedChannelId)
    }
  }, [selectedChannelId])

  // メッセージが読み込まれたら最新のメッセージまでスクロール
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // 少し遅延を入れてDOMが更新されてからスクロール
      setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [messages, selectedChannelId])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!selectedChannelId || !user) return

    // Subscribe to new messages in the selected channel
    console.log('Setting up real-time subscription for channel:', selectedChannelId)
    
    const messageSubscription = supabase
      .channel(`messages-${selectedChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${selectedChannelId}`
        },
        async (payload) => {
          console.log('Real-time message INSERT event:', payload)
          
          // Fetch the complete message with relations
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

            console.log('Fetched message data:', data)

            if (data) {
              const messageWithDetails = {
                ...data,
                thread_reply_count: 0,
                is_thread_starter: !data.thread_id,
                thread_replies: []
              } as unknown as MessageWithDetails
              
              console.log('Adding message to state:', messageWithDetails)
              
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.find(msg => msg.id === messageWithDetails.id)) {
                  console.log('Message already exists, skipping')
                  return prev
                }
                console.log('Adding new message to list')
                return [...prev, messageWithDetails]
              })
            }
          } catch (error) {
            console.error('Failed to fetch new message:', error)
          }
        }
      )
      .subscribe()

    // Subscribe to message updates (edits)
    const messageUpdateSubscription = supabase
      .channel(`message-updates-${selectedChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${selectedChannelId}`
        },
        (payload) => {
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, content: payload.new.content, updated_at: payload.new.updated_at }
                : msg
            )
          )
        }
      )
      .subscribe()

    // Subscribe to message deletions
    const messageDeleteSubscription = supabase
      .channel(`message-deletes-${selectedChannelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${selectedChannelId}`
        },
        (payload) => {
          // Check if message was soft deleted
          if (payload.new.deleted_at) {
            setMessages((prev) => prev.filter(msg => msg.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    // Subscribe to reactions
    const reactionSubscription = supabase
      .channel(`reactions-${selectedChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions'
        },
        async (payload) => {
          // Fetch the message ID for this reaction
          const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id
          if (!messageId) return

          // Check if this reaction belongs to a message in the current channel
          const message = messages.find(msg => msg.id === messageId)
          if (!message) return

          if (payload.eventType === 'INSERT') {
            // Fetch complete reaction data
            const { data: reactionData } = await supabase
              .from('reactions')
              .select(`
                id,
                emoji_code,
                user_id,
                created_at,
                user:profiles!reactions_user_id_fkey (
                  id,
                  username,
                  display_name
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (reactionData) {
              setMessages((prev) => 
                prev.map(msg => 
                  msg.id === messageId
                    ? { ...msg, reactions: [...msg.reactions, reactionData as any] }
                    : msg
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => 
              prev.map(msg => 
                msg.id === messageId
                  ? { ...msg, reactions: msg.reactions.filter(r => r.id !== payload.old.id) }
                  : msg
              )
            )
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      messageSubscription.unsubscribe()
      messageUpdateSubscription.unsubscribe()
      messageDeleteSubscription.unsubscribe()
      reactionSubscription.unsubscribe()
    }
  }, [selectedChannelId, user, messages])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { categories: fetchedCategories } = await boardApi.fetchCategories()
      setCategories(fetchedCategories)
      
      // Set first available channel as selected and expand all categories
      const allChannels = fetchedCategories.flatMap(cat => cat.channels || [])
      if (allChannels.length > 0) {
        setSelectedChannelId(allChannels[0].id)
      }
      
      // Expand all categories by default
      const categoryIds = fetchedCategories.map(cat => cat.id)
      setExpandedCategories(new Set(categoryIds))
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (channelId: string) => {
    try {
      setMessagesLoading(true)
      const { messages: fetchedMessages } = await boardApi.fetchMessages(channelId)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close emoji picker if clicking outside
      if (showEmojiPicker && !target.closest('[data-emoji-picker]')) {
        setShowEmojiPicker(null)
      }
      
      
      // Close search results if clicking outside
      if (showSearchResults && !target.closest('[data-search]')) {
        setShowSearchResults(false)
      }
      
      // Close mobile sidebar if clicking outside
      if (isMobileSidebarOpen && !target.closest('[data-mobile-sidebar]') && !target.closest('[data-mobile-menu-button]')) {
        setIsMobileSidebarOpen(false)
      }
      
      // Close category actions menu if clicking outside
      if (showCategoryActions && !target.closest('[data-category-actions]')) {
        setShowCategoryActions(null)
      }
      
      // Close channel actions menu if clicking outside
      if (showChannelActions && !target.closest('[data-channel-actions]')) {
        setShowChannelActions(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker, showSearchResults, isMobileSidebarOpen, showCategoryActions, showChannelActions])

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !showCreateChannelModal) return
    
    console.log('Creating channel:', {
      category_id: showCreateChannelModal,
      name: newChannelName.trim(),
      description: newChannelDescription.trim() || undefined,
      user: user?.id
    })
    
    try {
      const { channel } = await boardApi.createChannel({
        category_id: showCreateChannelModal,
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined
      })
      
      // Update categories with new channel
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === showCreateChannelModal
            ? {
                ...category,
                channels: [...(category.channels || []), channel]
              }
            : category
        )
      )
      
      // Switch to new channel
      setSelectedChannelId(channel.id)
      
      // Close modal and reset form
      setShowCreateChannelModal(null)
      setNewChannelName('')
      setNewChannelDescription('')
    } catch (error) {
      console.error('Failed to create channel:', error)
      alert(`チャンネルの作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      const { category } = await boardApi.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor
      })
      
      // Add channels property
      const categoryWithChannels = { ...category, channels: [] }
      
      // Add new category to state
      setCategories(prev => [...prev, categoryWithChannels])
      
      // Expand the new category
      setExpandedCategories(prev => new Set([...prev, category.id]))
      
      // Close modal and reset form
      setShowCreateCategoryModal(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      setNewCategoryColor('#3B82F6')
    } catch (error) {
      console.error('Failed to create category:', error)
      alert(`カテゴリーの作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditCategory = (category: BoardCategory) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryDescription(category.description || '')
    setEditCategoryColor(category.color)
    setShowCategoryActions(null)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return
    
    try {
      const { category: updatedCategory } = await boardApi.updateCategory(editingCategory.id, {
        name: editCategoryName.trim(),
        description: editCategoryDescription.trim() || undefined,
        color: editCategoryColor
      })
      
      // Update category in state
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? { ...cat, ...updatedCategory } : cat
      ))
      
      // Close edit modal
      setEditingCategory(null)
      setEditCategoryName('')
      setEditCategoryDescription('')
      setEditCategoryColor('#3B82F6')
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('このカテゴリーを削除しますか？チャンネルが含まれている場合は削除できません。')) return

    try {
      await boardApi.deleteCategory(categoryId)
      
      // Remove category from state
      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      
      // If selected channel was in this category, clear selection
      const categoryChannels = categories.find(cat => cat.id === categoryId)?.channels || []
      if (categoryChannels.some(ch => ch.id === selectedChannelId)) {
        const remainingChannels = categories
          .filter(cat => cat.id !== categoryId)
          .flatMap(cat => cat.channels || [])
        if (remainingChannels.length > 0) {
          setSelectedChannelId(remainingChannels[0].id)
        } else {
          setSelectedChannelId('')
        }
      }
      
      setShowCategoryActions(null)
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('カテゴリーの削除に失敗しました。チャンネルが含まれている可能性があります。')
    }
  }

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel)
    setEditChannelName(channel.name)
    setEditChannelDescription(channel.description || '')
    setShowChannelActions(null)
  }

  const handleUpdateChannel = async () => {
    if (!editingChannel || !editChannelName.trim()) return
    
    try {
      const { channel: updatedChannel } = await boardApi.updateChannel(editingChannel.id, {
        name: editChannelName.trim(),
        description: editChannelDescription.trim() || undefined
      })
      
      // Update channel in state
      setCategories(prev => prev.map(cat => ({
        ...cat,
        channels: cat.channels?.map(ch => 
          ch.id === editingChannel.id ? { ...ch, ...updatedChannel } : ch
        )
      })))
      
      // Close edit modal
      setEditingChannel(null)
      setEditChannelName('')
      setEditChannelDescription('')
    } catch (error) {
      console.error('Failed to update channel:', error)
    }
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm('このチャンネルを削除しますか？メッセージが含まれている場合は削除できません。')) return

    try {
      await boardApi.deleteChannel(channelId)
      
      // Remove channel from state
      setCategories(prev => prev.map(cat => ({
        ...cat,
        channels: cat.channels?.filter(ch => ch.id !== channelId)
      })))
      
      // If deleted channel was selected, select another channel
      if (selectedChannelId === channelId) {
        const remainingChannels = categories.flatMap(cat => cat.channels || []).filter(ch => ch.id !== channelId)
        if (remainingChannels.length > 0) {
          setSelectedChannelId(remainingChannels[0].id)
        } else {
          setSelectedChannelId('')
        }
      }
      
      setShowChannelActions(null)
    } catch (error) {
      console.error('Failed to delete channel:', error)
      alert('チャンネルの削除に失敗しました。メッセージが含まれている可能性があります。')
    }
  }

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedChannelId) return
    
    // 詳細な認証状態チェック
    const supabase = createClientComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    console.log('Auth debug info:', {
      user: user?.id,
      session: session?.user?.id,
      hasAccessToken: !!session?.access_token,
      cookieExists: document.cookie.includes('sb-')
    })
    
    console.log('Attempting to send message:', {
      channel_id: selectedChannelId,
      content: newMessage.trim(),
      user: user?.id
    })
    
    try {
      const result = await boardApi.createMessage({
        channel_id: selectedChannelId,
        content: newMessage.trim()
      })
      
      console.log('Message created successfully:', result)
      
      // リアルタイムが動作しない場合のフォールバック: 手動でメッセージを追加
      if (result.message) {
        console.log('Adding message manually as fallback')
        setMessages(prev => [...prev, result.message])
      }
      
      setNewMessage('')
      
      // textareaの高さをリセット
      if (messageInputRef.current) {
        messageInputRef.current.style.height = '40px'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // エラーの場合はメッセージをリセットしない
      return
    }
  }

  const handleReaction = async (messageId: string, emojiCode: string) => {
    if (!user) return
    
    try {
      const { action } = await boardApi.toggleReaction({
        message_id: messageId,
        emoji_code: emojiCode
      })
      
      // Update message reactions locally
      setMessages(prev => prev.map(message => {
        if (message.id === messageId) {
          const existingReactionIndex = message.reactions.findIndex(
            reaction => reaction.emoji_code === emojiCode && reaction.user_id === user.id
          )
          
          if (action === 'removed' && existingReactionIndex !== -1) {
            // Remove reaction
            return {
              ...message,
              reactions: message.reactions.filter(
                reaction => !(reaction.emoji_code === emojiCode && reaction.user_id === user.id)
              )
            }
          } else if (action === 'added' && existingReactionIndex === -1) {
            // Add reaction
            const newReaction = {
              id: `reaction-${Date.now()}`,
              emoji_code: emojiCode,
              user_id: user.id,
              created_at: new Date().toISOString(),
              user: {
                id: user.id,
                username: user.email?.split('@')[0] || '',
                display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
              }
            }
            
            return {
              ...message,
              reactions: [...message.reactions, newReaction]
            }
          }
        }
        return message
      }))
      
      setShowEmojiPicker(null)
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }

  const handleThreadReply = async (content: string) => {
    if (!selectedThread) return
    
    try {
      await boardApi.createThreadReply(selectedThread.id, {
        content: content.trim()
      })
      
      // Refresh thread data or update locally
      // For now, just log success
      console.log('Thread reply sent successfully')
    } catch (error) {
      console.error('Failed to send thread reply:', error)
    }
  }

  const openThread = (message: MessageWithDetails) => {
    console.log('Opening thread for message:', {
      messageId: message.id,
      messageType: message.message_type,
      isThreadStarter: message.is_thread_starter,
      hasThreadId: !!message.thread_id
    })
    setSelectedThread(message)
  }

  const closeThread = () => {
    setSelectedThread(null)
  }


  const handleSaveEdit = async (messageId: string) => {
    if (!editContent.trim()) return
    
    try {
      const { message: updatedMessage } = await boardApi.updateMessage(messageId, {
        content: editContent.trim()
      })
      
      // Update message in state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updatedMessage } : msg
      ))
      
      setEditingMessage(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to update message:', error)
    }
  }


  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditContent('')
  }

  const handleEditMessage = (message: MessageWithDetails) => {
    setEditingMessage(message.id)
    setEditContent(message.content)
    setShowMessageActions(null)
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('このメッセージを削除しますか？')) return

    try {
      await boardApi.deleteMessage(messageId)
      // Remove message from state
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setShowMessageActions(null)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>, isEdit: boolean = false) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      setShowMentionSuggestions(true)
      setSelectedMentionIndex(0)
      
      // Calculate position for mention dropdown
      const rect = e.target.getBoundingClientRect()
      const lines = textBeforeCursor.split('\n')
      const currentLineLength = lines[lines.length - 1].length
      setMentionPosition({
        top: rect.top + (lines.length - 1) * 20 + 40,
        left: rect.left + currentLineLength * 8
      })
    } else {
      setShowMentionSuggestions(false)
      setMentionQuery('')
      setSelectedMentionIndex(0)
    }
    
    if (isEdit) {
      setEditContent(value)
    } else {
      setNewMessage(value)
    }
  }

  const insertMention = (mentionUser: MentionUser, isEdit: boolean = false) => {
    const currentValue = isEdit ? editContent : newMessage
    const cursorPosition = isEdit ? editContent.length : newMessage.length
    const textBeforeCursor = currentValue.slice(0, cursorPosition)
    const textAfterCursor = currentValue.slice(cursorPosition)
    
    // Replace @query with @display_name
    const beforeMention = textBeforeCursor.replace(/@[^\s@]*$/, '')
    const newValue = beforeMention + `@${mentionUser.display_name} ` + textAfterCursor
    
    if (isEdit) {
      setEditContent(newValue)
    } else {
      setNewMessage(newValue)
    }
    
    setShowMentionSuggestions(false)
    setMentionQuery('')
    setSelectedMentionIndex(0)
  }

  const handleSearch = (query: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null)
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    
    // Debounce search by 300ms
    const timeout = setTimeout(async () => {
      try {
        const results = await boardApi.searchBoard({
          query: query.trim(),
          limit: 20
        })
        
        setSearchResults(results)
        setShowSearchResults(true)
      } catch (error) {
        console.error('Search failed:', error)
        setSearchResults(null)
        setShowSearchResults(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    
    setSearchTimeout(timeout)
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

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
      }
      return part
    })
  }

  const getFilteredMentionUsers = () => {
    return mentionUsers.filter(mentionUser => 
      mentionUser.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      mentionUser.display_name.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}
      
      {/* Left Sidebar - Categories and Channels */}
      <div 
        className={`
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 
          fixed lg:static 
          inset-y-0 left-0 
          w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          flex flex-col 
          transition-transform duration-300 ease-in-out 
          z-50 lg:z-auto
        `}
        data-mobile-sidebar
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">掲示板</h1>
            <div className="flex items-center space-x-2">
              {notifications.filter(n => !n.is_read).length > 0 && (
                <div className="relative">
                  <Bell size={20} className="text-gray-500 dark:text-gray-400" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                </div>
              )}
              {/* Close button for mobile */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4" data-search>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="メッセージを検索..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              onFocus={() => {
                if (searchQuery.trim() && searchResults) {
                  setShowSearchResults(true)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSearchResults(false)
                  e.currentTarget.blur()
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Search Loading */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Search Results */}
            <SearchResults
              results={searchResults}
              onSelectChannel={(channelId) => {
                setSelectedChannelId(channelId)
                setShowSearchResults(false)
                setSearchQuery('')
                setSearchResults(null)
                // モバイル版ではサイドバーを閉じる
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false)
                }
              }}
              onSelectMessage={(message) => {
                setSelectedChannelId(message.channel.id)
                setShowSearchResults(false)
                setSearchQuery('')
                setSearchResults(null)
                // モバイル版ではサイドバーを閉じる
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(false)
                }
                // Scroll to message after a brief delay to allow channel to load
                setTimeout(() => {
                  const messageElement = document.getElementById(`message-${message.id}`)
                  if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                }, 100)
              }}
              onSelectCategory={(categoryId) => {
                // Expand the category and show its first channel
                const category = categories.find(cat => cat.id === categoryId)
                if (category && category.channels && category.channels.length > 0) {
                  setExpandedCategories(prev => new Set([...prev, categoryId]))
                  setSelectedChannelId(category.channels[0].id)
                  // モバイル版ではサイドバーを閉じる
                  if (window.innerWidth < 1024) {
                    setIsMobileSidebarOpen(false)
                  }
                }
                setShowSearchResults(false)
                setSearchQuery('')
                setSearchResults(null)
              }}
              isVisible={showSearchResults}
            />
          </div>
        </div>

        {/* Add Category Button */}
        {user && userProfile?.role === 'admin' && (
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowCreateCategoryModal(true)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400"
            >
              <Plus size={16} />
              <span>カテゴリーを追加</span>
            </button>
          </div>
        )}

        {/* Categories and Channels */}
        <div className="flex-1 overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <div className="group flex items-center">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex-1 px-4 py-2 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="flex items-center">
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown size={14} className="mr-1" />
                    ) : (
                      <ChevronRight size={14} className="mr-1" />
                    )}
                    {category.name}
                  </span>
                </button>
                {user && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setShowCreateChannelModal(category.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="チャンネルを追加"
                    >
                      <Plus size={14} />
                    </button>
                    {userProfile?.role === 'admin' && (
                      <div className="relative" data-category-actions>
                        <button
                          onClick={() => setShowCategoryActions(showCategoryActions === category.id ? null : category.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          title="カテゴリー設定"
                        >
                          <Settings size={14} />
                        </button>
                        
                        {showCategoryActions === category.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit size={14} />
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
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
                )}
              </div>

              {/* Channels */}
              {expandedCategories.has(category.id) && category.channels && (
                <div className="ml-4">
                  {category.channels.map((channel) => (
                    <div key={channel.id} className="group flex items-center">
                      <button
                        onClick={() => {
                          setSelectedChannelId(channel.id)
                          // モバイル版ではサイドバーを閉じる
                          if (window.innerWidth < 1024) {
                            setIsMobileSidebarOpen(false)
                          }
                        }}
                        className={`flex-1 px-3 py-1.5 mb-0.5 flex items-center text-sm rounded-md transition-colors ${
                          selectedChannelId === channel.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Hash size={14} className="mr-2 flex-shrink-0" />
                        <span className="truncate">{channel.name}</span>
                      </button>
                      {user && (user.id === channel.created_by_id || userProfile?.role === 'admin') && (
                        <div className="relative opacity-0 group-hover:opacity-100" data-channel-actions>
                          <button
                            onClick={() => setShowChannelActions(showChannelActions === channel.id ? null : channel.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded mr-1"
                            title="チャンネル設定"
                          >
                            <Settings size={12} />
                          </button>
                          
                          {showChannelActions === channel.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => handleEditChannel(channel)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit size={14} />
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteChannel(channel.id)}
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
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Channel Header - Fixed */}
        <div className="sticky top-0 z-30 px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden mr-3 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              data-mobile-menu-button
            >
              <Menu size={20} />
            </button>
            
            <Hash size={20} className="text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedChannel?.name}
            </h2>
            {selectedChannel?.description && (
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                {selectedChannel.description}
              </span>
            )}
            {onlineUsers.size > 0 && (
              <span className="ml-auto flex items-center text-sm text-gray-500 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="hidden sm:inline">{onlineUsers.size} 人がオンライン</span>
                <span className="sm:hidden">{onlineUsers.size}</span>
              </span>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4 scroll-smooth" ref={messagesContainerRef}>
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">メッセージを読み込み中...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">まだメッセージがありません</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">最初のメッセージを送信してみましょう！</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
            <div key={message.id} id={`message-${message.id}`} className="group flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 lg:-mx-6 px-4 lg:px-6 py-2 rounded-lg relative">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {message.author.display_name?.[0] || message.author.username?.[0] || '?'}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                {/* Author and Timestamp */}
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {message.author.display_name || message.author.username}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Message Text */}
                {editingMessage === message.id ? (
                  <div className="mb-2">
                    <div className="relative">
                      {/* Highlighted text overlay for edit */}
                      <div 
                        className="absolute inset-0 px-3 py-2 text-gray-900 dark:text-white pointer-events-none whitespace-pre-wrap break-words overflow-hidden rounded-lg text-sm"
                        style={{ 
                          font: 'inherit',
                          fontSize: 'inherit',
                          lineHeight: 'inherit',
                          fontFamily: 'inherit',
                          fontWeight: 'inherit'
                        }}
                      >
                        {renderMessageWithMentions(editContent)}
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => handleMentionInput(e, true)}
                        onKeyDown={(e) => {
                          if (showMentionSuggestions && editingMessage === message.id) {
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
                                insertMention(filteredUsers[selectedMentionIndex], true)
                              }
                              return
                            }
                          }
                          
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault()
                            handleSaveEdit(message.id)
                          }
                          if (e.key === 'Escape' && !showMentionSuggestions) {
                            handleCancelEdit()
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-transparent caret-gray-900 dark:caret-white resize-none text-sm relative z-10"
                        rows={3}
                        autoFocus
                      />
                      
                      {/* Mention Suggestions for Edit */}
                      {showMentionSuggestions && editingMessage === message.id && getFilteredMentionUsers().length > 0 && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                          {getFilteredMentionUsers().map((mentionUser, index) => (
                            <button
                              key={mentionUser.id}
                              onClick={() => insertMention(mentionUser, true)}
                              onMouseEnter={() => setSelectedMentionIndex(index)}
                              className={`w-full text-left px-3 py-2 transition-colors flex items-center space-x-2 ${
                                index === selectedMentionIndex 
                                  ? 'bg-blue-100 dark:bg-blue-900' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {mentionUser.display_name[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{mentionUser.display_name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">@{mentionUser.username}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-900 dark:text-white mb-2">
                    {renderMessageWithMentions(message.content)}
                    {message.updated_at !== message.created_at && (
                      <span className="text-xs text-gray-400 ml-2">(編集済み)</span>
                    )}
                  </div>
                )}

                {/* Reactions */}
                {message.reactions.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1 mb-2">
                      {Object.entries(
                        message.reactions.reduce((acc, reaction) => {
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
                          onClick={() => handleReaction(message.id, emojiCode)}
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
                      ))}
                    </div>
                  )}

                {/* Action Bar with Reply Button and Emoji Picker */}
                <div className="flex items-center space-x-2">
                  {/* Reply Button */}
                  <button
                    onClick={() => openThread(message)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>
                      返信
                      {message.thread_reply_count > 0 && (
                        <span className="ml-1 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                          {message.thread_reply_count}
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Emoji Picker */}
                  <div className="relative" data-emoji-picker>
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                    >
                      <Smile size={14} />
                    </button>
                    
                    {/* Emoji Picker Dropdown */}
                    {showEmojiPicker === message.id && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20" style={{ width: '250px' }}>
                        <div className="grid grid-cols-5 gap-1.5">
                          {EMOJI_REACTIONS.map((emoji) => (
                            <button
                              key={emoji.code}
                              onClick={() => handleReaction(message.id, emoji.code)}
                              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg transition-colors"
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

              {/* Message Actions Menu */}
              {user && message.author.id === user.id && (
                <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowMessageActions(showMessageActions === message.id ? null : message.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {showMessageActions === message.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => handleEditMessage(message)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit size={14} />
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 size={14} />
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            ))
          )}
        </div>

        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <div className="px-4 lg:px-6 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
            {Array.from(typingUsers).slice(0, 3).join(', ')} が入力中...
          </div>
        )}

        {/* Message Input - moved to bottom and fixed - Version 2024 */}
        <div className="sticky bottom-0 z-30 px-4 lg:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="relative">
                {/* Highlighted text overlay */}
                <div 
                  className="absolute inset-0 px-3 py-2.5 text-gray-900 dark:text-white pointer-events-none whitespace-pre-wrap break-words overflow-hidden rounded-lg min-h-[40px] max-h-[120px] leading-normal"
                  style={{ 
                    font: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    fontFamily: 'inherit',
                    fontWeight: 'inherit'
                  }}
                >
                  {renderMessageWithMentions(newMessage)}
                </div>
                <textarea
                  id="message-input-bottom-2024"
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => {
                  handleMentionInput(e, false)
                  handleTyping()
                }}
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
                          insertMention(filteredUsers[selectedMentionIndex], false)
                        }
                        return
                      }
                    }
                    
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder={
                    typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window)
                      ? `#${selectedChannel?.name} にメッセージを送信...`
                      : `#${selectedChannel?.name} にメッセージを送信... (${window.navigator?.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enterで送信)`
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-transparent caret-gray-900 dark:caret-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[120px] leading-normal relative z-10"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = '40px'
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                  }}
                />
                
                {/* Mention Suggestions */}
                {showMentionSuggestions && !editingMessage && getFilteredMentionUsers().length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                    {getFilteredMentionUsers().map((mentionUser, index) => (
                      <button
                        key={mentionUser.id}
                        onClick={() => insertMention(mentionUser, false)}
                        onMouseEnter={() => setSelectedMentionIndex(index)}
                        className={`w-full text-left px-3 py-2 transition-colors flex items-center space-x-2 ${
                          index === selectedMentionIndex 
                            ? 'bg-blue-100 dark:bg-blue-900' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {mentionUser.display_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{mentionUser.display_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">@{mentionUser.username}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Thread View Modal */}
      {selectedThread && (
        <ThreadView
          threadMessage={selectedThread}
          onClose={closeThread}
          onSendReply={handleThreadReply}
          onAddReaction={handleReaction}
        />
      )}

      {/* Create Channel Modal */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">新しいチャンネルを作成</h3>
              <button
                onClick={() => {
                  setShowCreateChannelModal(null)
                  setNewChannelName('')
                  setNewChannelDescription('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  チャンネル名
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="チャンネル名を入力"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  小文字、数字、ハイフンを使用できます
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  説明（任意）
                </label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="このチャンネルの目的を説明"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateChannelModal(null)
                  setNewChannelName('')
                  setNewChannelDescription('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleCreateChannel()}
                disabled={!newChannelName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">新しいカテゴリーを作成</h3>
              <button
                onClick={() => {
                  setShowCreateCategoryModal(false)
                  setNewCategoryName('')
                  setNewCategoryDescription('')
                  setNewCategoryColor('#3B82F6')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カテゴリー名
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="カテゴリー名を入力"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  説明（任意）
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="このカテゴリーの目的を説明"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カラー
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <div className="flex space-x-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newCategoryColor === color 
                            ? 'border-gray-800 dark:border-white scale-110' 
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateCategoryModal(false)
                  setNewCategoryName('')
                  setNewCategoryDescription('')
                  setNewCategoryColor('#3B82F6')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">カテゴリーを編集</h3>
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setEditCategoryName('')
                  setEditCategoryDescription('')
                  setEditCategoryColor('#3B82F6')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カテゴリー名
                </label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="カテゴリー名を入力"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  説明（任意）
                </label>
                <textarea
                  value={editCategoryDescription}
                  onChange={(e) => setEditCategoryDescription(e.target.value)}
                  placeholder="このカテゴリーの目的を説明"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  カラー
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={editCategoryColor}
                    onChange={(e) => setEditCategoryColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <div className="flex space-x-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'].map(color => (
                      <button
                        key={color}
                        onClick={() => setEditCategoryColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          editCategoryColor === color 
                            ? 'border-gray-800 dark:border-white scale-110' 
                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setEditCategoryName('')
                  setEditCategoryDescription('')
                  setEditCategoryColor('#3B82F6')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!editCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {editingChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">チャンネルを編集</h3>
              <button
                onClick={() => {
                  setEditingChannel(null)
                  setEditChannelName('')
                  setEditChannelDescription('')
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  チャンネル名
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={editChannelName}
                    onChange={(e) => setEditChannelName(e.target.value)}
                    placeholder="チャンネル名を入力"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  小文字、数字、ハイフンを使用できます
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  説明（任意）
                </label>
                <textarea
                  value={editChannelDescription}
                  onChange={(e) => setEditChannelDescription(e.target.value)}
                  placeholder="このチャンネルの目的を説明"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingChannel(null)
                  setEditChannelName('')
                  setEditChannelDescription('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateChannel}
                disabled={!editChannelName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}