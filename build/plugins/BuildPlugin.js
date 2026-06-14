import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { ZipArchive } from "archiver";

const ROOT = process.cwd();

const MAX_PRICE = 10000;
const MIN_PRICE = 0;
const VALID_LICENSES = [
  "MIT",
  "GPL-3.0",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "LGPL-3.0",
  "MPL-2.0",
  "CDDL-1.0",
  "EPL-2.0",
  "AGPL-3.0",
  "Proprietary",
];

export default function BuildPlugin({ plugin, config }) {
  return {
    name: "build-plugin",
    setup(build) {
      build.onEnd(async result => {
        if (result.errors.length > 0) return;
        await startBuild({ plugin, config });
      });
    }
  }
}

async function startBuild({ plugin: p, config: c }) {
  const OUTDIR_PATH = path.dirname(c.OUTPUT);
  const OUTFILE_PATH = path.basename(c.OUTPUT);

  p.main = OUTFILE_PATH;

  const [icon, readme, changelog] = await Promise.all([
    p.icon ? copyFile(p.icon, OUTDIR_PATH) : null,
    p.readme ? copyFile(p.readme, OUTDIR_PATH) : null,
    p.changelog ? copyFile(p.changelog, OUTDIR_PATH) : null
  ]);

  if (icon) p.icon = icon;
  if (readme) p.readme = readme;
  if (changelog) p.changelog = changelog;

  // check license
  if (
       typeof p.license === "string" &&
       VALID_LICENSES.indexOf(p.license) === -1
     ) console.error("Invalid license. please use one of: " + VALID_LICENSES.join("\n- "))

  // copy assets
  if (p.files) p.files = await copy(p.files, OUTDIR_PATH);

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

  // manifest
  const pluginJson = JSON.stringify(p);
  const outfilePath = path.join(ROOT, OUTDIR_PATH, OUTFILE_PATH);

  await fs.writeFile(path.join(ROOT, OUTDIR_PATH, "plugin.json"), pluginJson);

  // zip
  const zipName = (c.ZIP ?? "plugin.zip")
    .replace(/\{([^}]+)\}/g, (_, key) => {
      return key.indexOf(".") !== -1 ?
        key.split(".").reduce((cur, per) => cur[per], p) :
        p[key] ?? key;
    });

  await createZipArchive(OUTDIR_PATH, zipName);
}

async function createZipArchive(sourceDir, zipFileName) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipFileName);
    const archive = new ZipArchive({
      zlib: { level: 6 },
      statConcurrency: 10
    });

    output.on("finish", () => {
      console.log(`📦 Created ${zipFileName} (${archive.pointer()} bytes)`);
      resolve();
    });
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// utils
async function copy(entries, dist) {
  const tasks = entries.map(async (src) => {
    if (src.endsWith("/"))
      return await copyDir(src, dist);
    else
      return await copyFile(src, dist);
  });
  return (await Promise.all(tasks)).flat(Infinity);
}

async function copyFile(src, dist) {
  const absoluteSrc = path.resolve(src);
  const relativePath = path.relative(ROOT, absoluteSrc);
  const targetPath = path.join(dist, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(absoluteSrc, targetPath);
  return relativePath;
}

async function copyDir(src, dist) {

    const absoluteSrc = path.resolve(src);
    const entries = await fs.readdir(absoluteSrc, { withFileTypes: true });
    return Promise.all(entries.map(entry => {
      const entryPath = path.join(absoluteSrc, entry.name);
      return entry.isFile() ? copyFile(entryPath, dist) : copyDir([entryPath], dist);
    }));
}
