# GPTs Auth API

GPTs Custom Actions Authentication API - GPTsカスタムアクション用の安全なAPI/URL発行システム

## 概要

このプロジェクトは、GPTsのカスタムアクションに対応した認証機能付きのAPI/URL発行システムです。ユーザーが発行したURLごとに異なる認証方式を設定でき、GPTsのアクション認証と連動して動作します。

## 機能

### 🔐 4つの認証方式
1. **パスワード認証** - シンプルなパスワード保護
2. **ID/パスワードペア認証** - Basic認証形式
3. **APIキー認証** - Headerベースの認証
4. **OAuth認証** - OAuth 2.0フロー対応

### 📊 管理機能
- ワンクリックでユニークなAPIエンドポイントURLを生成
- URLごとの認証情報管理
- アクセスログの記録と閲覧
- リアルタイムでのURL有効化/無効化

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Hosting**: Vercel
- **Security**: bcrypt, JWT, CORS対応

## セットアップ

### 前提条件
- Node.js 18.x以上
- npmまたはyarn
- Firebaseアカウント
- Vercelアカウント（デプロイ用）

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/atenaxx1412/gpts-auth-api.git
cd gpts-auth-api
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env.local
# .env.localファイルを編集してFirebaseの認証情報を設定
```

4. 開発サーバーを起動
```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)で新しいプロジェクトを作成
2. Firestore Databaseを有効化（Production mode）
3. Authenticationを有効化（Email/Password）
4. プロジェクト設定から認証情報を取得
5. `.env.local`に認証情報を設定

## Vercelデプロイ

1. Vercelアカウントでプロジェクトをインポート
2. 環境変数を設定
3. デプロイを実行

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm start

# リント
npm run lint

# 型チェック
npm run type-check

# フォーマット
npm run format
```

## プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── v1/           # Public API (GPTs用)
│   │   └── admin/        # 管理API
│   ├── dashboard/         # ダッシュボード
│   └── login/            # ログインページ
├── components/            # Reactコンポーネント
├── lib/                   # ユーティリティ関数
├── types/                 # TypeScript型定義
└── public/               # 静的ファイル
```

## ライセンス

MIT

## 貢献

Issue、Pull Requestは歓迎します。

## サポート

問題が発生した場合は、[Issues](https://github.com/atenaxx1412/gpts-auth-api/issues)でお知らせください。