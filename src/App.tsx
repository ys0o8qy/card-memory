import { useMemo, useState } from "react";

import {
  createDeck,
  faceIdFromCardId,
  getFaceById,
  labelForFace,
  shuffleCards,
  STANDARD_DECK_SPEC,
  type CardInstance,
  type Rank,
} from "./domain/cards";
import {
  createPaoOverride,
  DEFAULT_PAO_TEMPLATE,
  resolvePaoMappings,
  type ResolvedPaoMapping,
} from "./domain/pao";
import {
  buildRemainingQuestion,
  recommendNextTraining,
  scoreSequence,
  type CardSkillStats,
  type PlayEvent,
  type ScoringResult,
} from "./domain/scoring";
import {
  createLocalStorageRepository,
  createMemoryRepository,
  type Repository,
  type TrainingSession,
} from "./domain/storage";

type AppView = "today" | "train" | "pao" | "progress";

type RemainingQuestion = ReturnType<typeof buildRemainingQuestion>;

type EditorReturn =
  | { type: "view"; view: AppView }
  | { type: "demo"; cards: CardInstance[]; index: number }
  | { type: "result"; cards: CardInstance[]; result: ScoringResult };

type ExerciseState =
  | { type: "none" }
  | { type: "pao-demo"; cards: CardInstance[]; index: number }
  | { type: "sequence-study"; cards: CardInstance[] }
  | { type: "sequence-recall"; cards: CardInstance[]; recall: string[] }
  | { type: "sequence-result"; cards: CardInstance[]; result: ScoringResult }
  | {
      type: "remaining-question";
      deck: CardInstance[];
      seenCards: CardInstance[];
      playEvents: PlayEvent[];
      question: RemainingQuestion;
    }
  | { type: "remaining-result"; question: RemainingQuestion; answer: number }
  | { type: "pao-editor"; faceId: string; returnTo: EditorReturn };

const NAV_ITEMS: Array<{ view: AppView; label: string }> = [
  { view: "today", label: "今日训练" },
  { view: "train", label: "训练模式" },
  { view: "pao", label: "PAO 表" },
  { view: "progress", label: "进度" },
];

const TARGET_RANKS: Rank[] = ["A", "2", "K"];

function App() {
  const repository = useMemo(() => createRepository(), []);
  const deck = useMemo(() => createDeck(STANDARD_DECK_SPEC), []);
  const [view, setView] = useState<AppView>("today");
  const [exercise, setExercise] = useState<ExerciseState>({ type: "none" });
  const [stateRevision, setStateRevision] = useState(0);
  const appState = useMemo(
    () => repository.getState(),
    [repository, stateRevision],
  );
  const paoMappings = useMemo(
    () => resolvePaoMappings(DEFAULT_PAO_TEMPLATE, appState.paoOverrides),
    [appState.paoOverrides],
  );

  function refreshState() {
    setStateRevision((revision) => revision + 1);
  }

  function navigate(nextView: AppView) {
    setView(nextView);
    setExercise({ type: "none" });
  }

  function startPaoDemo() {
    setView("train");
    setExercise({ type: "pao-demo", cards: shuffleCards(deck).slice(0, 5), index: 0 });
  }

  function startSequenceTraining(cardCount: number) {
    setView("train");
    setExercise({
      type: "sequence-study",
      cards: shuffleCards(deck).slice(0, cardCount),
    });
  }

  function startRemainingPractice() {
    const fullDeck = createDeck(STANDARD_DECK_SPEC);
    const seenCards = shuffleCards(fullDeck).slice(0, 18);
    const playEvents: PlayEvent[] = seenCards.map((card, index) => ({
      id: `event_${index}`,
      roundIndex: index,
      cardIds: [card.id],
      pattern: { type: "single", classifierVersion: "ui-v1" },
    }));
    const targetRank = TARGET_RANKS[Math.floor(Math.random() * TARGET_RANKS.length)];

    setView("train");
    setExercise({
      type: "remaining-question",
      deck: fullDeck,
      seenCards,
      playEvents,
      question: buildRemainingQuestion(fullDeck, playEvents, targetRank),
    });
  }

  function submitSequence(cards: CardInstance[], recall: string[]) {
    const sessionId = `session_${Date.now()}`;
    const attemptId = `attempt_${Date.now()}`;
    const result: ScoringResult = {
      ...scoreSequence(
        cards.map((card) => card.id),
        recall,
      ),
      attemptId,
    };
    const now = new Date().toISOString();
    const session: TrainingSession = {
      id: sessionId,
      definition: {
        id: "sequence_manual",
        mode: "sequence_recall",
        deckSpec: STANDARD_DECK_SPEC,
        gameProfileId: "generic",
        focusWeakCards: false,
        cardCount: cards.length,
        recallInputMode: "select_cards",
      },
      generatedCards: cards,
      generatorVersion: "react-ui-v1",
      startedAt: now,
      completedAt: now,
      attempts: [
        {
          id: attemptId,
          sessionId,
          attemptIndex: 1,
          actualCardIds: recall,
          startedAt: now,
          submittedAt: now,
        },
      ],
      scoringResults: [result],
    };

    repository.saveSession(session);
    const weakStats = buildWeakCardStats(result, appState.cardSkillStats, now);
    if (weakStats.length > 0) {
      repository.saveCardSkillStats(weakStats);
    }
    refreshState();
    setExercise({ type: "sequence-result", cards, result });
  }

  function openPaoEditor(faceId: string, returnTo: EditorReturn) {
    setExercise({ type: "pao-editor", faceId, returnTo });
  }

  function savePaoMapping(faceId: string, mapping: PaoEditorValue, returnTo: EditorReturn) {
    repository.savePaoOverride(createPaoOverride(faceId, mapping));
    refreshState();
    restoreEditorReturn(returnTo);
  }

  function resetPaoMapping(faceId: string, returnTo: EditorReturn) {
    repository.removePaoOverride(faceId);
    refreshState();
    restoreEditorReturn(returnTo);
  }

  function restoreEditorReturn(returnTo: EditorReturn) {
    if (returnTo.type === "view") {
      setView(returnTo.view);
      setExercise({ type: "none" });
      return;
    }
    if (returnTo.type === "demo") {
      setExercise({
        type: "pao-demo",
        cards: returnTo.cards,
        index: returnTo.index,
      });
      return;
    }
    setExercise({
      type: "sequence-result",
      cards: returnTo.cards,
      result: returnTo.result,
    });
  }

  function renderMain() {
    if (exercise.type === "pao-demo") {
      return (
        <PaoDemo
          exercise={exercise}
          mappings={paoMappings}
          onNext={() =>
            setExercise({
              ...exercise,
              index: Math.min(exercise.index + 1, exercise.cards.length - 1),
            })
          }
          onStartSequence={() => startSequenceTraining(13)}
          onEdit={(faceId) =>
            openPaoEditor(faceId, {
              type: "demo",
              cards: exercise.cards,
              index: exercise.index,
            })
          }
        />
      );
    }

    if (exercise.type === "sequence-study") {
      return (
        <SequenceStudy
          cards={exercise.cards}
          onStartRecall={() =>
            setExercise({
              type: "sequence-recall",
              cards: exercise.cards,
              recall: [],
            })
          }
        />
      );
    }

    if (exercise.type === "sequence-recall") {
      return (
        <SequenceRecall
          deck={deck}
          exercise={exercise}
          onRecallChange={(recall) => setExercise({ ...exercise, recall })}
          onSubmit={() => submitSequence(exercise.cards, exercise.recall)}
        />
      );
    }

    if (exercise.type === "sequence-result") {
      return (
        <SequenceResult
          exercise={exercise}
          onAgain={() => startSequenceTraining(exercise.cards.length)}
          onPaoTable={() => navigate("pao")}
          onEdit={(faceId) =>
            openPaoEditor(faceId, {
              type: "result",
              cards: exercise.cards,
              result: exercise.result,
            })
          }
        />
      );
    }

    if (exercise.type === "remaining-question") {
      return (
        <RemainingQuestionScreen
          exercise={exercise}
          onAnswer={(answer) =>
            setExercise({
              type: "remaining-result",
              question: exercise.question,
              answer,
            })
          }
        />
      );
    }

    if (exercise.type === "remaining-result") {
      return (
        <RemainingResult
          exercise={exercise}
          onAgain={startRemainingPractice}
          onToday={() => navigate("today")}
        />
      );
    }

    if (exercise.type === "pao-editor") {
      const mapping = paoMappings.get(exercise.faceId);
      return (
        <PaoEditor
          faceId={exercise.faceId}
          mapping={mapping}
          onCancel={() => restoreEditorReturn(exercise.returnTo)}
          onReset={() => resetPaoMapping(exercise.faceId, exercise.returnTo)}
          onSave={(value) =>
            savePaoMapping(exercise.faceId, value, exercise.returnTo)
          }
        />
      );
    }

    if (view === "today") {
      return (
        <TodayView
          repository={repository}
          appState={appState}
          onStartDemo={startPaoDemo}
          onStartSequence={() => startSequenceTraining(13)}
        />
      );
    }

    if (view === "train") {
      return (
        <TrainView
          onStartDemo={startPaoDemo}
          onStartSequence={startSequenceTraining}
          onStartRemaining={startRemainingPractice}
        />
      );
    }

    if (view === "pao") {
      return (
        <PaoTable
          mappings={paoMappings}
          onEdit={(faceId) => openPaoEditor(faceId, { type: "view", view: "pao" })}
        />
      );
    }

    return <ProgressView repository={repository} appState={appState} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">PAO Card Memory</p>
          <h1>扑克牌记忆训练</h1>
        </div>
        <nav className="tabs" aria-label="主导航">
          {NAV_ITEMS.map((item) => (
            <button
              className={`tab ${view === item.view ? "is-active" : ""}`}
              key={item.view}
              onClick={() => navigate(item.view)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="main-panel" aria-live="polite">
        {renderMain()}
      </main>
    </div>
  );
}

function TodayView({
  repository,
  appState,
  onStartDemo,
  onStartSequence,
}: {
  repository: Repository;
  appState: ReturnType<Repository["getState"]>;
  onStartDemo: () => void;
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

  return (
    <section className="split">
      <div>
        <p className="eyebrow">今日训练</p>
        <h2>
          {recommendation.recommendedLevelId === "PAO_REVIEW"
            ? "先复习常错牌"
            : "从 5 张 PAO 演示开始"}
        </h2>
        <p className="quiet">
          {recommendation.reason}
          默认路径会先做 5 张 PAO 快速演示，再进入 13 张不限时顺序训练。
        </p>
        <div className="actions">
          <button className="primary" type="button" onClick={onStartDemo}>
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
        </div>
      </aside>
    </section>
  );
}

function TrainView({
  onStartDemo,
  onStartSequence,
  onStartRemaining,
}: {
  onStartDemo: () => void;
  onStartSequence: (cardCount: number) => void;
  onStartRemaining: () => void;
}) {
  return (
    <>
      <p className="eyebrow">训练模式</p>
      <h2>选择练习</h2>
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

function PaoDemo({
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

function SequenceStudy({
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

function SequenceRecall({
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

  return (
    <>
      <p className="eyebrow">回忆顺序</p>
      <h2>按刚才的顺序点选牌</h2>
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
            disabled={selected.has(card.id)}
            key={card.id}
            onClick={() => onRecallChange([...exercise.recall, card.id])}
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
          disabled={exercise.recall.length === 0}
          onClick={onSubmit}
          type="button"
        >
          提交
        </button>
      </div>
    </>
  );
}

function SequenceResult({
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

function RemainingQuestionScreen({
  exercise,
  onAnswer,
}: {
  exercise: Extract<ExerciseState, { type: "remaining-question" }>;
  onAnswer: (answer: number) => void;
}) {
  return (
    <>
      <p className="eyebrow">剩余牌判断</p>
      <h2>观察已出牌</h2>
      <div className="card-grid">
        {exercise.seenCards.map((card) => (
          <PlayingCard card={card} key={card.id} />
        ))}
      </div>
      <div className="band question-band">
        <h3>{exercise.question.prompt}</h3>
        <div className="actions">
          {[0, 1, 2, 3, 4].map((answer) => (
            <button
              className="secondary"
              key={answer}
              onClick={() => onAnswer(answer)}
              type="button"
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function RemainingResult({
  exercise,
  onAgain,
  onToday,
}: {
  exercise: Extract<ExerciseState, { type: "remaining-result" }>;
  onAgain: () => void;
  onToday: () => void;
}) {
  const correct = exercise.answer === exercise.question.expectedAnswer;

  return (
    <>
      <p className="eyebrow">剩余牌结果</p>
      <h2>{correct ? "回答正确" : "再看一遍"}</h2>
      <p className={`notice ${correct ? "" : "warning"}`}>
        你的答案：{exercise.answer}；正确答案：
        {exercise.question.expectedAnswer}。{exercise.question.explanation}
      </p>
      <div className="actions">
        <button className="primary" type="button" onClick={onAgain}>
          再练一组
        </button>
        <button className="secondary" type="button" onClick={onToday}>
          回今日训练
        </button>
      </div>
    </>
  );
}

function PaoTable({
  mappings,
  onEdit,
}: {
  mappings: Map<string, ResolvedPaoMapping>;
  onEdit: (faceId: string) => void;
}) {
  return (
    <>
      <p className="eyebrow">PAO 表</p>
      <h2>默认映射，可随时修改</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>牌</th>
              <th>领域</th>
              <th>钩子</th>
              <th>人物</th>
              <th>动作</th>
              <th>物品</th>
              <th>场景</th>
              <th>来源</th>
              <th>
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_PAO_TEMPLATE.mappings.map((entry) => {
              const mapping = mappings.get(entry.faceId);
              return (
                <tr key={entry.faceId}>
                  <td>{labelForFace(entry.faceId)}</td>
                  <td>{mapping?.domain ?? "-"}</td>
                  <td>{mapping?.numberHook ?? "-"}</td>
                  <td>{mapping?.persona}</td>
                  <td>{mapping?.action}</td>
                  <td>{mapping?.object}</td>
                  <td className="scene-cell">{mapping?.scene ?? "-"}</td>
                  <td>{mapping?.source === "custom" ? "已修改" : "默认"}</td>
                  <td>
                    <button
                      className="secondary compact-button"
                      onClick={() => onEdit(entry.faceId)}
                      type="button"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

type PaoEditorValue = {
  persona: string;
  action: string;
  object: string;
};

function PaoEditor({
  faceId,
  mapping,
  onCancel,
  onReset,
  onSave,
}: {
  faceId: string;
  mapping?: ResolvedPaoMapping;
  onCancel: () => void;
  onReset: () => void;
  onSave: (value: PaoEditorValue) => void;
}) {
  const [value, setValue] = useState<PaoEditorValue>({
    persona: mapping?.persona ?? "",
    action: mapping?.action ?? "",
    object: mapping?.object ?? "",
  });
  const canSave =
    value.persona.trim().length > 0 &&
    value.action.trim().length > 0 &&
    value.object.trim().length > 0;

  return (
    <>
      <p className="eyebrow">编辑 PAO</p>
      <h2>{labelForFace(faceId)}</h2>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) onSave(value);
        }}
      >
        <Field
          id="persona"
          label="Persona"
          value={value.persona}
          onChange={(persona) => setValue({ ...value, persona })}
        />
        <Field
          id="action"
          label="Action"
          value={value.action}
          onChange={(action) => setValue({ ...value, action })}
        />
        <Field
          id="object"
          label="Object"
          value={value.object}
          onChange={(object) => setValue({ ...value, object })}
        />
        <div className="actions">
          <button className="primary" disabled={!canSave} type="submit">
            保存
          </button>
          <button className="secondary" type="button" onClick={onCancel}>
            返回
          </button>
          <button className="danger" type="button" onClick={onReset}>
            恢复默认
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        required
        value={value}
      />
    </div>
  );
}

function ProgressView({
  repository,
  appState,
}: {
  repository: Repository;
  appState: ReturnType<Repository["getState"]>;
}) {
  const sessions = repository.listSessions({ limit: 100 }).items;
  const latest = sessions.at(-1)?.scoringResults.at(0);

  return (
    <>
      <p className="eyebrow">进度</p>
      <h2>训练记录</h2>
      <div className="stat-grid">
        <Metric label="训练次数" value={sessions.length} />
        <Metric
          label="最近准确率"
          value={latest ? `${Math.round(latest.accuracy * 100)}%` : "-"}
        />
        <Metric label="自定义 PAO" value={appState.paoOverrides.length} />
      </div>
      <div className="band history-band">
        <h3>最近记录</h3>
        <ol className="compact-list">
          {sessions.length === 0 ? (
            <li>还没有训练记录</li>
          ) : (
            sessions
              .slice(-8)
              .reverse()
              .map((session) => (
                <li key={session.id}>
                  {new Date(session.completedAt ?? session.startedAt).toLocaleString()} -{" "}
                  {Math.round((session.scoringResults.at(0)?.accuracy ?? 0) * 100)}%
                </li>
              ))
          )}
        </ol>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ResultBand({ title, cardIds }: { title: string; cardIds: string[] }) {
  return (
    <div className="band">
      <h3>{title}</h3>
      {cardIds.length === 0 ? (
        <p className="quiet">无</p>
      ) : (
        <div className="sequence-list">
          {cardIds.map((cardId) => (
            <span className="pill" key={cardId}>
              {labelForFace(faceIdFromCardId(cardId))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayingCard({ card }: { card: CardInstance }) {
  return (
    <div className={`playing-card ${isRed(card.faceId) ? "is-red" : ""}`}>
      {cardLabel(card)}
    </div>
  );
}

function cardLabel(card: Pick<CardInstance, "faceId">): string {
  return labelForFace(card.faceId);
}

function isRed(faceId: string): boolean {
  const face = getFaceById(faceId);
  return face?.suit === "heart" || face?.suit === "diamond";
}

function buildWeakCardStats(
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

  return [...weakFaceIds].map((faceId) => {
    const existing = existingStats.find(
      (stat) => stat.entityType === "card_face" && stat.entityId === faceId,
    );
    return {
      entityType: "card_face",
      entityId: faceId,
      familiarityLevel: Math.max(0, (existing?.familiarityLevel ?? 70) - 15),
      seenCount: (existing?.seenCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + 1,
      lastSeenAt: now,
      lastErrorAt: now,
      reviewWeight: Math.min(1, (existing?.reviewWeight ?? 0.45) + 0.2),
    };
  });
}

function createRepository(): Repository {
  try {
    return createLocalStorageRepository();
  } catch {
    return createMemoryRepository();
  }
}

export default App;
