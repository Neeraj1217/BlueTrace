
import cv2
import numpy as np
from datetime import datetime, timezone


class SpillDetector:
    def __init__(self, image_bounds: dict = None):

        self.image_bounds = image_bounds or {
            "lat_min": 17.50, "lat_max": 17.90,
            "lon_min": 83.10, "lon_max": 83.50,
        }

    def _pixel_to_latlon(self, x, y, img_width, img_height):
        """Map a pixel (x,y) into the lat/lon box defined in image_bounds."""
        b = self.image_bounds
        lon = b["lon_min"] + (x / img_width) * (b["lon_max"] - b["lon_min"])
        # y=0 is the TOP of the image, which is the max latitude
        lat = b["lat_max"] - (y / img_height) * (b["lat_max"] - b["lat_min"])
        return lat, lon

    def detect(self, image_path: str, detected_at: str = None) -> dict:

        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise FileNotFoundError(f"Could not read image at {image_path}")

        height, width = img.shape

        # 1. Blur to reduce SAR speckle noise
        blurred = cv2.GaussianBlur(img, (7, 7), 0)

        # 2. Threshold: Otsu's method auto-picks a good dark/light cutoff
        _, thresh = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        # 3. Clean up small noise specks
        kernel = np.ones((5, 5), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        # 4. Find contours (outlines of dark blobs)
        contours, _ = cv2.findContours(
            cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return {
                "lat": None, "lon": None, "area_km2": 0,
                "confidence": 0.0, "detected_at": None,
                "note": "No candidate dark region found"
            }

        # 5. Assume the largest dark blob is the candidate spill
        largest = max(contours, key=cv2.contourArea)
        area_px = cv2.contourArea(largest)

        # 6. Find its center point
        M = cv2.moments(largest)
        cx = M["m10"] / M["m00"] if M["m00"] != 0 else width / 2
        cy = M["m01"] / M["m00"] if M["m00"] != 0 else height / 2
        lat, lon = self._pixel_to_latlon(cx, cy, width, height)

        # 7. Rough pixel-area -> km^2 conversion using the image's real bounds
        b = self.image_bounds
        lat_span_km = (b["lat_max"] - b["lat_min"]) * 111.0  # ~111km per degree lat
        lon_span_km = (b["lon_max"] - b["lon_min"]) * 111.0 * np.cos(np.radians(b["lat_min"]))
        km_per_px_x = lon_span_km / width
        km_per_px_y = lat_span_km / height
        area_km2 = round(float(area_px * km_per_px_x * km_per_px_y), 2)

        # 8. Confidence: crude proxy based on how large/well-defined the blob is
        #    (a real model would give a proper confidence -- this is a placeholder heuristic)
        confidence = round(min(0.95, 0.5 + (area_px / (width * height)) * 5), 2)

        if detected_at is None:
            detected_at = datetime.now(timezone.utc).isoformat()

        return {
            "lat": round(float(lat), 4),
            "lon": round(float(lon), 4),
            "area_km2": area_km2,
            "confidence": confidence,
            "detected_at": detected_at,
            "note": "Candidate dark region -- not yet confirmed as oil"
        }


if __name__ == "__main__":
    d = SpillDetector()
    result = d.detect("data/sample_sar.png")
    print(result)