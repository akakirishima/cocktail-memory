import ingredientImageAssets from "@/data/ingredient-image-assets.json";

export type VisualAsset = {
  label: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  fallbackImage: string;
};

type IngredientImageAsset = {
  label: string;
  keys: string[];
  fileName: string;
  sourceUrl: string;
  credit: string;
  downloadUrl?: string;
  localOnly?: boolean;
};

function commonsFilePath(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURI(fileName)}`;
}

function commonsFilePage(fileName: string) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURI(fileName).replace(/%20/g, "_")}`;
}

function makeCommonsVisual(
  label: string,
  fileName: string,
  credit: string,
  fallbackImage: string
): VisualAsset {
  return {
    label,
    imageUrl: commonsFilePath(fileName),
    sourceUrl: commonsFilePage(fileName),
    credit,
    fallbackImage,
  };
}

function makeLocalVisual(label: string, fallbackImage: string) {
  return {
    label,
    imageUrl: fallbackImage,
    sourceUrl: fallbackImage,
    credit: "Local fallback",
    fallbackImage,
  } satisfies VisualAsset;
}

function makePackshotVisual(asset: IngredientImageAsset): VisualAsset {
  return {
    label: asset.label,
    imageUrl: `/ingredients/${asset.fileName}`,
    sourceUrl: asset.sourceUrl,
    credit: asset.credit,
    fallbackImage: "/placeholders/generic.svg",
  };
}

const packshotIngredientVisuals = Object.fromEntries(
  (ingredientImageAssets as IngredientImageAsset[]).flatMap((asset) => {
    const visual = makePackshotVisual(asset);
    return Array.from(new Set([asset.label, ...asset.keys])).map((key) => [key, visual] as const);
  })
) as Record<string, VisualAsset>;

export const glassVisuals: Record<string, VisualAsset> = {
  "ロンググラス": makeLocalVisual("ロンググラス", "/placeholders/long-glass.svg"),
  "小さいロックグラス": makeLocalVisual("小さいロックグラス", "/placeholders/rocks-glass.svg"),
  "スノースタイルショートグラス": makeLocalVisual(
    "スノースタイルショートグラス",
    "/placeholders/snow-glass.svg"
  ),
  "ショートグラス": makeLocalVisual("ショートグラス", "/placeholders/short-glass.svg"),
  "ワイングラス": makeLocalVisual("ワイングラス", "/placeholders/wine-glass.svg"),
  "マグカップ": makeLocalVisual("マグカップ", "/placeholders/mug.svg"),
  "グラス": makeLocalVisual("グラス", "/placeholders/tumbler.svg"),
  default: makeLocalVisual("グラス", "/placeholders/generic.svg"),
};

const genericIngredientVisuals: Record<string, VisualAsset> = {
  ウォッカ: makeCommonsVisual(
    "ウォッカ",
    "Vodka bottle.jpg",
    "Tetzemann / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ジン: makeCommonsVisual(
    "ジン",
    "Bottle, gin (51369547579).jpg",
    "Auckland Museum Collections / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ラム: makeCommonsVisual(
    "ラム",
    "Old Rum bottles, 2014.jpg",
    "Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  テキーラ: makeCommonsVisual(
    "テキーラ",
    "Tequila Bottles.png",
    "Photomag / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ウイスキー: makeCommonsVisual(
    "ウイスキー",
    "Kasser's 51 Whiskey Bottle.jpg",
    "Unknown / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  カンパリ: makeCommonsVisual(
    "カンパリ",
    "Bottle of Campari (United States).jpg",
    "Kenneth C. Zirkel / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  カシス: makeCommonsVisual(
    "カシス",
    "Creme de Cassis.jpg",
    "NEON ja / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  カルーア: makeCommonsVisual(
    "カルーア",
    "Kahlúa 700ml imported glass bottle.jpg",
    "Ikokujin / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  コアントロー: makeCommonsVisual(
    "コアントロー",
    "Cointreau Orange Liqueur 01.jpg",
    "Indrajit Das / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ディタ: makeCommonsVisual(
    "ディタ",
    "Bottle of Lychee Wine.jpg",
    "FotoosVanRobin / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ブルーキュラソー: makeCommonsVisual(
    "ブルーキュラソー",
    "Blue Curaçao Bottle.jpg",
    "Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ホワイトキュラソー: makeCommonsVisual(
    "ホワイトキュラソー",
    "Curaçao Triple Sec Bottles.jpg",
    "Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  プルシア: makeCommonsVisual(
    "プルシア",
    "De Kuyper Apricot Brandy 01.jpg",
    "Indrajit Das / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  パッソア: makeCommonsVisual(
    "パッソア",
    "Passoã bottle.jpg",
    "Passoã / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ピーチツリー: makeCommonsVisual(
    "ピーチツリー",
    "Bottle, schnapps (AM 67602-2).jpg",
    "Auckland Museum / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  赤ワイン: makeCommonsVisual(
    "赤ワイン",
    "Wine Bottles.jpg",
    "Kurt Nordstrom / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  ワイン: makeCommonsVisual(
    "ワイン",
    "Wine bottle (143649986).jpg",
    "istolethetv / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
  グレナデンシロップ: makeCommonsVisual(
    "グレナデンシロップ",
    "Grenadinesyrup.jpg",
    "Badagnani / Wikimedia Commons",
    "/placeholders/generic.svg"
  ),
};

export const ingredientVisuals: Record<string, VisualAsset> = {
  ...genericIngredientVisuals,
  ...packshotIngredientVisuals,
};

export const methodVisuals: Record<string, VisualAsset> = {
  ビルド: makeLocalVisual("ビルド", "/placeholders/generic.svg"),
  シェイク: makeLocalVisual("シェイク", "/placeholders/generic.svg"),
  ステア: makeLocalVisual("ステア", "/placeholders/generic.svg"),
  フロート: makeLocalVisual("フロート", "/placeholders/generic.svg"),
  クラッシュ: makeLocalVisual("クラッシュ", "/placeholders/generic.svg"),
  ロック: makeLocalVisual("ロック", "/placeholders/generic.svg"),
};

export function visualForGlass(label: string) {
  return glassVisuals[label] || glassVisuals.default;
}

export function visualForIngredient(label: string) {
  return ingredientVisuals[label] || null;
}

export function visualForMethod(label: string) {
  return methodVisuals[label] || makeLocalVisual(label, "/placeholders/generic.svg");
}
