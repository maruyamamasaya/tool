---
status: active
updated: 2026-09-10
---

# 現在状態

利用者向け機能一覧は [README.md](README.md)、安定した構成は [ARCHITECTURE.md](ARCHITECTURE.md) を正本とし、ここでは変化しやすい事実と次の作業候補だけを管理する。

## Current Phase

GitHub Pages（https://maruyamamasaya.github.io/tool/）で公開するブラウザツール集として運用中。明示された開発中機能や合意済みロードマップは、リポジトリ内では確認できない。

## Implemented

- ルート `index.html` には 79 ツールが登録され、対応する 79 ディレクトリすべてに `index.html` がある。
- ルート一覧は最大幅 1600px のレスポンシブなカテゴリ別カード、カテゴリごとの表示設定とタブ切り替え、PC でのミニウィンドウ、最大 10 件のお気に入りを提供する。
- `tool-settings/` では、ツール単位の表示／非表示、検索、よく使うツールのプリセットを設定できる。
- 各ツールは計算、テキスト加工、データ表示、タスク管理などを主にブラウザ内で実行する。一部はファイル入出力や `localStorage` 保存を行う。
- 実行時ビルドとパッケージ管理はなく、HTML / CSS / JavaScript を直接配信する。アプリケーションサーバー、DB、migration、認証、独自 API は存在しない。
- 77 ディレクトリに `test.js` があり、ルートの `site.test.js` とともに Node.js 組み込み機能だけで実行できる。2026-09-10 時点で全件成功する。

## In Progress

- リポジトリ内で進行中と明示された作業は確認できない。

## Known Issues

- README の表は 58 ツールで、ルート一覧の 79 ツールを網羅していない。
- README は「外部ライブラリを使わない」と説明する一方、YAML Viewer は jsDelivr から `js-yaml@4.1.0` を読み込む。オフライン時には利用できない。

## Technical Debt

- `drawing/test` と `json-formatter/test` は拡張子がなく、内容も改行だけで、テストとして機能しない。
- 自動 CI、lint、typecheck、build は未導入で、全テストの実行はローカルのシェルループに依存する。
- ルート一覧と README の登録情報に中央の正本や同期処理がなく、手動で整合させる必要がある。

## Immediate Next

以下は合意済みロードマップではなく、既知の問題から導いた作業候補である。

1. README に未掲載の 21 ツールをルート一覧と照合し、利用者向け一覧を同期する。
2. YAML Viewer の CDN 依存を許容するかローカル化するか確認し、判断できた場合だけ ADR と説明を更新する。
3. 拡張子なしの空 `test` 2 件がテスト予定なのか不要ファイルなのか確認する。
4. 運用主体と必要性が明確になった場合、全 Node.js テストを実行する CI を検討する。

## Unknowns

- GitHub Pages の source branch、公開トリガー、その他のホスティング側設定。
- YAML Viewer だけが CDN 依存を持つ理由と、README の依存なし方針との優先関係。
- 空の `drawing/test` と `json-formatter/test` の意図。
- README とルート一覧が 21 件ずれた経緯。
- プロダクトロードマップ、現在の開発優先度、CI を運用する主体。
