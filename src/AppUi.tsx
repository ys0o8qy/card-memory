import {
  faceIdFromCardId,
  getFaceById,
  labelForFace,
  type CardInstance,
} from "./domain/cards";

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ResultBand({ title, cardIds }: { title: string; cardIds: string[] }) {
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

export function PlayingCard({ card }: { card: CardInstance }) {
  return (
    <div className={`playing-card ${isRed(card.faceId) ? "is-red" : ""}`}>
      {cardLabel(card)}
    </div>
  );
}

export function cardLabel(card: Pick<CardInstance, "faceId">): string {
  return labelForFace(card.faceId);
}

export function isRed(faceId: string): boolean {
  const face = getFaceById(faceId);
  return face?.suit === "heart" || face?.suit === "diamond";
}
