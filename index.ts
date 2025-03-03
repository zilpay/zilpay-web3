import { handler, zilPay } from './lib';

(function () {
  (window as any).flutter_inappwebview = (window as any).flutter_inappwebview ?? {};
  if (!globalThis.window || !globalThis.document || (globalThis.window as any)['zilPay']) {
    console.warn('zilPay already exists or not in browser');
    return;
  }
  handler.initialized();
  (globalThis.window as any)['zilPay'] = zilPay;
  console.log('zilPay injected:', (globalThis.window as any)['zilPay']);
})();
