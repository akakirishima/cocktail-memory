export type VisualAsset = {
  label: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  fallbackImage: string;
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

export const glassVisuals: Record<string, VisualAsset> = {
  "ロンググラス": makeCommonsVisual(
    "ロンググラス",
    "Longdrink glass from company Nachtmann.jpg",
    "Pittigrilli / Wikimedia Commons",
    "/placeholders/long-glass.svg"
  ),
  "小さいロックグラス": makeCommonsVisual(
    "小さいロックグラス",
    "A Glass of Whiskey on the Rocks.jpg",
    "Benjamin Thompson / Wikimedia Commons",
    "/placeholders/rocks-glass.svg"
  ),
  "スノースタイルショートグラス": makeCommonsVisual(
    "スノースタイルショートグラス",
    "Bloody Caesar.jpg",
    "Wikimedia Commons",
    "/placeholders/snow-glass.svg"
  ),
  "ショートグラス": makeCommonsVisual(
    "ショートグラス",
    "Small shotglass.jpg",
    "Kelly Martin / Wikimedia Commons",
    "/placeholders/short-glass.svg"
  ),
  "ワイングラス": makeCommonsVisual(
    "ワイングラス",
    "Wine Glass (6922364426).jpg",
    "The Integer Club / Wikimedia Commons",
    "/placeholders/wine-glass.svg"
  ),
  "マグカップ": makeCommonsVisual(
    "マグカップ",
    "Coffee mugs.jpg",
    "Radhika41 / Wikimedia Commons",
    "/placeholders/mug.svg"
  ),
  "グラス": makeCommonsVisual(
    "グラス",
    "Tumbler, ca. 1770 (CH 18386229).jpg",
    "Cooper Hewitt, Smithsonian Design Museum / Wikimedia Commons",
    "/placeholders/tumbler.svg"
  ),
  default: makeLocalVisual("グラス", "/placeholders/generic.svg"),
};

export const ingredientVisuals: Record<string, VisualAsset> = {
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
