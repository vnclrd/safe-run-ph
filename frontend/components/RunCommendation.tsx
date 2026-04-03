"use client";

interface RunCommendationProps {
  recommendation: { title: string; message: string; action: string } | null;
  loading: boolean;
  status: { bgGradient: string; textColor: string };
}

export default function RunCommendation({ recommendation, loading, status }: RunCommendationProps) {
  if (loading) {
    return <div className="w-full h-75 rounded-[2rem] bg-white animate-pulse border border-slate-100 shadow-sm" />;
  }

  const { title, message, action } = recommendation || {
    title: "Coach is Hydrating",
    message: "Generating fresh advice. Stay safe out there!",
    action: "Please Wait"
  };

  return (
    <div className="w-full h-75 flex flex-col justify-between p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-700">
      <div className="relative z-10 flex flex-col h-full">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">RunCommendation</p>
          <h2 className={`text-3xl font-black tracking-tight leading-tight mt-4 mb-2 line-clamp-2 ${status.textColor}`}>
            {title}
          </h2>
        </div>

        <div className="flex-grow flex items-center">
          <p className="text-base font-bold text-slate-600 leading-relaxed italic line-clamp-3">
            "{message}"
          </p>
        </div>

        <div className="mt-4">
          <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${status.textColor} border-current opacity-80`}>
            {action}
          </span>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r ${status.bgGradient}`} />
    </div>
  );
}