/**
 * Reverse geocode coordinates to an exact address.
 * Uses Nominatim (OpenStreetMap) with fallback to BigDataCloud reverse geocoding API.
 */

interface GeocodedLocation {
  address: string
  city: string
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodedLocation | null> {
  try {
    // Primary: OpenStreetMap Nominatim with zoom 18 (building level precision)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
      {
        headers: {
          "User-Agent": "StartaplyHR/1.0 (contact@startaply.com)",
          Accept: "application/json",
        },
      }
    )

    if (response.ok) {
      const data = await response.json()
      const addr = data.address || {}

      const houseNumber = addr.house_number || addr.building || ""
      const road = addr.road || addr.pedestrian || addr.footway || addr.path || addr.street || ""
      const neighbourhood = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.subdivision || ""
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        ""

      const streetParts: string[] = []
      if (houseNumber) streetParts.push(houseNumber)
      if (road) streetParts.push(road)
      if (neighbourhood && neighbourhood !== road) streetParts.push(neighbourhood)

      const fullStreet = streetParts.length > 0
        ? streetParts.join(" ")
        : data.display_name?.split(",").slice(0, 2).join(",") || ""

      if (fullStreet || city) {
        return {
          address: fullStreet || city,
          city: city,
        }
      }
    }
  } catch (error) {
    console.warn("[GEOCODE] Nominatim failed, attempting fallback:", error)
  }

  // Fallback: BigDataCloud Free Reverse Geocoding API
  try {
    const fallbackRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    )
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json()
      const locality = fallbackData.locality || fallbackData.city || fallbackData.principalSubdivision || ""
      const fullAddress = [
        fallbackData.localityInfo?.informative?.[0]?.name,
        locality,
        fallbackData.principalSubdivision,
        fallbackData.countryName,
      ].filter(Boolean).join(", ")

      return {
        address: fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: locality || fallbackData.principalSubdivision || "",
      }
    }
  } catch (fbErr) {
    console.error("[GEOCODE] Fallback failed:", fbErr)
  }

  return {
    address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    city: "",
  }
}
