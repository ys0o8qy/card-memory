import {
  faceIdFromCardId,
  labelForFace,
  type CardInstance,
} from "./domain/cards";
import {
  cardCountForLevel,
  recommendNextTraining,
  type CardSkillStats,
  type ScoringResult,
  type TrainingRecommendation,
  DEFAULT_TRAINING_PLAN,
} from "./domain/scoring";
import {
  createLocalStorageRepository,
  createMemoryRepository,
  type Repository,
} from "./domain/storage";
import type { ExerciseState } from "./appTypes";
import { Metric, cardLabel, isRed } from "./AppUi";

export function TodayView({
  repository,
  appState,
  onStartRecommended,
  onStartSequence,
}: {
  repository: Repository;
  appState: ReturnType<Repository["getState"]>;
  onStartRecommended: () => void;
  onStartSequence: () => void;
}) {
  const sessions = repository.listSessions({ limit: 100 }).items;
  const history = sessions
    .flatMap((session) => session.scoringResults)
    .map((result) => ({ metrics: result.metrics }));
  const recommendation = recommendNextTraining({
    currentLevelId: appState.userPreferences.currentDifficultyLevel,
    history,
    weakStats: appState.cardSkillStats,
  });
  const recommendedTitle = recommendationTitle(recommendation);
  const recommendedCardCount =
    typeof recommendation.recommendedExercise.cardCount === "number"
      ? recommendation.recommendedExercise.cardCount
      : cardCountForLevel(recommendation.recommendedLevelId);

  return (
    <section className="split">
      <div>
        <p className="eyebrow">今日训练</p>
        <h2>{recommendedTitle}</h2>
        <p className="quiet">
          {recommendation.reason}
          {recommendation.recommendedLevelId === "PAO_REVIEW"
            ? " 建议先做 5 张常错牌 PAO 复习。"
            : ` 今日 CTA 将按推荐进入 ${recommendedCardCount} 张顺序训练。`}
        </p>
        <div className="actions">
          <button
            className="primary"
            type="button"
            onClick={onStartRecommended}
          >
            开始今日训练
          </button>
          <button className="secondary" type="button" onClick={onStartSequence}>
            跳到 13 张训练
          </button>
        </div>
      </div>
      <aside className="band">
        <h3>训练概览</h3>
        <div className="stat-grid">
          <Metric label="总训练" value={sessions.length} />
          <Metric
            label="当前等级"
            value={appState.userPreferences.currentDifficultyLevel}
          />
          <Metric label="PAO 自定义" value={appState.paoOverrides.length} />
          <Metric label="推荐等级" value={recommendation.recommendedLevelId} />
        </div>
      </aside>
    </section>
  );
}


export function SequenceRecall({
  deck,
  exercise,
  onRecallChange,
  onSubmit,
}: {
  deck: CardInstance[];
  exercise: Extract<ExerciseState, { type: "sequence-recall" }>;
  onRecallChange: (recall: string[]) => void;
  onSubmit: () => void;
}) {
  const selected = new Set(exercise.recall);
  const targetCount = exercise.cards.length;
  const recallComplete = exercise.recall.length === targetCount;
  const recallFull = exercise.recall.length >= targetCount;

  return (
    <>
      <p className="eyebrow">回忆顺序</p>
      <h2>
        按刚才的顺序点选牌（{exercise.recall.length} / {targetCount}）
      </h2>
      <div className="sequence-list">
        {exercise.recall.length === 0 ? (
          <span className="muted-inline">尚未选择</span>
        ) : (
          exercise.recall.map((cardId, index) => (
            <span className="pill" key={`${cardId}-${index}`}>
              {labelForFace(faceIdFromCardId(cardId))}
            </span>
          ))
        )}
      </div>
      <div className="card-grid">
        {deck.map((card) => (
          <button
            className={`card-button ${isRed(card.faceId) ? "is-red" : ""}`}
            disabled={selected.has(card.id) || recallFull}
            key={card.id}
            onClick={() => {
              if (exercise.recall.length >= targetCount) return;
              onRecallChange([...exercise.recall, card.id]);
            }}
            type="button"
          >
            {cardLabel(card)}
          </button>
        ))}
      </div>
      <div className="actions">
        <button
          className="secondary"
          disabled={exercise.recall.length === 0}
          onClick={() => onRecallChange(exercise.recall.slice(0, -1))}
          type="button"
        >
          撤回
        </button>
        <button
          className="primary"
          disabled={!recallComplete}
          onClick={onSubmit}
          type="button"
        >
          提交
        </button>
      </div>
    </>
  );
}


function recommendationTitle(recommendation: TrainingRecommendation): string {
  if (recommendation.recommendedLevelId === "PAO_REVIEW") {
    return "先复习常错牌";
  }
  const level = DEFAULT_TRAINING_PLAN.levels.find(
    (entry) => entry.id === recommendation.recommendedLevelId,
  );
  return level ? `推荐：${level.displayName}` : "开始顺序训练";
}


export function buildCardSkillStatsUpdate(
  result: ScoringResult,
  existingStats: CardSkillStats[],
  now: string,
): CardSkillStats[] {
  const weakFaceIds = new Set(
    [
      ...result.missingCardIds,
      ...result.misplacedCardIds,
      ...result.extraCardIds,
    ].map(faceIdFromCardId),
  );
  const correctFaceIds = new Set(result.correctCardIds.map(faceIdFromCardId));
  const updates: CardSkillStats[] = [];

  for (const faceId of weakFaceIds) {
    const existing = existingStats.find(
      (stat) => stat.entityType === "card_face" && stat.entityId === faceId,
    );
    updates.push({
      entityType: "card_face",
      entityId: faceId,
      familiarityLevel: Math.max(0, (existing?.familiarityLevel ?? 70) - 15),
      seenCount: (existing?.seenCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + 1,
      lastSeenAt: now,
      lastErrorAt: now,
      reviewWeight: Math.min(1, (existing?.reviewWeight ?? 0.45) + 0.2),
    });
  }

  for (const faceId of correctFaceIds) {
    if (weakFaceIds.has(faceId)) continue;
    const existing = existingStats.find(
      (stat) => stat.entityType === "card_face" && stat.entityId === faceId,
    );
    if (!existing) continue;
    // Reward previously tracked cards when recalled correctly.
    updates.push({
      ...existing,
      familiarityLevel: Math.min(100, existing.familiarityLevel + 10),
      seenCount: existing.seenCount + 1,
      reviewWeight: Math.max(0, existing.reviewWeight - 0.15),
      lastSeenAt: now,
    });
  }

  return updates;
}


export function createRepository(): Repository {
  try {
    if (typeof globalThis.localStorage === "undefined") {
      return createMemoryRepository();
    }
    const repository = createLocalStorageRepository();
    // Probe read path so corrupt storage falls through the hardened adapter.
    repository.getState();
    return repository;
  } catch {
    return createMemoryRepository();
  }
}
