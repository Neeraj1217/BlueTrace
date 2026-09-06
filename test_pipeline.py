"""
test_pipeline.py
Run this with: python test_pipeline.py

This calls all four of your modules in order, just like the real
pipeline will, and prints the final combined result. Everything is
fake data today -- the point is proving the WIRING works with zero
errors before you add real logic tomorrow.
"""

from detector import SpillDetector
from drift import DriftEstimator
from vessels import VesselFinder
from scoring import EvidenceScorer
from weather import WeatherService

def run_pipeline(image_path: str):
    detector = SpillDetector()
    drift_estimator = DriftEstimator()
    vessel_finder = VesselFinder()
    scorer = EvidenceScorer()
    weather_service = WeatherService()

    print("1. Detecting spill...")
    spill = detector.detect(image_path, detected_at="2026-09-04T03:42:00Z")
    print(spill)

    print("\n2. Fetching real wind/current conditions...")
    conditions = weather_service.get_wind_and_current(spill["lat"], spill["lon"], spill["detected_at"])
    print(conditions)

    print("\n3. Estimating drift/origin...")
    drift = drift_estimator.estimate(spill, **conditions)
    print(drift)

    print("\n4. Finding nearby vessels...")
    vessels = vessel_finder.find_nearby(spill["lat"], spill["lon"], spill["detected_at"])
    print(vessels)

    print("\n5. Scoring vessels...")
    ranked = scorer.score_all(spill, drift, vessels)
    print(ranked)

    final_result = {
        "spill": spill,
        "drift": drift,
        "ranked_vessels": ranked
    }

    print("\n=== FINAL COMBINED RESULT (this is what the API will return) ===")
    print(final_result)
    return final_result


if __name__ == "__main__":
    run_pipeline("data/sample_sar.png")