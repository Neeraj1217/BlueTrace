import requests
from datetime import datetime


class WeatherService:
    def __init__(self):
        self.weather_url = "https://api.open-meteo.com/v1/forecast"
        self.marine_url = "https://marine-api.open-meteo.com/v1/marine"

        # Used ONLY if the API call fails (no internet, rate limit, etc)
        # -- keeps the demo from crashing if wifi drops mid-presentation.
        self.fallback = {
            "wind_speed_mps": 6.0,
            "wind_direction_from_deg": 45.0,
            "current_speed_mps": 0.3,
            "current_direction_to_deg": 210.0,
        }

    def get_wind_and_current(self, lat: float, lon: float, time_iso: str = None) -> dict:
        """
        Input: location, and optionally an ISO timestamp to find the
               closest matching hourly reading. If no time given, uses
               the current/nearest available reading.
        Output: dict with the 4 values drift.py's estimate() expects:
                wind_speed_mps, wind_direction_from_deg,
                current_speed_mps, current_direction_to_deg
        """
        try:
            wind = self._fetch_wind(lat, lon, time_iso)
            current = self._fetch_current(lat, lon, time_iso)
            return {**wind, **current}
        except Exception as e:
            print(f"[weather.py] Live weather fetch failed ({e}) -- using fallback values.")
            return self.fallback

    def _closest_hour_index(self, times: list, time_iso: str):
        """Find the index of the hourly timestamp closest to time_iso."""
        if not time_iso:
            return 0
        target = datetime.fromisoformat(time_iso.replace("Z", "+00:00"))
        best_i, best_diff = 0, None
        for i, t in enumerate(times):
            t_parsed = datetime.fromisoformat(t)
            diff = abs((t_parsed - target.replace(tzinfo=None)).total_seconds())
            if best_diff is None or diff < best_diff:
                best_i, best_diff = i, diff
        return best_i

    def _fetch_wind(self, lat, lon, time_iso):
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "wind_speed_10m,wind_direction_10m",
            "wind_speed_unit": "ms",
            "timezone": "UTC",
        }
        resp = requests.get(self.weather_url, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()["hourly"]

        idx = self._closest_hour_index(data["time"], time_iso)
        return {
            "wind_speed_mps": float(data["wind_speed_10m"][idx]),
            "wind_direction_from_deg": float(data["wind_direction_10m"][idx]),
        }

    def _fetch_current(self, lat, lon, time_iso):
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "ocean_current_velocity,ocean_current_direction",
            "timezone": "UTC",
        }
        resp = requests.get(self.marine_url, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()["hourly"]

        idx = self._closest_hour_index(data["time"], time_iso)
        # ocean_current_velocity from Open-Meteo Marine is in km/h -- convert to m/s
        speed_kmh = float(data["ocean_current_velocity"][idx])
        return {
            "current_speed_mps": round(speed_kmh / 3.6, 3),
            "current_direction_to_deg": float(data["ocean_current_direction"][idx]),
        }


if __name__ == "__main__":
    ws = WeatherService()
    result = ws.get_wind_and_current(17.7216, 83.3438, "2026-09-04T03:42:00Z")
    print(result)