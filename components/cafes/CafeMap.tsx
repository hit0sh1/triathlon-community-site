'use client'

import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    // Google Maps APIキーが設定されていない場合のフォールバック
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      console.warn('Google Maps API key is not set')
      return
    }

    // 座標が設定されていない場合は住所から座標を取得
    if (!latitude || !longitude) {
      // 住所から座標を取得する処理（Geocoding）
      if (address && (window as any).google && (window as any).google.maps) {
        const geocoder = new (window as any).google.maps.Geocoder()
        geocoder.geocode({ address: address }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location
            initializeMap(location.lat(), location.lng())
          }
        })
      }
    } else {
      initializeMap(latitude, longitude)
    }
  }, [latitude, longitude, address, cafeName])

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
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">地図を表示するには</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Google Maps APIキーの設定が必要です</p>
          {address && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">{address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
              >
                Google Mapsで見る →
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // APIキーが設定されていない場合はフォールバック表示
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return renderFallback()
  }

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  )
}

// Google Maps APIを読み込むためのスクリプトタグを追加するコンポーネント
export function GoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return null
  }

  return (
    <script
      async
      defer
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`}
    />
  )
}