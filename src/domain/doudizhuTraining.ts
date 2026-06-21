export const DOUDIZHU_RANKS = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
  "BJ",
  "RJ",
] as const;

export const DOUDIZHU_SLICE_LEVELS = ["L13", "L26", "L54"] as const;

export type DoudizhuRank = (typeof DOUDIZHU_RANKS)[number];
export type DoudizhuSliceLevel = (typeof DOUDIZHU_SLICE_LEVELS)[number];
export type DoudizhuPlayer = "landlord" | "farmer_left" | "farmer_right" | `player_${string}`;
export type DoudizhuAction = "play" | "pass";

export interface DoudizhuPlayEvent {
  index: number;
  player: DoudizhuPlayer;
  action: DoudizhuAction;
  cards: DoudizhuRank[];
  pattern:
    | "pass"
    | "unknown"
    | "single"
    | "pair"
    | "triple"
    | "triple_with_single"
    | "triple_with_pair"
    | "straight"
    | "pair_sequence"
    | "triple_sequence"
    | "bomb"
    | "rocket"
    | "raw_rlcard_action";
  rawAction: string;
  playedCardCount: number;
  cumulativePlayedCardCount: number;
}

export type DoudizhuInventorySnapshot = Record<DoudizhuRank, number>;

export interface DoudizhuTrainingSample {
  sampleId: string;
  gameId: string;
  level: DoudizhuSliceLevel;
  targetPlayedCardCount: number;
  observedPlayedCardCount: number;
  sliceEndEventIndex: number;
  events: DoudizhuPlayEvent[];
  inventorySnapshots: DoudizhuInventorySnapshot[];
  questions: {
    remainingCountRanks: DoudizhuRank[];
    includeExhaustedRanks: boolean;
    includePossibleBombRanks: boolean;
  };
  answers: {
    remainingCount: Partial<Record<DoudizhuRank, number>>;
    exhaustedRanks: DoudizhuRank[];
    possibleBombRanks: DoudizhuRank[];
  };
  metadata: {
    source: "rlcard_doudizhu";
    seed: number;
    game: Record<string, unknown>;
  };
}

export function isDoudizhuTrainingSample(value: unknown): value is DoudizhuTrainingSample {
  if (!value || typeof value !== "object") {
    return false;
  }
  const sample = value as Partial<DoudizhuTrainingSample>;
  return (
    typeof sample.sampleId === "string" &&
    typeof sample.gameId === "string" &&
    typeof sample.level === "string" &&
    DOUDIZHU_SLICE_LEVELS.includes(sample.level as DoudizhuSliceLevel) &&
    Array.isArray(sample.events) &&
    Array.isArray(sample.inventorySnapshots)
  );
}
