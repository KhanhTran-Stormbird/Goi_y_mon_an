export type Ingredient = {
    ingredient_id: number;
    name: string;
    unit?: string;
    quantity: number;
};

export type Recipe = {
    recipe_id: number;
    name: string;
    description?: string;
    instructions?: string;
    ingredients?: Ingredient[];
};
