'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Home, MapPin, MessageSquare, Coffee, Calendar, Image, Star, User, LogIn, LogOut, UserCircle, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/components/notifications/NotificationBell'

const navigation = [
  { name: 'ホーム', href: '/', icon: Home },
  { name: '掲示板', href: '/board', icon: MessageSquare },
  { name: '大会情報', href: '/events', icon: Calendar },
  { name: 'コラム', href: '/columns', icon: BookOpen },
  { name: 'カフェ', href: '/cafes', icon: Coffee },
  { name: 'コース', href: '/courses', icon: MapPin },
  { name: 'ギャラリー', href: '/gallery', icon: Image },
  { name: 'ギアレビュー', href: '/gear', icon: Star },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (userMenuOpen && !target.closest('[data-user-menu]')) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])


  const handleSignOut = async () => {
    try {
      await signOut()
      setUserMenuOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <nav className="fixed w-full top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container-premium">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                  <img
                    src="/logo.svg"
                    alt="沖縄トライアスロンコミュニティ"
                    className="w-6 h-6"
                  />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-blue-500 to-blue-600 rounded-2xl blur-md opacity-20 group-hover:opacity-60 transition duration-500"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-black dark:text-white japanese-text">
                  沖縄トライアスロン
                </span>
                <div className="text-xs text-black dark:text-white font-semibold tracking-wider uppercase">
                  OKINAWA TRIATHLON
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.slice(0, 4).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'text-black dark:text-white hover:text-blue-600'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg"></div>
                    )}
                    <div className="relative flex items-center space-x-1.5">
                      <item.icon size={16} />
                      <span className="japanese-text">{item.name}</span>
                    </div>
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    )}
                  </Link>
                )
              })}
              
              {/* More Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-black dark:text-white hover:text-blue-600 transition-all duration-300 whitespace-nowrap">
                  <span className="japanese-text">その他</span>
                  <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown */}
                <div className="absolute top-full right-0 mt-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white dark:bg-black p-3 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
                    {navigation.slice(4).map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                              : 'text-black dark:text-white hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <item.icon size={18} />
                          <span className="japanese-text">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              {user && <NotificationBell />}

              {/* Auth Controls */}
              {!loading && (
                <div className="hidden sm:flex items-center space-x-3">
                  {user ? (
                    /* User Menu */
                    <div className="relative" data-user-menu>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                      >
                        <UserCircle size={18} />
                        <span className="text-sm font-medium">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </span>
                      </button>
                      
                      {/* User Dropdown */}
                      {userMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-48 opacity-100 visible z-50">
                          <div className="bg-white dark:bg-black p-2 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
                            <Link
                              href="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                              <User size={16} />
                              <span>プロフィール</span>
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                            >
                              <LogOut size={16} />
                              <span>ログアウト</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Login/Signup Buttons */
                    <div className="flex items-center space-x-2">
                      <Link
                        href="/auth/login"
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-black dark:text-white hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                      >
                        <LogIn size={18} />
                        <span>ログイン</span>
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm hover:from-blue-500/90 hover:to-blue-600/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <UserCircle size={18} />
                        <span>登録</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-black dark:text-white hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden transition-all duration-300 opacity-100 visible">
            <div className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
              <div className="container-premium py-6">
                <div className="grid grid-cols-2 gap-3">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center space-x-3 px-4 py-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="japanese-text">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
                
                {/* Mobile Auth Controls */}
                {!loading && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                          <UserCircle size={20} className="text-blue-600" />
                          <span className="text-sm font-medium text-black dark:text-white">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                          </span>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                        >
                          <LogOut size={18} />
                          <span className="text-sm font-medium">ログアウト</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link
                          href="/auth/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
                        >
                          <LogIn size={18} />
                          <span className="text-sm font-medium">ログイン</span>
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium text-sm shadow-lg transition-all duration-300"
                        >
                          <UserCircle size={18} />
                          <span>アカウント作成</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16"></div>
    </>
  )
}