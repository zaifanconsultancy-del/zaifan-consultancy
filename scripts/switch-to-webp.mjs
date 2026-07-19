import fs from "node:fs/promises";
import path from "node:path";

const SRC_ROOT = path.resolve("src");

const VALID_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

async function getSourceFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getSourceFiles(fullPath)));
      continue;
    }

    if (
      entry.isFile() &&
      VALID_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

async function switchImports() {
  const files = await getSourceFiles(SRC_ROOT);

  let filesChanged = 0;
  let importsChanged = 0;

  for (const filePath of files) {
    const originalContent = await fs.readFile(filePath, "utf8");
    let updatedContent = originalContent;

    const pngImportRegex =
      /(["'])([^"'`]+\.png)\1/g;

    const matches = [...originalContent.matchAll(pngImportRegex)];

    for (const match of matches) {
      const quote = match[1];
      const importPath = match[2];

      // Only process relative imports.
      if (!importPath.startsWith(".")) {
        continue;
      }

      const absolutePngPath = path.resolve(
        path.dirname(filePath),
        importPath
      );

      const absoluteWebpPath = absolutePngPath.replace(
        /\.png$/i,
        ".webp"
      );

      try {
        await fs.access(absoluteWebpPath);
      } catch {
        console.log(
          `SKIPPED (no WebP): ${path.relative(
            SRC_ROOT,
            filePath
          )} → ${importPath}`
        );
        continue;
      }

      const webpImportPath = importPath.replace(
        /\.png$/i,
        ".webp"
      );

      const oldText = `${quote}${importPath}${quote}`;
      const newText = `${quote}${webpImportPath}${quote}`;

      updatedContent = updatedContent.replaceAll(
        oldText,
        newText
      );

      importsChanged++;

      console.log(
        `UPDATED: ${path.relative(
          SRC_ROOT,
          filePath
        )} → ${webpImportPath}`
      );
    }

    if (updatedContent !== originalContent) {
      await fs.writeFile(filePath, updatedContent, "utf8");
      filesChanged++;
    }
  }

  console.log("\n-----------------------------------");
  console.log(`Files changed: ${filesChanged}`);
  console.log(`Imports changed: ${importsChanged}`);
}

switchImports().catch((error) => {
  console.error("Failed to switch PNG imports to WebP:");
  console.error(error);
  process.exit(1);
});