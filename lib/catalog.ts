import rawCatalog from "@/data/catalog.json";
import {
  type VisualAsset,
  visualForGlass,
  visualForIngredient,
  visualForMethod,
} from "@/lib/visuals";

export type SourceType = "main" | "menu" | "fragment";

export type RecipeSource = {
  type: SourceType;
  label: string;
};

export type ImageSlot = {
  kind: "placeholder" | "asset";
  assetName: string;
  alt: string;
  placeholderSrc: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  fallbackImage: string;
  src?: string;
};

export type IngredientLine = {
  name: string;
  amount: string;
};

export type Recipe = {
  id: string;
  name: string;
  base: string;
  glass: string;
  method: string;
  ingredients: IngredientLine[];
  notes: string[];
  characteristics: string[];
  sources: RecipeSource[];
  practice: boolean;
  image: ImageSlot;
  searchText: string;
};

export type NotePage =
  | {
      title: string;
      kind: "fragment" | "partial";
      lines: string[];
    }
  | {
      title: string;
      kind: "stockout";
      columns: [string[], string[]];
    };

type RawCatalog = {
  schemaVersion: number;
  generatedAt: string;
  recipes: Omit<Recipe, "searchText">[];
  notePages: NotePage[];
};

export type Choice<T extends string = string> = {
  id: T;
  label: string;
};

export type IngredientChoice = Choice & {
  group: string;
  display: "card" | "chip";
  visual: VisualAsset | null;
};

export type GroupedIngredientChoices = {
  group: string;
  choices: IngredientChoice[];
};

export type GlassChoice = Choice & {
  visual: VisualAsset;
};

export type MethodChoice = Choice & {
  visual: VisualAsset;
};

type RawRecipe = RawCatalog["recipes"][number];

const sourceLabels: Record<SourceType, string> = {
  main: "メイン",
  menu: "メニュー",
  fragment: "切れ端",
};

const sourceOptionList: Choice<SourceType | "all">[] = [
  { id: "all", label: "すべて" },
  { id: "main", label: "メイン" },
  { id: "menu", label: "メニュー" },
  { id: "fragment", label: "切れ端" },
];

const practiceSourceOptionList: Choice<SourceType>[] = [
  { id: "main", label: "メイン" },
  { id: "menu", label: "メニュー" },
  { id: "fragment", label: "切れ端" },
];

const scopeOptionList: Choice<"all" | "mastered" | "unmastered">[] = [
  { id: "all", label: "すべて" },
  { id: "mastered", label: "習得済" },
  { id: "unmastered", label: "未習得" },
];

const methodOrder = ["ビルド", "シェイク", "ステア", "フロート", "クラッシュ", "ロック"];

const glassOrder = [
  "ロンググラス",
  "小さいロックグラス",
  "スノースタイルショートグラス",
  "ショートグラス",
  "ワイングラス",
  "マグカップ",
  "グラス",
];

const ingredientAliases: Record<string, string> = {
  レモン汁: "レモン果汁",
  レモンジュース: "レモン果汁",
  グレフル: "グレフルジュース",
  グレープフルーツ: "グレフルジュース",
  グレープフルーツジュース: "グレフルジュース",
  グレフルj: "グレフルジュース",
  グレフルjuce: "グレフルジュース",
  ホワイトグレープフルーツ: "ホワイトグレフル",
  ホワイトグレープフルーツジュース: "ホワイトグレフル",
  トニックウォーター: "トニック",
  カシスリキュール: "カシス",
  ピーチ: "ピーチツリー",
  ワイン赤: "赤ワイン",
  ワイン赤色: "赤ワイン",
  ワイン赤ワイン: "赤ワイン",
  赤ワイン: "赤ワイン",
  コーヒーアイス: "コーヒー(アイス)",
  コーヒー冷: "コーヒー(冷)",
  コーヒー温: "コーヒー(温)",
  ティ冷: "ティ(冷)",
  アール温: "アール(温)",
  ジャス冷: "ジャス(冷)",
  ジンジャーエ: "ジンジャーエール",
  ジンジャーエー: "ジンジャーエール",
  パッション: "パッソア",
};

const ingredientGroupOrder = [
  "スピリッツ",
  "リキュール",
  "ワイン",
  "その他",
  "フルーツ",
];

const spiritSet = new Set(["ウォッカ", "ジン", "ラム", "テキーラ", "ウイスキー"]);
const liqueurSet = new Set([
  "カンパリ",
  "カシス",
  "カルーア",
  "ディタ",
  "コアントロー",
  "プルシア",
  "ピーチツリー",
  "パッソア",
  "ホワイトキュラソー",
  "ブルーキュラソー",
]);
const mixerSet = new Set([
  "ソーダ",
  "トニック",
  "ジンジャーエール",
  "コーラ",
  "オレンジジュース",
  "グレフルジュース",
  "ホワイトグレフル",
  "ウーロン",
  "ミルク",
  "コーヒー(アイス)",
  "水",
]);
const fruitSet = new Set([
  "レモン果汁",
  "ライム",
  "レモン",
  "レモンスライス",
  "砂糖",
  "塩",
  "グレナデンシロップ",
]);
const wineSet = new Set(["赤ワイン", "ワイン"]);

function normalizeLookup(text: string) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[　\s]+/g, "")
    .replace(/[‐‑‒–—―〜~・･／/、。:：\[\]【】()（）「」『』"'`]/g, "")
    .toLowerCase();
}

function cleanText(text: string) {
  return String(text || "").normalize("NFKC").replace(/[　\s]+/g, "").trim();
}

function normalizeAmountLookup(text: string) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[　\s]+/g, "")
    .replace(/[．。]/g, ".")
    .replace(/[‐‑‒–—―−]/g, "-")
    .toLowerCase();
}

export function normalizeIngredientId(text: string) {
  const cleaned = cleanText(text);
  const folded = normalizeLookup(cleaned);
  return ingredientAliases[folded] || cleaned;
}

export function normalizeGlassId(text: string) {
  const cleaned = cleanText(text);
  const folded = normalizeLookup(cleaned);
  if (!folded || folded === "未記載" || folded === "なし") {
    return "";
  }
  return glassOrder.find((value) => normalizeLookup(value) === folded) || cleaned;
}

export function normalizeMethodId(text: string) {
  const cleaned = cleanText(text);
  const folded = normalizeLookup(cleaned);
  if (!folded || folded === "未記載" || folded === "なし") {
    return "";
  }
  return methodOrder.find((value) => normalizeLookup(value) === folded) || cleaned;
}

export function normalizeQuantityId(text: string) {
  const cleaned = cleanText(text);
  const folded = normalizeAmountLookup(cleaned);
  if (!folded || folded === "未選択" || folded === "空欄") {
    return "";
  }
  const map: Record<string, string> = {
    up: "UP",
    "up.": "UP",
    アップ: "UP",
    "30m": "30ml",
    "30ml": "30ml",
    "45m": "45ml",
    "45ml": "45ml",
    "40m": "40ml",
    "40ml": "40ml",
    "20m": "20ml",
    "20ml": "20ml",
    "15m": "15ml",
    "15ml": "15ml",
    "10m": "10ml",
    "10ml": "10ml",
    "60m": "60ml",
    "60ml": "60ml",
    "90m": "90ml",
    "90ml": "90ml",
    "1/8": "1/8コ",
    "1/8コ": "1/8コ",
    "1/8個": "1/8コ",
    "1枚": "1枚",
    "1ケ": "1ケ",
    "1ヶ": "1ケ",
    "1個": "1ケ",
    "1コ": "1ケ",
    "1カット": "1カット",
    "少々": "少々",
    "木のスプーン2杯": "木のスプーン2杯",
    "50/50": "50/50",
    "6割": "6割",
    うかせる: "うかせる",
    "うかせる。": "うかせる",
    浮かせる: "うかせる",
    "浮かせる。": "うかせる",
  };
  return map[folded] || cleaned;
}

function sortByPreferredOrder(values: string[], preferred: string[]) {
  return [...values].sort((left, right) => {
    const leftIndex = preferred.indexOf(left);
    const rightIndex = preferred.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right, "ja");
    }
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

function classifyIngredient(label: string) {
  if (spiritSet.has(label)) return "スピリッツ";
  if (liqueurSet.has(label)) return "リキュール";
  if (wineSet.has(label)) return "ワイン";
  if (mixerSet.has(label)) return "その他";
  if (fruitSet.has(label)) return "フルーツ";
  return "その他";
}

function visualForRecipeGlass(glass: string) {
  return visualForGlass(normalizeGlassId(glass) || glass);
}

function ingredientDisplayMode(group: string): IngredientChoice["display"] {
  return group === "スピリッツ" || group === "リキュール" || group === "ワイン" || group === "その他"
    ? "card"
    : "chip";
}

function buildSearchText(recipe: Omit<Recipe, "searchText">) {
  return [
    recipe.name,
    recipe.base,
    recipe.glass,
    recipe.method,
    recipe.notes.join(" "),
    recipe.characteristics.join(" "),
    recipe.sources.map((source) => source.label).join(" "),
    recipe.ingredients
      .map((item) => `${normalizeIngredientId(item.name)} ${normalizeQuantityId(item.amount)}`.trim())
      .join(" "),
  ]
    .join(" ")
    .normalize("NFKC")
    .replace(/[　\s]+/g, "")
    .toLowerCase();
}

function toGroupedIngredientChoices(recipes: RawRecipe[]) {
  const seen = new Map<string, IngredientChoice>();

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const id = normalizeIngredientId(ingredient.name);
      if (!seen.has(id)) {
        const group = classifyIngredient(id);
        seen.set(id, {
          id,
          label: id,
          group,
          display: ingredientDisplayMode(group),
          visual: visualForIngredient(id),
        });
      }
    }
  }

  const groups = new Map<string, IngredientChoice[]>();
  for (const value of seen.values()) {
    const bucket = groups.get(value.group) || [];
    bucket.push(value);
    groups.set(value.group, bucket);
  }

  return ingredientGroupOrder
    .filter((group) => groups.has(group))
    .map((group) => ({
      group,
      choices: sortByPreferredOrder(
        groups.get(group)!.map((choice) => choice.id),
        []
      ).map((id) => ({
        id,
        label: id,
        group,
        display: ingredientDisplayMode(group),
        visual: visualForIngredient(id),
      })),
    }));
}

function buildQuantityChoices(recipes: RawRecipe[]) {
  const seen = new Set<string>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      seen.add(normalizeQuantityId(ingredient.amount));
    }
  }

  const values = [...seen].filter(Boolean);
  const preferred = ["UP", "少々", "1/8コ", "1枚", "1ケ", "1カット", "6割", "50/50", "木のスプーン2杯", "うかせる"];
  const numeric = values.filter((value) => /^\d+ml$/.test(value)).sort((a, b) => {
    const left = Number.parseInt(a, 10);
    const right = Number.parseInt(b, 10);
    return left - right;
  });
  const nonNumeric = values.filter((value) => !/^\d+ml$/.test(value));
  const ordered = sortByPreferredOrder(nonNumeric, preferred);
  const merged = [...ordered, ...numeric];

  return [{ id: "", label: "未選択" }, ...merged.map((value) => ({ id: value, label: value }))];
}

function buildGlassChoices(recipes: RawRecipe[]) {
  const values = [...new Set(recipes.map((recipe) => normalizeGlassId(recipe.glass)).filter(Boolean))];
  const ordered = sortByPreferredOrder(values, glassOrder);
  return [
    { id: "", label: "未記載", visual: visualForGlass("グラス") },
    ...ordered.map((value) => ({
      id: value,
      label: value,
      visual: visualForGlass(value),
    })),
  ];
}

function buildMethodChoices(recipes: RawRecipe[]) {
  const values = [...new Set([...methodOrder, ...recipes.map((recipe) => normalizeMethodId(recipe.method))].filter(Boolean))];
  const ordered = sortByPreferredOrder(values, methodOrder);
  return [
    { id: "", label: "未記載", visual: visualForMethod("ビルド") },
    ...ordered.map((value) => ({
      id: value,
      label: value,
      visual: visualForMethod(value),
    })),
  ];
}

function buildBaseChoices(recipes: RawRecipe[]) {
  const values = [...new Set(recipes.map((recipe) => recipe.base).filter(Boolean))];
  return [{ id: "all", label: "すべて" }, ...values.map((value) => ({ id: value, label: value }))];
}

function buildRecipeImage(recipe: RawRecipe): ImageSlot {
  const visual = visualForRecipeGlass(recipe.glass);
  return {
    kind: "asset",
    assetName: recipe.id,
    alt: `${recipe.name} の実写画像`,
    placeholderSrc: visual.fallbackImage,
    imageUrl: visual.imageUrl,
    sourceUrl: visual.sourceUrl,
    credit: visual.credit,
    fallbackImage: visual.fallbackImage,
    src: visual.imageUrl,
  };
}

const catalogJson = rawCatalog as RawCatalog;

export const catalog = {
  schemaVersion: catalogJson.schemaVersion,
  generatedAt: catalogJson.generatedAt,
  recipes: catalogJson.recipes.map((recipe) => ({
    ...recipe,
    searchText: buildSearchText(recipe),
    image: buildRecipeImage(recipe),
  })),
  notePages: catalogJson.notePages,
};

export const sourceLabelMap = sourceLabels;
export const sourceOptions = sourceOptionList;
export const practiceSourceOptions = practiceSourceOptionList;
export const scopeOptions = scopeOptionList;
export const baseOptions = buildBaseChoices(catalogJson.recipes);
export const ingredientGroups = toGroupedIngredientChoices(catalogJson.recipes);
export const quantityOptions = buildQuantityChoices(catalogJson.recipes);
export const glassOptions = buildGlassChoices(catalogJson.recipes);
export const methodOptions = buildMethodChoices(catalogJson.recipes);

export const recipeById = new Map(catalog.recipes.map((recipe) => [recipe.id, recipe] as const));
export const ingredientChoiceById = new Map(
  ingredientGroups.flatMap((group) => group.choices).map((choice) => [choice.id, choice] as const)
);
export const glassChoiceById = new Map(glassOptions.map((choice) => [choice.id, choice] as const));
export const methodChoiceById = new Map(methodOptions.map((choice) => [choice.id, choice] as const));

export function formatIngredientLine(ingredient: IngredientLine) {
  const amount = normalizeQuantityId(ingredient.amount);
  return [normalizeIngredientId(ingredient.name), amount].filter(Boolean).join(" ");
}

export function buildRecipeSearchText(recipe: Recipe) {
  return recipe.searchText;
}

export function getBaseLabel(id: string) {
  return id;
}

export function sourceBadgeText(source: RecipeSource) {
  return `${sourceLabelMap[source.type]}${source.label ? ` / ${source.label}` : ""}`;
}
