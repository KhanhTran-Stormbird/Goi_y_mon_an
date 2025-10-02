import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export async function listRecipes(_req: Request, res: Response) {
    const recipes = await prisma.recipe.findMany({
        orderBy: { recipe_id: 'asc' },
        include: { ingredients: { include: { ingredient: true } } },
    });

    const payload = recipes.map((recipe) => ({
        recipe_id: recipe.recipe_id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients.map((ri) => ({
            ingredient_id: ri.ingredient_id,
            name: ri.ingredient.name,
            unit: ri.ingredient.unit ?? null,
            quantity: ri.quantity ?? null,
        })),
    }));

    return res.json({
        total: payload.length,
        recipes: payload,
    });
}

export async function getRecipeDetail(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid recipe id" });

    const recipe = await prisma.recipe.findUnique({
        where: { recipe_id: id },
        include: { ingredients: { include: { ingredient: true } } },
    });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    return res.json({
        recipe_id: recipe.recipe_id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients.map((ri) => ({
            ingredient_id: ri.ingredient_id,
            name: ri.ingredient.name,
            unit: ri.ingredient.unit ?? null,
            quantity: ri.quantity ?? null,
        })),
    });
}
