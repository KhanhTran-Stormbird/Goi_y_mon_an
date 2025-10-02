/*
  Warnings:

  - The primary key for the `Ingredient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Ingredient` table. All the data in the column will be lost.
  - The primary key for the `Recipe` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Recipe` table. All the data in the column will be lost.
  - The primary key for the `RecipeOnIngredient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `RecipeOnIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `ingredientId` on the `RecipeOnIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `RecipeOnIngredient` table. All the data in the column will be lost.
  - You are about to drop the column `recipeId` on the `RecipeOnIngredient` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserIngredient` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ingredient_id` to the `RecipeOnIngredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipe_id` to the `RecipeOnIngredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_userId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeOnIngredient" DROP CONSTRAINT "RecipeOnIngredient_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeOnIngredient" DROP CONSTRAINT "RecipeOnIngredient_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "UserIngredient" DROP CONSTRAINT "UserIngredient_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "UserIngredient" DROP CONSTRAINT "UserIngredient_userId_fkey";

-- DropIndex
DROP INDEX "Ingredient_name_key";

-- DropIndex
DROP INDEX "RecipeOnIngredient_recipeId_ingredientId_key";

-- AlterTable
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_pkey",
DROP COLUMN "id",
ADD COLUMN     "ingredient_id" SERIAL NOT NULL,
ADD COLUMN     "unit" TEXT,
ADD CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("ingredient_id");

-- AlterTable
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "author_id" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "recipe_id" SERIAL NOT NULL,
ADD CONSTRAINT "Recipe_pkey" PRIMARY KEY ("recipe_id");

-- AlterTable
ALTER TABLE "RecipeOnIngredient" DROP CONSTRAINT "RecipeOnIngredient_pkey",
DROP COLUMN "id",
DROP COLUMN "ingredientId",
DROP COLUMN "qty",
DROP COLUMN "recipeId",
ADD COLUMN     "ingredient_id" INTEGER NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "recipe_id" INTEGER NOT NULL,
ADD CONSTRAINT "RecipeOnIngredient_pkey" PRIMARY KEY ("recipe_id", "ingredient_id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "preferences",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- DropTable
DROP TABLE "History";

-- DropTable
DROP TABLE "UserIngredient";

-- CreateTable
CREATE TABLE "Action" (
    "action_id" SERIAL NOT NULL,
    "description" TEXT,
    "recipe_id" INTEGER,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("action_id")
);

-- CreateTable
CREATE TABLE "State" (
    "state_id" SERIAL NOT NULL,
    "available_ingredients" JSONB,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER,

    CONSTRAINT "State_pkey" PRIMARY KEY ("state_id")
);

-- CreateTable
CREATE TABLE "QTable" (
    "q_id" SERIAL NOT NULL,
    "q_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state_id" INTEGER NOT NULL,
    "action_id" INTEGER NOT NULL,

    CONSTRAINT "QTable_pkey" PRIMARY KEY ("q_id")
);

-- CreateTable
CREATE TABLE "Review" (
    "review_id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "reward_id" SERIAL NOT NULL,
    "reward_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state_id" INTEGER NOT NULL,
    "action_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("reward_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QTable_state_id_action_id_key" ON "QTable"("state_id", "action_id");

-- CreateIndex
CREATE UNIQUE INDEX "Review_user_id_recipe_id_key" ON "Review"("user_id", "recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOnIngredient" ADD CONSTRAINT "RecipeOnIngredient_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("recipe_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeOnIngredient" ADD CONSTRAINT "RecipeOnIngredient_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "Ingredient"("ingredient_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("recipe_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "State" ADD CONSTRAINT "State_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QTable" ADD CONSTRAINT "QTable_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "State"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QTable" ADD CONSTRAINT "QTable_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "Action"("action_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "Recipe"("recipe_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "State"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "Action"("action_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
