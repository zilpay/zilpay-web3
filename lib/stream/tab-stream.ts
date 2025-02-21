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
    (window as any).FlutterWebView?.postMessage(JSON.stringify(data));
  }

  #setupListener() {
    if (!(window as any).FlutterWebView) {
      (window as any).FlutterWebView = {
        postMessage: (msg: string) => {
          window.postMessage(JSON.parse(msg), '*');
        }
      };
    }
  }
}
