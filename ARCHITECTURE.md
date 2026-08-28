---
status: active
updated: 2026-08-28
---

# アーキテクチャ

## システム境界

本リポジトリは GitHub Pages 向けの静的 Web サイトである。アプリケーションサーバー、DB、認証、独自 API、ビルド成果物の生成工程はない。通常、利用者の入力はブラウザ内で処理される。採用理由と維持条件は [ADR-001](decisions/ADR-001-static-browser-tools.md) を参照する。

```text
GitHub Pages / ローカル HTTP サーバー
  ├─ /index.html + site.css + site.js     一覧・検索・起動・お気に入り
  └─ /<tool-name>/
       ├─ index.html                       DOM と画面構造
       ├─ app.js または script.js          ロジックとイベント処理
       ├─ styles.css または style.css      ツール固有表示
       ├─ test.js（多くのツール）           Node.js assert テスト
       └─ データ / 補助 JS（必要な場合）
```

## 主要コンポーネント

### ルート一覧

- `index.html` が 78 ツールをカテゴリ別の相対リンクで列挙する。中央の登録情報や自動生成処理はなく、追加・名称変更時は手動更新する。
- `site.js` がカード検索、デスクトップのミニウィンドウ起動、起動失敗時の通常遷移、お気に入りを担当する。
- お気に入りはキー `browserToolsFavorites` でブラウザの `localStorage` に保存される。バックエンドには同期されない。
- `site.css` が一覧ページのレスポンシブ表示を担う。

### 個別ツール

- ツールディレクトリ同士はコードを import せず、基本的に独立する。共通バンドルや共有 UI ライブラリはない。
- 多くの `app.js` はブラウザでは `DOMContentLoaded` 後に DOM を初期化し、純粋ロジックを CommonJS の `module.exports` でも公開して Node.js テストから利用する。
- 永続化が必要なツールは `localStorage` を使う。状態はそのブラウザ・origin 内だけにあり、消去、容量制限、破損の影響を受ける。Local Memo など一部は JSON のバックアップを提供する。
- 画像やテキスト等の入力は主に File API、Canvas、Blob、ダウンロードリンク等のブラウザ API で処理する。

## データフローと外部依存

```text
利用者入力 / ローカルファイル
  → 個別ツールの DOM イベント
  → JavaScript ロジック
  → DOM 描画 / ブラウザ内ダウンロード / localStorage（ツールによる）
```

- 通常の機能処理にバックエンド通信はない。
- `linux-command-explorer` の `commands.json` 読み込みは同一サイト内の静的 `fetch` である。
- 確認できた外部実行時依存は YAML Viewer が jsDelivr から読み込む `js-yaml@4.1.0` だけである。これは README の依存なし説明との既知の不整合であり、[CURRENT.md](CURRENT.md) に追跡している。
- QR Code Generator はリポジトリ内の `qr.js` を使う。

## テストとローカル実行

- テストランナーや package manifest はない。`test.js` は Node.js 組み込みの `assert` と、場合により `fs` を直接利用する自己完結スクリプトである。
- ルート挙動は `site.test.js`、個別ロジックは `<tool-name>/test.js` が検証する。ブラウザ DOM、視覚表示、アクセシビリティは自動テストだけでは網羅されない。
- ローカルではルートで `python3 -m http.server 8000` を起動する。静的 JSON の `fetch` やクリップボード制約があるため、`file://` より HTTP を優先する。
- build / lint / typecheck / CI は現時点で存在しない。

## 変更時に同期する場所

| 変更 | 同期対象 |
| --- | --- |
| ツール追加・名称変更・削除 | ツールディレクトリ、ルート `index.html`、`README.md`、テスト |
| ルート起動・検索・お気に入り | `site.js`、`site.test.js`、必要なら `site.css` / `index.html` |
| 永続化形式・外部通信 | 対象コード、テスト、`CURRENT.md` / 本書、重要なら ADR |
| 開発手順・検証コマンド | `AGENTS.md`、`README.md`、必要なら CI 設定 |

## デプロイ

README と URL から GitHub Pages 公開であることは確認できるが、Pages の source branch など GitHub 側設定はリポジトリ外である。`.github/workflows` やデプロイスクリプトは存在しないため、push 後の具体的な公開フローは不明である。
