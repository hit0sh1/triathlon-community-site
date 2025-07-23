// Board API client functions

export interface BoardCategory {
  id: string
  name: string
  description: string | null
  color: string
  sort_order: number
  created_at: string
  channels?: Channel[]
}

export interface Channel {
  id: string
  category_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
  created_by_id: string
  _count?: { messages: number }
}

export interface MessageWithDetails {
  id: string
  channel_id: string
  thread_id: string | null
  content: string
  message_type: 'channel' | 'thread_reply'
  like_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    role: string
  }
  reactions: Array<{
    id: string
    emoji_code: string
    user_id: string
    created_at: string
    user: {
      id: string
      username: string
      display_name: string
    }
  }>
  mentions: Array<{
    id: string
    mentioned_user_id: string
    user: {
      id: string
      username: string
      display_name: string
    }
  }>
  thread_reply_count: number
  is_thread_starter: boolean
  thread_replies: MessageWithDetails[]
}

// Categories API
export async function fetchCategories(): Promise<{ categories: BoardCategory[] }> {
  const response = await fetch('/api/board/categories')
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  return response.json()
}

export async function createCategory(data: {
  name: string
  description?: string
  color?: string
}): Promise<{ category: BoardCategory }> {
  const response = await fetch('/api/board/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('Create category error:', response.status, errorData)
    throw new Error(`Failed to create category: ${errorData.error || response.statusText}`)
  }
  return response.json()
}

// Channels API
export async function createChannel(data: {
  category_id: string
  name: string
  description?: string
}): Promise<{ channel: Channel }> {
  const response = await fetch('/api/board/channels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('Create channel error:', response.status, errorData)
    throw new Error(`Failed to create channel: ${errorData.error || response.statusText}`)
  }
  return response.json()
}

// Messages API
export async function fetchMessages(channelId: string): Promise<{ messages: MessageWithDetails[] }> {
  const response = await fetch(`/api/board/messages?channel_id=${channelId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch messages')
  }
  return response.json()
}

export async function createMessage(data: {
  channel_id: string
  thread_id?: string
  content: string
}): Promise<{ message: MessageWithDetails }> {
  const response = await fetch('/api/board/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Cookieを含める
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    console.error('Create message error:', response.status, errorData)
    throw new Error(`Failed to create message: ${errorData.error || response.statusText}`)
  }
  return response.json()
}


// Reactions API
export async function toggleReaction(data: {
  message_id: string
  emoji_code: string
}): Promise<{ action: 'added' | 'removed', reaction?: any }> {
  const response = await fetch('/api/board/reactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to toggle reaction')
  }
  return response.json()
}

// Add reaction (alias for toggleReaction for compatibility)
export async function addReaction(messageId: string, emojiCode: string): Promise<{ action: 'added' | 'removed', reaction?: any }> {
  return toggleReaction({
    message_id: messageId,
    emoji_code: emojiCode
  })
}

// Threads API
export async function fetchThread(threadId: string): Promise<{
  thread_message: MessageWithDetails
  replies: MessageWithDetails[]
}> {
  const response = await fetch(`/api/board/threads/${threadId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch thread')
  }
  return response.json()
}

export async function createThreadReply(threadId: string, data: {
  content: string
}): Promise<{ reply: MessageWithDetails }> {
  const response = await fetch(`/api/board/threads/${threadId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!response.ok) {
    const responseText = await response.text()
    console.error('Create thread reply error:', {
      status: response.status,
      statusText: response.statusText,
      responseText,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    let errorData
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { error: responseText || 'Unknown error' }
    }
    
    throw new Error(`Failed to create thread reply: ${errorData.error || errorData.details || response.statusText}`)
  }
  return response.json()
}

// Update message
export async function updateMessage(messageId: string, data: {
  content: string
}): Promise<{ message: MessageWithDetails }> {
  const response = await fetch(`/api/board/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to update message: ${errorData.error || response.statusText}`)
  }
  return response.json()
}

// Delete message
export async function deleteMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/board/messages/${messageId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to delete message: ${errorData.error || response.statusText}`)
  }
}

// Category management
export async function updateCategory(categoryId: string, data: {
  name: string
  description?: string
  color?: string
}): Promise<{ category: BoardCategory }> {
  const response = await fetch('/api/board/categories', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: categoryId, ...data }),
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to update category: ${errorData.error || response.statusText}`)
  }
  return response.json()
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const response = await fetch(`/api/board/categories?id=${categoryId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to delete category: ${errorData.error || response.statusText}`)
  }
}

// Channel management
export async function updateChannel(channelId: string, data: {
  name: string
  description?: string
}): Promise<{ channel: Channel }> {
  const response = await fetch('/api/board/channels', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: channelId, ...data }),
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to update channel: ${errorData.error || response.statusText}`)
  }
  return response.json()
}

export async function deleteChannel(channelId: string): Promise<void> {
  const response = await fetch(`/api/board/channels?id=${channelId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Failed to delete channel: ${errorData.error || response.statusText}`)
  }
}

// Search API
export interface SearchResult {
  messages: Array<MessageWithDetails & {
    channel: {
      id: string
      name: string
      category_id: string
      category: {
        id: string
        name: string
        color: string
      }
    }
  }>
  channels: Array<{
    id: string
    name: string
    description: string | null
    category_id: string
    created_at: string
    category: {
      id: string
      name: string
      color: string
    }
  }>
  categories: Array<{
    id: string
    name: string
    description: string | null
    color: string
    created_at: string
  }>
  query: string
  total_results: number
}

export async function searchBoard(params: {
  query: string
  channel_id?: string
  category_id?: string
  limit?: number
}): Promise<SearchResult> {
  const searchParams = new URLSearchParams({
    q: params.query,
    ...(params.channel_id && { channel_id: params.channel_id }),
    ...(params.category_id && { category_id: params.category_id }),
    ...(params.limit && { limit: params.limit.toString() })
  })

  const response = await fetch(`/api/board/search?${searchParams}`)
  if (!response.ok) {
    throw new Error('Failed to search')
  }
  return response.json()
}