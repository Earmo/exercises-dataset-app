import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const sourceJson = path.join(root, ".source", "exercises-dataset", "data", "exercises.json");
const assetsDir = path.join(root, "app", "src", "main", "assets");
const dataDir = path.join(assetsDir, "data");
const mediaDir = path.join(assetsDir, "media");
const cdnBase = "https://static.exercisedb.dev/media";
const concurrency = Number(process.env.DOWNLOAD_CONCURRENCY || 12);
const shouldDownloadGifs = process.env.DOWNLOAD_GIFS === "1";

await fs.mkdir(dataDir, { recursive: true });

const exercises = JSON.parse(await fs.readFile(sourceJson, "utf8"));
await fs.writeFile(path.join(dataDir, "exercises.json"), JSON.stringify(exercises, null, 2), "utf8");
await fs.writeFile(
  path.join(dataDir, "exercises.js"),
  `window.EXERCISES_DATA = ${JSON.stringify(exercises)};\n`,
  "utf8",
);

const ids = [...new Set(exercises.map((item) => item.media_id).filter(Boolean))];
if (!shouldDownloadGifs) {
  console.log("数据资源已生成。GIF 现在由 App 按需网络加载并缓存；如需批量下载，设置 DOWNLOAD_GIFS=1。");
  process.exit(0);
}

await fs.mkdir(mediaDir, { recursive: true });
let completed = 0;
let skipped = 0;
let failed = 0;

async function exists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size > 0;
  } catch {
    return false;
  }
}

async function downloadGif(mediaId, attempt = 1) {
  const output = path.join(mediaDir, `${mediaId}.gif`);
  if (await exists(output)) {
    skipped += 1;
    return;
  }

  const temp = `${output}.tmp`;
  const url = `${cdnBase}/${mediaId}.gif`;

  try {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    await pipeline(response.body, createWriteStream(temp));
    await fs.rename(temp, output);
  } catch (error) {
    await fs.rm(temp, { force: true });
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      return downloadGif(mediaId, attempt + 1);
    }
    failed += 1;
    console.error(`下载失败 ${mediaId}: ${error.message}`);
  } finally {
    completed += 1;
    if (completed % 25 === 0 || completed === ids.length) {
      console.log(`GIF 进度 ${completed}/${ids.length}，跳过 ${skipped}，失败 ${failed}`);
    }
  }
}

for (let index = 0; index < ids.length; index += concurrency) {
  await Promise.all(ids.slice(index, index + concurrency).map((mediaId) => downloadGif(mediaId)));
}

if (failed > 0) {
  process.exitCode = 1;
}
