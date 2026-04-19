import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(repoRoot, "data", "ingredient-image-assets.json");
const publicIngredientsDir = path.join(repoRoot, "public", "ingredients");

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function assetPath(fileName) {
  return path.join(publicIngredientsDir, fileName);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadAsset(asset) {
  const outPath = assetPath(asset.fileName);

  if (asset.localOnly) {
    if (!(await exists(outPath))) {
      throw new Error(`Expected local asset to exist: ${outPath}`);
    }

    console.log(`verified ${asset.fileName}`);
    return;
  }

  if (!asset.downloadUrl) {
    throw new Error(`Missing downloadUrl for ${asset.fileName}`);
  }

  const response = await fetch(asset.downloadUrl, {
    headers: {
      "user-agent": userAgent,
      accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "accept-language": "ja,en;q=0.9",
      referer: asset.sourceUrl,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${asset.fileName}: ${response.status} ${response.statusText}`);
  }

  const body = Buffer.from(await response.arrayBuffer());
  await writeFile(outPath, body);
  console.log(`downloaded ${asset.fileName}`);
}

async function main() {
  const raw = await readFile(manifestPath, "utf8");
  const assets = JSON.parse(raw);

  await mkdir(publicIngredientsDir, { recursive: true });

  for (const asset of assets) {
    await downloadAsset(asset);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
