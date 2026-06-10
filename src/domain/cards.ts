export const STANDARD_SUITS = ["spade", "heart", "diamond", "club"] as const;
export const STANDARD_RANKS = [
  "A",
  "2",
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
] as const;

export type StandardSuit = (typeof STANDARD_SUITS)[number];
export type StandardRank = (typeof STANDARD_RANKS)[number];
export type JokerRank = "small_joker" | "big_joker";
export type Suit = StandardSuit | "joker";
export type Rank = StandardRank | JokerRank;

export interface CardFace {
  id: string;
  suit: Suit;
  rank: Rank;
  displayName: string;
  sortOrder: number;
}

export interface CardInstance {
  id: string;
  deckId: string;
  faceId: string;
}

export type CardSelector =
  | { type: "all" }
  | { type: "face_ids"; faceIds: readonly string[] }
  | {
      type: "standard_cards";
      suits?: readonly StandardSuit[];
      ranks?: readonly StandardRank[];
    }
  | { type: "jokers"; ranks?: readonly JokerRank[] };

export interface DeckSpec {
  deckCount: number;
  selectors: readonly CardSelector[];
  excludedFaceIds?: readonly string[];
}

export interface CardFaceCatalog {
  version: string;
  faces: readonly CardFace[];
}

export const SUIT_LABELS: Record<Suit, string> = {
  spade: "黑桃",
  heart: "红桃",
  diamond: "方块",
  club: "梅花",
  joker: "",
};

export const RANK_LABELS: Record<Rank, string> = {
  A: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  J: "J",
  Q: "Q",
  K: "K",
  small_joker: "小王",
  big_joker: "大王",
};

const STANDARD_FACES: CardFace[] = STANDARD_SUITS.flatMap((suit, suitIndex) =>
  STANDARD_RANKS.map((rank, rankIndex) => ({
    id: `${suit}_${rank}`,
    suit,
    rank,
    displayName: `${SUIT_LABELS[suit]}${RANK_LABELS[rank]}`,
    sortOrder: suitIndex * STANDARD_RANKS.length + rankIndex,
  })),
);

const JOKER_FACES: CardFace[] = [
  {
    id: "joker_small",
    suit: "joker",
    rank: "small_joker",
    displayName: "小王",
    sortOrder: 52,
  },
  {
    id: "joker_big",
    suit: "joker",
    rank: "big_joker",
    displayName: "大王",
    sortOrder: 53,
  },
];

export const CARD_FACE_CATALOG: CardFaceCatalog = Object.freeze({
  version: "standard-54-v1",
  faces: Object.freeze([...STANDARD_FACES, ...JOKER_FACES]),
});

export const STANDARD_DECK_SPEC: DeckSpec = Object.freeze({
  deckCount: 1,
  selectors: Object.freeze([{ type: "all" } satisfies CardSelector]),
});

export function getFaceById(faceId: string): CardFace | undefined {
  return CARD_FACE_CATALOG.faces.find((face) => face.id === faceId);
}

export function labelForFace(faceId: string): string {
  return getFaceById(faceId)?.displayName ?? faceId;
}

export function faceIdFromCardId(cardId: string): string {
  return cardId.includes(":") ? (cardId.split(":").at(-1) ?? cardId) : cardId;
}

export function resolveDeckFaces(deckSpec: DeckSpec = STANDARD_DECK_SPEC): CardFace[] {
  const selectors = deckSpec.selectors.length
    ? deckSpec.selectors
    : STANDARD_DECK_SPEC.selectors;
  const selected = new Map<string, CardFace>();

  for (const selector of selectors) {
    for (const face of selectFaces(selector)) {
      selected.set(face.id, face);
    }
  }

  for (const faceId of deckSpec.excludedFaceIds ?? []) {
    selected.delete(faceId);
  }

  return [...selected.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createDeck(deckSpec: DeckSpec = STANDARD_DECK_SPEC): CardInstance[] {
  const faces = resolveDeckFaces(deckSpec);
  const cards: CardInstance[] = [];

  for (let deckIndex = 1; deckIndex <= deckSpec.deckCount; deckIndex += 1) {
    for (const face of faces) {
      cards.push({
        id: `deck_${deckIndex}:${face.id}`,
        deckId: `deck_${deckIndex}`,
        faceId: face.id,
      });
    }
  }

  return cards;
}

export function shuffleCards<T>(cards: readonly T[], rng: () => number = Math.random): T[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function selectFaces(selector: CardSelector): readonly CardFace[] {
  switch (selector.type) {
    case "all":
      return CARD_FACE_CATALOG.faces;
    case "face_ids":
      return selector.faceIds.map((faceId) => {
        const face = getFaceById(faceId);
        if (!face) {
          throw new Error(`Unknown card face: ${faceId}`);
        }
        return face;
      });
    case "standard_cards":
      return CARD_FACE_CATALOG.faces.filter((face) => {
        if (face.suit === "joker") return false;
        const suitMatches = !selector.suits || selector.suits.includes(face.suit);
        const rankMatches =
          !selector.ranks || selector.ranks.includes(face.rank as StandardRank);
        return suitMatches && rankMatches;
      });
    case "jokers":
      return CARD_FACE_CATALOG.faces.filter((face) => {
        if (face.suit !== "joker") return false;
        return !selector.ranks || selector.ranks.includes(face.rank as JokerRank);
      });
  }
}
