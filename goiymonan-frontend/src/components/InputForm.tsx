"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Recipe } from "@/types/recipe";

export default function InputForm() {
  const [ingredientsText, setIngredientsText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const avail = ingredientsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (avail.length === 0) return;

    setLoading(true);
    try {
      const mealTime = (() => {
        const hour = new Date().getHours();
        if (hour < 8) return "Ăn sáng";
        if (hour < 16) return "Ăn trưa";
        return "Ăn tối";
      })();

      const resetRes = await api.post("/env/reset", {
        available_ingredients: avail,
        context: { meal_time: mealTime },
      });

      const stateId: number | undefined = resetRes.data?.state_id;
      const resetContext = resetRes.data?.context ?? {};

      const res = await api.post("/recommendations", {
        state: { avail, history: [] },
        k: 6,
      });

      // Lưu ingredients & chosen xuống sessionStorage cho trang /recommend dùng
      const chosen: Recipe | null = res.data?.chosen ?? null;
      sessionStorage.setItem("ingredients", JSON.stringify(avail));
      if (stateId) sessionStorage.setItem("stateId", stateId.toString());
      sessionStorage.setItem("stateContext", JSON.stringify(resetContext));
      if (chosen) {
        sessionStorage.setItem("currentRec", JSON.stringify(chosen));
      } else {
        sessionStorage.removeItem("currentRec");
      }

      // Điều hướng sang trang gợi ý
      router.push("/recommend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card shadow p-4"
      style={{ width: "100%", maxWidth: "500px" }}
    >
      <div className="mb-3">
        <label className="form-label fw-bold">Nhập nguyên liệu bạn có</label>
        <input
          type="text"
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder="Ví dụ: Hành lá, Tôm"
          className="form-control"
        />
      </div>
      <button
        type="submit"
        className="btn btn-success w-100"
        disabled={loading}
      >
        {loading ? "Đang lấy gợi ý..." : "🔍 Tìm món ăn"}
      </button>
    </form>
  );
}
