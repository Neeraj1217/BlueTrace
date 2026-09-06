"""
vessels.py
Coder 1 owns this file.

VesselFinder loads AIS (ship tracking) data and returns vessels that
were near the spill location around the relevant time. This is the
"who was in the area" step, before scoring.py decides how suspicious
each one looks.

Expects a CSV with these columns (same as real AIS extracts, e.g. from
Marine Cadastre): MMSI, VesselName, VesselType, BaseDateTime, LAT, LON,
SOG, COG. Swap in a real downloaded AIS CSV any time -- as long as the
column names match, nothing else here needs to change.
"""

import math
from datetime import datetime, timedelta
import pandas as pd


class VesselFinder:
    def __init__(self, ais_csv_path: str = "data/sample_ais.csv"):
        self.ais_csv_path = ais_csv_path
        self.df = pd.read_csv(ais_csv_path)
        self.df["BaseDateTime"] = pd.to_datetime(self.df["BaseDateTime"])

    def _haversine_km(self, lat1, lon1, lat2, lon2):
        """Great-circle distance between two lat/lon points, in km."""
        R = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * R * math.asin(math.sqrt(a))

    def find_nearby(self, lat: float, lon: float, time: str,
                     radius_km: float = 25, time_window_hours: float = 6) -> list:
        """
        Input: spill lat/lon, spill time (ISO string), search radius,
               and how many hours before/after the spill to consider
        Output: list of vessel dicts, each with a computed distance_km
                and time_delta_hours (useful inputs for scoring.py)
        """
        spill_time = pd.to_datetime(time) if time else None

        results = []
        for _, row in self.df.iterrows():
            distance_km = self._haversine_km(lat, lon, row["LAT"], row["LON"])
            if distance_km > radius_km:
                continue

            time_delta_hours = None
            if spill_time is not None:
                time_delta_hours = abs((spill_time - row["BaseDateTime"]).total_seconds()) / 3600.0
                if time_delta_hours > time_window_hours:
                    continue

            results.append({
                "mmsi": str(row["MMSI"]),
                "name": row["VesselName"],
                "type": row["VesselType"],
                "lat": float(row["LAT"]),
                "lon": float(row["LON"]),
                "timestamp": row["BaseDateTime"].isoformat(),
                "sog_knots": float(row["SOG"]),
                "cog_deg": float(row["COG"]),
                "distance_km": round(distance_km, 2),
                "time_delta_hours": round(time_delta_hours, 2) if time_delta_hours is not None else None,
            })

        results.sort(key=lambda v: v["distance_km"])
        return results


if __name__ == "__main__":
    vf = VesselFinder()
    nearby = vf.find_nearby(17.7216, 83.3438, "2026-09-04T03:42:00Z")
    for v in nearby:
        print(v)