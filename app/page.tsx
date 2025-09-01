import Link from 'next/link'
import { LockClosedIcon, UserIcon, KeyIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            GPTs Auth API
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            GPTsカスタムアクション用の安全なAPI/URL発行システム
          </p>
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            ログイン
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
          >
            ダッシュボード <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600">
              <LockClosedIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">パスワード認証</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              シンプルなパスワード保護
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600">
              <UserIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">ID/パスワード認証</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Basic認証形式
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600">
              <KeyIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">APIキー認証</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Headerベースの認証
            </p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-indigo-600">
              <GlobeAltIcon className="h-12 w-12" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">OAuth認証</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              OAuth 2.0フロー対応
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}