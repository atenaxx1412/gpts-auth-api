'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { URL as URLType, AuthType } from '@/types'

interface EditFormData {
  name: string
  description: string
  authType: AuthType
  authConfig: Record<string, string>
  isActive: boolean
}

export default function EditUrlPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [urlData, setUrlData] = useState<URLType | null>(null)
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    description: '',
    authType: 'password',
    authConfig: {},
    isActive: true
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (params.urlId && user) {
      loadUrlData()
    }
  }, [params.urlId, user])

  const loadUrlData = async () => {
    try {
      const response = await fetch(`/api/admin/urls/${params.urlId}`)
      if (response.ok) {
        const data = await response.json()
        setUrlData(data.url)
        setFormData({
          name: data.url.name,
          description: data.url.description || '',
          authType: data.url.authType,
          authConfig: data.url.authConfig || {},
          isActive: data.url.isActive
        })
      } else {
        setMessage({ type: 'error', text: 'URLデータの読み込みに失敗しました' })
      }
    } catch (error) {
      console.error('Error loading URL data:', error)
      setMessage({ type: 'error', text: 'URLデータの読み込みでエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/urls/${params.urlId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'URLが更新されました' })
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'URL更新に失敗しました' })
      }
    } catch (error) {
      console.error('Error updating URL:', error)
      setMessage({ type: 'error', text: 'URL更新でエラーが発生しました' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('authConfig.')) {
      const configKey = name.replace('authConfig.', '')
      setFormData(prev => ({
        ...prev,
        authConfig: {
          ...prev.authConfig,
          [configKey]: value
        }
      }))
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const renderAuthConfigFields = () => {
    switch (formData.authType) {
      case 'password':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              name="authConfig.password"
              value={formData.authConfig.password || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="認証用パスワード"
            />
          </div>
        )

      case 'basic':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ユーザー名
              </label>
              <input
                type="text"
                name="authConfig.username"
                value={formData.authConfig.username || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ユーザー名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                name="authConfig.password"
                value={formData.authConfig.password || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="パスワード"
              />
            </div>
          </>
        )

      case 'apikey':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              APIキー
            </label>
            <input
              type="text"
              name="authConfig.apiKey"
              value={formData.authConfig.apiKey || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="APIキー"
            />
          </div>
        )

      case 'oauth':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                name="authConfig.clientId"
                value={formData.authConfig.clientId || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="OAuth Client ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                name="authConfig.clientSecret"
                value={formData.authConfig.clientSecret || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="OAuth Client Secret"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URI
              </label>
              <input
                type="url"
                name="authConfig.redirectUri"
                value={formData.authConfig.redirectUri || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/callback"
              />
            </div>
          </>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!urlData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">URLが見つかりません</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">URL編集</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ダッシュボードに戻る
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL ID
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-gray-600">
                {urlData.id}
              </div>
              <p className="text-xs text-gray-500 mt-1">URL IDは変更できません</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="URLの名前"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="URLの説明（任意）"
              />
            </div>

            <div>
              <label htmlFor="authType" className="block text-sm font-medium text-gray-700 mb-1">
                認証方式 *
              </label>
              <select
                id="authType"
                name="authType"
                value={formData.authType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="password">パスワード認証</option>
                <option value="basic">Basic認証</option>
                <option value="apikey">APIキー認証</option>
                <option value="oauth">OAuth認証</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">認証設定</h3>
              {renderAuthConfigFields()}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                URLを有効化
              </label>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {submitting ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}