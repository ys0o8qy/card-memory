import {
  faceIdFromCardId,
  getFaceById,
  labelForFace,
  STANDARD_DECK_SPEC,
  type CardInstance,
  type DeckSpec,
  type Rank,
} from "./cards";

export interface PlayPattern {
  type: string;
  length?: number;
  rank?: Rank;
  attachments?: PlayPattern[];
  metadata?: Record<string, string | number | boolean>;
  classifierVersion: string;
}

export interface PlayEvent {
  id: string;
  roundIndex?: number;
  cardIds: string[];
  pattern: PlayPattern;
}

export interface PositionResult {
  expectedCardId?: string;
  actualCardId?: string;
  expectedIndex?: number;
  actualIndex?: number;
  status: "correct" | "missing" | "misplaced" | "extra";
  displacement?: number;
}

export interface ScoringResult {
  attemptId: string;
  scoringVersion: string;
  accuracy: number;
  metrics: Record<string, number>;
  elapsedMs: number;
  correctCardIds: string[];
  missingCardIds: string[];
  extraCardIds: string[];
  misplacedCardIds: string[];
  averageDisplacement: number;
  positionResults: PositionResult[];
}

export interface RemainingCardsSummary {
  remainingCards: CardInstance[];
  remainingCountByFaceId: Record<string, number>;
  remainingCountByRank: Partial<Record<Rank, number>>;
  keyCardStatus: {
    jokersRemaining: number;
    twosRemaining: number;
    acesRemaining: number;
    kingsRemaining: number;
  };
  nOfKindPossibleByRank: Partial<Record<Rank, number>>;
  bombStatusByRank: Partial<Record<Rank, boolean>>;
}

export interface CardSkillStats {
  entityType: "card_face" | "rank" | "pattern";
  entityId: string;
  profileId?: string;
  mode?: string;
  familiarityLevel: number;
  seenCount: number;
  errorCount: number;
  averageReactionMs?: number;
  lastSeenAt?: string;
  lastErrorAt?: string;
  reviewWeight: number;
}

export interface TrainingHistoryEntry {
  metrics?: Record<string, number>;
}

export interface TrainingRecommendation {
  planId: string;
  planVersion: string;
  recommendedLevelId: string;
  recommendedExercise: Record<string, unknown>;
  reason: string;
  weakEntities: CardSkillStats[];
}

export const DEFAULT_TRAINING_PLAN = Object.freeze({
  id: "default_training_path",
  version: "1",
  levels: Object.freeze([
    {
      id: "L1",
      displayName: "13 张不限时",
      minMetrics: { sequenceAccuracy: 0.8 },
      nextLevelId: "L2",
    },
    {
      id: "L2",
      displayName: "13 张限时",
      minMetrics: { sequenceAccuracy: 0.85 },
      nextLevelId: "L3",
      fallbackLevelId: "L1",
    },
    {
      id: "L3",
      displayName: "27 张训练",
      minMetrics: { sequenceAccuracy: 0.8 },
      nextLevelId: "L4",
      fallbackLevelId: "L2",
    },
  ]),
});

export function scoreSequence(
  expectedCardIds: readonly string[],
  actualCardIds: readonly string[],
): ScoringResult {
  const actualSet = new Set(actualCardIds);
  const expectedSet = new Set(expectedCardIds);
  const correctCardIds: string[] = [];
  const missingCardIds = expectedCardIds.filter((cardId) => !actualSet.has(cardId));
  const extraCardIds = actualCardIds.filter((cardId) => !expectedSet.has(cardId));
  const misplacedCardIds: string[] = [];
  const positionResults: PositionResult[] = [];

  for (const [expectedIndex, expectedCardId] of expectedCardIds.entries()) {
    const actualIndex = actualCardIds.indexOf(expectedCardId);
    if (actualCardIds[expectedIndex] === expectedCardId) {
      correctCardIds.push(expectedCardId);
      positionResults.push({
        expectedCardId,
        actualCardId: expectedCardId,
        expectedIndex,
        actualIndex: expectedIndex,
        status: "correct",
        displacement: 0,
      });
      continue;
    }

    if (actualIndex === -1) {
      positionResults.push({
        expectedCardId,
        expectedIndex,
        status: "missing",
      });
      continue;
    }

    misplacedCardIds.push(expectedCardId);
    positionResults.push({
      expectedCardId,
      actualCardId: expectedCardId,
      expectedIndex,
      actualIndex,
      status: "misplaced",
      displacement: Math.abs(actualIndex - expectedIndex),
    });
  }

  for (const [actualIndex, actualCardId] of actualCardIds.entries()) {
    if (!expectedSet.has(actualCardId)) {
      positionResults.push({
        actualCardId,
        actualIndex,
        status: "extra",
      });
    }
  }

  const displacements = positionResults
    .map((result) => result.displacement)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const accuracy = expectedCardIds.length
    ? correctCardIds.length / expectedCardIds.length
    : 0;

  return {
    attemptId: "current",
    scoringVersion: "sequence-v1",
    accuracy,
    metrics: {
      sequenceAccuracy: accuracy,
      recallCoverage:
        expectedCardIds.length === 0
          ? 0
          : (expectedCardIds.length - missingCardIds.length) / expectedCardIds.length,
    },
    elapsedMs: 0,
    correctCardIds,
    missingCardIds,
    extraCardIds,
    misplacedCardIds,
    averageDisplacement: displacements.length
      ? displacements.reduce((sum, value) => sum + value, 0) /
        displacements.length
      : 0,
    positionResults,
  };
}

export function calculateRemainingCards(
  fullDeck: readonly CardInstance[],
  playEvents: readonly PlayEvent[],
): RemainingCardsSummary {
  const seenIds = new Set(playEvents.flatMap((event) => event.cardIds));
  const remainingCards = fullDeck.filter((card) => !seenIds.has(card.id));
  const remainingCountByFaceId: Record<string, number> = {};
  const remainingCountByRank: Partial<Record<Rank, number>> = {};
  const nOfKindPossibleByRank: Partial<Record<Rank, number>> = {};
  const bombStatusByRank: Partial<Record<Rank, boolean>> = {};

  for (const card of fullDeck) {
    remainingCountByFaceId[card.faceId] = 0;
  }

  for (const card of remainingCards) {
    const face = getFaceById(card.faceId);
    if (!face) continue;
    remainingCountByFaceId[card.faceId] =
      (remainingCountByFaceId[card.faceId] ?? 0) + 1;
    remainingCountByRank[face.rank] = (remainingCountByRank[face.rank] ?? 0) + 1;
  }

  for (const [rank, count] of Object.entries(remainingCountByRank)) {
    nOfKindPossibleByRank[rank as Rank] = count;
    bombStatusByRank[rank as Rank] = count >= 4;
  }

  return {
    remainingCards,
    remainingCountByFaceId,
    remainingCountByRank,
    keyCardStatus: {
      jokersRemaining:
        (remainingCountByFaceId.joker_small ?? 0) +
        (remainingCountByFaceId.joker_big ?? 0),
      twosRemaining: remainingCountByRank["2"] ?? 0,
      acesRemaining: remainingCountByRank.A ?? 0,
      kingsRemaining: remainingCountByRank.K ?? 0,
    },
    nOfKindPossibleByRank,
    bombStatusByRank,
  };
}

export function buildRemainingQuestion(
  fullDeck: readonly CardInstance[],
  playEvents: readonly PlayEvent[],
  targetRank: Rank = "A",
) {
  const remaining = calculateRemainingCards(fullDeck, playEvents);
  return {
    id: `rank_remaining_${targetRank}`,
    questionType: "rank_remaining_count",
    prompt: `${targetRank} 还剩几张？`,
    targetRank,
    expectedAnswer: remaining.remainingCountByRank[targetRank] ?? 0,
    explanation: `${targetRank} 当前还剩 ${
      remaining.remainingCountByRank[targetRank] ?? 0
    } 张。`,
  };
}

export function recommendNextTraining({
  currentLevelId = "L1",
  history = [],
  weakStats = [],
  plan = DEFAULT_TRAINING_PLAN,
}: {
  currentLevelId?: string;
  history?: TrainingHistoryEntry[];
  weakStats?: CardSkillStats[];
  plan?: typeof DEFAULT_TRAINING_PLAN;
}): TrainingRecommendation {
  const weakEntities = weakStats
    .filter((stat) => stat.reviewWeight >= 0.8 || stat.familiarityLevel < 50)
    .sort((a, b) => b.reviewWeight - a.reviewWeight)
    .slice(0, 3);

  if (weakEntities.length > 0) {
    return {
      planId: plan.id,
      planVersion: plan.version,
      recommendedLevelId: "PAO_REVIEW",
      recommendedExercise: {
        id: "pao_review",
        mode: "pao_familiarity",
        deckSpec: STANDARD_DECK_SPEC,
        gameProfileId: "generic",
        focusWeakCards: true,
        cardCount: Math.min(5, weakEntities.length),
        revealAnswerManually: true,
      },
      reason: `先复习 ${weakEntities.map((stat) => labelForFace(stat.entityId)).join("、")}。`,
      weakEntities,
    };
  }

  const currentLevel =
    plan.levels.find((level) => level.id === currentLevelId) ?? plan.levels[0];
  const window = history.slice(-3);
  const meetsCriteria =
    window.length >= 3 &&
    Object.entries(currentLevel.minMetrics).every(([metric, minimum]) =>
      window.every((entry) => (entry.metrics?.[metric] ?? 0) >= minimum),
    );

  const recommendedLevelId = meetsCriteria
    ? currentLevel.nextLevelId ?? currentLevel.id
    : currentLevel.fallbackLevelId ?? currentLevel.id;

  return {
    planId: plan.id,
    planVersion: plan.version,
    recommendedLevelId,
    recommendedExercise: {
      id: `sequence_${recommendedLevelId.toLowerCase()}`,
      mode: "sequence_recall",
      deckSpec: STANDARD_DECK_SPEC,
      gameProfileId: "generic",
      focusWeakCards: false,
      cardCount: recommendedLevelId === "L3" ? 27 : 13,
      recallInputMode: "sort_cards",
    },
    reason: meetsCriteria
      ? "最近 3 次达到晋级标准，推荐提高难度。"
      : "继续当前难度，先稳定准确率。",
    weakEntities: [],
  };
}
