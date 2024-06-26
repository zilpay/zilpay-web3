import type { TabStream } from './stream/tab-stream';
import type { Params } from 'types';
import type { Subject } from './stream/subject';

import { uuidv4 } from 'lib/crypto/uuid';
import { MTypeTab, MTypeTabContent } from './stream/stream-keys';
import { ContentMessage } from './stream/secure-message';
import { RPCMethod } from 'config/methods';
import { ErrorMessages } from 'config/errors';

export type Response = {
  error?: unknown,
  result?: unknown;
}

export class HTTPProvider {
  #stream: TabStream;
  #subject: Subject;

  public RPCMethod = RPCMethod;
  public middleware = {
    request: {
      use() { }
    },
    response: {
      use() { }
    }
  };

  constructor(stream: TabStream, subject: Subject) {
    this.#stream = stream;
    this.#subject = subject;
  }

  public send(method: string, ...params: Params): Promise<Response> {
    const type = MTypeTab.CONTENT_PROXY_MEHTOD;
    const recipient = MTypeTabContent.CONTENT;
    const uuid = uuidv4();
    let sub: () => void;

    // Send to content.js
    new ContentMessage({
      type,
      payload: {
        params,
        method,
        uuid
      }
    }).send(this.#stream, recipient);

    const fulfilled: Promise<Response> = new Promise((resolve, reject) => {
      sub = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.CONTENT_PROXY_RESULT) return;
        if (!msg.payload || !msg.payload.uuid) return;
        if (msg.payload.uuid !== uuid) return;

        if (msg.payload && msg.payload.reject) {
          sub();
          return reject(new Error(msg.payload.reject));
        }

        delete msg.payload.uuid;
        sub();
        return resolve(msg.payload.resolve as Response);
      });
    });
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        if (sub) sub();
        reject(new Error(`${method} ${ErrorMessages.TimeOut}`));
      }, 5000);
    });

    return Promise.race([fulfilled, timeout]) as Promise<Response>;
  }
}
