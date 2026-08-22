import * as esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

import JsxPlugin from "./plugins/jsx/JsxPlugin.js";
import BuildPlugin from "./plugins/BuildPlugin.js";

// plugin config
const pkg = await readJsonFile(path.join(process.cwd(), "package.json"));

const configPath = pkg["acode-plugin"] || process.argv?.find(a => a?.startsWith("--config="))?.split("=")?.pop();
const config = await getConfig(path.join(process.cwd(), configPath));

const IS_DEV = process.argv.includes("-D") || process.argv.includes("--dev") || process.argv.includes("--development");

if (config.build.clean) {
  try {
    await fs.access(path.resolve(path.dirname(config.build.outputFile)));
    await fs.rm(path.resolve(path.dirname(config.build.outputFile)), { recursive: true, force: true });
  } catch (_) {/* ignore */}
}

// esbuild config
const buildConfig = {
  entryPoints: [config.build.entryFile],
  outfile: config.build.outputFile,
  bundle: true,
  minify: true,
  logLevel: "info",
  color: true,
  define: {
    __CONFIG__: JSON.stringify(config),
    __BUILD__: JSON.stringify(config.build),
    __PLUGIN__: JSON.stringify(config.plugin),
    __PACKAGE__: JSON.stringify(pkg),
    ...(stringifyObject(config.build?.define ?? {}))
  },
  resolveExtensions: [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".scss",
    ".css",
    ".json",
    ...(config.build.ignoreExtension ?? [])
  ],
  alias: {
    "@": "./src",
    ...(config.build.alias ?? {})
  },
  loader: {
    ".js": "jsx",
    ".ts": "tsx"
  },
  plugins: [
    (hasPlugin("JSX") ? JsxPlugin(config.build.entryFile) : dumpPlugin()),
    BuildPlugin(config)
  ],
};

// Main function to handle both dev and production builds
(async function () {
  if (IS_DEV) {
    console.log("\nStarting development server...\n");
    // Watch and Serve Mode
    const ctx = await esbuild.context(buildConfig);
    await ctx.watch();
    const { host } = await ctx.serve({
      servedir: ".",
      port: config.build.port || 3456
    });
    console.log(`\nDevelopment server running on http://localhost:${config.build.port || 3456}\n`);
  } else {
    console.log("\nBuilding...\n");
    await esbuild.build(buildConfig);
    console.log("\nBuild completed.");
  }
})();

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Couldn't read json file path: ", filePath);
    throw e;
  }
}

async function getConfig(filePath) {
  try {
    const { config } = await import(filePath);
    return config;
  } catch (e) {
    console.error("Couldn't read config file path: ", filePath);
    throw e;
  }
}

function stringifyObject(obj = {}) {
  try {
    return Object.keys(obj)
      .reduce((o, k) => (o[k] = JSON.stringify(obj[k]), o), {});
  } catch (_) {
    return {};
  }
}

function hasPlugin(pluginName) {
  return (config.build.plugins ?? []).includes(pluginName);
}

function dumpPlugin() {
  const num = Math.floor(100 + Math.random() * 900);
  return { name: `dump_${num}`, setup(){} };
}