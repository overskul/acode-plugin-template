# Acode Plugin Template

A javaScript plugin template for [Acode Editor](https://acode.app).

- Lightweight building with esbuild.
- Validate your plugin configuring.
- Supports JSX.

## Installation

```bash
npm install
```

## Building

**Build:**
```bash
npm run build
```

**Dev:**
```bash
npm run dev
```

## Build Config
The project uses a config (`build/BuildConfig`) to control how the plugin is built.

```JavaScript
export default {
  ENTRY: "src/main.js",
  OUTPUT: "dist/main.js",
  ZIP: "{id}-v{version}.acodeplugin",
  PORT: 3030,
  JSX: false,
  GLOBAL: {}
}
```

### Options
> `ENTRY`
> 
> Main source file used as the build entry point.

> `OUTPUT`
> 
> Path where the compiled output file will be written.

> `ZIP`
> 
> Name of the final plugin archive.
> You can use placeholders like: `{id}`, `{version}`, `{author.name}`.
> **All supported placeholders from `plugin.json` file.**

> `PORT`
> 
> Dev server port used by the build process.

> `JSX`
> 
> Enables JSX support when set to **true**.

> `GLOBAL`
> 
> Defines global variables that will be injected during build time.
> **Example:**

```JavaScript
GLOBAL: {
  __TEST__: JSON.stringify(10)
}
```
- All passed values **must** be a `string`.

---

Enjoy :3