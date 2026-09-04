import { useMemo, useState } from "react";
import {
  createDeck,
  shuffleCards,
  STANDARD_DECK_SPEC,
  type CardInstance,
  type Rank,
} from "./domain/cards";
import {
  buildPaoLadderItems,
  createPaoOverride,
  DEFAULT_PAO_TEMPLATE,
  resolvePaoMappings,
  type PaoLadderLevel,
} from "./domain/pao";
import {
  buildRemainingQuestion,
  cardCountForLevel,
  recommendNextTraining,
  scoreSequence,
  type PlayEvent,
  type ScoringResult,
} from "./domain/scoring";
import { type TrainingSession } from "./domain/storage";
import type { AppView, EditorReturn, ExerciseState, PaoEditorValue } from "./appTypes";
import {
  PaoDemo,
  PaoLadderQuiz,
  PaoLadderResult,
  SequenceResult,
  SequenceStudy,
  TrainView,
} from "./AppScreens";
import {
  PaoEditor,
  PaoTable,
  ProgressView,
  RemainingQuestionScreen,
  RemainingResult,
} from "./AppScreensMore";
import {
  TodayView,
  SequenceRecall,
  buildCardSkillStatsUpdate,
  createRepository,
} from "./AppTraining";
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
  function startRecommendedTraining() {
    const sessions = repository.listSessions({ limit: 100 }).items;
    const history = sessions
      .flatMap((session) => session.scoringResults)
      .map((result) => ({ metrics: result.metrics }));
    const recommendation = recommendNextTraining({
      currentLevelId: appState.userPreferences.currentDifficultyLevel,
      history,
      weakStats: appState.cardSkillStats,
    });
    if (recommendation.recommendedLevelId === "PAO_REVIEW") {
      startPaoDemo();
      return;
    }
    const cardCount =
      typeof recommendation.recommendedExercise.cardCount === "number"
        ? recommendation.recommendedExercise.cardCount
        : cardCountForLevel(recommendation.recommendedLevelId);
    startSequenceTraining(cardCount);
  }
  function persistDifficultyIfAdvanced(currentLevelId: string) {
    const sessions = repository.listSessions({ limit: 100 }).items;
    const history = sessions
      .flatMap((session) => session.scoringResults)
      .map((result) => ({ metrics: result.metrics }));
    const recommendation = recommendNextTraining({
      currentLevelId,
      history,
      weakStats: [],
    });
    if (recommendation.didAdvance) {
      repository.savePreferences({
        currentDifficultyLevel: recommendation.recommendedLevelId,
      });
    }
  }
  function startPaoLadder(levelId: PaoLadderLevel["id"]) {
    const items = shuffleCards(buildPaoLadderItems(paoMappings, levelId));
    setView("train");
    setExercise({
      type: "pao-ladder",
      levelId,
      items,
      index: 0,
      revealed: false,
      remembered: 0,
      missed: 0,
    });
  }
  function answerPaoLadder(remembered: boolean) {
    if (exercise.type !== "pao-ladder") return;
    const nextRemembered = exercise.remembered + (remembered ? 1 : 0);
    const nextMissed = exercise.missed + (remembered ? 0 : 1);
    const nextIndex = exercise.index + 1;
    if (nextIndex >= exercise.items.length) {
      setExercise({
        type: "pao-ladder-result",
        levelId: exercise.levelId,
        levelName: exercise.items[0]?.level.name ?? "阶梯训练",
        total: exercise.items.length,
        remembered: nextRemembered,
        missed: nextMissed,
      });
      return;
    }
    setExercise({
      ...exercise,
      index: nextIndex,
      revealed: false,
      remembered: nextRemembered,
      missed: nextMissed,
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
    const skillStats = buildCardSkillStatsUpdate(
      result,
      appState.cardSkillStats,
      now,
    );
    if (skillStats.length > 0) {
      repository.saveCardSkillStats(skillStats);
    }
    persistDifficultyIfAdvanced(
      appState.userPreferences.currentDifficultyLevel,
    );
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
    if (exercise.type === "pao-ladder") {
      return (
        <PaoLadderQuiz
          exercise={exercise}
          onAnswer={answerPaoLadder}
          onReveal={() => setExercise({ ...exercise, revealed: true })}
        />
      );
    }
    if (exercise.type === "pao-ladder-result") {
      return (
        <PaoLadderResult
          exercise={exercise}
          onAgain={() => startPaoLadder(exercise.levelId)}
          onTrain={() => navigate("train")}
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
          onStartRecommended={startRecommendedTraining}
          onStartSequence={() => startSequenceTraining(13)}
        />
      );
    }
    if (view === "train") {
      return (
        <TrainView
          onStartDemo={startPaoDemo}
          onStartLadder={startPaoLadder}
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
export default App;
