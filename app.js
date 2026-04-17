const STORAGE_KEY = "cocktail-memory-v1";

const sourceLabel = {
  main: "メイン",
  menu: "メニュー",
  fragment: "切れ端",
};

const sourceFullLabel = {
  main: "メインのレシピノート",
  menu: "カクテルメニュー",
  fragment: "切れ端メモ",
};

const practiceSourceOptions = [
  { value: "main", label: "メイン" },
  { value: "menu", label: "メニュー" },
  { value: "fragment", label: "切れ端" },
];

const sourceFilterOptions = [
  { value: "all", label: "すべて" },
  { value: "main", label: "メイン" },
  { value: "menu", label: "メニュー" },
  { value: "fragment", label: "切れ端" },
];

const methodOptions = [
  "ビルド",
  "シェイク",
  "ステア",
  "フロート",
  "クラッシュ",
  "ロック",
];

const nameAliases = new Map(
  Object.entries({
    レモン汁: "レモン果汁",
    レモンジュース: "レモン果汁",
    レモンスライス: "レモンスライス",
    グレフル: "グレフルジュース",
    グレープフルーツ: "グレフルジュース",
    グレープフルーツジュース: "グレフルジュース",
    グレフルj: "グレフルジュース",
    グレフルjuce: "グレフルジュース",
    ホワイトグレフル: "ホワイトグレフル",
    ホワイトグレープフルーツ: "ホワイトグレフル",
    ホワイトグレープフルーツジュース: "ホワイトグレフル",
    トニックウォーター: "トニック",
    カシスリキュール: "カシス",
    ピーチ: "ピーチツリー",
    ピーチツリー: "ピーチツリー",
    ワイン赤: "赤ワイン",
    ワイン赤色: "赤ワイン",
    ワイン赤ワイン: "赤ワイン",
    ワイン赤: "赤ワイン",
    赤ワイン: "赤ワイン",
    クリーム: "ミルク",
    コーヒーアイス: "コーヒー(アイス)",
    コーヒー冷: "コーヒー(冷)",
    コーヒー温: "コーヒー(温)",
    ティ冷: "ティ(冷)",
    アール温: "アール(温)",
    ジャス冷: "ジャス(冷)",
    ジンジャーエ: "ジンジャーエール",
    ジンジャーエール: "ジンジャーエール",
    ホワイトキュラソー: "ホワイトキュラソー",
    ブルーキュラソー: "ブルーキュラソー",
    コアントロー: "コアントロー",
    プルシア: "プルシア",
    パッソア: "パッソア",
    パッション: "パッソア",
    ウォッカ: "ウォッカ",
    ジン: "ジン",
    ラム: "ラム",
    テキーラ: "テキーラ",
    カンパリ: "カンパリ",
    カシス: "カシス",
    ディタ: "ディタ",
    コーラ: "コーラ",
    ソーダ: "ソーダ",
    トニック: "トニック",
    ミルク: "ミルク",
    ウーロン: "ウーロン",
    ライム: "ライム",
    レモン: "レモン",
  })
);

function src(type, label) {
  return { type, label };
}

function i(name, amount = "") {
  return { name, amount };
}

function r(config) {
  return {
    id: config.id,
    name: config.name,
    base: config.base,
    glass: config.glass || "",
    method: config.method || "ビルド",
    ingredients: config.ingredients || [],
    notes: config.notes || [],
    sources: config.sources || [],
    practice: config.practice !== false,
  };
}

function normalizeBase(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();
}

function foldText(text) {
  return String(text || "")
    .normalize("NFKC")
    .trim()
    .replace(/[　\s]+/g, "")
    .replace(/[‐‑‒–—―〜~・･／/、。:：\[\]【】()（）「」『』"'`]/g, "")
    .toLowerCase();
}

function normalizeName(text) {
  const folded = foldText(text);
  return nameAliases.get(folded) || folded;
}

function normalizeAmount(text) {
  let value = String(text || "").normalize("NFKC").trim();
  if (!value) {
    return "";
  }

  value = value.replace(/[　\s]+/g, "");
  value = value.replace(/[．。]/g, ".");
  value = value.replace(/[‐‑‒–—―−]/g, "-");
  value = value.replace(/^アップ$/i, "UP");
  value = value.replace(/^up\.?$/i, "UP");
  value = value.replace(/^(\d+)m[lL]?$/i, "$1ml");
  value = value.replace(/^(\d+)M$/i, "$1ml");
  value = value.replace(/^(\d+)m$/i, "$1ml");
  value = value.replace(/^(\d+)$/i, "$1ml");
  value = value.replace(/^1\/8(?:個|コ|こ)?$/i, "1/8コ");
  value = value.replace(/^1枚$/i, "1枚");
  value = value.replace(/^1(?:ケ|ヶ|個|こ|コ)$/i, "1ケ");
  value = value.replace(/^1カット$/i, "1カット");
  value = value.replace(/^1tsp$/i, "1tsp");
  value = value.replace(/^木のスプーン2杯$/i, "木のスプーン2杯");
  value = value.replace(/^少々$/i, "少々");
  value = value.replace(/^50\/50$/i, "50/50");
  value = value.replace(/^6割$/i, "6割");
  value = value.replace(/^うかせる。?$/i, "うかせる");
  value = value.replace(/^浮かせる。?$/i, "うかせる");
  return value;
}

function normalizeGlass(text) {
  const value = foldText(text);
  if (!value) return "";
  if (value === "未記載" || value === "なし") return "";
  return value;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sameAmount(expected, actual) {
  const left = normalizeAmount(expected);
  const right = normalizeAmount(actual);

  if (!left && !right) return true;
  if (!left && right === "UP") return true;
  if (!right && left === "UP") return true;
  if (left === right) return true;
  return false;
}

function sameName(expected, actual) {
  const left = normalizeName(expected);
  const right = normalizeName(actual);
  if (!left && !right) return true;
  return left === right;
}

function ingredientLine(ingredient) {
  const parts = [ingredient.name];
  const amount = normalizeAmount(ingredient.amount);
  if (amount) {
    parts.push(amount);
  }
  return parts.join(" ");
}

function recipeSearchText(recipe) {
  const pieces = [
    recipe.name,
    recipe.base,
    recipe.glass,
    recipe.method,
    recipe.notes.join(" "),
    recipe.sources.map((item) => item.label).join(" "),
    recipe.ingredients.map((item) => ingredientLine(item)).join(" "),
  ];
  return foldText(pieces.join(" "));
}

const RECIPES = [
  r({
    id: "gin-tonic",
    name: "ジントニック",
    base: "ジンベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ジン", "45ml"), i("ライム", "1/8コ"), i("トニック")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "gin-rickey",
    name: "ジンリッキー",
    base: "ジンベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ジン", "45ml"), i("ライム", "1/8コ"), i("ソーダ")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "gin-sonic",
    name: "ジンソニック",
    base: "ジンベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ジン", "45ml"), i("ライム", "1/8コ"), i("トニック"), i("ソーダ")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "vodka-tonic",
    name: "ウォッカトニック",
    base: "ウォッカベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ウォッカ", "30ml"), i("ライム", "1/8コ"), i("トニック")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "vodka-rickey",
    name: "ウォッカリッキー",
    base: "ウォッカベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ウォッカ", "45ml"), i("ライム", "1/8コ"), i("ソーダ")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "black-russian",
    name: "ブラックルシアン",
    base: "ウォッカベース",
    glass: "小さいロックグラス",
    method: "ビルド",
    ingredients: [i("ウォッカ", "30ml"), i("カルーア", "30ml")],
    notes: ["赤字: 小さいロックグラス"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "salty-dog",
    name: "ソルティドッグ",
    base: "ウォッカベース",
    glass: "スノースタイルショートグラス",
    method: "ビルド",
    ingredients: [i("ウォッカ", "45ml"), i("グレフル", "60ml"), i("塩")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "bulldog",
    name: "ブルドック",
    base: "ウォッカベース",
    glass: "ショートグラス",
    method: "ビルド",
    ingredients: [i("ウォッカ", "45ml"), i("グレフルジュース")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "boston-cooler",
    name: "ボストンクーラー",
    base: "ラムベース",
    glass: "ロンググラス",
    method: "シェイク",
    ingredients: [
      i("ラム", "30ml"),
      i("レモン果汁", "10ml"),
      i("砂糖", "1tsp"),
      i("ジンジャーエール", "UP"),
      i("レモン", "1カット"),
    ],
    notes: ["赤字: (シェイク)", "赤字の訂正でラム45mlは消されている"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "cuba-libre",
    name: "キューバリバー",
    base: "ラムベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ラム", "30ml"), i("ライム", "1/8コ"), i("コーラ")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "highball",
    name: "ハイボール",
    base: "ウイスキーベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ウイスキー", "30ml"), i("ソーダ")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "whisky-coke",
    name: "ウイスキーコーク",
    base: "ウイスキーベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ウイスキー", "30ml"), i("コーラ", "UP"), i("ライム", "1カット")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "john-collins",
    name: "ジョンコリンズ",
    base: "ウイスキーベース",
    glass: "ロンググラス",
    method: "シェイク",
    ingredients: [
      i("ウイスキー", "30ml"),
      i("レモン果汁", "10ml"),
      i("砂糖", "1tsp"),
      i("ソーダ", "UP"),
      i("レモン", "1カット"),
    ],
    notes: ["赤字: (シェイク)"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "diablo",
    name: "ディアブロ 11%",
    base: "テキーラベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [
      i("テキーラ", "45ml"),
      i("カシス", "15ml"),
      i("レモン汁", "10ml"),
      i("ジンジャーエール"),
    ],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "tequila-sunrise",
    name: "テキーラ サンライズ",
    base: "テキーラベース",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("テキーラ", "30ml"), i("グレナデンシロップ", "10ml"), i("オレンジジュース")],
    notes: ["作り方が異なるので、作る前に確認する!"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "brave-bull",
    name: "ブレイブブル",
    base: "テキーラベース",
    glass: "小さいロックグラス",
    method: "ビルド",
    ingredients: [i("テキーラ", "30ml"), i("カルーア", "30ml")],
    notes: ["赤字: 小さいロックグラス"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "kitty",
    name: "キティ",
    base: "ワインベース",
    glass: "ワイングラス",
    method: "ビルド",
    ingredients: [i("赤ワイン", "60ml"), i("ジンジャーエール", "60ml")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "calimocho",
    name: "カリモーチョ",
    base: "ワインベース",
    glass: "ワイングラス",
    method: "ビルド",
    ingredients: [i("ワイン(赤)", "60ml"), i("コーラ"), i("レモンスライス", "1枚")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "wine-cooler",
    name: "ワインクーラー",
    base: "ワインベース",
    glass: "",
    method: "シェイク",
    ingredients: [
      i("オレンジジュース", "30ml"),
      i("ホワイトキュラソー", "10ml"),
      i("グレナデンシロップ", "15ml"),
      i("ワイン", "90ml"),
    ],
    notes: ["赤字: (シェイク) (クラッシュ)", "赤字: ↑赤も白も可。"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "americano",
    name: "アメリカーノ",
    base: "ワインベース",
    glass: "",
    method: "フロート",
    ingredients: [
      i("レモン果汁", "30ml"),
      i("砂糖", "木のスプーン2杯"),
      i("水", "6割"),
      i("赤ワイン", "うかせる"),
    ],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "campari-soda",
    name: "カンパリソーダ",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("カンパリ", "40ml"), i("ソーダ", "UP"), i("レモン", "1カット")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "spumoni",
    name: "スプモーニ",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("カンパリ", "30ml"), i("グレフルジュース", "45ml"), i("トニックウォーター")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "cassis-soda",
    name: "カシス ソーダ",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("カシス", "45ml"), i("ソーダ"), i("レモンスライス", "1枚")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "cassis-orange",
    name: "カシス オレンジ",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("カシスリキュール", "30ml"), i("オレンジジュース")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "kahlua-milk",
    name: "カルーア ミルク",
    base: "リキュールベース等",
    glass: "マグカップ",
    method: "ビルド",
    ingredients: [i("カルーア", "30ml"), i("ミルク"), i("コーヒー(アイス)", "少々")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "peach-oolong",
    name: "ピーチウーロン",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ピーチ", "40ml"), i("ウーロン", "UP"), i("レモンスライス", "1ケ")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "fuzzy-navel",
    name: "ファジーネーブル",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ピーチツリー", "30ml"), i("オレンジジュース")],
    notes: ["赤字: 40は訂正で消されている"],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "dita-soda",
    name: "ディタソーダ",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ディタ", "40ml"), i("ソーダ", "UP"), i("レモン", "1カット")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "dita-orange",
    name: "ディタオレンジ",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [i("ディタ", "40ml"), i("オレンジジュース", "UP")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "dita-tonic",
    name: "ディタトニック",
    base: "リキュールベース等",
    glass: "",
    method: "ビルド",
    ingredients: [i("ディタ", "40ml"), i("ライム", "1/8コ"), i("トニック", "UP")],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "china-blue",
    name: "チャイナブルー",
    base: "リキュールベース等",
    glass: "ロンググラス",
    method: "ビルド",
    ingredients: [
      i("ディタ", "20ml"),
      i("ブルーキュラソー", "15ml"),
      i("ホワイトグレフル", "40ml"),
      i("トニック", "UP"),
    ],
    sources: [src("main", sourceFullLabel.main)],
  }),
  r({
    id: "cointreau-tonic",
    name: "コアントロートニック",
    base: "リキュールベース等",
    glass: "グラス",
    method: "ビルド",
    ingredients: [i("コアントロー", "30ml"), i("トニック", "UP")],
    sources: [src("fragment", "切れ端メモ 2"), src("menu", sourceFullLabel.menu)],
  }),
  r({
    id: "screwdriver",
    name: "スクリュードライバー",
    base: "リキュールベース等",
    glass: "グラス",
    method: "ビルド",
    ingredients: [i("ウォッカ", "30ml"), i("オレンジジュース", "UP")],
    sources: [src("menu", sourceFullLabel.menu)],
  }),
  r({
    id: "apricot-soda",
    name: "アプリコットソーダ",
    base: "リキュールベース等",
    glass: "",
    method: "ビルド",
    ingredients: [i("プルシア", "40ml"), i("ソーダ", "UP")],
    sources: [src("fragment", "切れ端メモ 1"), src("menu", sourceFullLabel.menu)],
  }),
  r({
    id: "sol-cubano",
    name: "ソルクバーノ",
    base: "リキュールベース等",
    glass: "",
    method: "ビルド",
    ingredients: [i("ラム", "30ml"), i("グレフルジュース", "60ml"), i("トニック")],
    sources: [src("fragment", "切れ端メモ 4"), src("menu", sourceFullLabel.menu)],
  }),
  r({
    id: "moscow-mule",
    name: "モスコミュール",
    base: "リキュールベース等",
    glass: "",
    method: "ビルド",
    ingredients: [i("ウォッカ", "30ml"), i("ライム", "1/8コ"), i("ジンジャーエール", "UP")],
    sources: [src("fragment", "切れ端メモ 7"), src("menu", sourceFullLabel.menu)],
  }),
];

const NOTE_PAGES = [
  {
    title: "切れ端メモ 1",
    kind: "fragment",
    lines: ["アプリコットソーダ", "☆プルシア 40ml", "☆ソーダ UP"],
  },
  {
    title: "切れ端メモ 2",
    kind: "fragment",
    lines: ["コアントロートニック", "〜コアントロー 30M", "〜トニック"],
  },
  {
    title: "切れ端メモ 3",
    kind: "stockout",
    columns: [
      ["コーヒー(冷) ×", "コーヒー(温) ×", "ティ(冷) ×", "アール(温) ×", "ジャス(冷) ×"],
      ["ピーチウーロン ×", "カシス ×", "カルーア ×", "キウイ ×", "ジンジャーエ ×", "カルーア ×"],
    ],
  },
  {
    title: "切れ端メモ 4",
    kind: "fragment",
    lines: ["ソルクバーノ", "*ラム ── 30ml", "*グレフルジュース ── 60ml", "*トニック"],
  },
  {
    title: "切れ端メモ 5",
    kind: "partial",
    lines: ["*グレフルジュース 45ml"],
  },
  {
    title: "切れ端メモ 6",
    kind: "partial",
    lines: [
      "（上部見切れ）パッション…",
      "パッソア 30ml",
      "オレンジ 50/50",
      "パイン 50/50",
      "（赤字で丸囲み）ロック",
      "（赤字）(シェイク)",
    ],
  },
  {
    title: "切れ端メモ 7",
    kind: "fragment",
    lines: ["モスコミュール", "☆ウォッカ 30ml", "☆ライム 1/8コ", "☆ジンジャーエール UP"],
  },
];

const allRecipes = RECIPES.map((recipe) => ({
  ...recipe,
  searchText: recipeSearchText(recipe),
}));

const recipeById = new Map(allRecipes.map((recipe) => [recipe.id, recipe]));
const categories = Array.from(new Set(allRecipes.map((recipe) => recipe.base)));
const glasses = Array.from(
  new Set(
    allRecipes
      .map((recipe) => recipe.glass)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "ja"))
  )
);

const defaultState = {
  tab: "practice",
  currentRecipeId: "",
  showAnswer: false,
  search: "",
  baseFilter: "all",
  sourceFilter: "all",
  scopeFilter: "all",
  practiceSources: {
    main: true,
    menu: true,
    fragment: true,
  },
  drafts: {},
  stats: {
    attempts: 0,
    perfects: 0,
    points: 0,
    possible: 0,
    mastered: {},
    byRecipe: {},
    history: [],
  },
};

function safeParseState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const cloneDefault = () => JSON.parse(JSON.stringify(defaultState));
    if (!raw) return cloneDefault();
    const parsed = JSON.parse(raw);
    return {
      ...cloneDefault(),
      ...parsed,
      practiceSources: {
        ...cloneDefault().practiceSources,
        ...(parsed.practiceSources || {}),
      },
      drafts: parsed.drafts || {},
      stats: {
        ...cloneDefault().stats,
        ...(parsed.stats || {}),
        mastered: (parsed.stats && parsed.stats.mastered) || {},
        byRecipe: (parsed.stats && parsed.stats.byRecipe) || {},
        history: (parsed.stats && parsed.stats.history) || [],
      },
    };
  } catch {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function persistState() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tab: state.tab,
        currentRecipeId: state.currentRecipeId,
        showAnswer: state.showAnswer,
        search: state.search,
        baseFilter: state.baseFilter,
        sourceFilter: state.sourceFilter,
        scopeFilter: state.scopeFilter,
        practiceSources: state.practiceSources,
        drafts: state.drafts,
        stats: state.stats,
      })
    );
  } catch {
    // localStorage can be unavailable in file:// contexts; keep working in memory.
  }
}

const state = safeParseState();

const els = {
  heroArt: document.getElementById("hero-art"),
  statusChips: document.getElementById("status-chips"),
  statAttempts: document.getElementById("stat-attempts"),
  statPerfects: document.getElementById("stat-perfects"),
  statAccuracy: document.getElementById("stat-accuracy"),
  statMastered: document.getElementById("stat-mastered"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  practicePanel: document.getElementById("practice-panel"),
  libraryPanel: document.getElementById("library-panel"),
  practiceBadges: document.getElementById("practice-badges"),
  practiceName: document.getElementById("practice-name"),
  practiceSummary: document.getElementById("practice-summary"),
  practiceTags: document.getElementById("practice-tags"),
  practiceNote: document.getElementById("practice-note"),
  practiceSourceFilters: document.getElementById("practice-source-filters"),
  nextOrder: document.getElementById("next-order"),
  showAnswer: document.getElementById("show-answer"),
  resetAnswer: document.getElementById("reset-answer"),
  answerForm: document.getElementById("answer-form"),
  answerGlass: document.getElementById("answer-glass"),
  answerMethod: document.getElementById("answer-method"),
  ingredientRows: document.getElementById("ingredient-rows"),
  answerNotes: document.getElementById("answer-notes"),
  addRow: document.getElementById("add-row"),
  scorebox: document.getElementById("scorebox"),
  searchInput: document.getElementById("search-input"),
  baseFilter: document.getElementById("base-filter"),
  sourceFilter: document.getElementById("source-filter"),
  scopeFilters: document.getElementById("scope-filters"),
  recipeList: document.getElementById("recipe-list"),
  detailName: document.getElementById("detail-name"),
  detailSummary: document.getElementById("detail-summary"),
  detailBody: document.getElementById("detail-body"),
  notesGrid: document.getElementById("notes-grid"),
  markMastered: document.getElementById("mark-mastered"),
  weakList: document.getElementById("weak-list"),
  historyList: document.getElementById("history-list"),
};

function createHeroArt() {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 1600, 800);
  bg.addColorStop(0, "#0f1312");
  bg.addColorStop(0.55, "#151b19");
  bg.addColorStop(1, "#1c1f1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(199,255,106,0.12)";
  for (let x = 80; x < 1600; x += 220) {
    ctx.fillRect(x, 68, 86, 14);
    ctx.fillRect(x + 20, 100, 46, 10);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  for (let y = 40; y < 760; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1600, y);
    ctx.stroke();
  }

  function roundedRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  // shaker
  roundedRect(98, 250, 190, 360, 28, "#aeb6b1", "rgba(0,0,0,0.45)");
  roundedRect(120, 216, 146, 56, 18, "#dbe2de", "rgba(0,0,0,0.4)");
  roundedRect(148, 206, 90, 30, 12, "#7d8580", "rgba(0,0,0,0.38)");
  ctx.fillStyle = "#7a827d";
  ctx.fillRect(175, 190, 36, 40);

  // long glass
  roundedRect(352, 184, 178, 426, 24, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.18)");
  roundedRect(372, 220, 138, 320, 22, "rgba(199,255,106,0.22)", "rgba(199,255,106,0.35)");
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(382, 200);
  ctx.lineTo(500, 200);
  ctx.lineTo(520, 560);
  ctx.lineTo(362, 560);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c7ff6a";
  ctx.beginPath();
  ctx.moveTo(396, 228);
  ctx.lineTo(486, 228);
  ctx.lineTo(506, 532);
  ctx.lineTo(376, 532);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.fillRect(394, 346, 108, 10);
  ctx.fillRect(394, 384, 108, 8);
  ctx.fillRect(394, 420, 108, 8);
  ctx.fillStyle = "#f7b267";
  ctx.beginPath();
  ctx.moveTo(500, 248);
  ctx.lineTo(548, 230);
  ctx.lineTo(532, 266);
  ctx.closePath();
  ctx.fill();

  // rocks glass
  roundedRect(630, 370, 196, 270, 28, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.18)");
  roundedRect(652, 408, 152, 168, 22, "rgba(255,111,97,0.18)", "rgba(255,111,97,0.32)");
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(650, 398, 156, 12);
  ctx.fillStyle = "#ff6f61";
  ctx.fillRect(662, 418, 132, 126);
  ctx.fillStyle = "#f7b267";
  ctx.beginPath();
  ctx.moveTo(742, 364);
  ctx.lineTo(808, 378);
  ctx.lineTo(770, 412);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(680, 464, 96, 12);

  // mug
  roundedRect(924, 392, 184, 228, 28, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.18)");
  roundedRect(946, 420, 140, 150, 22, "rgba(247,178,103,0.18)", "rgba(247,178,103,0.28)");
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(1118, 490, 48, Math.PI * 1.6, Math.PI * 0.3);
  ctx.stroke();
  ctx.fillStyle = "#f7b267";
  ctx.fillRect(958, 432, 116, 112);
  ctx.fillStyle = "#5c3b24";
  ctx.fillRect(968, 460, 96, 68);
  ctx.fillStyle = "#c7ff6a";
  ctx.fillRect(981, 448, 12, 38);

  // citrus + notes
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(1278, 266, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff1c1";
  ctx.beginPath();
  ctx.arc(1278, 266, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.14)";
  ctx.lineWidth = 10;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(1278, 266);
    ctx.lineTo(1278 + Math.cos(angle) * 68, 266 + Math.sin(angle) * 68);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundedRect(1218, 460, 250, 112, 18, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.12)");
  ctx.fillStyle = "rgba(199,255,106,0.08)";
  ctx.fillRect(1230, 474, 224, 10);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(1230, 500, 154, 8);
  ctx.fillRect(1230, 524, 198, 8);

  return canvas.toDataURL("image/png");
}

function buildSelect(select, values, includeBlank = false) {
  select.innerHTML = "";
  if (includeBlank) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "未記載";
    select.appendChild(opt);
  }
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

function formatSourceChips(recipe) {
  return recipe.sources
    .map((item) => `<span class="badge">${sourceLabel[item.type]}${item.label ? ` / ${item.label}` : ""}</span>`)
    .join("");
}

function activePracticeDeck() {
  return allRecipes.filter((recipe) =>
    recipe.practice &&
    recipe.sources.some((source) => state.practiceSources[source.type])
  );
}

function deckWeight(recipe) {
  const progress = state.stats.byRecipe[recipe.id] || {};
  const attempts = progress.attempts || 0;
  const wrongs = progress.wrongs || 0;
  const mastered = !!state.stats.mastered[recipe.id];
  let weight = 1 + wrongs * 1.8;
  if (!attempts) {
    weight += 1.1;
  }
  if (mastered) {
    weight *= 0.6;
  }
  return Math.max(0.35, weight);
}

function chooseWeightedRecipe(deck, avoidId = "") {
  if (!deck.length) return null;
  const pool = deck.length > 1 && avoidId ? deck.filter((recipe) => recipe.id !== avoidId) : deck;
  const candidates = pool.length ? pool : deck;
  const total = candidates.reduce((sum, recipe) => sum + deckWeight(recipe), 0);
  let remaining = Math.random() * total;
  for (const recipe of candidates) {
    remaining -= deckWeight(recipe);
    if (remaining <= 0) {
      return recipe;
    }
  }
  return candidates[candidates.length - 1];
}

function ensureCurrentRecipe() {
  if (recipeById.has(state.currentRecipeId)) {
    return recipeById.get(state.currentRecipeId);
  }
  const deck = activePracticeDeck();
  if (!deck.length) {
    state.currentRecipeId = "";
    persistState();
    return null;
  }
  const chosen = chooseWeightedRecipe(deck) || deck[0];
  state.currentRecipeId = chosen ? chosen.id : "";
  state.showAnswer = false;
  persistState();
  return chosen;
}

function currentDraft(recipe) {
  const draft = state.drafts[recipe.id];
  if (draft) {
    return {
      glass: draft.glass ?? "",
      method: draft.method ?? "",
      notes: draft.notes ?? "",
      rows: Array.isArray(draft.rows) ? draft.rows : [],
    };
  }
  return {
    glass: "",
    method: "",
    notes: "",
    rows: recipe.ingredients.map(() => ({ name: "", amount: "" })),
  };
}

function saveDraft(recipe, draft) {
  state.drafts[recipe.id] = draft;
  persistState();
}

function readDraftFromDOM() {
  const rows = Array.from(els.ingredientRows.querySelectorAll(".practice-row")).map((row) => ({
    name: row.querySelector('[data-role="name"]').value,
    amount: row.querySelector('[data-role="amount"]').value,
  }));
  return {
    glass: els.answerGlass.value,
    method: els.answerMethod.value,
    notes: els.answerNotes.value,
    rows,
  };
}

function renderPracticeSourceFilters() {
  els.practiceSourceFilters.innerHTML = "";
  practiceSourceOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${state.practiceSources[option.value] ? "is-active" : ""}`;
    button.textContent = option.label;
    button.setAttribute("aria-pressed", String(state.practiceSources[option.value]));
    button.addEventListener("click", () => {
      state.practiceSources[option.value] = !state.practiceSources[option.value];
      if (!Object.values(state.practiceSources).some(Boolean)) {
        state.practiceSources[option.value] = true;
      }
      persistState();
      const deck = activePracticeDeck();
      const current = recipeById.get(state.currentRecipeId);
      if (!current || !deck.some((recipe) => recipe.id === current.id)) {
        const next = chooseWeightedRecipe(deck) || allRecipes[0];
        state.currentRecipeId = next ? next.id : "";
      }
      renderAll();
    });
    els.practiceSourceFilters.appendChild(button);
  });
}

function renderPracticeHeader(recipe) {
  const deck = activePracticeDeck();
  const mastered = !!state.stats.mastered[recipe.id];
  const sourceBits = recipe.sources.map((item) => sourceLabel[item.type]).join(" / ");

  els.practiceBadges.innerHTML = [
    `<span class="chip chip--accent">練習 ${deck.length}件</span>`,
    `<span class="chip">完全一致 ${state.stats.perfects}回</span>`,
    `<span class="chip">習得済 ${Object.keys(state.stats.mastered).length}件</span>`,
    mastered ? `<span class="chip chip--accent">習得済</span>` : `<span class="chip">未習得</span>`,
  ].join("");

  els.practiceName.textContent = recipe.name;
  els.practiceSummary.textContent = [
    recipe.base,
    recipe.glass || "グラス未記載",
    `${recipe.ingredients.length}点`,
    sourceBits,
  ].join(" / ");

  const tags = [
    recipe.glass ? `<span class="badge badge--green">グラス ${recipe.glass}</span>` : `<span class="badge">グラス未記載</span>`,
    `<span class="badge">作り方 ${recipe.method}</span>`,
    `<span class="badge">材料 ${recipe.ingredients.length}点</span>`,
    `<span class="badge">${sourceBits}</span>`,
  ];
  els.practiceTags.innerHTML = tags.join("");
  els.practiceNote.textContent = recipe.notes.length
    ? recipe.notes.join(" / ")
    : "このレシピは手書きメモが少なめです。";
}

function renderAnswerFields(recipe) {
  const draft = currentDraft(recipe);
  buildSelect(els.answerGlass, glasses, true);
  buildSelect(els.answerMethod, methodOptions, true);
  els.answerGlass.value = draft.glass ?? "";
  els.answerMethod.value = draft.method ?? "";
  els.answerNotes.value = draft.notes ?? "";

  els.ingredientRows.innerHTML = "";
  const rows = draft.rows.length ? draft.rows : recipe.ingredients.map(() => ({ name: "", amount: "" }));
  rows.forEach((row, index) => {
    const expected = recipe.ingredients[index] || null;
    const wrapper = document.createElement("div");
    wrapper.className = "practice-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = expected ? `例: ${expected.name}` : "材料名";
    nameInput.value = row.name || "";
    nameInput.setAttribute("data-role", "name");

    const amountInput = document.createElement("input");
    amountInput.type = "text";
    amountInput.placeholder = expected ? `例: ${expected.amount || "UP / 空欄"}` : "量 / UP";
    amountInput.value = row.amount || "";
    amountInput.setAttribute("data-role", "amount");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button-ghost";
    removeButton.textContent = "削除";
    removeButton.addEventListener("click", () => {
      const currentRows = Array.from(els.ingredientRows.querySelectorAll(".practice-row"));
      if (currentRows.length <= 1) return;
      wrapper.remove();
      saveCurrentDraft(recipe);
    });

    nameInput.addEventListener("input", () => saveCurrentDraft(recipe));
    amountInput.addEventListener("input", () => saveCurrentDraft(recipe));

    wrapper.appendChild(nameInput);
    wrapper.appendChild(amountInput);
    wrapper.appendChild(removeButton);
    els.ingredientRows.appendChild(wrapper);
  });
}

function saveCurrentDraft(recipe) {
  saveDraft(recipe, readDraftFromDOM());
}

function addIngredientRow(recipe) {
  const row = document.createElement("div");
  row.className = "practice-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "材料名";
  nameInput.setAttribute("data-role", "name");

  const amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.placeholder = "量 / UP";
  amountInput.setAttribute("data-role", "amount");

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "button-ghost";
  removeButton.textContent = "削除";
  removeButton.addEventListener("click", () => {
    const rows = Array.from(els.ingredientRows.querySelectorAll(".practice-row"));
    if (rows.length <= 1) return;
    row.remove();
    saveCurrentDraft(recipe);
  });

  nameInput.addEventListener("input", () => saveCurrentDraft(recipe));
  amountInput.addEventListener("input", () => saveCurrentDraft(recipe));

  row.appendChild(nameInput);
  row.appendChild(amountInput);
  row.appendChild(removeButton);
  els.ingredientRows.appendChild(row);
  saveCurrentDraft(recipe);
}

function normalizeRows(rows) {
  return rows
    .map((row) => ({
      name: normalizeName(row.name),
      amount: normalizeAmount(row.amount),
    }))
    .filter((row) => row.name || row.amount);
}

function compareRows(expectedRows, actualRows) {
  const rowCount = Math.max(expectedRows.length, actualRows.length);
  const details = [];
  let points = 0;
  let possible = 0;

  for (let index = 0; index < rowCount; index += 1) {
    const expected = expectedRows[index] || null;
    const actual = actualRows[index] || null;
    const expectedLabel = expected ? ingredientLine(expected) : "なし";
    const actualLabel = actual ? [actual.name, actual.amount].filter(Boolean).join(" ") || "空欄" : "空欄";

    if (expected) {
      possible += 2;
      const nameOk = !!actual && sameName(expected.name, actual.name);
      const amountOk = !!actual && sameAmount(expected.amount, actual.amount);
      if (nameOk) points += 1;
      if (amountOk) points += 1;
      details.push({
        label: `材料 ${index + 1}`,
        expected: expectedLabel,
        actual: actualLabel,
        ok: nameOk && amountOk,
      });
    } else if (actual) {
      possible += 2;
      details.push({
        label: `余分 ${index + 1}`,
        expected: "なし",
        actual: actualLabel,
        ok: false,
      });
    }
  }

  return { points, possible, details };
}

function gradeAttempt(recipe, answer) {
  const cleanGlass = normalizeGlass(answer.glass);
  const cleanMethod = foldText(answer.method);
  const expectedGlass = normalizeGlass(recipe.glass);
  const expectedMethod = foldText(recipe.method);

  let points = 0;
  let possible = 0;
  const details = [];

  if (recipe.glass) {
    possible += 1;
    const ok = cleanGlass === expectedGlass;
    if (ok) points += 1;
    details.push({
      label: "グラス",
      expected: recipe.glass,
      actual: answer.glass || "未記載",
      ok,
    });
  }

  if (recipe.method) {
    possible += 1;
    const ok = cleanMethod === expectedMethod;
    if (ok) points += 1;
    details.push({
      label: "作り方",
      expected: recipe.method,
      actual: answer.method || "未記載",
      ok,
    });
  }

  const rowResult = compareRows(recipe.ingredients, normalizeRows(answer.rows || []));
  points += rowResult.points;
  possible += rowResult.possible;
  details.push(...rowResult.details);

  const perfect = possible > 0 && points === possible;
  return {
    points,
    possible,
    perfect,
    details,
  };
}

function updateStats(recipe, result) {
  state.stats.attempts += 1;
  state.stats.points += result.points;
  state.stats.possible += result.possible;
  if (result.perfect) {
    state.stats.perfects += 1;
  }

  const entry = state.stats.byRecipe[recipe.id] || {
    attempts: 0,
    perfects: 0,
    points: 0,
    possible: 0,
    wrongs: 0,
  };

  entry.attempts += 1;
  entry.points += result.points;
  entry.possible += result.possible;
  if (result.perfect) {
    entry.perfects += 1;
  } else {
    entry.wrongs += 1;
  }

  state.stats.byRecipe[recipe.id] = entry;
  state.stats.history.unshift({
    id: recipe.id,
    name: recipe.name,
    points: result.points,
    possible: result.possible,
    perfect: result.perfect,
    at: Date.now(),
  });
  state.stats.history = state.stats.history.slice(0, 20);
  persistState();
}

function recipeCoverage(recipe) {
  const stats = state.stats.byRecipe[recipe.id] || {};
  const attempts = stats.attempts || 0;
  const perfects = stats.perfects || 0;
  if (!attempts) return "未挑戦";
  return `${perfects}/${attempts}`;
}

function recipeMatchText(recipe) {
  return [
    recipe.name,
    recipe.base,
    recipe.glass,
    recipe.method,
    recipe.ingredients.map((item) => ingredientLine(item)).join(" "),
    recipe.notes.join(" "),
    recipe.sources.map((item) => item.label).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function renderScorebox(recipe, result = null) {
  const draft = currentDraft(recipe);
  if (!result && !state.showAnswer) {
    els.scorebox.innerHTML = `
      <div class="small">グラスと作り方を選び、材料を1行ずつ入れてから採点してください。</div>
    `;
    return;
  }

  const answer = result || gradeAttempt(recipe, draft);
  const ratio = answer.possible ? Math.round((answer.points / answer.possible) * 100) : 0;
  const summary = answer.perfect
    ? "完全一致"
    : `${answer.points}/${answer.possible}一致`;
  const detailsHtml = answer.details
    .map(
      (item) => `
        <div class="diff-row ${item.ok ? "is-ok" : "is-bad"}">
          <span>${escapeHtml(item.label)}</span>
          <span>${escapeHtml(item.expected)}</span>
          <span>${escapeHtml(item.actual)}</span>
        </div>
      `
    )
    .join("");

  const answerHtml = state.showAnswer
    ? `
      <div class="detail-section">
        <h4>答え</h4>
        <ul>
          <li>グラス: ${recipe.glass || "未記載"}</li>
          <li>作り方: ${recipe.method}</li>
          ${recipe.ingredients
            .map((item) => `<li>${ingredientLine(item)}</li>`)
            .join("")}
        </ul>
        ${
          recipe.notes.length
            ? `<p class="small">メモ: ${recipe.notes.join(" / ")}</p>`
            : ""
        }
      </div>
    `
    : "";

  els.scorebox.innerHTML = `
      <div class="stack">
      <div><strong>${escapeHtml(summary)}</strong> <span class="small">(${ratio}%)</span></div>
      <div class="diff">${detailsHtml}</div>
      ${answerHtml}
    </div>
  `;
}

function setCurrentRecipe(recipe, preserveShow = false) {
  if (!recipe) return;
  state.currentRecipeId = recipe.id;
  if (!preserveShow) {
    state.showAnswer = false;
  }
  persistState();
  renderAll();
}

function pickNextRecipe(force = false) {
  const deck = activePracticeDeck();
  if (!deck.length) {
    state.currentRecipeId = "";
    persistState();
    renderAll();
    return;
  }
  const next = chooseWeightedRecipe(deck, force ? "" : state.currentRecipeId) || deck[0];
  state.currentRecipeId = next.id;
  state.showAnswer = false;
  persistState();
  renderAll();
}

function toggleMastered(recipe) {
  if (state.stats.mastered[recipe.id]) {
    delete state.stats.mastered[recipe.id];
  } else {
    state.stats.mastered[recipe.id] = true;
  }
  persistState();
  renderAll();
}

function renderStats() {
  const accuracy = state.stats.possible
    ? Math.round((state.stats.points / state.stats.possible) * 100)
    : 0;
  const masteredCount = Object.keys(state.stats.mastered).length;

  els.statAttempts.textContent = String(state.stats.attempts);
  els.statPerfects.textContent = String(state.stats.perfects);
  els.statAccuracy.textContent = `${accuracy}%`;
  els.statMastered.textContent = String(masteredCount);

  const deckCounts = practiceSourceOptions
    .map((option) => {
      const count = allRecipes.filter(
        (recipe) => recipe.practice && recipe.sources.some((source) => source.type === option.value)
      ).length;
      return `<span class="chip">${option.label} ${count}</span>`;
    })
    .join("");

  const activeSources = practiceSourceOptions
    .filter((option) => state.practiceSources[option.value])
    .map((option) => option.label)
    .join(" / ");

  els.statusChips.innerHTML = `
    <span class="chip chip--accent">練習 ${activePracticeDeck().length}件</span>
    <span class="chip">一致率 ${accuracy}%</span>
    <span class="chip">習得済 ${masteredCount}件</span>
    ${deckCounts}
    <span class="chip">出題範囲 ${activeSources || "なし"}</span>
  `;
}

function renderLearningPanels() {
  const weakEntries = Object.entries(state.stats.byRecipe)
    .map(([id, entry]) => ({
      recipe: recipeById.get(id),
      ...entry,
    }))
    .filter((entry) => entry.recipe)
    .sort((a, b) => (b.wrongs || 0) - (a.wrongs || 0) || (b.attempts || 0) - (a.attempts || 0))
    .slice(0, 5);

  els.weakList.innerHTML = weakEntries.length
    ? weakEntries
        .map(
          (entry) => `
            <div class="detail-section">
              <h4>${entry.recipe.name}</h4>
              <ul>
                <li>出題 ${entry.attempts || 0}回</li>
                <li>失敗 ${entry.wrongs || 0}回</li>
                <li>完全一致 ${entry.perfects || 0}回</li>
              </ul>
            </div>
          `
        )
        .join("")
    : `<p class="helper">まだ苦手データがありません。</p>`;

  els.historyList.innerHTML = state.stats.history.length
    ? state.stats.history
        .map(
          (entry) => `
            <div class="detail-section">
              <h4>${entry.name}</h4>
              <p class="small">${new Date(entry.at).toLocaleString("ja-JP")} / ${entry.points}/${entry.possible} / ${entry.perfect ? "完全一致" : "未達"}</p>
            </div>
          `
        )
        .join("")
    : `<p class="helper">まだ出題履歴がありません。</p>`;
}

function renderPractice() {
  const recipe = ensureCurrentRecipe();
  if (!recipe) {
    els.practiceName.textContent = "出題できるレシピがありません";
    els.practiceSummary.textContent = "出題範囲を1つ以上オンにしてください。";
    els.practiceTags.innerHTML = "";
    els.practiceNote.textContent = "";
    els.practiceBadges.innerHTML = "";
    els.scorebox.innerHTML = `<div class="small">出題範囲を選び直してください。</div>`;
    els.ingredientRows.innerHTML = "";
    return;
  }

  renderPracticeHeader(recipe);
  renderAnswerFields(recipe);
  renderScorebox(recipe, null);
}

function renderBaseFilter() {
  const options = ["all", ...categories];
  els.baseFilter.innerHTML = "";
  options.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value === "all" ? "すべて" : value;
    els.baseFilter.appendChild(opt);
  });
  els.baseFilter.value = state.baseFilter;
}

function renderSourceFilter() {
  els.sourceFilter.innerHTML = "";
  sourceFilterOptions.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    els.sourceFilter.appendChild(opt);
  });
  els.sourceFilter.value = state.sourceFilter;
}

function renderScopeFilters() {
  const items = [
    { value: "all", label: "すべて" },
    { value: "mastered", label: "習得済" },
    { value: "unmastered", label: "未習得" },
  ];

  els.scopeFilters.innerHTML = "";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip ${state.scopeFilter === item.value ? "is-active" : ""}`;
    button.textContent = item.label;
    button.setAttribute("aria-pressed", String(state.scopeFilter === item.value));
    button.addEventListener("click", () => {
      state.scopeFilter = item.value;
      persistState();
      renderRecipeList();
      renderScopeFilters();
    });
    els.scopeFilters.appendChild(button);
  });
}

function recipeMatchesFilters(recipe) {
  const query = foldText(state.search);
  const baseOk = state.baseFilter === "all" || recipe.base === state.baseFilter;
  const sourceOk =
    state.sourceFilter === "all" ||
    recipe.sources.some((source) => source.type === state.sourceFilter);
  const mastered = !!state.stats.mastered[recipe.id];
  const scopeOk =
    state.scopeFilter === "all" ||
    (state.scopeFilter === "mastered" ? mastered : !mastered);

  if (!baseOk || !sourceOk || !scopeOk) return false;
  if (!query) return true;
  return recipe.searchText.includes(query);
}

function renderRecipeList() {
  const filtered = allRecipes.filter(recipeMatchesFilters);
  els.recipeList.innerHTML = "";

  if (!filtered.length) {
    els.recipeList.innerHTML = `<div class="card"><p class="helper">一致するレシピがありません。</p></div>`;
    return;
  }

  filtered.forEach((recipe) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `recipe-card ${recipe.id === state.currentRecipeId ? "is-selected" : ""}`;

    const mastered = !!state.stats.mastered[recipe.id];
    const preview = recipe.ingredients.slice(0, 2).map((item) => ingredientLine(item)).join(" / ");
    const note = recipe.notes[0] || recipe.glass || "グラス未記載";

    card.innerHTML = `
      <div class="badge-row">
        <span class="badge">${recipe.base}</span>
        ${mastered ? '<span class="badge badge--green">習得済</span>' : ""}
      </div>
      <h3>${recipe.name}</h3>
      <p class="line">${preview}</p>
      <p>${note}</p>
      <div class="badge-row">
        <span class="badge">一致 ${recipeCoverage(recipe)}</span>
        <span class="badge">材料 ${recipe.ingredients.length}</span>
      </div>
      <div class="badge-row">${formatSourceChips(recipe)}</div>
    `;

    card.addEventListener("click", () => {
      setCurrentRecipe(recipe);
    });

    els.recipeList.appendChild(card);
  });
}

function renderRecipeDetail(recipe) {
  if (!recipe) {
    els.detailName.textContent = "レシピを選択";
    els.detailSummary.textContent = "一覧から1つ選ぶと、材料・注記・出典を見られます。";
    els.detailBody.innerHTML = "";
    return;
  }

  els.detailName.textContent = recipe.name;
  els.detailSummary.textContent = `${recipe.base} / ${recipe.ingredients.length}点 / 一致 ${recipeCoverage(recipe)}`;
  els.detailBody.innerHTML = `
    <section class="detail-section">
      <h4>基本</h4>
      <ul>
        <li>グラス: ${recipe.glass || "未記載"}</li>
        <li>作り方: ${recipe.method}</li>
      </ul>
    </section>
    <section class="detail-section">
      <h4>材料</h4>
      <ul>
        ${recipe.ingredients.map((item) => `<li>${ingredientLine(item)}</li>`).join("")}
      </ul>
    </section>
    <section class="detail-section">
      <h4>注記</h4>
      ${
        recipe.notes.length
          ? `<ul>${recipe.notes.map((item) => `<li>${item}</li>`).join("")}</ul>`
          : `<p class="small">注記はありません。</p>`
      }
    </section>
    <section class="detail-section">
      <h4>出典</h4>
      <div class="badge-row">${formatSourceChips(recipe)}</div>
    </section>
  `;
}

function renderNotes() {
  els.notesGrid.innerHTML = "";
  NOTE_PAGES.forEach((page) => {
    const card = document.createElement("article");
    card.className = "note-card";
    const badgeClass =
      page.kind === "stockout"
        ? "badge badge--red"
        : page.kind === "partial"
          ? "badge badge--amber"
          : "badge badge--green";

    if (page.columns) {
      card.innerHTML = `
        <h3>${page.title}</h3>
        <div class="badge-row"><span class="${badgeClass}">${page.kind === "stockout" ? "品切れ表" : "断片"}</span></div>
        <div class="columns">
          <div>
            <p class="mini-title">左列</p>
            <ul>${page.columns[0].map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div>
            <p class="mini-title">右列</p>
            <ul>${page.columns[1].map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <h3>${page.title}</h3>
        <div class="badge-row"><span class="${badgeClass}">${page.kind === "fragment" ? "切れ端" : "見切れ"}</span></div>
        <ul>${page.lines.map((item) => `<li>${item}</li>`).join("")}</ul>
      `;
    }
    els.notesGrid.appendChild(card);
  });
}

function renderTabs() {
  els.tabs.forEach((tab) => {
    const active = tab.dataset.tab === state.tab;
    tab.setAttribute("aria-selected", String(active));
  });
  els.practicePanel.classList.toggle("is-active", state.tab === "practice");
  els.libraryPanel.classList.toggle("is-active", state.tab === "library");
}

function renderSelects() {
  renderBaseFilter();
  renderSourceFilter();
  renderScopeFilters();
}

function renderAll() {
  renderTabs();
  renderStats();
  renderLearningPanels();
  renderPracticeSourceFilters();
  renderPractice();
  renderSelects();
  renderRecipeList();
  renderRecipeDetail(recipeById.get(state.currentRecipeId) || ensureCurrentRecipe());
  renderNotes();
  syncControlsFromState();
  els.showAnswer.textContent = state.showAnswer ? "答えを隠す" : "答えを表示";
}

function syncControlsFromState() {
  els.searchInput.value = state.search;
  els.baseFilter.value = state.baseFilter;
  els.sourceFilter.value = state.sourceFilter;
}

function findBestDefaultRecipe() {
  const deck = activePracticeDeck();
  const existing = deck.find((recipe) => recipe.id === state.currentRecipeId);
  if (existing) return existing;
  return chooseWeightedRecipe(deck) || allRecipes[0] || null;
}

function setTab(tab) {
  state.tab = tab;
  persistState();
  renderTabs();
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setTab(tab.dataset.tab);
    });
  });

  els.nextOrder.addEventListener("click", () => {
    pickNextRecipe();
  });

  els.showAnswer.addEventListener("click", () => {
    state.showAnswer = !state.showAnswer;
    persistState();
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    renderScorebox(recipe, null);
    els.showAnswer.textContent = state.showAnswer ? "答えを隠す" : "答えを表示";
  });

  els.resetAnswer.addEventListener("click", () => {
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (!recipe) return;
    delete state.drafts[recipe.id];
    persistState();
    renderAnswerFields(recipe);
    renderScorebox(recipe, null);
  });

  els.addRow.addEventListener("click", () => {
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (!recipe) return;
    addIngredientRow(recipe);
  });

  els.answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (!recipe) return;
    const draft = readDraftFromDOM();
    saveDraft(recipe, draft);
    const result = gradeAttempt(recipe, draft);
    updateStats(recipe, result);
    state.showAnswer = true;
    persistState();
    renderAll();
    renderScorebox(recipe, result);
    els.showAnswer.textContent = "答えを隠す";
  });

  els.markMastered.addEventListener("click", () => {
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (!recipe) return;
    toggleMastered(recipe);
  });

  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value;
    persistState();
    renderRecipeList();
  });

  els.baseFilter.addEventListener("change", () => {
    state.baseFilter = els.baseFilter.value;
    persistState();
    renderRecipeList();
  });

  els.sourceFilter.addEventListener("change", () => {
    state.sourceFilter = els.sourceFilter.value;
    persistState();
    renderRecipeList();
  });

  els.answerGlass.addEventListener("change", () => {
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (recipe) saveCurrentDraft(recipe);
  });

  els.answerMethod.addEventListener("change", () => {
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (recipe) saveCurrentDraft(recipe);
  });

  els.answerNotes.addEventListener("input", () => {
    const recipe = recipeById.get(state.currentRecipeId) || ensureCurrentRecipe();
    if (recipe) saveCurrentDraft(recipe);
  });
}

function init() {
  els.heroArt.src = createHeroArt();

  if (!recipeById.has(state.currentRecipeId)) {
    const defaultRecipe = findBestDefaultRecipe();
    state.currentRecipeId = defaultRecipe ? defaultRecipe.id : "";
  }

  if (!state.currentRecipeId && allRecipes.length) {
    state.currentRecipeId = allRecipes[0].id;
  }

  renderAll();
  bindEvents();
  els.showAnswer.textContent = state.showAnswer ? "答えを隠す" : "答えを表示";
}

init();
