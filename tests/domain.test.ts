import { describe, expect, it } from "vitest";

import {
  createDeck,
  STANDARD_DECK_SPEC,
} from "../src/domain/cards";
import {
  DEFAULT_PAO_TEMPLATE,
  buildPaoLadderItems,
  getPaoLadderLevelForRank,
  PAO_LADDER_LEVELS,
  resolvePaoMappings,
} from "../src/domain/pao";
import {
  calculateRemainingCards,
  cardCountForLevel,
  DEFAULT_TRAINING_PLAN,
  recommendNextTraining,
  scoreSequence,
} from "../src/domain/scoring";
import {
  createLocalStorageRepository,
  createMemoryRepository,
} from "../src/domain/storage";

describe("card deck domain", () => {
  it("creates a standard 54-card deck", () => {
    const deck = createDeck(STANDARD_DECK_SPEC);

    expect(deck).toHaveLength(54);
    expect(new Set(deck.map((card) => card.id)).size).toBe(54);
    expect(deck[0].deckId).toBe("deck_1");
  });

  it("creates two physical instances for each face in a two-deck deck", () => {
    const deck = createDeck({ ...STANDARD_DECK_SPEC, deckCount: 2 });

    expect(deck).toHaveLength(108);
    expect(deck.filter((card) => card.faceId === "spade_A")).toHaveLength(2);
    expect(
      deck.filter((card) => card.faceId === "spade_A").map((card) => card.deckId),
    ).toEqual(["deck_1", "deck_2"]);
  });

  it("supports a deck spec without jokers", () => {
    const deck = createDeck({
      deckCount: 1,
      selectors: [{ type: "standard_cards" }],
    });

    expect(deck).toHaveLength(52);
    expect(deck.some((card) => card.faceId === "joker_big")).toBe(false);
  });
});

describe("training scoring domain", () => {
  it("scores exact, missing, extra, and misplaced cards", () => {
    const expected = ["deck_1:spade_A", "deck_1:heart_K", "deck_1:club_2"];
    const actual = ["deck_1:heart_K", "deck_1:spade_A", "deck_1:diamond_3"];

    const result = scoreSequence(expected, actual);

    expect(result.correctCardIds).toHaveLength(0);
    expect(result.missingCardIds).toEqual(["deck_1:club_2"]);
    expect(result.extraCardIds).toEqual(["deck_1:diamond_3"]);
    expect(new Set(result.misplacedCardIds)).toEqual(
      new Set(["deck_1:spade_A", "deck_1:heart_K"]),
    );
    expect(result.metrics.sequenceAccuracy).toBe(0);
  });

  it("calculates remaining cards by face and rank", () => {
    const deck = createDeck(STANDARD_DECK_SPEC);
    const seen = deck.filter(
      (card) => card.faceId === "spade_A" || card.faceId === "heart_A",
    );

    const remaining = calculateRemainingCards(
      deck,
      seen.map((card) => ({
        id: `event_${card.id}`,
        cardIds: [card.id],
        pattern: { type: "single", classifierVersion: "manual" },
      })),
    );

    expect(remaining.remainingCards).toHaveLength(52);
    expect(remaining.remainingCountByRank.A).toBe(2);
    expect(remaining.remainingCountByFaceId.spade_A).toBe(0);
    expect(remaining.remainingCountByFaceId.club_A).toBe(1);
  });

  it("recommends advancing when recent scores meet criteria", () => {
    const recommendation = recommendNextTraining({
      currentLevelId: "L1",
      history: [
        { metrics: { sequenceAccuracy: 0.9 } },
        { metrics: { sequenceAccuracy: 0.88 } },
        { metrics: { sequenceAccuracy: 0.86 } },
      ],
      weakStats: [],
    });

    expect(recommendation.recommendedLevelId).toBe("L2");
    expect(recommendation.reason).toContain("达到");
  });

  it("recommends weak-card practice before advancing", () => {
    const recommendation = recommendNextTraining({
      currentLevelId: "L2",
      history: [
        { metrics: { sequenceAccuracy: 0.92 } },
        { metrics: { sequenceAccuracy: 0.91 } },
        { metrics: { sequenceAccuracy: 0.9 } },
      ],
      weakStats: [
        {
          entityType: "card_face",
          entityId: "heart_2",
          familiarityLevel: 30,
          seenCount: 5,
          errorCount: 4,
          reviewWeight: 0.95,
        },
      ],
    });

    expect(recommendation.recommendedLevelId).toBe("PAO_REVIEW");
    expect(recommendation.weakEntities[0].entityId).toBe("heart_2");
    expect(recommendation.didAdvance).toBe(false);
  });

  it("advances from L3 to real L4 with 54-card exercise", () => {
    expect(DEFAULT_TRAINING_PLAN.levels.map((level) => level.id)).toEqual([
      "L1",
      "L2",
      "L3",
      "L4",
    ]);
    expect(cardCountForLevel("L3")).toBe(27);
    expect(cardCountForLevel("L4")).toBe(54);

    const recommendation = recommendNextTraining({
      currentLevelId: "L3",
      history: [
        { metrics: { sequenceAccuracy: 0.9 } },
        { metrics: { sequenceAccuracy: 0.88 } },
        { metrics: { sequenceAccuracy: 0.85 } },
      ],
      weakStats: [],
    });

    expect(recommendation.recommendedLevelId).toBe("L4");
    expect(recommendation.recommendedExercise.cardCount).toBe(54);
    expect(recommendation.didAdvance).toBe(true);
  });

  it("keeps L4 as the top level instead of dangling next ids", () => {
    const recommendation = recommendNextTraining({
      currentLevelId: "L4",
      history: [
        { metrics: { sequenceAccuracy: 0.9 } },
        { metrics: { sequenceAccuracy: 0.9 } },
        { metrics: { sequenceAccuracy: 0.9 } },
      ],
      weakStats: [],
    });

    expect(recommendation.recommendedLevelId).toBe("L4");
    expect(recommendation.recommendedExercise.cardCount).toBe(54);
    expect(recommendation.didAdvance).toBe(false);
  });
});

describe("pao and persistence domain", () => {
  it("uses the curated Chinese PAO table as the default template", () => {
    const mappings = resolvePaoMappings(DEFAULT_PAO_TEMPLATE);

    expect(DEFAULT_PAO_TEMPLATE.mappings).toHaveLength(54);
    expect(mappings.get("spade_A")).toMatchObject({
      persona: "秦始皇",
      action: "盖玉玺统一天下",
      object: "传国玉玺",
      source: "template",
    });
    expect(mappings.get("heart_10")).toMatchObject({
      persona: "苏轼",
      action: "写《江城子》悼亡",
      object: "词卷",
    });
    expect(mappings.get("diamond_K")).toMatchObject({
      persona: "比尔·盖茨",
      action: "敲 Windows 代码",
      object: "Windows 电脑",
    });
    expect(mappings.get("club_Q")).toMatchObject({
      persona: "黄蓉",
      action: "打狗棒布阵",
      object: "打狗棒",
    });
    expect(mappings.get("joker_big")).toMatchObject({
      persona: "巨人",
      action: "变出",
      object: "礼帽",
    });
  });

  it("resolves PAO overrides without mutating the default template", () => {
    const mappings = resolvePaoMappings(DEFAULT_PAO_TEMPLATE, [
      {
        faceId: "spade_A",
        persona: "自定义人物",
        action: "挥手",
        object: "旗子",
        templateId: DEFAULT_PAO_TEMPLATE.id,
        templateVersion: DEFAULT_PAO_TEMPLATE.version,
        updatedAt: "2026-06-10T00:00:00.000Z",
      },
    ]);

    expect(mappings.get("spade_A")?.persona).toBe("自定义人物");
    expect(mappings.get("spade_A")?.source).toBe("custom");
    expect(
      DEFAULT_PAO_TEMPLATE.mappings.find((entry) => entry.faceId === "spade_A")
        ?.persona,
    ).not.toBe("自定义人物");
    expect(mappings.get("spade_A")).toMatchObject({
      domain: "权",
      numberHook: "第一 / 开端 / 顶级",
    });
  });

  it("assigns standard ranks to the three PAO ladder levels", () => {
    expect(getPaoLadderLevelForRank("3")?.id).toBe("strong-hooks");
    expect(getPaoLadderLevelForRank("10")?.id).toBe("strong-hooks");
    expect(getPaoLadderLevelForRank("A")?.id).toBe("court-cards");
    expect(getPaoLadderLevelForRank("K")?.id).toBe("court-cards");
    expect(getPaoLadderLevelForRank("2")?.id).toBe("weak-hook-fill");
    expect(getPaoLadderLevelForRank("9")?.id).toBe("weak-hook-fill");
    expect(getPaoLadderLevelForRank("small_joker")).toBeUndefined();
  });

  it("builds ladder items filtered by level without using jokers", () => {
    const mappings = resolvePaoMappings(DEFAULT_PAO_TEMPLATE);

    const levelSizes = PAO_LADDER_LEVELS.map((level) =>
      buildPaoLadderItems(mappings, level.id),
    );

    expect(levelSizes.map((items) => items.length)).toEqual([20, 16, 16]);
    expect(levelSizes.flat().some((item) => item.faceId.startsWith("joker"))).toBe(
      false,
    );
    expect(levelSizes[0].map((item) => item.rank)).toEqual(
      expect.arrayContaining(["3", "6", "7", "8", "10"]),
    );
    expect(levelSizes[1].map((item) => item.rank)).toEqual(
      expect.arrayContaining(["A", "J", "Q", "K"]),
    );
    expect(levelSizes[2].map((item) => item.rank)).toEqual(
      expect.arrayContaining(["2", "4", "5", "9"]),
    );
  });

  it("stores overrides, sessions, and preferences through a repository", () => {
    const repository = createMemoryRepository();
    const override = {
      faceId: "club_7",
      persona: "测试人物",
      action: "测试动作",
      object: "测试物品",
      templateId: DEFAULT_PAO_TEMPLATE.id,
      templateVersion: DEFAULT_PAO_TEMPLATE.version,
      updatedAt: "2026-06-10T00:00:00.000Z",
    };
    const session = {
      id: "session_1",
      definition: { mode: "sequence_recall" as const, cardCount: 13 },
      generatedCards: [],
      generatorVersion: "test",
      startedAt: "2026-06-10T00:00:00.000Z",
      attempts: [],
      scoringResults: [],
    };

    repository.savePaoOverride(override);
    repository.saveSession(session);
    repository.savePreferences({ currentDifficultyLevel: "L2" });

    expect(repository.getState().paoOverrides[0].persona).toBe("测试人物");
    expect(repository.listSessions().items[0].id).toBe("session_1");
    expect(repository.getState().userPreferences.currentDifficultyLevel).toBe(
      "L2",
    );
  });
});

describe("localStorage repository hardening", () => {
  it("resets safely when stored JSON is corrupt", () => {
    const values = new Map<string, string>([
      ["card-memory-training-state", "{not-json"],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };

    const repository = createLocalStorageRepository(storage);
    expect(repository.getState().userPreferences.currentDifficultyLevel).toBe(
      "L1",
    );
    expect(values.has("card-memory-training-state")).toBe(false);
  });

  it("falls back to memory when setItem throws without crashing", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };

    const repository = createLocalStorageRepository(storage);
    expect(() =>
      repository.savePreferences({ currentDifficultyLevel: "L2" }),
    ).not.toThrow();
    expect(repository.getState().userPreferences.currentDifficultyLevel).toBe(
      "L2",
    );
  });
});
