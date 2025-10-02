import { Request, Response } from "express";
import axios from "axios";
import { prisma } from "../prismaClient";
import feedbackQueue from "../queue/feedbackQueue";
import Redis from "ioredis";
import { calculateReward, FeedbackActionType } from "../utils/reward";
import { z } from "zod";
import { parseAvailInput, getRecipeIngredients } from "../utils/stateEncoder";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

export async function postFeedback(req: Request, res: Response) {
  try {
    const actionSchema = z
      .enum(["like", "dislike", "choose"])
      .transform((value) => (value === "choose" ? "like" : value));

    const schema = z.object({
      recipeId: z.number(),
      actionType: actionSchema,
      userId: z.number().optional(),
      state: z
        .object({
          avail: z.array(z.string()).optional(),
          history: z.array(z.any()).optional(),
          lastScores: z
            .array(
              z.object({
                recipe_id: z.number(),
                score: z.number().optional(),
              })
            )
            .optional(),
        })
        .optional(),
    });

    const {
      recipeId,
      actionType: normalizedAction,
      state,
      userId,
    } = schema.parse(req.body ?? {});
    const actionType = normalizedAction as FeedbackActionType;

    // --- Parse nguyên liệu user nhập ---
    const availIngredients = parseAvailInput(state?.avail ?? []);

    // --- Lấy nguyên liệu của recipe từ DB ---
    const recipeIngredients = await getRecipeIngredients(Number(recipeId));

    // --- Tính reward cơ bản ---
    let reward = calculateReward(
      availIngredients,
      recipeIngredients,
      actionType
    );

    // --- Check lặp lại bằng Redis ---
    const user_id = userId ?? 1;
    const historyKey = `user:${user_id}:recipe:${recipeId}:count`;
    const repeats = await redis.incr(historyKey);
    await redis.expire(historyKey, 3600);

    if (repeats > 2) {
      reward.total -= 10;
      reward.details["repeatPenalty"] = -10;
    }

    // --- Build next_state với history ---
    const prevHistory = state?.history ?? [];
    const scoreInPrev = state?.lastScores?.find(
      (x: any) => x.recipe_id === recipeId
    )?.score;

    const next_state = {
      avail: availIngredients,
      history: [
        ...prevHistory,
        {
          recipeId,
          actionType,
          reward: reward.total,
          score: scoreInPrev ?? 0, // lưu score mà agent gán cho công thức này
        },
      ],
    };

    // --- Forward sang RL-service ---
    const RL_BASE = process.env.RL_BASE;
    if (RL_BASE) {
      try {
        await axios.post(`${RL_BASE}/feedback`, {
          state, // trạng thái trước hành động
          action: recipeId,
          reward: reward.total,
          next_state, // trạng thái sau hành động (có history mới)
          done: false,
        });
        console.log(
          `✅ Forwarded feedback → RL service (reward=${reward.total})`
        );
      } catch (err: any) {
        console.warn("⚠️ RL feedback forward failed:", err?.message);
      }
    }

    // --- Lưu state vào DB ---
    const dbState = await prisma.state.create({
      data: {
        available_ingredients: availIngredients,
        context: { actionType, history: next_state.history },
        user_id,
      },
    });

    // --- Lưu action ---
    let action = await prisma.action.findFirst({ where: { recipe_id: recipeId } });
    if (!action) {
      action = await prisma.action.create({
        data: {
          recipe_id: recipeId,
          description: `Action for recipe ${recipeId}`,
        },
      });
    }

    // --- Lưu reward ---
    await prisma.reward.create({
      data: {
        user_id,
        state_id: dbState.state_id,
        action_id: action.action_id,
        reward_value: reward.total,
      },
    });

    // --- Push vào queue ---
    await feedbackQueue.add({ recipeId, actionType, reward: reward.total });

    console.log(
      `💾 Feedback saved: recipe=${recipeId}, action=${actionType}, reward=${reward.total}`
    );

    return res.json({
      success: true,
      reward: reward.total,
      details: reward.details,
      repeats,
      next_state,
    });
  } catch (err: any) {
    console.error("❌ postFeedback error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
