// Cities we run clubs in, with a centre point. Used to turn the browser's GPS fix into a city.
// Plain module (no "use client") so both the server and the client can import it.
export const CITIES = [
    { slug: "pune", name: "Pune", lat: 18.5204, lng: 73.8567 },
    { slug: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777 },
    { slug: "delhi", name: "Delhi", lat: 28.6139, lng: 77.209 },
    { slug: "goa", name: "Goa", lat: 15.2993, lng: 74.124 },
    { slug: "bangalore", name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    { slug: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867 },
    { slug: "chandigarh", name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
];

export const DEFAULT_CITY = "pune";

const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function distanceKm(lat1, lng1, lat2, lng2) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** The closest city to a coordinate. */
export function nearestCity(lat, lng) {
    let best = null;
    let bestD = Infinity;
    for (const c of CITIES) {
        const d = distanceKm(lat, lng, c.lat, c.lng);
        if (d < bestD) {
            best = c;
            bestD = d;
        }
    }
    return best;
}
