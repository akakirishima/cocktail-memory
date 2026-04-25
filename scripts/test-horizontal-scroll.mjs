import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000/";
const VIEWPORT = { width: 390, height: 700 };
const STORAGE_KEY = "cocktail-memory-v2";
const BASE_QUIZ_TIMEOUT_MS = 16_200;
const AUTO_ADVANCE_WAIT_MS = 1_400;

const catalog = JSON.parse(
  readFileSync(new URL("../data/catalog.json", import.meta.url), "utf8")
);
const recipeByName = new Map(catalog.recipes.map((recipe) => [recipe.name, recipe]));

async function ensureServerIsReachable(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Test target ${url} is not reachable. Start the app first (e.g. npm run dev) and retry.`,
      { cause: error }
    );
  }
}

async function rowMetrics(locator) {
  return locator.evaluate((row) => ({
    className: row.className,
    clientWidth: row.clientWidth,
    scrollWidth: row.scrollWidth,
    before: row.scrollLeft,
    after: (() => {
      row.scrollTo({ left: 180, behavior: "auto" });
      return row.scrollLeft;
    })(),
  }));
}

async function filledSlotCount(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll(".mix-slot__body strong")).filter((node) => {
      const text = node.textContent?.trim();
      return text && text !== "材料を入れる";
    }).length
  );
}

async function ensureChipState(page, label, shouldBeOn) {
  const chip = page.getByRole("button", { name: label });
  const current = (await chip.getAttribute("aria-pressed")) === "true";
  if (current !== shouldBeOn) {
    await chip.click();
  }
}

async function readPersistedState(page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

async function readReadyBaseQuizQuestionName(page) {
  await page.waitForFunction(() => {
    const title = document.querySelector(".base-quiz__header h2")?.textContent?.trim() || "";
    return !!title && title !== "問題を準備中";
  });
  return (await page.locator(".base-quiz__header h2").textContent() || "").trim();
}

async function runHorizontalScrollChecks(page) {
  await page.locator(".ingredient-bench").waitFor({ state: "visible" });

  const spiritsRow = page
    .locator(".ingredient-bench__group")
    .filter({ has: page.locator(".mini-title", { hasText: "スピリッツ" }) })
    .locator(".ingredient-bench__row")
    .first();

  const liqueurRow = page
    .locator(".ingredient-bench__group")
    .filter({ has: page.locator(".mini-title", { hasText: "リキュール" }) })
    .locator(".ingredient-bench__row")
    .first();

  const otherRow = page
    .locator(".ingredient-bench__group")
    .filter({ has: page.locator(".mini-title", { hasText: "その他" }) })
    .locator(".ingredient-bench__row")
    .first();

  const fruitRow = page
    .locator(".ingredient-bench__group")
    .filter({ has: page.locator(".mini-title", { hasText: "フルーツ" }) })
    .locator(".ingredient-bench__row")
    .first();

  const glassRow = page.locator(".glass-strip__scroller").first();

  const spirits = await rowMetrics(spiritsRow);
  const liqueur = await rowMetrics(liqueurRow);
  const other = await rowMetrics(otherRow);
  const fruit = await rowMetrics(fruitRow);
  const glass = await rowMetrics(glassRow);

  assert.match(spirits.className, /ingredient-bench__scroller/);
  assert.match(liqueur.className, /ingredient-bench__scroller/);
  assert.match(other.className, /ingredient-bench__scroller/);
  assert.match(fruit.className, /ingredient-bench__scroller/);
  assert.ok(spirits.scrollWidth > spirits.clientWidth, "スピリッツ: 横スクロール幅が不足");
  assert.ok(liqueur.scrollWidth > liqueur.clientWidth, "リキュール: 横スクロール幅が不足");
  assert.ok(other.scrollWidth > other.clientWidth, "その他: 横スクロール幅が不足");
  assert.ok(fruit.scrollWidth > fruit.clientWidth, "フルーツ: 横スクロール幅が不足");
  assert.ok(glass.scrollWidth > glass.clientWidth, "グラス: 横スクロール幅が不足");
  assert.ok(spirits.after > spirits.before, "スピリッツ: スクロール位置が変化しない");
  assert.ok(liqueur.after > liqueur.before, "リキュール: スクロール位置が変化しない");
  assert.ok(other.after > other.before, "その他: スクロール位置が変化しない");
  assert.ok(fruit.after > fruit.before, "フルーツ: スクロール位置が変化しない");
  assert.ok(glass.after > glass.before, "グラス: スクロール位置が変化しない");

  const baseFilter = page.locator(".chip-row--base-filter").first();
  await baseFilter.getByRole("button", { name: "ウォッカ" }).click();
  await page.waitForFunction(() =>
    document.querySelector(".challenge-card__copy .surface__summary")?.textContent?.includes("ウォッカベース")
  );
  assert.equal(
    await baseFilter.getByRole("button", { name: "ウォッカ" }).getAttribute("aria-pressed"),
    "true",
    "練習ベースフィルタが選択状態になっていない"
  );
  await baseFilter.getByRole("button", { name: "全部" }).click();

  const firstSpiritsCard = spiritsRow.locator(".pour-card").first();
  const pickedLabel = (await firstSpiritsCard.locator(".choice-card__label").textContent() || "").trim();
  assert.ok(pickedLabel.length > 0, "スピリッツカードのラベル取得に失敗");
  await firstSpiritsCard.click();
  assert.match(
    (await firstSpiritsCard.getAttribute("class")) || "",
    /is-active/,
    "選択中の材料カードがアクティブ表示になっていない"
  );

  const firstSlotLabel = (await page.locator(".mix-slot__body strong").first().textContent() || "").trim();
  assert.equal(firstSlotLabel, pickedLabel, "タップ投入が期待どおり反映されていない");
  assert.equal(
    await page.locator(".mix-slot__quantities").count(),
    0,
    "テーブル行内に数量チップが残っている"
  );

  const quantityDock = page.locator(".ingredient-bench__quantity-dock").first();
  await quantityDock.waitFor({ state: "visible" });
  await quantityDock.getByRole("button", { name: "40ml" }).click();
  const firstSlotQuantity = (await page.locator(".mix-slot__body span").first().textContent() || "").trim();
  assert.equal(firstSlotQuantity, "40ml", "材料エリア側の数量選択がテーブル行へ反映されていない");
  assert.equal(
    await page.locator(".ingredient-bench__quantity-dock").count(),
    0,
    "数量選択後に材料エリア側の数量ドックが閉じていない"
  );
  await page.locator(".mix-slot__surface").first().click();
  await quantityDock.waitFor({ state: "visible" });
  assert.equal(
    await quantityDock.getByRole("button", { name: "40ml" }).getAttribute("aria-pressed"),
    "true",
    "テーブル行を押したときに材料エリア側で現在の量が選択状態になっていない"
  );
  await firstSpiritsCard.click();
  const clearedSlotLabel = (await page.locator(".mix-slot__body strong").first().textContent() || "").trim();
  assert.equal(clearedSlotLabel, "材料を入れる", "選択中材料の再クリックで行が空になっていない");
  assert.equal(
    await page.locator(".ingredient-bench__quantity-dock").count(),
    0,
    "選択解除後に数量ドックが閉じていない"
  );
  assert.doesNotMatch(
    (await firstSpiritsCard.getAttribute("class")) || "",
    /is-active/,
    "選択解除後も材料カードがアクティブ表示のまま"
  );

  await firstSpiritsCard.click();
  await quantityDock.waitFor({ state: "visible" });
  await quantityDock.getByRole("button", { name: "40ml" }).click();

  const filledBefore = await filledSlotCount(page);
  await spiritsRow.evaluate((row) => row.scrollTo({ left: 320, behavior: "auto" }));
  const filledAfter = await filledSlotCount(page);
  assert.equal(filledAfter, filledBefore, "スクロール操作で材料数が変化した");

  const yBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(120);
  const yAfter = await page.evaluate(() => window.scrollY);
  assert.ok(yAfter >= yBefore, "縦スクロールが阻害されている");

  return {
    spirits: { clientWidth: spirits.clientWidth, scrollWidth: spirits.scrollWidth },
    liqueur: { clientWidth: liqueur.clientWidth, scrollWidth: liqueur.scrollWidth },
    other: { clientWidth: other.clientWidth, scrollWidth: other.scrollWidth },
    fruit: { clientWidth: fruit.clientWidth, scrollWidth: fruit.scrollWidth },
    glass: { clientWidth: glass.clientWidth, scrollWidth: glass.scrollWidth },
  };
}

async function runBaseQuizChecks(page) {
  const persistedBefore = await readPersistedState(page);
  const practiceAttemptsBefore = persistedBefore?.stats?.attempts || 0;

  await page.getByRole("button", { name: "種類当て" }).click();
  await page.locator(".base-quiz").waitFor({ state: "visible" });

  const firstQuestionName = await readReadyBaseQuizQuestionName(page);
  const firstRecipe = recipeByName.get(firstQuestionName);
  assert.ok(firstRecipe, `種類当て: レシピを特定できません (${firstQuestionName})`);

  const firstChoices = await page.locator(".base-quiz__choice").allInnerTexts();
  assert.equal(firstChoices.length, 4, "種類当て: 4択になっていない");
  assert.equal(new Set(firstChoices).size, 4, "種類当て: 選択肢が重複している");
  assert.ok(firstChoices.includes(firstRecipe.base), "種類当て: 正解baseが選択肢に含まれていない");

  await page.locator(".base-quiz__choice", { hasText: firstRecipe.base }).click();
  await page.waitForTimeout(AUTO_ADVANCE_WAIT_MS);

  const secondQuestionName = await readReadyBaseQuizQuestionName(page);
  assert.notEqual(
    secondQuestionName,
    firstQuestionName,
    "種類当て: 正解時に自動で次問へ進んでいない"
  );

  const secondRecipe = recipeByName.get(secondQuestionName);
  assert.ok(secondRecipe, `種類当て: レシピを特定できません (${secondQuestionName})`);
  const secondChoices = await page.locator(".base-quiz__choice").allInnerTexts();
  const wrongChoice = secondChoices.find((choice) => choice !== secondRecipe.base);
  assert.ok(wrongChoice, "種類当て: 誤答候補が見つからない");

  await page.locator(".base-quiz__choice", { hasText: wrongChoice }).click();
  await page.waitForTimeout(AUTO_ADVANCE_WAIT_MS);
  const afterWrongName = await readReadyBaseQuizQuestionName(page);
  assert.equal(
    afterWrongName,
    secondQuestionName,
    "種類当て: 誤答時に自動遷移してしまっている"
  );
  assert.match(
    (await page.locator(".base-quiz__status").textContent()) || "",
    /不正解/,
    "種類当て: 誤答ステータスが表示されない"
  );
  await page.getByRole("button", { name: "次の問題" }).click();

  const thirdQuestionName = await readReadyBaseQuizQuestionName(page);
  assert.notEqual(
    thirdQuestionName,
    secondQuestionName,
    "種類当て: 手動次問遷移が動作していない"
  );

  await page.waitForTimeout(BASE_QUIZ_TIMEOUT_MS);
  assert.match(
    (await page.locator(".base-quiz__status").textContent()) || "",
    /時間切れ/,
    "種類当て: タイムアップ表示が出ない"
  );
  await page.getByRole("button", { name: "次の問題" }).click();

  await ensureChipState(page, "メイン", false);
  await ensureChipState(page, "メニュー", false);
  await ensureChipState(page, "切れ端", true);
  await page.getByRole("button", { name: "次の問題" }).click();

  const fragmentQuestionName = await readReadyBaseQuizQuestionName(page);
  const fragmentRecipe = recipeByName.get(fragmentQuestionName);
  assert.ok(fragmentRecipe, `種類当て: レシピを特定できません (${fragmentQuestionName})`);
  const hasFragmentSource = fragmentRecipe.sources.some((source) => source.type === "fragment");
  assert.ok(
    hasFragmentSource,
    "種類当て: 出題範囲（切れ端のみ）の連動に失敗している"
  );

  const persistedAfter = await readPersistedState(page);
  assert.equal(
    persistedAfter?.stats?.attempts || 0,
    practiceAttemptsBefore,
    "種類当て: 既存練習統計(stats.attempts)が汚染されている"
  );
  assert.ok((persistedAfter?.baseQuiz?.attempts || 0) >= 3, "種類当て: 専用統計が更新されていない");
}

async function run() {
  await ensureServerIsReachable(BASE_URL);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    const horizontalMetrics = await runHorizontalScrollChecks(page);
    await runBaseQuizChecks(page);

    console.log("UI regression tests passed.");
    console.log(
      JSON.stringify(
        {
          horizontal: horizontalMetrics,
        },
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error("UI regression tests failed.");
  if (error instanceof Error && error.cause instanceof Error) {
    console.error(error.message);
    console.error(`cause: ${error.cause.message}`);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
