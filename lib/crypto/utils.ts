/*
 * Project: ZilPay-wallet
 * Author: Rinat(hiccaru)
 * -----
 * Modified By: the developer formerly known as Rinat(hiccaru) at <lich666black@gmail.com>
 * -----
 * Copyright (c) 2021 ZilPay
 */
import { Validator } from './validator';
import { tohexString } from './hex';
import { fromBech32Address, toBech32Address } from './bech32';

export const CryptoUtils = {
  isValidChecksumAddress(address: string) {
    return (
      Validator.isAddress(tohexString(address)) && address
    );
  },
  fromBech32Address(address: string) {
    return fromBech32Address(address);
  },
  toHex(addr: string) {
    return tohexString(addr);
  },
  toBech32Address(addr: string) {
    if (Validator.isBech32(addr)) {
      return addr;
    }

    return toBech32Address(addr);
  },
  normaliseAddress(addr: string) {
    if (Validator.isBech32(addr)) {
      return this.fromBech32Address(addr);
    }
    if (Validator.isAddress(addr)) {
      return addr;
    }

    throw Error(
      'Wrong address format, should be either bech32 or checksummed address',
    );
  },
  toChecksumAddress(addr: string) {
    if (Validator.isBech32(addr)) {
      addr = this.fromBech32Address(addr);
    }

    return addr;
  }
};

