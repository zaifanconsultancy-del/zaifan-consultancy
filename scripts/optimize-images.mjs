import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("src/assets");

async function findPngFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findPngFiles(fullPath)));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".png") {
      files.push(fullPath);
    }
  }

  return files;
}

async function optimize() {
  const files = await findPngFiles(ROOT);

  console.log(`Found ${files.length} PNG files.\n`);

  let originalTotal = 0;
  let optimizedTotal = 0;

  for (const inputPath of files) {
    const stats = await fs.stat(inputPath);

    // Skip tiny PNG files for now.
    if (stats.size < 100 * 1024) {
      continue;
    }

    const outputPath = inputPath.replace(/\.png$/i, ".webp");

    await sharp(inputPath)
      .webp({
        quality: 82,
        alphaQuality: 90,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(outputPath);

    const outputStats = await fs.stat(outputPath);

    originalTotal += stats.size;
    optimizedTotal += outputStats.size;

    const originalMB = (stats.size / 1024 / 1024).toFixed(2);
    const optimizedMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const saving = ((1 - outputStats.size / stats.size) * 100).toFixed(1);

    console.log(
      `${path.relative(ROOT, inputPath)}: ${originalMB} MB → ${optimizedMB} MB (${saving}% smaller)`
    );
  }

  console.log("\n-----------------------------------");
  console.log(
    `Original: ${(originalTotal / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `Optimized: ${(optimizedTotal / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `Saved: ${((originalTotal - optimizedTotal) / 1024 / 1024).toFixed(2)} MB`
  );
}

optimize().catch((error) => {
  console.error("Image optimization failed:");
  console.error(error);
  process.exit(1);
});