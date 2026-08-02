const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const TARGET_DIRS = [
  path.join(ROOT, 'client', 'public', 'pictures', 'photos_pictures'),
  path.join(ROOT, 'client', 'public', 'pictures', 'post_pictures')
];

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 78;
const SKIP_BYTES = 400 * 1024;

const SUPPORTED = /\.(jpe?g|png)$/i;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  const isPng = ext === '.png';
  const image = sharp(file, { animated: false }).rotate();

  const meta = await image.metadata();
  if (meta.width > MAX_WIDTH) {
    image.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  let buffer;
  if (isPng) {
    buffer = await image.png({ compressionLevel: 9, palette: true, quality: 80 }).toBuffer();
  } else {
    buffer = await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  }

  const originalSize = fs.statSync(file).size;
  const tmp = `${file}.tmp${ext}`;
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, file);

  return { originalSize, newSize: buffer.length };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;
  let optimizedCount = 0;
  let skippedCount = 0;

  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`[跳过] 目录不存在: ${dir}`);
      continue;
    }
    const files = fs.readdirSync(dir).filter(f => SUPPORTED.test(f));
    for (const name of files) {
      const file = path.join(dir, name);
      const size = fs.statSync(file).size;
      totalBefore += size;
      if (size < SKIP_BYTES) {
        totalAfter += size;
        skippedCount++;
        console.log(`[跳过] ${name} (${formatBytes(size)})`);
        continue;
      }
      try {
        const { newSize } = await optimizeFile(file);
        totalAfter += newSize;
        optimizedCount++;
        console.log(`[优化] ${name}: ${formatBytes(size)} → ${formatBytes(newSize)} (节省 ${((1 - newSize / size) * 100).toFixed(1)}%)`);
      } catch (err) {
        console.error(`[失败] ${name}: ${err.message}`);
      }
    }
  }

  const savedPercent = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : 0;
  console.log(`\n完成: 优化 ${optimizedCount} 张, 跳过 ${skippedCount} 张`);
  console.log(`总大小: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (节省 ${savedPercent}%)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
