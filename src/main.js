import plugin from '../plugin.json';
import { AcodePluginTemplate } from './Plugin.js';

if (window.acode) {
  const mPlugin = new AcodePluginTemplate();
  acode.setPluginInit(plugin.id, mPlugin.init.bind(mPlugin), mPlugin.pSettings);
  acode.setPluginUnmount(plugin.id, mPlugin.destroy.bind(mPlugin));
}
