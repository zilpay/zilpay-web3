export function tohexString(hex: string) {
  return String(hex).toLowerCase().replace('0x', '');
}

export const isByteString = (str: string, len: number) => {
  return Boolean(tohexString(str).match(`^[0-9a-fA-F]{${len}}$`));
};

export const isAddress = (address: string) => {
  if (!isByteString(address, 40)) {
    throw new Error('Base16NotValid');
  }
};

export const isBech32 = (raw: string) => {
  return !!raw.match(/^zil1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/);
};

