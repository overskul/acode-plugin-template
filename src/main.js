import Plugin from "@/[Plugin]";

if (window.acode) {
  const plugin = new Plugin();
  acode.setPluginInit(__PLUGIN__.id, plugin.onInit.bind(plugin), plugin.pageSettings);
  acode.setPluginUnmount(__PLUGIN__.id, async () => {
    const { pluginsDisabled } = acode.require("Settings").value;
    if (pluginsDisabled[__PLUGIN__.id] && typeof plugin.onDisable === "function") {
      await plugin.onDisable();
    } else {
      await plugin.onDestroy();
    }
  });
}
