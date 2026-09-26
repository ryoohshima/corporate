# github-template

新規 GitHub リポジトリ作成時に共通利用する設定一式の Template Repository。
`.github/` 配下の community health files に加え、リポジトリ全体の足場（`.gitignore` / `.editorconfig` / `biome.jsonc` 等）も含む。

## 使い方

### Web UI から

GitHub のリポジトリ画面右上 **`Use this template`** ボタンから新リポジトリを生成する。

### CLI から

```sh
gh repo create <new-repo-name> --template Ryo-Ohshima/github-template --private
```

## 含まれるファイル

### `.github/` 配下（GitHub 連携）

| パス | 用途 |
|---|---|
| `.github/PULL_REQUEST_TEMPLATE.md` | PR テンプレート（What / Why / Refs + コミット規約プレフィックス選択） |
| `.github/ISSUE_TEMPLATE/bug_report.md` | バグ報告テンプレート（日本語） |
| `.github/ISSUE_TEMPLATE/feature_request.md` | 機能要望テンプレート（日本語） |
| `.github/ISSUE_TEMPLATE/config.yml` | blank issue を無効化しテンプレ選択を強制 |
| `.github/CODEOWNERS` | PR レビュー自動割り当て（初期値 `@Ryo-Ohshima`） |
| `.github/release.yml` | リリースノート自動カテゴリ分類（コミット規約整合） |
| `.github/dependabot.yml` | npm + github-actions 週次自動更新 |
| `.github/workflows/stale.yml` | 30 日無活動 PR を自動クローズ（Issue は対象外） |
| `.github/workflows/ci.yml.example` | Node.js 用 CI 雛形（lint / typecheck / test / build。リネーム+調整して使用） |
| `.github/workflows/dependabot-auto-merge.yml.example` | 必須 CI 通過済みの Dependabot PR（manifest / lockfile / workflow のみ）を自動 squash マージする雛形 |
| `.github/workflows/codex-review.yml.example` | PR 作成・更新時に Codex が読み取り専用で差分をレビューしコメント（Draft / Dependabot PR は対象外） |

### ルート直下（リポジトリ全体の足場）

| パス | 用途 |
|---|---|
| `.gitignore` | macOS / IDE / .env / node_modules / dist / ログ等を網羅した汎用版 |
| `.editorconfig` | エディタ間のインデント・改行・文字コード統一 |
| `.gitattributes` | 改行コード LF 正規化、バイナリ判定 |
| `biome.jsonc` | Biome（linter + formatter）設定雛形。JS/TS 以外のスタックなら削除 |
| `tasks/` | AI エージェント作業記録用ディレクトリ（todo.md / lessons.md 配置先） |

## 新リポ生成後にやること

- [ ] **`CODEOWNERS`** のユーザー名を必要に応じて変更
- [ ] **`ci.yml.example`** を `ci.yml` にリネームし、プロジェクトのスクリプト構成に合わせて調整。Node.js 以外のスタックなら丸ごと置き換え
- [ ] **`dependabot-auto-merge.yml.example`** を使う場合は `ci.yml` 有効化後にリネームし、`REQUIRED_CHECKS` を CI のジョブ名に合わせる。初回は `dry_run` で手動実行して確認
- [ ] **`codex-review.yml.example`** を使う場合は Repository Secret に `OPENAI_API_KEY` を設定してリネーム
- [ ] **`dependabot.yml`** で該当しないエコシステムのブロックを削除（例: TS リポなら github-actions のみ残す）
- [ ] **`release.yml`** のラベルが PR ラベル運用と整合しているか確認
- [ ] **`.gitignore`** にスタック固有のパターン（`*.env.production`, ビルド成果物名など）を追記
- [ ] **`biome.jsonc`** を使う場合は `pnpm add -D @biomejs/biome` する（CI は `biome ci .` を直接実行。ローカル用に package.json へ `"lint": "biome check ."` を定義してもよい）。JS/TS 以外のスタックなら削除

## 設計方針

- スタック非依存で汎用的なものに限定（CI 本体は雛形のみ）
- 規約は [`ai-agent/shared/rules/git-guideline.md`](https://github.com/ryoohshima/ai-agent) のコミットプレフィックスと整合
- すべてのテンプレ・メッセージは日本語
