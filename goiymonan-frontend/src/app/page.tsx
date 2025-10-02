"use client";
import InputForm from "@/components/InputForm";

export default function HomePage() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100">
      <h1 className="mb-4 text-primary">🍳 Gợi ý món ăn</h1>
      <InputForm />
    </div>
  );
}
