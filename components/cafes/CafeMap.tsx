'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'

interface CafeMapProps {
  latitude?: number
  longitude?: number
  cafeName: string
  address: string
}

export default function CafeMap({ latitude, longitude, cafeName, address }: CafeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoadError, setMapLoadError] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    // Google Maps APIキーが設定されていない場合のフォールバック
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('Google Maps API key is not set')
      setMapLoadError(true)
      return
    }

    // Google Maps APIを動的に読み込み
    const loadMap = async () => {
      try {
        await loadGoogleMapsAPI()
        setIsMapLoaded(true)
        
        // 座標が設定されていない場合は住所から座標を取得
        if (!latitude || !longitude) {
          if (address && (window as any).google && (window as any).google.maps) {
            const geocoder = new (window as any).google.maps.Geocoder()
            geocoder.geocode({ address: address }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0]) {
                const location = results[0].geometry.location
                initializeMap(location.lat(), location.lng())
              } else {
                setMapLoadError(true)
              }
            })
          }
        } else {
          initializeMap(latitude, longitude)
        }
      } catch (error) {
        // Google Maps APIの読み込みエラーは一般的で、多くの場合コンテンツブロッカーによるものです
        if (process.env.NODE_ENV === 'development') {
          console.warn('Google Maps API loading failed:', error)
          console.info('This is often caused by content blockers and does not affect core functionality')
        }
        setMapLoadError(true)
      }
    }

    loadMap()

    // クリーンアップは不要（動的読み込みのため）
    return () => {}
  }, [latitude, longitude, address, cafeName, isMapLoaded])

  const initializeMap = (lat: number, lng: number) => {
    if (!mapRef.current || !(window as any).google) return

    // 既存のマップがある場合は更新のみ
    if (mapInstanceRef.current && markerRef.current) {
      const newPosition = { lat, lng }
      mapInstanceRef.current.setCenter(newPosition)
      markerRef.current.setPosition(newPosition)
      return
    }

    // 新規マップの作成
    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    const marker = new (window as any).google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: cafeName,
    })

    // 情報ウィンドウを追加
    const infoWindow = new (window as any).google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <strong>${cafeName}</strong><br>
          <span style="color: #666; font-size: 14px;">${address}</span>
        </div>
      `,
    })

    marker.addListener('click', () => {
      infoWindow.open(map, marker)
    })

    mapInstanceRef.current = map
    markerRef.current = marker
  }

  // Google Maps APIが利用できない場合のフォールバック表示
  const renderFallback = () => {
    const googleMapsUrl = latitude && longitude 
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || cafeName)}`
    
    const openStreetMapUrl = latitude && longitude
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address || cafeName)}`
    
    const yahooMapUrl = latitude && longitude
      ? `https://map.yahoo.co.jp/maps?lat=${latitude}&lon=${longitude}&zoom=15`
      : `https://map.yahoo.co.jp/search?p=${encodeURIComponent(address || cafeName)}`

    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{cafeName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{address}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <ExternalLink size={14} />
              <span>Google Maps</span>
            </a>
            <a 
              href={openStreetMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Navigation size={14} />
              <span>OpenStreetMap</span>
            </a>
            <a 
              href={yahooMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <MapPin size={14} />
              <span>Yahooマップ</span>
            </a>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-3 space-y-1">
            <p>
              {mapLoadError ? 'マップの読み込みに失敗しました。' : 'マップAPIキーが設定されていません。'}
            </p>
            <p>上記のリンクから地図をご確認いただけます。</p>
            {mapLoadError && (
              <p className="text-blue-600 dark:text-blue-400">
                ℹ️ 広告ブロッカーを使用している場合に発生することがあります。
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // APIキーが設定されていないかマップ読み込みエラーの場合はフォールバック表示
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || mapLoadError) {
    return (
      <div className="w-full h-64">
        {renderFallback()}
      </div>
    )
  }

  return (
    <div className="w-full h-64 relative">
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">マップを読み込み中...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  )
}

// Google Maps APIを動的に読み込む関数
let isGoogleMapsLoading = false
let isGoogleMapsLoaded = false

export function loadGoogleMapsAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Google Maps API loading attempt:', {
        apiKeyConfigured: !!apiKey,
        isLoading: isGoogleMapsLoading,
        isLoaded: isGoogleMapsLoaded,
        googleExists: typeof (window as any).google !== 'undefined'
      })
    }
    
    if (!apiKey) {
      console.warn('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.')
      reject(new Error('Google Maps API key is not configured'))
      return
    }

    // 既に読み込み済みの場合
    if (isGoogleMapsLoaded && (window as any).google && (window as any).google.maps) {
      resolve()
      return
    }

    // 読み込み中の場合は待機
    if (isGoogleMapsLoading) {
      const checkLoaded = () => {
        if (isGoogleMapsLoaded) {
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    isGoogleMapsLoading = true

    // コールバック関数を設定
    const callbackName = 'initGoogleMaps' + Date.now()
    ;(window as any)[callbackName] = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Google Maps API loaded successfully')
      }
      isGoogleMapsLoaded = true
      isGoogleMapsLoading = false
      delete (window as any)[callbackName]
      resolve()
    }

    // スクリプトタグを動的に作成
    const script = document.createElement('script')
    // regionとlanguageパラメータを追加し、分析機能を無効化
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&region=JP&language=ja&v=quarterly`
    script.async = true
    script.defer = true
    script.setAttribute('data-callback', callbackName)
    
    // エラーハンドリング
    script.onerror = (event) => {
      isGoogleMapsLoading = false
      delete (window as any)[callbackName]
      console.warn('Google Maps API script failed to load:', {
        src: script.src,
        event,
        possibleCauses: [
          'Content blocker (AdBlock, uBlock Origin, etc.)',
          'Network connectivity issues',
          'Invalid API key',
          'API quota exceeded',
          'CORS policy restrictions'
        ]
      })
      reject(new Error('Failed to load Google Maps API - possibly blocked by content blocker'))
    }

    // タイムアウト設定（10秒）
    const timeoutId = setTimeout(() => {
      if (!isGoogleMapsLoaded) {
        isGoogleMapsLoading = false
        delete (window as any)[callbackName]
        document.head.removeChild(script)
        reject(new Error('Google Maps API loading timeout'))
      }
    }, 10000)

    script.onload = () => {
      clearTimeout(timeoutId)
    }

    document.head.appendChild(script)
  })
}

// 従来のコンポーネント（下位互換性のため）
export function GoogleMapsScript() {
  // 動的読み込みを使用するため、何も返さない
  return null
}