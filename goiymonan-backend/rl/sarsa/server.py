from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List
import psycopg2
import psycopg2.extras
from agent import QLearningAgent

# =====================
# Config Postgres
# =====================
DB_CONFIG = {
    "user": "app",
    "password": "pass",
    "host": "db",      # service name trong docker-compose
    "port": 5432,
    "database": "recipes"
}

def get_connection():
    try:
        return psycopg2.connect(
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            cursor_factory=psycopg2.extras.DictCursor
        )
    except Exception as e:
        print("❌ DB connection error:", e)
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")

def get_all_recipes() -> List[int]:
    """Lấy tất cả recipe_id"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute('SELECT "recipe_id" FROM "Recipe"')
        rows = cur.fetchall()
        conn.close()
        if not rows:
            raise HTTPException(status_code=404, detail="No recipes found in database")
        return [row[0] for row in rows]
    except Exception as e:
        print("❌ Error fetching recipes:", e)
        raise HTTPException(status_code=500, detail=f"Error fetching recipes: {e}")

def get_recipe_with_ingredients(recipe_id: int) -> Dict[str, Any]:
    """Lấy 1 công thức + nguyên liệu"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            'SELECT "recipe_id", "name", "description" FROM "Recipe" WHERE "recipe_id" = %s',
            (recipe_id,)
        )
        recipe_row = cur.fetchone()
        if not recipe_row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Recipe {recipe_id} not found")

        recipe = {
            "recipe_id": recipe_row[0],
            "name": recipe_row[1],
            "description": recipe_row[2]
        }

        cur.execute(
            '''
            SELECT i."ingredient_id", i."name", roi."quantity"
            FROM "RecipeOnIngredient" roi
            JOIN "Ingredient" i ON roi."ingredient_id" = i."ingredient_id"
            WHERE roi."recipe_id" = %s
            ''',
            (recipe_id,)
        )
        rows = cur.fetchall()
        conn.close()

        ingredients = [
            {"ingredient_id": r[0], "name": r[1], "quantity": float(r[2]) if r[2] else 1.0}
            for r in rows
        ]
        recipe["ingredients"] = ingredients
        return recipe
    except Exception as e:
        print("❌ Error fetching recipe with ingredients:", e)
        raise HTTPException(status_code=500, detail=f"Error fetching recipe with ingredients: {e}")

# =====================
# Q-Learning Agent
# =====================
agent = QLearningAgent(
    alpha=0.1,
    gamma=0.9,
    epsilon=1.0,
    min_epsilon=0.01,
    decay_rate=0.001
)

# =====================
# FastAPI
# =====================
app = FastAPI(
    title="Reinforcement Learning API",
    description="API phục vụ Q-Learning agent cho hệ gợi ý món ăn",
    version="1.0.0"
)

# -------- Models --------
class PredictIn(BaseModel):
    state: Dict[str, Any]
    k: int = 3
    possible_actions: List[int] | None = None

class FeedbackIn(BaseModel):
    state: Dict[str, Any]
    action: int
    reward: float
    next_state: Dict[str, Any]
    done: bool

# -------- Routes --------
@app.post("/predict", tags=["RL"])
def predict(payload: PredictIn):
    try:
        state = payload.state
        k = payload.k
        actions = payload.possible_actions or get_all_recipes()

        chosen_action = agent.choose_action(state, actions)

        scored = [(rid, agent.get_q(state, rid)) for rid in actions]
        scored.sort(key=lambda x: x[1], reverse=True)
        top_k = [{"recipe_id": rid, "score": score} for rid, score in scored[:k]]

        return {
            "recommendations": top_k,
            "chosen": chosen_action,
            "epsilon": agent.epsilon
        }
    except Exception as e:
        print("❌ Error in /predict:", e)
        raise HTTPException(status_code=500, detail=f"Internal error in /predict: {e}")

@app.post("/feedback", tags=["RL"])
def feedback(payload: FeedbackIn):
    try:
        all_recipes = get_all_recipes()

        # Cập nhật Q-table
        new_q = agent.learn(
            payload.state,
            payload.action,
            payload.reward,   # dùng reward thực tế truyền vào
            payload.next_state,
            all_recipes
        )

        # Giảm epsilon dần
        agent.update_epsilon(episode=1)

        print(f"✅ Feedback processed: action={payload.action}, reward={payload.reward}, newQ={new_q}")
        return {"success": True, "newQ": new_q}
    except Exception as e:
        print("❌ Error in /feedback:", e)
        raise HTTPException(status_code=500, detail=f"Internal error in /feedback: {e}")

@app.get("/recipes", summary="Lấy danh sách recipe_id (ngắn gọn)", tags=["Recipes"])
def list_recipe_ids():
    return {"recipe_ids": get_all_recipes()}

@app.get("/recipes/{recipe_id}", summary="Lấy công thức kèm nguyên liệu", tags=["Recipes"])
def recipe_detail(recipe_id: int):
    return get_recipe_with_ingredients(recipe_id)
