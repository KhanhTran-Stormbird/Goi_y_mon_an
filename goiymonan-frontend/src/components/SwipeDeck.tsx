"use client";

import { FaHeart, FaTimes } from "react-icons/fa";

type DeckProps<T> = {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onLike: (item: T) => void;
  onDislike: (item: T) => void;
};

export default function SwipeDeck<T>({
  items,
  renderCard,
  onLike,
  onDislike,
}: DeckProps<T>) {
  if (items.length === 0) return null;

  const item: T = items[0];

  return (
    <div className="d-flex flex-column align-items-center">
      <div style={{ width: 400 }}>{renderCard(item)}</div>
      <div className="d-flex justify-content-center gap-3 mt-4">
        <button
          className="btn btn-outline-danger btn-lg rounded-circle"
          onClick={() => onDislike(item)}
          aria-label="Dislike"
          type="button"
        >
          <FaTimes />
        </button>
        <button
          className="btn btn-outline-success btn-lg rounded-circle"
          onClick={() => onLike(item)}
          aria-label="Like"
          type="button"
        >
          <FaHeart />
        </button>
      </div>
    </div>
  );
}
