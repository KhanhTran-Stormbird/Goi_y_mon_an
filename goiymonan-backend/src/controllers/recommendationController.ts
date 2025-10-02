import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../prismaClient";
import { computeMatch, parseAvailInput } from "../utils/stateEncoder";

export async function postRecommend(req: Request, res: Response) {
  const { state, k = 5 } = req.body ?? {};
  if (!state) return res.status(400).json({ message: "state is required" });

  const avail = parseAvailInput(state.avail ?? []);         // ['thịt bò', ...] (đã normalize)
  const availSet = new Set(avail.map((s: string) => s.toLowerCase()));
  const RL_BASE = process.env.RL_BASE;

  // 1) Lấy danh sách recipes rồi lọc theo nguyên liệu có trong avail
  const allRecipes = await prisma.recipe.findMany({
    include: { ingredients: { include: { ingredient: true } } },
  });

  const filtered = allRecipes.filter((r) =>
    r.ingredients.some((ri) => availSet.has(ri.ingredient.name.toLowerCase()))
  );

  if (!filtered.length) {
    return res.json({
      chosen_id: null,
      alternatives: [],
      epsilon: 1,
      total_candidates: 0,
      message: "Không tìm thấy công thức phù hợp",
    });
  }

  // 2) Gửi sang RL-service
  if (RL_BASE) {
    try {
      const { data } = await axios.post(`${RL_BASE}/predict`, {
        state: { avail, miss: [], history: state.history ?? [] },
        k,
        possible_actions: filtered.map((r) => r.recipe_id),
      });

      console.log("📤 RL-service response:", JSON.stringify(data, null, 2));
      if (data?.chosen) {
        const chosenRecipe = await prisma.recipe.findUnique({
          where: { recipe_id: data.chosen },
          include: { ingredients: { include: { ingredient: true } } },
        });

        if (chosenRecipe) {
          return res.json({
            chosen: chosenRecipe,
            epsilon: data.epsilon,
          });
        }
      }
    } catch (e: any) {
      console.warn("⚠️ RL service unreachable:", e?.message);
    }
  }

  // Fallback: chọn recipe có match cao nhất
  let bestRecipe = filtered[0];
  let bestScore = 0;

  for (const recipe of filtered) {
    const { matchRatio } = computeMatch(
      avail,
      recipe.ingredients.map((ri) => ({ name: ri.ingredient.name }))
    );
    if (matchRatio >= bestScore) {
      bestScore = matchRatio;
      bestRecipe = recipe;
    }
  }

  const detailedRecipe = await prisma.recipe.findUnique({
    where: { recipe_id: bestRecipe.recipe_id },
    include: { ingredients: { include: { ingredient: true } } },
  });

  return res.json({
    chosen: detailedRecipe,
    epsilon: 1,
    message: "Fallback recommendation (RL service offline)",
  });
}
