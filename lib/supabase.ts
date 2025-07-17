import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          name: string
          description: string | null
          type: string
          distance: number
          area: string
          difficulty_level: number | null
          elevation_gain: number | null
          map_url: string | null
          image_url: string | null
          is_featured: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: string
          distance: number
          area: string
          difficulty_level?: number | null
          elevation_gain?: number | null
          map_url?: string | null
          image_url?: string | null
          is_featured?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: string
          distance?: number
          area?: string
          difficulty_level?: number | null
          elevation_gain?: number | null
          map_url?: string | null
          image_url?: string | null
          is_featured?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cafes: {
        Row: {
          id: string
          name: string
          description: string | null
          area: string
          address: string
          phone: string | null
          hours: string | null
          has_bike_rack: boolean
          has_shower: boolean
          image_url: string | null
          map_url: string | null
          latitude: number | null
          longitude: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          area: string
          address: string
          phone?: string | null
          hours?: string | null
          has_bike_rack?: boolean
          has_shower?: boolean
          image_url?: string | null
          map_url?: string | null
          latitude?: number | null
          longitude?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          area?: string
          address?: string
          phone?: string | null
          hours?: string | null
          has_bike_rack?: boolean
          has_shower?: boolean
          image_url?: string | null
          map_url?: string | null
          latitude?: number | null
          longitude?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cafe_posts: {
        Row: {
          id: string
          cafe_id: string
          user_id: string
          title: string
          content: string
          image_url: string | null
          like_count: number
          comment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cafe_id: string
          user_id: string
          title: string
          content: string
          image_url?: string | null
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cafe_id?: string
          user_id?: string
          title?: string
          content?: string
          image_url?: string | null
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      cafe_post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          comment: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          comment: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      cafe_post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      gallery_photos: {
        Row: {
          id: string
          user_id: string
          photo_url: string
          caption: string | null
          category: string | null
          like_count: number
          comment_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          photo_url: string
          caption?: string | null
          category?: string | null
          like_count?: number
          comment_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          photo_url?: string
          caption?: string | null
          category?: string | null
          like_count?: number
          comment_count?: number
          created_at?: string
        }
      }
      gallery_photo_tags: {
        Row: {
          id: string
          photo_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          tag?: string
          created_at?: string
        }
      }
      gallery_photo_comments: {
        Row: {
          id: string
          photo_id: string
          user_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          user_id?: string
          comment?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          location: string | null
          joined_date: string
          total_distance: number
          post_count: number
          comment_count: number
          achievement_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          joined_date?: string
          total_distance?: number
          post_count?: number
          comment_count?: number
          achievement_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          joined_date?: string
          total_distance?: number
          post_count?: number
          comment_count?: number
          achievement_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          achievement_date: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          achievement_date: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          achievement_date?: string
          icon?: string | null
          created_at?: string
        }
      }
      training_logs: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          distance: number | null
          duration: string | null
          pace: string | null
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          distance?: number | null
          duration?: string | null
          pace?: string | null
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          distance?: number | null
          duration?: string | null
          pace?: string | null
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      board_posts: {
        Row: {
          id: string
          category_id: string
          title: string
          content: string
          author_id: string
          view_count: number
          like_count: number
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          title: string
          content: string
          author_id: string
          view_count?: number
          like_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          title?: string
          content?: string
          author_id?: string
          view_count?: number
          like_count?: number
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      board_replies: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_reply_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_reply_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_reply_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      board_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          sort_order?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}