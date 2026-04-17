"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  baseOptions,
  catalog,
  glassChoiceById,
  formatIngredientLine,
  glassOptions,
  ingredientGroups,
  ingredientChoiceById,
  methodChoiceById,
  methodOptions,
  normalizeGlassId,
  normalizeIngredientId,
  normalizeMethodId,
  normalizeQuantityId,
  practiceSourceOptions,
  quantityOptions,
  recipeById,
  scopeOptions,
  sourceBadgeText,
  sourceOptions,
  type GlassChoice,
  type IngredientChoice,
  type MethodChoice,
  type Recipe,
  type SourceType,
} from "@/lib/catalog";
import type { VisualAsset } from "@/lib/visuals";

type TabId = "practice" | "library";
type SourceFilter = "all" | SourceType;
type ScopeFilter = "all" | "mastered" | "unmastered";

type PracticeRow = {
  ingredientId: string;
  quantityId: string;
};

type PracticeDraft = {
  glassId: string;
  methodId: string;
  rows: PracticeRow[];
};

type RecipeStats = {
  attempts: number;
  perfects: number;
  points: number;
  possible: number;
  wrongs: number;
};

type HistoryEntry = {
  recipeId: string;
  name: string;
  points: number;
  possible: number;
  perfect: boolean;
  at: number;
};

type AttemptDetail = {
  label: string;
  expected: string;
  actual: string;
  ok: boolean;
};

type AttemptResult = {
  points: number;
  possible: number;
  perfect: boolean;
  accuracy: number;
  details: AttemptDetail[];
};

type AppState = {
  tab: TabId;
  currentRecipeId: string;
  search: string;
  baseFilter: string;
  sourceFilter: SourceFilter;
  scopeFilter: ScopeFilter;
  practiceSources: Record<SourceType, boolean>;
  drafts: Record<string, PracticeDraft>;
  mastered: Record<string, boolean>;
  stats: {
    attempts: number;
    perfects: number;
    points: number;
    possible: number;
    byRecipe: Record<string, RecipeStats>;
    history: HistoryEntry[];
  };
};

type Feedback = {
  recipeId: string;
  result: AttemptResult;
};

const STORAGE_KEY = "cocktail-memory-v2";
const DATE_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "short",
  timeStyle: "short",
});

function firstIncompleteRowIndex(draft: PracticeDraft) {
  const index = draft.rows.findIndex((row) => !row.ingredientId || !row.quantityId);
  return index === -1 ? Math.max(0, draft.rows.length - 1) : index;
}

function choiceLabel(choiceId: string, choices: Map<string, { label: string }>) {
  return choices.get(choiceId)?.label || (choiceId || "未選択");
}

function ChoiceMedia({
  visual,
  alt,
  className,
  sizes,
  priority,
}: {
  visual: Pick<VisualAsset, "imageUrl" | "fallbackImage">;
  alt: string;
  className: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [visual.imageUrl, visual.fallbackImage]);

  return (
    <Image
      src={failed ? visual.fallbackImage : visual.imageUrl}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function ChoiceCard({
  label,
  visual,
  active,
  onClick,
  className = "",
  ariaLabel,
}: {
  label: string;
  visual: VisualAsset | null;
  active?: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`choice-card ${active ? "is-active" : ""} ${className}`.trim()}
      onClick={onClick}
      aria-pressed={!!active}
      aria-label={ariaLabel || label}
    >
      <div className="choice-card__media">
        {visual ? <ChoiceMedia visual={visual} alt={label} className="choice-card__image" sizes="160px" /> : null}
      </div>
      <span className="choice-card__label">{label}</span>
    </button>
  );
}

function ChoiceChip({
  label,
  active,
  onClick,
  className = "",
  ariaLabel,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      className={`choice-chip ${active ? "is-active" : ""} ${className}`.trim()}
      onClick={onClick}
      aria-pressed={!!active}
      aria-label={ariaLabel || label}
    >
      {label}
    </button>
  );
}

function createDefaultState(): AppState {
  const firstRecipeId = catalog.recipes[0]?.id || "";

  return {
    tab: "practice",
    currentRecipeId: firstRecipeId,
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
    mastered: {},
    stats: {
      attempts: 0,
      perfects: 0,
      points: 0,
      possible: 0,
      byRecipe: {},
      history: [],
    },
  };
}

function createBlankDraft(recipe: Recipe): PracticeDraft {
  return {
    glassId: "",
    methodId: "",
    rows: recipe.ingredients.map(() => ({
      ingredientId: "",
      quantityId: "",
    })),
  };
}

function normalizeDraftForRecipe(recipe: Recipe, draft?: PracticeDraft): PracticeDraft {
  const fallback = createBlankDraft(recipe);
  const rows = recipe.ingredients.map((_, index) => ({
    ingredientId: draft?.rows[index]?.ingredientId ?? "",
    quantityId: draft?.rows[index]?.quantityId ?? "",
  }));

  return {
    glassId: draft?.glassId ?? fallback.glassId,
    methodId: draft?.methodId ?? fallback.methodId,
    rows,
  };
}

function mergePersistedState(raw: Partial<AppState> | null | undefined): AppState {
  const fallback = createDefaultState();
  if (!raw) {
    return fallback;
  }

  return {
    ...fallback,
    ...raw,
    practiceSources: {
      ...fallback.practiceSources,
      ...(raw.practiceSources || {}),
    },
    drafts: raw.drafts || {},
    mastered: raw.mastered || {},
    stats: {
      ...fallback.stats,
      ...(raw.stats || {}),
      byRecipe: raw.stats?.byRecipe || {},
      history: raw.stats?.history || [],
    },
  };
}

function loadState(): AppState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    return mergePersistedState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return createDefaultState();
  }
}

function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures in restricted contexts.
  }
}

function formatQuantityLabel(value: string) {
  return value || "未選択";
}

function formatGlassLabel(value: string) {
  return value || "未記載";
}

function formatMethodLabel(value: string) {
  return value || "未記載";
}

function quantitiesMatch(expected: string, actual: string) {
  const left = normalizeQuantityId(expected);
  const right = normalizeQuantityId(actual);
  if (!left && !right) return true;
  if (!left && right === "UP") return true;
  if (!right && left === "UP") return true;
  return left === right;
}

function gradeAttempt(recipe: Recipe, draft: PracticeDraft): AttemptResult {
  const details: AttemptDetail[] = [];
  let points = 0;
  let possible = 0;

  possible += 1;
  const expectedGlass = normalizeGlassId(recipe.glass);
  const actualGlass = normalizeGlassId(draft.glassId);
  const glassOk = expectedGlass === actualGlass;
  if (glassOk) points += 1;
  details.push({
    label: "グラス",
    expected: formatGlassLabel(expectedGlass),
    actual: formatGlassLabel(actualGlass),
    ok: glassOk,
  });

  possible += 1;
  const expectedMethod = normalizeMethodId(recipe.method);
  const actualMethod = normalizeMethodId(draft.methodId);
  const methodOk = expectedMethod === actualMethod;
  if (methodOk) points += 1;
  details.push({
    label: "作り方",
    expected: formatMethodLabel(expectedMethod),
    actual: formatMethodLabel(actualMethod),
    ok: methodOk,
  });

  recipe.ingredients.forEach((expectedIngredient, index) => {
    const actual = draft.rows[index] || { ingredientId: "", quantityId: "" };
    const expectedName = normalizeIngredientId(expectedIngredient.name);
    const actualName = normalizeIngredientId(actual.ingredientId);
    const expectedQuantity = normalizeQuantityId(expectedIngredient.amount);
    const actualQuantity = normalizeQuantityId(actual.quantityId);
    const nameOk = expectedName === actualName;
    const quantityOk = quantitiesMatch(expectedQuantity, actualQuantity);

    possible += 2;
    if (nameOk) points += 1;
    if (quantityOk) points += 1;

    details.push({
      label: `材料 ${index + 1}`,
      expected: [expectedName, formatQuantityLabel(expectedQuantity)].filter(Boolean).join(" "),
      actual: [actualName || "未選択", formatQuantityLabel(actualQuantity)].filter(Boolean).join(" "),
      ok: nameOk && quantityOk,
    });
  });

  const perfect = points === possible;
  return {
    points,
    possible,
    perfect,
    accuracy: possible ? Math.round((points / possible) * 100) : 0,
    details,
  };
}

function deckWeight(recipe: Recipe, state: AppState) {
  const stats = state.stats.byRecipe[recipe.id] || {
    attempts: 0,
    perfects: 0,
    points: 0,
    possible: 0,
    wrongs: 0,
  };
  let weight = 1 + stats.wrongs * 1.8;
  if (!stats.attempts) {
    weight += 1.1;
  }
  if (state.mastered[recipe.id]) {
    weight *= 0.6;
  }
  return Math.max(0.35, weight);
}

function chooseWeightedRecipe(deck: Recipe[], state: AppState, avoidId = "") {
  if (!deck.length) {
    return null;
  }

  const candidates = deck.length > 1 && avoidId ? deck.filter((recipe) => recipe.id !== avoidId) : deck;
  const pool = candidates.length ? candidates : deck;
  const total = pool.reduce((sum, recipe) => sum + deckWeight(recipe, state), 0);
  let remaining = Math.random() * total;

  for (const recipe of pool) {
    remaining -= deckWeight(recipe, state);
    if (remaining <= 0) {
      return recipe;
    }
  }

  return pool[pool.length - 1] || null;
}

function recipeCoverage(state: AppState, recipeId: string) {
  const stats = state.stats.byRecipe[recipeId];
  if (!stats?.attempts) {
    return "未挑戦";
  }
  return `${stats.perfects}/${stats.attempts}`;
}

function recipeMatchesFilters(recipe: Recipe, state: AppState) {
  const query = state.search.trim().toLowerCase();
  const baseOk = state.baseFilter === "all" || recipe.base === state.baseFilter;
  const sourceOk =
    state.sourceFilter === "all" || recipe.sources.some((source) => source.type === state.sourceFilter);
  const masteredOk =
    state.scopeFilter === "all" ||
    (state.scopeFilter === "mastered" ? !!state.mastered[recipe.id] : !state.mastered[recipe.id]);
  const queryOk =
    !query ||
    recipe.searchText.includes(
      query
        .normalize("NFKC")
        .replace(/[　\s]+/g, "")
        .toLowerCase()
    );

  return baseOk && sourceOk && masteredOk && queryOk;
}

function recipeThumb(recipe: Recipe) {
  return (
    <div className="recipe-art recipe-art--thumb">
      <ChoiceMedia
        visual={recipe.image}
        alt={recipe.image.alt}
        className="recipe-art__image"
        sizes="180px"
      />
    </div>
  );
}

export default function CocktailStudyApp() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AppState>(() => createDefaultState());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(state);
  }, [hydrated, state]);

  const activeDeck = useMemo(
    () =>
      catalog.recipes.filter(
        (recipe) =>
          recipe.practice &&
          recipe.sources.some((source) => state.practiceSources[source.type])
      ),
    [state.practiceSources]
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!activeDeck.length) {
      setFeedback(null);
      setAnswerVisible(false);
      return;
    }

    setState((previous) => {
      const current = recipeById.get(previous.currentRecipeId);
      if (current && activeDeck.some((recipe) => recipe.id === current.id)) {
        return previous;
      }

      const next =
        chooseWeightedRecipe(activeDeck, previous, previous.currentRecipeId) || activeDeck[0] || null;

      if (!next) {
        return previous;
      }

      return {
        ...previous,
        currentRecipeId: next.id,
      };
    });

    setFeedback(null);
    setAnswerVisible(false);
  }, [activeDeck, hydrated]);

  const currentRecipe = useMemo(() => {
    return recipeById.get(state.currentRecipeId) || activeDeck[0] || catalog.recipes[0] || null;
  }, [activeDeck, state.currentRecipeId]);

  const currentDraft = useMemo(() => {
    if (!currentRecipe) {
      return null;
    }
    return normalizeDraftForRecipe(currentRecipe, state.drafts[currentRecipe.id]);
  }, [currentRecipe, state.drafts]);

  useEffect(() => {
    if (!currentDraft) {
      setActiveRowIndex(0);
      return;
    }

    setActiveRowIndex(firstIncompleteRowIndex(currentDraft));
  }, [currentRecipe?.id]);

  useEffect(() => {
    if (!currentDraft) return;

    const clampedIndex = Math.min(activeRowIndex, currentDraft.rows.length - 1);
    const activeRow = currentDraft.rows[clampedIndex];
    if (!activeRow || !activeRow.ingredientId || !activeRow.quantityId) {
      return;
    }

    const nextIncomplete = currentDraft.rows.findIndex((row) => !row.ingredientId || !row.quantityId);
    if (nextIncomplete !== -1 && nextIncomplete !== activeRowIndex) {
      setActiveRowIndex(nextIncomplete);
    }
  }, [activeRowIndex, currentDraft]);

  const masteredCount = Object.keys(state.mastered).length;
  const totalAccuracy = state.stats.possible
    ? Math.round((state.stats.points / state.stats.possible) * 100)
    : 0;

  const weakRecipes = Object.entries(state.stats.byRecipe)
    .map(([recipeId, stats]) => ({
      recipe: recipeById.get(recipeId),
      stats,
    }))
    .filter((entry): entry is { recipe: Recipe; stats: RecipeStats } => !!entry.recipe)
    .sort((left, right) => right.stats.wrongs - left.stats.wrongs || right.stats.attempts - left.stats.attempts)
    .slice(0, 6);

  const history = state.stats.history.slice(0, 8);

  function persistDraft(recipe: Recipe, nextDraft: PracticeDraft) {
    setState((previous) => ({
      ...previous,
      drafts: {
        ...previous.drafts,
        [recipe.id]: nextDraft,
      },
    }));
    setFeedback(null);
  }

  function updateCurrentDraft(recipe: Recipe, updater: (draft: PracticeDraft) => PracticeDraft) {
    const draft = normalizeDraftForRecipe(recipe, state.drafts[recipe.id]);
    persistDraft(recipe, updater(draft));
  }

  function updateField(recipe: Recipe, field: keyof Omit<PracticeDraft, "rows">, value: string) {
    updateCurrentDraft(recipe, (draft) => ({
      ...draft,
      [field]: value,
    }));
  }

  function updateRow(recipe: Recipe, index: number, field: keyof PracticeRow, value: string) {
    updateCurrentDraft(recipe, (draft) => ({
      ...draft,
      rows: draft.rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function selectNextRecipe(forceDifferent = true) {
    if (!activeDeck.length) return;
    const next =
      chooseWeightedRecipe(activeDeck, state, forceDifferent ? state.currentRecipeId : "") ||
      activeDeck[0];
    if (!next) return;

    setState((previous) => ({
      ...previous,
      currentRecipeId: next.id,
    }));
    setFeedback(null);
    setAnswerVisible(false);
  }

  function togglePracticeSource(source: SourceType) {
    setState((previous) => {
      const nextSources = {
        ...previous.practiceSources,
        [source]: !previous.practiceSources[source],
      };

      if (!Object.values(nextSources).some(Boolean)) {
        nextSources[source] = true;
      }

      return {
        ...previous,
        practiceSources: nextSources,
      };
    });
  }

  function toggleMastered(recipe: Recipe) {
    setState((previous) => ({
      ...previous,
      mastered: {
        ...previous.mastered,
        [recipe.id]: !previous.mastered[recipe.id],
      },
    }));
  }

  function updateStats(recipe: Recipe, result: AttemptResult) {
    setState((previous) => {
      const byRecipe = {
        ...previous.stats.byRecipe,
      };
      const entry = byRecipe[recipe.id] || {
        attempts: 0,
        perfects: 0,
        points: 0,
        possible: 0,
        wrongs: 0,
      };

      const nextEntry = {
        attempts: entry.attempts + 1,
        perfects: entry.perfects + (result.perfect ? 1 : 0),
        points: entry.points + result.points,
        possible: entry.possible + result.possible,
        wrongs: entry.wrongs + (result.perfect ? 0 : 1),
      };

      byRecipe[recipe.id] = nextEntry;

      return {
        ...previous,
        stats: {
          attempts: previous.stats.attempts + 1,
          perfects: previous.stats.perfects + (result.perfect ? 1 : 0),
          points: previous.stats.points + result.points,
          possible: previous.stats.possible + result.possible,
          byRecipe,
          history: [
            {
              recipeId: recipe.id,
              name: recipe.name,
              points: result.points,
              possible: result.possible,
              perfect: result.perfect,
              at: Date.now(),
            },
            ...previous.stats.history,
          ].slice(0, 20),
        },
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentRecipe || !currentDraft) return;

    const result = gradeAttempt(currentRecipe, currentDraft);
    updateStats(currentRecipe, result);
    setFeedback({ recipeId: currentRecipe.id, result });
    setAnswerVisible(true);
  }

  function handleShowAnswer() {
    setAnswerVisible((previous) => !previous);
  }

  function handlePickFromLibrary(recipe: Recipe, tab: TabId = "library") {
    setState((previous) => ({
      ...previous,
      currentRecipeId: recipe.id,
      tab,
    }));
    setFeedback(null);
    setAnswerVisible(false);
  }

  function renderResultPanel(recipe: Recipe, _draft: PracticeDraft) {
    const graded = feedback?.recipeId === recipe.id ? feedback.result : null;
    const answerGlass = glassChoiceById.get(normalizeGlassId(recipe.glass)) || glassOptions[0];
    const answerMethod = methodChoiceById.get(normalizeMethodId(recipe.method)) || methodOptions[0];

    if (!graded && !answerVisible) {
      return (
        <div className="result-shell">
          <p className="helper">
            グラス、作り方、各行の材料と量を選んでから採点してください。
          </p>
        </div>
      );
    }

    return (
      <div className="result-shell">
        {graded ? (
          <div className="scoreline">
            <strong>{graded.perfect ? "完全一致" : `${graded.points}/${graded.possible}`}</strong>
            <span>{graded.accuracy}%</span>
          </div>
        ) : null}

        {graded ? (
          <div className="diff-grid">
            {graded.details.map((detail) => (
              <div key={detail.label} className={`diff-row ${detail.ok ? "is-ok" : "is-bad"}`}>
                <span className="diff-row__label">{detail.label}</span>
                <span className="diff-row__expected">{detail.expected}</span>
                <span className="diff-row__actual">{detail.actual}</span>
              </div>
            ))}
          </div>
        ) : null}

        {answerVisible ? (
          <div className="answer-shell">
            <h3>答え</h3>
            <div className="answer-media-grid">
              {renderRecipeImage(recipe, "recipe-art recipe-art--answer")}

              <div className="answer-answerstack">
                <div className="answer-tile-row">
                  <article className="answer-tile">
                    <span className="answer-tile__label">グラス</span>
                    <span className="answer-tile__body">
                      <span className="answer-tile__thumb">
                        <ChoiceMedia
                          visual={answerGlass.visual}
                          alt={answerGlass.label}
                          className="answer-tile__image"
                          sizes="72px"
                        />
                      </span>
                      <span className="answer-tile__text">{formatGlassLabel(answerGlass.id)}</span>
                    </span>
                  </article>

                  <article className="answer-tile">
                    <span className="answer-tile__label">作り方</span>
                    <span className="answer-tile__body">
                      <span className="answer-tile__thumb">
                        <ChoiceMedia
                          visual={answerMethod.visual}
                          alt={answerMethod.label}
                          className="answer-tile__image"
                          sizes="72px"
                        />
                      </span>
                      <span className="answer-tile__text">{formatMethodLabel(answerMethod.id)}</span>
                    </span>
                  </article>
                </div>

                <ul className="answer-list answer-list--visual">
                  {recipe.ingredients.map((ingredient) => {
                    const normalizedId = normalizeIngredientId(ingredient.name);
                    const ingredientChoice = ingredientChoiceById.get(normalizedId) || null;
                    return (
                      <li key={`${recipe.id}-${ingredient.name}-${ingredient.amount}`} className="answer-list__item">
                        {ingredientChoice?.visual ? (
                          <span className="answer-list__thumb">
                            <ChoiceMedia
                              visual={ingredientChoice.visual}
                              alt={ingredientChoice.label}
                              className="answer-list__image"
                              sizes="48px"
                            />
                          </span>
                        ) : null}
                        <span className="answer-list__text">{formatIngredientLine(ingredient)}</span>
                      </li>
                    );
                  })}
                </ul>

                {recipe.characteristics.length ? (
                  <div className="answer-feature">
                    <p className="mini-title">特徴</p>
                    <div className="badge-row">
                      {recipe.characteristics.map((feature) => (
                        <span key={feature} className="badge badge--amber">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {recipe.notes.length ? (
              <p className="answer-note">{recipe.notes.join(" / ")}</p>
            ) : null}
          </div>
        ) : null}

        {!graded && answerVisible ? (
          <p className="helper">答えは表示中です。採点はまだしていません。</p>
        ) : null}
      </div>
    );
  }

  function renderRecipeImage(recipe: Recipe, className: string) {
    return (
      <div className={className}>
        <ChoiceMedia
          visual={recipe.image}
          alt={recipe.image.alt}
          className="recipe-art__image"
          sizes="(max-width: 900px) 100vw, 480px"
          priority={className.includes("hero")}
        />
      </div>
    );
  }

  function renderPracticeTab() {
    if (!currentRecipe || !currentDraft) {
      return (
        <section className="band">
          <div className="band__inner">
            <div className="surface">
              <p className="helper">出題できるレシピがありません。出題範囲を見直してください。</p>
            </div>
          </div>
        </section>
      );
    }

    const sourceChips = currentRecipe.sources.map((source) => sourceBadgeText(source));
    const glassChoice = glassChoiceById.get(currentDraft.glassId) || glassOptions[0];
    const methodChoice = methodChoiceById.get(currentDraft.methodId) || methodOptions[0];
    const activeRow = currentDraft.rows[activeRowIndex] || currentDraft.rows[0] || {
      ingredientId: "",
      quantityId: "",
    };
    const activeIngredientChoice = ingredientChoiceById.get(activeRow.ingredientId) || null;
    const activeQuantityLabel = formatQuantityLabel(activeRow.quantityId);

    function renderSelectedField({
      label,
      value,
      visual,
      hint,
    }: {
      label: string;
      value: string;
      visual: Pick<VisualAsset, "imageUrl" | "fallbackImage"> | null;
      hint: string;
    }) {
      return (
        <div className="slot-summary" aria-label={`${label} ${value}`}>
          <span className="slot-summary__label">{label}</span>
          <span className="slot-summary__body">
            {visual ? (
              <span className="slot-summary__thumb">
                <ChoiceMedia visual={visual} alt={value} className="slot-summary__image" sizes="80px" />
              </span>
            ) : null}
            <span className="slot-summary__text">
              <strong>{value}</strong>
              <span>{hint}</span>
            </span>
          </span>
        </div>
      );
    }

    function renderIngredientRow(row: PracticeRow, index: number) {
      const ingredientChoice = ingredientChoiceById.get(row.ingredientId) || null;
      const quantityChoice = quantityOptions.find((choice) => choice.id === row.quantityId) || null;
      const isActive = index === activeRowIndex;

      return (
        <div key={`${currentRecipe.id}-row-${index}`} className={`slot-row ${isActive ? "is-active" : ""}`}>
          <div className="slot-row__number">{index + 1}</div>

          <button type="button" className="slot-cell" onClick={() => setActiveRowIndex(index)}>
            <span className="slot-cell__label">材料</span>
            <span className="slot-cell__value">
              {ingredientChoice?.visual ? (
                <span className="slot-cell__thumb">
                  <ChoiceMedia
                    visual={ingredientChoice.visual}
                    alt={ingredientChoice.label}
                    className="slot-cell__image"
                    sizes="56px"
                  />
                </span>
              ) : null}
              <span>{ingredientChoice?.label || "未選択"}</span>
            </span>
          </button>

          <button type="button" className="slot-cell slot-cell--quantity" onClick={() => setActiveRowIndex(index)}>
            <span className="slot-cell__label">量</span>
            <span className="slot-cell__value">
              <span>{quantityChoice?.label || "未選択"}</span>
            </span>
          </button>
        </div>
      );
    }

    return (
      <section className="band">
        <div className="band__inner band__inner--practice">
          <div className="surface surface--main">
            <div className="surface__header">
              <div>
                <p className="eyebrow">練習</p>
                <h2>{currentRecipe.name}</h2>
                <p className="surface__summary">
                  {currentRecipe.base} / {currentRecipe.ingredients.length}行 / 一致 {recipeCoverage(state, currentRecipe.id)}
                </p>
              </div>
              <div className="badge-row">
                {state.mastered[currentRecipe.id] ? (
                  <span className="badge badge--green">習得済</span>
                ) : (
                  <span className="badge">未習得</span>
                )}
                <span className="badge">{currentRecipe.glass || "グラス未記載"}</span>
                <span className="badge">{currentRecipe.method}</span>
              </div>
            </div>

            <div className="practice-hero">
              {renderRecipeImage(currentRecipe, "recipe-art recipe-art--hero")}
              <div className="practice-hero__copy">
                <div className="badge-row">
                  {sourceChips.map((text) => (
                    <span className="badge" key={text}>
                      {text}
                    </span>
                  ))}
                </div>
                <p className="practice-hero__notes">
                  {currentRecipe.notes.length ? currentRecipe.notes.join(" / ") : "注記はありません。"}
                </p>
                {currentRecipe.characteristics.length ? (
                  <div className="badge-row">
                    {currentRecipe.characteristics.map((feature) => (
                      <span key={feature} className="badge badge--amber">
                        {feature}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="badge badge--amber">{currentRecipe.base}</span>
              </div>
            </div>

            <form className="practice-form" onSubmit={handleSubmit}>
              <div className="practice-board">
                <div className="choice-grid">
                  {renderSelectedField({
                    label: "グラス",
                    value: glassChoice?.label || "未記載",
                    visual: glassChoice?.visual || null,
                    hint: "パレットから選ぶ",
                  })}
                  {renderSelectedField({
                    label: "作り方",
                    value: methodChoice?.label || "未記載",
                    visual: methodChoice?.visual || null,
                    hint: "パレットから選ぶ",
                  })}
                </div>

                <div className="row-hint">
                  <span className="badge badge--amber">選択中の行 {activeRowIndex + 1}</span>
                  <span className="helper">材料または量を押すと行を切り替えられます。</span>
                </div>

                <div className="slot-list">
                  {currentRecipe.ingredients.map((_, index) =>
                    renderIngredientRow(
                      currentDraft.rows[index] || { ingredientId: "", quantityId: "" },
                      index
                    )
                  )}
                </div>

                <div className="action-row">
                  <button type="submit" className="button button--primary">
                    採点
                  </button>
                  <button type="button" className="button" onClick={handleShowAnswer}>
                    {answerVisible ? "答えを隠す" : "答えを表示"}
                  </button>
                  <button type="button" className="button" onClick={() => selectNextRecipe(true)}>
                    次の注文
                  </button>
                  <button type="button" className="button" onClick={() => toggleMastered(currentRecipe)}>
                    {state.mastered[currentRecipe.id] ? "習得済みを外す" : "習得済みにする"}
                  </button>
                </div>
              </div>

              {renderResultPanel(currentRecipe, currentDraft)}
            </form>
          </div>

          <aside className="surface surface--side palette-panel">
            <section className="mini-panel">
              <p className="eyebrow">パレット</p>
              <p className="helper">グラス、作り方、材料、量をここから選びます。</p>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">グラス</p>
              <div className="palette-row palette-row--cards">
                {glassOptions.map((choice) => (
                  <ChoiceCard
                    key={choice.id || "glass-blank"}
                    label={choice.label}
                    visual={choice.visual}
                    active={glassChoice?.id === choice.id}
                    onClick={() => updateField(currentRecipe, "glassId", choice.id)}
                    className="choice-card--glass"
                  />
                ))}
              </div>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">作り方</p>
              <div className="palette-row palette-row--chips">
                {methodOptions.map((choice) => (
                  <ChoiceChip
                    key={choice.id || "method-blank"}
                    label={choice.label}
                    active={methodChoice?.id === choice.id}
                    onClick={() => updateField(currentRecipe, "methodId", choice.id)}
                    className="choice-chip--method"
                  />
                ))}
              </div>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">材料</p>
              <p className="helper">{activeIngredientChoice ? `行 ${activeRowIndex + 1}: ${activeIngredientChoice.label}` : "材料を押してから選んでください。"}</p>
              {ingredientGroups.map((group) => (
                <div key={group.group} className="palette-group">
                  <p className="mini-title">{group.group}</p>
                  <div className={`palette-row ${group.choices.some((choice) => choice.display === "card") ? "palette-row--cards" : "palette-row--chips"}`}>
                    {group.choices.map((choice) =>
                      choice.display === "card" ? (
                        <ChoiceCard
                          key={choice.id}
                          label={choice.label}
                          visual={choice.visual}
                          active={activeIngredientChoice?.id === choice.id}
                          onClick={() =>
                            updateRow(currentRecipe, activeRowIndex, "ingredientId", choice.id)
                          }
                          className="choice-card--ingredient"
                        />
                      ) : (
                        <ChoiceChip
                          key={choice.id}
                          label={choice.label}
                          active={activeIngredientChoice?.id === choice.id}
                          onClick={() =>
                            updateRow(currentRecipe, activeRowIndex, "ingredientId", choice.id)
                          }
                          className="choice-chip--ingredient"
                        />
                      )
                    )}
                  </div>
                </div>
              ))}
            </section>

            <section className="mini-panel">
              <p className="eyebrow">量</p>
              <div className="palette-row palette-row--chips quantity-palette">
                {quantityOptions.map((choice) => {
                  const isActive = activeRow.quantityId === choice.id;
                  return (
                    <ChoiceChip
                      key={choice.id || "blank"}
                      label={choice.label}
                      active={isActive}
                      onClick={() => updateRow(currentRecipe, activeRowIndex, "quantityId", choice.id)}
                      className="choice-chip--quantity"
                    />
                  );
                })}
              </div>
              <div className="row-hint">
                <span className="badge badge--amber">{activeQuantityLabel}</span>
                <span className="helper">量は文字ラベルで選択します。</span>
              </div>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">出題範囲</p>
              <div className="chip-row">
                {practiceSourceOptions.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    className={`filter-chip ${state.practiceSources[source.id] ? "is-active" : ""}`}
                    onClick={() => togglePracticeSource(source.id)}
                    aria-pressed={state.practiceSources[source.id]}
                  >
                    {source.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">学習状況</p>
              <div className="metric-grid">
                <article className="metric-card">
                  <span>挑戦</span>
                  <strong>{state.stats.attempts}</strong>
                </article>
                <article className="metric-card">
                  <span>完全一致</span>
                  <strong>{state.stats.perfects}</strong>
                </article>
                <article className="metric-card">
                  <span>正答率</span>
                  <strong>{totalAccuracy}%</strong>
                </article>
                <article className="metric-card">
                  <span>習得済</span>
                  <strong>{masteredCount}</strong>
                </article>
              </div>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">苦手</p>
              <div className="stack">
                {weakRecipes.length ? (
                  weakRecipes.map(({ recipe, stats }) => (
                    <button
                      key={recipe.id}
                      type="button"
                      className="weak-card"
                      onClick={() => handlePickFromLibrary(recipe)}
                    >
                      <strong>{recipe.name}</strong>
                      <span>
                        {stats.wrongs}回ミス / {stats.attempts}回
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="helper">まだ苦手データがありません。</p>
                )}
              </div>
            </section>

            <section className="mini-panel">
              <p className="eyebrow">最近の履歴</p>
              <div className="stack">
                {history.length ? (
                  history.map((entry) => (
                    <article className="history-card" key={`${entry.recipeId}-${entry.at}`}>
                      <strong>{entry.name}</strong>
                      <span>
                        {DATE_FORMAT.format(new Date(entry.at))} / {entry.points}/{entry.possible} /{" "}
                        {entry.perfect ? "完全一致" : "未達"}
                      </span>
                    </article>
                  ))
                ) : (
                  <p className="helper">まだ出題履歴がありません。</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </section>
    );
  }

  function renderLibraryTab() {
    const filteredRecipes = catalog.recipes.filter((recipe) => recipeMatchesFilters(recipe, state));
    const selectedRecipe =
      (currentRecipe && filteredRecipes.some((recipe) => recipe.id === currentRecipe.id)
        ? currentRecipe
        : filteredRecipes[0] || catalog.recipes[0] || null);

    return (
      <section className="band">
        <div className="band__inner band__inner--library">
          <div className="surface surface--toolbar">
            <div className="toolbar-grid">
              <label className="field field--search">
                <span className="field__label">検索</span>
                <input
                  type="search"
                  value={state.search}
                  onChange={(event) =>
                    setState((previous) => ({
                      ...previous,
                      search: event.target.value,
                    }))
                  }
                  placeholder="レシピ名、材料、メモ"
                />
              </label>

              <label className="field field--select">
                <span className="field__label">ベース</span>
                <select
                  value={state.baseFilter}
                  onChange={(event) =>
                    setState((previous) => ({
                      ...previous,
                      baseFilter: event.target.value,
                    }))
                  }
                >
                  {baseOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field--select">
                <span className="field__label">出典</span>
                <select
                  value={state.sourceFilter}
                  onChange={(event) =>
                    setState((previous) => ({
                      ...previous,
                      sourceFilter: event.target.value as SourceFilter,
                    }))
                  }
                >
                  {sourceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="chip-row">
              {scopeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`filter-chip ${state.scopeFilter === option.id ? "is-active" : ""}`}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      scopeFilter: option.id,
                    }))
                  }
                  aria-pressed={state.scopeFilter === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="library-layout">
            <div className="recipe-grid">
              {filteredRecipes.length ? (
                filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    type="button"
                    className={`recipe-card ${selectedRecipe?.id === recipe.id ? "is-selected" : ""}`}
                    onClick={() => handlePickFromLibrary(recipe)}
                  >
                    {recipeThumb(recipe)}
                    <div className="recipe-card__body">
                    <div className="badge-row">
                      <span className="badge">{recipe.base}</span>
                      {state.mastered[recipe.id] ? (
                        <span className="badge badge--green">習得済</span>
                      ) : null}
                    </div>
                    <h3>{recipe.name}</h3>
                    <p className="recipe-card__line">
                      {recipe.ingredients.slice(0, 2).map((ingredient) => formatIngredientLine(ingredient)).join(" / ")}
                    </p>
                    <p className="recipe-card__feature">
                      {recipe.characteristics[0] || "特徴はまだありません。"}
                    </p>
                    <p className="recipe-card__note">
                      {recipe.notes[0] || recipe.glass || "グラス未記載"}
                    </p>
                    <div className="badge-row">
                      <span className="badge">一致 {recipeCoverage(state, recipe.id)}</span>
                        <span className="badge">材料 {recipe.ingredients.length}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="surface surface--empty">
                  <p className="helper">一致するレシピがありません。</p>
                </div>
              )}
            </div>

            <aside className="surface surface--detail">
              {selectedRecipe ? (
                <>
                  <div className="detail-hero">
                    {renderRecipeImage(selectedRecipe, "recipe-art recipe-art--detail")}
                    <div className="detail-hero__copy">
                      <p className="eyebrow">詳細</p>
                      <h2>{selectedRecipe.name}</h2>
                      <p className="surface__summary">
                        {selectedRecipe.base} / {selectedRecipe.ingredients.length}行 / 一致{" "}
                        {recipeCoverage(state, selectedRecipe.id)}
                      </p>
                      <div className="badge-row">
                        {selectedRecipe.sources.map((source) => (
                          <span key={source.type} className="badge">
                            {sourceBadgeText(source)}
                          </span>
                        ))}
                        <span className="badge">{selectedRecipe.glass || "グラス未記載"}</span>
                        <span className="badge">{selectedRecipe.method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-stack">
                    <section className="detail-block">
                      <h3>材料</h3>
                      <ul className="detail-list">
                        {selectedRecipe.ingredients.map((ingredient) => (
                          <li key={`${selectedRecipe.id}-${ingredient.name}-${ingredient.amount}`}>
                            {formatIngredientLine(ingredient)}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="detail-block">
                      <h3>注記</h3>
                      {selectedRecipe.notes.length ? (
                        <ul className="detail-list">
                          {selectedRecipe.notes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="helper">注記はありません。</p>
                      )}
                    </section>

                    <section className="detail-block">
                      <h3>特徴</h3>
                      {selectedRecipe.characteristics.length ? (
                        <div className="badge-row">
                          {selectedRecipe.characteristics.map((feature) => (
                            <span key={feature} className="badge badge--amber">
                              {feature}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="helper">特徴はまだありません。</p>
                      )}
                    </section>

                    <section className="detail-block">
                      <h3>出典</h3>
                      <div className="badge-row">
                        {selectedRecipe.sources.map((source) => (
                          <span key={`${selectedRecipe.id}-${source.type}`} className="badge">
                            {sourceBadgeText(source)}
                          </span>
                        ))}
                      </div>
                    </section>

                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => handlePickFromLibrary(selectedRecipe, "practice")}
                    >
                      練習に戻して選ぶ
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => toggleMastered(selectedRecipe)}
                    >
                      {state.mastered[selectedRecipe.id] ? "習得済みを外す" : "習得済みにする"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="helper">レシピを選択すると詳細を表示します。</p>
              )}
            </aside>
          </div>

          <div className="notes-grid">
            {catalog.notePages.map((page) => (
              <article className="note-card" key={page.title}>
                <div className="badge-row">
                  <span
                    className={`badge ${
                      page.kind === "stockout"
                        ? "badge--red"
                        : page.kind === "partial"
                          ? "badge--amber"
                          : "badge--green"
                    }`}
                  >
                    {page.kind === "stockout" ? "品切れ表" : page.kind === "partial" ? "見切れ" : "切れ端"}
                  </span>
                </div>
                <h3>{page.title}</h3>
                {"columns" in page ? (
                  <div className="note-columns">
                    <div>
                      <p className="mini-title">左列</p>
                      <ul>
                        {page.columns[0].map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mini-title">右列</p>
                      <ul>
                        {page.columns[1].map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <ul className="detail-list">
                    {page.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">カクテル暗記アプリ</p>
          <h1>注文を選んで、選択式で作り方を覚える。</h1>
          <p className="hero__lede">
            材料、量、グラス、作り方、UP をすべて候補から選んで採点します。手書きメモの赤字や切れ端も残しています。
          </p>
          <div className="badge-row">
            <span className="chip">レシピ {catalog.recipes.length}件</span>
            <span className="chip">正答率 {totalAccuracy}%</span>
            <span className="chip">習得済 {masteredCount}件</span>
            <span className="chip">履歴 {state.stats.history.length}件</span>
          </div>
        </div>

        <div className="hero__art">
          {currentRecipe ? (
            <ChoiceMedia
              visual={currentRecipe.image}
              alt={currentRecipe.image.alt}
              className="hero__art-image"
              sizes="(max-width: 900px) 100vw, 420px"
              priority
            />
          ) : null}
        </div>
      </header>

      <nav className="tabbar" aria-label="メイン切り替え">
        <button
          type="button"
          className={`tab ${state.tab === "practice" ? "is-active" : ""}`}
          onClick={() => setState((previous) => ({ ...previous, tab: "practice" }))}
          aria-pressed={state.tab === "practice"}
        >
          練習
        </button>
        <button
          type="button"
          className={`tab ${state.tab === "library" ? "is-active" : ""}`}
          onClick={() => setState((previous) => ({ ...previous, tab: "library" }))}
          aria-pressed={state.tab === "library"}
        >
          一覧
        </button>
      </nav>

      {state.tab === "practice" ? renderPracticeTab() : renderLibraryTab()}
    </main>
  );
}
