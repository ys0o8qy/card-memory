import {
  faceIdFromCardId,
  labelForFace,
  type CardInstance,
} from "./domain/cards";
import {
  PAO_LADDER_LEVELS,
  type PaoLadderLevel,
  type ResolvedPaoMapping,
} from "./domain/pao";
import type { ExerciseState } from "./appTypes";
import { Metric, PlayingCard, ResultBand, cardLabel } from "./AppUi";
export function TrainView({
  onStartDemo,
  onStartLadder,
  onStartSequence,
  onStartRemaining,
}: {
  onStartDemo: () => void;
  onStartLadder: (levelId: PaoLadderLevel["id"]) => void;
  onStartSequence: (cardCount: number) => void;
  onStartRemaining: () => void;
}) {
  return (
    <>
      <p className="eyebrow">训练模式</p>
      <h2>选择练习</h2>
      <section className="ladder-entry" aria-labelledby="ladder-title">
        <div>
          <h3 id="ladder-title">阶梯训练：领域+数字→人物</h3>
          <p className="quiet">
            只看领域、数字和数字钩子，回答对应人物；花色、动作、物品不作为题目线索。
          </p>
        </div>
        <div className="ladder-level-grid">
          {PAO_LADDER_LEVELS.map((level) => (
            <button
              className="secondary ladder-level-button"
              key={level.id}
              onClick={() => onStartLadder(level.id)}
              type="button"
            >
              <span>{level.name}</span>
              <small>{level.ranks.join(" / ")}</small>
            </button>
          ))}
        </div>
      </section>
      <div className="mode-grid">
        <button className="secondary" type="button" onClick={onStartDemo}>
          5 张 PAO 快速演示
        </button>
        <button className="secondary" type="button" onClick={() => onStartSequence(13)}>
          13 张顺序记忆
        </button>
        <button className="secondary" type="button" onClick={() => onStartSequence(27)}>
          27 张顺序记忆
        </button>
        <button className="secondary" type="button" onClick={() => onStartSequence(54)}>
          54 张顺序记忆
        </button>
        <button className="secondary" type="button" onClick={onStartRemaining}>
          剩余牌判断
        </button>
      </div>
      <p className="notice">
        当前默认先训练一副牌；牌组规格已经在 domain 层保留到两副牌扩展点。
      </p>
    </>
  );
}
export function PaoLadderQuiz({
  exercise,
  onReveal,
  onAnswer,
}: {
  exercise: Extract<ExerciseState, { type: "pao-ladder" }>;
  onReveal: () => void;
  onAnswer: (remembered: boolean) => void;
}) {
  const item = exercise.items[exercise.index];
  if (!item) {
    return (
      <>
        <p className="eyebrow">阶梯训练</p>
        <h2>当前等级没有可训练条目</h2>
      </>
    );
  }
  return (
    <>
      <p className="eyebrow">
        阶梯训练 {exercise.index + 1} / {exercise.items.length}
      </p>
      <h2>{item.level.name}</h2>
      <div className="ladder-quiz">
        <div className="ladder-prompt" aria-label="题目线索">
          <div className="ladder-cue">
            <span>领域</span>
            <strong>{item.domain}</strong>
          </div>
          <div className="ladder-cue">
            <span>数字</span>
            <strong>{item.rank}</strong>
          </div>
          <div className="ladder-hook">
            <span>数字钩子</span>
            <strong>{item.numberHook}</strong>
          </div>
        </div>
        {exercise.revealed ? (
          <div className="ladder-answer">
            <span>人物</span>
            <strong>{item.persona}</strong>
            {item.reason ? <p>{item.reason}</p> : null}
            <small>原始牌面：{labelForFace(item.faceId)}</small>
          </div>
        ) : (
          <p className="quiet compact-copy">
            先在脑中回答人物，再揭晓答案做自评。
          </p>
        )}
      </div>
      <div className="ladder-progress" aria-label="当前自评统计">
        <Metric label="已记住" value={exercise.remembered} />
        <Metric label="没记住" value={exercise.missed} />
        <Metric label="剩余" value={exercise.items.length - exercise.index - 1} />
      </div>
      <div className="actions">
        {exercise.revealed ? (
          <>
            <button className="primary" type="button" onClick={() => onAnswer(true)}>
              我记住了
            </button>
            <button className="secondary" type="button" onClick={() => onAnswer(false)}>
              没记住
            </button>
          </>
        ) : (
          <button className="primary" type="button" onClick={onReveal}>
            揭晓答案
          </button>
        )}
      </div>
    </>
  );
}
export function PaoLadderResult({
  exercise,
  onAgain,
  onTrain,
}: {
  exercise: Extract<ExerciseState, { type: "pao-ladder-result" }>;
  onAgain: () => void;
  onTrain: () => void;
}) {
  return (
    <>
      <p className="eyebrow">阶梯训练结果</p>
      <h2>{exercise.levelName}</h2>
      <div className="stat-grid">
        <Metric label="总题数" value={exercise.total} />
        <Metric label="已记住" value={exercise.remembered} />
        <Metric label="没记住" value={exercise.missed} />
      </div>
      <div className="actions">
        <button className="primary" type="button" onClick={onAgain}>
          再练本级
        </button>
        <button className="secondary" type="button" onClick={onTrain}>
          返回训练模式
        </button>
      </div>
    </>
  );
}
export function PaoDemo({
  exercise,
  mappings,
  onNext,
  onStartSequence,
  onEdit,
}: {
  exercise: Extract<ExerciseState, { type: "pao-demo" }>;
  mappings: Map<string, ResolvedPaoMapping>;
  onNext: () => void;
  onStartSequence: () => void;
  onEdit: (faceId: string) => void;
}) {
  const card = exercise.cards[exercise.index];
  const mapping = mappings.get(card.faceId);
  const isLast = exercise.index + 1 >= exercise.cards.length;
  return (
    <>
      <p className="eyebrow">
        PAO 快速演示 {exercise.index + 1} / {exercise.cards.length}
      </p>
      <h2>{cardLabel(card)}</h2>
      <div className="band">
        <p className="quiet">把这张牌想象成一个画面：</p>
        <div className="stat-grid">
          <Metric label="Persona" value={mapping?.persona ?? "-"} />
          <Metric label="Action" value={mapping?.action ?? "-"} />
          <Metric label="Object" value={mapping?.object ?? "-"} />
        </div>
        {mapping?.scene ? <p className="notice compact-notice">{mapping.scene}</p> : null}
        {mapping?.reason ? <p className="quiet compact-copy">{mapping.reason}</p> : null}
      </div>
      <div className="actions">
        {isLast ? (
          <button className="primary" type="button" onClick={onStartSequence}>
            进入 13 张训练
          </button>
        ) : (
          <button className="primary" type="button" onClick={onNext}>
            下一张
          </button>
        )}
        <button className="secondary" type="button" onClick={() => onEdit(card.faceId)}>
          修改这张 PAO
        </button>
      </div>
    </>
  );
}
export function SequenceStudy({
  cards,
  onStartRecall,
}: {
  cards: CardInstance[];
  onStartRecall: () => void;
}) {
  return (
    <>
      <p className="eyebrow">顺序记忆</p>
      <h2>记住这 {cards.length} 张牌</h2>
      <p className="quiet">
        先把牌面转成 PAO 画面，再串成一个短故事。准备好后进入回忆。
      </p>
      <div className="card-grid">
        {cards.map((card) => (
          <PlayingCard card={card} key={card.id} />
        ))}
      </div>
      <div className="actions">
        <button className="primary" type="button" onClick={onStartRecall}>
          开始回忆
        </button>
      </div>
    </>
  );
}
export function SequenceResult({
  exercise,
  onAgain,
  onPaoTable,
  onEdit,
}: {
  exercise: Extract<ExerciseState, { type: "sequence-result" }>;
  onAgain: () => void;
  onPaoTable: () => void;
  onEdit: (faceId: string) => void;
}) {
  const { result } = exercise;
  const weakCardIds = [
    ...result.missingCardIds,
    ...result.misplacedCardIds,
    ...result.extraCardIds,
  ].slice(0, 3);
  return (
    <>
      <p className="eyebrow">训练结果</p>
      <h2>准确率 {Math.round(result.accuracy * 100)}%</h2>
      <div className="result-grid">
        <ResultBand title="错位" cardIds={result.misplacedCardIds} />
        <ResultBand title="遗漏" cardIds={result.missingCardIds} />
        <ResultBand title="多选" cardIds={result.extraCardIds} />
        <div className="band">
          <h3>下一步</h3>
          <p className="quiet">
            {result.accuracy >= 0.8
              ? "可以继续 13 张限时或提高牌量。"
              : "先复习常错牌，再做一组 13 张不限时。"}
          </p>
        </div>
      </div>
      <div className="actions">
        <button className="primary" type="button" onClick={onAgain}>
          再练一组
        </button>
        <button className="secondary" type="button" onClick={onPaoTable}>
          查看 PAO 表
        </button>
        {weakCardIds.map((cardId) => {
          const faceId = faceIdFromCardId(cardId);
          return (
            <button
              className="secondary"
              key={cardId}
              onClick={() => onEdit(faceId)}
              type="button"
            >
              修改 {labelForFace(faceId)}
            </button>
          );
        })}
      </div>
    </>
  );
}
