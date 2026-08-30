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

  return Promise.all(
    artworkFiles.map(async (filename) => {
      const extension = path.extname(filename);
      const stem = path.basename(filename, extension);
      const metadata = await readMetadata(path.join(biblioDir, `${stem}.json`));
      const backImage = await findBackImage({ stem, metadata, biblioDir, biblioFiles });

      return {
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
      };
    }),
  );
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
