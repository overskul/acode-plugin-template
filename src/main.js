import AcodePluginTemplate from './Plugin.js';

if (window.acode) {
  const mPlugin = new AcodePluginTemplate(__PLUGIN__);
  acode.setPluginInit(__PLUGIN__.id, mPlugin.init.bind(mPlugin), mPlugin?.pSettings);
  acode.setPluginUnmount(__PLUGIN__.id, mPlugin.destroy.bind(mPlugin));
}
