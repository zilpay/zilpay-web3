
import { Handler } from './handler';
import { ZilPay } from './zilpay';

export const handler = Object.freeze(new Handler());
export const zilPay = Object.freeze(new ZilPay(handler.stream, handler.subject));
handler.initialized();
window['zilPay'] = zilPay;

