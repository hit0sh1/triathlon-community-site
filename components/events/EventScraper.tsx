'use client'

import { useState } from 'react'
import { Download, Globe, Link, Upload, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'

interface ScrapedEvent {
  name: string
  event_type?: string
  event_date?: string
  location: string
  description?: string
  entry_status?: string
  website_url?: string
  image_url?: string
  distances?: Array<{
    discipline: 'swim' | 'bike' | 'run'
    distance: string
  }>
}

interface EventScraperProps {
  onEventsImported?: () => void
}

export default function EventScraper({ onEventsImported }: EventScraperProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'major_sites' | 'manual'>('url')
  const [loading, setLoading] = useState(false)
  const [scrapedEvents, setScrapedEvents] = useState<ScrapedEvent[]>([])
  const [targetUrl, setTargetUrl] = useState('')
  const [importResults, setImportResults] = useState<any>(null)

  // URLからスクレイピング
  const handleUrlScraping = async () => {
    if (!targetUrl) {
      toast.error('URLを入力してください')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/events/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'url',
          url: targetUrl
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'スクレイピングに失敗しました')
      }

      setScrapedEvents(result.events)
      toast.success(`${result.count}件の大会情報を取得しました`)

    } catch (error) {
      console.error('Scraping error:', error)
      toast.error(error instanceof Error ? error.message : 'スクレイピングエラー')
    } finally {
      setLoading(false)
    }
  }

  // メジャーサイトから一括取得
  const handleMajorSitesScraping = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/events/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'major_sites'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '一括取得に失敗しました')
      }

      setScrapedEvents(result.events)
      toast.success(`${result.count}件の大会情報を取得しました`)

    } catch (error) {
      console.error('Major sites scraping error:', error)
      toast.error(error instanceof Error ? error.message : '一括取得エラー')
    } finally {
      setLoading(false)
    }
  }

  // 大会情報をデータベースにインポート
  const handleImportEvents = async () => {
    if (scrapedEvents.length === 0) {
      toast.error('インポートする大会がありません')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: scrapedEvents,
          options: {
            allow_duplicates: false
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'インポートに失敗しました')
      }

      setImportResults(result.results)
      toast.success(result.message)
      
      if (onEventsImported) {
        onEventsImported()
      }

    } catch (error) {
      console.error('Import error:', error)
      toast.error(error instanceof Error ? error.message : 'インポートエラー')
    } finally {
      setLoading(false)
    }
  }

  // イベントデータの編集
  const handleEventEdit = (index: number, field: string, value: string) => {
    const updatedEvents = [...scrapedEvents]
    updatedEvents[index] = {
      ...updatedEvents[index],
      [field]: value
    }
    setScrapedEvents(updatedEvents)
  }

  // イベントを削除
  const handleEventRemove = (index: number) => {
    const updatedEvents = scrapedEvents.filter((_, i) => i !== index)
    setScrapedEvents(updatedEvents)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        大会情報スクレイピング
      </h3>

      {/* タブメニュー */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'url'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link size={16} />
              URL指定
            </div>
          </button>
          <button
            onClick={() => setActiveTab('major_sites')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'major_sites'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe size={16} />
              一括取得
            </div>
          </button>
        </div>
      </div>

      {/* URL指定タブ */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              大会ページのURL
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/event-page"
                className="flex-1"
              />
              <Button
                onClick={handleUrlScraping}
                disabled={loading || !targetUrl}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                取得
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              大会の詳細ページのURLを入力してください
            </p>
          </div>
        </div>
      )}

      {/* 一括取得タブ */}
      {activeTab === 'major_sites' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
              対応サイト
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium text-sm">JTU (日本トライアスロン連合)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">公認大会情報</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium text-sm">M-SPO</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">大会エントリーサイト</div>
              </div>
            </div>
            <Button
              onClick={handleMajorSitesScraping}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <Globe size={16} className="mr-2" />
              )}
              主要サイトから一括取得
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              複数の大会情報サイトから最新の大会情報を取得します
            </p>
          </div>
        </div>
      )}

      {/* 取得結果の表示 */}
      {scrapedEvents.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              取得した大会情報 ({scrapedEvents.length}件)
            </h4>
            <Button
              onClick={handleImportEvents}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              データベースにインポート
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {scrapedEvents.map((event, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">大会名</label>
                    <Input
                      value={event.name}
                      onChange={(e) => handleEventEdit(index, 'name', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">開催地</label>
                    <Input
                      value={event.location}
                      onChange={(e) => handleEventEdit(index, 'location', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">開催日</label>
                    <Input
                      type="date"
                      value={event.event_date || ''}
                      onChange={(e) => handleEventEdit(index, 'event_date', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">種目</label>
                    <select
                      value={event.event_type || 'トライアスロン'}
                      onChange={(e) => handleEventEdit(index, 'event_type', e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value="トライアスロン">トライアスロン</option>
                      <option value="マラソン">マラソン</option>
                      <option value="サイクリング">サイクリング</option>
                      <option value="スイム">スイム</option>
                      <option value="その他">その他</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">説明</label>
                  <Textarea
                    value={event.description || ''}
                    onChange={(e) => handleEventEdit(index, 'description', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEventRemove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle size={16} className="mr-1" />
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* インポート結果の表示 */}
      {importResults && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
            インポート結果
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>インポート成功: {importResults.imported}件</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-yellow-500" />
              <span>スキップ: {importResults.skipped}件</span>
            </div>
            {importResults.errors.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={16} className="text-red-500" />
                  <span>エラー:</span>
                </div>
                <ul className="ml-6 space-y-1">
                  {importResults.errors.map((error: string, index: number) => (
                    <li key={index} className="text-red-600 dark:text-red-400 text-xs">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}