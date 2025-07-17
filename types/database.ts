export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      board_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      board_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          like_count: number | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          like_count?: number | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "board_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      board_replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_reply_id: string | null
          post_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "board_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_menu_items: {
        Row: {
          cafe_id: string | null
          category: string | null
          created_at: string | null
          id: string
          item_name: string
          price: string | null
        }
        Insert: {
          cafe_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          item_name: string
          price?: string | null
        }
        Update: {
          cafe_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          item_name?: string
          price?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafe_menu_items_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_reviews: {
        Row: {
          cafe_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cafe_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cafe_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafe_reviews_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          address: string
          area: string
          created_at: string | null
          created_by: string | null
          description: string | null
          has_bike_rack: boolean | null
          has_shower: boolean | null
          hours: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          map_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          area: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          has_bike_rack?: boolean | null
          has_shower?: boolean | null
          hours?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          area?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          has_bike_rack?: boolean | null
          has_shower?: boolean | null
          hours?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          map_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      column_comments: {
        Row: {
          column_id: string | null
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          column_id?: string | null
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          column_id?: string | null
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "column_comments_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "columns"
            referencedColumns: ["id"]
          },
        ]
      }
      columns: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      course_comments: {
        Row: {
          comment: string
          course_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_photos: {
        Row: {
          caption: string | null
          course_id: string | null
          created_at: string | null
          id: string
          photo_url: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          photo_url: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_photos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_ratings: {
        Row: {
          comment: string | null
          course_id: string | null
          created_at: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          area: string
          average_rating: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty_level: number | null
          distance: number
          elevation_gain: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          map_url: string | null
          name: string
          rating_count: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          area: string
          average_rating?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          distance: number
          elevation_gain?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          map_url?: string | null
          name: string
          rating_count?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          area?: string
          average_rating?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty_level?: number | null
          distance?: number
          elevation_gain?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          map_url?: string | null
          name?: string
          rating_count?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_aid_stations: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          items: string
          location: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          items: string
          location: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          items?: string
          location?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_aid_stations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_distances: {
        Row: {
          created_at: string | null
          discipline: string | null
          distance: string
          event_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          discipline?: string | null
          distance: string
          event_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          discipline?: string | null
          distance?: string
          event_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_distances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_results: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          men_winner_time: string | null
          women_winner_time: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          men_winner_time?: string | null
          women_winner_time?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          men_winner_time?: string | null
          women_winner_time?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_results_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          event_id: string | null
          id: string
          participation_year: number | null
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participation_year?: number | null
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participation_year?: number | null
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedules: {
        Row: {
          created_at: string | null
          event_description: string
          event_id: string | null
          id: string
          time_slot: string
        }
        Insert: {
          created_at?: string | null
          event_description: string
          event_id?: string | null
          id?: string
          time_slot: string
        }
        Update: {
          created_at?: string | null
          event_description?: string
          event_id?: string | null
          id?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedules_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_participants: number | null
          description: string | null
          entry_deadline: string | null
          entry_fee: string | null
          entry_status: string | null
          entry_url: string | null
          event_date: string
          event_type: string
          id: string
          image_url: string | null
          location: string
          max_participants: number | null
          name: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          entry_deadline?: string | null
          entry_fee?: string | null
          entry_status?: string | null
          entry_url?: string | null
          event_date: string
          event_type: string
          id?: string
          image_url?: string | null
          location: string
          max_participants?: number | null
          name: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          entry_deadline?: string | null
          entry_fee?: string | null
          entry_status?: string | null
          entry_url?: string | null
          event_date?: string
          event_type?: string
          id?: string
          image_url?: string | null
          location?: string
          max_participants?: number | null
          name?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          question: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          question?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      gallery_photo_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          photo_id: string | null
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          photo_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          photo_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photo_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photo_tags: {
        Row: {
          created_at: string | null
          id: string
          photo_id: string | null
          tag: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          photo_id?: string | null
          tag: string
        }
        Update: {
          created_at?: string | null
          id?: string
          photo_id?: string | null
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string | null
          category: string | null
          comment_count: number | null
          created_at: string | null
          id: string
          like_count: number | null
          photo_url: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          comment_count?: number | null
          created_at?: string | null
          id?: string
          like_count?: number | null
          photo_url: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          comment_count?: number | null
          created_at?: string | null
          id?: string
          like_count?: number | null
          photo_url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_categories: {
        Row: {
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      gear_review_cons: {
        Row: {
          con_point: string
          created_at: string | null
          id: string
          review_id: string | null
        }
        Insert: {
          con_point: string
          created_at?: string | null
          id?: string
          review_id?: string | null
        }
        Update: {
          con_point?: string
          created_at?: string | null
          id?: string
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gear_review_cons_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "gear_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_review_pros: {
        Row: {
          created_at: string | null
          id: string
          pro_point: string
          review_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pro_point: string
          review_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pro_point?: string
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gear_review_pros_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "gear_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_reviews: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string | null
          detailed_review: string | null
          id: string
          image_url: string | null
          price: string | null
          product_name: string
          rating: number
          summary: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          detailed_review?: string | null
          id?: string
          image_url?: string | null
          price?: string | null
          product_name: string
          rating: number
          summary?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          detailed_review?: string | null
          id?: string
          image_url?: string | null
          price?: string | null
          product_name?: string
          rating?: number
          summary?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gear_reviews_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gear_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gear_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          achievement_count: number | null
          avatar_url: string | null
          bio: string | null
          comment_count: number | null
          created_at: string | null
          display_name: string
          id: string
          joined_date: string | null
          location: string | null
          post_count: number | null
          strava_athlete_id: number | null
          strava_connected: boolean | null
          total_distance: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          achievement_count?: number | null
          avatar_url?: string | null
          bio?: string | null
          comment_count?: number | null
          created_at?: string | null
          display_name: string
          id: string
          joined_date?: string | null
          location?: string | null
          post_count?: number | null
          strava_athlete_id?: number | null
          strava_connected?: boolean | null
          total_distance?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          achievement_count?: number | null
          avatar_url?: string | null
          bio?: string | null
          comment_count?: number | null
          created_at?: string | null
          display_name?: string
          id?: string
          joined_date?: string | null
          location?: string | null
          post_count?: number | null
          strava_athlete_id?: number | null
          strava_connected?: boolean | null
          total_distance?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      strava_activities: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string | null
          distance: number | null
          elapsed_time: number | null
          id: string
          moving_time: number | null
          start_date: string
          strava_activity_id: number
          total_elevation_gain: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_data: Json
          activity_type: string
          created_at?: string | null
          distance?: number | null
          elapsed_time?: number | null
          id?: string
          moving_time?: number | null
          start_date: string
          strava_activity_id: number
          total_elevation_gain?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string | null
          distance?: number | null
          elapsed_time?: number | null
          id?: string
          moving_time?: number | null
          start_date?: string
          strava_activity_id?: number
          total_elevation_gain?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_connections: {
        Row: {
          access_token: string
          athlete_data: Json | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          refresh_token: string
          scope: string
          strava_athlete_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          athlete_data?: Json | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          refresh_token: string
          scope: string
          strava_athlete_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          athlete_data?: Json | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          refresh_token?: string
          scope?: string
          strava_athlete_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_goals: {
        Row: {
          created_at: string | null
          goal_type: string | null
          id: string
          target_distance: number | null
          target_period: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          goal_type?: string | null
          id?: string
          target_distance?: number | null
          target_period?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          goal_type?: string | null
          id?: string
          target_distance?: number | null
          target_period?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          date: string
          distance: number | null
          duration: unknown | null
          id: string
          notes: string | null
          pace: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          date: string
          distance?: number | null
          duration?: unknown | null
          id?: string
          notes?: string | null
          pace?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          date?: string
          distance?: number | null
          duration?: unknown | null
          id?: string
          notes?: string | null
          pace?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_date: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          achievement_date: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          achievement_date?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      monthly_training_summary: {
        Row: {
          activity_count: number | null
          activity_type: string | null
          month: string | null
          total_distance: number | null
          total_hours: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      update_course_rating_stats: {
        Args: { course_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const