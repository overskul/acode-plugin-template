import * as esbuild from 'esbuild';
import fs from "node:fs/promises";
import path from "node:path";

import JsxPlugin from "./plugins/jsx/JsxPlugin.js";
import BuildPlugin from "./plugins/BuildPlugin.js";

import config from "./BuildConfig.js";

// constants
const { PORT } = config;
const IS_SERVE = process.argv.includes('--serve');

// plugin manifest
const pkg = await readJsonFile(path.join(process.cwd(), "package.json"));
const plugin = await readJsonFile(path.join(process.cwd(), pkg["acode-plugin"]));

try {
  await fs.access(path.resolve(path.dirname(config.OUTPUT)));
  await fs.rm(path.resolve(path.dirname(config.OUTPUT)), { recursive: true, force: true });
} catch (_) {/* ignore */}

// esbuild config
const buildConfig = {
  entryPoints: [config.ENTRY],
  outfile: config.OUTPUT,
  bundle: true,
  minify: true,
  logLevel: 'info',
  color: true,
  define: {
    __CONFIG__: JSON.stringify(config),
    __PLUGIN__: JSON.stringify(plugin),
    __PACKAGE__: JSON.stringify(pkg),
    ...(config.GLOBAL || {})
  },
  resolveExtensions: [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".scss",
    ".css",
    ".json"
  ],
  alias: {
    "@": "./src",
  },
  loader: {
    ".js": "jsx",
    ".ts": "tsx"
  },
  plugins: [
    (config.JSX ? JsxPlugin(config.entry) : ({ name: "N/A", setup(){} })),
    BuildPlugin({ plugin, config })
  ],
};

// Main function to handle both serve and production builds
(async function () {
  if (IS_SERVE) {
    console.log('\nStarting development server...\n');
    // Watch and Serve Mode
    const ctx = await esbuild.context(buildConfig);
    await ctx.watch();
    const { host } = await ctx.serve({
      servedir: '.',
      port: PORT
    });
    console.log(`\nDevelopment server running on http://localhost:${PORT}\n`);
  } else {
    console.log('\nBuilding for production...\n');
    await esbuild.build(buildConfig);
    console.log('\nProduction build complete.');
  }
})();

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (_) {
    console.error("Couldn't read json file path: ", filePath);
    return {};
  }
}