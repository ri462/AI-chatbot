# FroChat - AI チャットボット

多言語対応のAIチャットボットアプリケーション。教師と学生が学習をサポートするための会話AI。

## 🎯 特徴

- **AIチャット**: AIとリアルタイムで会話可能
- **多言語**: 日本語 / English / Tiếng Việt に対応
- **ユーザー認証**: シンプルな登録・ログイン機能
- **チャット履歴**: 過去の会話を保存・管理
- **ダークモード**: ライト/ダークテーマ切り替え
- **画像対応**: メッセージに画像を添付可能





# FroChat セットアップガイド

このアプリを実行するための手順を説明します。

---

## 前提条件

以下をインストール済みであることを確認してください：

- **XAMPP** (Apache + MySQL + PHP)
  - https://www.apachefriends.org/ からダウンロード
  - インストール済みか確認: `C:\xampp\apache\bin\httpd.exe` が存在すること
  
- **Node.js** (v16以上)
  - https://nodejs.org/ からダウンロード
  - インストール済みか確認: ターミナルで `node --version` を実行

---

## セットアップ手順（5ステップ）

### ステップ1: XAMPPを起動

1. XAMPPコントロールパネルを開く
2. **Apache** の「Start」ボタンをクリック
3. **MySQL** の「Start」ボタンをクリック

✅ 両方が「Running」状態になれば成功

---

### ステップ2: データベースをセットアップ

#### 方法A: PHPMyAdminを使う

1. ブラウザで http://localhost/phpmyadmin を開く
2. 左側の「新規作成」をクリック
3. データベース名を入力して作成
4. 上部の「インポート」タブをクリック
5. `root/db.sql` ファイルを選択
6. 「実行」ボタンをクリック

✅ テーブルが作成されれば成功

#### 方法B: コマンドラインを使う

```bash
mysql -u root < C:\xampp\htdocs\AI-chatbot\root\db.sql
```

---

### ステップ3: デモユーザーを作成（オプション）

テスト用のアカウントを自動作成できます：

```bash
cd C:\xampp\htdocs\AI-chatbot
php create_demo_users.php
```


### ステップ4: フロントエンドをインストール

```bash
cd C:\xampp\htdocs\AI-chatbot\chat-bot-demo\chat-bot
npm install
```


---

### ステップ5: アプリを起動



以下が表示されれば成功：
```
>  cd c:\xampp\htdocs\AI-chatbot\chat-bot-demo\chat-bot; npm run dev

> chat-bot@0.1.0 dev
> next dev

   ▲ Next.js 15.4.6
   - Local:        http://localhost:3000
   - Network:      http://192.168.160.1:3000
   

```

ブラウザで **http://localhost:3000** にアクセス

---

### Mac/Linux の場合

```bash
# XAMPP をインストール後、同じ手順を実行
# 各OSのパスに合わせてコマンドを調整
```

---

## 📦 必要な環境

- **XAMPP** (Apache + MySQL + PHP 7.3以上)
  - ダウンロード: https://www.apachefriends.org/
- **Node.js** (v16以上)
  - ダウンロード: https://nodejs.org/

---


## 初回起動時のテスト

### 1. ゲストモードで試す

- 「登録せずに利用」をクリック
- AIに質問を入力して送信
- 応答が返ってくることを確認

### 2. アカウントを作成してテスト

- 「新規登録」をクリック
- ユーザー名とパスワードを入力
- ログインして会話を保存



## ファイル説明

### バックエンド（PHP）- `root/` フォルダ

| ファイル | 役割 |
|---------|------|
| `db.sql` | データベーススキーマ（テーブル定義） |
| `db_connect.php` | MySQL に接続 |
| `register.php` | ユーザー登録フォーム |
| `login.php` | ログインフォーム |
| `chat_history.php` | チャット履歴の保存・取得API |
| `validate_session.php` | ログイン状態確認API |
| `logout.php` | ログアウト処理 |

### フロントエンド（Next.js）- `chat-bot-demo/chat-bot/`

| ファイル | 役割 |
|---------|------|
| `app/page.tsx` | メイン画面（チャット） |
| `app/action.ts` | AI応答ロジック |
| `components/` | UIコンポーネント |
| `package.json` | 依存パッケージ管理 |

