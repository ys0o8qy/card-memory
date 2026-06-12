import {
  createDeck,
  STANDARD_DECK_SPEC,
  type CardInstance,
} from "../domain/cards";
import {
  DEFAULT_PAO_TEMPLATE,
  resolvePaoMappings,
} from "../domain/pao";
import {
  buildRemainingQuestion,
  scoreSequence,
  type PlayEvent,
} from "../domain/scoring";
import {
  createMemoryRepository,
  type Repository,
  type TrainingSession,
} from "../domain/storage";
import type { ExerciseState } from "../App";

export const fixtureDeck = createDeck(STANDARD_DECK_SPEC);
export const fixturePaoMappings = resolvePaoMappings(DEFAULT_PAO_TEMPLATE);

export const fixtureDemoExercise: Extract<ExerciseState, { type: "pao-demo" }> = {
  type: "pao-demo",
  cards: fixtureDeck.slice(0, 5),
  index: 0,
};

export const fixtureSequenceCards = fixtureDeck.slice(0, 13);

export const fixtureSequenceResult: Extract<
  ExerciseState,
  { type: "sequence-result" }
> = {
  type: "sequence-result",
  cards: fixtureSequenceCards,
  result: {
    ...scoreSequence(
      fixtureSequenceCards.map((card) => card.id),
      [
        fixtureSequenceCards[1].id,
        fixtureSequenceCards[0].id,
        ...fixtureSequenceCards.slice(2, 12).map((card) => card.id),
        fixtureDeck[30].id,
      ],
    ),
    attemptId: "fixture_attempt",
  },
};

export const fixtureSeenCards = fixtureDeck.slice(0, 18);

export const fixturePlayEvents: PlayEvent[] = fixtureSeenCards.map(
  (card, index) => ({
    id: `fixture_event_${index}`,
    roundIndex: index,
    cardIds: [card.id],
    pattern: { type: "single", classifierVersion: "fixture" },
  }),
);

export const fixtureRemainingQuestion: Extract<
  ExerciseState,
  { type: "remaining-question" }
> = {
  type: "remaining-question",
  deck: fixtureDeck,
  seenCards: fixtureSeenCards,
  playEvents: fixturePlayEvents,
  question: buildRemainingQuestion(fixtureDeck, fixturePlayEvents, "A"),
};

export const fixtureRemainingResult: Extract<
  ExerciseState,
  { type: "remaining-result" }
> = {
  type: "remaining-result",
  question: fixtureRemainingQuestion.question,
  answer: Math.max(0, fixtureRemainingQuestion.question.expectedAnswer - 1),
};

export function createFixtureRepository(): Repository {
  const repository = createMemoryRepository();
  const now = "2026-06-12T00:00:00.000Z";
  const session: TrainingSession = {
    id: "fixture_session_1",
    definition: {
      mode: "sequence_recall",
      cardCount: fixtureSequenceCards.length,
    },
    generatedCards: fixtureSequenceCards,
    generatorVersion: "fixture",
    startedAt: now,
    completedAt: now,
    attempts: [
      {
        id: "fixture_attempt_1",
        sessionId: "fixture_session_1",
        attemptIndex: 1,
        actualCardIds: fixtureSequenceCards.map((card) => card.id),
        startedAt: now,
        submittedAt: now,
      },
    ],
    scoringResults: [fixtureSequenceResult.result],
  };

  repository.saveSession(session);
  repository.savePreferences({ currentDifficultyLevel: "L2" });

  return repository;
}

export function cardByFaceId(faceId: string): CardInstance {
  const card = fixtureDeck.find((entry) => entry.faceId === faceId);
  if (!card) {
    throw new Error(`Missing fixture card for ${faceId}`);
  }
  return card;
}
