# Phys-Lab Phase 1 現状調査報告

- 調査日: 2026-09-16
- 対象ブランチ: `dev`
- 基準文書: `Phys-Lab_Codex_Development_Guide.md`

## 1. 調査範囲

Phase 1 の指定に従い、次を調査した。

1. 現在のリポジトリ構造
2. 現在の URL 一覧
3. 現在のページ構成
4. HTML / CSS の重複
5. 次フェーズへ持ち越す問題点

この調査ではサイトの実装変更は行っていない。

## 2. Git と公開構成

- `dev` と `main` は調査時点で同じコミット `3d9924d` を指している。
- `dev` は `origin/dev`、`main` は `origin/main` を追跡している。
- GitHub Pages の案内先は `https://xxlxungleadxx.github.io/Phys-Lab/`。
- サイトはビルド工程のない HTML / CSS / JavaScript 構成。
- HTML は 11 ファイル、PDF は 15 ファイル、CSS は 1 ファイル。
- 独立した JavaScript ファイルはなく、投射運動ページ内にインライン実装されている。
- 調査開始時点で `Phys-Lab_Codex_Development_Guide.md` は未追跡。
- `AGENTS.md`、`404.html`、`LICENSE`、`.gitignore` は存在しない。

## 3. リポジトリ構造

```text
Phys-Lab/
├── index.html                 トップページ
├── style.css                 全ページ共通CSS
├── assets/
│   └── hero-physics-lab.png  ヒーロー画像（約1.7 MB）
├── slide/
│   ├── index.html            スライド一覧
│   └── phys/                 PDF 6件
├── note/
│   ├── index.html            PDFノート一覧
│   └── phys/                 PDF 9件
├── link/
│   ├── index.html            外部リンク一覧
│   └── links.md              管理用と思われる重複データ
├── tools/
│   ├── index.html            シミュレーション分野一覧
│   ├── mechanics/
│   │   ├── index.html
│   │   └── projectile.html   唯一の実装済みシミュレーション
│   ├── thermodynamics/index.html
│   ├── waves/index.html
│   ├── electromagnetism/index.html
│   └── atomic/index.html
├── README.md
├── make-plan.md
├── 05_Phys-Lab.md
└── Phys-Lab_Codex_Development_Guide.md
```

追跡済みファイルには `slide/.DS_Store` も含まれる。`05_Phys-Lab.md`、`make-plan.md`、`link/links.md` は Obsidian 用の管理情報を含むため、公開リポジトリに残す必要があるかを判断する必要がある。

## 4. 現在の URL 一覧

公開サイトのベース URL を `/Phys-Lab/` とした相対表記。

### HTML ページ

| URL | 内容 | 状態 |
| --- | --- | --- |
| `/` | トップページ | 実装済み |
| `/slide/` | 授業用スライド一覧 | 実装済み |
| `/note/` | PDFノート一覧 | 実装済み |
| `/link/` | 外部リンク集 | 実装済み |
| `/tools/` | 動かせる教材の分野一覧 | 実装済み |
| `/tools/mechanics/` | 力学シミュレーション一覧 | 投射運動のみ掲載 |
| `/tools/mechanics/projectile.html` | 投射運動シミュレーション | 実装済み |
| `/tools/thermodynamics/` | 熱力学シミュレーション一覧 | 空ページ |
| `/tools/waves/` | 波動シミュレーション一覧 | 空ページ |
| `/tools/electromagnetism/` | 電磁気学シミュレーション一覧 | 空ページ |
| `/tools/atomic/` | 原子シミュレーション一覧 | 空ページ |

### スライド PDF

```text
/slide/phys/phys_0-0.pdf
/slide/phys/phys_1-01.pdf
/slide/phys/phys_1-02.pdf
/slide/phys/phys_1-03.pdf
/slide/phys/phys_1-04.pdf
/slide/phys/phys_1-05.pdf
```

### ノート PDF

```text
/note/phys/phys-hs.pdf
/note/phys/phys-hs_chap0.pdf
/note/phys/phys-hs_chap1.pdf
/note/phys/phys-hs_chap2.pdf
/note/phys/phys-hs_chap3.pdf
/note/phys/phys-hs_chap4.pdf
/note/phys/phys-hs_chap5.pdf
/note/phys/phys-formula.pdf
/note/phys/phys-logic.pdf
```

### URL に関する注意

- 全 HTML 内のローカル `href` は、調査時点ですべて実在ファイルへ解決できた。
- 外部リンク 7 件の到達確認は今回の対象外。
- 現在の投射運動 URL は、ガイドの推奨例 `/mechanics/projectile/` と異なる。移行時は既存 URL を壊さない設計が必要。
- `404.html` がないため、存在しない URL に学習導線を提示できない。
- GitHub Pages の公開元設定によっては、リンクされていない Markdown や `.DS_Store` も直接取得可能になる。公開対象の明示が必要。

## 5. 現在のページ構成

### トップページ

現在は次の「教材形式」4分類が主導線になっている。

- 授業用スライド
- PDFノート
- 動かせる教材
- リンク集

「単元から探す」導線はない。下部の大きな領域は、利用可能な教材や最近の更新ではなく「更新予定」に使われている。

### スライド一覧

- 準備編 1件
- 力学 2件
- 熱力学 1件
- 波動 1件
- 電磁気 1件
- 原子 0件

### PDFノート一覧

- 全体版
- 第0章から第5章
- 公式まとめ
- 物理の考え方

章名による単元分類はあるが、対象レベルや関連教材の表示はない。

### 動かせる教材

力学・熱力学・波動・電磁気学・原子の5分野ページがある。実教材は投射運動1件のみで、残り4分野は準備中表示。

### 外部リンク集

Physics 5件、Math 2件。分類名が英語で、ガイドの「高校生が理解しやすい日本語を使う」方針とは調整余地がある。

## 6. HTML / CSS / JavaScript の重複と保守性

### HTML

- 全11 HTMLにヘッダーとナビゲーションが複製されている。
- 全11 HTMLにフッターが複製されている。
- `tools/` 配下の4つの空ページは、タイトルと説明文以外がほぼ同一。
- 相対パスの深さがページごとに異なるため、共通ナビゲーション変更時にリンク修正漏れが起きやすい。
- 現在は11ページなので手動管理可能だが、単元ページ追加後は変更対象が10ページを大きく超える。

### CSS

- CSS は `style.css` 1ファイルに集約され、HTML内のインラインCSSはない。
- CSS変数、860px・520pxのブレークポイント、Canvasの可変幅対応がすでにある。
- 現時点でファイル間のCSS重複はない。
- `style.css` は818行あり、トップ、一覧、シミュレーションのすべてを1ファイルで管理している。今後は責務別整理を検討できるが、直ちに分割する必要はない。

### JavaScript

- JavaScript は `tools/mechanics/projectile.html` 内のみに存在する。
- ページ固有処理なので現状でも動作上は問題ないが、教材追加時には別ファイル化の基準が必要。

## 7. ガイドとの差分・問題点

### 優先度 A: 初回改修で扱う

1. **トップページが媒体別分類のみ**

   「単元から探す」がなく、ガイドの最重要方針に未対応。

2. **統合された単元ページがない**

   現在の単元ページはシミュレーション専用で、読む・見る・動かすを横断できない。

3. **教材メタデータが不足**

   `subject` 相当は一部の題名から推測できるが、`level`、教材ごとの説明、更新日、関連教材が標準化されていない。

4. **対象レベル表示がない**

   `[物理基礎]`、`[物理]`、`[発展]` の表示が教材カードにない。

5. **サイトの立ち位置が未明示**

   フッターに「個人運営の公開教材サイト」である旨がない。

6. **更新予定が大きすぎる**

   トップページの主要領域が作成予定中心で、現在利用可能な教材・最近の更新が前面に出ていない。

7. **404ページがない**

   URL整理時の離脱防止策がない。

8. **README・開発指示・管理ノートが混在**

   READMEにCodex向け開発方針が含まれ、`AGENTS.md` は未作成。Obsidian管理ノートも公開リポジトリ内にある。

9. **ライセンスがない**

   教材・コード・画像・PDFの再利用条件が不明。

10. **`.gitignore` がなく `.DS_Store` が追跡済み**

    公開不要ファイルが再混入しやすい。

### アクセシビリティ・教材設計上の問題

1. `slide/index.html`、`tools/index.html`、`tools/mechanics/index.html` は `h1` の次が `h3` で、見出し階層が飛んでいる。
2. 投射運動の Canvas には代替テキストがない。結果数値はHTMLにも表示されているため重要情報の完全なCanvas依存ではない。
3. 投射角の入力範囲が5°〜85°で、ガイドが極端値として挙げる0°・90°を確認できない。
4. 「空気抵抗を無視」「地表付近で重力加速度一定」「質点」などのモデル前提が明示されていない。
5. 投射運動ページに対象レベル、更新日、関連教材がない。
6. キーボード操作可能な標準フォーム要素は使われているが、実ブラウザでのフォーカス表示・操作検証は未実施。

### 公開・運用上の問題

1. PDF 15件に Author 情報は検出されなかった。
2. 一部PDFにmacOSのバージョンを含む Creator / Producer 情報が残る。
3. `phys-hs_chap0.pdf` など一部PDFの内部 Title と公開ファイル名・表示題名が一致しない。
4. 最大ファイルは `slide/phys/phys_1-05.pdf` の約4.7 MB、ヒーロー画像は約1.7 MB。直ちに致命的ではないが、モバイル通信向け最適化候補。
5. HTTPS強制設定はリポジトリ内から確認できないため、GitHub Pages Settingsで人間が確認する必要がある。

## 8. 現状の良い点

- Vanilla HTML / CSS / JavaScriptで自己完結している。
- 各ページに `lang="ja"`、viewport、description、titleがある。
- `header`、`nav`、`main`、`section`、`article`、`footer`を概ね使用している。
- 外部リンクに `target="_blank"` と `rel="noopener noreferrer"` が設定されている。
- CSS変数とレスポンシブ指定がすでにある。
- 投射運動の結果値はCanvas外にも表示される。
- ローカルリンク切れは検出されなかった。
- テキストファイルの簡易走査では、APIキー、トークン、パスワード、メールアドレスは検出されなかった。

## 9. Phase 2 への引き継ぎ

Phase 2 では、今回の結果を基に次を作成する。

- `AGENTS.md`: Codexの恒常ルールと作業・報告手順
- `docs/DESIGN.md`: 単元優先の情報設計、URL、ナビゲーション、共通UI
- `docs/CONTENT_POLICY.md`: 教材メタデータ、対象レベル、公開・著作権・個人情報方針
- `docs/CHECKLIST.md`: 公開前検証項目

設計時の重要判断事項は次の通り。

1. `/tools/...` の既存URLを維持しながら、推奨URLへどう接続するか。
2. 単元ページをルート直下に新設するか、既存 `tools/` ページをどう位置付けるか。
3. 管理用Markdownと公開ファイルの境界をどう定めるか。
4. 11ページに複製された共通HTMLを、現段階では手動同期するか、静的サイト生成を導入するか。

ガイドの段階的移行方針を踏まえ、Phase 2 時点ではフレームワーク導入を前提にせず、既存URLを維持できる設計を優先する。

## 10. 調査時の検証結果

- 全HTMLのローカル `href` の実在確認: 合格
- `git diff --check`: 合格
- 機密文字列・メールアドレス簡易走査: 該当なし
- PDFメタデータ確認: 実施済み
- 外部リンク到達確認: 未実施
- ブラウザ表示・レスポンシブ確認: Phase 6 で実施予定
- GitHub PagesのHTTPS設定確認: リポジトリ外設定のため未確認
