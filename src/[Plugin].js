export default class AcodePluginTemplate {
  constructor() {
    // plugin constructor
  }

  async onInit(baseUrl, $page, { ctx, firstInit, cacheFileUrl, cacheFile }) {
    // plugin initialisation
  }

  async onDestroy() {
    // plugin clean up
  }

  async onDisable() {
    // plugin disabled
  }

  get pageSettings() {
    return {
      list: [],
      cb: (key, value) => {}
    };
  }
}
