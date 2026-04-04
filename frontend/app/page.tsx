"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import TemperatureBadge from "@/components/TemperatureBadge";
import RunCommendation from "@/components/RunCommendation";
import WeatherForecastCard from "@/components/WeatherForecastCard";
import recommendations from "@/lib/recommendations.json";
import metricMsgs from "@/lib/metrics.json";
import { Droplets, CloudRain, Sun, Wind } from "lucide-react";

export default function Home() {
  const [weather, setWeather] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning,");
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [humidityColor, setHumidityColor] = useState("text-slate-400");
  const [precipColor, setPrecipColor] = useState("text-slate-400");
  const [uvColor, setUvColor] = useState("text-slate-400");
  const [windColor, setWindColor] = useState("text-slate-400");
  const [humidityDesc, setHumidityDesc] = useState("");
  const [precipDesc, setPrecipDesc] = useState("");
  const [uvDesc, setUvDesc] = useState("");
  const [windDesc, setWindDesc] = useState("");
  const [uvPercent, setUvPercent] = useState(0);

  useEffect(() => {
    setIsMounted(true);

    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("Good morning,");
      else if (hour >= 12 && hour < 18) setGreeting("Good afternoon,");
      else if (hour >= 18 && hour <= 23) setGreeting("Good evening,");
      else setGreeting("Good morning,");
    };

    updateGreeting();

    async function init() {
      try {
        const res = (await httpsCallable(functions, "getLiveWeather")()) as any;
        const weatherData = res.data;
        setWeather(weatherData);
        setWeatherLoading(false);

        setTimeout(() => {
          setShowHero(false);
        }, 1000);

        const heatIndex = weatherData.temp;
        let category: "CHILLY" | "GOOD" | "CAUTION" | "DANGER" = "GOOD";

        if (heatIndex >= 40) category = "DANGER";
        else if (heatIndex >= 33) category = "CAUTION";
        else if (heatIndex >= 26) category = "GOOD";
        else category = "CHILLY";

        const pool = (recommendations as any)[category];
        const randomAdvice = pool[Math.floor(Math.random() * pool.length)];

        setRecommendation(randomAdvice);

        const getRand = (cat: string, lvl: string) => {
          const pool = (metricMsgs as any)[cat][lvl];
          return pool[Math.floor(Math.random() * pool.length)];
        };

        const h = weatherData.humidity || 0;
        const hLvl = h < 30 ? "low" : h <= 60 ? "optimal" : "high";
        setHumidityDesc(getRand("humidity", hLvl));
        setHumidityColor(
          hLvl === "optimal"
            ? "text-emerald-500"
            : hLvl === "low"
              ? "text-blue-500"
              : "text-amber-500",
        );

        const p = weatherData.precip || 0;
        const pLvl = p === 0 ? "dry" : p < 7.6 ? "light" : "heavy";
        setPrecipDesc(getRand("precipitation", pLvl));
        setPrecipColor(
          pLvl === "dry"
            ? "text-emerald-500"
            : pLvl === "light"
              ? "text-amber-500"
              : "text-rose-500",
        );

        const uv = weatherData.uvIndex || 0;
        const uvLvl =
          uv <= 2 ? "low" : uv <= 5 ? "moderate" : uv <= 7 ? "high" : "extreme";
        setUvDesc(getRand("uvIndex", uvLvl));
        const uvColors = {
          low: "text-emerald-500",
          moderate: "text-amber-500",
          high: "text-orange-500",
          extreme: "text-rose-500",
        };
        setUvColor((uvColors as any)[uvLvl]);

        const calculatedPercent = Math.min((uv / 11) * 100, 100);
        setUvPercent(calculatedPercent);

        const w = weatherData.windSpeed || 0;
        const wLvl = w < 12 ? "calm" : w <= 28 ? "breezy" : "windy";
        setWindDesc(getRand("windSpeed", wLvl));
        setWindColor(
          wLvl === "calm"
            ? "text-emerald-500"
            : wLvl === "breezy"
              ? "text-amber-500"
              : "text-rose-500",
        );
      } catch (err) {
        console.error("Safe-Run Error:", err);
        setWeatherLoading(false);
        setShowHero(false);
      }
    }
    init();
  }, []);

  const status =
    weather?.temp >= 40
      ? {
          bgGradient: "from-red-600 to-rose-700",
          textColor: "text-red-600",
          label: "DANGER",
        }
      : weather?.temp >= 33
        ? {
            bgGradient: "from-amber-400 to-orange-500",
            textColor: "text-orange-500",
            label: "CAUTION",
          }
        : weather?.temp >= 26
          ? {
              bgGradient: "from-emerald-500 to-teal-600",
              textColor: "text-emerald-600",
              label: "GOOD",
            }
          : {
              bgGradient: "from-blue-500 to-indigo-600",
              textColor: "text-blue-600",
              label: "CHILLY",
            };

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden pt-8 pl-8 pr-8 sm:pt-4 sm:pl-16 sm:pr-16">
      <div
        className={`
        flex items-center justify-center rounded-[2rem] overflow-hidden 
        transition-all duration-1000 ease-in-out
        ${showHero ? "h-[90dvh] mb-4" : "h-[10dvh] sm:h-[25dvh] md:h-[10dvh] md:mt-4 mb-4 md:mb-8"}
      `}
      >
        <h2
          className={`
          ${showHero ? "text-4xl sm:text-5xl md:text-6xl lg:text-6xl" : "text-3xl sm:text-2xl md:text-4xl"}
          font-black italic uppercase leading-[0.9] sm:leading-none text-center tracking-tighter 
          sm:whitespace-nowrap
          transition-all duration-1000 ease-in-out transform
          ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-24"}
          ${status.textColor}
        `}
        >
          {greeting}
          <br className="sm:hidden" /> Runner!
        </h2>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <TemperatureBadge
          weather={weather}
          loading={weatherLoading}
          status={status}
        />
        <div className="lg:col-span-2">
          <RunCommendation
            recommendation={recommendation}
            loading={weatherLoading}
            status={status}
          />
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-75">
          <MiniMetricCard
            label="Humidity"
            icon={CloudRain}
            value={weatherLoading ? "---" : `${weather?.humidity || 0}%`}
            description={weatherLoading ? "" : humidityDesc}
            colorClass={weatherLoading ? "text-slate-400" : humidityColor}
          />
          <MiniMetricCard
            label="Precipitation"
            icon={Droplets}
            value={weatherLoading ? "---" : `${weather?.precip || 0}mm`}
            description={weatherLoading ? "" : precipDesc}
            colorClass={weatherLoading ? "text-slate-400" : precipColor}
          />
          <MiniMetricCard
            label="UV Index"
            icon={Sun} // ⚡ Added Sun icon
            value={weatherLoading ? "---" : weather?.uvIndex || 0}
            description={weatherLoading ? "" : uvDesc}
            colorClass={weatherLoading ? "text-slate-400" : uvColor}
            progress={weatherLoading ? 0 : uvPercent}
          />
          <MiniMetricCard
            label="Wind Speed"
            icon={Wind}
            value={weatherLoading ? "---" : `${weather?.windSpeed || 0}km/h`}
            description={weatherLoading ? "" : windDesc}
            colorClass={weatherLoading ? "text-slate-400" : windColor}
          />
        </div>

        <div className="lg:col-span-2">
          <WeatherForecastCard
            weather={weather}
            loading={weatherLoading}
            status={status}
          />
        </div>

        <div className="lg:col-span-3 py-6 md:py-12 text-center">
          <p className="text-slate-300 font-black italic uppercase text-[10px] tracking-[0.5em]">
            Safe-Run PH
          </p>
        </div>
      </div>
    </main>
  );

  // Helper Component
  function MiniMetricCard({
    label,
    value,
    description,
    colorClass,
    icon: Icon,
    progress,
  }: any) {
    const getBgClass = (textClass: string) => {
      const map: Record<string, string> = {
        "text-emerald-500": "bg-emerald-500",
        "text-blue-500": "bg-blue-500",
        "text-amber-500": "bg-amber-500",
        "text-orange-500": "bg-orange-500",
        "text-rose-500": "bg-rose-500",
        "text-slate-400": "bg-slate-400",
      };
      return map[textClass] || "bg-slate-200";
    };

    const bgMeterClass = getBgClass(colorClass);

    return (
      <div className="gap-2 flex flex-col justify-center items-center p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-700">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          {Icon && <Icon size={12} strokeWidth={3} />}
          <p className="text-[10px] font-black uppercase tracking-widest">
            {label}
          </p>
        </div>

        <p
          className={`text-3xl sm:text-3xl font-black italic ${colorClass} leading-none`}
        >
          {value}
        </p>

        {/* UV Meter */}
        {progress !== undefined && (
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-50">
            <div
              className={`h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <p className="text-[10px] font-medium text-slate-400 mt-2 text-center leading-tight">
          {description}
        </p>
      </div>
    );
  }
}
