"use client";
import dynamic from 'next/dynamic';
import WeatherBadge from '@/components/WeatherBadge';
import { ShieldCheck, Navigation } from 'lucide-react';

const MapPreview = dynamic(() => import('@/components/MapPreview'), {
  ssr: false,
  loading: () => <div className="h-[600px] bg-slate-200 animate-pulse rounded-[3rem]" />
});

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      {/* Dynamic Header */}
      <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-[1001] border-b border-slate-100 py-6 px-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Navigation size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">SAFE-RUN PH</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metro Manila Live Data</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8 md:p-16 space-y-20">
        
        {/* Status Dashboard */}
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <WeatherBadge />
          </div>
          <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <ShieldCheck size={28} className="text-blue-600 mb-4" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Safe Routes.</h3>
            <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed">
              We monitor reported dog packs, broken lights, and road works to ensure your run is hazard-free.
            </p>
          </div>
        </section>

        {/* Hazard Map */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Hazard Map</h2>
              <p className="text-lg text-slate-400 font-medium italic">Showing active alerts near BGC, Makati, and QC.</p>
            </div>
            <p className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full uppercase tracking-widest border border-blue-100">
              Updated Real-Time
            </p>
          </div>
          
          <MapPreview />
        </section>
      </div>

      <footer className="py-20 text-center border-t border-slate-100 bg-white mt-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">Run Boldly • Manila 2026</p>
      </footer>
    </main>
  );
}