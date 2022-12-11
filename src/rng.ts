// Atari had a memory location that could be read for a byte of random noise
// but we'll instead use a reproducible 24-bit generator

import {webcrypto} from 'node:crypto';

interface Crypto {getRandomValues: (buf: ArrayBufferView) => ArrayBufferView}

const _crypto = webcrypto ?? (window && window.crypto) as Crypto;

type GeneratorT = {
  state: (seed?: number) => number,
  bit: () => number,
  byte: () => number,
  bits: (n: number) => number,
}

function lfsr24(seed?: number): GeneratorT {
  const beforezero = 0xEF41CC;   // arbitrary location to insert zero in the sequence

  seed ??= _crypto.getRandomValues(new Uint32Array(1))[0];
  let r: number;

  function bit() {
      const v = r & 0x1;
      if (r == beforezero) {
        r = 0;
      } else {
        if (r == 0) r = beforezero;   // continue on
        // constant via // https://en.wikipedia.org/wiki/Linear-feedback_shift_register
        r = (r >> 1) ^ (-(r & 1) & 0xe10000);
      }
      return v;
  }
  function bits(k: number): number {
    let v = 0;
    for (let i=0; i<k; i++) v = (v << 1) | bit();
    return v;
  }
  function state(seed?: number): number {
    if (seed != null) r = seed & 0xffffff;
    return r;
  }
  state(seed);

  return {
    state: state,
    bit: bit,
    bits: bits,
    byte: () => bits(8),
  }
}

export {lfsr24, GeneratorT};
