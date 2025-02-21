import { ReqBody } from "types";
import { FlutterStream } from "./tab-stream";

export class ContentMessage {
  private readonly _body: ReqBody;

  public get type() {
    return this._body.type;
  }

  public get payload() {
    return this._body.payload;
  }

  constructor(msg: ReqBody) {
    this._body = msg;
  }

  public send(stream: FlutterStream) {
    const serialized = JSON.stringify(this._body);
    const deserialized = JSON.parse(serialized);
    stream.send(deserialized );
  }
}
