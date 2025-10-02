import React from "react";

export default function Loader({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-md">
      <div className="h-5 w-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-700">{label ?? "Loading..."}</span>
    </div>
  );
}
