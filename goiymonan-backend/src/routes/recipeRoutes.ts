import { Router } from "express";
import { getRecipeDetail, listRecipes } from "../controllers/recipeController";

const router = Router();
router.get("/", listRecipes);
router.get("/:id", getRecipeDetail);

export default router;
