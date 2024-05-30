import BN from 'bn.js';
import Long from 'long';
import { isBech32, isByteString } from './hex';

export const Validator = {
  isAddress(x: unknown) {
    return isByteString(String(x), 40);
  },
  isBech32(x: unknown) {
    return isBech32(String(x));
  },
  isBN(x: unknown) {
    return BN.isBN(x);
  },
  isLong(x: unknown) {
    return Long.isLong(x);
  }
};

