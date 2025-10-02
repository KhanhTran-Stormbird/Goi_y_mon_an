"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Recipe } from "@/types/recipe";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    async function fetchRecipe() {
      const res = await api.get(`/recipes/${id}`);
      setRecipe(res.data);
    }
    fetchRecipe();
  }, [id]);

  if (!recipe) return <p className="text-center">Đang tải...</p>;

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4">
        <h2 className="text-primary">{recipe.name}</h2>
        {recipe.description && (
          <p className="text-muted">{recipe.description}</p>
        )}

        <h4 className="mt-3">📋 Nguyên liệu</h4>
        <ul>
          {(recipe.ingredients ?? []).map((ing) => (
            <li key={ing.ingredient_id}>
              {ing.quantity} {ing.unit ?? ""} {ing.name}
            </li>
          ))}
        </ul>

        {recipe.instructions && (
          <>
            <h4 className="mt-3">👨‍🍳 Cách nấu</h4>
            <p>{recipe.instructions}</p>
          </>
        )}
      </div>
    </div>
  );
}
