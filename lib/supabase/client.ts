import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            if (typeof document !== 'undefined') {
              const value = document.cookie
                .split('; ')
                .find(row => row.startsWith(`${name}=`))
                ?.split('=')[1]
              return value ? decodeURIComponent(value) : undefined
            }
          } catch (error) {
            console.warn(`Failed to get cookie ${name}:`, error)
            // 破損したクッキーを削除
            if (typeof document !== 'undefined' && name.startsWith('sb-')) {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
            }
            return undefined
          }
        },
        set(name: string, value: string, options: any) {
          try {
            if (typeof document !== 'undefined') {
              let cookieString = `${name}=${encodeURIComponent(value)}`
              if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
              if (options?.path) cookieString += `; path=${options.path}`
              if (options?.domain) cookieString += `; domain=${options.domain}`
              if (options?.secure) cookieString += '; secure'
              if (options?.httpOnly) cookieString += '; httponly'
              if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
              document.cookie = cookieString
            }
          } catch (error) {
            console.warn(`Failed to set cookie ${name}:`, error)
          }
        },
        remove(name: string, options: any) {
          try {
            if (typeof document !== 'undefined') {
              let cookieString = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
              if (options?.path) cookieString = `${name}=; path=${options.path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
              document.cookie = cookieString
            }
          } catch (error) {
            console.warn(`Failed to remove cookie ${name}:`, error)
          }
        }
      }
    }
  )