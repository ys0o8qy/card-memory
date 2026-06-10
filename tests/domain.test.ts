import { describe, expect, it } from "vitest";

import {
  createDeck,
  STANDARD_DECK_SPEC,
} from "../src/domain/cards";
import {
  DEFAULT_PAO_TEMPLATE,
  resolvePaoMappings,
} from "../src/domain/pao";
import {
  calculateRemainingCards,
  recommendNextTraining,
  scoreSequence,
} from "../src/domain/scoring";
import { createMemoryRepository } from "../src/domain/storage";

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
  });
});

describe("pao and persistence domain", () => {
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
