import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMAGE_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);

function humanizeFilename(filename) {
  return filename
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

function publicPath(directory, filename) {
  return `${directory}/${encodeURIComponent(filename)}`;
}

async function listFiles(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function readMetadata(metadataPath) {
  try {
    return JSON.parse(await readFile(metadataPath, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Ignoring invalid gallery metadata: ${metadataPath}`);
    }
    return {};
  }
}

function normalizeCredit(credit) {
  if (!credit || typeof credit !== 'object') return null;

  const label = typeof credit.label === 'string' ? credit.label.trim() : '';
  const url = typeof credit.url === 'string' ? credit.url.trim() : '';
  if (!label || !url) return null;

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null;
  } catch {
    return null;
  }

  return { label, url };
}

function normalizeSeries(metadata) {
  const name = typeof metadata.series === 'string' ? metadata.series.trim() : '';
  if (!name) return null;

  return {
    name,
    order: Number.isInteger(metadata.seriesOrder) ? metadata.seriesOrder : Number.MAX_SAFE_INTEGER,
  };
}

function arrangeSeries(records) {
  const anchors = new Map();

  records.forEach((record) => {
    if (!record.series) return;
    const currentAnchor = anchors.get(record.series.name);
    if (currentAnchor === undefined || record.sourceIndex < currentAnchor) {
      anchors.set(record.series.name, record.sourceIndex);
    }
  });

  return records
    .sort((left, right) => {
      const leftAnchor = left.series ? anchors.get(left.series.name) : left.sourceIndex;
      const rightAnchor = right.series ? anchors.get(right.series.name) : right.sourceIndex;
      if (leftAnchor !== rightAnchor) return leftAnchor - rightAnchor;

      if (left.series?.name === right.series?.name) {
        return left.series.order - right.series.order || left.sourceIndex - right.sourceIndex;
      }

      return left.sourceIndex - right.sourceIndex;
    })
    .map(({ sourceIndex, series, ...item }) => item);
}

async function findBackImage({ stem, metadata, biblioDir, biblioFiles }) {
  const requested = typeof metadata.backImage === 'string' ? path.basename(metadata.backImage) : null;
  const candidates = requested
    ? [requested]
    : biblioFiles.filter((filename) => {
        const extension = path.extname(filename).toLowerCase();
        return IMAGE_EXTENSIONS.has(extension) && path.basename(filename, extension) === `${stem}-back`;
      });

  for (const candidate of candidates) {
    const extension = path.extname(candidate).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) continue;

    try {
      await access(path.join(biblioDir, candidate));
      return publicPath('biblio', candidate);
    } catch {
      // Missing optional backs fall through to the generated information panel.
    }
  }

  return null;
}

export async function buildGalleryManifest({ galleryDir, biblioDir }) {
  const [galleryFiles, biblioFiles] = await Promise.all([listFiles(galleryDir), listFiles(biblioDir)]);
  const artworkFiles = galleryFiles
    .filter((filename) => IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase()))
    .sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'base' }));

  const records = await Promise.all(
    artworkFiles.map(async (filename, sourceIndex) => {
      const extension = path.extname(filename);
      const stem = path.basename(filename, extension);
      const metadata = await readMetadata(path.join(biblioDir, `${stem}.json`));
      const backImage = await findBackImage({ stem, metadata, biblioDir, biblioFiles });

      return {
        sourceIndex,
        series: normalizeSeries(metadata),
        id: stem,
        title: typeof metadata.title === 'string' && metadata.title.trim()
          ? metadata.title.trim()
          : humanizeFilename(stem),
        src: publicPath('gallery', filename),
        description: typeof metadata.description === 'string' ? metadata.description.trim() : '',
        year: Number.isInteger(metadata.year) ? metadata.year : null,
        characters: Array.isArray(metadata.characters)
          ? metadata.characters.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim())
          : [],
        backImage,
        credit: normalizeCredit(metadata.credit),
      };
    }),
  );

  return arrangeSeries(records);
}

async function writeDefaultManifest() {
  const publicDir = path.resolve('public');
  const galleryDir = path.join(publicDir, 'gallery');
  const biblioDir = path.join(publicDir, 'biblio');
  const outputPath = path.join(publicDir, 'gallery-manifest.json');

  await mkdir(galleryDir, { recursive: true });
  await mkdir(biblioDir, { recursive: true });
  const manifest = await buildGalleryManifest({ galleryDir, biblioDir });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Gallery manifest: ${manifest.length} item${manifest.length === 1 ? '' : 's'}`);
}

const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedPath === fileURLToPath(import.meta.url)) {
  await writeDefaultManifest();
}
