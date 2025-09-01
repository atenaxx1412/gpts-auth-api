'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { URL as URLType } from '@/types'
import { 
  CheckIcon, 
  CloudArrowUpIcon, 
  CloudArrowDownIcon,
  TrashIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid'

export default function BulkOperationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [urls, setUrls] = useState<URLType[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [operation, setOperation] = useState<'export' | 'import' | 'delete' | null>(null)
  const [csvData, setCsvData] = useState('')
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadUrls()
    }
  }, [user])

  const loadUrls = async () => {
    try {
      const response = await fetch('/api/admin/urls')
      if (response.ok) {
        const data = await response.json()
        setUrls(data.urls)
      }
    } catch (error) {
      console.error('Failed to load URLs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedUrls.size === urls.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(urls.map(url => url.id)))
    }
  }

  const handleSelectUrl = (urlId: string) => {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(urlId)) {
      newSelected.delete(urlId)
    } else {
      newSelected.add(urlId)
    }
    setSelectedUrls(newSelected)
  }

  const exportToCSV = () => {
    const selectedUrlData = urls.filter(url => selectedUrls.has(url.id))
    
    const csvHeaders = 'Name,Description,Auth Type,Is Active,Access Count,Created At,Last Accessed\n'
    const csvRows = selectedUrlData.map(url => {
      const lastAccessed = url.lastAccessed ? new Date(url.lastAccessed).toISOString() : ''
      return [
        `"${url.name.replace(/"/g, '""')}"`,
        `"${(url.description || '').replace(/"/g, '""')}"`,
        url.authType,
        url.isActive ? 'true' : 'false',
        url.accessCount.toString(),
        new Date(url.createdAt).toISOString(),
        lastAccessed
      ].join(',')
    }).join('\n')

    const csvContent = csvHeaders + csvRows
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `urls-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setMessage({ type: 'success', text: `${selectedUrls.size}件のURLをエクスポートしました` })
    setOperation(null)
  }

  const handleImportCSV = async () => {
    if (!csvData.trim()) {
      setMessage({ type: 'error', text: 'CSVデータを入力してください' })
      return
    }

    setImporting(true)
    setMessage(null)

    try {
      const lines = csvData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
      
      const importData = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''))
        const rowData: any = {}
        
        headers.forEach((header, index) => {
          rowData[header.toLowerCase().replace(/ /g, '_')] = values[index] || ''
        })

        // Basic validation
        if (!rowData.name || !rowData.auth_type) {
          continue
        }

        importData.push({
          name: rowData.name,
          description: rowData.description || '',
          authType: rowData.auth_type,
          isActive: rowData.is_active === 'true',
          authConfig: {}
        })
      }

      // Send to API for bulk creation
      const response = await fetch('/api/admin/urls/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: importData })
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: `${result.created}件のURLを作成しました` })
        setCsvData('')
        setOperation(null)
        loadUrls()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'インポートに失敗しました' })
      }
    } catch (error) {
      console.error('Import error:', error)
      setMessage({ type: 'error', text: 'CSVデータの処理でエラーが発生しました' })
    } finally {
      setImporting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUrls.size === 0) {
      setMessage({ type: 'error', text: '削除するURLを選択してください' })
      return
    }

    if (!confirm(`選択した${selectedUrls.size}件のURLを削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/urls/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlIds: Array.from(selectedUrls) })
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: `${result.deleted}件のURLを削除しました` })
        setSelectedUrls(new Set())
        setOperation(null)
        loadUrls()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || '削除に失敗しました' })
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      setMessage({ type: 'error', text: '削除処理でエラーが発生しました' })
    }
  }

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
                <DocumentTextIcon className="h-6 w-6" />
                <span>バルク操作</span>
              </h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md border border-gray-300"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>

          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Operation Selection */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作を選択</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setOperation('export')}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <CloudArrowDownIcon className="h-6 w-6 text-blue-600" />
                <span className="font-medium">CSV エクスポート</span>
              </button>
              
              <button
                onClick={() => setOperation('import')}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <CloudArrowUpIcon className="h-6 w-6 text-green-600" />
                <span className="font-medium">CSV インポート</span>
              </button>
              
              <button
                onClick={() => setOperation('delete')}
                className="flex items-center justify-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <TrashIcon className="h-6 w-6 text-red-600" />
                <span className="font-medium">一括削除</span>
              </button>
            </div>
          </div>

          {/* Export Operation */}
          {operation === 'export' && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">CSV エクスポート</h3>
              <p className="text-gray-600 mb-4">エクスポートするURLを選択してください。</p>
              
              <div className="mb-4">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {selectedUrls.size === urls.length ? '全て解除' : '全て選択'}
                </button>
                <span className="text-gray-500 text-sm ml-2">
                  ({selectedUrls.size}/{urls.length}件選択)
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4">
                {urls.map(url => (
                  <label key={url.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUrls.has(url.id)}
                      onChange={() => handleSelectUrl(url.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{url.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({url.authType})</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={exportToCSV}
                  disabled={selectedUrls.size === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  エクスポート実行
                </button>
                <button
                  onClick={() => setOperation(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Import Operation */}
          {operation === 'import' && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">CSV インポート</h3>
              <p className="text-gray-600 mb-4">
                CSVデータを貼り付けてください。形式: Name,Description,Auth Type,Is Active
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSVデータ
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder={`Name,Description,Auth Type,Is Active
"Test API","Test endpoint","password","true"
"Production API","Main endpoint","apikey","true"`}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">注意事項</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 認証設定は空で作成され、後で個別に設定が必要です</li>
                  <li>• 重複する名前のURLは作成されません</li>
                  <li>• Auth Typeは password, basic, apikey, oauth のいずれかを指定</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleImportCSV}
                  disabled={!csvData.trim() || importing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {importing ? 'インポート中...' : 'インポート実行'}
                </button>
                <button
                  onClick={() => setOperation(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Delete Operation */}
          {operation === 'delete' && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">一括削除</h3>
              <p className="text-gray-600 mb-4">削除するURLを選択してください。</p>
              
              <div className="mb-4">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {selectedUrls.size === urls.length ? '全て解除' : '全て選択'}
                </button>
                <span className="text-gray-500 text-sm ml-2">
                  ({selectedUrls.size}/{urls.length}件選択)
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4">
                {urls.map(url => (
                  <label key={url.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUrls.has(url.id)}
                      onChange={() => handleSelectUrl(url.id)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{url.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({url.accessCount}アクセス)
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  ⚠️ 削除されたURLは復元できません。関連するアクセスログも同時に削除されます。
                </p>
              </div>

              <div className="mt-4 flex space-x-3">
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedUrls.size === 0}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  削除実行
                </button>
                <button
                  onClick={() => setOperation(null)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* URL List */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">URL一覧</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">URLが作成されていません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUrls.size === urls.length && urls.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
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
                        作成日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {urls.map((url) => (
                      <tr key={url.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUrls.has(url.id)}
                            onChange={() => handleSelectUrl(url.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {url.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {url.authType}
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
                          {new Date(url.createdAt).toLocaleDateString('ja-JP')}
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