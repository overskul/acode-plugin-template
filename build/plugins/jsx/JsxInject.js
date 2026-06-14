export function JSXTagWrapper(tagName, tprops, ...children) {
  const props = {};

  for (const prop in tprops) {
    const { key, value } = handleProp(prop, tprops[prop]);
    props[key] = value;
  }

  if (children.length === 0) return tag(tagName, props);
  const flatChildren = children.flat(Infinity).filter(
    child => child !== null && child !== undefined && child !== false && child !== true
  );
  return tag(tagName, props, flatChildren);

  function handleProp(key, value) {
    if (key.startsWith('_'))
      return { key: key.slice(1), value };
    return { key, value };
  }
}

export function JSXFragmentWrapper({ children }) {
  return Array.isArray(children) ? children : [children];
}