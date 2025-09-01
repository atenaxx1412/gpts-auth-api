'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { AccessLog, URL as URLType } from '@/types'
import { CalendarIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/solid'

interface LogsWithUrls extends AccessLog {
  urlName?: string
}

export default function AccessLogsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<LogsWithUrls[]>([])
  const [urls, setUrls] = useState<URLType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    success: 'all',
    urlId: 'all',
    dateRange: '7'
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filter])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load URLs first to get names
      const urlsResponse = await fetch('/api/admin/urls')
      let urlsData: URLType[] = []
      if (urlsResponse.ok) {
        const data = await urlsResponse.json()
        urlsData = data.urls
        setUrls(urlsData)
      }

      // Load access logs
      const logsResponse = await fetch('/api/admin/logs')
      if (logsResponse.ok) {
        const data = await logsResponse.json()
        const logsWithNames = data.logs.map((log: AccessLog) => {
          const url = urlsData.find(u => u.id === log.urlId)
          return {
            ...log,
            urlName: url?.name || 'Unknown'
          }
        })
        setLogs(applyFilters(logsWithNames))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (allLogs: LogsWithUrls[]) => {
    let filtered = [...allLogs]

    // Filter by success status
    if (filter.success !== 'all') {
      filtered = filtered.filter(log => log.success === (filter.success === 'success'))
    }

    // Filter by URL
    if (filter.urlId !== 'all') {
      filtered = filtered.filter(log => log.urlId === filter.urlId)
    }

    // Filter by date range
    const now = new Date()
    const days = parseInt(filter.dateRange)
    if (days > 0) {
      const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoff)
    }

    return filtered
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    )
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStats = () => {
    const total = logs.length
    const successful = logs.filter(log => log.success).length
    const failed = total - successful
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

    return { total, successful, failed, successRate }
  }

  const stats = getStats()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <EyeIcon className="h-6 w-6" />
                <span>アクセスログ</span>
              </h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md border border-gray-300"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">総アクセス数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                <div className="text-sm text-green-600">成功</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-red-600">失敗</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.successRate}%</div>
                <div className="text-sm text-gray-600">成功率</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={filter.success}
                  onChange={(e) => setFilter(prev => ({ ...prev, success: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全て</option>
                  <option value="success">成功のみ</option>
                  <option value="failure">失敗のみ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <select
                  value={filter.urlId}
                  onChange={(e) => setFilter(prev => ({ ...prev, urlId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全てのURL</option>
                  {urls.map(url => (
                    <option key={url.id} value={url.id}>{url.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  期間
                </label>
                <select
                  value={filter.dateRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">過去1日</option>
                  <option value="7">過去7日</option>
                  <option value="30">過去30日</option>
                  <option value="0">全期間</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">該当するアクセスログがありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        時刻
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        認証方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IPアドレス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザーエージェント
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.urlName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.success)}
                            <span className={`text-sm ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                              {log.success ? '成功' : '失敗'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.authMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {log.userAgent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}