---
status: active
updated: 2026-09-07
---

# テストと検証

## 現在の仕組み

- package manifest、テストランナー、lint、typecheck、build、CI 設定はない。
- `site.test.js` がルート一覧と `site.js` を検証する。
- 75 個の `<tool-name>/test.js` が Node.js 組み込みの `assert`（一部は `fs`）で個別ツールを検証する。
- `drawing/test` と `json-formatter/test` は空であり、テストとして数えない。意図は不明である。

## 実行方法

対象ツールだけを変更した場合は、そのテストを先に実行する。

```bash
node <tool-name>/test.js
```

ルート一覧または横断的な変更では、ルートテストと全ツールテストを実行する。

```bash
for test in site.test.js */test.js; do node "$test" || exit 1; done
```

`|| exit 1` を外すと、途中の失敗がループの最終終了コードに反映されない場合がある。現在 `site.test.js` にはカード数の既知の失敗があるため、詳細は [CURRENT.md](CURRENT.md) を参照する。

## ブラウザ確認

```bash
python3 -m http.server 8000
```

`http://localhost:8000/` または対象ツールを開き、主要操作、狭い画面、キーボード操作、コンソールエラーを確認する。`linux-command-explorer` は同一ディレクトリの JSON を `fetch` するため HTTP が必要である。自動テストは DOM 統合、見た目、アクセシビリティを網羅しない。

## 変更完了時

1. 対象テストを実行する。横断変更なら全テストを実行する。
2. UI 変更ならブラウザでも確認する。
3. `git diff --check` と `git diff` を確認する。
4. 失敗が既知か今回の回帰かを区別し、未解決なら `CURRENT.md` を同期する。

新しい検証基盤を導入する場合も、既存テストを直接実行できる性質と、追加依存なしの構成を理由なく壊さない。
