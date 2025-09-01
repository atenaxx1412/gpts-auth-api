'use client'

import { useState } from 'react'
import { ApiKeyValidator } from '@/lib/validators/apikey'

interface URLCreateFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function URLCreateForm({ onSuccess, onCancel }: URLCreateFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [authType, setAuthType] = useState<'password' | 'basic' | 'apikey' | 'oauth'>('password')
  const [authConfig, setAuthConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuthConfigChange = (field: string, value: string) => {
    setAuthConfig((prev: Record<string, string>) => ({
      ...prev,
      [field]: value
    }))
  }

  const generateApiKey = () => {
    const newApiKey = ApiKeyValidator.generateApiKey()
    setAuthConfig({ apiKey: newApiKey })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          authType,
          authConfig
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create URL')
      }

      onSuccess()
    } catch {
      console.error('Failed to create URL')
      setError('URL作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const renderAuthConfig = () => {
    switch (authType) {
      case 'password':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">パスワード</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={authConfig.password || ''}
              onChange={(e) => handleAuthConfigChange('password', e.target.value)}
              required
            />
          </div>
        )
      case 'basic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ユーザー名</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={authConfig.username || ''}
                onChange={(e) => handleAuthConfigChange('username', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">パスワード</label>
              <input
                type="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={authConfig.password || ''}
                onChange={(e) => handleAuthConfigChange('password', e.target.value)}
                required
              />
            </div>
          </div>
        )
      case 'apikey':
        return (
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">APIキー</label>
              <button
                type="button"
                onClick={generateApiKey}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                自動生成
              </button>
            </div>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={authConfig.apiKey || ''}
              onChange={(e) => handleAuthConfigChange('apiKey', e.target.value)}
              required
            />
          </div>
        )
      case 'oauth':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">クライアントID</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={authConfig.clientId || ''}
                onChange={(e) => handleAuthConfigChange('clientId', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">リダイレクトURI</label>
              <input
                type="url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={authConfig.redirectUri || ''}
                onChange={(e) => handleAuthConfigChange('redirectUri', e.target.value)}
                required
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">新しいURLを作成</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">URL名</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">説明（任意）</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">認証方式</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={authType}
              onChange={(e) => setAuthType(e.target.value as 'password' | 'basic' | 'apikey' | 'oauth')}
            >
              <option value="password">パスワード認証</option>
              <option value="basic">Basic認証</option>
              <option value="apikey">APIキー認証</option>
              <option value="oauth">OAuth認証</option>
            </select>
          </div>

          {renderAuthConfig()}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '作成中...' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}