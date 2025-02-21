import { MTypeTab } from './stream/stream-keys';
import { Subject } from './stream/subject';
import { ContentMessage } from './stream/secure-message';
import { FlutterStream } from './stream';

export class Handler {
  public readonly stream = new FlutterStream();
  public readonly subject = new Subject();

  constructor() {
    if (globalThis.window) {
      this.stream.listen((msg) => {
        this.subject.emit(msg);
      });
    }
  }

  public initialized() {
    const type = MTypeTab.GET_WALLET_DATA;

    new ContentMessage({
      type,
      payload: {}
    }).send(this.stream);
  }
}
