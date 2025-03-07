import type { MessageParams, TxParams } from "types";
import type { InpageWallet } from "types";
import type { Subject } from './stream/subject';
import type { TxBlock } from 'types';
import type { SignedMessage } from "types";
import type { InputCipherParams } from "types";

import assert from './assert';
import { uuidv4 } from './crypto/uuid';
import { Transaction } from "./transaction";
import { MTypeTab } from "./stream/stream-keys";
import { TypeOf } from "./type-checker";
import { ContentMessage } from "./stream/secure-message";
import { CryptoUtils } from "./crypto";
import { ErrorMessages } from "config/errors";
import { FlutterStream } from "./stream";
import { getMetaDataFromTags } from "./meta";

export class Wallet {
  #stream: FlutterStream;
  #subject: Subject;

  #isConnect = false;
  #isEnable = false;
  #http: string | null = null;
  #net = 'mainnet';
  #defaultAccount: InpageWallet | null = null;

  public txns = new Set<string>();

  public get isConnect() {
    return this.#isConnect;
  }

  public get isEnable() {
    return this.#isEnable;
  }

  public get net() {
    return this.#net;
  }

  public get defaultAccount() {
    return this.#defaultAccount;
  }

  public get http() {
    return this.#http;
  }

  constructor(stream: FlutterStream, subject: Subject) {
    this.#stream = stream;
    this.#subject = subject;

    if (globalThis.window || globalThis.document) {
      this.#subscribe();
    }
  }

  public observableAccount() {
    assert(this.isEnable, ErrorMessages.Disabled);
    assert(this.isConnect, ErrorMessages.Connect);

    return {
      subscribe: (cb: (account: InpageWallet) => void) => {
        if (this.#defaultAccount) {
          cb(this.#defaultAccount);
        }
        const obs = this.#subject.on((msg) => {
          let account: InpageWallet | null = null;

          switch (msg.type) {
            case MTypeTab.ADDRESS_CHANGED:
              account = msg.payload.account;
              break;
            case MTypeTab.GET_WALLET_DATA:
              account = msg.payload.account;
              break;
            case MTypeTab.LOCK_STAUS:
              account = msg.payload.account;
              break;
            case MTypeTab.RESPONSE_TO_DAPP:
              account = msg.payload.account;
              break;
            default:
              break;
          }

          if (account) {
            cb(account);
          }
        });

        return {
          unsubscribe: () => obs()
        };
      }
    };
  }

  /**
   * Observable for new block was created.
   */
  public observableBlock() {
    assert(this.isEnable, ErrorMessages.Disabled);
    assert(this.isConnect, ErrorMessages.Connect);
    const type = MTypeTab.WATCH_BLOCK;
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      payload: {},
      ...meta,
    }).send(this.#stream);

    return {
      subscribe: (cb: (block: TxBlock) => void) => {
        const obs = this.#subject.on((msg) => {
          if (msg.type === MTypeTab.NEW_BLOCK) {
            cb(msg.payload.block);
          }
        });

        return {
          unsubscribe: () => obs()
        };
      }
    };
  }

  public observableNetwork() {
    assert(this.isEnable, ErrorMessages.Disabled);
    assert(this.isConnect, ErrorMessages.Connect);

    return {
      subscribe: (cb: (net: string) => void) => {
        const obs = this.#subject.on((msg) => {
          switch (msg.type) {
            case MTypeTab.GET_WALLET_DATA:
              cb(msg.payload.network);
              break;
            case MTypeTab.NETWORK_CHANGED:
              cb(msg.payload.network);
              break;
            default:
              break;
          }
        });

        return {
          unsubscribe: () => obs()
        };
      }
    };
  }

  /**
   * @deprecated
   */
  public observableTransaction(...txns: string[]) {
    console.warn('this method is deprecated and will rework');
    assert(this.isEnable, ErrorMessages.Disabled);
    assert(this.isConnect, ErrorMessages.Connect);

    if (txns && txns.length !== 0) {
      this.addTransactionsQueue(...txns);
    }

    return {
      subscribe: (cb: (tx: string) => void) => {
        const obs = this.#subject.on((msg) => {
          if (msg.type !== MTypeTab.NEW_BLOCK) return;
          const block = msg.payload.block as TxBlock;

          for (let index = 0; index < block.TxHashes.length; index++) {
            const elements = block.TxHashes[index];
            for (let i = 0; i < elements.length; i++) {
              const hash = elements[i];
              if (this.txns.has(hash)) {
                cb(hash);
                this.txns.delete(hash);
              }
            }
          }
        });

        return {
          unsubscribe: () => obs()
        };
      }
    };
  }

  public addTransactionsQueue(...txns: string[]) {
    console.warn('this method is deprecated and will rework');
    for (let index = 0; index < txns.length; index++) {
      const tx = txns[index];
      this.txns.add(CryptoUtils.toHex(tx));
    }

    return Array.from(this.txns);
  }

  public async sign(arg: Transaction | string): Promise<SignedMessage | TxParams> {
    assert(this.isConnect, ErrorMessages.Connect);

    if (TypeOf.isString(arg)) {
      return this.#signMessage(String(arg));
    } else if (arg instanceof Transaction) {
      return this.#signTransaction(arg);
    }

    return Promise.reject(
      new TypeError(`payload ${ErrorMessages.MustBeObject} or ${ErrorMessages.MustBeString}`)
    );
  }

  public async connect(): Promise<boolean> {
    const type = MTypeTab.CONNECT_APP;
    const uuid = uuidv4();
    const payload = {};
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      uuid,
      payload,
      ...meta,
    }).send(this.#stream);

    return new Promise((resolve) => {
      const obs = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.RESPONSE_TO_DAPP) return;
        if (msg.uuid !== uuid) return;

        this.#isConnect = Boolean(msg.payload.account);
        this.#defaultAccount = (msg.payload.account as InpageWallet) || null;

        obs();
        return resolve(this.#isConnect);
      });
    });
  }

  public async encrypt(content: string): Promise<object> {
    const type = MTypeTab.ADD_ENCRYPTION;
    const uuid = uuidv4();
    const title = window.document.title;
    const payload: InputCipherParams = {
      title,
      content
    };
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      uuid,
      payload,
      ...meta,
    }).send(this.#stream);

    return new Promise((resolve, reject) => {
      const obs = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.RES_ENCRYPTION) return;
        if (msg.payload.uuid !== uuid) return;

        if (msg.payload && msg.payload.reject) {
          obs();
          return reject(msg.payload.reject);
        }

        obs();
        return resolve(msg.payload.resolve);
      });
    });
  }

  public async decrypt(content: string): Promise<object> {
    const type = MTypeTab.ADD_DECRYPTION;
    const uuid = uuidv4();
    const title = window.document.title;
    const payload: InputCipherParams = {
      title,
      content
    };
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      uuid,
      payload,
      ...meta,
    }).send(this.#stream);

    return new Promise((resolve, reject) => {
      const obs = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.RES_DECRYPTION) return;
        if (msg.uuid !== uuid) return;

        if (msg.payload && msg.payload.reject) {
          obs();
          return reject(msg.payload.reject);
        }

        obs();
        return resolve(msg.payload.resolve);
      });
    });
  }

  public async disconnect() {
    const type = MTypeTab.DISCONNECT_APP;
    const uuid = uuidv4();
    const payload = {};
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      uuid,
      payload,
      ...meta,
    }).send(this.#stream);

    return new Promise((resolve) => {
      const obs = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.RESPONSE_TO_DAPP) return;
        if (msg.uuid !== uuid) return;

        this.#isConnect = false;
        this.#defaultAccount = null;

        obs();
        return resolve(null);
      });
    });
  }

  #subscribe() {
    this.#subject.on((msg) => {
      switch (msg.type) {
        case MTypeTab.ADDRESS_CHANGED:
          this.#defaultAccount = msg.payload.account;
          break;
        case MTypeTab.GET_WALLET_DATA:
          this.#defaultAccount = msg.payload.account;
          this.#http = msg.payload.http;
          this.#net = msg.payload.network;
          this.#isConnect = msg.payload.isConnect;
          this.#isEnable = msg.payload.isEnable;
          break;
        case MTypeTab.LOCK_STAUS:
          this.#isEnable = msg.payload.isEnable;
          this.#defaultAccount = msg.payload.account;
          break;
        case MTypeTab.NETWORK_CHANGED:
          this.#net = msg.payload.network;
          // TODO: rename to http.
          this.#http = msg.payload.node;
          break;
        default:
          break;
      }
    });
  }

  #signMessage(message: string): Promise<SignedMessage> {
    const type = MTypeTab.SIGN_MESSAGE;
    const uuid = uuidv4();
    const title = window.document.title;
    const payload: MessageParams = {
      content: message,
      title,
    };
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      uuid,
      payload,
      ...meta,
    }).send(this.#stream);

    return new Promise((resolve, reject) => {
      const obs = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.SING_MESSAGE_RES) return;
        if (msg.uuid !== uuid) return;

        if (msg.payload && msg.payload.reject) {
          obs();
          return reject(msg.payload.reject);
        }

        obs();
        return resolve(msg.payload.resolve as SignedMessage);
      });
    });
  }

  #signTransaction(tx: Transaction): Promise<TxParams> {
    const type = MTypeTab.CALL_TO_SIGN_TX;
    const uuid = uuidv4();
    const payload = {
      ...tx.payload,
      title: window.document.title,
      nonce: undefined
    };
    const meta = getMetaDataFromTags();

    new ContentMessage({
      type,
      uuid,
      payload,
      ...meta,
    }).send(this.#stream);

    return new Promise((resolve, reject) => {
      const obs = this.#subject.on((msg) => {
        if (msg.type !== MTypeTab.TX_RESULT) return;
        if (msg.uuid !== uuid) return;

        if (msg.payload && msg.payload.reject) {
          obs();
          return reject(msg.payload.reject);
        }

        obs();
        return resolve(msg.payload.resolve as TxParams);
      });
    });
  }
}
