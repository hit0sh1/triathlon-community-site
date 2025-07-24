/**
 * Supabaseクッキーをクリアするユーティリティ関数
 */
export function clearSupabaseCookies() {
  if (typeof document === 'undefined') return

  // Supabaseクッキーのプレフィックス
  const supabasePrefixes = ['sb-', 'supabase-auth-token']
  
  try {
    // 現在のクッキーをすべて取得
    const cookies = document.cookie.split(';')
    
    cookies.forEach(cookie => {
      const [name] = cookie.trim().split('=')
      
      // Supabase関連のクッキーかチェック
      const isSupabaseCookie = supabasePrefixes.some(prefix => name.startsWith(prefix))
      
      if (isSupabaseCookie) {
        // クッキーを削除（複数のパスとドメインで試行）
        const deleteOptions = [
          { path: '/' },
          { path: '/', domain: window.location.hostname },
          { path: '/', domain: `.${window.location.hostname}` },
          { path: '/auth' },
          { path: '/board' }
        ]
        
        deleteOptions.forEach(options => {
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
          if (options.path) cookieString += ` path=${options.path};`
          if (options.domain) cookieString += ` domain=${options.domain};`
          document.cookie = cookieString
        })
        
        console.log(`Cleared Supabase cookie: ${name}`)
      }
    })
    
    // ローカルストレージからもSupabase関連のデータを削除
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key)
        console.log(`Cleared localStorage: ${key}`)
      }
    })
    
    // セッションストレージからもSupabase関連のデータを削除
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key)
        console.log(`Cleared sessionStorage: ${key}`)
      }
    })
    
    console.log('Supabase cookies and storage cleared successfully')
    
  } catch (error) {
    console.error('Failed to clear Supabase cookies:', error)
  }
}

/**
 * 開発環境でのデバッグ用：破損したクッキーをチェック
 */
export function debugCookies() {
  if (typeof document === 'undefined') return

  console.group('🍪 Cookie Debug Information')
  
  try {
    const cookies = document.cookie.split(';')
    console.log('Total cookies:', cookies.length)
    
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      
      if (name.startsWith('sb-')) {
        console.log(`Supabase Cookie: ${name}`)
        console.log(`Value length: ${value?.length || 0}`)
        console.log(`Raw value: ${value?.substring(0, 50)}...`)
        
        // JSONパース可能かチェック
        if (value) {
          try {
            // Base64デコードしてJSONパースを試行
            if (value.startsWith('base64-')) {
              const decoded = atob(value.substring(7))
              JSON.parse(decoded)
              console.log('✅ Valid JSON format')
            } else {
              JSON.parse(decodeURIComponent(value))
              console.log('✅ Valid JSON format')
            }
          } catch (parseError) {
            console.error('❌ Invalid JSON format:', parseError)
            console.log('🔧 Consider clearing this cookie')
          }
        }
        console.log('---')
      }
    })
  } catch (error) {
    console.error('Cookie debug failed:', error)
  }
  
  console.groupEnd()
}