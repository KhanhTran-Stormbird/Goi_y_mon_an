import { PrismaClient, Ingredient, Recipe, User } from "@prisma/client";
const prisma = new PrismaClient();

async function seed() {
  // 🔥 Reset toàn bộ DB, ID quay lại từ 1
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Reward",
      "QTable",
      "State",
      "Review",
      "Action",
      "RecipeOnIngredient",
      "Ingredient",
      "Recipe",
      "User"
    RESTART IDENTITY CASCADE
  `);

  // User duy nhất
  const user: User = await prisma.user.create({
    data: {
      username: "default_user",
      email: "default@example.com",
      password: "local_only",
    },
  });

  // Nguyên liệu
  const ingNames = [
    "Thịt bò",
    "Bánh phở",
    "Hành lá",
    "Trứng gà",
    "Dầu ăn",
    "Xà lách",
    "Cà chua",
    "Dầu olive",
    "Đậu phụ",
    "Mì gói",
    "Tôm",
    "Thịt gà",
    "Khoai tây",
    "Cà rốt",
    "Nấm rơm",
  ];

  const ingObjs: Ingredient[] = await Promise.all(
    ingNames.map((n) =>
      prisma.ingredient.create({ data: { name: n, unit: "gram" } })
    )
  );

  const getIng = (name: string) => {
    const ing = ingObjs.find((i) => i.name === name);
    if (!ing) throw new Error(`❌ Ingredient ${name} not found`);
    return ing;
  };

  // Danh sách công thức (≥10)
  const recipesData = [
    {
      name: "Phở bò",
      description: "Món phở truyền thống Việt Nam",
      instructions: "Nấu nước dùng từ xương bò, chần bánh phở, thêm thịt bò và rau thơm.",
      ingredients: [
        { ingredient_id: getIng("Thịt bò").ingredient_id, quantity: 200 },
        { ingredient_id: getIng("Bánh phở").ingredient_id, quantity: 200 },
        { ingredient_id: getIng("Hành lá").ingredient_id, quantity: 3 },
      ],
    },
    {
      name: "Trứng ốp la",
      description: "Món ăn sáng nhanh gọn",
      instructions: "Đập trứng vào chảo dầu nóng, rắc muối tiêu, chiên vừa chín.",
      ingredients: [
        { ingredient_id: getIng("Trứng gà").ingredient_id, quantity: 2 },
        { ingredient_id: getIng("Dầu ăn").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Salad rau củ",
      description: "Món ăn eat-clean đơn giản",
      instructions: "Cắt nhỏ rau củ, trộn với dầu olive và muối tiêu.",
      ingredients: [
        { ingredient_id: getIng("Xà lách").ingredient_id, quantity: 2 },
        { ingredient_id: getIng("Cà chua").ingredient_id, quantity: 1 },
        { ingredient_id: getIng("Dầu olive").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Đậu phụ chiên",
      description: "Món chay đơn giản",
      instructions: "Cắt đậu phụ, chiên vàng giòn.",
      ingredients: [
        { ingredient_id: getIng("Đậu phụ").ingredient_id, quantity: 2 },
        { ingredient_id: getIng("Dầu ăn").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Mì xào tôm",
      description: "Món mì nhanh gọn",
      instructions: "Luộc mì, xào với tôm, cà rốt và hành.",
      ingredients: [
        { ingredient_id: getIng("Mì gói").ingredient_id, quantity: 1 },
        { ingredient_id: getIng("Tôm").ingredient_id, quantity: 100 },
        { ingredient_id: getIng("Cà rốt").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Cơm gà",
      description: "Cơm gà truyền thống",
      instructions: "Luộc gà, nấu cơm từ nước luộc gà, chặt gà ăn kèm.",
      ingredients: [
        { ingredient_id: getIng("Thịt gà").ingredient_id, quantity: 200 },
        { ingredient_id: getIng("Hành lá").ingredient_id, quantity: 2 },
        { ingredient_id: getIng("Cà rốt").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Khoai tây chiên",
      description: "Món ăn vặt khoái khẩu",
      instructions: "Gọt khoai, thái sợi, chiên vàng giòn.",
      ingredients: [
        { ingredient_id: getIng("Khoai tây").ingredient_id, quantity: 2 },
        { ingredient_id: getIng("Dầu ăn").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Canh nấm chay",
      description: "Món canh thanh đạm",
      instructions: "Nấu nấm rơm với cà rốt và hành.",
      ingredients: [
        { ingredient_id: getIng("Nấm rơm").ingredient_id, quantity: 100 },
        { ingredient_id: getIng("Cà rốt").ingredient_id, quantity: 1 },
        { ingredient_id: getIng("Hành lá").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Tôm rim",
      description: "Món mặn ăn cơm",
      instructions: "Rim tôm với tỏi, hành, nước mắm và đường.",
      ingredients: [
        { ingredient_id: getIng("Tôm").ingredient_id, quantity: 150 },
        { ingredient_id: getIng("Hành lá").ingredient_id, quantity: 1 },
      ],
    },
    {
      name: "Gà xào nấm",
      description: "Món ăn đậm đà",
      instructions: "Xào thịt gà với nấm rơm, cà rốt và hành.",
      ingredients: [
        { ingredient_id: getIng("Thịt gà").ingredient_id, quantity: 200 },
        { ingredient_id: getIng("Nấm rơm").ingredient_id, quantity: 100 },
        { ingredient_id: getIng("Cà rốt").ingredient_id, quantity: 1 },
      ],
    },
  ];

  const recipes: Recipe[] = [];
  for (const r of recipesData) {
    const recipe = await prisma.recipe.create({
      data: {
        name: r.name,
        description: r.description,
        instructions: r.instructions,
        author_id: user.user_id,
      },
    });
    recipes.push(recipe);

    await prisma.recipeOnIngredient.createMany({
      data: r.ingredients.map((i) => ({
        recipe_id: recipe.recipe_id,
        ingredient_id: i.ingredient_id,
        quantity: i.quantity,
      })),
    });
  }

  console.log("✅ Seed thành công (10 công thức, reset ID = 1)");
}

seed()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
