"use client";

import { Recipe } from "@/types/recipe";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title text-primary">{recipe.name}</h5>
        {recipe.description && (
          <p className="card-text text-muted">{recipe.description}</p>
        )}
      </div>
    </div>
  );
}
