"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Recipe } from "@/types/recipe";
import RecipeCard from "@/components/RecipeCard";
import SwipeDeck from "@/components/SwipeDeck";
import { api } from "@/lib/api";

type RewardInfo = {
  reward: number;
  matchRatio: number;
  ratingBonus: number;
  missing: string[];
};

export default function RecommendPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [current, setCurrent] = useState<Recipe | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateContext, setStateContext] = useState<Record<string, unknown> | null>(null);
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const stepLockRef = useRef<number | null>(null);

  useEffect(() => {
    const rawIng = sessionStorage.getItem("ingredients");
    const rawRec = sessionStorage.getItem("currentRec");
    const rawStateId = sessionStorage.getItem("stateId");
    const rawContext = sessionStorage.getItem("stateContext");

    if (rawIng) setIngredients(JSON.parse(rawIng));
    if (rawRec) setCurrent(JSON.parse(rawRec));
    if (rawStateId) setStateId(Number(rawStateId));
    if (rawContext) setStateContext(JSON.parse(rawContext));
  }, []);

  const getHistory = useCallback(() => {
    const maybeHistory = (stateContext as { history?: unknown[] } | null)?.history;
    return Array.isArray(maybeHistory) ? maybeHistory : [];
  }, [stateContext]);

  const fetchNext = useCallback(async () => {
    if (!stateId || ingredients.length === 0) return;

    const res = await api.post("/recommendations", {
      state: {
        avail: ingredients,
        history: getHistory(),
      },
      k: 6,
    });

    const next: Recipe | null = res.data?.chosen ?? null;
    setRewardInfo(null);

    if (next) {
      sessionStorage.setItem("currentRec", JSON.stringify(next));
      stepLockRef.current = null;
      setCurrent(next);
    } else {
      sessionStorage.removeItem("currentRec");
      setCurrent(null);
    }
  }, [getHistory, ingredients, stateId]);

  useEffect(() => {
    async function advanceEnvironment() {
      if (!current || !stateId) return;
      if (stepLockRef.current === current.recipe_id) return;

      try {
        const { data } = await api.post("/env/step", {
          state_id: stateId,
          action_id: current.recipe_id,
        });

        stepLockRef.current = current.recipe_id;

        const nextState = data?.next_state;
        if (nextState?.state_id) {
          setStateId(nextState.state_id);
          sessionStorage.setItem("stateId", nextState.state_id.toString());
        }
        if (Array.isArray(nextState?.available_ingredients)) {
          setIngredients(nextState.available_ingredients);
          sessionStorage.setItem(
            "ingredients",
            JSON.stringify(nextState.available_ingredients)
          );
        }
        if (nextState?.context) {
          setStateContext(nextState.context as Record<string, unknown>);
          sessionStorage.setItem(
            "stateContext",
            JSON.stringify(nextState.context)
          );
        }

        setRewardInfo({
          reward: data?.reward ?? 0,
          matchRatio: data?.details?.match_ratio ?? 0,
          ratingBonus: data?.details?.rating_bonus ?? 0,
          missing: data?.missing_ingredients ?? [],
        });
      } catch (error) {
        console.error("env/step failed", error);
      }
    }

    advanceEnvironment();
  }, [current, stateId]);

  async function handleDislike(recipe: Recipe) {
    if (!stateId) return;

    await api.post("/feedback", {
      recipeId: recipe.recipe_id,
      actionType: "dislike",
      userId: 1,
      state: {
        avail: ingredients,
        history: getHistory(),
      },
    });

    setRewardInfo(null);
    await fetchNext();
  }

  function handleLike(recipe: Recipe) {
    api
      .post("/feedback", {
        recipeId: recipe.recipe_id,
        actionType: "like",
        userId: 1,
        state: {
          avail: ingredients,
          history: getHistory(),
        },
      })
      .catch(() => {});
    router.push(`/recipe/${recipe.recipe_id}`);
  }

  return (
    <div className="container py-5 text-center">
      <h2 className="mb-4">
        🎯 Gợi ý cho: {ingredients.length ? ingredients.join(", ") : "—"}
      </h2>

      <div className="mb-3">
        <button className="btn btn-secondary" onClick={() => router.push("/")}>
          ⬅️ Quay lại nhập nguyên liệu
        </button>
      </div>

      {current ? (
        <SwipeDeck
          items={[current]}
          renderCard={(r) => <RecipeCard recipe={r} />}
          onDislike={handleDislike}
          onLike={handleLike}
        />
      ) : (
        <p>Chưa có gợi ý. Vui lòng quay lại trang chủ và nhập nguyên liệu.</p>
      )}

      {rewardInfo && (
        <div
          className="alert alert-info mt-4 text-start mx-auto"
          style={{ maxWidth: 480 }}
        >
          <p className="mb-1">
            <strong>Reward:</strong> {rewardInfo.reward.toFixed(2)}
          </p>
          <p className="mb-1">
            <strong>Tỷ lệ khớp:</strong> {(rewardInfo.matchRatio * 100).toFixed(0)}%
          </p>
          {rewardInfo.ratingBonus > 0 && (
            <p className="mb-1">
              <strong>Điểm cộng từ rating:</strong> +
              {rewardInfo.ratingBonus.toFixed(2)}
            </p>
          )}
          {rewardInfo.missing.length > 0 && (
            <p className="mb-0">
              <strong>Thiếu:</strong> {rewardInfo.missing.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
