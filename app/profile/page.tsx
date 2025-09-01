'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { User } from '@/types'

interface ProfileForm {
  displayName: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState<User | null>(null)
  const [formData, setFormData] = useState<ProfileForm>({
    displayName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      loadUserProfile()
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        setProfileData(userDoc.data() as User)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage(null)

    try {
      // Update display name
      if (formData.displayName !== user.displayName) {
        await updateProfile(user, { displayName: formData.displayName })
      }

      // Update Firestore user document
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        displayName: formData.displayName,
        updatedAt: new Date()
      })

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('パスワードが一致しません')
        }

        if (!formData.currentPassword) {
          throw new Error('現在のパスワードを入力してください')
        }

        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email!, formData.currentPassword)
        await reauthenticateWithCredential(user, credential)
        
        // Update password
        await updatePassword(user, formData.newPassword)
      }

      setMessage({ type: 'success', text: 'プロファイルが更新されました' })
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'プロファイル更新に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">認証が必要です</h1>
          <p className="text-gray-600">プロファイルにアクセスするにはログインが必要です。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">ユーザープロファイル</h1>

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
            {/* Basic Info Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">メールアドレスは変更できません</p>
                </div>

                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                    表示名
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="表示名を入力"
                  />
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">パスワード変更</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    現在のパスワード
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="現在のパスワード"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    新しいパスワード
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="新しいパスワード（8文字以上）"
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード確認
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="新しいパスワードをもう一度入力"
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {/* Account Info Section */}
            <div className="pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">アカウント情報</h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ユーザーID:</span>
                  <p className="text-gray-600 font-mono">{user.uid}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">作成日:</span>
                  <p className="text-gray-600">
                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">最終ログイン:</span>
                  <p className="text-gray-600">
                    {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ja-JP') : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">メール認証:</span>
                  <p className={`${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {user.emailVerified ? '認証済み' : '未認証'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                戻る
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {loading ? '更新中...' : 'プロファイル更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}