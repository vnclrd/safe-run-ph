"use client";
import { useEffect, useState, useMemo } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import TemperatureCard from "@/components/TemperatureCard";
import RunCommendationCard, {
  getTimeOfDay,
} from "@/components/RunCommendationCard";
import MetricCards from "@/components/MetricCards";
import TemperatureForecastCard from "@/components/TemperatureForecastCard";
import GraphCard from "@/components/GraphCard";
import dynamic from "next/dynamic";
import recommendations from "@/lib/recommendations.json";
import metricMsgs from "@/lib/metrics.json";

export default function Home() {
  // Core Data & UI States
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [isBranding, setIsBranding] = useState(false);
  
  // Time-based States
  const [greeting, setGreeting] = useState("Good morning,");
  const [timeOfDay, setTimeOfDay] = useState<ReturnType<typeof getTimeOfDay>>("umaga");

  // Heat Map
  const HeatMapCard = dynamic(() => import("@/components/HeatMapCard"), { 
    ssr: false,
    loading: () => <div className="w-full h-[22rem] rounded-[2rem] bg-white animate-pulse" />
  });

  // 1. SIDE EFFECTS: Timers and Data Fetching
  useEffect(() => {
    setIsMounted(true);

    const updateTimeBasedState = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("Good morning,");
      else if (hour >= 12 && hour < 18) setGreeting("Good afternoon,");
      else if (hour >= 18 && hour <= 23) setGreeting("Good evening,");
      else setGreeting("Good morning,");
      setTimeOfDay(getTimeOfDay(hour));
    };

    updateTimeBasedState();
    const clock = setInterval(updateTimeBasedState, 1000);

    const brandingTimer = setTimeout(() => setIsBranding(true), 1000);
    
    // Fallback hero timer in case fetch takes too long
    const heroTimer = setTimeout(() => setShowHero(false), 2000);

    async function fetchWeather() {
      const getCoords = (): Promise<{ lat: number; lon: number } | null> => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000 }
          );
        });
      };

      try {
        const coords = await getCoords();
        const res = (await httpsCallable(functions, "getLiveWeather")({
          lat: coords?.lat,
          lon: coords?.lon,
        })) as any;

        setWeather(res.data);
        setWeatherLoading(false);
        setTimeout(() => setShowHero(false), 1000); // Hide hero after load
      } catch (err) {
        console.error("Safe-Run Error:", err);
        setWeatherLoading(false);
        setShowHero(false);
      }
    }
    
    fetchWeather();

    return () => {
      clearInterval(clock);
      clearTimeout(brandingTimer);
      clearTimeout(heroTimer);
    };
  }, []);

  // 2. WEATHER LOGIC ENGINE: Recalculate when weather changes
  const analysis = useMemo(() => {
    const defaultStatus = {
      bgGradient: "bg-slate-200",
      bgSubtle: "bg-rose-50",
      bgColor: "bg-slate-200",
      textColor: "text-slate-400",
      label: "LOADING",
    };

    if (!weather) {
      return { status: defaultStatus, recommendation: null, metrics: null };
    }

    const getRand = (cat: string, lvl: string) => {
      const pool = (metricMsgs as any)[cat]?.[lvl];
      return pool ? pool[Math.floor(Math.random() * pool.length)] : "";
    };

    const effectiveTemp = weather.heatIndex || weather.temp || 0; 
    const precip = weather.precip || 0;
    const wind = weather.windSpeed || 0;
    const currentUv = weather.uvIndex || 0;
    const hum = weather.humidity || 0;

    // -- Voting Escalation Logic --
    const extremeCount =
      (effectiveTemp >= 42 ? 1 : 0) +
      (precip >= 7.6 ? 1 : 0) +
      (wind >= 39 ? 1 : 0) +
      (currentUv >= 8 ? 1 : 0);

    const isRainy = precip > 0;
    const isWindy = wind >= 29;
    const isSunny = currentUv >= 6;
    const isHumid = hum > 65;
    const isWarm = effectiveTemp >= 32;

    const cautionCount =
      (isRainy ? 1 : 0) +
      (isWindy ? 1 : 0) +
      (isSunny ? 1 : 0) +
      (isHumid ? 1 : 0) +
      (isWarm ? 1 : 0);

    // -- Global Status & Category Determination --
    let category: "CHILLY" | "GOOD" | "CAUTION" | "DANGER" = "GOOD";
    let status = defaultStatus;

    // DANGER: Extreme single metrics or 3+ cautions
    if (extremeCount >= 1 || cautionCount >= 3) {
      category = "DANGER";
      status = { 
        bgGradient: "from-orange-500 to-rose-500",
        bgSubtle: "bg-rose-50",
        bgColor: "bg-rose-500/90",
        textColor: "text-rose-500",
        label: "DANGER" 
      };
    } 
    // CHILLY: Prioritize temp if it's cool, even if it's humid
    else if (effectiveTemp < 26) {
      category = "CHILLY";
      status = { 
        bgGradient: "from-blue-500 to-indigo-600",
        bgSubtle: "bg-indigo-50", 
        bgColor: "bg-blue-600/60", 
        textColor: "text-blue-600", 
        label: "CHILLY" 
      };
    } 
    // CAUTION: Only flag caution for moderate temps with environmental hurdles
    else if (cautionCount >= 1) {
      category = "CAUTION";
      status = { 
        bgGradient: "from-amber-400 to-orange-500", 
        bgSubtle: "bg-orange-50",
        bgColor: "bg-orange-600/60", 
        textColor: "text-orange-500", 
        label: "CAUTION" 
      };
    } 
    // GOOD: Default ideal running weather
    else {
      category = "GOOD";
      status = { 
        bgGradient: "from-emerald-500 to-teal-600",
        bgSubtle: "bg-teal-50",
        bgColor: "bg-emerald-600/60", 
        textColor: "text-emerald-600", 
        label: "GOOD" 
      };
    }

    // -- Recommendation Sub-Category Routing --
    let subCategory = "optimal";
    if (category === "DANGER") subCategory = "extreme";
    else if (isRainy && isWindy) subCategory = "rainy_windy";
    else if (isSunny && isHumid) subCategory = "sunny_humid";
    else if (isSunny && isWindy) subCategory = "sunny_windy";
    else if (isHumid && isWindy) subCategory = "humid_windy";
    else if (isRainy) subCategory = "rainy";
    else if (isSunny) subCategory = "sunny";
    else if (isHumid) subCategory = "humid";
    else if (isWindy) subCategory = "windy";

    const recPool =
      (recommendations as any)[category]?.[subCategory] ||
      (recommendations as any)[category]?.["optimal"] || [];
    const randomAdvice = recPool.length > 0 ? recPool[Math.floor(Math.random() * recPool.length)] : "";

    // -- Metric Specific Formatting --
    // UV
    const uvLvl = currentUv >= 11 ? "extreme" : currentUv >= 8 ? "extreme" : currentUv >= 6 ? "high" : currentUv >= 3 ? "moderate" : "low";
    const uvLabel = currentUv >= 11 ? "Extreme" : currentUv >= 8 ? "Very High" : currentUv >= 6 ? "High" : currentUv >= 3 ? "Moderate" : "Low";
    const uvColor = currentUv >= 11 ? "text-rose-500" : currentUv >= 8 ? "text-orange-500" : currentUv >= 3 ? "text-amber-500" : "text-emerald-500";
    
    // Humidity
    const hLvl = hum < 30 ? "low" : hum <= 60 ? "optimal" : "high";
    const humColor = hum >= 85 ? "text-rose-500" : hLvl === "optimal" ? "text-emerald-500" : hLvl === "low" ? "text-blue-500" : "text-amber-500";

    // Precipitation
    const pLvl = precip === 0 ? "dry" : precip < 7.6 ? "light" : "heavy";
    const precipColor = precip >= 7.6 ? "text-rose-500" : pLvl === "dry" ? "text-emerald-500" : "text-amber-500";

    // Wind
    const wLvl = wind < 12 ? "calm" : wind <= 28 ? "breezy" : "windy";
    const windColor = wind >= 39 ? "text-rose-500" : wind >= 29 ? "text-orange-500" : wind >= 12 ? "text-amber-500" : "text-emerald-500";

    return {
      status,
      recommendation: randomAdvice,
      metrics: {
        uv: { desc: getRand("uvIndex", uvLvl), color: uvColor, percent: Math.min((currentUv / 11) * 100, 100), status: uvLabel },
        humidity: { desc: getRand("humidity", hLvl), color: humColor },
        precip: { desc: getRand("precipitation", pLvl), color: precipColor },
        wind: { desc: getRand("windSpeed", wLvl), color: windColor },
      },
    };
  }, [weather]);

  const { status, recommendation, metrics } = analysis;

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden pt-8 pl-8 pr-8 sm:pt-4 sm:pl-16 sm:pr-16">
      <div
        className={`
          flex items-center justify-center rounded-[2rem] overflow-hidden 
          transition-all duration-1000 ease-in-out
          ${showHero ? "h-[90dvh] mb-4" : "h-[5dvh] md:mt-4 mb-4 md:mb-8"}
        `}
      >
        <h2
          className={`
            ${showHero ? "text-3xl sm:text-5xl md:text-6xl lg:text-6xl" : "text-3xl sm:text-2xl md:text-4xl"}
            font-black italic leading-[0.9] sm:leading-none text-center tracking-tighter 
            lg:whitespace-nowrap
            transition-all duration-1000 ease-in-out transform
            ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-24"}
            ${status.textColor}
          `}
        >
          <div className="relative h-[2.5rem] flex items-center justify-center">
            {/* Greeting */}
            <span
              className={`absolute transition-opacity duration-300 ease-in-out text-center ${
                isBranding ? "opacity-0" : "opacity-100"
              }`}
            >
              <span className="whitespace-nowrap">{greeting}</span>
              <br />
              <span>Runner!</span>
            </span>

            {/* Branding */}
            <span
              className={`absolute transition-opacity duration-300 ease-in-out text-center whitespace-nowrap ${
                isBranding ? "opacity-100" : "opacity-0"
              }`}
            >
              Safe-Run PH
            </span>
          </div>
        </h2>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <TemperatureCard
          weather={weather}
          loading={weatherLoading}
          status={status}
        />
        
        <div className="lg:col-span-2">
          <RunCommendationCard
            recommendation={recommendation}
            loading={weatherLoading}
            status={status}
            timeOfDay={timeOfDay}
          />
        </div>

        <MetricCards
          weather={weather}
          loading={weatherLoading}
          humidity={metrics?.humidity || { desc: "", color: "text-slate-400" }}
          precip={metrics?.precip || { desc: "", color: "text-slate-400" }}
          currentUv={metrics?.uv || { desc: "", color: "text-slate-400", percent: 0, status: "" }}
          wind={metrics?.wind || { desc: "", color: "text-slate-400" }}
        />

        <div className="lg:col-span-2">
          <TemperatureForecastCard
            weather={weather}
            loading={weatherLoading}
            status={status}
          />
        </div>

        <GraphCard
          weather={weather}
          loading={weatherLoading}
          status={status}
        />

        <div className="lg:col-span-2 lg:col-start-2">
          <HeatMapCard
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
}