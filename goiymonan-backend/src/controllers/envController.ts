import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { parseAvailInput, simulateNextPantry } from "../utils/stateEncoder";
import { calculateMatchReward } from "../utils/reward";

const DEFAULT_USER_ID = 1;

function inferMealTime(date = new Date()): "Ăn sáng" | "Ăn trưa" | "Ăn tối" {
  const hour = date.getHours();
  if (hour < 8) return "Ăn sáng";
  if (hour < 16) return "Ăn trưa";
  return "Ăn tối";
}

const resetSchema = z.object({
  available_ingredients: z.array(z.string()).optional(),
  avail: z.union([z.array(z.string()), z.string()]).optional(),
  availableIngredients: z.union([z.array(z.string()), z.string()]).optional(),
  context: z.record(z.any()).optional(),
  meal_time: z.string().optional(),
  user_id: z.number().optional(),
  userId: z.number().optional(),
});

export async function resetEnvironment(req: Request, res: Response) {
  try {
    const parsed = resetSchema.parse(req.body ?? {});

    const rawAvail =
      parsed.available_ingredients ??
      parsed.avail ??
      parsed.availableIngredients ??
      [];

    const available = parseAvailInput(rawAvail ?? []);
    const userId = parsed.user_id ?? parsed.userId ?? DEFAULT_USER_ID;

    const baseContext: Record<string, unknown> = { ...(parsed.context ?? {}) };
    if (parsed.meal_time) {
      baseContext["meal_time"] = parsed.meal_time;
    } else if (!("meal_time" in baseContext)) {
      baseContext["meal_time"] = inferMealTime();
    }

    const state = await prisma.state.create({
      data: {
        user_id: userId,
        available_ingredients: available,
        context: { ...baseContext, history: [] },
      },
    });

    return res.json({
      state_id: state.state_id,
      user_id: userId,
      available_ingredients: available,
      context: state.context,
      message: "Environment reset thành công",
    });
  } catch (err: any) {
    console.error("❌ resetEnvironment error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Payload không hợp lệ",
        issues: err.errors,
      });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

const stepSchema = z.object({
  state_id: z.number().optional(),
  stateId: z.number().optional(),
  action_id: z.number().optional(),
  actionId: z.number().optional(),
  user_id: z.number().optional(),
  userId: z.number().optional(),
  context: z.record(z.any()).optional(),
});

export async function stepEnvironment(req: Request, res: Response) {
  try {
    const parsed = stepSchema.parse(req.body ?? {});

    const stateId = parsed.state_id ?? parsed.stateId;
    const actionId = parsed.action_id ?? parsed.actionId;
    const userId = parsed.user_id ?? parsed.userId ?? DEFAULT_USER_ID;

    if (!stateId || !actionId) {
      return res.status(400).json({
        message: "state_id và action_id là bắt buộc",
      });
    }

    const state = await prisma.state.findUnique({
      where: { state_id: stateId },
    });

    if (!state) {
      return res.status(404).json({ message: `State ${stateId} không tồn tại` });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { recipe_id: actionId },
      include: {
        ingredients: { include: { ingredient: true } },
        reviews: true,
      },
    });

    if (!recipe) {
      return res.status(404).json({ message: `Recipe ${actionId} không tồn tại` });
    }

    const currentAvail = parseAvailInput(
      (state.available_ingredients as string[] | string | null) ?? []
    );

    const recipeIngredients = recipe.ingredients.map((ri) => ({
      ingredient_id: ri.ingredient_id,
      name: ri.ingredient.name,
      quantity: ri.quantity ?? null,
    }));

    const ratingCount = recipe.reviews.length;
    const averageRating =
      ratingCount > 0
        ? recipe.reviews.reduce((acc, item) => acc + item.rating, 0) /
          ratingCount
        : null;

    const rewardSummary = calculateMatchReward(
      currentAvail,
      recipeIngredients.map((item) => ({ name: item.name })),
      { average: averageRating, count: ratingCount }
    );

    const { remaining: nextAvail, exhausted } = simulateNextPantry(
      currentAvail,
      recipeIngredients.map((item) => ({ name: item.name }))
    );

    const done = exhausted;

    const prevContext = (state.context ?? {}) as Record<string, unknown>;
    const history = Array.isArray((prevContext as any).history)
      ? ([...(prevContext as any).history] as any[])
      : [];

    const newHistoryEntry = {
      recipe_id: recipe.recipe_id,
      name: recipe.name,
      reward: rewardSummary.reward,
      match_ratio: rewardSummary.matchRatio,
      at: new Date().toISOString(),
    };

    history.push(newHistoryEntry);

    const mergedContext = {
      ...prevContext,
      ...parsed.context,
      history,
    };

    const nextState = await prisma.state.create({
      data: {
        user_id: userId,
        available_ingredients: nextAvail,
        context: mergedContext,
      },
    });

    let action = await prisma.action.findFirst({
      where: { recipe_id: recipe.recipe_id },
    });

    if (!action) {
      action = await prisma.action.create({
        data: {
          recipe_id: recipe.recipe_id,
          description: `Cook ${recipe.name}`,
        },
      });
    }

    await prisma.reward.create({
      data: {
        user_id: userId,
        state_id: state.state_id,
        action_id: action.action_id,
        reward_value: rewardSummary.reward,
      },
    });

    return res.json({
      state_id: state.state_id,
      action_id: recipe.recipe_id,
      reward: rewardSummary.reward,
      details: {
        match_ratio: rewardSummary.matchRatio,
        rating_bonus: rewardSummary.ratingBonus,
        important_missing: rewardSummary.importantMissing,
        average_rating: averageRating,
        rating_count: ratingCount,
      },
      matched_ingredients: rewardSummary.matched,
      missing_ingredients: rewardSummary.missing,
      next_state: {
        state_id: nextState.state_id,
        available_ingredients: nextAvail,
        context: nextState.context,
        done,
      },
      done,
    });
  } catch (err: any) {
    console.error("❌ stepEnvironment error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Payload không hợp lệ",
        issues: err.errors,
      });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
