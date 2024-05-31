export function getFavicon() {
  let ref = globalThis.document.querySelector<HTMLLinkElement>('link[rel*=\'icon\']');

  if (!ref) {
    throw new Error('website favicon is required');
  }

  return ref.href;
}

