"""
drift.py
Coder 1 owns this file.

DriftEstimator takes a spill location and works out where it likely
originated, by projecting BACKWARD against wind and ocean current over
a chosen time window. This is simplified physics (no ML), which is
appropriate and honest for a prototype -- real oil-spill trajectory
models (e.g. GNOME, OpenDrift) use far more complex ocean/weather data.

IMPORTANT convention note (this trips people up, so read it):
- Wind direction is normally reported METEOROLOGICALLY: the direction
  the wind is blowing FROM. A spill is pushed in the OPPOSITE direction
  (where the wind is blowing TO).
- Ocean current direction is normally reported OCEANOGRAPHICALLY: the
  direction the water is flowing TOWARD. A spill moves directly in that
  direction.
This file handles that conversion so you don't have to think about it
every time you call it.
"""

import math


class DriftEstimator:
    def __init__(self, drift_hours: float = 6.0, wind_leeway_factor: float = 0.03):
        """
        drift_hours: how far back in time we estimate the spill originated
        wind_leeway_factor: oil/debris typically drifts at ~2-4% of wind
                             speed (industry rule of thumb for leeway)
        """
        self.drift_hours = drift_hours
        self.wind_leeway_factor = wind_leeway_factor

    def _offset_latlon(self, lat, lon, bearing_deg, distance_km):
        """
        Move a lat/lon point by a given bearing (degrees clockwise from
        north) and distance (km). Flat-earth approximation -- accurate
        enough at the small scale (tens of km) this project operates at.
        """
        bearing_rad = math.radians(bearing_deg)
        dlat = (distance_km * math.cos(bearing_rad)) / 111.0
        dlon = (distance_km * math.sin(bearing_rad)) / (111.0 * math.cos(math.radians(lat)))
        return lat + dlat, lon + dlon

    def estimate(
        self,
        spill: dict,
        wind_speed_mps: float = 6.0,
        wind_direction_from_deg: float = 45.0,
        current_speed_mps: float = 0.3,
        current_direction_to_deg: float = 210.0,
    ) -> dict:
        """
        Input:
          spill: dict from SpillDetector.detect() -- needs 'lat' and 'lon'
          wind_speed_mps / wind_direction_from_deg: wind conditions at
              spill time (defaults are placeholder typical coastal values
              -- replace with a real weather API call when you have one)
          current_speed_mps / current_direction_to_deg: ocean current
              conditions (defaults are placeholder values)

        Output: dict with estimated origin + a drift path from origin to
        the spill location, plus the assumptions used (for transparency
        in the demo -- judges will respect this being explicit).
        """
        lat, lon = spill["lat"], spill["lon"]
        if lat is None or lon is None:
            return {
                "origin_lat": None, "origin_lon": None, "drift_path": [],
                "note": "No spill location available to backtrack from"
            }

        # Convert wind's "from" direction into the direction it PUSHES things (opposite)
        wind_push_deg = (wind_direction_from_deg + 180) % 360

        # Combine wind (leeway-scaled) and current into one movement vector,
        # by summing their north/east components separately.
        wind_component_mps = wind_speed_mps * self.wind_leeway_factor
        wind_dx = wind_component_mps * math.sin(math.radians(wind_push_deg))  # east component
        wind_dy = wind_component_mps * math.cos(math.radians(wind_push_deg))  # north component

        current_dx = current_speed_mps * math.sin(math.radians(current_direction_to_deg))
        current_dy = current_speed_mps * math.cos(math.radians(current_direction_to_deg))

        total_dx = wind_dx + current_dx  # m/s, eastward
        total_dy = wind_dy + current_dy  # m/s, northward

        # Total displacement over the drift window
        seconds = self.drift_hours * 3600
        disp_east_km = (total_dx * seconds) / 1000.0
        disp_north_km = (total_dy * seconds) / 1000.0

        total_distance_km = math.hypot(disp_east_km, disp_north_km)
        travel_bearing_deg = (math.degrees(math.atan2(disp_east_km, disp_north_km))) % 360

        # Origin = spill location moved BACKWARD along the travel direction
        backward_bearing_deg = (travel_bearing_deg + 180) % 360
        origin_lat, origin_lon = self._offset_latlon(lat, lon, backward_bearing_deg, total_distance_km)

        # Build a simple waypointed path from origin to spill (straight-line
        # interpolation -- a real model would curve this using hourly
        # wind/current changes, which is a good "future work" talking point)
        steps = 4
        drift_path = []
        for i in range(steps + 1):
            frac = i / steps
            step_lat = origin_lat + (lat - origin_lat) * frac
            step_lon = origin_lon + (lon - origin_lon) * frac
            drift_path.append([round(step_lat, 4), round(step_lon, 4)])

        return {
            "origin_lat": round(origin_lat, 4),
            "origin_lon": round(origin_lon, 4),
            "drift_path": drift_path,
            "drift_hours": self.drift_hours,
            "assumptions": {
                "wind_speed_mps": wind_speed_mps,
                "wind_direction_from_deg": wind_direction_from_deg,
                "current_speed_mps": current_speed_mps,
                "current_direction_to_deg": current_direction_to_deg,
            },
            "note": "Simplified linear backtrack using wind leeway + current vectors"
        }


if __name__ == "__main__":
    dr = DriftEstimator()
    fake_spill = {"lat": 17.72, "lon": 83.35}
    result = dr.estimate(fake_spill)
    print(result)