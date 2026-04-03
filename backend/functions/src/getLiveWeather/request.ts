export interface WeatherRequest { city?: string; }
export const validateWeatherRequest = (data: any): WeatherRequest => ({
  city: data?.city || "Metro Manila",
});