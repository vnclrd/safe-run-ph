/**
 * DTO (Data Transfer Object) for Weather Requests.
 * Even if empty now, this allows you to add features like 
 * 'lat' and 'lng' later for specific city lookups.
 */
export interface WeatherRequest {
  city?: string;
}

export const validateWeatherRequest = (data: any): WeatherRequest => {
  // Simple validation logic
  return {
    city: data?.city || "Metro Manila",
  };
};