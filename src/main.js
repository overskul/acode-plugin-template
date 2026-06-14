import Plugin from "@/Plugin";

if (window.acode) {
  const plugin = new Plugin();
  acode.setPluginInit(__PLUGIN__.id, plugin.onInit.bind(plugin), plugin?.PSettings);
  acode.setPluginUnmount(__PLUGIN__.id, plugin.onDestroy.bind(plugin));
}
