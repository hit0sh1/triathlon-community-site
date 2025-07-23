// Slack-like Board System Types

export interface Channel {
  id: string
  category_id: string
  name: string
  description: string | null
  sort_order: number
  created_by_id: string
  created_at: string
  updated_at: string
  
  // Relations
  category?: BoardCategory
  messages?: Message[]
  _count?: {
    messages: number
    unread_messages?: number
  }
}

export interface Message {
  id: string
  channel_id: string
  thread_id: string | null
  author_id: string
  content: string
  message_type: 'channel' | 'thread_reply'
  like_count: number
  deleted_at: string | null
  deleted_by_id: string | null
  deletion_reason_id: string | null
  deletion_custom_reason: string | null
  created_at: string
  updated_at: string
  
  // Relations
  channel?: Channel
  author?: Profile
  thread_parent?: Message
  thread_replies?: Message[]
  reactions?: Reaction[]
  mentions?: Mention[]
  
  // Computed fields
  _count?: {
    reactions: number
    thread_replies: number
  }
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji_code: string
  created_at: string
  
  // Relations
  message?: Message
  user?: Profile
}

export interface Mention {
  id: string
  message_id: string
  mentioned_user_id: string
  created_at: string
  
  // Relations
  message?: Message
  mentioned_user?: Profile
}

export interface SlackNotification {
  id: string
  user_id: string
  type: 'reply' | 'mention' | 'reaction'
  message_id: string
  is_read: boolean
  created_at: string
  
  // Relations
  message?: Message
  user?: Profile
}

// Extended types for UI components
export interface ChannelWithMessages extends Channel {
  messages: MessageWithDetails[]
  last_message?: MessageWithDetails
  unread_count?: number
}

export interface MessageWithDetails extends Message {
  author: Profile
  reactions: ReactionWithUser[]
  thread_replies: MessageWithDetails[]
  mentions: MentionWithUser[]
  is_thread_starter: boolean
  thread_reply_count: number
}

export interface ReactionWithUser extends Reaction {
  user: Profile
}

export interface MentionWithUser extends Mention {
  mentioned_user: Profile
}

// Existing types (extending current system)
export interface BoardCategory {
  id: string
  name: string
  description: string | null
  color: string
  sort_order: number
  created_at: string
  
  // Extended for Slack-like system
  channels?: Channel[]
  _count?: {
    channels: number
  }
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  bio: string | null
  location: string | null
  website: string | null
  created_at: string
  updated_at: string
}

// API Response types
export interface ChannelsResponse {
  channels: ChannelWithMessages[]
  categories: BoardCategory[]
}

export interface MessagesResponse {
  messages: MessageWithDetails[]
  has_more: boolean
  cursor: string | null
}

export interface ThreadResponse {
  thread: MessageWithDetails
  replies: MessageWithDetails[]
  has_more: boolean
  cursor: string | null
}

// Form/Input types
export interface CreateChannelInput {
  category_id: string
  name: string
  description?: string
  sort_order?: number
}

export interface CreateMessageInput {
  channel_id: string
  thread_id?: string | null
  content: string
  message_type: 'channel' | 'thread_reply'
  mentions?: string[] // user IDs
}

export interface CreateReactionInput {
  message_id: string
  emoji_code: string
}

export interface UpdateMessageInput {
  content: string
  mentions?: string[]
}

// Search and filter types
export interface MessageSearchQuery {
  q?: string
  channel_id?: string
  author_id?: string
  from_date?: string
  to_date?: string
  has_reactions?: boolean
  message_type?: 'channel' | 'thread_reply'
  limit?: number
  cursor?: string
}

export interface MessageSearchResult {
  messages: MessageWithDetails[]
  total_count: number
  has_more: boolean
  cursor: string | null
}

// Real-time event types
export interface RealtimeEvent {
  type: 'message' | 'reaction' | 'mention' | 'typing' | 'presence'
  payload: any
  channel_id: string
  user_id: string
  timestamp: string
}

export interface MessageEvent extends RealtimeEvent {
  type: 'message'
  payload: {
    action: 'insert' | 'update' | 'delete'
    message: MessageWithDetails
  }
}

export interface ReactionEvent extends RealtimeEvent {
  type: 'reaction'
  payload: {
    action: 'insert' | 'delete'
    reaction: ReactionWithUser
  }
}

export interface TypingEvent extends RealtimeEvent {
  type: 'typing'
  payload: {
    user: Profile
    is_typing: boolean
  }
}

// Emoji/Reaction constants
export const EMOJI_REACTIONS = [
  { code: 'thumbs_up', emoji: '👍', name: 'Thumbs up' },
  { code: 'heart', emoji: '❤️', name: 'Heart' },
  { code: 'smile', emoji: '😊', name: 'Smile' },
  { code: 'laugh', emoji: '😂', name: 'Laugh' },
  { code: 'surprised', emoji: '😮', name: 'Surprised' },
  { code: 'sad', emoji: '😢', name: 'Sad' },
  { code: 'fire', emoji: '🔥', name: 'Fire' },
  { code: 'clap', emoji: '👏', name: 'Clap' },
  { code: 'thinking', emoji: '🤔', name: 'Thinking' },
  { code: 'check', emoji: '✅', name: 'Check' },
] as const

export type EmojiCode = typeof EMOJI_REACTIONS[number]['code']