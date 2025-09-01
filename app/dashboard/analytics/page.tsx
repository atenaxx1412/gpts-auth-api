'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { AccessLog, URL as URLType } from '@/types'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/solid'

interface UrlAnalytics {
  url: URLType
  totalAccess: number
  successRate: number
  lastAccessed: Date | null
  avgAccessPerDay: number
  authMethodBreakdown: Record<string, number>
  dailyStats: { date: string; count: number; successCount: number }[]
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<UrlAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Load URLs
      const urlsResponse = await fetch('/api/admin/urls')
      if (!urlsResponse.ok) return

      const urlsData = await urlsResponse.json()
      const urls: URLType[] = urlsData.urls

      // Load access logs
      const logsResponse = await fetch('/api/admin/logs')
      if (!logsResponse.ok) return

      const logsData = await logsResponse.json()
      const logs: AccessLog[] = logsData.logs

      // Calculate analytics for each URL
      const analyticsData = urls.map(url => calculateUrlAnalytics(url, logs))
      setAnalytics(analyticsData)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateUrlAnalytics = (url: URLType, allLogs: AccessLog[]): UrlAnalytics => {
    const urlLogs = allLogs.filter(log => log.urlId === url.id)
    
    // Filter by time range
    const days = parseInt(timeRange)
    const cutoff = days > 0 ? new Date(Date.now() - (days * 24 * 60 * 60 * 1000)) : new Date(0)
    const filteredLogs = urlLogs.filter(log => new Date(log.timestamp) >= cutoff)

    const totalAccess = filteredLogs.length
    const successfulAccess = filteredLogs.filter(log => log.success).length
    const successRate = totalAccess > 0 ? Math.round((successfulAccess / totalAccess) * 100) : 0
    
    const lastAccessed = urlLogs.length > 0 
      ? new Date(Math.max(...urlLogs.map(log => new Date(log.timestamp).getTime())))
      : null

    const avgAccessPerDay = days > 0 ? Math.round(totalAccess / days * 10) / 10 : 0

    // Auth method breakdown
    const authMethodBreakdown: Record<string, number> = {}
    filteredLogs.forEach(log => {
      authMethodBreakdown[log.authMethod] = (authMethodBreakdown[log.authMethod] || 0) + 1
    })

    // Daily stats for the last 7 days
    const dailyStats = calculateDailyStats(filteredLogs, 7)

    return {
      url,
      totalAccess,
      successRate,
      lastAccessed,
      avgAccessPerDay,
      authMethodBreakdown,
      dailyStats
    }
  }

  const calculateDailyStats = (logs: AccessLog[], days: number) => {
    const stats = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0]
        return logDate === dateStr
      })
      
      stats.push({
        date: dateStr,
        count: dayLogs.length,
        successCount: dayLogs.filter(log => log.success).length
      })
    }
    
    return stats
  }

  const getOverallStats = () => {
    const totalUrls = analytics.length
    const activeUrls = analytics.filter(a => a.url.isActive).length
    const totalAccess = analytics.reduce((sum, a) => sum + a.totalAccess, 0)
    const avgSuccessRate = analytics.length > 0 
      ? Math.round(analytics.reduce((sum, a) => sum + a.successRate, 0) / analytics.length)
      : 0

    return { totalUrls, activeUrls, totalAccess, avgSuccessRate }
  }

  const overallStats = getOverallStats()

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
                <ArrowTrendingUpIcon className="h-6 w-6" />
                <span>分析・統計</span>
              </h1>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">過去7日</option>
                  <option value="30">過去30日</option>
                  <option value="90">過去90日</option>
                  <option value="0">全期間</option>
                </select>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md border border-gray-300"
                >
                  ダッシュボードに戻る
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">分析データを読み込み中...</p>
            </div>
          ) : (
            <>
              {/* Overall Statistics */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">全体統計</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{overallStats.totalUrls}</div>
                    <div className="text-sm text-blue-600">総URL数</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{overallStats.activeUrls}</div>
                    <div className="text-sm text-green-600">アクティブURL</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{overallStats.totalAccess}</div>
                    <div className="text-sm text-purple-600">総アクセス数</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{overallStats.avgSuccessRate}%</div>
                    <div className="text-sm text-yellow-600">平均成功率</div>
                  </div>
                </div>
              </div>

              {/* URL Analytics */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">URL別分析</h2>
                
                {analytics.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">分析データがありません</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {analytics.map((urlAnalytics) => (
                      <div key={urlAnalytics.url.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{urlAnalytics.url.name}</h3>
                            <p className="text-sm text-gray-600">{urlAnalytics.url.description}</p>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-1">
                              /api/v1/{urlAnalytics.url.id}
                            </code>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                urlAnalytics.url.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {urlAnalytics.url.isActive ? 'アクティブ' : '無効'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{urlAnalytics.totalAccess}</div>
                            <div className="text-xs text-gray-500">総アクセス</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{urlAnalytics.successRate}%</div>
                            <div className="text-xs text-gray-500">成功率</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{urlAnalytics.avgAccessPerDay}</div>
                            <div className="text-xs text-gray-500">日平均アクセス</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">
                              {urlAnalytics.lastAccessed 
                                ? new Date(urlAnalytics.lastAccessed).toLocaleDateString('ja-JP')
                                : 'なし'
                              }
                            </div>
                            <div className="text-xs text-gray-500">最終アクセス</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {Object.keys(urlAnalytics.authMethodBreakdown)[0] || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">主要認証方式</div>
                          </div>
                        </div>

                        {/* Auth Method Breakdown */}
                        {Object.keys(urlAnalytics.authMethodBreakdown).length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">認証方式別アクセス</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(urlAnalytics.authMethodBreakdown).map(([method, count]) => (
                                <span
                                  key={method}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {method}: {count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Daily Access Trend (Simple Bar Chart) */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">過去7日間のアクセス推移</h4>
                          <div className="flex items-end space-x-1 h-20">
                            {urlAnalytics.dailyStats.map((stat, index) => {
                              const maxCount = Math.max(...urlAnalytics.dailyStats.map(s => s.count))
                              const height = maxCount > 0 ? (stat.count / maxCount) * 64 : 0
                              
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div 
                                    className="w-full bg-blue-200 rounded-t"
                                    style={{ height: `${height}px` }}
                                    title={`${stat.date}: ${stat.count}アクセス (成功: ${stat.successCount})`}
                                  >
                                    <div 
                                      className="w-full bg-blue-500 rounded-t"
                                      style={{ 
                                        height: stat.count > 0 ? `${(stat.successCount / stat.count) * height}px` : '0px'
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(stat.date).getDate()}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 flex justify-between">
                            <span>青: 成功　薄青: 失敗</span>
                            <span>過去7日間</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Performance Insights */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">パフォーマンス洞察</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">トップパフォーマンスURL</h3>
                    <div className="space-y-2">
                      {analytics
                        .sort((a, b) => b.successRate - a.successRate)
                        .slice(0, 3)
                        .map((urlAnalytics) => (
                          <div key={urlAnalytics.url.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm text-gray-900">{urlAnalytics.url.name}</span>
                            <span className="text-sm font-medium text-green-600">{urlAnalytics.successRate}%</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">最もアクセスが多いURL</h3>
                    <div className="space-y-2">
                      {analytics
                        .sort((a, b) => b.totalAccess - a.totalAccess)
                        .slice(0, 3)
                        .map((urlAnalytics) => (
                          <div key={urlAnalytics.url.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm text-gray-900">{urlAnalytics.url.name}</span>
                            <span className="text-sm font-medium text-blue-600">{urlAnalytics.totalAccess}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded border">
                    <CalendarIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {analytics.filter(a => a.lastAccessed && 
                        new Date(a.lastAccessed).getTime() > Date.now() - (24 * 60 * 60 * 1000)
                      ).length}
                    </div>
                    <div className="text-xs text-gray-500">過去24時間でアクセスされたURL</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded border">
                    <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {analytics.filter(a => a.successRate >= 95).length}
                    </div>
                    <div className="text-xs text-gray-500">成功率95%以上のURL</div>
                  </div>

                  <div className="text-center p-4 bg-white rounded border">
                    <XCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-gray-900">
                      {analytics.filter(a => a.successRate < 80 && a.totalAccess > 0).length}
                    </div>
                    <div className="text-xs text-gray-500">要注意URL (成功率80%未満)</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}