import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const sourcePath = path.join(root, "app.js");
const outputPath = path.join(root, "data", "catalog.json");

function extractArraySource(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Missing marker: ${marker}`);
  }

  const openIndex = source.indexOf("[", markerIndex);
  if (openIndex === -1) {
    throw new Error(`Missing opening bracket for ${marker}`);
  }

  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (inSingle) {
      if (char === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      if (char === '"') inDouble = false;
      continue;
    }

    if (inTemplate) {
      if (char === "`") inTemplate = false;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      continue;
    }

    if (char === "`") {
      inTemplate = true;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, index + 1);
      }
    }
  }

  throw new Error(`Unterminated array for ${marker}`);
}

function runSource(source) {
  const context = {
    __recipes: null,
    __notePages: null,
  };
  vm.createContext(context);

  const bootstrap = `
    const sourceFullLabel = {
      main: "メインのレシピノート",
      menu: "カクテルメニュー",
      fragment: "切れ端メモ",
    };

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

    globalThis.__recipes = ${extractArraySource(source, "const RECIPES =")};
    globalThis.__notePages = ${extractArraySource(source, "const NOTE_PAGES =")};
  `;

  vm.runInContext(bootstrap, context, { timeout: 2000 });

  return {
    recipes: context.__recipes,
    notePages: context.__notePages,
  };
}

function placeholderForGlass(glass) {
  const map = {
    "ロンググラス": "/placeholders/long-glass.svg",
    "ワイングラス": "/placeholders/wine-glass.svg",
    "マグカップ": "/placeholders/mug.svg",
    "小さいロックグラス": "/placeholders/rocks-glass.svg",
    "ショートグラス": "/placeholders/short-glass.svg",
    "スノースタイルショートグラス": "/placeholders/snow-glass.svg",
    "グラス": "/placeholders/tumbler.svg",
    default: "/placeholders/generic.svg",
  };

  return map[glass] || map.default;
}

function foldText(text) {
  return String(text || "")
    .normalize("NFKC")
    .trim()
    .replace(/[　\s]+/g, "")
    .replace(/[‐‑‒–—―〜~・･／/、。:：\[\]【】()（）「」『』"'`]/g, "")
    .toLowerCase();
}

function normalizeBase(text) {
  return String(text || "").normalize("NFKC").replace(/\s+/g, "").trim();
}

function normalizeName(text) {
  const aliases = {
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

  return aliases[foldText(text)] || String(text || "").normalize("NFKC").trim();
}

function normalizeMethod(text) {
  const value = foldText(text);
  if (value === "シェイク") return "シェイク";
  if (value === "ステア") return "ステア";
  if (value === "フロート") return "フロート";
  if (value === "クラッシュ") return "クラッシュ";
  if (value === "ロック") return "ロック";
  return "ビルド";
}

function hasIngredient(recipe, names) {
  const normalized = new Set(recipe.ingredients.map((item) => normalizeName(item.name)));
  return names.some((name) => normalized.has(name));
}

function buildCharacteristics(recipe) {
  const characteristics = [];
  const baseTraits = {
    "ジンベース": "キレがあって爽やか",
    "ウォッカベース": "クセが少なくすっきり",
    "ラムベース": "甘い香りとコクがある",
    "ウイスキーベース": "香ばしくコクがある",
    "テキーラベース": "パンチがあって個性が強い",
    "ワインベース": "軽やかでフルーティー",
    "リキュールベース等": "甘めで飲みやすい",
  };

  characteristics.push(baseTraits[normalizeBase(recipe.base)] || "飲みやすい");

  if (hasIngredient(recipe, ["トニック"])) {
    characteristics.push("ほろ苦く後味が軽い");
  }
  if (hasIngredient(recipe, ["ソーダ"])) {
    characteristics.push("炭酸で軽い飲み口");
  }
  if (hasIngredient(recipe, ["コーラ"])) {
    characteristics.push("甘みとコクが出る");
  }
  if (hasIngredient(recipe, ["オレンジジュース"])) {
    characteristics.push("果実味が強い");
  }
  if (hasIngredient(recipe, ["グレフルジュース", "ホワイトグレフル"])) {
    characteristics.push("ほろ苦くさっぱり");
  }
  if (hasIngredient(recipe, ["ミルク", "カルーア"])) {
    characteristics.push("まろやかでデザート感がある");
  }
  if (hasIngredient(recipe, ["レモン果汁", "ライム", "レモン", "レモンスライス"])) {
    characteristics.push("酸味が立って締まる");
  }
  if (hasIngredient(recipe, ["グレナデンシロップ"])) {
    characteristics.push("甘酸っぱく華やか");
  }
  if (hasIngredient(recipe, ["カンパリ"])) {
    characteristics.push("ほろ苦さがはっきりする");
  }
  if (hasIngredient(recipe, ["ブルーキュラソー"])) {
    characteristics.push("見た目が鮮やか");
  }
  if (hasIngredient(recipe, ["コーヒー(アイス)"])) {
    characteristics.push("コーヒーの香りが出る");
  }
  if (normalizeMethod(recipe.method) === "シェイク") {
    characteristics.push("口当たりがなめらか");
  }
  if (normalizeMethod(recipe.method) === "フロート") {
    characteristics.push("色の層がきれい");
  }
  if (normalizeMethod(recipe.method) === "クラッシュ") {
    characteristics.push("冷たくシャリっとする");
  }
  if (normalizeMethod(recipe.method) === "ロック") {
    characteristics.push("冷たく濃い印象");
  }

  return [...new Set(characteristics)].slice(0, 3);
}

function buildCatalog(source) {
  const parsed = runSource(source);

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    recipes: parsed.recipes.map((recipe) => ({
      ...recipe,
      characteristics: buildCharacteristics(recipe),
      image: {
        kind: "placeholder",
        assetName: recipe.id,
        alt: `${recipe.name} の画像スロット`,
        placeholderSrc: placeholderForGlass(recipe.glass),
      },
    })),
    notePages: parsed.notePages,
  };
}

const source = fs.readFileSync(sourcePath, "utf8");
const catalog = buildCatalog(source);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`Wrote ${path.relative(root, outputPath)} (${catalog.recipes.length} recipes).`);
