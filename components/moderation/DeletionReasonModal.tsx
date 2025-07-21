'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { getDeletionReasons, getSeverityIcon, getSeverityStyle, DeletionReasonOption } from '@/lib/content-actions'

interface DeletionReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reasonId?: string, customReason?: string, adminNotes?: string) => void
  title: string
  contentTitle: string
  isLoading: boolean
}

export default function DeletionReasonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  contentTitle,
  isLoading
}: DeletionReasonModalProps) {
  const [reasons, setReasons] = useState<DeletionReasonOption[]>([])
  const [selectedReasonId, setSelectedReasonId] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loadingReasons, setLoadingReasons] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadDeletionReasons()
    }
  }, [isOpen])

  const loadDeletionReasons = async () => {
    try {
      setLoadingReasons(true)
      const data = await getDeletionReasons()
      setReasons(data)
    } catch (error) {
      console.error('Error loading deletion reasons:', error)
    } finally {
      setLoadingReasons(false)
    }
  }

  const handleConfirm = () => {
    // 選択された理由または カスタム理由が必要
    if (!selectedReasonId && !customReason.trim()) {
      alert('削除理由を選択するか、カスタム理由を入力してください。')
      return
    }

    onConfirm(
      selectedReasonId || undefined,
      customReason.trim() || undefined,
      adminNotes.trim() || undefined
    )
  }

  const handleCancel = () => {
    setSelectedReasonId('')
    setCustomReason('')
    setAdminNotes('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              {title}
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">削除対象:</p>
            <p className="font-medium text-black dark:text-white">{contentTitle}</p>
          </div>

          {loadingReasons ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">削除理由を読み込み中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-black dark:text-white">削除理由を選択してください:</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reasons.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedReasonId === reason.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.id}
                      checked={selectedReasonId === reason.id}
                      onChange={(e) => setSelectedReasonId(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getSeverityIcon(reason.severity)}</span>
                        <span className="font-medium text-black dark:text-white">
                          {reason.name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSeverityStyle(reason.severity)}`}>
                          {reason.severity}
                        </span>
                      </div>
                      {reason.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {reason.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  カスタム理由（オプション）
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
                  rows={3}
                  placeholder="具体的な理由があれば記入してください..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  管理者メモ（内部用）
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white"
                  rows={2}
                  placeholder="内部管理用のメモ（ユーザーには表示されません）"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || loadingReasons || (!selectedReasonId && !customReason.trim())}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                削除中...
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                削除する
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}