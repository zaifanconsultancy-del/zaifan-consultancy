import { countryList } from "../../../data/countries";
import { LAND_ROWS, MAP_GRID } from "./worldDots";

// A flat (equirectangular) map in grid units: one unit per dot of LAND_ROWS.

export function project([lat, lon]) {
  return [(lon - MAP_GRID.west) / MAP_GRID.step, (MAP_GRID.north - lat) / MAP_GRID.step];
}

/** Every land dot as one SVG path of zero-length round-capped strokes. */
export const LAND_PATH = LAND_ROWS.flatMap((row, y) => [...row].map((cell, x) => (cell === "#" ? `M${x} ${y}h0` : ""))).join("");

export const MAP_WIDTH = LAND_ROWS[0].length - 1;
export const MAP_HEIGHT = LAND_ROWS.length - 1;

// Islamabad, and the city each destination's flights usually land in.
export const HOME = [33.69, 73.06];
const GATEWAY_COORDS = {
  italy: [45.63, 8.72],
  germany: [48.35, 11.79],
  france: [49.01, 2.55],
  belgium: [50.9, 4.48],
  romania: [44.57, 26.1],
  lithuania: [54.63, 25.28],
  turkey: [41.26, 28.74],
  china: [31.14, 121.81],
  vietnam: [21.22, 105.81],
};

const toRad = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle distance (km) and compass bearing (degrees) from Islamabad. */
function fromHome([lat, lon]) {
  const [lat1, lat2, dLon] = [toRad(HOME[0]), toRad(lat), toRad(lon - HOME[1])];
  const a = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const distance = 6371 * 2 * Math.asin(Math.sqrt(a));
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return { distance, bearing: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 };
}

/** A flight path bowing north, like routes on an airline map. */
export function arcPath([x1, y1], [x2, y2]) {
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.28;
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export const HOME_POINT = project(HOME);

export const ROUTES = countryList.map((country) => {
  const coords = GATEWAY_COORDS[country.slug];
  const point = project(coords);
  const { distance, bearing } = fromHome(coords);
  return {
    country,
    point,
    distance,
    bearing,
    // Rough non-stop flying time at ~830 km/h, rounded up.
    hours: Math.round(distance / 830 + 0.5),
    path: arcPath(HOME_POINT, point),
  };
});
