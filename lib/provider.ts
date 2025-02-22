import type { Params } from 'types';
import type { Subject } from './stream/subject';

import { uuidv4 } from 'lib/crypto/uuid';
import { MTypeTab } from './stream/stream-keys';
import { ContentMessage } from './stream/secure-message';
import { RPCMethod } from 'config/methods';
import { ErrorMessages } from 'config/errors';
import { FlutterStream } from './stream';

export type Response = {
  error?: unknown,
  result?: unknown;
}

export class HTTPProvider {
  #stream: FlutterStream;
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

  constructor(stream: FlutterStream, subject: Subject) {
    this.#stream = stream;
    this.#subject = subject;
  }

  public send(method: string, ...params: Params): Promise<Response> {
    const type = MTypeTab.CONTENT_PROXY_MEHTOD;
    const uuid = uuidv4();
    let sub: () => void;

    new ContentMessage({
      type,
      uuid,
      payload: {
        id: "1",
        jsonrpc: "2.0",
        params,
        method,
      }
    }).send(this.#stream);

    const fulfilled: Promise<Response> = new Promise((resolve, reject) => {
      sub = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.CONTENT_PROXY_RESULT) return;
        if (!msg.payload || !msg.uuid) return;
        if (msg.uuid !== uuid) return;

        if (msg.payload && msg.payload.reject) {
          sub();
          return reject(new Error(msg.payload.reject));
        }

        delete msg.uuid;
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
