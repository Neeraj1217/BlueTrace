"""
scoring.py
Coder 1 owns this file.

EvidenceScorer turns raw numbers (distance, time gap, ship's course)
into one explainable association score per vessel. No ML here --
just a transparent weighted formula, which is actually a STRENGTH for
a prototype: every score can be explained to a judge in one sentence,
unlike a black-box model.

The five evidence components:
- distance:      how close was the ship to the spill?
- timing:        how close in time was the ship's last position?
- direction:     was the ship heading TOWARD the spill location?
- trajectory:    does the ship's course match the drift's overall
                  direction (origin -> spill)?
- data_quality:  how fresh/reliable is this AIS ping?

Each component is scored 0-100, then combined with weights into one
overall score.
"""

import math


class EvidenceScorer:
    def __init__(self, max_distance_km: float = 25, max_time_hours: float = 6):
        self.max_distance_km = max_distance_km
        self.max_time_hours = max_time_hours
        # Weights must sum to 1.0 -- tune these if you want distance to
        # matter more/less than direction, etc.
        self.weights = {
            "distance": 0.30,
            "timing": 0.25,
            "direction": 0.20,
            "trajectory": 0.15,
            "data_quality": 0.10,
        }

    def _bearing_deg(self, lat1, lon1, lat2, lon2):
        """Initial compass bearing (0-360, 0=North) from point 1 to point 2."""
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dlambda = math.radians(lon2 - lon1)
        x = math.sin(dlambda) * math.cos(phi2)
        y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
        return (math.degrees(math.atan2(x, y)) + 360) % 360

    def _angle_closeness(self, angle1, angle2):
        """0-100 score for how close two compass bearings are (180 deg apart = 0, identical = 100)."""
        diff = abs(angle1 - angle2) % 360
        diff = min(diff, 360 - diff)  # shortest angular distance
        return max(0.0, 100.0 * (1 - diff / 180.0))

    def score(self, spill: dict, drift: dict, vessel: dict) -> dict:
        """
        Input: spill dict (needs lat/lon), drift dict (needs origin_lat/
               origin_lon), one vessel dict (needs lat/lon, distance_km,
               time_delta_hours, cog_deg)
        Output: dict with overall score (0-100) + the individual
                evidence components, so the dashboard can show WHY
        """
        # --- Distance ---
        distance_km = vessel.get("distance_km")
        if distance_km is None:
            distance_score = 50.0  # unknown -- neutral, don't punish or reward
        else:
            distance_score = max(0.0, 100.0 * (1 - distance_km / self.max_distance_km))

        # --- Timing ---
        time_delta_hours = vessel.get("time_delta_hours")
        if time_delta_hours is None:
            timing_score = 50.0
        else:
            timing_score = max(0.0, 100.0 * (1 - time_delta_hours / self.max_time_hours))

        # --- Direction: was the vessel heading toward the spill? ---
        cog_deg = vessel.get("cog_deg")
        if cog_deg is None or spill.get("lat") is None:
            direction_score = 50.0
        else:
            bearing_to_spill = self._bearing_deg(vessel["lat"], vessel["lon"], spill["lat"], spill["lon"])
            direction_score = self._angle_closeness(cog_deg, bearing_to_spill)

        # --- Trajectory: does vessel's course match the drift's direction? ---
        if cog_deg is None or drift.get("origin_lat") is None:
            trajectory_score = 50.0
        else:
            drift_bearing = self._bearing_deg(
                drift["origin_lat"], drift["origin_lon"], spill["lat"], spill["lon"]
            )
            trajectory_score = self._angle_closeness(cog_deg, drift_bearing)

        # --- Data quality: fresher AIS pings are more trustworthy ---
        if time_delta_hours is None:
            data_quality_score = 40.0  # no timestamp match info -- be conservative
        else:
            data_quality_score = max(20.0, 100.0 - time_delta_hours * 10)

        components = {
            "distance": round(distance_score, 1),
            "timing": round(timing_score, 1),
            "direction": round(direction_score, 1),
            "trajectory": round(trajectory_score, 1),
            "data_quality": round(data_quality_score, 1),
        }

        overall = sum(components[k] * self.weights[k] for k in self.weights)

        return {
            "mmsi": vessel.get("mmsi", "unknown"),
            "name": vessel.get("name", "unknown"),
            "score": round(overall, 1),
            "evidence": components,
        }

    def score_all(self, spill: dict, drift: dict, vessels: list) -> list:
        results = [self.score(spill, drift, v) for v in vessels]
        results.sort(key=lambda r: r["score"], reverse=True)
        return results


if __name__ == "__main__":
    es = EvidenceScorer()
    fake_spill = {"lat": 17.7216, "lon": 83.3438}
    fake_drift = {"origin_lat": 17.7969, "origin_lon": 83.4004}
    fake_vessel = {
        "mmsi": "419998877", "name": "MV Coastal Runner",
        "lat": 17.74, "lon": 83.33,
        "distance_km": 2.51, "time_delta_hours": 0.13, "cog_deg": 230.0,
    }
    print(es.score(fake_spill, fake_drift, fake_vessel))