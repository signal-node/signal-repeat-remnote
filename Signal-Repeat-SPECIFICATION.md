# Signal Repeat — RemNote Plugin Specification

> RemNoteで新しい知識を記憶するとき、またはフラッシュカードの答えを思い出せなかったときに、覚える対象だけを短時間、集中して反復するためのプラグイン。

---

## 1. Document Information

| Item | Value |
|---|---|
| Project name | Signal Repeat |
| Product display name | Signal Repeat for RemNote |
| Repository name | `signal-repeat-remnote` |
| Brand | Signal, Not Volume |
| Japanese tagline | 覚えるものだけを、短く反復する。 |
| English tagline | Repeat only what matters. |
| Repository type | Public GitHub repository |
| Target | RemNote Plugin |
| Primary language | TypeScript |
| UI | React（RemNote Plugin Template準拠） |
| License | MIT License 推奨 |
| Initial release | MVP / v0.1.0 |
| Primary development tool | Codex |
| Specification status | Brand-aligned implementation specification |
| Last updated | 2026-09-04 |

---

## 2. Background

RemNoteで学習している際、以下の場面では通常の間隔反復だけではなく、その場で短時間の「記銘」が必要になる。

1. 新しく作成した項目を初めて覚えるとき
2. フラッシュカードの答えを思い出せなかったとき
3. 答えを見ても記憶が曖昧で、次回の想起に備えて初期記銘を補助したいとき

本プラグインは、対象テキストだけに注意を集中させ、一定時間繰り返し読む・唱えるための専用UIを提供する。

---

## 3. Goal

ユーザーがRemNote上の学習フローを離れることなく、

> 対象を指定 → 設定時間だけ反復 → 自動終了 → 元の学習に戻る

という操作を最小限の手数で実行できることを目的とする。

### 3.1 Core Concept

```text
Learn / Review
    ↓
「これは今覚える必要がある」と判断
    ↓
Signal Repeat を起動
    ↓
対象内容だけを設定時間表示（既定15秒）
    ↓
集中して反復
    ↓
自動終了
    ↓
RemNoteの元の画面へ戻る
```

### 3.2 Brand Positioning

Signal Repeatは、母体ブランド `Signal, Not Volume` の「量ではなく、意味を選ぶ」という考え方を、学習時の具体的な行動へ変換するプロダクトである。

```text
多くの情報から、今覚える対象を一つ選ぶ（Signal）
    ↓
対象だけへ短時間集中して反復する（Repeat）
```

対外表記は原則として次のように統一する。

```text
Signal Repeat
A focused repetition plugin for RemNote.
by Signal, Not Volume
```

本プラグインは記憶の定着を保証せず、RemNoteの間隔反復を置き換えない。位置づけは、間隔反復へ戻る前の短い集中反復とする。

---

## 4. Scope

### 4.1 MVP Scope

v0.1.0では以下を実装する。

1. 選択テキストを設定時間表示する（既定15秒）
2. フラッシュカード回答後に「Repeat · 15s」ボタンから起動できる
3. キーボードショートカットから起動できる
4. 設定時間経過後、自動的に終了する
5. `Esc` による途中終了
6. カウントダウンではなく、小さなプログレス表示を行う
7. 表示時間を設定画面から変更できる
8. 設定値として `10 / 15 / 20 / 30秒` を選択可能にする
9. デフォルトは15秒とする

### 4.2 Out of Scope for MVP

以下はv0.1.0では実装しない。

- 自動音声読み上げ
- 暗記内容の履歴保存
- 学習統計
- AIによる要約・抽出
- 忘却率の推定
- 自動でRemNoteの評価ボタンを押す機能
- `Forgot` 判定との完全自動連携
- Cloze回答部分の高度な自動抽出
- クラウド同期機能
- 独自の間隔反復アルゴリズム
- 15秒後の追加Recallテスト
- RemNote外での利用
- Chrome Extension版

---

# 5. User Stories

## US-01 新しい項目を記憶する

ユーザーとして、
RemNoteで新しい内容を入力したあと、
覚えたい文字列を選択して短時間の反復セッションを起動したい。

### Flow

```text
テキストを選択
    ↓
Selected Text Menu
    ↓
Repeat in focus
    ↓
対象テキストを15秒表示
    ↓
自動終了
```

---

## US-02 復習中に答えられなかった項目を覚える

ユーザーとして、
フラッシュカードの答えを表示したあと、
その答えを15秒間反復してから評価したい。

### Flow

```text
Question
    ↓
思い出せない
    ↓
Show Answer
    ↓
[ Repeat · 15s ]
    ↓
答えを15秒表示
    ↓
自動終了
    ↓
Forgot / Hard / Good / Easy
```

Signal Repeat終了後も、RemNote側の評価はユーザー自身が行う。

---

## US-03 キーボードだけで起動する

ユーザーとして、
マウス操作をせずに反復セッションを起動したい。

### Default Shortcut

```text
Alt / Option + M
```

ショートカットはRemNoteのコマンド登録方式に従う。

OSやRemNoteの既存ショートカットと競合する場合に備え、変更可能な設計とする。

---

# 6. Functional Requirements

## FR-01 Selected Text

選択テキストが存在する場合、それを暗記対象として使用する。

優先順位：

```text
1. Selected Text
2. Flashcard Answer
3. Focused Rem / Focused Editor Text
```

利用可能なRemNote APIに応じて安全にフォールバックすること。

対象を取得できない場合はモーダルを起動せず、短い通知を表示する。

例：

```text
Signal Repeat: 反復するテキストを選択してください。
```

---

## FR-02 Flashcard Answer Integration

フラッシュカードの回答表示後に、Signal Repeat起動ボタンを表示する。

表示例：

```text
[ Repeat · 15s ]
```

### Requirements

- Answer表示前には表示しない
- Answer表示後に利用可能にする
- 評価ボタンの操作を妨げない
- Signal Repeat終了後は同じカード画面に戻る
- Signal Repeat自体はカード評価を変更しない

---

## FR-03 Repeat Session Modal

起動時、画面上にオーバーレイまたはポップアップを表示する。

### Display

```text
┌───────────────────────────────────────┐
│                                       │
│                                       │
│       対象となる暗記テキスト           │
│                                       │
│                                       │
│       ━━━━━━━━━━━━━━━━━━━━            │
│                                       │
│               Esc: 終了                │
└───────────────────────────────────────┘
```

### UI Principles

- 記憶対象を最も目立たせる
- 背景情報を暗くして注意を遮断する
- タイマー自体は目立たせない
- 大きな秒数表示は行わない
- 残時間はプログレスバーで示す
- アニメーションは最小限とする
- テキスト選択やコピーを妨げない
- 長文でもスクロール可能にする

---

## FR-04 Timer

デフォルト時間：

```text
15 seconds
```

設定可能値：

```text
10 seconds
15 seconds
20 seconds
30 seconds
```

### Timer Behavior

```text
start
 ↓
progress = 0%
 ↓
elapsed time
 ↓
progress = 100%
 ↓
close modal
```

### Important

JavaScriptの単純なカウント回数ではなく、開始時刻と現在時刻との差分を基準にする。

理由：

- タブがバックグラウンド化した場合
- UIレンダリングが遅延した場合
- setIntervalの実行間隔がずれた場合

でも時間差を最小化するため。

例：

```ts
const startedAt = Date.now();
const elapsed = Date.now() - startedAt;
```

---

## FR-05 Automatic Close

設定時間経過時にSignal Repeatを自動終了する。

終了後：

- オーバーレイを閉じる
- RemNote画面をそのまま維持する
- 可能であれば元のUIへフォーカスを戻す
- カードを進めない
- Remを変更しない
- 評価を変更しない

---

## FR-06 Manual Cancel

以下で途中終了可能とする。

```text
Esc
```

追加で画面右上に小さなCloseボタンを配置してもよい。

途中終了時もデータ変更は行わない。

---

## FR-07 Settings

Plugin Settingsに以下を提供する。

| Setting | Type | Default |
|---|---|---:|
| Repeat duration | Select | 15 sec |
| Show progress bar | Boolean | true |
| Show close hint | Boolean | true |

将来拡張用として設定処理を独立モジュール化する。

---

# 7. Trigger Priority

暗記対象を決める際は以下の順番を使用する。

```text
Selected Text
    ↓ none
Flashcard Answer
    ↓ none
Focused Editor Text / Focused Rem
    ↓ none
Error / Toast
```

これにより同じコマンドを複数の状況から利用可能にする。

---

# 8. State Model

```text
IDLE
 ↓ start
PREPARING
 ↓ target found
RUNNING
 ├─ timer complete → FINISHED
 └─ Esc / Close    → CANCELLED

FINISHED
 ↓
IDLE

CANCELLED
 ↓
IDLE
```

## State Definitions

### IDLE

Signal Repeatが起動していない状態。

### PREPARING

暗記対象のテキストを取得している状態。

### RUNNING

モーダルを表示し、タイマーが進行している状態。

### FINISHED

設定時間が正常に完了した状態。

### CANCELLED

ユーザーが途中終了した状態。

---

# 9. RemNote Integration

実装時はRemNote Plugin SDKの公式APIを利用し、DOMの直接操作は原則として避ける。

想定するSDK機能：

- 選択テキスト取得
- Focused Rem取得
- Focused Editor Text取得
- Flashcard / Queue情報取得
- Widget登録
- Command登録
- Plugin Settings
- Popup / Widget UI
- Toast / Notification

## Policy

### MUST

- 公開されているRemNote Plugin APIを優先する
- API変更時に局所的な修正で対応できる構造にする

### MUST NOT

- RemNote内部DOMクラス名への依存
- 非公開内部APIへの依存
- ユーザーデータの外部送信
- 不必要なRemの書き換え
- 評価・スケジューリングデータの自動変更

---

# 10. Architecture

推奨構造：

```text
signal-repeat-remnote/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── pull_request_template.md
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   └── dependabot.yml
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── RepeatSessionModal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── RepeatButton.tsx
│   │
│   ├── hooks/
│   │   └── useRepeatTimer.ts
│   │
│   ├── services/
│   │   ├── targetResolver.ts
│   │   ├── remnoteAdapter.ts
│   │   └── settingsService.ts
│   │
│   ├── types/
│   │   └── repeatSession.ts
│   │
│   ├── widgets/
│   │   ├── selectedText.tsx
│   │   ├── flashcardAnswer.tsx
│   │   └── popup.tsx
│   │
│   ├── index.ts
│   └── App.tsx
│
├── tests/
│   ├── targetResolver.test.ts
│   ├── timer.test.ts
│   └── state.test.ts
│
├── docs/
│   ├── architecture.md
│   ├── development.md
│   └── release.md
│
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── package.json
├── tsconfig.json
└── SPECIFICATION.md
```

RemNote Plugin Templateの実際の構成と異なる場合は、Template側を優先しつつ責務分離を維持する。

---

# 11. Module Responsibilities

## `targetResolver.ts`

現在の状況から暗記対象を決定する。

```ts
type RepeatTarget = {
  text: string;
  source: "selected-text" | "flashcard-answer" | "focused-rem";
};
```

主要関数イメージ：

```ts
resolveRepeatTarget(): Promise<RepeatTarget | null>
```

---

## `useRepeatTimer.ts`

時間管理のみを担当する。

責務：

- start time保持
- elapsed算出
- progress算出
- 完了通知
- cleanup

UIやRemNote APIへ直接依存させない。

---

## `RepeatSessionModal.tsx`

暗記画面の描画を担当する。

責務：

- 対象テキスト表示
- Progress表示
- Esc処理
- Close処理
- Accessibility

タイマーの時間計算ロジックは持たない。

---

## `remnoteAdapter.ts`

RemNote Plugin SDKとの境界。

目的：

RemNote API変更の影響をアプリ全体へ波及させない。

例：

```ts
getSelectedText()
getFocusedText()
getCurrentFlashcardAnswer()
showToast()
closeRepeatPopup()
```

---

# 12. Data Handling

MVPではユーザーの学習内容を永続保存しない。

### Stored

Plugin Settingsのみ。

```text
duration
showProgressBar
showCloseHint
```

### Not Stored

- 暗記対象テキスト
- Rem内容
- Flashcard内容
- 起動履歴
- 学習履歴
- 成績
- 個人情報

### External Communication

MVPでは外部サーバーへの通信を行わない。

---

# 13. Privacy

公開プラグインとして、READMEまたはPRIVACY.mdに以下を明記する。

```text
Signal Repeat does not transmit your RemNote content to any external server.

The plugin processes selected text and flashcard content locally within
the RemNote plugin environment.

The MVP stores only plugin preferences such as the selected timer duration.
```

---

# 14. Accessibility

最低限以下を満たす。

- `Esc` で閉じられる
- Closeボタンにaria-labelを設定
- キーボードのみで操作可能
- 適切な文字サイズ
- 背景との十分なコントラスト
- progress表示に適切なARIA属性
- Reduce Motion環境を考慮
- 長文時にスクロール可能

---

# 15. Error Handling

## No Target

```text
Signal Repeat: 反復するテキストが見つかりません。
```

## API Failure

```text
Signal Repeatを開始できませんでした。
```

内部ではconsoleへ原因を記録してよいが、ユーザーのRem内容をログに出力してはならない。

### Logging Policy

Allowed:

```text
Target resolution failed: selected text API unavailable
```

Forbidden:

```text
Failed text: "ユーザーが実際に記載していた学習内容..."
```

---

# 16. Performance Requirements

Signal Repeatの起動は体感的に即時であること。

目標：

```text
ボタン / Shortcut
    ↓
300ms以内を目安にModal表示
```

タイマー表示のために高頻度レンダリングを行わない。

推奨：

```text
100〜250ms程度
```

でprogressを更新する。

---

# 17. Acceptance Criteria

## AC-01 Selected Text

Given:
RemNote上で文字列が選択されている

When:
Signal Repeatを起動する

Then:
選択文字列がSignal Repeat画面に表示される

---

## AC-02 Default-duration completion

Given:
Duration = 15 seconds

When:
Signal Repeatを開始する

Then:
約15秒経過後に自動的に閉じる

---

## AC-03 Cancel

Given:
Signal Repeat実行中

When:
Escを押す

Then:
即座にSignal Repeatを終了する

---

## AC-04 No data mutation

Given:
Signal Repeatを実行する

When:
正常終了または途中終了する

Then:
Remの内容、Flashcard評価、Queue状態を変更しない

---

## AC-05 Flashcard

Given:
Flashcard Answerが表示されている

When:
Repeatボタンを押す

Then:
回答内容を対象としてSignal Repeatを起動できる

---

## AC-06 Settings

Given:
Durationを30秒に変更

When:
Signal Repeatを実行する

Then:
約30秒動作する

---

## AC-07 Target missing

Given:
対象テキストを取得できない

When:
Signal Repeatを起動する

Then:
モーダルを表示せず通知する

---

# 18. Test Strategy

## Unit Tests

対象：

- target resolver
- timer
- progress calculation
- state transition
- settings validation

### Timer

fake timerを利用して検証する。

```text
0 sec  -> progress ≈ 0
7.5 sec -> progress ≈ 0.5
15 sec -> complete
```

---

## Integration Tests

確認項目：

1. Selected Textから起動
2. Focused Remから起動
3. Flashcard Answerから起動
4. Shortcut起動
5. 15秒自動終了
6. Esc終了
7. Settings反映
8. 長文表示

---

## Manual Tests

最低限以下のRemNote環境で確認する。

- RemNote Desktop
- RemNote Web

可能であれば：

- macOS
- Windows

Mobile対応はMVPの必須条件とはしない。

---

# 19. Coding Standards

## TypeScript

- `strict: true`
- `any`を原則禁止
- 公開関数には適切な型を定義
- UIとRemNote APIを分離
- 副作用を局所化

## React

- Function Components
- Hooks
- timer cleanup必須
- 不必要なglobal stateを導入しない

## Naming

```text
Component: PascalCase
function: camelCase
type/interface: PascalCase
file: camelCase または component名
```

---

# 20. Dependencies

依存パッケージは最小限とする。

原則：

- RemNote Plugin SDK
- React
- TypeScript
- テストツール

単純な短時間タイマーのために大規模な状態管理ライブラリを導入しない。

以下はMVPでは不要：

- Redux
- Zustand
- Axios
- UI component framework

---

# 21. GitHub Repository Policy

公開リポジトリとして開発・メンテナンスする。

推奨リポジトリ名：

```text
signal-repeat-remnote
```

---

## Branch Strategy

シンプルなGitHub Flowを採用する。

```text
main
 ├── feature/selected-text
 ├── feature/flashcard-widget
 ├── fix/timer-cleanup
 └── docs/update-readme
```

`main` は常にビルド可能な状態を維持する。

---

## Commit Convention

Conventional Commitsを推奨。

例：

```text
feat: add selected text repeat session
feat: add flashcard answer widget
fix: clean up timer on popup close
docs: add development guide
test: add timer completion tests
chore: update remnote sdk
```

---

## Pull Requests

原則として変更はPR経由で`main`へマージする。

PRでは以下を確認する。

```text
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Lint passes
- [ ] No user content is logged
- [ ] Existing behavior is not broken
- [ ] Documentation updated if necessary
```

個人開発でもCodexにPR単位で作業させることを推奨する。

---

# 22. GitHub Issues

Issueを開発タスクの単位とする。

初期Issue案：

```text
#1 Initialize RemNote plugin project
#2 Implement RepeatSessionModal
#3 Implement timer hook
#4 Implement selected text target
#5 Add SelectedTextMenu integration
#6 Add flashcard answer integration
#7 Register keyboard shortcut
#8 Add plugin settings
#9 Add unit tests
#10 Add CI
#11 Write README
#12 Prepare v0.1.0 release
```

---

# 23. Labels

推奨：

```text
bug
enhancement
documentation
good first issue
help wanted
dependencies
remnote-api
ui
testing
release
```

---

# 24. CI

GitHub ActionsでPRおよびmain push時に実行する。

```text
install
 ↓
typecheck
 ↓
lint
 ↓
test
 ↓
build
```

例：

```yaml
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

実際のpackage scriptsに合わせて調整する。

---

# 25. Dependency Maintenance

DependabotまたはRenovateを利用する。

特に監視する：

- RemNote Plugin SDK
- React
- TypeScript
- build tooling

RemNote SDKのMajor Updateは自動マージしない。

---

# 26. Release Strategy

Semantic Versioningを使用する。

```text
0.1.0 MVP
0.2.0 minor feature
0.3.0 minor feature
1.0.0 stable
```

タグ：

```text
v0.1.0
```

GitHub ReleasesへCHANGELOGを掲載する。

---

# 27. CHANGELOG

Keep a Changelog形式を推奨。

```md
## [Unreleased]

### Added

### Changed

### Fixed

## [0.1.0]

### Added
- Focused repeat session with a 15-second default
- Selected text integration
- Flashcard answer integration
- Keyboard command
```

---

# 28. Security Policy

`SECURITY.md`を配置する。

本プラグインは学習内容を扱うため、特に以下をセキュリティ問題として扱う。

- Rem内容の外部送信
- 意図しないログ出力
- XSS
- HTML sanitization不足
- RemNote API権限の過剰利用

可能な限りテキストをReactの通常のtext renderingとして描画し、`dangerouslySetInnerHTML`は使用しない。

---

# 29. Open Source Maintenance Policy

## Feature Requests

GitHub Issuesで受け付ける。

判断基準：

1. Signal Repeatの中心目的に合うか
2. UIを複雑化しすぎないか
3. RemNote本来のSRS機能を侵害しないか
4. 学習データの外部送信を必要としないか
5. 継続的にメンテナンス可能か

---

## Breaking RemNote API Changes

RemNote Plugin SDK更新で動作しなくなった場合：

```text
Issue作成
 ↓
再現
 ↓
remnoteAdapter層を中心に修正
 ↓
Regression Test
 ↓
Patch Release
```

SDK依存処理を`remnoteAdapter.ts`へ集約する理由はこのためである。

---

# 30. README Requirements

READMEには最低限以下を含める。

1. What is Signal Repeat?
2. Screenshot / GIF
3. Installation
4. Usage
5. Selected Text usage
6. Flashcard usage
7. Keyboard shortcut
8. Settings
9. Privacy
10. Development
11. Contributing
12. License

---

# 31. Future Roadmap

MVP完成後にIssue単位で検討する。

## v0.2 Candidate

### Completion sound

15秒終了時に短い音を鳴らす。

OFFをデフォルト候補とする。

---

### Repeat count

```text
Signal Repeat x 1
Signal Repeat x 2
Signal Repeat x 3
```

のように同じ項目で複数回利用できる。

ただし履歴保存は別機能として扱う。

---

## v0.3 Candidate

### Repeat History

ユーザーが明示的に有効化した場合のみ、

```text
timestamp
remId
duration
```

程度を保存する。

本文自体は保存しない設計を優先する。

---

### Forgot integration

RemNote APIで安全に実現可能なら、

```text
Forgot
 ↓
Signal Repeatを提案
```

する。

自動起動よりもユーザー操作を残す設計を優先する。

---

## v0.4 Candidate

### Cloze-aware display

Clozeカードの場合に、記憶すべき部分を強調する。

例：

```text
シグモイド関数の微分の最大値は

        0.25
```

ただしカード形式ごとの差異が大きいためMVPから除外する。

---

# 32. UX Principle

このプラグインは多機能な学習アプリを目指さない。

中心となる機能は常に：

```text
「今覚えたいものを、短時間だけ集中して反復する」
```

である。

したがって、機能追加時は以下を優先する。

```text
Simple
Fast
Focused
Local-first
Non-invasive
```

RemNote本来の復習アルゴリズムを置き換えず、「記銘の補助」に限定する。

---

# 33. Codex Development Instructions

Codexで実装するときは、一度に全機能を実装せずGitHub Issue単位で進める。

推奨順序：

```text
Phase 1
#1 Project initialization

Phase 2
#2 Modal
#3 Timer

Phase 3
#4 Target resolver
#5 Selected Text

Phase 4
#6 Flashcard integration

Phase 5
#7 Shortcut
#8 Settings

Phase 6
#9 Tests
#10 CI

Phase 7
#11 Documentation
#12 v0.1.0
```

各IssueについてCodexは原則として：

1. 関連コードを確認する
2. RemNote公式APIを確認する
3. 最小変更で実装する
4. Testを追加・更新する
5. Build / Test / Lintを実行する
6. 変更内容を要約する

---

# 34. Definition of Done — MVP

以下をすべて満たした時点でv0.1.0完成とする。

```text
[ ] RemNote Pluginとして正常にロードできる
[ ] 選択テキストからSignal Repeatを開始できる
[ ] Flashcard AnswerからSignal Repeatを開始できる
[ ] ShortcutからSignal Repeatを開始できる
[ ] デフォルト15秒で動作する
[ ] 10/15/20/30秒を設定できる
[ ] Progress Barが表示される
[ ] Escで途中終了できる
[ ] 時間終了時に自動で閉じる
[ ] Rem本文を変更しない
[ ] Flashcard評価を変更しない
[ ] 外部通信を行わない
[ ] 暗記対象本文をログに出さない
[ ] Unit Testが通る
[ ] Buildが通る
[ ] CIが通る
[ ] READMEが存在する
[ ] LICENSEが存在する
[ ] CONTRIBUTING.mdが存在する
[ ] SECURITY.mdが存在する
[ ] GitHub Release v0.1.0を作成できる状態である
```

---

# 35. Design Principle Summary

> Signal Repeatは、RemNoteの代わりに記憶を管理するものではない。
>
> RemNoteで「今この内容を覚える必要がある」と判断した瞬間に、対象だけへ短時間集中し、初期記銘を補助するツールである。

```text
RemNote
    +
Focused repetition
    =
Signal Repeat
```
