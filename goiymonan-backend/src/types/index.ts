// src/types/index.ts

// Ingredient cơ bản
export type Ingredient = {
    ingredient_id: number;
    name: string;
    unit?: string;
};

// Recipe
export type Recipe = {
    recipe_id: number;
    name: string;
    description?: string;
    instructions?: string;
    created_at?: string;
};

// Trạng thái RL
export type RLHistoryItem = {
    recipe_id: number;
    name?: string;
    reward?: number;
    match_ratio?: number;
    at?: string;
};

export type RLState = {
    avail: string[];   // nguyên liệu có sẵn
    miss: string[];    // nguyên liệu thiếu
    history?: RLHistoryItem[]; // lịch sử hành động
};

// Kết quả gợi ý
export type PredictItem = {
    recipe_id: number;
    score: number;
};

export type PredictResponse = {
    recommendations: PredictItem[];
    epsilon: number;
    chosen?: number | null;
};

// Feedback request
export type UserFeedbackRequest = {
    recipeId: number;
    actionType: 'like' | 'dislike';
    userId?: number;
};

export type RLFeedbackRequest = {
    state: Record<string, unknown>;
    action: number;
    reward: number;
    next_state: Record<string, unknown>;
    done: boolean;
};
