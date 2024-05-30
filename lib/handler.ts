import { MTypeTab, MTypeTabContent } from "./stream/stream-keys";
import { TabStream } from "./stream/tab-stream";
import { Subject } from './stream/subject';
import { ContentMessage } from './stream/secure-message';

export class Handler {
  public readonly stream = new TabStream(MTypeTabContent.INJECTED);
  public readonly subject = new Subject();

  constructor() {
    this.stream.listen((msg) => {
      this.subject.emit(msg);
    });
  }

  public initialized() {
    const type = MTypeTab.GET_WALLET_DATA;
    const recipient = MTypeTabContent.CONTENT;

    new ContentMessage({
      type,
      payload: {}
    }).send(this.stream, recipient);
  }
}
