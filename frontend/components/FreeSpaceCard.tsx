"use client";

export default function FreeSpaceCard({ status, loading, className }: any) {
  if (loading) {
    return (
      <div className={`w-full h-full rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm ${className}`} />
    );
  }

  return (
    <div
      className={`w-full h-full rounded-[2rem] bg-gradient-to-br ${status.bgGradient} shadow-xl transition-all duration-700 ${className}`}
    />
  );
}