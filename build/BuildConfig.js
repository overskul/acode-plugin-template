export default {
  ENTRY: "src/main.js",
  OUTPUT: "dist/main.js",
  ZIP: "{id}-v{version}.{author.name}.acodeplugin",
  PORT: 3030,
  JSX: false,
  GLOBAL: {
    // __TEST__: JSON.stringify(10)
  }
}