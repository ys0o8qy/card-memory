import type { CardInstance } from "./domain/cards";
import type { PaoLadderItem, PaoLadderLevel } from "./domain/pao";
import { buildRemainingQuestion, type PlayEvent, type ScoringResult } from "./domain/scoring";

export type AppView = "today" | "train" | "pao" | "progress";

export type RemainingQuestion = ReturnType<typeof buildRemainingQuestion>;

export type EditorReturn =
  | { type: "view"; view: AppView }
  | { type: "demo"; cards: CardInstance[]; index: number }
  | { type: "result"; cards: CardInstance[]; result: ScoringResult };

export type ExerciseState =
  | { type: "none" }
  | { type: "pao-demo"; cards: CardInstance[]; index: number }
  | { type: "sequence-study"; cards: CardInstance[] }
  | { type: "sequence-recall"; cards: CardInstance[]; recall: string[] }
  | { type: "sequence-result"; cards: CardInstance[]; result: ScoringResult }
  | {
      type: "pao-ladder";
      levelId: PaoLadderLevel["id"];
      items: PaoLadderItem[];
      index: number;
      revealed: boolean;
      remembered: number;
      missed: number;
    }
  | {
      type: "pao-ladder-result";
      levelId: PaoLadderLevel["id"];
      levelName: string;
      total: number;
      remembered: number;
      missed: number;
    }
  | {
      type: "remaining-question";
      deck: CardInstance[];
      seenCards: CardInstance[];
      playEvents: PlayEvent[];
      question: RemainingQuestion;
    }
  | { type: "remaining-result"; question: RemainingQuestion; answer: number }
  | { type: "pao-editor"; faceId: string; returnTo: EditorReturn };

export type PaoEditorValue = {
  persona: string;
  action: string;
  object: string;
};
