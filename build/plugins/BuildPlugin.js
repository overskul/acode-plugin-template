import fs from 'node:fs/promises';
import { createWriteStream } from "node:fs";
import path from 'node:path';
import archiver from 'archiver';

const ROOT = process.cwd();
const licenseCache = new Map();
const MAX_PRICE = 10000;
const MIN_PRICE = 0;

const validLicenses = [
  'MIT',
  'GPL-3.0',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'LGPL-3.0',
  'MPL-2.0',
  'CDDL-1.0',
  'EPL-2.0',
  'AGPL-3.0',
  'Proprietary',
];

export default function BuildPlugin(plugin) {
  return {
    name: 'build-plugin',
    setup(build) {
      build.onEnd(async result => {
        if (result.errors.length > 0) return;
        await startBuild({ ...plugin });
      });
    }
  }
}

async function startBuild(p) {
  const OUTDIR_PATH = path.dirname(p.output);
  const OUTFILE_PATH = path.basename(p.output);

  p.main = OUTFILE_PATH;
  delete p.entry;
  delete p.output;

  const [icon, readme, changelog, license] = await Promise.all([
    p.icon ? copyFile(p.icon, OUTDIR_PATH) : null,
    p.readme ? copyFile(p.readme, OUTDIR_PATH) : null,
    p.changelog ? copyFile(p.changelog, OUTDIR_PATH) : null,
    p.license ? handleLicense(p.license, OUTDIR_PATH, p.author.name) : null
  ]);

  if (icon) p.icon = icon;
  if (readme) p.readme = readme;
  if (changelog) p.changelog = changelog;
  if (license) {
    p.license = license;
    if (!validLicenses.includes(license)) {
      console.error(`Invalid license "${license}". Must be one of: ${validLicenses.join(', ')}`);
    }
  }

  // copy assets
  if (p.files) p.files = await copyDir(p.files, OUTDIR_PATH);

  // price validation
  p.price = Math.max(MIN_PRICE, Math.min(MAX_PRICE, p.price));

  // repository
  if (p.repository && p.price !== MIN_PRICE) {
    console.warn(`Repository is only required when plugin is free, deleting it...`);
    delete p.repository;
  } else if (!p.repository && p.price === MIN_PRICE) {
    console.error(`Repository is required when the plugin is free (open source)`);
  }

  // author
  if (!p.author.name) console.error("Author name is required");

  // zip name
  const tokens = {
    id: p.id,
    name: p.name,
    version: p.version,
    price: p.price,
    author: p.author.name,
    license: p.license,
    github: p.author.github
  };
  const zipName = (p.zip ?? "plugin.zip").replace(/\{(\w+)\}/g, (_, key) => tokens[key] ?? `{${key}}`);
  delete p.zip;

  const pluginJson = JSON.stringify(p);
  const outfilePath = path.join(ROOT, OUTDIR_PATH, OUTFILE_PATH);

  await Promise.all([
    fs.writeFile(path.join(ROOT, OUTDIR_PATH, "plugin.json"), pluginJson),
    fs.readFile(outfilePath, "utf8").then(buildFile =>
      fs.writeFile(outfilePath, buildFile.replace("(()=>{", `(()=>{const __PLUGIN__ = ${pluginJson};`))
    )
  ]);

  // zip
  await createZipArchive(OUTDIR_PATH, zipName);
}

async function handleLicense(licensePath, outDir, authorName) {
  const licenseKey = licensePath.toLowerCase();
  try {
    const licenseContent = await fs.readFile(path.resolve(licensePath), "utf8");
    await copyFile(licensePath, outDir);
    return extractLicenseType(licenseContent);
  } catch {
    const licenseContent = await fetchLicense(licenseKey);
    if (licenseContent) {
      const licenseType = extractLicenseType(licenseContent);
      const filled = licenseContent
        .replace("[fullname]", authorName)
        .replace("[year]", new Date().getFullYear());
      await fs.writeFile(path.join(ROOT, outDir, "LICENSE"), filled);
      return licenseType;
    }
  }
  return null;
}

function extractLicenseType(content) {
  const firstLine = content.split("\n", 1)[0];
  const parts = firstLine.split(" ");
  parts.pop();
  return parts.join(" ").toUpperCase();
}

async function fetchLicense(license) {
  if (licenseCache.has(license)) return licenseCache.get(license);
  try {
    const res = await fetch(`https://raw.githubusercontent.com/github/choosealicense.com/gh-pages/_licenses/${license}.txt`);
    if (!res.ok) return null;
    const text = await res.text();
    const content = text.slice(text.lastIndexOf("---") + 1).trim();
    licenseCache.set(license, content);
    return content;
  } catch (err) {
    console.error('Error fetching license:', err.message);
    return null;
  }
}

async function createZipArchive(sourceDir, zipFileName) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipFileName);
    const archive = archiver('zip', {
      zlib: { level: 6 },
      statConcurrency: 10
    });
    output.on('close', () => {
      console.log(`📦 Created ${zipFileName} (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// utils
async function copyFile(src, dist) {
  const absoluteSrc = path.resolve(src);
  const relativePath = path.relative(ROOT, absoluteSrc);
  const targetPath = path.join(dist, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(absoluteSrc, targetPath);
  return relativePath;
}

async function copyDir(dirs, dist) {
  const tasks = dirs.map(async (src) => {
    const absoluteSrc = path.resolve(src);
    const entries = await fs.readdir(absoluteSrc, { withFileTypes: true });
    return Promise.all(entries.map(entry => {
      const entryPath = path.join(absoluteSrc, entry.name);
      return entry.isFile() ? copyFile(entryPath, dist) : copyDir([entryPath], dist);
    }));
  });
  return (await Promise.all(tasks)).flat(Infinity);
}
