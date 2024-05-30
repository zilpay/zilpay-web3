import { handler, zilPay } from './lib';

export function init() {
  if (!(globalThis.window as any)['zilPay']) {
    handler.initialized();
    (globalThis.window as any)['zilPay'] = zilPay;
  } else {
    console.warn('use inject');
  }
}
