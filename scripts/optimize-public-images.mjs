// Resize and recompress public-site images to ~2x their largest display size.
// Only overwrites a file when the optimized version is smaller.
// Usage: node scripts/optimize-public-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = "src/assets/images";

// Longest-side limits, by folder or exact file. Display sizes are roughly half.
const LIMITS = [
  { match: "brand/logo.webp", max: 480 },
  { match: "brand/intro/", max: 520 },
  { match: "zaifan/hero-student-globe.webp", max: 1400 },
  { match: "zaifan/", max: 1000 },
  { match: "dream-support/", max: 1000 },
  { match: "services/", max: 1000 },
  { match: "appointment/", max: 1000 },
  { match: "contact/", max: 1200 },
  { match: "country-explorer/", max: 900 },
  { match: "universities/", max: 1200 },
];

const MIN_BYTES = 40 * 1024;

function limitFor(relative) {
  return LIMITS.find((rule) => relative.startsWith(rule.match) || relative === rule.match)?.max;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let before = 0;
let after = 0;

for (const file of walk(ROOT)) {
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  if (!/\.(webp|jpe?g)$/i.test(relative)) continue;

  const max = limitFor(relative);
  const size = fs.statSync(file).size;
  if (!max || size < MIN_BYTES) continue;

  const input = fs.readFileSync(file);
  const pipeline = sharp(input).resize({ width: max, height: max, fit: "inside", withoutEnlargement: true });
  const output = /\.webp$/i.test(relative)
    ? await pipeline.webp({ quality: 78, alphaQuality: 90, effort: 6 }).toBuffer()
    : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();

  before += size;
  if (output.length < size) {
    fs.writeFileSync(file, output);
    after += output.length;
    console.log(`${relative}: ${Math.round(size / 1024)} KB → ${Math.round(output.length / 1024)} KB`);
  } else {
    after += size;
  }
}

console.log(`\nTotal: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`);
