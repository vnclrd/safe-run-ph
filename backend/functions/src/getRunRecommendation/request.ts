export interface WeatherRequest {
  city?: string;
}

export const validateWeatherRequest = (data: any): WeatherRequest => {
  return {
    city: data?.city || "Metro Manila",
  };
};