import { computeMatch, splitIngredients } from "./stateEncoder";

export type FeedbackActionType = "like" | "dislike";

/**
 * Tính reward tức thời dựa trên hành động và mức độ khớp nguyên liệu.
 * Quy tắc:
 *  +10 nếu tỷ lệ khớp ≥ 70%
 *  +5 nếu hành động là "like"
 *  -5 nếu thiếu nguyên liệu quan trọng
 *  -5 nếu hành động là "dislike"
 */
export function instantReward(
  actionType: FeedbackActionType,
  matchRatio: number,
  importantMissing: boolean
): { total: number; details: Record<string, number> } {
  const details: Record<string, number> = {};
  let total = 0;

  // +10 nếu match ≥ 70%
  if (matchRatio >= 0.7) {
    total += 10;
    details["match>=70%"] = 10;
  }

  if (actionType === "like") {
    total += 5;
    details["action:like"] = 5;
  }

  if (actionType === "dislike") {
    total -= 5;
    details["action:dislike"] = -5;
  }

  // -5 nếu thiếu nguyên liệu quan trọng
  if (importantMissing) {
    total -= 5;
    details["importantMissing"] = -5;
  }

  return { total, details };
}

/**
 * Tính reward tổng hợp dựa trên avail + nguyên liệu recipe.
 * Trả về cả số điểm tổng, chi tiết đóng góp, tỷ lệ match và flag thiếu nguyên liệu quan trọng.
 */
export function calculateReward(
  availIngredients: string[],
  recipeIngredients: { name: string }[],
  actionType: FeedbackActionType
): {
  total: number;
  details: Record<string, number>;
  matchRatio: number;
  importantMissing: boolean;
} {
  const { matchRatio, importantMissing } = computeMatch(availIngredients, recipeIngredients);
  const reward = instantReward(actionType, matchRatio, importantMissing);

  return {
    total: reward.total,
    details: reward.details,
    matchRatio,
    importantMissing,
  };
}

export function calculateMatchReward(
  availIngredients: string[],
  recipeIngredients: { name: string }[],
  ratingStats?: { average: number | null; count: number }
): {
  reward: number;
  matchRatio: number;
  importantMissing: boolean;
  ratingBonus: number;
  matched: string[];
  missing: string[];
} {
  const { matchRatio, importantMissing } = computeMatch(
    availIngredients,
    recipeIngredients
  );

  const { matched, missing } = splitIngredients(availIngredients, recipeIngredients);

  const averageRating = ratingStats?.average ?? null;
  const ratingBonus = averageRating ? (averageRating / 5) * 0.2 : 0;
  const baseReward = matchRatio;
  const totalReward = Math.min(1, Number((baseReward + ratingBonus).toFixed(4)));

  return {
    reward: totalReward,
    matchRatio,
    importantMissing,
    ratingBonus,
    matched,
    missing,
  };
}
