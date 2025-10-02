import { prisma } from '../prismaClient';

/**
 * Chuẩn hóa chuỗi nguyên liệu người dùng nhập (tách dấu phẩy, trim).
 * Việc so khớp sẽ được xử lý không phân biệt hoa thường ở các bước sau.
 */
export function parseAvailInput(avail: string[] | string): string[] {
  if (Array.isArray(avail)) return avail.map(s => s.trim()).filter(Boolean);
  return avail.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Lấy danh sách nguyên liệu (tên, qty) của 1 recipe
 */
export async function getRecipeIngredients(recipe_id: number) {
  const rows = await prisma.recipeOnIngredient.findMany({
    where: { recipe_id },
    include: { ingredient: true },
  });
  return rows.map(r => ({
    ingredient_id: r.ingredient_id,
    name: r.ingredient.name,
    qty: r.quantity ?? 1,
  }));
}

/**
 * Tính tỷ lệ khớp nguyên liệu giữa pantry (avail) và recipe
 * - matchRatio: số nguyên liệu trong recipe có mặt trong avail / tổng nguyên liệu recipe
 * - thiếu quan trọng: mặc định coi nguyên liệu đầu danh sách là "quan trọng"
 */
export function computeMatch(avail: string[], recipeIngs: { name: string }[]) {
  const set = new Set(avail.map(x => x.toLowerCase()));   // chuẩn hóa avail
  const total = recipeIngs.length || 1;

  // Đếm số nguyên liệu match
  const matched = recipeIngs.filter(x => set.has(x.name.toLowerCase())).length;
  const matchRatio = matched / total;

  // Check "thiếu nguyên liệu quan trọng"
  const importantMissing =
    recipeIngs.length > 0 && !set.has(recipeIngs[0].name.toLowerCase());

  return { matchRatio, importantMissing };
}

/**
 * Phân loại nguyên liệu: đã có sẵn vs đang thiếu
 */
export function splitIngredients(
  avail: string[],
  recipeIngs: { name: string }[]
): { matched: string[]; missing: string[] } {
  const availSet = new Set(avail.map((x) => x.toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const ing of recipeIngs) {
    if (availSet.has(ing.name.toLowerCase())) {
      matched.push(ing.name);
    } else {
      missing.push(ing.name);
    }
  }

  return { matched, missing };
}

/**
 * Mô phỏng việc sử dụng nguyên liệu sau khi nấu món.
 * Các nguyên liệu khớp với công thức sẽ bị trừ khỏi danh sách hiện có.
 * Để tránh trạng thái rỗng quá sớm, nếu pantry trống sau khi trừ
 * ta giữ lại nguyên liệu đầu tiên trước bước trừ (giả lập còn sót lại một ít).
 */
export function simulateNextPantry(
  avail: string[],
  recipeIngs: { name: string }[]
): { remaining: string[]; exhausted: boolean } {
  const before = [...avail];
  const remaining = [...avail];

  for (const ing of recipeIngs) {
    const index = remaining.findIndex(
      (item) => item.toLowerCase() === ing.name.toLowerCase()
    );
    if (index !== -1) {
      remaining.splice(index, 1);
    }
  }

  const exhausted = remaining.length === 0 && before.length > 0;

  if (exhausted) {
    remaining.push(before[0]);
  }

  return { remaining, exhausted };
}
