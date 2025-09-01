'use client'

import { useAuth } from '@/components/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { URLCreateForm } from '@/components/URLCreateForm'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { URL as URLType } from '@/types'
import { KeyIcon, ChartBarIcon, BoltIcon, UserIcon, PencilIcon, TrashIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/solid'

function DashboardContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [urls, setUrls] = useState<URLType[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/admin/urls')
      if (response.ok) {
        const data = await response.json()
        setUrls(data.urls)
      }
    } catch (error) {
      console.error('Failed to fetch URLs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    fetchUrls()
  }

  const toggleUrlStatus = async (urlId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/urls/${urlId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        fetchUrls()
      }
    } catch (error) {
      console.error('Failed to toggle URL status:', error)
    }
  }

  const deleteUrl = async (urlId: string, urlName: string) => {
    if (!confirm(`「${urlName}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/urls/${urlId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchUrls()
      } else {
        alert('URL削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete URL:', error)
      alert('URL削除でエラーが発生しました')
    }
  }

  const editUrl = (urlId: string) => {
    router.push(`/dashboard/edit/${urlId}`)
  }

  const getAuthTypeName = (authType: string) => {
    switch (authType) {
      case 'password': return 'パスワード認証'
      case 'basic': return 'Basic認証'
      case 'apikey': return 'APIキー認証'
      case 'oauth': return 'OAuth認証'
      default: return authType
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">GPTs Auth API Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                <UserIcon className="h-4 w-4" />
                <span>プロファイル</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <KeyIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      作成済みURL
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{urls.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      総アクセス数
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {urls.reduce((total, url) => total + url.accessCount, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <BoltIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      アクティブURL
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {urls.filter(url => url.isActive).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/logs')}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors"
          >
            <EyeIcon className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-medium text-gray-900">アクセスログを表示</span>
          </button>
          
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors"
          >
            <ChartBarIcon className="h-6 w-6 text-green-600" />
            <span className="text-lg font-medium text-gray-900">分析・統計を表示</span>
          </button>

          <button
            onClick={() => router.push('/dashboard/bulk')}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors"
          >
            <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            <span className="text-lg font-medium text-gray-900">バルク操作</span>
          </button>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  APIエンドポイント管理
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  新しいURLを作成
                </button>
              </div>
              
              {loading ? (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">読み込み中...</p>
                </div>
              ) : urls.length === 0 ? (
                <div className="mt-4 text-center py-8">
                  <p className="text-gray-500">まだURLが作成されていません</p>
                </div>
              ) : (
                <div className="mt-6 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          名前
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          認証方式
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          アクセス数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          エンドポイント
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {urls.map((url) => (
                        <tr key={url.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {url.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getAuthTypeName(url.authType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              url.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {url.isActive ? 'アクティブ' : '無効'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {url.accessCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              /api/v1/{url.id}
                            </code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => editUrl(url.id)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                                title="編集"
                              >
                                <PencilIcon className="h-4 w-4" />
                                <span>編集</span>
                              </button>
                              <button
                                onClick={() => toggleUrlStatus(url.id, url.isActive)}
                                className={`flex items-center space-x-1 ${
                                  url.isActive 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={url.isActive ? '無効化' : '有効化'}
                              >
                                <span>{url.isActive ? '無効化' : '有効化'}</span>
                              </button>
                              <button
                                onClick={() => deleteUrl(url.id, url.name)}
                                className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                title="削除"
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span>削除</span>
                              </button>
                            </div>
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

        {showCreateForm && (
          <URLCreateForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}