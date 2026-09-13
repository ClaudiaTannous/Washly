const express = require("express");
const router = express.Router();

// Optional: set GOOGLE_MAPS_API_KEY in .env to get better street/house-number
// coverage in areas OpenStreetMap has mapped less thoroughly (e.g. smaller
// towns). Without it, reverse geocoding falls back to Nominatim (free, no key).
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

async function reverseGeocodeGoogle(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

  const upstream = await fetch(url);
  if (!upstream.ok) throw new Error("Google geocoding request failed");

  const data = await upstream.json();

  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(`Google geocoding returned no results (${data.status})`);
  }

  const components = data.results[0].address_components || [];
  const get = (type) =>
    components.find((c) => c.types.includes(type))?.long_name || "";

  return {
    city:
      get("locality") ||
      get("postal_town") ||
      get("administrative_area_level_2"),
    street: get("route"),
    building: get("street_number"),
    displayName: data.results[0].formatted_address || "",
  };
}

async function reverseGeocodeNominatim(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;

  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "Washly-App (student project)",
      "Accept-Language": "en",
    },
  });

  if (!upstream.ok) throw new Error("Reverse geocoding failed");

  const data = await upstream.json();
  const address = data.address || {};

  return {
    city:
      address.city || address.town || address.village || address.county || "",
    street: address.road || address.pedestrian || address.neighbourhood || "",
    building: address.house_number || "",
    displayName: data.display_name || "",
  };
}

/* -----------------------------------------------------
   GET /api/geo/reverse?lat=..&lng=..
   Reverse-geocodes GPS coordinates into an address the
   booking form fields can be pre-filled with. Prefers
   Google (if GOOGLE_MAPS_API_KEY is set) for better
   street-level coverage, falling back to Nominatim.
------------------------------------------------------ */
router.get("/geo/reverse", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    let result = null;
    let provider = "nominatim";

    if (GOOGLE_MAPS_API_KEY) {
      try {
        result = await reverseGeocodeGoogle(lat, lng);
        provider = "google";
      } catch (e) {
        console.warn(
          "Google geocoding failed, falling back to Nominatim:",
          e.message,
        );
      }
    }

    if (!result) {
      result = await reverseGeocodeNominatim(lat, lng);
    }

    return res.json({ lat, lng, provider, ...result });
  } catch (error) {
    console.error("Reverse Geocode Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
