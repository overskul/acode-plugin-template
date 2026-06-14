import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function JsxPlugin(entry) {
  return {
    name: "jsx-plugin",
    async setup(build) {
      if (!Array.isArray(build.initialOptions.inject))
        build.initialOptions.inject = [];

      build.initialOptions.inject.push(
        path.resolve(path.join(__dirname, "./JsxInject.js"))
      );
      build.initialOptions.jsxFactory  = "JSXTagWrapper";
      build.initialOptions.jsxFragment = "JSXFragmentWrapper";
    }
  }
}

