---
status: completed
updated: 2026-08-28
---

# 継続開発ドキュメント基盤の導入

## 調査範囲

- リポジトリ内の全ファイル名とトップレベル構成、隠しファイル、Markdown、`docs/` / `documentation/` / `.github/` の有無
- 既存 `README.md`、ルート `index.html` / `site.js` / `site.test.js`
- 78 個のツールディレクトリ、代表として直近の SQL Playground、およびテスト配置
- package manifest、CI/CD、インフラ、DB schema / migration、API 定義の有無
- `fetch`、外部 URL、`localStorage` 等の横断検索
- 初期から現在までの Git 履歴、直近 30 件の非 merge commit、README の変更履歴

調査前には AI 指示、CURRENT、ARCHITECTURE、ADR、session に相当する既存資料はなく、Markdown は README だけだった。過去には `docs/json-structure-viewer/` が存在したが、ルート直下へ移した後に削除されており、現在の資料ではない。

## 作成・統合したもの

- `AGENTS.md`: README の既存開発手順を維持しつつ、開始順、実装原則、Definition of Done、文書更新ループを追加。
- `CURRENT.md`: コードと履歴から確認した規模、直近状態、制約、不整合、次のアクションを集約。
- `ARCHITECTURE.md`: README の静的構成説明とコード調査を統合し、境界、コンポーネント、データフロー、テスト、デプロイを整理。
- `decisions/ADR-001-static-browser-tools.md`: README と履歴で根拠を確認できる静的・ブラウザ内完結方針だけを ADR 化。
- 本 session: 今回の調査と未確認事項を記録。

## 維持した資料

- `README.md`: 利用者向け概要、公開 URL、ツール説明、ローカル起動手順として独立した価値があるため移動・削除しなかった。AI 向け状態情報は新文書へ参照分離した。
- 過去の Git 履歴: 作業履歴の一次情報として維持し、過去 session の大量復元は行わなかった。

廃止候補となる既存ドキュメントはない。空の `drawing/test` と `json-formatter/test` は文書ではないが、意図不明のため削除せず CURRENT の確認事項にした。

## 不明・確認不能だったこと

- GitHub Pages の source branch など、GitHub 側の公開設定
- YAML Viewer だけが CDN 依存を持つ理由と、README の「外部ライブラリなし」との優先関係
- 空の拡張子なし `test` 2 件の意図
- README とルート一覧が 21 件ずれている経緯
- `site.test.js` の期待値が 77 のまま、ルート一覧が 78 件になった意図（現状ではテストが失敗する）
- 明示されたプロダクトロードマップ、現行の開発中タスク、CI を運用する主体

不明点から設計意図を推測した ADR は作成していない。

## 検証と次回への引き継ぎ

- 全 `site.test.js` / `*/test.js` を実行した。75 個の個別ツールテストは成功し、`site.test.js` はカード数の期待値 77 に対して実数 78 のため失敗した。ルートの 78 リンク、78 ツールディレクトリ、各 `index.html` の対応は別の機械確認で一致した。`git diff --check` も実行した。
- 次回は `AGENTS.md` → `CURRENT.md` → `ARCHITECTURE.md` → タスクに関係する ADR / session → 対象コードの順で読み、全資料を無条件に読み込まない。
- 最小限の開始情報、現在の一次情報への導線、検証コマンド、既知の不明点、更新責務が揃っていることを自己レビューした。上記の不明点は開発開始を妨げず、確認すべき条件として CURRENT に残した。
