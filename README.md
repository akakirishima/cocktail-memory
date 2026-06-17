# cocktail-memory

カクテルのレシピを、選択式の練習とクイズで覚えるための学習アプリです。

材料、分量、グラス、作り方、ベース種別を、画像付きの UI で繰り返し確認できるようにしています。

## 目的

- 手書きメモやメニュー断片から、学習しやすいカクテルレシピ一覧を作る
- 文字入力ではなく選択式にして、スマートフォンでも練習しやすくする
- 間違えたレシピが出やすい出題ロジックで、復習効率を上げる
- 画像付きの材料パレットで、実物のボトルやグラスを想起しやすくする

## 主な機能

- 練習モード: グラス、作り方、材料、分量を選んで採点
- 種類当てモード: カクテル名からベースを 4 択で回答
- 一覧モード: レシピ検索、ベース絞り込み、出典絞り込み、習得済み管理
- 学習履歴: localStorage に挑戦回数、正答率、履歴、習得済み状態を保存
- 出題制御: 未挑戦や誤答が多いレシピを優先
- UI 回帰テスト: Playwright で横スクロール、選択状態、種類当て、画面 overflow を確認

## 技術スタック

- Next.js 16
- React 19
- TypeScript
- Playwright
- localStorage
- Next Image

## データ生成

`scripts/generate-catalog.mjs` が `app.js` のレシピ情報を読み取り、`data/catalog.json` を生成します。

`npm run dev` と `npm run build` の前に `predev` / `prebuild` として自動実行されます。

```bash
npm run generate:catalog
```

材料画像の取得・整理用に、次の補助スクリプトも用意しています。

```bash
npm run download:ingredient-images
```

## セットアップ

```bash
npm install
npm run dev
```

Next.js が表示するローカル URL を開いて確認します。

## ビルド

```bash
npm run build
npm run start
```

## テスト

```bash
npm run test
```

`npm run test` は `scripts/test-horizontal-scroll.mjs` を実行します。

事前に dev server を起動しておくか、`TEST_BASE_URL` で検証対象 URL を指定します。

```bash
TEST_BASE_URL=http://localhost:3000 npm run test
```

## ディレクトリ構成

```text
app/
  page.tsx
components/
  cocktail-study-app.tsx
data/
  catalog.json
lib/
  catalog.ts
  visuals.ts
scripts/
  generate-catalog.mjs
  test-horizontal-scroll.mjs
public/
  ingredients/
  placeholders/
```

## 実装上の工夫

- 選択肢は画像カードと chip を組み合わせ、タップ操作だけで回答できるようにした
- 分量選択は材料選択の直後に出すことで、入力手順を短くした
- 種類当ては正解時のみ自動で次問へ進み、誤答時は正解を確認してから進む
- 練習モードと種類当てモードの統計を分離し、片方の学習履歴がもう片方を汚染しないようにした
- 画面全体の横 overflow を Playwright で検出し、モバイル表示の崩れを早期に見つける

## 補足

このリポジトリは学習用アプリとして公開しています。レシピや画像素材を追加する場合は、出典と利用条件を確認してから取り込んでください。
