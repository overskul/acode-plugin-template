export class AcodePluginTemplate {
  async init(baseUrl, $page, { cacheFileUrl, cacheFile }) {
    // plugin initialisation
  }

  async destroy() {
    // plugin clean up
  }

  get pSettings() {
    return {
      list: [],
      cb: (key, value) => {}
    };
  }
}
