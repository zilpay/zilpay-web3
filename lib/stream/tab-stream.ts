import { ReqBody } from "types";

export class FlutterStream {
  constructor() {
    this.#setupListener();
  }

  public listen(cb: (payload: ReqBody) => void) {
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data) {
        cb(data);
      }
    });
  }

  public send(data: ReqBody) {
    if (typeof window !== 'undefined' && window.flutter_inappwebview?.callHandler) {
      window.flutter_inappwebview.callHandler('ZilPayLegacy', JSON.stringify(data))
        .catch(() => {
          if (window.ZilPayLegacy) {
            window.ZilPayLegacy.postMessage(JSON.stringify(data));
          } else {
            window.postMessage(data, '*');
          }
        });
    } else if (window.ZilPayLegacy) {
      window.ZilPayLegacy.postMessage(JSON.stringify(data));
    } else {
      window.postMessage(data, '*');
    }
  }

  #setupListener() {
    if (!(window as any).ZilPayLegacy) {
      (window as any).ZilPayLegacy = {
        postMessage: (msg: string) => {
          window.postMessage(JSON.parse(msg), '*');
        }
      };
    }
  }
}

declare global {
  interface Window {
    ZilPayLegacy?: {
      postMessage: (msg: string) => void;
    };
    flutter_inappwebview?: {
      callHandler: (handlerName: string, ...args: any[]) => Promise<any>;
    };
  }
}
