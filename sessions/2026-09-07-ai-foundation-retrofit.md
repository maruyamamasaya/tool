---
status: completed
updated: 2026-09-07
---

# AI 開発基盤の再調査と補完

## 調査

- トップレベル構成、78 個のツール入口、ルート一覧、README、既存 AI 文書、ADR、直近 Git 履歴を確認した。
- package manifest、環境変数、サーバー、DB、migration、認証、独自 API、CI/CD、deploy script、lint、typecheck、build 設定の有無を検索した。
- `fetch`、外部 URL、外部 script、`localStorage`、ファイル入出力に関係する実装を横断検索した。
- ルートカード、ツールディレクトリ、`index.html`、`test.js` を機械的に数え、全 Node.js テストを実行した。

既存の `AGENTS.md`、`CURRENT.md`、`ARCHITECTURE.md`、README、ADR-001 は内容を実装と照合したうえで正本として再利用した。古い文書や廃止すべき重複文書は確認できなかった。ただし CURRENT の日付と構造、README のツール一覧、ルートテストの期待値には現状との差があった。

## 変更

- `CURRENT.md` を履歴ではなく Current Phase / Implemented / In Progress / Known Issues / Technical Debt / Immediate Next / Unknowns で読める現在地へ更新した。
- 分散していた検証情報の正本として `TESTING.md`、データと外部依存の境界の正本として `SECURITY.md` を追加し、既存文書からリンクした。
- README に開発者向け文書の入口だけを追加した。アプリケーションコードと利用者向け機能は変更していない。

## 意図的に追加しなかったもの

- `DOMAIN.md` / `DATA_MODEL.md`: 独立した汎用ツール群で共有ドメインモデルがなく、DB や共有 schema もない。必要なデータフローは ARCHITECTURE と SECURITY で足りる。
- `ROADMAP.md`: 合意済みロードマップを確認できない。推測で作らず、確認済みの直近候補だけを CURRENT に置いた。
- `CODEMAP.md`: 機能数は多いが、ルート一覧から kebab-case の独立ディレクトリへ一貫して辿れ、配置も均一である。全ツール一覧を README と重複させる利点がない。
- 階層型 `AGENTS.md`: 独立した技術スタックや検証方法を持つサブツリーがない。
- verify script: 既存テストは短いシェルループで網羅できる。新しい依存や保守対象を増やさず、失敗を保持する正確なコマンドを TESTING に記録した。
- 新しい ADR: 今回は既存の設計判断を変更していない。

## 検証と未解決事項

- 75 個のツールテストは成功した。`site.test.js` は実カード 78 に対する期待値 77 の既知の不整合で失敗した。
- README の一覧は 57 件で、ルートの 78 件との差は未解消。CDN 依存、空の拡張子なしテスト、GitHub Pages 設定とともに CURRENT に残した。
- 文書のみの変更であるため、ブラウザでの UI 確認は対象外とした。
