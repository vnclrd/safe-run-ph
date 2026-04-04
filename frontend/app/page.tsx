"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import TemperatureBadge from "@/components/TemperatureBadge";
import RunCommendation from "@/components/RunCommendation";
import MetricGrid from "@/components/MetricGrid";
import WeatherForecastCard from "@/components/WeatherForecastCard";
import recommendations from "@/lib/recommendations.json";
import metricMsgs from "@/lib/metrics.json";

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
      const getCoords = (): Promise<{ lat: number; lon: number } | null> => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(null), // Default if denied
            { timeout: 5000 },
          );
        });
      };

      try {
        const coords = await getCoords();
        const res = (await httpsCallable(
          functions,
          "getLiveWeather",
        )({
          lat: coords?.lat,
          lon: coords?.lon,
        })) as any;

        const weatherData = res.data;
        setWeather(weatherData);
        setWeatherLoading(false);

        setTimeout(() => {
          setShowHero(false);
        }, 1000);

        const temp = weatherData.temp || weatherData.heatIndex;
        const precip = weatherData.precip || 0;
        const wind = weatherData.windSpeed || 0;
        const uv = weatherData.uvIndex || 0;
        const hum = weatherData.humidity || 0;

        // 5-METRIC VOTING ESCALATION LOGIC
        const extremeHeat = temp >= 42 ? 1 : 0;
        const extremePrecip = precip >= 7.6 ? 1 : 0;
        const extremeWind = wind >= 39 ? 1 : 0;
        const extremeUV = uv >= 11 ? 1 : 0;
        const extremeHumid = hum >= 85 ? 1 : 0;

        const extremeCount =
          extremeHeat + extremePrecip + extremeWind + extremeUV + extremeHumid;

        let category: "CHILLY" | "GOOD" | "CAUTION" | "DANGER" = "GOOD";

        if (extremeCount >= 3) {
          category = "DANGER";
        } else if (extremeCount >= 1) {
          category = "CAUTION";
        } else {
          category = temp < 26 ? "CHILLY" : "GOOD";
        }

        // ADVANCED MULTI-METRIC SUB-CATEGORY EVALUATION
        const isRainy = precip > 0;
        const isWindy = wind >= 29;
        const isSunny = uv >= 6;
        const isHumid = hum > 65;

        let subCategory = "optimal";

        // 1. Extreme Hazard Override
        if (category === "DANGER") subCategory = "extreme";
        // 2. Dual-Condition Combos
        else if (isRainy && isWindy) subCategory = "rainy_windy";
        else if (isSunny && isHumid) subCategory = "sunny_humid";
        else if (isSunny && isWindy) subCategory = "sunny_windy";
        else if (isHumid && isWindy) subCategory = "humid_windy";
        // 3. Single Conditions
        else if (isRainy) subCategory = "rainy";
        else if (isSunny) subCategory = "sunny";
        else if (isHumid) subCategory = "humid";
        else if (isWindy) subCategory = "windy";

        const pool =
          (recommendations as any)[category]?.[subCategory] ||
          (recommendations as any)[category]?.["optimal"];
        const randomAdvice = pool[Math.floor(Math.random() * pool.length)];

        setRecommendation(randomAdvice);

        const getRand = (cat: string, lvl: string) => {
          const pool = (metricMsgs as any)[cat][lvl];
          return pool[Math.floor(Math.random() * pool.length)];
        };

        // METRIC COLOR & DESCRIPTION LOGIC

        // Humidity
        const hLvl = hum < 30 ? "low" : hum <= 60 ? "optimal" : "high";
        setHumidityDesc(getRand("humidity", hLvl));
        setHumidityColor(
          hum >= 85
            ? "text-rose-500"
            : hLvl === "optimal"
              ? "text-emerald-500"
              : hLvl === "low"
                ? "text-blue-500"
                : "text-amber-500",
        );

        // Precipitation
        const pLvl = precip === 0 ? "dry" : precip < 7.6 ? "light" : "heavy";
        setPrecipDesc(getRand("precipitation", pLvl));
        setPrecipColor(
          precip >= 7.6
            ? "text-rose-500"
            : pLvl === "dry"
              ? "text-emerald-500"
              : "text-amber-500",
        );

        // UV Index
        const uvLvl =
          uv <= 2 ? "low" : uv <= 5 ? "moderate" : uv <= 7 ? "high" : "extreme";
        setUvDesc(getRand("uvIndex", uvLvl));
        setUvColor(
          uv >= 11
            ? "text-rose-500"
            : uv >= 8
              ? "text-orange-500"
              : uv >= 3
                ? "text-amber-500"
                : "text-emerald-500",
        );

        const calculatedPercent = Math.min((uv / 11) * 100, 100);
        setUvPercent(calculatedPercent);

        // Wind Speed
        const wLvl = wind < 12 ? "calm" : wind <= 28 ? "breezy" : "windy";
        setWindDesc(getRand("windSpeed", wLvl));
        setWindColor(
          wind >= 39
            ? "text-rose-500"
            : wind >= 29
              ? "text-orange-500"
              : wind >= 12
                ? "text-amber-500"
                : "text-emerald-500",
        );
      } catch (err) {
        console.error("Safe-Run Error:", err);
        setWeatherLoading(false);
        setShowHero(false);
      }
    }
    init();
  }, []);

  // DYNAMIC GLOBAL STATUS (Drives the Hero and Badge Colors)
  let status = {
    bgGradient: "bg-slate-200",
    textColor: "text-slate-400",
    label: "LOADING",
  };

  if (weather) {
    const temp = weather.temp || weather.heatIndex;
    const precip = weather.precip || 0;
    const wind = weather.windSpeed || 0;
    const uv = weather.uvIndex || 0;
    const hum = weather.humidity || 0;

    const extremeHeat = temp >= 42 ? 1 : 0;
    const extremePrecip = precip >= 7.6 ? 1 : 0;
    const extremeWind = wind >= 39 ? 1 : 0;
    const extremeUV = uv >= 11 ? 1 : 0;
    const extremeHumid = hum >= 85 ? 1 : 0;

    // Calculate total extreme metrics
    const extremeCount =
      extremeHeat + extremePrecip + extremeWind + extremeUV + extremeHumid;

    if (extremeCount >= 3) {
      status = {
        bgGradient: "from-red-600 to-rose-700",
        textColor: "text-red-600",
        label: "DANGER",
      };
    } else if (extremeCount >= 1) {
      // 1 or 2 extreme metrics
      status = {
        bgGradient: "from-amber-400 to-orange-500",
        textColor: "text-orange-500",
        label: "CAUTION",
      };
    } else if (temp < 26) {
      // 0 extreme metrics, check if chilly
      status = {
        bgGradient: "from-blue-500 to-indigo-600",
        textColor: "text-blue-600",
        label: "CHILLY",
      };
    } else {
      // 0 extreme metrics, normal temp
      status = {
        bgGradient: "from-emerald-500 to-teal-600",
        textColor: "text-emerald-600",
        label: "GOOD",
      };
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden pt-8 pl-8 pr-8 sm:pt-4 sm:pl-16 sm:pr-16">
      <div
        className={`
          flex items-center justify-center rounded-[2rem] overflow-hidden 
          transition-all duration-1000 ease-in-out
          ${showHero ? "h-[90dvh] mb-4" : "h-[15dvh] sm:h-[25dvh] md:h-[10dvh] md:mt-4 mb-4 md:mb-8"}
        `}
      >        
        <h2
          className={`
            ${showHero ? "text-3xl sm:text-5xl md:text-6xl lg:text-6xl" : "text-3xl sm:text-2xl md:text-4xl"}
            font-black italic uppercase leading-[0.9] sm:leading-none text-center tracking-tighter 
            lg:whitespace-nowrap
            transition-all duration-1000 ease-in-out transform
            ${isMounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-24"}
            ${status.textColor}
          `}
        >
          {greeting}
          <br className="lg:hidden" /> Runner!
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

        <MetricGrid 
          weather={weather}
          loading={weatherLoading}
          humidity={{ desc: humidityDesc, color: humidityColor }}
          precip={{ desc: precipDesc, color: precipColor }}
          uv={{ desc: uvDesc, color: uvColor, percent: uvPercent }}
          wind={{ desc: windDesc, color: windColor }}
        />

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
}
