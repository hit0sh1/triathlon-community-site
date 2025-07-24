'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { clearSupabaseCookies } from '@/lib/utils/cookies'

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, metadata?: any) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          // クッキー関連のエラーの場合、クッキーをクリア
          if (error.message?.includes('cookie') || 
              error.message?.includes('JSON') || 
              error.message?.includes('base64') ||
              error.message?.includes('Unexpected token') ||
              error.message?.includes('is not valid JSON')) {
            console.warn('Cookie parsing error detected, clearing Supabase cookies')
            clearSupabaseCookies()
            // ページをリロードして新しいセッションを開始
            setTimeout(() => window.location.reload(), 1000)
            return
          }
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error: any) {
        console.error('Failed to get session:', error)
        
        // JSONパースエラーもキャッチ
        if (error?.message?.includes('Failed to parse cookie string') ||
            error?.message?.includes('Unexpected token') ||
            error?.message?.includes('is not valid JSON') ||
            error?.message?.includes('base64-')) {
          console.warn('Cookie JSON parse error detected in getSession, clearing cookies')
          clearSupabaseCookies()
          setTimeout(() => window.location.reload(), 1000)
          return
        }
        
        // その他のセッション取得失敗の場合
        setUser(null)
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signInWithEmail = async (email: string, password: string) => {
    console.log('Attempting email login with:', email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('Sign in result:', { data, error })
    
    if (error) {
      console.error('Sign in error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      // より分かりやすいエラーメッセージに変換
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('メールアドレスまたはパスワードが間違っています。')
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('メールアドレスの確認が完了していません。確認メールをご確認ください。')
      }
      throw error
    }

    // ログイン成功後、認証状態が更新されるまで待機
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('Auth state sync timeout, proceeding anyway')
        resolve()
      }, 3000) // 3秒でタイムアウト

      const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Auth state confirmed: SIGNED_IN')
          clearTimeout(timeout)
          unsubscribe.data.subscription.unsubscribe()
          resolve()
        }
      })
    })
  }

  const signUpWithEmail = async (email: string, password: string, metadata = {}) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}