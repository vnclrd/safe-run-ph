"use client";
import { Gauge } from "lucide-react";

interface RunAbilityProps {
  loading: boolean;
  status: { label: string; bgGradient: string };
  runScore: string;
  shortAdvice: string;
}

export default function RunAbility({ loading, status, runScore, shortAdvice }: RunAbilityProps) {
  if (loading) return <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />;

  return (
    <div className={`w-full h-75 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br ${status.bgGradient} text-white shadow-xl relative overflow-hidden transition-all duration-700 flex flex-col justify-between`}>
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 opacity-80 mb-2">
          <Gauge size={12} strokeWidth={3} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">RunAbility Score</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-4">
        <h2 className="text-6xl sm:text-7xl font-black italic tracking-tighter drop-shadow-md">{runScore}</h2>
        <div className="w-full h-2 bg-white/20 rounded-full mt-4 overflow-hidden border border-white/10">
          <div 
            className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            style={{ width: `${(parseFloat(runScore) / 10) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 flex justify-between items-end">
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
          <p className="text-lg font-black italic uppercase leading-none">{status.label}</p>
        </div>
        <p className="text-[10px] font-bold opacity-80 max-w-[150px] text-right leading-tight italic">
          {shortAdvice}
        </p>
      </div>
      
      <Gauge size={180} className="absolute -bottom-10 -right-10 opacity-10 rotate-12 pointer-events-none" strokeWidth={1} />
    </div>
  );
}