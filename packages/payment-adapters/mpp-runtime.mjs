import {createRequire as __labRequire} from "node:module"; const require=__labRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/cryptoNode.js
import * as nc from "node:crypto";
var crypto2;
var init_cryptoNode = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/cryptoNode.js"() {
    crypto2 = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : nc && typeof nc === "object" && "randomBytes" in nc ? nc : void 0;
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function rotl(word, shift) {
  return word << shift | word >>> 32 - shift >>> 0;
}
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array2 = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array2[ai] = n1 * 16 + n2;
  }
  return array2;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function kdfInputToBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad4 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad4);
    pad4 += a.length;
  }
  return res;
}
function checkOpts(defaults2, opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new Error("options should be object or undefined");
  const merged = Object.assign(defaults2, opts);
  return merged;
}
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto2 && typeof crypto2.getRandomValues === "function") {
    return crypto2.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto2 && typeof crypto2.randomBytes === "function") {
    return Uint8Array.from(crypto2.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}
var isLE, swap32IfBE, hasHexBuiltin, hexes, asciis, Hash;
var init_utils = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js"() {
    init_cryptoNode();
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    swap32IfBE = isLE ? (u) => u : byteSwap32;
    hasHexBuiltin = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    Hash = class {
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/hmac.js
var HMAC, hmac;
var init_hmac = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/hmac.js"() {
    init_utils();
    HMAC = class extends Hash {
      constructor(hash2, _key) {
        super();
        this.finished = false;
        this.destroyed = false;
        ahash(hash2);
        const key = toBytes(_key);
        this.iHash = hash2.create();
        if (typeof this.iHash.update !== "function")
          throw new Error("Expected instance of class which extends utils.Hash");
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad4 = new Uint8Array(blockLen);
        pad4.set(key.length > blockLen ? hash2.create().update(key).digest() : key);
        for (let i = 0; i < pad4.length; i++)
          pad4[i] ^= 54;
        this.iHash.update(pad4);
        this.oHash = hash2.create();
        for (let i = 0; i < pad4.length; i++)
          pad4[i] ^= 54 ^ 92;
        this.oHash.update(pad4);
        clean(pad4);
      }
      update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
      }
      digestInto(out) {
        aexists(this);
        abytes(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
      }
      digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
      }
      _cloneInto(to) {
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
      destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
      }
    };
    hmac = (hash2, key, message) => new HMAC(hash2, key).update(message).digest();
    hmac.create = (hash2, key) => new HMAC(hash2, key);
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD, SHA256_IV, SHA512_IV;
var init_md = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_md.js"() {
    init_utils();
    HashMD = class extends Hash {
      constructor(blockLen, outputLen, padOffset, isLE2) {
        super();
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE2;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
      }
      update(data) {
        aexists(this);
        data = toBytes(data);
        abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          if (take === blockLen) {
            const dataView = createView(data);
            for (; blockLen <= len - pos; pos += blockLen)
              this.process(dataView, pos);
            continue;
          }
          buffer.set(data.subarray(pos, pos + take), this.pos);
          this.pos += take;
          pos += take;
          if (this.pos === blockLen) {
            this.process(view, 0);
            this.pos = 0;
          }
        }
        this.length += data.length;
        this.roundClean();
        return this;
      }
      digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const { buffer, view, blockLen, isLE: isLE2 } = this;
        let { pos } = this;
        buffer[pos++] = 128;
        clean(this.buffer.subarray(pos));
        if (this.padOffset > blockLen - pos) {
          this.process(view, 0);
          pos = 0;
        }
        for (let i = pos; i < blockLen; i++)
          buffer[i] = 0;
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        if (len % 4)
          throw new Error("_sha2: outputLen should be aligned to 32bit");
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
          throw new Error("_sha2: outputLen bigger than state");
        for (let i = 0; i < outLen; i++)
          oview.setUint32(4 * i, state[i], isLE2);
      }
      digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
      }
      _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        if (length % blockLen)
          to.buffer.set(buffer);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
    };
    SHA256_IV = /* @__PURE__ */ Uint32Array.from([
      1779033703,
      3144134277,
      1013904242,
      2773480762,
      1359893119,
      2600822924,
      528734635,
      1541459225
    ]);
    SHA512_IV = /* @__PURE__ */ Uint32Array.from([
      1779033703,
      4089235720,
      3144134277,
      2227873595,
      1013904242,
      4271175723,
      2773480762,
      1595750129,
      1359893119,
      2917565137,
      2600822924,
      725511199,
      528734635,
      4215389547,
      1541459225,
      327033209
    ]);
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_u64.js
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var U32_MASK64, _32n, shrSH, shrSL, rotrSH, rotrSL, rotrBH, rotrBL, rotlSH, rotlSL, rotlBH, rotlBL, add3L, add3H, add4L, add4H, add5L, add5H;
var init_u64 = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_u64.js"() {
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    shrSH = (h, _l, s) => h >>> s;
    shrSL = (h, l, s) => h << 32 - s | l >>> s;
    rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
    add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
    add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha3.js
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  clean(B);
}
var _0n, _1n, _2n, _7n, _256n, _0x71n, SHA3_PI, SHA3_ROTL, _SHA3_IOTA, IOTAS, SHA3_IOTA_H, SHA3_IOTA_L, rotlH, rotlL, Keccak, gen, keccak_256;
var init_sha3 = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha3.js"() {
    init_u64();
    init_utils();
    _0n = BigInt(0);
    _1n = BigInt(1);
    _2n = BigInt(2);
    _7n = BigInt(7);
    _256n = BigInt(256);
    _0x71n = BigInt(113);
    SHA3_PI = [];
    SHA3_ROTL = [];
    _SHA3_IOTA = [];
    for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
        R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n)
          t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
      }
      _SHA3_IOTA.push(t);
    }
    IOTAS = split(_SHA3_IOTA, true);
    SHA3_IOTA_H = IOTAS[0];
    SHA3_IOTA_L = IOTAS[1];
    rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
    rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
    Keccak = class _Keccak extends Hash {
      // NOTE: we accept arguments in bytes instead of bits here.
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        this.enableXOF = false;
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        anumber(outputLen);
        if (!(0 < blockLen && blockLen < 200))
          throw new Error("only keccak-f1600 function is supported");
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
      }
      clone() {
        return this._cloneInto();
      }
      keccak() {
        swap32IfBE(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE(this.state32);
        this.posOut = 0;
        this.pos = 0;
      }
      update(data) {
        aexists(this);
        data = toBytes(data);
        abytes(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          for (let i = 0; i < take; i++)
            state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen)
            this.keccak();
        }
        return this;
      }
      finish() {
        if (this.finished)
          return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1)
          this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
      }
      writeInto(out) {
        aexists(this, false);
        abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
          if (this.posOut >= blockLen)
            this.keccak();
          const take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
      xofInto(out) {
        if (!this.enableXOF)
          throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
      }
      xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
        aoutput(out, this);
        if (this.finished)
          throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
      }
      digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
        this.destroyed = true;
        clean(this.state);
      }
      _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    };
    gen = (suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen));
    keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 256 / 8))();
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha2.js
var SHA256_K, SHA256_W, SHA256, K512, SHA512_Kh, SHA512_Kl, SHA512_W_H, SHA512_W_L, SHA512, sha256, sha512;
var init_sha2 = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha2.js"() {
    init_md();
    init_u64();
    init_utils();
    SHA256_K = /* @__PURE__ */ Uint32Array.from([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    SHA256 = class extends HashMD {
      constructor(outputLen = 32) {
        super(64, outputLen, 8, false);
        this.A = SHA256_IV[0] | 0;
        this.B = SHA256_IV[1] | 0;
        this.C = SHA256_IV[2] | 0;
        this.D = SHA256_IV[3] | 0;
        this.E = SHA256_IV[4] | 0;
        this.F = SHA256_IV[5] | 0;
        this.G = SHA256_IV[6] | 0;
        this.H = SHA256_IV[7] | 0;
      }
      get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
      }
      // prettier-ignore
      set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
      }
      process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
          SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
          const W15 = SHA256_W[i - 15];
          const W2 = SHA256_W[i - 2];
          const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
          const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
          SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
        }
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
          const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
          const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
          const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
          const T2 = sigma0 + Maj(A, B, C) | 0;
          H = G;
          G = F;
          F = E;
          E = D + T1 | 0;
          D = C;
          C = B;
          B = A;
          A = T1 + T2 | 0;
        }
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G = G + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G, H);
      }
      roundClean() {
        clean(SHA256_W);
      }
      destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
      }
    };
    K512 = /* @__PURE__ */ (() => split([
      "0x428a2f98d728ae22",
      "0x7137449123ef65cd",
      "0xb5c0fbcfec4d3b2f",
      "0xe9b5dba58189dbbc",
      "0x3956c25bf348b538",
      "0x59f111f1b605d019",
      "0x923f82a4af194f9b",
      "0xab1c5ed5da6d8118",
      "0xd807aa98a3030242",
      "0x12835b0145706fbe",
      "0x243185be4ee4b28c",
      "0x550c7dc3d5ffb4e2",
      "0x72be5d74f27b896f",
      "0x80deb1fe3b1696b1",
      "0x9bdc06a725c71235",
      "0xc19bf174cf692694",
      "0xe49b69c19ef14ad2",
      "0xefbe4786384f25e3",
      "0x0fc19dc68b8cd5b5",
      "0x240ca1cc77ac9c65",
      "0x2de92c6f592b0275",
      "0x4a7484aa6ea6e483",
      "0x5cb0a9dcbd41fbd4",
      "0x76f988da831153b5",
      "0x983e5152ee66dfab",
      "0xa831c66d2db43210",
      "0xb00327c898fb213f",
      "0xbf597fc7beef0ee4",
      "0xc6e00bf33da88fc2",
      "0xd5a79147930aa725",
      "0x06ca6351e003826f",
      "0x142929670a0e6e70",
      "0x27b70a8546d22ffc",
      "0x2e1b21385c26c926",
      "0x4d2c6dfc5ac42aed",
      "0x53380d139d95b3df",
      "0x650a73548baf63de",
      "0x766a0abb3c77b2a8",
      "0x81c2c92e47edaee6",
      "0x92722c851482353b",
      "0xa2bfe8a14cf10364",
      "0xa81a664bbc423001",
      "0xc24b8b70d0f89791",
      "0xc76c51a30654be30",
      "0xd192e819d6ef5218",
      "0xd69906245565a910",
      "0xf40e35855771202a",
      "0x106aa07032bbd1b8",
      "0x19a4c116b8d2d0c8",
      "0x1e376c085141ab53",
      "0x2748774cdf8eeb99",
      "0x34b0bcb5e19b48a8",
      "0x391c0cb3c5c95a63",
      "0x4ed8aa4ae3418acb",
      "0x5b9cca4f7763e373",
      "0x682e6ff3d6b2b8a3",
      "0x748f82ee5defb2fc",
      "0x78a5636f43172f60",
      "0x84c87814a1f0ab72",
      "0x8cc702081a6439ec",
      "0x90befffa23631e28",
      "0xa4506cebde82bde9",
      "0xbef9a3f7b2c67915",
      "0xc67178f2e372532b",
      "0xca273eceea26619c",
      "0xd186b8c721c0c207",
      "0xeada7dd6cde0eb1e",
      "0xf57d4f7fee6ed178",
      "0x06f067aa72176fba",
      "0x0a637dc5a2c898a6",
      "0x113f9804bef90dae",
      "0x1b710b35131c471b",
      "0x28db77f523047d84",
      "0x32caab7b40c72493",
      "0x3c9ebe0a15c9bebc",
      "0x431d67c49c100d4c",
      "0x4cc5d4becb3e42b6",
      "0x597f299cfc657e2a",
      "0x5fcb6fab3ad6faec",
      "0x6c44198c4a475817"
    ].map((n) => BigInt(n))))();
    SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
    SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
    SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
    SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
    SHA512 = class extends HashMD {
      constructor(outputLen = 64) {
        super(128, outputLen, 16, false);
        this.Ah = SHA512_IV[0] | 0;
        this.Al = SHA512_IV[1] | 0;
        this.Bh = SHA512_IV[2] | 0;
        this.Bl = SHA512_IV[3] | 0;
        this.Ch = SHA512_IV[4] | 0;
        this.Cl = SHA512_IV[5] | 0;
        this.Dh = SHA512_IV[6] | 0;
        this.Dl = SHA512_IV[7] | 0;
        this.Eh = SHA512_IV[8] | 0;
        this.El = SHA512_IV[9] | 0;
        this.Fh = SHA512_IV[10] | 0;
        this.Fl = SHA512_IV[11] | 0;
        this.Gh = SHA512_IV[12] | 0;
        this.Gl = SHA512_IV[13] | 0;
        this.Hh = SHA512_IV[14] | 0;
        this.Hl = SHA512_IV[15] | 0;
      }
      // prettier-ignore
      get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
      }
      // prettier-ignore
      set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
      }
      process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4) {
          SHA512_W_H[i] = view.getUint32(offset);
          SHA512_W_L[i] = view.getUint32(offset += 4);
        }
        for (let i = 16; i < 80; i++) {
          const W15h = SHA512_W_H[i - 15] | 0;
          const W15l = SHA512_W_L[i - 15] | 0;
          const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
          const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
          const W2h = SHA512_W_H[i - 2] | 0;
          const W2l = SHA512_W_L[i - 2] | 0;
          const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
          const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
          const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
          const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
          SHA512_W_H[i] = SUMh | 0;
          SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        for (let i = 0; i < 80; i++) {
          const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
          const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
          const CHIh = Eh & Fh ^ ~Eh & Gh;
          const CHIl = El & Fl ^ ~El & Gl;
          const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
          const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
          const T1l = T1ll | 0;
          const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
          const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
          const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
          const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
          Hh = Gh | 0;
          Hl = Gl | 0;
          Gh = Fh | 0;
          Gl = Fl | 0;
          Fh = Eh | 0;
          Fl = El | 0;
          ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
          Dh = Ch | 0;
          Dl = Cl | 0;
          Ch = Bh | 0;
          Cl = Bl | 0;
          Bh = Ah | 0;
          Bl = Al | 0;
          const All = add3L(T1l, sigma0l, MAJl);
          Ah = add3H(All, T1h, sigma0h, MAJh);
          Al = All | 0;
        }
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
      }
      roundClean() {
        clean(SHA512_W_H, SHA512_W_L);
      }
      destroy() {
        clean(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
    };
    sha256 = /* @__PURE__ */ createHasher(() => new SHA256());
    sha512 = /* @__PURE__ */ createHasher(() => new SHA512());
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/utils.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes2(item) {
  if (!isBytes2(item))
    throw new Error("Uint8Array expected");
}
function abool(title, value) {
  if (typeof value !== "boolean")
    throw new Error(title + " boolean expected, got " + value);
}
function numberToHexUnpadded(num2) {
  const hex = num2.toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n2 : BigInt("0x" + hex);
}
function bytesToHex2(bytes) {
  abytes2(bytes);
  if (hasHexBuiltin2)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes2[bytes[i]];
  }
  return hex;
}
function asciiToBase162(ch) {
  if (ch >= asciis2._0 && ch <= asciis2._9)
    return ch - asciis2._0;
  if (ch >= asciis2.A && ch <= asciis2.F)
    return ch - (asciis2.A - 10);
  if (ch >= asciis2.a && ch <= asciis2.f)
    return ch - (asciis2.a - 10);
  return;
}
function hexToBytes2(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin2)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array2 = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase162(hex.charCodeAt(hi));
    const n2 = asciiToBase162(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array2[ai] = n1 * 16 + n2;
  }
  return array2;
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex2(bytes));
}
function bytesToNumberLE(bytes) {
  abytes2(bytes);
  return hexToNumber(bytesToHex2(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes2(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes2(hex);
    } catch (e) {
      throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
    }
  } else if (isBytes2(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(title + " must be hex string or Uint8Array");
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(title + " of length " + expectedLength + " expected, got " + len);
  return res;
}
function concatBytes2(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad4 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad4);
    pad4 += a.length;
  }
  return res;
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function utf8ToBytes2(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n2; n >>= _1n2, len += 1)
    ;
  return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...b) => hmacFn(k, v, ...b);
  const reseed = (seed = u8n(0)) => {
    k = h(u8fr([0]), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8fr([1]), seed);
    v = h();
  };
  const gen2 = () => {
    if (i++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes2(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen2())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object2, validators, optValidators = {}) {
  const checkField = (fieldName, type, isOptional) => {
    const checkVal = validatorFns[type];
    if (typeof checkVal !== "function")
      throw new Error("invalid validator function");
    const val = object2[fieldName];
    if (isOptional && val === void 0)
      return;
    if (!checkVal(val, object2)) {
      throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
    }
  };
  for (const [fieldName, type] of Object.entries(validators))
    checkField(fieldName, type, false);
  for (const [fieldName, type] of Object.entries(optValidators))
    checkField(fieldName, type, true);
  return object2;
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
var _0n2, _1n2, hasHexBuiltin2, hexes2, asciis2, isPosBig, bitMask, u8n, u8fr, validatorFns;
var init_utils2 = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/utils.js"() {
    _0n2 = /* @__PURE__ */ BigInt(0);
    _1n2 = /* @__PURE__ */ BigInt(1);
    hasHexBuiltin2 = // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function";
    hexes2 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    asciis2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    isPosBig = (n) => typeof n === "bigint" && _0n2 <= n;
    bitMask = (n) => (_1n2 << BigInt(n)) - _1n2;
    u8n = (len) => new Uint8Array(len);
    u8fr = (arr) => Uint8Array.from(arr);
    validatorFns = {
      bigint: (val) => typeof val === "bigint",
      function: (val) => typeof val === "function",
      boolean: (val) => typeof val === "boolean",
      string: (val) => typeof val === "string",
      stringOrUint8Array: (val) => typeof val === "string" || isBytes2(val),
      isSafeInteger: (val) => Number.isSafeInteger(val),
      array: (val) => Array.isArray(val),
      field: (val, object2) => object2.Fp.isValid(val),
      hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/modular.js
function mod(a, b) {
  const result = a % b;
  return result >= _0n3 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n3) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number3, modulo) {
  if (number3 === _0n3)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n3)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number3, modulo);
  let b = modulo;
  let x = _0n3, y = _1n3, u = _1n3, v = _0n3;
  while (a !== _0n3) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n3)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n3) / _4n;
  const root = Fp.pow(n, p1div4);
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n2);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n2), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
  return root;
}
function tonelliShanks(P) {
  if (P < BigInt(3))
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n3;
  let S = 0;
  while (Q % _2n2 === _0n3) {
    Q /= _2n2;
    S++;
  }
  let Z = _2n2;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n3) / _2n2;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n3 << BigInt(M - i - 1);
      const b = Fp.pow(c, exponent);
      M = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  return tonelliShanks(P);
}
function validateField(field) {
  const initial3 = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "isSafeInteger",
    BITS: "isSafeInteger"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial3);
  return validateObject(field, opts);
}
function FpPow(Fp, num2, power) {
  if (power < _0n3)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n3)
    return Fp.ONE;
  if (power === _1n3)
    return num2;
  let p = Fp.ONE;
  let d = num2;
  while (power > _0n3) {
    if (power & _1n3)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n3;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num2);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n3) / _2n2;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLen2, isLE2 = false, redef = {}) {
  if (ORDER <= _0n3)
    throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
  if (BYTES > 2048)
    throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let sqrtP;
  const f = Object.freeze({
    ORDER,
    isLE: isLE2,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n3,
    ONE: _1n3,
    create: (num2) => mod(num2, ORDER),
    isValid: (num2) => {
      if (typeof num2 !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num2);
      return _0n3 <= num2 && num2 < ORDER;
    },
    is0: (num2) => num2 === _0n3,
    isOdd: (num2) => (num2 & _1n3) === _1n3,
    neg: (num2) => mod(-num2, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num2) => mod(num2 * num2, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num2, power) => FpPow(f, num2, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    // Same as above, but doesn't normalize
    sqrN: (num2) => num2 * num2,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num2) => invert(num2, ORDER),
    sqrt: redef.sqrt || ((n) => {
      if (!sqrtP)
        sqrtP = FpSqrt(ORDER);
      return sqrtP(f, n);
    }),
    toBytes: (num2) => isLE2 ? numberToBytesLE(num2, BYTES) : numberToBytesBE(num2, BYTES),
    fromBytes: (bytes) => {
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      return isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    },
    // TODO: we don't need it here, move out to separate fn
    invertBatch: (lst) => FpInvertBatch(f, lst),
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov: (a, b, c) => c ? b : a
  });
  return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE2 = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n3) + _1n3;
  return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
var _0n3, _1n3, _2n2, _3n, _4n, _5n, _8n, FIELD_FIELDS;
var init_modular = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/modular.js"() {
    init_utils();
    init_utils2();
    _0n3 = BigInt(0);
    _1n3 = BigInt(1);
    _2n2 = /* @__PURE__ */ BigInt(2);
    _3n = /* @__PURE__ */ BigInt(3);
    _4n = /* @__PURE__ */ BigInt(4);
    _5n = /* @__PURE__ */ BigInt(5);
    _8n = /* @__PURE__ */ BigInt(8);
    FIELD_FIELDS = [
      "create",
      "isValid",
      "is0",
      "neg",
      "inv",
      "sqrt",
      "sqr",
      "eql",
      "add",
      "sub",
      "mul",
      "pow",
      "div",
      "addN",
      "subN",
      "mulN",
      "sqrN"
    ];
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/curve.js
function constTimeNegate(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n4;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
  if (!Array.isArray(points))
    throw new Error("array expected");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error("invalid scalar at index " + i);
  });
}
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function wNAF(c, bits) {
  return {
    constTimeNegate,
    hasPrecomputes(elm) {
      return getW(elm) !== 1;
    },
    // non-const time multiplication ladder
    unsafeLadder(elm, n, p = c.ZERO) {
      let d = elm;
      while (n > _0n4) {
        if (n & _1n4)
          p = p.add(d);
        d = d.double();
        n >>= _1n4;
      }
      return p;
    },
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param elm Point instance
     * @param W window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(elm, W) {
      const { windows, windowSize } = calcWOpts(W, bits);
      const points = [];
      let p = elm;
      let base3 = p;
      for (let window = 0; window < windows; window++) {
        base3 = p;
        points.push(base3);
        for (let i = 1; i < windowSize; i++) {
          base3 = base3.add(p);
          points.push(base3);
        }
        p = base3.double();
      }
      return points;
    },
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
      let p = c.ZERO;
      let f = c.BASE;
      const wo = calcWOpts(W, bits);
      for (let window = 0; window < wo.windows; window++) {
        const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
        n = nextN;
        if (isZero) {
          f = f.add(constTimeNegate(isNegF, precomputes[offsetF]));
        } else {
          p = p.add(constTimeNegate(isNeg, precomputes[offset]));
        }
      }
      return { p, f };
    },
    /**
     * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @param acc accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
      const wo = calcWOpts(W, bits);
      for (let window = 0; window < wo.windows; window++) {
        if (n === _0n4)
          break;
        const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
        n = nextN;
        if (isZero) {
          continue;
        } else {
          const item = precomputes[offset];
          acc = acc.add(isNeg ? item.negate() : item);
        }
      }
      return acc;
    },
    getPrecomputes(W, P, transform2) {
      let comp = pointPrecomputes.get(P);
      if (!comp) {
        comp = this.precomputeWindow(P, W);
        if (W !== 1)
          pointPrecomputes.set(P, transform2(comp));
      }
      return comp;
    },
    wNAFCached(P, n, transform2) {
      const W = getW(P);
      return this.wNAF(W, this.getPrecomputes(W, P, transform2), n);
    },
    wNAFCachedUnsafe(P, n, transform2, prev) {
      const W = getW(P);
      if (W === 1)
        return this.unsafeLadder(P, n, prev);
      return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform2), n, prev);
    },
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    setWindowSize(P, W) {
      validateW(W, bits);
      pointWindowSizes.set(P, W);
      pointPrecomputes.delete(P);
    }
  };
}
function pippenger(c, fieldN, points, scalars) {
  validateMSMPoints(points, c);
  validateMSMScalars(scalars, fieldN);
  const plength = points.length;
  const slength = scalars.length;
  if (plength !== slength)
    throw new Error("arrays of points and scalars must have equal length");
  const zero = c.ZERO;
  const wbits = bitLen(BigInt(plength));
  let windowSize = 1;
  if (wbits > 12)
    windowSize = wbits - 3;
  else if (wbits > 4)
    windowSize = wbits - 2;
  else if (wbits > 0)
    windowSize = 2;
  const MASK = bitMask(windowSize);
  const buckets = new Array(Number(MASK) + 1).fill(zero);
  const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
  let sum = zero;
  for (let i = lastBits; i >= 0; i -= windowSize) {
    buckets.fill(zero);
    for (let j = 0; j < slength; j++) {
      const scalar = scalars[j];
      const wbits2 = Number(scalar >> BigInt(i) & MASK);
      buckets[wbits2] = buckets[wbits2].add(points[j]);
    }
    let resI = zero;
    for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum = sum.add(resI);
    if (i !== 0)
      for (let j = 0; j < windowSize; j++)
        sum = sum.double();
  }
  return sum;
}
function validateBasic(curve) {
  validateField(curve.Fp);
  validateObject(curve, {
    n: "bigint",
    h: "bigint",
    Gx: "field",
    Gy: "field"
  }, {
    nBitLength: "isSafeInteger",
    nByteLength: "isSafeInteger"
  });
  return Object.freeze({
    ...nLength(curve.n, curve.nBitLength),
    ...curve,
    ...{ p: curve.Fp.ORDER }
  });
}
var _0n4, _1n4, pointPrecomputes, pointWindowSizes;
var init_curve = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/curve.js"() {
    init_modular();
    init_utils2();
    _0n4 = BigInt(0);
    _1n4 = BigInt(1);
    pointPrecomputes = /* @__PURE__ */ new WeakMap();
    pointWindowSizes = /* @__PURE__ */ new WeakMap();
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/weierstrass.js
function validateSigVerOpts(opts) {
  if (opts.lowS !== void 0)
    abool("lowS", opts.lowS);
  if (opts.prehash !== void 0)
    abool("prehash", opts.prehash);
}
function validatePointOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    a: "field",
    b: "field"
  }, {
    allowInfinityPoint: "boolean",
    allowedPrivateKeyLengths: "array",
    clearCofactor: "function",
    fromBytes: "function",
    isTorsionFree: "function",
    toBytes: "function",
    wrapPrivateKey: "boolean"
  });
  const { endo, Fp, a } = opts;
  if (endo) {
    if (!Fp.eql(a, Fp.ZERO)) {
      throw new Error("invalid endo: CURVE.a must be 0");
    }
    if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
      throw new Error('invalid endo: expected "beta": bigint and "splitScalar": function');
    }
  }
  return Object.freeze({ ...opts });
}
function numToSizedHex(num2, size4) {
  return bytesToHex2(numberToBytesBE(num2, size4));
}
function weierstrassPoints(opts) {
  const CURVE = validatePointOpts(opts);
  const { Fp } = CURVE;
  const Fn = Field(CURVE.n, CURVE.nBitLength);
  const toBytes6 = CURVE.toBytes || ((_c, point, _isCompressed) => {
    const a = point.toAffine();
    return concatBytes2(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
  });
  const fromBytes4 = CURVE.fromBytes || ((bytes) => {
    const tail = bytes.subarray(1);
    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
    return { x, y };
  });
  function weierstrassEquation(x) {
    const { a, b } = CURVE;
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function isWithinCurveOrder(num2) {
    return inRange(num2, _1n5, CURVE.n);
  }
  function normPrivateKeyToScalar(key) {
    const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
    if (lengths && typeof key !== "bigint") {
      if (isBytes2(key))
        key = bytesToHex2(key);
      if (typeof key !== "string" || !lengths.includes(key.length))
        throw new Error("invalid private key");
      key = key.padStart(nByteLength * 2, "0");
    }
    let num2;
    try {
      num2 = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
    } catch (error) {
      throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
    }
    if (wrapPrivateKey)
      num2 = mod(num2, N);
    aInRange("private key", num2, _1n5, N);
    return num2;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point3))
      throw new Error("ProjectivePoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { px: x, py: y, pz: z } = p;
    if (Fp.eql(z, Fp.ONE))
      return { x, y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(z);
    const ax = Fp.mul(x, iz);
    const ay = Fp.mul(y, iz);
    const zz = Fp.mul(z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x: ax, y: ay };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (CURVE.allowInfinityPoint && !Fp.is0(p.py))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not FE");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  class Point3 {
    constructor(px, py, pz) {
      if (px == null || !Fp.isValid(px))
        throw new Error("x required");
      if (py == null || !Fp.isValid(py) || Fp.is0(py))
        throw new Error("y required");
      if (pz == null || !Fp.isValid(pz))
        throw new Error("z required");
      this.px = px;
      this.py = py;
      this.pz = pz;
      Object.freeze(this);
    }
    // Does not validate if the point is on-curve.
    // Use fromHex instead, or call assertValidity() later.
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point3)
        throw new Error("projective point not allowed");
      const is0 = (i) => Fp.eql(i, Fp.ZERO);
      if (is0(x) && is0(y))
        return Point3.ZERO;
      return new Point3(x, y, Fp.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     * Takes a bunch of Projective Points but executes only one
     * inversion on all of them. Inversion is very slow operation,
     * so this improves performance massively.
     * Optimization: converts a list of projective points to a list of identical points with Z=1.
     */
    static normalizeZ(points) {
      const toInv = FpInvertBatch(Fp, points.map((p) => p.pz));
      return points.map((p, i) => p.toAffine(toInv[i])).map(Point3.fromAffine);
    }
    /**
     * Converts hash string or Uint8Array to Point.
     * @param hex short/long ECDSA hex
     */
    static fromHex(hex) {
      const P = Point3.fromAffine(fromBytes4(ensureBytes("pointHex", hex)));
      P.assertValidity();
      return P;
    }
    // Multiplies generator point by privateKey.
    static fromPrivateKey(privateKey) {
      return Point3.BASE.multiply(normPrivateKeyToScalar(privateKey));
    }
    // Multiscalar Multiplication
    static msm(points, scalars) {
      return pippenger(Point3, Fn, points, scalars);
    }
    // "Private method", don't use it directly
    _setWindowSize(windowSize) {
      wnaf.setWindowSize(this, windowSize);
    }
    // A point on curve is valid if it conforms to equation.
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (Fp.isOdd)
        return !Fp.isOdd(y);
      throw new Error("Field doesn't support isOdd");
    }
    /**
     * Compare one point to another.
     */
    equals(other) {
      aprjpoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /**
     * Flips point to one corresponding to (x, -y) in Affine coordinates.
     */
    negate() {
      return new Point3(this.px, Fp.neg(this.py), this.pz);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { px: X1, py: Y1, pz: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point3(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point3(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point3.ZERO);
    }
    wNAF(n) {
      return wnaf.wNAFCached(this, n, Point3.normalizeZ);
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed private key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2, n: N } = CURVE;
      aInRange("scalar", sc, _0n5, N);
      const I = Point3.ZERO;
      if (sc === _0n5)
        return I;
      if (this.is0() || sc === _1n5)
        return this;
      if (!endo2 || wnaf.hasPrecomputes(this))
        return wnaf.wNAFCachedUnsafe(this, sc, Point3.normalizeZ);
      let { k1neg, k1, k2neg, k2 } = endo2.splitScalar(sc);
      let k1p = I;
      let k2p = I;
      let d = this;
      while (k1 > _0n5 || k2 > _0n5) {
        if (k1 & _1n5)
          k1p = k1p.add(d);
        if (k2 & _1n5)
          k2p = k2p.add(d);
        d = d.double();
        k1 >>= _1n5;
        k2 >>= _1n5;
      }
      if (k1neg)
        k1p = k1p.negate();
      if (k2neg)
        k2p = k2p.negate();
      k2p = new Point3(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
      return k1p.add(k2p);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2, n: N } = CURVE;
      aInRange("scalar", scalar, _1n5, N);
      let point, fake;
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = endo2.splitScalar(scalar);
        let { p: k1p, f: f1p } = this.wNAF(k1);
        let { p: k2p, f: f2p } = this.wNAF(k2);
        k1p = wnaf.constTimeNegate(k1neg, k1p);
        k2p = wnaf.constTimeNegate(k2neg, k2p);
        k2p = new Point3(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
        point = k1p.add(k2p);
        fake = f1p.add(f2p);
      } else {
        const { p, f } = this.wNAF(scalar);
        point = p;
        fake = f;
      }
      return Point3.normalizeZ([point, fake])[0];
    }
    /**
     * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
     * Not using Strauss-Shamir trick: precomputation tables are faster.
     * The trick could be useful if both P and Q are not G (not in our case).
     * @returns non-zero affine point
     */
    multiplyAndAddUnsafe(Q, a, b) {
      const G = Point3.BASE;
      const mul = (P, a2) => a2 === _0n5 || a2 === _1n5 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
      const sum = mul(this, a).add(mul(Q, b));
      return sum.is0() ? void 0 : sum;
    }
    // Converts Projective point to affine (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    // (x, y, z) ∋ (x=x/z, y=y/z)
    toAffine(iz) {
      return toAffineMemo(this, iz);
    }
    isTorsionFree() {
      const { h: cofactor, isTorsionFree } = CURVE;
      if (cofactor === _1n5)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point3, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: cofactor, clearCofactor } = CURVE;
      if (cofactor === _1n5)
        return this;
      if (clearCofactor)
        return clearCofactor(Point3, this);
      return this.multiplyUnsafe(CURVE.h);
    }
    toRawBytes(isCompressed = true) {
      abool("isCompressed", isCompressed);
      this.assertValidity();
      return toBytes6(Point3, this, isCompressed);
    }
    toHex(isCompressed = true) {
      abool("isCompressed", isCompressed);
      return bytesToHex2(this.toRawBytes(isCompressed));
    }
  }
  Point3.BASE = new Point3(CURVE.Gx, CURVE.Gy, Fp.ONE);
  Point3.ZERO = new Point3(Fp.ZERO, Fp.ONE, Fp.ZERO);
  const { endo, nBitLength } = CURVE;
  const wnaf = wNAF(Point3, endo ? Math.ceil(nBitLength / 2) : nBitLength);
  return {
    CURVE,
    ProjectivePoint: Point3,
    normPrivateKeyToScalar,
    weierstrassEquation,
    isWithinCurveOrder
  };
}
function validateOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    hash: "hash",
    hmac: "function",
    randomBytes: "function"
  }, {
    bits2int: "function",
    bits2int_modN: "function",
    lowS: "boolean"
  });
  return Object.freeze({ lowS: true, ...opts });
}
function weierstrass(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { Fp, n: CURVE_ORDER, nByteLength, nBitLength } = CURVE;
  const compressedLen = Fp.BYTES + 1;
  const uncompressedLen = 2 * Fp.BYTES + 1;
  function modN2(a) {
    return mod(a, CURVE_ORDER);
  }
  function invN(a) {
    return invert(a, CURVE_ORDER);
  }
  const { ProjectivePoint: Point3, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
    ...CURVE,
    toBytes(_c, point, isCompressed) {
      const a = point.toAffine();
      const x = Fp.toBytes(a.x);
      const cat = concatBytes2;
      abool("isCompressed", isCompressed);
      if (isCompressed) {
        return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
      } else {
        return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
      }
    },
    fromBytes(bytes) {
      const len = bytes.length;
      const head = bytes[0];
      const tail = bytes.subarray(1);
      if (len === compressedLen && (head === 2 || head === 3)) {
        const x = bytesToNumberBE(tail);
        if (!inRange(x, _1n5, Fp.ORDER))
          throw new Error("Point is not on curve");
        const y2 = weierstrassEquation(x);
        let y;
        try {
          y = Fp.sqrt(y2);
        } catch (sqrtError) {
          const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
          throw new Error("Point is not on curve" + suffix);
        }
        const isYOdd = (y & _1n5) === _1n5;
        const isHeadOdd = (head & 1) === 1;
        if (isHeadOdd !== isYOdd)
          y = Fp.neg(y);
        return { x, y };
      } else if (len === uncompressedLen && head === 4) {
        const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
        const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
        return { x, y };
      } else {
        const cl = compressedLen;
        const ul = uncompressedLen;
        throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
      }
    }
  });
  function isBiggerThanHalfOrder(number3) {
    const HALF = CURVE_ORDER >> _1n5;
    return number3 > HALF;
  }
  function normalizeS(s) {
    return isBiggerThanHalfOrder(s) ? modN2(-s) : s;
  }
  const slcNum = (b, from14, to) => bytesToNumberBE(b.slice(from14, to));
  class Signature {
    constructor(r, s, recovery) {
      aInRange("r", r, _1n5, CURVE_ORDER);
      aInRange("s", s, _1n5, CURVE_ORDER);
      this.r = r;
      this.s = s;
      if (recovery != null)
        this.recovery = recovery;
      Object.freeze(this);
    }
    // pair (bytes of r, bytes of s)
    static fromCompact(hex) {
      const l = nByteLength;
      hex = ensureBytes("compactSignature", hex, l * 2);
      return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
    }
    // DER encoded ECDSA signature
    // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
    static fromDER(hex) {
      const { r, s } = DER.toSig(ensureBytes("DER", hex));
      return new Signature(r, s);
    }
    /**
     * @todo remove
     * @deprecated
     */
    assertValidity() {
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(msgHash) {
      const { r, s, recovery: rec } = this;
      const h = bits2int_modN(ensureBytes("msgHash", msgHash));
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
      if (radj >= Fp.ORDER)
        throw new Error("recovery id 2 or 3 invalid");
      const prefix = (rec & 1) === 0 ? "02" : "03";
      const R = Point3.fromHex(prefix + numToSizedHex(radj, Fp.BYTES));
      const ir = invN(radj);
      const u1 = modN2(-h * ir);
      const u2 = modN2(s * ir);
      const Q = Point3.BASE.multiplyAndAddUnsafe(R, u1, u2);
      if (!Q)
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, modN2(-this.s), this.recovery) : this;
    }
    // DER-encoded
    toDERRawBytes() {
      return hexToBytes2(this.toDERHex());
    }
    toDERHex() {
      return DER.hexFromSig(this);
    }
    // padded bytes of r, then padded bytes of s
    toCompactRawBytes() {
      return hexToBytes2(this.toCompactHex());
    }
    toCompactHex() {
      const l = nByteLength;
      return numToSizedHex(this.r, l) + numToSizedHex(this.s, l);
    }
  }
  const utils = {
    isValidPrivateKey(privateKey) {
      try {
        normPrivateKeyToScalar(privateKey);
        return true;
      } catch (error) {
        return false;
      }
    },
    normPrivateKeyToScalar,
    /**
     * Produces cryptographically secure private key from random of size
     * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
     */
    randomPrivateKey: () => {
      const length = getMinHashLength(CURVE.n);
      return mapHashToField(CURVE.randomBytes(length), CURVE.n);
    },
    /**
     * Creates precompute table for an arbitrary EC point. Makes point "cached".
     * Allows to massively speed-up `point.multiply(scalar)`.
     * @returns cached point
     * @example
     * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
     * fast.multiply(privKey); // much faster ECDH now
     */
    precompute(windowSize = 8, point = Point3.BASE) {
      point._setWindowSize(windowSize);
      point.multiply(BigInt(3));
      return point;
    }
  };
  function getPublicKey2(privateKey, isCompressed = true) {
    return Point3.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function isProbPub(item) {
    if (typeof item === "bigint")
      return false;
    if (item instanceof Point3)
      return true;
    const arr = ensureBytes("key", item);
    const len = arr.length;
    const fpl = Fp.BYTES;
    const compLen = fpl + 1;
    const uncompLen = 2 * fpl + 1;
    if (CURVE.allowedPrivateKeyLengths || nByteLength === compLen) {
      return void 0;
    } else {
      return len === compLen || len === uncompLen;
    }
  }
  function getSharedSecret2(privateA, publicB, isCompressed = true) {
    if (isProbPub(privateA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicB) === false)
      throw new Error("second arg must be public key");
    const b = Point3.fromHex(publicB);
    return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
  }
  const bits2int = CURVE.bits2int || function(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - nBitLength;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  };
  const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
    return modN2(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(nBitLength);
  function int2octets(num2) {
    aInRange("num < 2^" + nBitLength, num2, _0n5, ORDER_MASK);
    return numberToBytesBE(num2, nByteLength);
  }
  function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
    if (["recovered", "canonical"].some((k) => k in opts))
      throw new Error("sign() legacy options not supported");
    const { hash: hash2, randomBytes: randomBytes2 } = CURVE;
    let { lowS, prehash, extraEntropy: ent } = opts;
    if (lowS == null)
      lowS = true;
    msgHash = ensureBytes("msgHash", msgHash);
    validateSigVerOpts(opts);
    if (prehash)
      msgHash = ensureBytes("prehashed msgHash", hash2(msgHash));
    const h1int = bits2int_modN(msgHash);
    const d = normPrivateKeyToScalar(privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (ent != null && ent !== false) {
      const e = ent === true ? randomBytes2(Fp.BYTES) : ent;
      seedArgs.push(ensureBytes("extraEntropy", e));
    }
    const seed = concatBytes2(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!isWithinCurveOrder(k))
        return;
      const ik = invN(k);
      const q = Point3.BASE.multiply(k).toAffine();
      const r = modN2(q.x);
      if (r === _0n5)
        return;
      const s = modN2(ik * modN2(m + r * d));
      if (s === _0n5)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n5);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = normalizeS(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, recovery);
    }
    return { seed, k2sig };
  }
  const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
  const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
  function sign2(msgHash, privKey, opts = defaultSigOpts) {
    const { seed, k2sig } = prepSig(msgHash, privKey, opts);
    const C = CURVE;
    const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
    return drbg(seed, k2sig);
  }
  Point3.BASE._setWindowSize(8);
  function verify5(signature2, msgHash, publicKey, opts = defaultVerOpts) {
    const sg = signature2;
    msgHash = ensureBytes("msgHash", msgHash);
    publicKey = ensureBytes("publicKey", publicKey);
    const { lowS, prehash, format } = opts;
    validateSigVerOpts(opts);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    if (format !== void 0 && format !== "compact" && format !== "der")
      throw new Error("format must be compact or der");
    const isHex2 = typeof sg === "string" || isBytes2(sg);
    const isObj = !isHex2 && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
    if (!isHex2 && !isObj)
      throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    let _sig = void 0;
    let P;
    try {
      if (isObj)
        _sig = new Signature(sg.r, sg.s);
      if (isHex2) {
        try {
          if (format !== "compact")
            _sig = Signature.fromDER(sg);
        } catch (derError) {
          if (!(derError instanceof DER.Err))
            throw derError;
        }
        if (!_sig && format !== "der")
          _sig = Signature.fromCompact(sg);
      }
      P = Point3.fromHex(publicKey);
    } catch (error) {
      return false;
    }
    if (!_sig)
      return false;
    if (lowS && _sig.hasHighS())
      return false;
    if (prehash)
      msgHash = CURVE.hash(msgHash);
    const { r, s } = _sig;
    const h = bits2int_modN(msgHash);
    const is2 = invN(s);
    const u1 = modN2(h * is2);
    const u2 = modN2(r * is2);
    const R = Point3.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
    if (!R)
      return false;
    const v = modN2(R.x);
    return v === r;
  }
  return {
    CURVE,
    getPublicKey: getPublicKey2,
    getSharedSecret: getSharedSecret2,
    sign: sign2,
    verify: verify5,
    ProjectivePoint: Point3,
    Signature,
    utils
  };
}
function SWUFpSqrtRatio(Fp, Z) {
  const q = Fp.ORDER;
  let l = _0n5;
  for (let o = q - _1n5; o % _2n3 === _0n5; o /= _2n3)
    l += _1n5;
  const c1 = l;
  const _2n_pow_c1_1 = _2n3 << c1 - _1n5 - _1n5;
  const _2n_pow_c1 = _2n_pow_c1_1 * _2n3;
  const c2 = (q - _1n5) / _2n_pow_c1;
  const c3 = (c2 - _1n5) / _2n3;
  const c4 = _2n_pow_c1 - _1n5;
  const c5 = _2n_pow_c1_1;
  const c6 = Fp.pow(Z, c2);
  const c7 = Fp.pow(Z, (c2 + _1n5) / _2n3);
  let sqrtRatio = (u, v) => {
    let tv1 = c6;
    let tv2 = Fp.pow(v, c4);
    let tv3 = Fp.sqr(tv2);
    tv3 = Fp.mul(tv3, v);
    let tv5 = Fp.mul(u, tv3);
    tv5 = Fp.pow(tv5, c3);
    tv5 = Fp.mul(tv5, tv2);
    tv2 = Fp.mul(tv5, v);
    tv3 = Fp.mul(tv5, u);
    let tv4 = Fp.mul(tv3, tv2);
    tv5 = Fp.pow(tv4, c5);
    let isQR = Fp.eql(tv5, Fp.ONE);
    tv2 = Fp.mul(tv3, c7);
    tv5 = Fp.mul(tv4, tv1);
    tv3 = Fp.cmov(tv2, tv3, isQR);
    tv4 = Fp.cmov(tv5, tv4, isQR);
    for (let i = c1; i > _1n5; i--) {
      let tv52 = i - _2n3;
      tv52 = _2n3 << tv52 - _1n5;
      let tvv5 = Fp.pow(tv4, tv52);
      const e1 = Fp.eql(tvv5, Fp.ONE);
      tv2 = Fp.mul(tv3, tv1);
      tv1 = Fp.mul(tv1, tv1);
      tvv5 = Fp.mul(tv4, tv1);
      tv3 = Fp.cmov(tv2, tv3, e1);
      tv4 = Fp.cmov(tvv5, tv4, e1);
    }
    return { isValid: isQR, value: tv3 };
  };
  if (Fp.ORDER % _4n2 === _3n2) {
    const c12 = (Fp.ORDER - _3n2) / _4n2;
    const c22 = Fp.sqrt(Fp.neg(Z));
    sqrtRatio = (u, v) => {
      let tv1 = Fp.sqr(v);
      const tv2 = Fp.mul(u, v);
      tv1 = Fp.mul(tv1, tv2);
      let y1 = Fp.pow(tv1, c12);
      y1 = Fp.mul(y1, tv2);
      const y2 = Fp.mul(y1, c22);
      const tv3 = Fp.mul(Fp.sqr(y1), v);
      const isQR = Fp.eql(tv3, u);
      let y = Fp.cmov(y2, y1, isQR);
      return { isValid: isQR, value: y };
    };
  }
  return sqrtRatio;
}
function mapToCurveSimpleSWU(Fp, opts) {
  validateField(Fp);
  if (!Fp.isValid(opts.A) || !Fp.isValid(opts.B) || !Fp.isValid(opts.Z))
    throw new Error("mapToCurveSimpleSWU: invalid opts");
  const sqrtRatio = SWUFpSqrtRatio(Fp, opts.Z);
  if (!Fp.isOdd)
    throw new Error("Fp.isOdd is not implemented!");
  return (u) => {
    let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
    tv1 = Fp.sqr(u);
    tv1 = Fp.mul(tv1, opts.Z);
    tv2 = Fp.sqr(tv1);
    tv2 = Fp.add(tv2, tv1);
    tv3 = Fp.add(tv2, Fp.ONE);
    tv3 = Fp.mul(tv3, opts.B);
    tv4 = Fp.cmov(opts.Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO));
    tv4 = Fp.mul(tv4, opts.A);
    tv2 = Fp.sqr(tv3);
    tv6 = Fp.sqr(tv4);
    tv5 = Fp.mul(tv6, opts.A);
    tv2 = Fp.add(tv2, tv5);
    tv2 = Fp.mul(tv2, tv3);
    tv6 = Fp.mul(tv6, tv4);
    tv5 = Fp.mul(tv6, opts.B);
    tv2 = Fp.add(tv2, tv5);
    x = Fp.mul(tv1, tv3);
    const { isValid, value } = sqrtRatio(tv2, tv6);
    y = Fp.mul(tv1, u);
    y = Fp.mul(y, value);
    x = Fp.cmov(x, tv3, isValid);
    y = Fp.cmov(y, value, isValid);
    const e1 = Fp.isOdd(u) === Fp.isOdd(y);
    y = Fp.cmov(Fp.neg(y), y, e1);
    const tv4_inv = FpInvertBatch(Fp, [tv4], true)[0];
    x = Fp.mul(x, tv4_inv);
    return { x, y };
  };
}
var DERErr, DER, _0n5, _1n5, _2n3, _3n2, _4n2;
var init_weierstrass = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/weierstrass.js"() {
    init_curve();
    init_modular();
    init_utils2();
    DERErr = class extends Error {
      constructor(m = "") {
        super(m);
      }
    };
    DER = {
      // asn.1 DER encoding utils
      Err: DERErr,
      // Basic building block is TLV (Tag-Length-Value)
      _tlv: {
        encode: (tag, data) => {
          const { Err: E } = DER;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length & 1)
            throw new E("tlv.encode: unpadded data");
          const dataLen = data.length / 2;
          const len = numberToHexUnpadded(dataLen);
          if (len.length / 2 & 128)
            throw new E("tlv.encode: long form length too big");
          const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
          const t = numberToHexUnpadded(tag);
          return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
          const { Err: E } = DER;
          let pos = 0;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length < 2 || data[pos++] !== tag)
            throw new E("tlv.decode: wrong tlv");
          const first = data[pos++];
          const isLong = !!(first & 128);
          let length = 0;
          if (!isLong)
            length = first;
          else {
            const lenLen = first & 127;
            if (!lenLen)
              throw new E("tlv.decode(long): indefinite length not supported");
            if (lenLen > 4)
              throw new E("tlv.decode(long): byte length is too big");
            const lengthBytes = data.subarray(pos, pos + lenLen);
            if (lengthBytes.length !== lenLen)
              throw new E("tlv.decode: length bytes not complete");
            if (lengthBytes[0] === 0)
              throw new E("tlv.decode(long): zero leftmost byte");
            for (const b of lengthBytes)
              length = length << 8 | b;
            pos += lenLen;
            if (length < 128)
              throw new E("tlv.decode(long): not minimal encoding");
          }
          const v = data.subarray(pos, pos + length);
          if (v.length !== length)
            throw new E("tlv.decode: wrong value length");
          return { v, l: data.subarray(pos + length) };
        }
      },
      // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
      // since we always use positive integers here. It must always be empty:
      // - add zero byte if exists
      // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
      _int: {
        encode(num2) {
          const { Err: E } = DER;
          if (num2 < _0n5)
            throw new E("integer: negative integers are not allowed");
          let hex = numberToHexUnpadded(num2);
          if (Number.parseInt(hex[0], 16) & 8)
            hex = "00" + hex;
          if (hex.length & 1)
            throw new E("unexpected DER parsing assertion: unpadded hex");
          return hex;
        },
        decode(data) {
          const { Err: E } = DER;
          if (data[0] & 128)
            throw new E("invalid signature integer: negative");
          if (data[0] === 0 && !(data[1] & 128))
            throw new E("invalid signature integer: unnecessary leading zero");
          return bytesToNumberBE(data);
        }
      },
      toSig(hex) {
        const { Err: E, _int: int, _tlv: tlv } = DER;
        const data = ensureBytes("signature", hex);
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
        if (seqLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
        if (sLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
      },
      hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = DER;
        const rs = tlv.encode(2, int.encode(sig.r));
        const ss = tlv.encode(2, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(48, seq);
      }
    };
    _0n5 = BigInt(0);
    _1n5 = BigInt(1);
    _2n3 = BigInt(2);
    _3n2 = BigInt(3);
    _4n2 = BigInt(4);
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/_shortw_utils.js
function getHash(hash2) {
  return {
    hash: hash2,
    hmac: (key, ...msgs) => hmac(hash2, key, concatBytes(...msgs)),
    randomBytes
  };
}
function createCurve(curveDef, defHash) {
  const create4 = (hash2) => weierstrass({ ...curveDef, ...getHash(hash2) });
  return { ...create4(defHash), create: create4 };
}
var init_shortw_utils = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/_shortw_utils.js"() {
    init_hmac();
    init_utils();
    init_weierstrass();
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/hash-to-curve.js
function i2osp(value, length) {
  anum(value);
  anum(length);
  if (value < 0 || value >= 1 << 8 * length)
    throw new Error("invalid I2OSP input: " + value);
  const res = Array.from({ length }).fill(0);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 255;
    value >>>= 8;
  }
  return new Uint8Array(res);
}
function strxor(a, b) {
  const arr = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    arr[i] = a[i] ^ b[i];
  }
  return arr;
}
function anum(item) {
  if (!Number.isSafeInteger(item))
    throw new Error("number expected");
}
function expand_message_xmd(msg, DST, lenInBytes, H) {
  abytes2(msg);
  abytes2(DST);
  anum(lenInBytes);
  if (DST.length > 255)
    DST = H(concatBytes2(utf8ToBytes2("H2C-OVERSIZE-DST-"), DST));
  const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
  const ell = Math.ceil(lenInBytes / b_in_bytes);
  if (lenInBytes > 65535 || ell > 255)
    throw new Error("expand_message_xmd: invalid lenInBytes");
  const DST_prime = concatBytes2(DST, i2osp(DST.length, 1));
  const Z_pad = i2osp(0, r_in_bytes);
  const l_i_b_str = i2osp(lenInBytes, 2);
  const b = new Array(ell);
  const b_0 = H(concatBytes2(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
  b[0] = H(concatBytes2(b_0, i2osp(1, 1), DST_prime));
  for (let i = 1; i <= ell; i++) {
    const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
    b[i] = H(concatBytes2(...args));
  }
  const pseudo_random_bytes = concatBytes2(...b);
  return pseudo_random_bytes.slice(0, lenInBytes);
}
function expand_message_xof(msg, DST, lenInBytes, k, H) {
  abytes2(msg);
  abytes2(DST);
  anum(lenInBytes);
  if (DST.length > 255) {
    const dkLen = Math.ceil(2 * k / 8);
    DST = H.create({ dkLen }).update(utf8ToBytes2("H2C-OVERSIZE-DST-")).update(DST).digest();
  }
  if (lenInBytes > 65535 || DST.length > 255)
    throw new Error("expand_message_xof: invalid lenInBytes");
  return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
}
function hash_to_field(msg, count, options) {
  validateObject(options, {
    DST: "stringOrUint8Array",
    p: "bigint",
    m: "isSafeInteger",
    k: "isSafeInteger",
    hash: "hash"
  });
  const { p, k, m, hash: hash2, expand, DST: _DST } = options;
  abytes2(msg);
  anum(count);
  const DST = typeof _DST === "string" ? utf8ToBytes2(_DST) : _DST;
  const log2p = p.toString(2).length;
  const L = Math.ceil((log2p + k) / 8);
  const len_in_bytes = count * m * L;
  let prb;
  if (expand === "xmd") {
    prb = expand_message_xmd(msg, DST, len_in_bytes, hash2);
  } else if (expand === "xof") {
    prb = expand_message_xof(msg, DST, len_in_bytes, k, hash2);
  } else if (expand === "_internal_pass") {
    prb = msg;
  } else {
    throw new Error('expand must be "xmd" or "xof"');
  }
  const u = new Array(count);
  for (let i = 0; i < count; i++) {
    const e = new Array(m);
    for (let j = 0; j < m; j++) {
      const elm_offset = L * (j + i * m);
      const tv = prb.subarray(elm_offset, elm_offset + L);
      e[j] = mod(os2ip(tv), p);
    }
    u[i] = e;
  }
  return u;
}
function isogenyMap(field, map) {
  const coeff = map.map((i) => Array.from(i).reverse());
  return (x, y) => {
    const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
    const [xd_inv, yd_inv] = FpInvertBatch(field, [xd, yd], true);
    x = field.mul(xn, xd_inv);
    y = field.mul(y, field.mul(yn, yd_inv));
    return { x, y };
  };
}
function createHasher2(Point3, mapToCurve, defaults2) {
  if (typeof mapToCurve !== "function")
    throw new Error("mapToCurve() must be defined");
  function map(num2) {
    return Point3.fromAffine(mapToCurve(num2));
  }
  function clear(initial3) {
    const P = initial3.clearCofactor();
    if (P.equals(Point3.ZERO))
      return Point3.ZERO;
    P.assertValidity();
    return P;
  }
  return {
    defaults: defaults2,
    // Encodes byte string to elliptic curve.
    // hash_to_curve from https://www.rfc-editor.org/rfc/rfc9380#section-3
    hashToCurve(msg, options) {
      const u = hash_to_field(msg, 2, { ...defaults2, DST: defaults2.DST, ...options });
      const u0 = map(u[0]);
      const u1 = map(u[1]);
      return clear(u0.add(u1));
    },
    // Encodes byte string to elliptic curve.
    // encode_to_curve from https://www.rfc-editor.org/rfc/rfc9380#section-3
    encodeToCurve(msg, options) {
      const u = hash_to_field(msg, 1, { ...defaults2, DST: defaults2.encodeDST, ...options });
      return clear(map(u[0]));
    },
    // Same as encodeToCurve, but without hash
    mapToCurve(scalars) {
      if (!Array.isArray(scalars))
        throw new Error("expected array of bigints");
      for (const i of scalars)
        if (typeof i !== "bigint")
          throw new Error("expected array of bigints");
      return clear(map(scalars));
    }
  };
}
var os2ip;
var init_hash_to_curve = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/hash-to-curve.js"() {
    init_modular();
    init_utils2();
    os2ip = bytesToNumberBE;
  }
});

// packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/secp256k1.js
var secp256k1_exports = {};
__export(secp256k1_exports, {
  encodeToCurve: () => encodeToCurve,
  hashToCurve: () => hashToCurve,
  schnorr: () => schnorr,
  secp256k1: () => secp256k1,
  secp256k1_hasher: () => secp256k1_hasher
});
function sqrtMod(y) {
  const P = secp256k1P;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n4, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n4, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === void 0) {
    const tagH = sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
    tagP = concatBytes2(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes2(tagP, ...messages));
}
function schnorrGetExtPubKey(priv) {
  let d_ = secp256k1.utils.normPrivateKeyToScalar(priv);
  let p = Point.fromPrivateKey(d_);
  const scalar = p.hasEvenY() ? d_ : modN(-d_);
  return { scalar, bytes: pointToBytes(p) };
}
function lift_x(x) {
  aInRange("x", x, _1n6, secp256k1P);
  const xx = modP(x * x);
  const c = modP(xx * x + BigInt(7));
  let y = sqrtMod(c);
  if (y % _2n4 !== _0n6)
    y = modP(-y);
  const p = new Point(x, y, _1n6);
  p.assertValidity();
  return p;
}
function challenge(...args) {
  return modN(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(privateKey) {
  return schnorrGetExtPubKey(privateKey).bytes;
}
function schnorrSign(message, privateKey, auxRand = randomBytes(32)) {
  const m = ensureBytes("message", message);
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey);
  const a = ensureBytes("auxRand", auxRand, 32);
  const t = numTo32b(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const k_ = modN(num(rand));
  if (k_ === _0n6)
    throw new Error("sign failed: k is zero");
  const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(numTo32b(modN(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature2, message, publicKey) {
  const sig = ensureBytes("signature", signature2, 64);
  const m = ensureBytes("message", message);
  const pub = ensureBytes("publicKey", publicKey, 32);
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!inRange(r, _1n6, secp256k1P))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!inRange(s, _1n6, secp256k1N))
      return false;
    const e = challenge(numTo32b(r), pointToBytes(P), m);
    const R = GmulAdd(P, s, modN(-e));
    if (!R || !R.hasEvenY() || R.toAffine().x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}
var secp256k1P, secp256k1N, _0n6, _1n6, _2n4, divNearest, Fpk1, secp256k1, TAGGED_HASH_PREFIXES, pointToBytes, numTo32b, modP, modN, Point, GmulAdd, num, schnorr, isoMap, mapSWU, secp256k1_hasher, hashToCurve, encodeToCurve;
var init_secp256k1 = __esm({
  "packages/payment-adapters/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/secp256k1.js"() {
    init_sha2();
    init_utils();
    init_shortw_utils();
    init_hash_to_curve();
    init_modular();
    init_utils2();
    init_weierstrass();
    secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
    secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    _0n6 = BigInt(0);
    _1n6 = BigInt(1);
    _2n4 = BigInt(2);
    divNearest = (a, b) => (a + b / _2n4) / b;
    Fpk1 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
    secp256k1 = createCurve({
      a: _0n6,
      b: BigInt(7),
      Fp: Fpk1,
      n: secp256k1N,
      Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
      Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
      h: BigInt(1),
      lowS: true,
      // Allow only low-S signatures by default in sign() and verify()
      endo: {
        // Endomorphism, see above
        beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
        splitScalar: (k) => {
          const n = secp256k1N;
          const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
          const b1 = -_1n6 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
          const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
          const b2 = a1;
          const POW_2_128 = BigInt("0x100000000000000000000000000000000");
          const c1 = divNearest(b2 * k, n);
          const c2 = divNearest(-b1 * k, n);
          let k1 = mod(k - c1 * a1 - c2 * a2, n);
          let k2 = mod(-c1 * b1 - c2 * b2, n);
          const k1neg = k1 > POW_2_128;
          const k2neg = k2 > POW_2_128;
          if (k1neg)
            k1 = n - k1;
          if (k2neg)
            k2 = n - k2;
          if (k1 > POW_2_128 || k2 > POW_2_128) {
            throw new Error("splitScalar: Endomorphism failed, k=" + k);
          }
          return { k1neg, k1, k2neg, k2 };
        }
      }
    }, sha256);
    TAGGED_HASH_PREFIXES = {};
    pointToBytes = (point) => point.toRawBytes(true).slice(1);
    numTo32b = (n) => numberToBytesBE(n, 32);
    modP = (x) => mod(x, secp256k1P);
    modN = (x) => mod(x, secp256k1N);
    Point = /* @__PURE__ */ (() => secp256k1.ProjectivePoint)();
    GmulAdd = (Q, a, b) => Point.BASE.multiplyAndAddUnsafe(Q, a, b);
    num = bytesToNumberBE;
    schnorr = /* @__PURE__ */ (() => ({
      getPublicKey: schnorrGetPublicKey,
      sign: schnorrSign,
      verify: schnorrVerify,
      utils: {
        randomPrivateKey: secp256k1.utils.randomPrivateKey,
        lift_x,
        pointToBytes,
        numberToBytesBE,
        bytesToNumberBE,
        taggedHash,
        mod
      }
    }))();
    isoMap = /* @__PURE__ */ (() => isogenyMap(Fpk1, [
      // xNum
      [
        "0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7",
        "0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581",
        "0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262",
        "0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"
      ],
      // xDen
      [
        "0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b",
        "0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
        // LAST 1
      ],
      // yNum
      [
        "0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c",
        "0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3",
        "0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931",
        "0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84"
      ],
      // yDen
      [
        "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b",
        "0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573",
        "0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
        // LAST 1
      ]
    ].map((i) => i.map((j) => BigInt(j)))))();
    mapSWU = /* @__PURE__ */ (() => mapToCurveSimpleSWU(Fpk1, {
      A: BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533"),
      B: BigInt("1771"),
      Z: Fpk1.create(BigInt("-11"))
    }))();
    secp256k1_hasher = /* @__PURE__ */ (() => createHasher2(secp256k1.ProjectivePoint, (scalars) => {
      const { x, y } = mapSWU(Fpk1.create(scalars[0]));
      return isoMap(x, y);
    }, {
      DST: "secp256k1_XMD:SHA-256_SSWU_RO_",
      encodeDST: "secp256k1_XMD:SHA-256_SSWU_NU_",
      p: Fpk1.ORDER,
      m: 1,
      k: 128,
      expand: "xmd",
      hash: sha256
    }))();
    hashToCurve = /* @__PURE__ */ (() => secp256k1_hasher.hashToCurve)();
    encodeToCurve = /* @__PURE__ */ (() => secp256k1_hasher.encodeToCurve)();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { strict = true } = {}) {
  if (!value)
    return false;
  if (typeof value !== "string")
    return false;
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
var init_isHex = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/isHex.js"() {
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/size.js
function size3(value) {
  if (isHex(value, { strict: false }))
    return Math.ceil((value.length - 2) / 2);
  return value.length;
}
var init_size = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/size.js"() {
    init_isHex();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/version.js
var version3;
var init_version = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/version.js"() {
    version3 = "2.57.4";
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/base.js
function walk2(err, fn) {
  if (fn?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause !== void 0)
    return walk2(err.cause, fn);
  return fn ? null : err;
}
var errorConfig, BaseError2;
var init_base = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/base.js"() {
    init_version();
    errorConfig = {
      getDocsUrl: ({ docsBaseUrl, docsPath = "", docsSlug }) => docsPath ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
      version: `viem@${version3}`
    };
    BaseError2 = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.details;
          if (args.cause?.message)
            return args.cause.message;
          return args.details;
        })();
        const docsPath = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.docsPath || args.docsPath;
          return args.docsPath;
        })();
        const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath });
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsUrl ? [`Docs: ${docsUrl}`] : [],
          ...details ? [`Details: ${details}`] : [],
          ...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
        ].join("\n");
        super(message, args.cause ? { cause: args.cause } : void 0);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "version", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "BaseError"
        });
        this.details = details;
        this.docsPath = docsPath;
        this.metaMessages = args.metaMessages;
        this.name = args.name ?? this.name;
        this.shortMessage = shortMessage;
        this.version = version3;
      }
      walk(fn) {
        return walk2(this, fn);
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/abi.js
var AbiEncodingArrayLengthMismatchError, AbiEncodingBytesSizeMismatchError, AbiEncodingLengthMismatchError, BytesSizeMismatchError, InvalidAbiEncodingTypeError, InvalidArrayError;
var init_abi = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/abi.js"() {
    init_size();
    init_base();
    AbiEncodingArrayLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength, type }) {
        super([
          `ABI encoding array length mismatch for type ${type}.`,
          `Expected length: ${expectedLength}`,
          `Given length: ${givenLength}`
        ].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
      }
    };
    AbiEncodingBytesSizeMismatchError = class extends BaseError2 {
      constructor({ expectedSize, value }) {
        super(`Size of bytes "${value}" (bytes${size3(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
      }
    };
    AbiEncodingLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength }) {
        super([
          "ABI encoding params/values length mismatch.",
          `Expected length (params): ${expectedLength}`,
          `Given length (values): ${givenLength}`
        ].join("\n"), { name: "AbiEncodingLengthMismatchError" });
      }
    };
    BytesSizeMismatchError = class extends BaseError2 {
      constructor({ expectedSize, givenSize }) {
        super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
          name: "BytesSizeMismatchError"
        });
      }
    };
    InvalidAbiEncodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath }) {
        super([
          `Type "${type}" is not a valid encoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath, name: "InvalidAbiEncodingType" });
      }
    };
    InvalidArrayError = class extends BaseError2 {
      constructor(value) {
        super([`Value "${value}" is not a valid array.`].join("\n"), {
          name: "InvalidArrayError"
        });
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError3, SizeExceedsPaddingSizeError3;
var init_data = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/data.js"() {
    init_base();
    SliceOffsetOutOfBoundsError3 = class extends BaseError2 {
      constructor({ offset, position, size: size4 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size4}).`, { name: "SliceOffsetOutOfBoundsError" });
      }
    };
    SizeExceedsPaddingSizeError3 = class extends BaseError2 {
      constructor({ size: size4, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size4}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/pad.js
function pad3(hexOrBytes, { dir, size: size4 = 32 } = {}) {
  if (typeof hexOrBytes === "string")
    return padHex(hexOrBytes, { dir, size: size4 });
  return padBytes(hexOrBytes, { dir, size: size4 });
}
function padHex(hex_, { dir, size: size4 = 32 } = {}) {
  if (size4 === null)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size4 * 2)
    throw new SizeExceedsPaddingSizeError3({
      size: Math.ceil(hex.length / 2),
      targetSize: size4,
      type: "hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size4 * 2, "0")}`;
}
function padBytes(bytes, { dir, size: size4 = 32 } = {}) {
  if (size4 === null)
    return bytes;
  if (bytes.length > size4)
    throw new SizeExceedsPaddingSizeError3({
      size: bytes.length,
      targetSize: size4,
      type: "bytes"
    });
  const paddedBytes = new Uint8Array(size4);
  for (let i = 0; i < size4; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size4 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
var init_pad = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/pad.js"() {
    init_data();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError2, SizeOverflowError3;
var init_encoding = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/encoding.js"() {
    init_base();
    IntegerOutOfRangeError2 = class extends BaseError2 {
      constructor({ max, min, signed, size: size4, value }) {
        super(`Number "${value}" is not in safe ${size4 ? `${size4 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
      }
    };
    SizeOverflowError3 = class extends BaseError2 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize3(hexOrBytes, { size: size4 }) {
  if (size3(hexOrBytes) > size4)
    throw new SizeOverflowError3({
      givenSize: size3(hexOrBytes),
      maxSize: size4
    });
}
function hexToBigInt(hex, opts = {}) {
  const { signed } = opts;
  if (opts.size)
    assertSize3(hex, { size: opts.size });
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size4 = Math.ceil((hex.length - 2) / 2);
  const max = (1n << BigInt(size4) * 8n - 1n) - 1n;
  if (value <= max)
    return value;
  return value - BigInt(`0x${"f".padStart(size4 * 2, "f")}`) - 1n;
}
function hexToNumber2(hex, opts = {}) {
  const value = hexToBigInt(hex, opts);
  const number3 = Number(value);
  if (!Number.isSafeInteger(number3))
    throw new IntegerOutOfRangeError2({
      max: `${Number.MAX_SAFE_INTEGER}`,
      min: `${Number.MIN_SAFE_INTEGER}`,
      signed: opts.signed,
      size: opts.size,
      value: `${value}n`
    });
  return number3;
}
var init_fromHex = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/encoding/fromHex.js"() {
    init_encoding();
    init_size();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/encoding/toHex.js
function toHex4(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToHex(value, opts);
  if (typeof value === "string") {
    return stringToHex(value, opts);
  }
  if (typeof value === "boolean")
    return boolToHex(value, opts);
  return bytesToHex3(value, opts);
}
function boolToHex(value, opts = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof opts.size === "number") {
    assertSize3(hex, { size: opts.size });
    return pad3(hex, { size: opts.size });
  }
  return hex;
}
function bytesToHex3(value, opts = {}) {
  let string3 = "";
  for (let i = 0; i < value.length; i++) {
    string3 += hexes4[value[i]];
  }
  const hex = `0x${string3}`;
  if (typeof opts.size === "number") {
    assertSize3(hex, { size: opts.size });
    return pad3(hex, { dir: "right", size: opts.size });
  }
  return hex;
}
function numberToHex(value_, opts = {}) {
  const { signed, size: size4 } = opts;
  const value = BigInt(value_);
  let maxValue;
  if (size4) {
    if (signed)
      maxValue = (1n << BigInt(size4) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size4) * 8n) - 1n;
  } else if (typeof value_ === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value > maxValue || value < minValue) {
    const suffix = typeof value_ === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError2({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size4,
      value: `${value_}${suffix}`
    });
  }
  const hex = `0x${(signed && value < 0 ? (1n << BigInt(size4 * 8)) + BigInt(value) : value).toString(16)}`;
  if (size4)
    return pad3(hex, { size: size4 });
  return hex;
}
function stringToHex(value_, opts = {}) {
  const value = encoder4.encode(value_);
  return bytesToHex3(value, opts);
}
var hexes4, encoder4;
var init_toHex = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/encoding/toHex.js"() {
    init_encoding();
    init_pad();
    init_fromHex();
    hexes4 = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    encoder4 = /* @__PURE__ */ new TextEncoder();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/encoding/toBytes.js
function toBytes5(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToBytes2(value, opts);
  if (typeof value === "boolean")
    return boolToBytes(value, opts);
  if (isHex(value))
    return hexToBytes3(value, opts);
  return stringToBytes(value, opts);
}
function boolToBytes(value, opts = {}) {
  const bytes = new Uint8Array(1);
  bytes[0] = Number(value);
  if (typeof opts.size === "number") {
    assertSize3(bytes, { size: opts.size });
    return pad3(bytes, { size: opts.size });
  }
  return bytes;
}
function charCodeToBase162(char) {
  if (char >= charCodeMap2.zero && char <= charCodeMap2.nine)
    return char - charCodeMap2.zero;
  if (char >= charCodeMap2.A && char <= charCodeMap2.F)
    return char - (charCodeMap2.A - 10);
  if (char >= charCodeMap2.a && char <= charCodeMap2.f)
    return char - (charCodeMap2.a - 10);
  return void 0;
}
function hexToBytes3(hex_, opts = {}) {
  let hex = hex_;
  if (opts.size) {
    assertSize3(hex, { size: opts.size });
    hex = pad3(hex, { dir: "right", size: opts.size });
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase162(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase162(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError2(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}
function numberToBytes2(value, opts) {
  const hex = numberToHex(value, opts);
  return hexToBytes3(hex);
}
function stringToBytes(value, opts = {}) {
  const bytes = encoder5.encode(value);
  if (typeof opts.size === "number") {
    assertSize3(bytes, { size: opts.size });
    return pad3(bytes, { dir: "right", size: opts.size });
  }
  return bytes;
}
var encoder5, charCodeMap2;
var init_toBytes = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/encoding/toBytes.js"() {
    init_base();
    init_isHex();
    init_pad();
    init_fromHex();
    init_toHex();
    encoder5 = /* @__PURE__ */ new TextEncoder();
    charCodeMap2 = {
      zero: 48,
      nine: 57,
      A: 65,
      F: 70,
      a: 97,
      f: 102
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/hash/keccak256.js
function keccak2562(value, to_) {
  const to = to_ || "hex";
  const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes5(value) : value);
  if (to === "bytes")
    return bytes;
  return toHex4(bytes);
}
var init_keccak256 = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/hash/keccak256.js"() {
    init_sha3();
    init_isHex();
    init_toBytes();
    init_toHex();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/address.js
var InvalidAddressError2;
var init_address = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/address.js"() {
    init_base();
    InvalidAddressError2 = class extends BaseError2 {
      constructor({ address: address3 }) {
        super(`Address "${address3}" is invalid.`, {
          metaMessages: [
            "- Address must be a hex value of 20 bytes (40 hex characters).",
            "- Address must match its checksum counterpart."
          ],
          name: "InvalidAddressError"
        });
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/lru.js
var LruMap2;
var init_lru = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/lru.js"() {
    LruMap2 = class extends Map {
      constructor(size4) {
        super();
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSize = size4;
      }
      get(key) {
        const value = super.get(key);
        if (super.has(key)) {
          super.delete(key);
          super.set(key, value);
        }
        return value;
      }
      set(key, value) {
        if (super.has(key))
          super.delete(key);
        super.set(key, value);
        if (this.maxSize && this.size > this.maxSize) {
          const firstKey = super.keys().next().value;
          if (firstKey !== void 0)
            super.delete(firstKey);
        }
        return this;
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/address/getAddress.js
function checksumAddress(address_, chainId) {
  if (checksumAddressCache.has(`${address_}.${chainId}`))
    return checksumAddressCache.get(`${address_}.${chainId}`);
  const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
  const hash2 = keccak2562(stringToBytes(hexAddress), "bytes");
  const address3 = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash2[i >> 1] >> 4 >= 8 && address3[i]) {
      address3[i] = address3[i].toUpperCase();
    }
    if ((hash2[i >> 1] & 15) >= 8 && address3[i + 1]) {
      address3[i + 1] = address3[i + 1].toUpperCase();
    }
  }
  const result = `0x${address3.join("")}`;
  checksumAddressCache.set(`${address_}.${chainId}`, result);
  return result;
}
function getAddress(address3, chainId) {
  if (!isAddress(address3, { strict: false }))
    throw new InvalidAddressError2({ address: address3 });
  return checksumAddress(address3, chainId);
}
var checksumAddressCache;
var init_getAddress = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/address/getAddress.js"() {
    init_address();
    init_toBytes();
    init_keccak256();
    init_lru();
    init_isAddress();
    checksumAddressCache = /* @__PURE__ */ new LruMap2(8192);
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/address/isAddress.js
function isAddress(address3, options) {
  const { strict = true } = options ?? {};
  const cacheKey = `${address3}.${strict}`;
  if (isAddressCache.has(cacheKey))
    return isAddressCache.get(cacheKey);
  const result = (() => {
    if (!addressRegex2.test(address3))
      return false;
    if (address3.toLowerCase() === address3)
      return true;
    if (strict)
      return checksumAddress(address3) === address3;
    return true;
  })();
  isAddressCache.set(cacheKey, result);
  return result;
}
var addressRegex2, isAddressCache;
var init_isAddress = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/address/isAddress.js"() {
    init_lru();
    init_getAddress();
    addressRegex2 = /^0x[a-fA-F0-9]{40}$/;
    isAddressCache = /* @__PURE__ */ new LruMap2(8192);
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/concat.js
function concat3(values) {
  if (typeof values[0] === "string")
    return concatHex(values);
  return concatBytes3(values);
}
function concatBytes3(values) {
  let length = 0;
  for (const arr of values) {
    length += arr.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const arr of values) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
function concatHex(values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
var init_concat = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/concat.js"() {
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/slice.js
function slice3(value, start, end, { strict } = {}) {
  if (isHex(value, { strict: false }))
    return sliceHex(value, start, end, {
      strict
    });
  return sliceBytes(value, start, end, {
    strict
  });
}
function assertStartOffset3(value, start) {
  if (typeof start === "number" && start > 0 && start > size3(value) - 1)
    throw new SliceOffsetOutOfBoundsError3({
      offset: start,
      position: "start",
      size: size3(value)
    });
}
function assertEndOffset3(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size3(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError3({
      offset: end,
      position: "end",
      size: size3(value)
    });
  }
}
function sliceBytes(value_, start, end, { strict } = {}) {
  assertStartOffset3(value_, start);
  const value = value_.slice(start, end);
  if (strict)
    assertEndOffset3(value, start, end);
  return value;
}
function sliceHex(value_, start, end, { strict } = {}) {
  assertStartOffset3(value_, start);
  const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
  if (strict)
    assertEndOffset3(value, start, end);
  return value;
}
var init_slice = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/data/slice.js"() {
    init_data();
    init_isHex();
    init_size();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/regex.js
var bytesRegex, integerRegex;
var init_regex = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/regex.js"() {
    bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
    integerRegex = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
function encodeAbiParameters(params2, values) {
  if (params2.length !== values.length)
    throw new AbiEncodingLengthMismatchError({
      expectedLength: params2.length,
      givenLength: values.length
    });
  const preparedParams = prepareParams({
    params: params2,
    values
  });
  return encodeParams(preparedParams);
}
function prepareParams({ params: params2, values }) {
  const preparedParams = [];
  for (let i = 0; i < params2.length; i++) {
    preparedParams.push(prepareParam({ param: params2[i], value: values[i] }));
  }
  return preparedParams;
}
function prepareParam({ param, value }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray(value, { length, param: { ...param, type } });
  }
  if (param.type === "tuple") {
    return encodeTuple(value, {
      param
    });
  }
  if (param.type === "address") {
    return encodeAddress(value);
  }
  if (param.type === "bool") {
    return encodeBool(value);
  }
  if (param.type.startsWith("uint") || param.type.startsWith("int")) {
    const signed = param.type.startsWith("int");
    const [, , size4 = "256"] = integerRegex.exec(param.type) ?? [];
    return encodeNumber(value, {
      signed,
      size: Number(size4)
    });
  }
  if (param.type.startsWith("bytes")) {
    return encodeBytes(value, { param });
  }
  if (param.type === "string") {
    return encodeString(value);
  }
  throw new InvalidAbiEncodingTypeError(param.type, {
    docsPath: "/docs/contract/encodeAbiParameters"
  });
}
function encodeParams(preparedParams) {
  let staticSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic)
      staticSize += 32;
    else
      staticSize += size3(encoded);
  }
  const staticParams = [];
  const dynamicParams = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
      dynamicParams.push(encoded);
      dynamicSize += size3(encoded);
    } else {
      staticParams.push(encoded);
    }
  }
  return concatHex([...staticParams, ...dynamicParams]);
}
function encodeAddress(value) {
  if (!isAddress(value))
    throw new InvalidAddressError2({ address: value });
  return { dynamic: false, encoded: padHex(value.toLowerCase()) };
}
function encodeArray(value, { length, param }) {
  const dynamic = length === null;
  if (!Array.isArray(value))
    throw new InvalidArrayError(value);
  if (!dynamic && value.length !== length)
    throw new AbiEncodingArrayLengthMismatchError({
      expectedLength: length,
      givenLength: value.length,
      type: `${param.type}[${length}]`
    });
  let dynamicChild = value.length === 0 && isDynamicType(param);
  const preparedParams = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParam({ param, value: value[i] });
    if (preparedParam.dynamic)
      dynamicChild = true;
    preparedParams.push(preparedParam);
  }
  if (dynamic || dynamicChild) {
    const data = encodeParams(preparedParams);
    if (dynamic) {
      const length2 = numberToHex(preparedParams.length, { size: 32 });
      return {
        dynamic: true,
        encoded: concatHex([length2, data])
      };
    }
    if (dynamicChild)
      return { dynamic: true, encoded: data };
  }
  return {
    dynamic: false,
    encoded: concatHex(preparedParams.map(({ encoded }) => encoded))
  };
}
function encodeBytes(value, { param }) {
  const [, paramSize] = param.type.split("bytes");
  const bytesSize = size3(value);
  if (!paramSize) {
    let value_ = value;
    if (bytesSize % 32 !== 0)
      value_ = padHex(value_, {
        dir: "right",
        size: Math.ceil((value.length - 2) / 2 / 32) * 32
      });
    return {
      dynamic: true,
      encoded: concatHex([
        padHex(numberToHex(bytesSize, { size: 32 })),
        value_
      ])
    };
  }
  if (bytesSize !== Number.parseInt(paramSize, 10))
    throw new AbiEncodingBytesSizeMismatchError({
      expectedSize: Number.parseInt(paramSize, 10),
      value
    });
  return { dynamic: false, encoded: padHex(value, { dir: "right" }) };
}
function encodeBool(value) {
  if (typeof value !== "boolean")
    throw new BaseError2(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
  return { dynamic: false, encoded: padHex(boolToHex(value)) };
}
function encodeNumber(value, { signed, size: size4 = 256 }) {
  if (typeof size4 === "number") {
    const max = 2n ** (BigInt(size4) - (signed ? 1n : 0n)) - 1n;
    const min = signed ? -max - 1n : 0n;
    if (value > max || value < min)
      throw new IntegerOutOfRangeError2({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size4 / 8,
        value: value.toString()
      });
  }
  return {
    dynamic: false,
    encoded: numberToHex(value, {
      size: 32,
      signed
    })
  };
}
function encodeString(value) {
  const hexValue = stringToHex(value);
  const partsLength = Math.ceil(size3(hexValue) / 32);
  const parts = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(padHex(slice3(hexValue, i * 32, (i + 1) * 32), {
      dir: "right"
    }));
  }
  return {
    dynamic: true,
    encoded: concatHex([
      padHex(numberToHex(size3(hexValue), { size: 32 })),
      ...parts
    ])
  };
}
function encodeTuple(value, { param }) {
  let dynamic = false;
  const preparedParams = [];
  for (let i = 0; i < param.components.length; i++) {
    const param_ = param.components[i];
    const index = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParam({
      param: param_,
      value: value[index]
    });
    preparedParams.push(preparedParam);
    if (preparedParam.dynamic)
      dynamic = true;
  }
  return {
    dynamic,
    encoded: dynamic ? encodeParams(preparedParams) : concatHex(preparedParams.map(({ encoded }) => encoded))
  };
}
function getArrayComponents(type) {
  const matches3 = type.match(/^(.*)\[(\d+)?\]$/);
  return matches3 ? (
    // Return `null` if the array is dynamic.
    [matches3[2] ? Number(matches3[2]) : null, matches3[1]]
  ) : void 0;
}
function isDynamicType(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components.some(isDynamicType);
  const arrayComponents = getArrayComponents(type);
  if (arrayComponents)
    return isDynamicType({ ...param, type: arrayComponents[1] });
  return false;
}
var init_encodeAbiParameters = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
    init_abi();
    init_address();
    init_base();
    init_encoding();
    init_isAddress();
    init_concat();
    init_pad();
    init_size();
    init_slice();
    init_toHex();
    init_regex();
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/stringify.js
var stringify2;
var init_stringify = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/stringify.js"() {
    stringify2 = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
      const value2 = typeof value_ === "bigint" ? value_.toString() : value_;
      return typeof replacer === "function" ? replacer(key, value2) : value2;
    }, space);
  }
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/unit/Value.js
function from10(value, decimals = 0) {
  if (!Number.isInteger(decimals) || decimals < 0)
    throw new InvalidDecimalsError({ decimals });
  if (!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(value))
    throw new InvalidDecimalNumberError({ value });
  let [integer2 = "", fraction = "0"] = value.split(".");
  const negative = integer2.startsWith("-");
  if (negative)
    integer2 = integer2.slice(1);
  if (integer2 === "")
    integer2 = "0";
  fraction = fraction.replace(/(0+)$/, "");
  if (decimals === 0) {
    if (fraction.length > 0 && Number.parseInt(fraction[0], 10) >= 5)
      integer2 = `${BigInt(integer2) + 1n}`;
    fraction = "";
  } else if (fraction.length > decimals) {
    const left = fraction.slice(0, decimals);
    const roundDigit = Number.parseInt(fraction.slice(decimals, decimals + 1), 10);
    if (roundDigit >= 5) {
      const carried = carry(left);
      if (carried.length > decimals) {
        fraction = carried.slice(1);
        integer2 = `${BigInt(integer2) + 1n}`;
      } else {
        fraction = carried;
      }
    } else {
      fraction = left;
    }
  } else {
    fraction = fraction.padEnd(decimals, "0");
  }
  return BigInt(`${negative ? "-" : ""}${integer2}${fraction}`);
}
function carry(digits) {
  const out = digits.split("");
  let i = out.length - 1;
  while (i >= 0) {
    const d = Number.parseInt(out[i], 10) + 1;
    if (d < 10) {
      out[i] = String(d);
      return out.join("");
    }
    out[i] = "0";
    i--;
  }
  return `1${out.join("")}`;
}
var InvalidDecimalNumberError, InvalidDecimalsError;
var init_Value = __esm({
  "packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/unit/Value.js"() {
    InvalidDecimalNumberError = class extends Error {
      constructor({ value }) {
        super(`Value \`${value}\` is not a valid decimal number.`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Value.InvalidDecimalNumberError"
        });
      }
    };
    InvalidDecimalsError = class extends Error {
      constructor({ decimals }) {
        super(`\`decimals\` must be a non-negative integer. Got \`${decimals}\`.`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Value.InvalidDecimalsError"
        });
      }
    };
  }
});

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Constants.js
var Headers2 = {
  acceptPayment: "Accept-Payment",
  authorization: "Authorization",
  paymentAuthorization: "Payment-Authorization",
  paymentReceipt: "Payment-Receipt",
  paymentSession: "Payment-Session",
  paymentSessionSnapshot: "Payment-Session-Snapshot",
  wwwAuthenticate: "WWW-Authenticate"
};
var Schemes = {
  payment: "Payment"
};

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Errors.js
var Hints = {
  paymentRequired: "Use a supported wallet to pay for this resource using one of the supported payment methods returned in the WWW-Authenticate header. See https://mpp.dev/tools/wallet.md",
  malformedCredential: "Use a supported wallet to construct valid credentials for one of the supported payment methods returned in the WWW-Authenticate header. See https://mpp.dev/tools/wallet.md",
  methodUnsupported: "Use a supported wallet to pay for this resource using one of the supported payment methods returned in the WWW-Authenticate header. See https://mpp.dev/tools/wallet.md"
};
var PaymentError = class extends Error {
  /** Safe method-specific context for diagnostics and relay responses. */
  details;
  /** HTTP status code. */
  status = 402;
  /** Actionable hint for resolving the error (RFC 9457 extension member). */
  hint;
  constructor(message, options = {}) {
    super(message);
    this.details = options.details;
    if (options.cause !== void 0)
      Object.defineProperty(this, "cause", {
        configurable: true,
        value: options.cause,
        writable: true
      });
  }
  /** Converts the error to RFC 9457 Problem Details format. */
  toProblemDetails(challengeId) {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.message,
      ...this.details && Object.keys(this.details).length > 0 && { details: this.details },
      ...this.hint && { hint: this.hint },
      ...challengeId && { challengeId }
    };
  }
};
var MalformedCredentialError = class extends PaymentError {
  name = "MalformedCredentialError";
  title = "Malformed Credential";
  status = 402;
  type = "https://paymentauth.org/problems/malformed-credential";
  hint = Hints.malformedCredential;
  constructor(options = {}) {
    const { reason } = options;
    super(reason ? `Credential is malformed: ${reason}.` : "Credential is malformed.");
  }
};
var InvalidChallengeError = class extends PaymentError {
  name = "InvalidChallengeError";
  title = "Invalid Challenge";
  status = 402;
  type = "https://paymentauth.org/problems/invalid-challenge";
  constructor(options = {}) {
    const { id, reason } = options;
    const idPart = id ? ` "${id}"` : "";
    const reasonPart = reason ? `: ${reason}` : "";
    super(`Challenge${idPart} is invalid${reasonPart}.`);
  }
};
var VerificationFailedError = class extends PaymentError {
  name = "VerificationFailedError";
  title = "Verification Failed";
  type = "https://paymentauth.org/problems/verification-failed";
  constructor(options = {}) {
    const { details, reason } = options;
    super(reason ? `Payment verification failed: ${reason}.` : "Payment verification failed.", {
      details
    });
  }
};
var InternalPaymentError = class extends PaymentError {
  name = "InternalPaymentError";
  title = "Internal Payment Error";
  status = 500;
  type = "https://paymentauth.org/problems/internal-payment-error";
  constructor(options = {}) {
    super("An internal payment error occurred.", { cause: options.cause });
  }
};
var PaymentExpiredError = class extends PaymentError {
  name = "PaymentExpiredError";
  title = "Payment Expired";
  type = "https://paymentauth.org/problems/payment-expired";
  constructor(options = {}) {
    const { expires } = options;
    super(expires ? `Payment expired at ${expires}.` : "Payment has expired.");
  }
};
var PaymentOutcomeUnknownError = class extends PaymentError {
  name = "PaymentOutcomeUnknownError";
  title = "Payment Outcome Unknown";
  type = "https://paymentauth.org/problems/payment-outcome-unknown";
  /** Challenge the credential paid for. */
  challenge;
  /** Serialized credential sent with the paid request. */
  credential;
  /** On-chain hash the payment will have if it settled, when derivable from the credential. */
  transactionHash;
  constructor(options) {
    const { cause, challenge: challenge2, credential, transactionHash } = options;
    super(`Payment outcome is unknown after sending a credential for challenge "${challenge2.id}". Do not blindly retry.`, { cause });
    this.challenge = challenge2;
    this.credential = credential;
    this.transactionHash = transactionHash;
  }
};
var PaymentRequiredError = class extends PaymentError {
  name = "PaymentRequiredError";
  title = "Payment Required";
  type = "https://paymentauth.org/problems/payment-required";
  hint = Hints.paymentRequired;
  constructor(options = {}) {
    const { description } = options;
    const parts = ["Payment is required"];
    if (description)
      parts.push(`(${description})`);
    super(`${parts.join(" ")}.`);
  }
};
var InvalidPayloadError = class extends PaymentError {
  name = "InvalidPayloadError";
  title = "Invalid Payload";
  type = "https://paymentauth.org/problems/invalid-payload";
  constructor(options = {}) {
    const { reason } = options;
    super(reason ? `Credential payload is invalid: ${reason}.` : "Credential payload is invalid.");
  }
};

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Expires.js
function assert(expires, challengeId) {
  if (!expires)
    throw new InvalidChallengeError({
      ...challengeId && { id: challengeId },
      reason: "missing required expires field"
    });
  if (Number.isNaN(new Date(expires).getTime()))
    throw new InvalidChallengeError({
      ...challengeId && { id: challengeId },
      reason: "malformed expires timestamp"
    });
  if (Date.parse(expires) <= Date.now())
    throw new PaymentExpiredError({ expires });
}
function minutes(n) {
  return new Date(Date.now() + n * 60 * 1e3).toISOString();
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/version.js
var version = "0.1.1";

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/errors.js
function getVersion() {
  return version;
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Errors.js
var BaseError = class _BaseError extends Error {
  static setStaticOptions(options) {
    _BaseError.prototype.docsOrigin = options.docsOrigin;
    _BaseError.prototype.showVersion = options.showVersion;
    _BaseError.prototype.version = options.version;
  }
  constructor(shortMessage, options = {}) {
    const details = (() => {
      if (options.cause instanceof _BaseError) {
        if (options.cause.details)
          return options.cause.details;
        if (options.cause.shortMessage)
          return options.cause.shortMessage;
      }
      if (options.cause && "details" in options.cause && typeof options.cause.details === "string")
        return options.cause.details;
      if (options.cause?.message)
        return options.cause.message;
      return options.details;
    })();
    const docsPath = (() => {
      if (options.cause instanceof _BaseError)
        return options.cause.docsPath || options.docsPath;
      return options.docsPath;
    })();
    const docsBaseUrl = options.docsOrigin ?? _BaseError.prototype.docsOrigin;
    const docs = `${docsBaseUrl}${docsPath ?? ""}`;
    const showVersion = Boolean(options.version ?? _BaseError.prototype.showVersion);
    const version4 = options.version ?? _BaseError.prototype.version;
    const message = [
      shortMessage || "An error occurred.",
      ...options.metaMessages ? ["", ...options.metaMessages] : [],
      ...details || docsPath || showVersion ? [
        "",
        details ? `Details: ${details}` : void 0,
        docsPath ? `See: ${docs}` : void 0,
        showVersion ? `Version: ${version4}` : void 0
      ] : []
    ].filter((x) => typeof x === "string").join("\n");
    super(message, options.cause ? { cause: options.cause } : void 0);
    Object.defineProperty(this, "details", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "docs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "docsOrigin", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "docsPath", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "shortMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "showVersion", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "version", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "cause", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "BaseError"
    });
    this.cause = options.cause;
    this.details = details;
    this.docs = docs;
    this.docsOrigin = docsBaseUrl;
    this.docsPath = docsPath;
    this.shortMessage = shortMessage;
    this.showVersion = showVersion;
    this.version = version4;
  }
  walk(fn) {
    return walk(this, fn);
  }
};
Object.defineProperty(BaseError, "defaultStaticOptions", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: {
    docsOrigin: "https://oxlib.sh",
    showVersion: false,
    version: `ox@${getVersion()}`
  }
});
(() => {
  BaseError.setStaticOptions(BaseError.defaultStaticOptions);
})();
function walk(err, fn) {
  if (fn?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause)
    return walk(err.cause, fn);
  return fn ? null : err;
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Hash.js
var Hash_exports = {};
__export(Hash_exports, {
  hmac256: () => hmac256,
  keccak256: () => keccak256,
  ripemd160: () => ripemd1603,
  sha256: () => sha2563,
  validate: () => validate3
});
init_hmac();

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/legacy.js
init_md();
init_utils();
var Rho160 = /* @__PURE__ */ Uint8Array.from([
  7,
  4,
  13,
  1,
  10,
  6,
  15,
  3,
  12,
  0,
  9,
  5,
  2,
  14,
  11,
  8
]);
var Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
var Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
var idxLR = /* @__PURE__ */ (() => {
  const L = [Id160];
  const R = [Pi160];
  const res = [L, R];
  for (let i = 0; i < 4; i++)
    for (let j of res)
      j.push(j[i].map((k) => Rho160[k]));
  return res;
})();
var idxL = /* @__PURE__ */ (() => idxLR[0])();
var idxR = /* @__PURE__ */ (() => idxLR[1])();
var shifts160 = /* @__PURE__ */ [
  [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
  [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
  [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
  [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
  [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
].map((i) => Uint8Array.from(i));
var shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
var shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
var Kl160 = /* @__PURE__ */ Uint32Array.from([
  0,
  1518500249,
  1859775393,
  2400959708,
  2840853838
]);
var Kr160 = /* @__PURE__ */ Uint32Array.from([
  1352829926,
  1548603684,
  1836072691,
  2053994217,
  0
]);
function ripemd_f(group, x, y, z) {
  if (group === 0)
    return x ^ y ^ z;
  if (group === 1)
    return x & y | ~x & z;
  if (group === 2)
    return (x | ~y) ^ z;
  if (group === 3)
    return x & z | y & ~z;
  return x ^ (y | ~z);
}
var BUF_160 = /* @__PURE__ */ new Uint32Array(16);
var RIPEMD160 = class extends HashMD {
  constructor() {
    super(64, 20, 8, true);
    this.h0 = 1732584193 | 0;
    this.h1 = 4023233417 | 0;
    this.h2 = 2562383102 | 0;
    this.h3 = 271733878 | 0;
    this.h4 = 3285377520 | 0;
  }
  get() {
    const { h0, h1, h2, h3, h4 } = this;
    return [h0, h1, h2, h3, h4];
  }
  set(h0, h1, h2, h3, h4) {
    this.h0 = h0 | 0;
    this.h1 = h1 | 0;
    this.h2 = h2 | 0;
    this.h3 = h3 | 0;
    this.h4 = h4 | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      BUF_160[i] = view.getUint32(offset, true);
    let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
    for (let group = 0; group < 5; group++) {
      const rGroup = 4 - group;
      const hbl = Kl160[group], hbr = Kr160[group];
      const rl = idxL[group], rr = idxR[group];
      const sl = shiftsL160[group], sr = shiftsR160[group];
      for (let i = 0; i < 16; i++) {
        const tl = rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el | 0;
        al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
      }
      for (let i = 0; i < 16; i++) {
        const tr = rotl(ar + ripemd_f(rGroup, br, cr, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er | 0;
        ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
      }
    }
    this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
  }
  roundClean() {
    clean(BUF_160);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0);
  }
};
var ripemd160 = /* @__PURE__ */ createHasher(() => new RIPEMD160());

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/ripemd160.js
var ripemd1602 = ripemd160;

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Hash.js
init_sha3();

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha256.js
init_sha2();
var sha2562 = sha256;

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Bytes.js
var Bytes_exports = {};
__export(Bytes_exports, {
  InvalidBytesBooleanError: () => InvalidBytesBooleanError,
  InvalidBytesTypeError: () => InvalidBytesTypeError,
  SizeExceedsPaddingSizeError: () => SizeExceedsPaddingSizeError,
  SizeOverflowError: () => SizeOverflowError,
  SliceOffsetOutOfBoundsError: () => SliceOffsetOutOfBoundsError,
  assert: () => assert3,
  concat: () => concat2,
  from: () => from2,
  fromArray: () => fromArray,
  fromBoolean: () => fromBoolean2,
  fromHex: () => fromHex,
  fromNumber: () => fromNumber2,
  fromString: () => fromString2,
  isEqual: () => isEqual2,
  padLeft: () => padLeft2,
  padRight: () => padRight2,
  random: () => random,
  size: () => size,
  slice: () => slice2,
  toBigInt: () => toBigInt2,
  toBoolean: () => toBoolean2,
  toHex: () => toHex,
  toNumber: () => toNumber2,
  toString: () => toString2,
  trimLeft: () => trimLeft2,
  trimRight: () => trimRight,
  validate: () => validate2
});
init_utils2();

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Hex.js
var Hex_exports = {};
__export(Hex_exports, {
  IntegerOutOfRangeError: () => IntegerOutOfRangeError,
  InvalidHexBooleanError: () => InvalidHexBooleanError,
  InvalidHexTypeError: () => InvalidHexTypeError,
  InvalidHexValueError: () => InvalidHexValueError,
  InvalidLengthError: () => InvalidLengthError,
  SizeExceedsPaddingSizeError: () => SizeExceedsPaddingSizeError2,
  SizeOverflowError: () => SizeOverflowError2,
  SliceOffsetOutOfBoundsError: () => SliceOffsetOutOfBoundsError2,
  assert: () => assert2,
  concat: () => concat,
  from: () => from,
  fromBoolean: () => fromBoolean,
  fromBytes: () => fromBytes,
  fromNumber: () => fromNumber,
  fromString: () => fromString,
  isEqual: () => isEqual,
  padLeft: () => padLeft,
  padRight: () => padRight,
  random: () => random2,
  size: () => size2,
  slice: () => slice,
  toBigInt: () => toBigInt,
  toBoolean: () => toBoolean,
  toBytes: () => toBytes2,
  toNumber: () => toNumber,
  toString: () => toString,
  trimLeft: () => trimLeft,
  trimRight: () => trimRight2,
  validate: () => validate
});
init_utils2();

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/bytes.js
function assertSize(bytes, size_) {
  if (size(bytes) > size_)
    throw new SizeOverflowError({
      givenSize: size(bytes),
      maxSize: size_
    });
}
function assertStartOffset(value, start) {
  if (typeof start === "number" && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: "start",
      size: size(value)
    });
}
function assertEndOffset(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: "end",
      size: size(value)
    });
  }
}
var charCodeMap = {
  zero: 48,
  nine: 57,
  A: 65,
  F: 70,
  a: 97,
  f: 102
};
function charCodeToBase16(char) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine)
    return char - charCodeMap.zero;
  if (char >= charCodeMap.A && char <= charCodeMap.F)
    return char - (charCodeMap.A - 10);
  if (char >= charCodeMap.a && char <= charCodeMap.f)
    return char - (charCodeMap.a - 10);
  return void 0;
}
function pad(bytes, options = {}) {
  const { dir, size: size4 = 32 } = options;
  if (size4 === 0)
    return bytes;
  if (bytes.length > size4)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size4,
      type: "Bytes"
    });
  const paddedBytes = new Uint8Array(size4);
  for (let i = 0; i < size4; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size4 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
function trim(value, options = {}) {
  const { dir = "left" } = options;
  let data = value;
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  return data;
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/hex.js
function assertSize2(hex, size_) {
  if (size2(hex) > size_)
    throw new SizeOverflowError2({
      givenSize: size2(hex),
      maxSize: size_
    });
}
function assertStartOffset2(value, start) {
  if (typeof start === "number" && start > 0 && start > size2(value) - 1)
    throw new SliceOffsetOutOfBoundsError2({
      offset: start,
      position: "start",
      size: size2(value)
    });
}
function assertEndOffset2(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size2(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError2({
      offset: end,
      position: "end",
      size: size2(value)
    });
  }
}
function pad2(hex_, options = {}) {
  const { dir, size: size4 = 32 } = options;
  if (size4 === 0)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size4 * 2)
    throw new SizeExceedsPaddingSizeError2({
      size: Math.ceil(hex.length / 2),
      targetSize: size4,
      type: "Hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size4 * 2, "0")}`;
}
function trim2(value, options = {}) {
  const { dir = "left" } = options;
  let data = value.replace("0x", "");
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  if (data === "0")
    return "0x";
  if (dir === "right" && data.length % 2 === 1)
    return `0x${data}0`;
  return `0x${data}`;
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Json.js
var Json_exports = {};
__export(Json_exports, {
  canonicalize: () => canonicalize,
  parse: () => parse,
  stringify: () => stringify
});
var bigIntSuffix = "#__bigint";
function canonicalize(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("Cannot canonicalize non-finite number");
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (typeof value === "bigint")
    throw new TypeError("Cannot canonicalize bigint");
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.keys(value).sort().reduce((acc, key) => {
      const v = value[key];
      if (v !== void 0)
        acc.push(`${JSON.stringify(key)}:${canonicalize(v)}`);
      return acc;
    }, []);
    return `{${entries.join(",")}}`;
  }
  return void 0;
}
function parse(string3, reviver) {
  return JSON.parse(string3, (key, value_) => {
    const value = value_;
    if (typeof value === "string" && value.endsWith(bigIntSuffix))
      return BigInt(value.slice(0, -bigIntSuffix.length));
    return typeof reviver === "function" ? reviver(key, value) : value;
  });
}
function stringify(value, replacer, space) {
  return JSON.stringify(value, (key, value2) => {
    if (typeof replacer === "function")
      return replacer(key, value2);
    if (typeof value2 === "bigint")
      return value2.toString() + bigIntSuffix;
    return value2;
  }, space);
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Hex.js
var encoder = /* @__PURE__ */ new TextEncoder();
var hexes3 = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
function assert2(value, options = {}) {
  const { strict = false } = options;
  if (!value)
    throw new InvalidHexTypeError(value);
  if (typeof value !== "string")
    throw new InvalidHexTypeError(value);
  if (strict) {
    if (!/^0x[0-9a-fA-F]*$/.test(value))
      throw new InvalidHexValueError(value);
  }
  if (!value.startsWith("0x"))
    throw new InvalidHexValueError(value);
}
function concat(...values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
function from(value) {
  if (value instanceof Uint8Array)
    return fromBytes(value);
  if (Array.isArray(value))
    return fromBytes(new Uint8Array(value));
  return value;
}
function fromBoolean(value, options = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof options.size === "number") {
    assertSize2(hex, options.size);
    return padLeft(hex, options.size);
  }
  return hex;
}
function fromBytes(value, options = {}) {
  let string3 = "";
  for (let i = 0; i < value.length; i++)
    string3 += hexes3[value[i]];
  const hex = `0x${string3}`;
  if (typeof options.size === "number") {
    assertSize2(hex, options.size);
    return padRight(hex, options.size);
  }
  return hex;
}
function fromNumber(value, options = {}) {
  const { signed, size: size4 } = options;
  const value_ = BigInt(value);
  let maxValue;
  if (size4) {
    if (signed)
      maxValue = (1n << BigInt(size4) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size4) * 8n) - 1n;
  } else if (typeof value === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value_ > maxValue || value_ < minValue) {
    const suffix = typeof value === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size4,
      value: `${value}${suffix}`
    });
  }
  const stringValue = (signed && value_ < 0 ? BigInt.asUintN(size4 * 8, BigInt(value_)) : value_).toString(16);
  const hex = `0x${stringValue}`;
  if (size4)
    return padLeft(hex, size4);
  return hex;
}
function fromString(value, options = {}) {
  return fromBytes(encoder.encode(value), options);
}
function isEqual(hexA, hexB) {
  return equalBytes(fromHex(hexA), fromHex(hexB));
}
function padLeft(value, size4) {
  return pad2(value, { dir: "left", size: size4 });
}
function padRight(value, size4) {
  return pad2(value, { dir: "right", size: size4 });
}
function random2(length) {
  return fromBytes(random(length));
}
function slice(value, start, end, options = {}) {
  const { strict } = options;
  assertStartOffset2(value, start);
  const value_ = `0x${value.replace("0x", "").slice((start ?? 0) * 2, (end ?? value.length) * 2)}`;
  if (strict)
    assertEndOffset2(value_, start, end);
  return value_;
}
function size2(value) {
  return Math.ceil((value.length - 2) / 2);
}
function trimLeft(value) {
  return trim2(value, { dir: "left" });
}
function trimRight2(value) {
  return trim2(value, { dir: "right" });
}
function toBigInt(hex, options = {}) {
  const { signed } = options;
  if (options.size)
    assertSize2(hex, options.size);
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size4 = (hex.length - 2) / 2;
  const max_unsigned = (1n << BigInt(size4) * 8n) - 1n;
  const max_signed = max_unsigned >> 1n;
  if (value <= max_signed)
    return value;
  return value - max_unsigned - 1n;
}
function toBoolean(hex, options = {}) {
  if (options.size)
    assertSize2(hex, options.size);
  const hex_ = trimLeft(hex);
  if (hex_ === "0x")
    return false;
  if (hex_ === "0x1")
    return true;
  throw new InvalidHexBooleanError(hex);
}
function toBytes2(hex, options = {}) {
  return fromHex(hex, options);
}
function toNumber(hex, options = {}) {
  const { signed, size: size4 } = options;
  if (!signed && !size4)
    return Number(hex);
  return Number(toBigInt(hex, options));
}
function toString(hex, options = {}) {
  const { size: size4 } = options;
  let bytes = fromHex(hex);
  if (size4) {
    assertSize(bytes, size4);
    bytes = trimRight(bytes);
  }
  return new TextDecoder().decode(bytes);
}
function validate(value, options = {}) {
  const { strict = false } = options;
  try {
    assert2(value, { strict });
    return true;
  } catch {
    return false;
  }
}
var IntegerOutOfRangeError = class extends BaseError {
  constructor({ max, min, signed, size: size4, value }) {
    super(`Number \`${value}\` is not in safe${size4 ? ` ${size4 * 8}-bit` : ""}${signed ? " signed" : " unsigned"} integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.IntegerOutOfRangeError"
    });
  }
};
var InvalidHexBooleanError = class extends BaseError {
  constructor(hex) {
    super(`Hex value \`"${hex}"\` is not a valid boolean.`, {
      metaMessages: [
        'The hex value must be `"0x0"` (false) or `"0x1"` (true).'
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.InvalidHexBooleanError"
    });
  }
};
var InvalidHexTypeError = class extends BaseError {
  constructor(value) {
    super(`Value \`${typeof value === "object" ? stringify(value) : value}\` of type \`${typeof value}\` is an invalid hex type.`, {
      metaMessages: ['Hex types must be represented as `"0x${string}"`.']
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.InvalidHexTypeError"
    });
  }
};
var InvalidHexValueError = class extends BaseError {
  constructor(value) {
    super(`Value \`${value}\` is an invalid hex value.`, {
      metaMessages: [
        'Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).'
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.InvalidHexValueError"
    });
  }
};
var InvalidLengthError = class extends BaseError {
  constructor(value) {
    super(`Hex value \`"${value}"\` is an odd length (${value.length - 2} nibbles).`, {
      metaMessages: ["It must be an even length."]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.InvalidLengthError"
    });
  }
};
var SizeOverflowError2 = class extends BaseError {
  constructor({ givenSize, maxSize }) {
    super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.SizeOverflowError"
    });
  }
};
var SliceOffsetOutOfBoundsError2 = class extends BaseError {
  constructor({ offset, position, size: size4 }) {
    super(`Slice ${position === "start" ? "starting" : "ending"} at offset \`${offset}\` is out-of-bounds (size: \`${size4}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.SliceOffsetOutOfBoundsError"
    });
  }
};
var SizeExceedsPaddingSizeError2 = class extends BaseError {
  constructor({ size: size4, targetSize, type }) {
    super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size4}\`) exceeds padding size (\`${targetSize}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Hex.SizeExceedsPaddingSizeError"
    });
  }
};

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Bytes.js
var decoder = /* @__PURE__ */ new TextDecoder();
var encoder2 = /* @__PURE__ */ new TextEncoder();
function assert3(value) {
  if (value instanceof Uint8Array)
    return;
  if (!value)
    throw new InvalidBytesTypeError(value);
  if (typeof value !== "object")
    throw new InvalidBytesTypeError(value);
  if (!("BYTES_PER_ELEMENT" in value))
    throw new InvalidBytesTypeError(value);
  if (value.BYTES_PER_ELEMENT !== 1 || value.constructor.name !== "Uint8Array")
    throw new InvalidBytesTypeError(value);
}
function concat2(...values) {
  let length = 0;
  for (const arr of values) {
    length += arr.length;
  }
  const result = new Uint8Array(length);
  for (let i = 0, index = 0; i < values.length; i++) {
    const arr = values[i];
    result.set(arr, index);
    index += arr.length;
  }
  return result;
}
function from2(value) {
  if (value instanceof Uint8Array)
    return value;
  if (typeof value === "string")
    return fromHex(value);
  return fromArray(value);
}
function fromArray(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}
function fromBoolean2(value, options = {}) {
  const { size: size4 } = options;
  const bytes = new Uint8Array(1);
  bytes[0] = Number(value);
  if (typeof size4 === "number") {
    assertSize(bytes, size4);
    return padLeft2(bytes, size4);
  }
  return bytes;
}
function fromHex(value, options = {}) {
  const { size: size4 } = options;
  let hex = value;
  if (size4) {
    assertSize2(value, size4);
    hex = padRight(value, size4);
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index] = nibbleLeft << 4 | nibbleRight;
  }
  return bytes;
}
function fromNumber2(value, options) {
  const hex = fromNumber(value, options);
  return fromHex(hex);
}
function fromString2(value, options = {}) {
  const { size: size4 } = options;
  const bytes = encoder2.encode(value);
  if (typeof size4 === "number") {
    assertSize(bytes, size4);
    return padRight2(bytes, size4);
  }
  return bytes;
}
function isEqual2(bytesA, bytesB) {
  return equalBytes(bytesA, bytesB);
}
function padLeft2(value, size4) {
  return pad(value, { dir: "left", size: size4 });
}
function padRight2(value, size4) {
  return pad(value, { dir: "right", size: size4 });
}
function random(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}
function size(value) {
  return value.length;
}
function slice2(value, start, end, options = {}) {
  const { strict } = options;
  assertStartOffset(value, start);
  const value_ = value.slice(start, end);
  if (strict)
    assertEndOffset(value_, start, end);
  return value_;
}
function toBigInt2(bytes, options = {}) {
  const { size: size4 } = options;
  if (typeof size4 !== "undefined")
    assertSize(bytes, size4);
  const hex = fromBytes(bytes, options);
  return toBigInt(hex, options);
}
function toBoolean2(bytes, options = {}) {
  const { size: size4 } = options;
  let bytes_ = bytes;
  if (typeof size4 !== "undefined") {
    assertSize(bytes_, size4);
    bytes_ = trimLeft2(bytes_);
  }
  if (bytes_.length > 1 || bytes_[0] > 1)
    throw new InvalidBytesBooleanError(bytes_);
  return Boolean(bytes_[0]);
}
function toHex(value, options = {}) {
  return fromBytes(value, options);
}
function toNumber2(bytes, options = {}) {
  const { size: size4 } = options;
  if (typeof size4 !== "undefined")
    assertSize(bytes, size4);
  const hex = fromBytes(bytes, options);
  return toNumber(hex, options);
}
function toString2(bytes, options = {}) {
  const { size: size4 } = options;
  let bytes_ = bytes;
  if (typeof size4 !== "undefined") {
    assertSize(bytes_, size4);
    bytes_ = trimRight(bytes_);
  }
  return decoder.decode(bytes_);
}
function trimLeft2(value) {
  return trim(value, { dir: "left" });
}
function trimRight(value) {
  return trim(value, { dir: "right" });
}
function validate2(value) {
  try {
    assert3(value);
    return true;
  } catch {
    return false;
  }
}
var InvalidBytesBooleanError = class extends BaseError {
  constructor(bytes) {
    super(`Bytes value \`${bytes}\` is not a valid boolean.`, {
      metaMessages: [
        "The bytes array must contain a single byte of either a `0` or `1` value."
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Bytes.InvalidBytesBooleanError"
    });
  }
};
var InvalidBytesTypeError = class extends BaseError {
  constructor(value) {
    super(`Value \`${typeof value === "object" ? stringify(value) : value}\` of type \`${typeof value}\` is an invalid Bytes value.`, {
      metaMessages: ["Bytes values must be of type `Bytes`."]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Bytes.InvalidBytesTypeError"
    });
  }
};
var SizeOverflowError = class extends BaseError {
  constructor({ givenSize, maxSize }) {
    super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Bytes.SizeOverflowError"
    });
  }
};
var SliceOffsetOutOfBoundsError = class extends BaseError {
  constructor({ offset, position, size: size4 }) {
    super(`Slice ${position === "start" ? "starting" : "ending"} at offset \`${offset}\` is out-of-bounds (size: \`${size4}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Bytes.SliceOffsetOutOfBoundsError"
    });
  }
};
var SizeExceedsPaddingSizeError = class extends BaseError {
  constructor({ size: size4, targetSize, type }) {
    super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size4}\`) exceeds padding size (\`${targetSize}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Bytes.SizeExceedsPaddingSizeError"
    });
  }
};

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Hash.js
function keccak256(value, options = {}) {
  const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
  const bytes = keccak_256(from2(value));
  if (as === "Bytes")
    return bytes;
  return fromBytes(bytes);
}
function hmac256(key, value, options = {}) {
  const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
  const bytes = hmac(sha2562, from2(key), from2(value));
  if (as === "Bytes")
    return bytes;
  return fromBytes(bytes);
}
function ripemd1603(value, options = {}) {
  const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
  const bytes = ripemd1602(from2(value));
  if (as === "Bytes")
    return bytes;
  return fromBytes(bytes);
}
function sha2563(value, options = {}) {
  const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
  const bytes = sha2562(from2(value));
  if (as === "Bytes")
    return bytes;
  return fromBytes(bytes);
}
function validate3(value) {
  return value.length === 66 && validate(value, { strict: true });
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/lru.js
var LruMap = class extends Map {
  constructor(size4) {
    super();
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxSize = size4;
  }
  get(key) {
    const value = super.get(key);
    if (super.has(key) && value !== void 0) {
      this.delete(key);
      super.set(key, value);
    }
    return value;
  }
  set(key, value) {
    super.set(key, value);
    if (this.maxSize && this.size > this.maxSize) {
      const firstKey = this.keys().next().value;
      if (firstKey)
        this.delete(firstKey);
    }
    return this;
  }
};

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Caches.js
var caches = {
  checksum: /* @__PURE__ */ new LruMap(8192)
};
var checksum = caches.checksum;

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/PublicKey.js
function assert4(publicKey, options = {}) {
  const { compressed } = options;
  const { prefix, x, y } = publicKey;
  if (compressed === false || typeof x === "bigint" && typeof y === "bigint") {
    if (prefix !== 4)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidUncompressedPrefixError()
      });
    return;
  }
  if (compressed === true || typeof x === "bigint" && typeof y === "undefined") {
    if (prefix !== 3 && prefix !== 2)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidCompressedPrefixError()
      });
    return;
  }
  throw new InvalidError({ publicKey });
}
function from3(value) {
  const publicKey = (() => {
    if (validate(value))
      return fromHex2(value);
    if (validate2(value))
      return fromBytes2(value);
    const { prefix, x, y } = value;
    if (typeof x === "bigint" && typeof y === "bigint")
      return { prefix: prefix ?? 4, x, y };
    return { prefix, x };
  })();
  assert4(publicKey);
  return publicKey;
}
function fromBytes2(publicKey) {
  return fromHex2(fromBytes(publicKey));
}
function fromHex2(publicKey) {
  if (publicKey.length !== 132 && publicKey.length !== 130 && publicKey.length !== 68)
    throw new InvalidSerializedSizeError({ publicKey });
  if (publicKey.length === 130) {
    const x2 = BigInt(slice(publicKey, 0, 32));
    const y = BigInt(slice(publicKey, 32, 64));
    return {
      prefix: 4,
      x: x2,
      y
    };
  }
  if (publicKey.length === 132) {
    const prefix2 = Number(slice(publicKey, 0, 1));
    const x2 = BigInt(slice(publicKey, 1, 33));
    const y = BigInt(slice(publicKey, 33, 65));
    return {
      prefix: prefix2,
      x: x2,
      y
    };
  }
  const prefix = Number(slice(publicKey, 0, 1));
  const x = BigInt(slice(publicKey, 1, 33));
  return {
    prefix,
    x
  };
}
function toBytes3(publicKey, options = {}) {
  return fromHex(toHex2(publicKey, options));
}
function toHex2(publicKey, options = {}) {
  assert4(publicKey);
  const { prefix, x, y } = publicKey;
  const { includePrefix = true } = options;
  const publicKey_ = concat(
    includePrefix ? fromNumber(prefix, { size: 1 }) : "0x",
    fromNumber(x, { size: 32 }),
    // If the public key is not compressed, add the y coordinate.
    typeof y === "bigint" ? fromNumber(y, { size: 32 }) : "0x"
  );
  return publicKey_;
}
var InvalidError = class extends BaseError {
  constructor({ publicKey }) {
    super(`Value \`${stringify(publicKey)}\` is not a valid public key.`, {
      metaMessages: [
        "Public key must contain:",
        "- an `x` and `prefix` value (compressed)",
        "- an `x`, `y`, and `prefix` value (uncompressed)"
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidError"
    });
  }
};
var InvalidPrefixError = class extends BaseError {
  constructor({ prefix, cause }) {
    super(`Prefix "${prefix}" is invalid.`, {
      cause
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidPrefixError"
    });
  }
};
var InvalidCompressedPrefixError = class extends BaseError {
  constructor() {
    super("Prefix must be 2 or 3 for compressed public keys.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidCompressedPrefixError"
    });
  }
};
var InvalidUncompressedPrefixError = class extends BaseError {
  constructor() {
    super("Prefix must be 4 for uncompressed public keys.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidUncompressedPrefixError"
    });
  }
};
var InvalidSerializedSizeError = class extends BaseError {
  constructor({ publicKey }) {
    super(`Value \`${publicKey}\` is an invalid public key size.`, {
      metaMessages: [
        "Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).",
        `Received ${size2(from(publicKey))} bytes.`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidSerializedSizeError"
    });
  }
};

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Address.js
var addressRegex = /^0x[a-fA-F0-9]{40}$/;
function assert5(value, options = {}) {
  const { strict = true } = options;
  if (!addressRegex.test(value))
    throw new InvalidAddressError({
      address: value,
      cause: new InvalidInputError()
    });
  if (strict) {
    if (value.toLowerCase() === value)
      return;
    if (checksum2(value) !== value)
      throw new InvalidAddressError({
        address: value,
        cause: new InvalidChecksumError()
      });
  }
}
function checksum2(address3) {
  if (checksum.has(address3))
    return checksum.get(address3);
  assert5(address3, { strict: false });
  const hexAddress = address3.substring(2).toLowerCase();
  const hash2 = keccak256(fromString2(hexAddress), { as: "Bytes" });
  const characters = hexAddress.split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash2[i >> 1] >> 4 >= 8 && characters[i]) {
      characters[i] = characters[i].toUpperCase();
    }
    if ((hash2[i >> 1] & 15) >= 8 && characters[i + 1]) {
      characters[i + 1] = characters[i + 1].toUpperCase();
    }
  }
  const result = `0x${characters.join("")}`;
  checksum.set(address3, result);
  return result;
}
function from4(address3, options = {}) {
  const { checksum: checksumVal = false } = options;
  assert5(address3);
  if (checksumVal)
    return checksum2(address3);
  return address3;
}
function fromPublicKey(publicKey, options = {}) {
  const address3 = keccak256(`0x${toHex2(publicKey).slice(4)}`).substring(26);
  return from4(`0x${address3}`, options);
}
function isEqual3(addressA, addressB) {
  assert5(addressA, { strict: false });
  assert5(addressB, { strict: false });
  return addressA.toLowerCase() === addressB.toLowerCase();
}
var InvalidAddressError = class extends BaseError {
  constructor({ address: address3, cause }) {
    super(`Address "${address3}" is invalid.`, {
      cause
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidAddressError"
    });
  }
};
var InvalidInputError = class extends BaseError {
  constructor() {
    super("Address is not a 20 byte (40 hexadecimal character) value.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidInputError"
    });
  }
};
var InvalidChecksumError = class extends BaseError {
  constructor() {
    super("Address does not match its checksum counterpart.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidChecksumError"
    });
  }
};

// packages/payment-adapters/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/pbkdf2.js
init_hmac();
init_utils();
function pbkdf2Init(hash2, _password, _salt, _opts) {
  ahash(hash2);
  const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
  const { c, dkLen, asyncTick } = opts;
  anumber(c);
  anumber(dkLen);
  anumber(asyncTick);
  if (c < 1)
    throw new Error("iterations (c) should be >= 1");
  const password = kdfInputToBytes(_password);
  const salt = kdfInputToBytes(_salt);
  const DK = new Uint8Array(dkLen);
  const PRF = hmac.create(hash2, password);
  const PRFSalt = PRF._cloneInto().update(salt);
  return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
  PRF.destroy();
  PRFSalt.destroy();
  if (prfW)
    prfW.destroy();
  clean(u);
  return DK;
}
function pbkdf2(hash2, password, salt, opts) {
  const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash2, password, salt, opts);
  let prfW;
  const arr = new Uint8Array(4);
  const view = createView(arr);
  const u = new Uint8Array(PRF.outputLen);
  for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
    const Ti = DK.subarray(pos, pos + PRF.outputLen);
    view.setInt32(0, ti, false);
    (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
    Ti.set(u.subarray(0, Ti.length));
    for (let ui = 1; ui < c; ui++) {
      PRF._cloneInto(prfW).update(u).digestInto(u);
      for (let i = 0; i < Ti.length; i++)
        Ti[i] ^= u[i];
    }
  }
  return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}

// packages/payment-adapters/node_modules/.pnpm/@scure+bip39@1.6.0/node_modules/@scure/bip39/esm/index.js
init_sha2();

// packages/payment-adapters/node_modules/.pnpm/@scure+base@1.2.6/node_modules/@scure/base/lib/esm/index.js
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function isArrayOf(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr(label, input) {
  if (typeof input !== "string")
    throw new Error(`${label}: string expected`);
  return true;
}
function anumber2(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr(label, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label}: array of strings expected`);
}
function anumArr(label, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain(...args) {
  const id = (a) => a;
  const wrap = (a, b) => (c) => a(b(c));
  const encode2 = args.map((x) => x.encode).reduceRight(wrap, id);
  const decode2 = args.map((x) => x.decode).reduce(wrap, id);
  return { encode: encode2, decode: decode2 };
}
// @__NO_SIDE_EFFECTS__
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join(separator = "") {
  astr("join", separator);
  return {
    encode: (from14) => {
      astrArr("join.decode", from14);
      return from14.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
    }
  };
}
function convertRadix(data, from14, to) {
  if (from14 < 2)
    throw new Error(`convertRadix: invalid from=${from14}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber2(d);
    if (d < 0 || d >= from14)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry2 = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from14 * carry2;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from14 !== carry2 || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry2 = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry2 !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry2);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
// @__NO_SIDE_EFFECTS__
function radix(num2) {
  anumber2(num2);
  const _256 = 2 ** 8;
  return {
    encode: (bytes) => {
      if (!isBytes3(bytes))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes), _256, num2);
    },
    decode: (digits) => {
      anumArr("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num2, _256));
    }
  };
}
function checksum3(len, fn) {
  anumber2(len);
  afn(fn);
  return {
    encode(data) {
      if (!isBytes3(data))
        throw new Error("checksum.encode: input should be Uint8Array");
      const sum = fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes3(data))
        throw new Error("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
var genBase58 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet(abc), /* @__PURE__ */ join(""));
var base58 = /* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
var createBase58check = (sha2564) => /* @__PURE__ */ chain(checksum3(4, (data) => sha2564(sha2564(data))), base58);

// packages/payment-adapters/node_modules/.pnpm/@scure+bip39@1.6.0/node_modules/@scure/bip39/esm/index.js
function nfkd(str) {
  if (typeof str !== "string")
    throw new TypeError("invalid mnemonic type: " + typeof str);
  return str.normalize("NFKD");
}
function normalize(str) {
  const norm = nfkd(str);
  const words = norm.split(" ");
  if (![12, 15, 18, 21, 24].includes(words.length))
    throw new Error("Invalid mnemonic");
  return { nfkd: norm, words };
}
var psalt = (passphrase) => nfkd("mnemonic" + passphrase);
function mnemonicToSeedSync(mnemonic, passphrase = "") {
  return pbkdf2(sha512, normalize(mnemonic).nfkd, psalt(passphrase), { c: 2048, dkLen: 64 });
}

// packages/payment-adapters/node_modules/.pnpm/@scure+bip32@1.7.0/node_modules/@scure/bip32/lib/esm/index.js
init_modular();
init_secp256k1();
init_hmac();
init_sha2();
init_utils();
var Point2 = secp256k1.ProjectivePoint;
var base58check = createBase58check(sha256);
function bytesToNumber(bytes) {
  abytes(bytes);
  const h = bytes.length === 0 ? "0" : bytesToHex(bytes);
  return BigInt("0x" + h);
}
function numberToBytes(num2) {
  if (typeof num2 !== "bigint")
    throw new Error("bigint expected");
  return hexToBytes(num2.toString(16).padStart(64, "0"));
}
var MASTER_SECRET = utf8ToBytes("Bitcoin seed");
var BITCOIN_VERSIONS = { private: 76066276, public: 76067358 };
var HARDENED_OFFSET = 2147483648;
var hash160 = (data) => ripemd160(sha256(data));
var fromU32 = (data) => createView(data).getUint32(0, false);
var toU32 = (n) => {
  if (!Number.isSafeInteger(n) || n < 0 || n > 2 ** 32 - 1) {
    throw new Error("invalid number, should be from 0 to 2**32-1, got " + n);
  }
  const buf = new Uint8Array(4);
  createView(buf).setUint32(0, n, false);
  return buf;
};
var HDKey = class _HDKey {
  get fingerprint() {
    if (!this.pubHash) {
      throw new Error("No publicKey set!");
    }
    return fromU32(this.pubHash);
  }
  get identifier() {
    return this.pubHash;
  }
  get pubKeyHash() {
    return this.pubHash;
  }
  get privateKey() {
    return this.privKeyBytes || null;
  }
  get publicKey() {
    return this.pubKey || null;
  }
  get privateExtendedKey() {
    const priv = this.privateKey;
    if (!priv) {
      throw new Error("No private key");
    }
    return base58check.encode(this.serialize(this.versions.private, concatBytes(new Uint8Array([0]), priv)));
  }
  get publicExtendedKey() {
    if (!this.pubKey) {
      throw new Error("No public key");
    }
    return base58check.encode(this.serialize(this.versions.public, this.pubKey));
  }
  static fromMasterSeed(seed, versions = BITCOIN_VERSIONS) {
    abytes(seed);
    if (8 * seed.length < 128 || 8 * seed.length > 512) {
      throw new Error("HDKey: seed length must be between 128 and 512 bits; 256 bits is advised, got " + seed.length);
    }
    const I = hmac(sha512, MASTER_SECRET, seed);
    return new _HDKey({
      versions,
      chainCode: I.slice(32),
      privateKey: I.slice(0, 32)
    });
  }
  static fromExtendedKey(base58key, versions = BITCOIN_VERSIONS) {
    const keyBuffer = base58check.decode(base58key);
    const keyView = createView(keyBuffer);
    const version4 = keyView.getUint32(0, false);
    const opt = {
      versions,
      depth: keyBuffer[4],
      parentFingerprint: keyView.getUint32(5, false),
      index: keyView.getUint32(9, false),
      chainCode: keyBuffer.slice(13, 45)
    };
    const key = keyBuffer.slice(45);
    const isPriv = key[0] === 0;
    if (version4 !== versions[isPriv ? "private" : "public"]) {
      throw new Error("Version mismatch");
    }
    if (isPriv) {
      return new _HDKey({ ...opt, privateKey: key.slice(1) });
    } else {
      return new _HDKey({ ...opt, publicKey: key });
    }
  }
  static fromJSON(json) {
    return _HDKey.fromExtendedKey(json.xpriv);
  }
  constructor(opt) {
    this.depth = 0;
    this.index = 0;
    this.chainCode = null;
    this.parentFingerprint = 0;
    if (!opt || typeof opt !== "object") {
      throw new Error("HDKey.constructor must not be called directly");
    }
    this.versions = opt.versions || BITCOIN_VERSIONS;
    this.depth = opt.depth || 0;
    this.chainCode = opt.chainCode || null;
    this.index = opt.index || 0;
    this.parentFingerprint = opt.parentFingerprint || 0;
    if (!this.depth) {
      if (this.parentFingerprint || this.index) {
        throw new Error("HDKey: zero depth with non-zero index/parent fingerprint");
      }
    }
    if (opt.publicKey && opt.privateKey) {
      throw new Error("HDKey: publicKey and privateKey at same time.");
    }
    if (opt.privateKey) {
      if (!secp256k1.utils.isValidPrivateKey(opt.privateKey)) {
        throw new Error("Invalid private key");
      }
      this.privKey = typeof opt.privateKey === "bigint" ? opt.privateKey : bytesToNumber(opt.privateKey);
      this.privKeyBytes = numberToBytes(this.privKey);
      this.pubKey = secp256k1.getPublicKey(opt.privateKey, true);
    } else if (opt.publicKey) {
      this.pubKey = Point2.fromHex(opt.publicKey).toRawBytes(true);
    } else {
      throw new Error("HDKey: no public or private key provided");
    }
    this.pubHash = hash160(this.pubKey);
  }
  derive(path) {
    if (!/^[mM]'?/.test(path)) {
      throw new Error('Path must start with "m" or "M"');
    }
    if (/^[mM]'?$/.test(path)) {
      return this;
    }
    const parts = path.replace(/^[mM]'?\//, "").split("/");
    let child = this;
    for (const c of parts) {
      const m = /^(\d+)('?)$/.exec(c);
      const m1 = m && m[1];
      if (!m || m.length !== 3 || typeof m1 !== "string")
        throw new Error("invalid child index: " + c);
      let idx = +m1;
      if (!Number.isSafeInteger(idx) || idx >= HARDENED_OFFSET) {
        throw new Error("Invalid index");
      }
      if (m[2] === "'") {
        idx += HARDENED_OFFSET;
      }
      child = child.deriveChild(idx);
    }
    return child;
  }
  deriveChild(index) {
    if (!this.pubKey || !this.chainCode) {
      throw new Error("No publicKey or chainCode set");
    }
    let data = toU32(index);
    if (index >= HARDENED_OFFSET) {
      const priv = this.privateKey;
      if (!priv) {
        throw new Error("Could not derive hardened child key");
      }
      data = concatBytes(new Uint8Array([0]), priv, data);
    } else {
      data = concatBytes(this.pubKey, data);
    }
    const I = hmac(sha512, this.chainCode, data);
    const childTweak = bytesToNumber(I.slice(0, 32));
    const chainCode = I.slice(32);
    if (!secp256k1.utils.isValidPrivateKey(childTweak)) {
      throw new Error("Tweak bigger than curve order");
    }
    const opt = {
      versions: this.versions,
      chainCode,
      depth: this.depth + 1,
      parentFingerprint: this.fingerprint,
      index
    };
    try {
      if (this.privateKey) {
        const added = mod(this.privKey + childTweak, secp256k1.CURVE.n);
        if (!secp256k1.utils.isValidPrivateKey(added)) {
          throw new Error("The tweak was out of range or the resulted private key is invalid");
        }
        opt.privateKey = added;
      } else {
        const added = Point2.fromHex(this.pubKey).add(Point2.fromPrivateKey(childTweak));
        if (added.equals(Point2.ZERO)) {
          throw new Error("The tweak was equal to negative P, which made the result key invalid");
        }
        opt.publicKey = added.toRawBytes(true);
      }
      return new _HDKey(opt);
    } catch (err) {
      return this.deriveChild(index + 1);
    }
  }
  sign(hash2) {
    if (!this.privateKey) {
      throw new Error("No privateKey set!");
    }
    abytes(hash2, 32);
    return secp256k1.sign(hash2, this.privKey).toCompactRawBytes();
  }
  verify(hash2, signature2) {
    abytes(hash2, 32);
    abytes(signature2, 64);
    if (!this.publicKey) {
      throw new Error("No publicKey set!");
    }
    let sig;
    try {
      sig = secp256k1.Signature.fromCompact(signature2);
    } catch (error) {
      return false;
    }
    return secp256k1.verify(sig, hash2, this.publicKey);
  }
  wipePrivateData() {
    this.privKey = void 0;
    if (this.privKeyBytes) {
      this.privKeyBytes.fill(0);
      this.privKeyBytes = void 0;
    }
    return this;
  }
  toJSON() {
    return {
      xpriv: this.privateExtendedKey,
      xpub: this.publicExtendedKey
    };
  }
  serialize(version4, key) {
    if (!this.chainCode) {
      throw new Error("No chainCode set");
    }
    abytes(key, 33);
    return concatBytes(toU32(version4), new Uint8Array([this.depth]), toU32(this.parentFingerprint), toU32(this.index), this.chainCode, key);
  }
};

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Secp256k1.js
var Secp256k1_exports = {};
__export(Secp256k1_exports, {
  InvalidSeedSizeError: () => InvalidSeedSizeError,
  createKeyPair: () => createKeyPair,
  fromMnemonic: () => fromMnemonic,
  fromSeed: () => fromSeed,
  getPublicKey: () => getPublicKey,
  getSharedSecret: () => getSharedSecret,
  noble: () => noble,
  randomPrivateKey: () => randomPrivateKey,
  recoverAddress: () => recoverAddress,
  recoverPublicKey: () => recoverPublicKey,
  sign: () => sign,
  verify: () => verify
});
init_secp256k1();

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/entropy.js
var extraEntropy = false;

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/keyDerivation.js
function derive(seed, domain, options = {}) {
  const { validate: validate5 } = options;
  for (let counter = 0; ; counter++) {
    const key = hmac256(seed, concat2(domain, fromNumber2(counter, { size: 4 })), { as: "Bytes" });
    if (!validate5 || validate5(key))
      return key;
    key.fill(0);
  }
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/internal/mnemonic.js
function toPrivateKey(mnemonic, options = {}) {
  const { path = "m/44'/60'/0'/0/0", passphrase } = options;
  const privateKey = HDKey.fromMasterSeed(toSeed(mnemonic, { passphrase })).derive(path).privateKey;
  if (options.as === "Bytes")
    return privateKey;
  return fromBytes(privateKey);
}
function toSeed(mnemonic, options = {}) {
  return mnemonicToSeedSync(mnemonic, options.passphrase);
}

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Secp256k1.js
var noble = secp256k1;
function createKeyPair(options = {}) {
  const { as = "Hex" } = options;
  const privateKey = randomPrivateKey({ as });
  const publicKey = getPublicKey({ privateKey });
  return {
    privateKey,
    publicKey
  };
}
function fromMnemonic(mnemonic, options = {}) {
  const { as = "Hex", passphrase, path } = options;
  return toPrivateKey(mnemonic, { as, passphrase, path });
}
function fromSeed(seed, options = {}) {
  const { as = "Hex" } = options;
  const bytes = from2(seed);
  if (bytes.length < 32)
    throw new InvalidSeedSizeError({ size: bytes.length });
  const privateKey = derive(bytes, fromSeedDomain, {
    validate: noble.utils.isValidPrivateKey
  });
  if (as === "Hex") {
    const value = fromBytes(privateKey);
    privateKey.fill(0);
    return value;
  }
  return privateKey;
}
function getPublicKey(options) {
  const { privateKey } = options;
  const point = secp256k1.ProjectivePoint.fromPrivateKey(from(privateKey).slice(2));
  return from3(point);
}
function getSharedSecret(options) {
  const { as = "Hex", privateKey, publicKey } = options;
  const point = secp256k1.ProjectivePoint.fromHex(toHex2(publicKey).slice(2));
  const sharedPoint = point.multiply(secp256k1.utils.normPrivateKeyToScalar(from(privateKey).slice(2)));
  const sharedSecret = sharedPoint.toRawBytes(true);
  if (as === "Hex")
    return fromBytes(sharedSecret);
  return sharedSecret;
}
function randomPrivateKey(options = {}) {
  const { as = "Hex" } = options;
  const bytes = secp256k1.utils.randomPrivateKey();
  if (as === "Hex")
    return fromBytes(bytes);
  return bytes;
}
function recoverAddress(options) {
  return fromPublicKey(recoverPublicKey(options));
}
function recoverPublicKey(options) {
  const { payload, signature: signature2 } = options;
  const { r, s, yParity } = signature2;
  const signature_ = new secp256k1.Signature(BigInt(r), BigInt(s)).addRecoveryBit(yParity);
  const point = signature_.recoverPublicKey(from(payload).substring(2));
  return from3(point);
}
function sign(options) {
  const { extraEntropy: extraEntropy2 = extraEntropy, hash: hash2, payload, privateKey } = options;
  const { r, s, recovery } = secp256k1.sign(from2(payload), from2(privateKey), {
    extraEntropy: typeof extraEntropy2 === "boolean" ? extraEntropy2 : from(extraEntropy2).slice(2),
    lowS: true,
    ...hash2 ? { prehash: true } : {}
  });
  return {
    r,
    s,
    yParity: recovery
  };
}
function verify(options) {
  const { hash: hash2, payload } = options;
  if (options.address)
    return isEqual3(options.address, recoverAddress({ payload, signature: options.signature }));
  return secp256k1.verify(options.signature, from2(payload), toBytes3(options.publicKey), ...hash2 ? [{ prehash: true, lowS: true }] : []);
}
var InvalidSeedSizeError = class extends BaseError {
  constructor(options) {
    super(`Seed must contain at least 32 bytes. Received ${options.size} bytes.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Secp256k1.InvalidSeedSizeError"
    });
  }
};
var fromSeedDomain = fromString2("ox.secp256k1.fromSeed.v1");

// packages/payment-adapters/node_modules/.pnpm/ox@0.14.45_zod@4.6.7/node_modules/ox/_esm/core/Base64.js
var Base64_exports = {};
__export(Base64_exports, {
  fromBytes: () => fromBytes3,
  fromHex: () => fromHex3,
  fromString: () => fromString3,
  toBytes: () => toBytes4,
  toHex: () => toHex3,
  toString: () => toString3
});
var encoder3 = /* @__PURE__ */ new TextEncoder();
var decoder2 = /* @__PURE__ */ new TextDecoder();
var integerToCharacter = /* @__PURE__ */ Object.fromEntries(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").map((a, i) => [i, a.charCodeAt(0)]));
var characterToInteger = {
  ...Object.fromEntries(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/").map((a, i) => [a.charCodeAt(0), i])),
  ["=".charCodeAt(0)]: 0,
  ["-".charCodeAt(0)]: 62,
  ["_".charCodeAt(0)]: 63
};
function fromBytes3(value, options = {}) {
  const { pad: pad4 = true, url = false } = options;
  const encoded = new Uint8Array(Math.ceil(value.length / 3) * 4);
  for (let i = 0, j = 0; j < value.length; i += 4, j += 3) {
    const y = (value[j] << 16) + (value[j + 1] << 8) + (value[j + 2] | 0);
    encoded[i] = integerToCharacter[y >> 18];
    encoded[i + 1] = integerToCharacter[y >> 12 & 63];
    encoded[i + 2] = integerToCharacter[y >> 6 & 63];
    encoded[i + 3] = integerToCharacter[y & 63];
  }
  const k = value.length % 3;
  const end = Math.floor(value.length / 3) * 4 + (k && k + 1);
  let base64 = decoder2.decode(new Uint8Array(encoded.buffer, 0, end));
  if (pad4 && k === 1)
    base64 += "==";
  if (pad4 && k === 2)
    base64 += "=";
  if (url)
    base64 = base64.replaceAll("+", "-").replaceAll("/", "_");
  return base64;
}
function fromHex3(value, options = {}) {
  return fromBytes3(fromHex(value), options);
}
function fromString3(value, options = {}) {
  return fromBytes3(fromString2(value), options);
}
function toBytes4(value) {
  const base64 = value.replace(/=+$/, "");
  const size4 = base64.length;
  const decoded = new Uint8Array(size4 + 3);
  encoder3.encodeInto(base64 + "===", decoded);
  for (let i = 0, j = 0; i < base64.length; i += 4, j += 3) {
    const x = (characterToInteger[decoded[i]] << 18) + (characterToInteger[decoded[i + 1]] << 12) + (characterToInteger[decoded[i + 2]] << 6) + characterToInteger[decoded[i + 3]];
    decoded[j] = x >> 16;
    decoded[j + 1] = x >> 8 & 255;
    decoded[j + 2] = x & 255;
  }
  const decodedSize = (size4 >> 2) * 3 + (size4 % 4 && size4 % 4 - 1);
  return new Uint8Array(decoded.buffer, 0, decodedSize);
}
function toHex3(value) {
  return fromBytes(toBytes4(value));
}
function toString3(value) {
  return toString2(toBytes4(value));
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/internal/constantTimeEqual.js
function constantTimeEqual(a, b) {
  const hashA = Hash_exports.sha256(Hex_exports.fromString(a));
  const hashB = Hash_exports.sha256(Hex_exports.fromString(b));
  let result = 0;
  for (let i = 0; i < hashA.length; i++)
    result |= hashA.charCodeAt(i) ^ hashB.charCodeAt(i);
  return result === 0;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/PaymentRequest.js
function deserialize(encoded) {
  const json = Base64_exports.toString(encoded);
  return JSON.parse(json);
}
function fromMethod(method, request2) {
  return method.schema.request.parse(request2);
}
function serialize(request2) {
  const json = Json_exports.canonicalize(request2);
  return Base64_exports.fromString(json, { pad: false, url: true });
}

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
var Cached = class {
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params2) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params2?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params2 = _params;
  if (!params2)
    return {};
  if (typeof params2 === "string")
    return { error: () => params2 };
  if (params2?.message !== void 0) {
    if (params2?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params2.error = params2.message;
  }
  delete params2.message;
  if (typeof params2.error === "string")
    return { ...params2, error: () => params2.error };
  return params2;
}
function optionalKeys(shape2) {
  return Object.keys(shape2).filter((k) => {
    return shape2[k]._zod.optin !== void 0 && shape2[k]._zod.optout === "optional";
  });
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a2;
    (_a2 = iss).path ?? (_a2.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function sizeCaps(defChecks) {
  const caps = [];
  for (const ch of defChecks ?? []) {
    const d = ch._zod.def;
    if (!/_(length|size)$|_equals$/.test(d.check))
      break;
    const max = d.maximum ?? d.length ?? d.size;
    if (max >= 0)
      caps.push([max, ch]);
  }
  return caps;
}
function attachSchema(issues, start, inst) {
  var _a2;
  for (let i = start; i < issues.length; i++) {
    (_a2 = issues[i]).schema ?? (_a2.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config2) {
  var _a2;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a2 = iss).schema ?? (_a2.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute2) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute2(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/core.js
var _a;
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer2, proto, params2) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer2(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  const Parent = params2?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params2?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params2?.Parent && inst instanceof params2.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/parse.js
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parse2 = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params2) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params2?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params2?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
function failure(Err, issues, ctx) {
  let error;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error;
    },
    set error(e) {
      error = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/regexes.js
var anyString = /^[\s\S]{0,}$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a2;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a2 = inst._zod).onattach ?? (_a2.onattach = []);
});
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== void 0;
};
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a2;
  $ZodCheck.init(inst, def);
  (_a2 = inst._zod.def).when ?? (_a2.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a2, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a2 = inst._zod).check ?? (_a2.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/versions.js
var version2 = {
  major: 4,
  minor: 6,
  patch: 7
};

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version2;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
function capSize(inst, size4) {
  const caps = sizeCaps(inst._zod.def.checks);
  if (!caps.length)
    return;
  const cap = Math.min(...caps.map((c) => c[0]));
  const parse5 = inst._zod.parse;
  inst._zod.parse = (payload, ctx) => {
    const n = size4(payload.value);
    if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
      for (const [max, ch] of sizeCaps(inst._zod.def.checks)) {
        if (n > max && ch._zod.def.when(payload)) {
          const start = payload.issues.length;
          ch._zod.check(payload);
          payload.issues[start].continue = false;
          attachSchema(payload.issues, start, inst);
          return payload;
        }
      }
    }
    return parse5(payload, ctx);
  };
}
var arraySize = (input) => Array.isArray(input) ? input.length : -1;
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
  capSize(inst, arraySize);
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get3 = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get3.raw = newSh;
      return newSh;
    };
    get3.raw = sh;
    Object.defineProperty(def, "shape", { get: get3 });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape2 = zod.def.shape;
    const propValues = {};
    for (const key in shape2) {
      const field = shape2[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape2 = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape2[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
function handleUnionResults(results2, final, inst, ctx) {
  for (const result of results2) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results2.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results2.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results2 = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results2.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results2.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results2, payload, inst, ctx);
    return Promise.all(results2).then((results3) => {
      return handleUnionResults(results3, payload, inst, ctx);
    });
  };
});
function discriminatorMap(def) {
  const map = /* @__PURE__ */ new Map();
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map.has(value)) {
        if (value !== void 0)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map.set(value, null);
      } else {
        map.set(value, option);
      }
    }
  }
  return map;
}
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(void 0))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, /* @__PURE__ */ new Set());
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(void 0);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const value = input?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== void 0 || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value2) => disc.value.get(value2) !== null),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[outKey] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params2) {
  return new Class(snapshotChecks({ type: "string", ...normalizeParams(params2) }));
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params2) {
  return new Class(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params2) }));
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params2) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params2)
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params2) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params2),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params2) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params2),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}

// packages/payment-adapters/node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/mini/schemas.js
var ZodMiniType = /* @__PURE__ */ $constructor("ZodMiniType", (inst, def) => {
  if (!inst._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
}, {
  // `with` is an alias for `check`: the same function object, not a wrapper.
  get with() {
    return this.check;
  },
  set with(value) {
    own(this, "with", value);
  },
  parse(data, params2) {
    return parse2(this, data, params2, { callee: this.parse });
  },
  parseAsync(data, params2) {
    return parseAsync(this, data, params2, { callee: this.parseAsync });
  },
  safeParse(data, params2) {
    return safeParse(this, data, params2);
  },
  safeParseAsync(data, params2) {
    return safeParseAsync(this, data, params2);
  },
  check(...checks) {
    const def = this.def;
    return this.clone({
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }, { parent: true });
  },
  clone(_def, params2) {
    return clone(this, _def, params2);
  },
  brand() {
    return this;
  },
  register(reg, meta2) {
    reg.add(this, meta2);
    return this;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  }
});
var ZodMiniString = /* @__PURE__ */ $constructor("ZodMiniString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function string2(params2) {
  return _string(ZodMiniString, params2);
}
var ZodMiniNumber = /* @__PURE__ */ $constructor("ZodMiniNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function number2(params2) {
  return _number(ZodMiniNumber, params2);
}
var ZodMiniBoolean = /* @__PURE__ */ $constructor("ZodMiniBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function boolean2(params2) {
  return _boolean(ZodMiniBoolean, params2);
}
var ZodMiniUnknown = /* @__PURE__ */ $constructor("ZodMiniUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function unknown() {
  return _unknown(ZodMiniUnknown);
}
var ZodMiniArray = /* @__PURE__ */ $constructor("ZodMiniArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function array(element, params2) {
  return new ZodMiniArray({
    type: "array",
    element,
    ...normalizeParams(params2)
  });
}
var ZodMiniObject = /* @__PURE__ */ $constructor("ZodMiniObject", (inst, def) => {
  $ZodObject.init(inst, def);
  ZodMiniType.init(inst, def);
  installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
});
// @__NO_SIDE_EFFECTS__
function object(shape2, params2) {
  const def = {
    type: "object",
    shape: shape2 ?? {},
    ...normalizeParams(params2)
  };
  return new ZodMiniObject(def);
}
// @__NO_SIDE_EFFECTS__
function looseObject(shape2, params2) {
  return new ZodMiniObject({
    type: "object",
    shape: shape2,
    catchall: /* @__PURE__ */ unknown(),
    ...normalizeParams(params2)
  });
}
var ZodMiniUnion = /* @__PURE__ */ $constructor("ZodMiniUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function union(options, params2) {
  return new ZodMiniUnion({
    type: "union",
    options,
    ...normalizeParams(params2)
  });
}
var ZodMiniDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodMiniDiscriminatedUnion", (inst, def) => {
  $ZodDiscriminatedUnion.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function discriminatedUnion(discriminator, options, params2) {
  return new ZodMiniDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params2)
  });
}
var ZodMiniRecord = /* @__PURE__ */ $constructor("ZodMiniRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function record(keyType, valueType, params2) {
  if (!valueType || !valueType._zod) {
    return new ZodMiniRecord({
      type: "record",
      keyType: /* @__PURE__ */ string2(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodMiniRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params2)
  });
}
var ZodMiniEnum = /* @__PURE__ */ $constructor("ZodMiniEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodMiniType.init(inst, def);
  inst.options = [...inst._zod.values];
});
// @__NO_SIDE_EFFECTS__
function _enum(values, params2) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodMiniEnum({
    type: "enum",
    entries,
    ...normalizeParams(params2)
  });
}
var ZodMiniLiteral = /* @__PURE__ */ $constructor("ZodMiniLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function literal(value, params2) {
  return new ZodMiniLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params2)
  });
}
var ZodMiniTransform = /* @__PURE__ */ $constructor("ZodMiniTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function transform(fn) {
  return new ZodMiniTransform({
    type: "transform",
    transform: fn
  });
}
var ZodMiniOptional = /* @__PURE__ */ $constructor("ZodMiniOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function optional(innerType) {
  return new ZodMiniOptional({
    type: "optional",
    innerType
  });
}
var ZodMiniPipe = /* @__PURE__ */ $constructor("ZodMiniPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function pipe(in_, out) {
  return new ZodMiniPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodMiniCustom = /* @__PURE__ */ $constructor("ZodMiniCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function custom(fn, _params) {
  return _custom(ZodMiniCustom, fn ?? (() => true), _params);
}
// @__NO_SIDE_EFFECTS__
function refine(fn, _params = {}) {
  return _refine(ZodMiniCustom, fn, _params);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/zod.js
function amount() {
  return string2().check(_regex(/^\d+(\.\d+)?$/, "Invalid amount"));
}
function datetime2() {
  return string2().check(_regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/, "Invalid ISO 8601 datetime"));
}
function toDatetimeString(value) {
  if (!(value instanceof Date))
    return value;
  if (!Number.isFinite(value.getTime()))
    return "Invalid Date";
  return value.toISOString();
}
function address() {
  return string2().check(_regex(/^0x[0-9a-fA-F]{40}$/, "Invalid address"));
}
function hash() {
  return string2().check(_regex(/^0x[0-9a-fA-F]{64}$/, "Invalid hash"));
}
function signature() {
  return string2().check(_regex(/^0x[0-9a-fA-F]+$/, "Invalid signature"));
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Challenge.js
var maxRequestParameterLength = 16 * 1024;
var Schema = object({
  /** Optional human-readable description of the payment. */
  description: optional(string2()),
  /** Optional digest of the request body (format: "sha-256=base64hash"). */
  digest: optional(string2().check(_regex(/^sha-256=/, "Invalid digest format"))),
  /** Optional expiration timestamp (ISO 8601). */
  expires: optional(datetime2()),
  /** Optional HTTP field name to carry the payment credential. When omitted, uses Authorization. */
  header: optional(string2().check(_regex(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/, "Invalid HTTP header name"))),
  /** Unique challenge identifier (HMAC-bound). */
  id: string2().check(_minLength(1)),
  /** Intent type (e.g., "charge", "session"). */
  intent: string2(),
  /** Payment method (e.g., "tempo", "stripe"). */
  method: string2(),
  /** Optional parsed server-defined correlation data. */
  meta: optional(record(string2(), string2())),
  /** Optional server-defined correlation data. Raw base64url string; clients MUST NOT modify. */
  opaque: optional(string2()),
  /** Server realm (e.g., hostname). */
  realm: string2(),
  /** Method-specific request data. */
  request: record(string2(), unknown())
});
function from5(parameters, options) {
  void options;
  const { description, digest, meta: meta2, method: methodName, header: suppliedHeader, intent, realm, request: request2, secretKey } = parameters;
  const header2 = isDefaultCredentialHeader(suppliedHeader) ? void 0 : suppliedHeader;
  const expires = parameters.expires ? toDatetimeString(parameters.expires) : void 0;
  const opaque = parameters.opaque ?? (meta2 !== void 0 ? serialize(meta2) : void 0);
  const id = secretKey ? computeId({ ...parameters, expires, ...meta2 !== void 0 && { meta: meta2 }, opaque }, { secretKey }) : parameters.id;
  return Schema.parse({
    id,
    realm,
    method: methodName,
    intent,
    request: request2,
    ...description && { description },
    ...digest && { digest },
    ...expires && { expires },
    ...header2 !== void 0 && { header: header2 },
    ...meta2 !== void 0 && { meta: meta2 },
    ...opaque !== void 0 && { opaque }
  });
}
function fromMethod2(method, parameters) {
  const { name: methodName, intent } = method;
  const { description, digest, expires, header: header2, id, meta: meta2, realm, secretKey } = parameters;
  const request2 = fromMethod(method, parameters.request);
  return from5({
    ...id !== void 0 ? { id } : { secretKey },
    realm,
    method: methodName,
    intent,
    request: request2,
    description,
    digest,
    expires,
    header: header2,
    meta: meta2
  });
}
function serialize2(challenge2) {
  const parts = [
    authParam("id", challenge2.id),
    authParam("realm", challenge2.realm),
    authParam("method", challenge2.method),
    authParam("intent", challenge2.intent),
    authParam("request", serialize(challenge2.request))
  ];
  if (challenge2.description !== void 0)
    parts.push(authParam("description", challenge2.description));
  if (challenge2.digest !== void 0)
    parts.push(authParam("digest", challenge2.digest));
  if (challenge2.expires !== void 0)
    parts.push(authParam("expires", challenge2.expires));
  const credentialHeader2 = challenge2.header;
  if (credentialHeader2 !== void 0 && !isDefaultCredentialHeader(credentialHeader2))
    parts.push(authParam("header", credentialHeader2));
  if (challenge2.opaque !== void 0)
    parts.push(authParam("opaque", challenge2.opaque));
  else if (challenge2.meta !== void 0)
    parts.push(authParam("opaque", serialize(challenge2.meta)));
  return `${Schemes.payment} ${parts.join(", ")}`;
}
function authParam(name, value) {
  if (/[\r\n]/.test(value))
    throw new Error("Invalid quoted-string value.");
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\u0100-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return `${name}="${escaped}"`;
}
function deserialize2(value, options) {
  const params2 = extractPaymentAuthParams(value);
  if (!params2)
    throw new Error("Missing Payment scheme.");
  const result = parseAuthParams(params2);
  const { request: request2, opaque, ...rest } = result;
  if (!request2)
    throw new Error("Missing request parameter.");
  if (request2.length > maxRequestParameterLength)
    throw new Error("Request parameter too large.");
  if (rest.method && !/^[a-z][a-z0-9:_-]*$/.test(rest.method))
    throw new Error(`Invalid method: "${rest.method}". Must be lowercase per spec.`);
  return from5({
    ...rest,
    request: deserialize(request2),
    ...opaque && { opaque }
  }, options);
}
function extractPaymentAuthParams(header2) {
  const token = Schemes.payment;
  const [start] = findSchemeStarts(header2, token);
  if (start === void 0)
    return null;
  let paramsStart = start + token.length;
  while (paramsStart < header2.length && /\s/.test(header2[paramsStart] ?? ""))
    paramsStart++;
  return header2.slice(paramsStart);
}
function parseAuthParams(input) {
  const result = /* @__PURE__ */ Object.create(null);
  let i = 0;
  while (i < input.length) {
    while (i < input.length && /[\s,]/.test(input[i] ?? ""))
      i++;
    if (i >= input.length)
      break;
    const keyStart = i;
    while (i < input.length && /[A-Za-z0-9_-]/.test(input[i] ?? ""))
      i++;
    const key = input.slice(keyStart, i).toLowerCase();
    if (!key)
      throw new Error("Malformed auth-param.");
    while (i < input.length && /\s/.test(input[i] ?? ""))
      i++;
    if (input[i] !== "=")
      break;
    i++;
    while (i < input.length && /\s/.test(input[i] ?? ""))
      i++;
    const [value, nextIndex] = readAuthParamValue(input, i);
    i = nextIndex;
    if (key in result)
      throw new Error(`Duplicate parameter: ${key}`);
    result[key] = value;
  }
  return result;
}
function readAuthParamValue(input, start) {
  if (input[start] === '"')
    return readQuotedAuthParamValue(input, start + 1);
  let i = start;
  while (i < input.length && input[i] !== ",")
    i++;
  return [input.slice(start, i).trim(), i];
}
function readQuotedAuthParamValue(input, start) {
  let i = start;
  let escaped = false;
  let segmentStart = start;
  let parts;
  while (i < input.length) {
    const char = input[i];
    i++;
    if (escaped) {
      parts ??= [];
      const hex = char === "u" ? input.slice(i, i + 4) : void 0;
      if (hex && /^[0-9A-Fa-f]{4}$/.test(hex)) {
        parts.push(String.fromCharCode(Number.parseInt(hex, 16)));
        i += 4;
      } else
        parts.push(char);
      segmentStart = i;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      parts ??= [];
      parts.push(input.slice(segmentStart, i - 1));
      segmentStart = i;
      escaped = true;
      continue;
    }
    if (char === '"') {
      const value = parts ? [...parts, input.slice(segmentStart, i - 1)].join("") : input.slice(start, i - 1);
      return [value, i];
    }
  }
  throw new Error("Unterminated quoted-string.");
}
function startsWithSchemeToken(value, index, token) {
  if (value.slice(index, index + token.length).toLowerCase() !== token.toLowerCase())
    return false;
  const next = value[index + token.length];
  return Boolean(next && /\s/.test(next));
}
function hasPaymentScheme(value) {
  return findSchemeStarts(value, Schemes.payment).length > 0 || value.split(",").some((part) => part.trim().toLowerCase() === Schemes.payment.toLowerCase());
}
function findSchemeStarts(value, token) {
  const starts = [];
  let inQuotes = false;
  let escaped = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (inQuotes) {
      if (escaped)
        escaped = false;
      else if (char === "\\")
        escaped = true;
      else if (char === '"')
        inQuotes = false;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (!startsWithSchemeToken(value, i, token))
      continue;
    let boundary = i - 1;
    while (boundary >= 0 && /\s/.test(value[boundary] ?? ""))
      boundary--;
    if (boundary >= 0 && value[boundary] !== ",")
      continue;
    starts.push(i);
  }
  return starts;
}
function fromResponseList(response2, options) {
  if (response2.status !== 402)
    throw new Error("Response status is not 402.");
  return fromHeadersList(response2.headers, options);
}
function fromHeadersList(headers, options) {
  const header2 = headers.get(Headers2.wwwAuthenticate);
  if (!header2)
    throw new Error(`Missing ${Headers2.wwwAuthenticate} header.`);
  return deserializeList(header2, options);
}
function deserializeList(value, options) {
  const starts = findSchemeStarts(value, Schemes.payment);
  if (starts.length === 0)
    throw new Error("No Payment schemes found.");
  return starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] : value.length;
    const chunk = value.slice(start, end).replace(/,\s*$/, "");
    return deserialize2(chunk, options);
  });
}
function verify2(challenge2, options) {
  const expectedId = computeId(challenge2, options);
  return constantTimeEqual(challenge2.id, expectedId);
}
function idBindingInput(challenge2) {
  const values = [
    challenge2.realm,
    challenge2.method,
    challenge2.intent,
    serialize(challenge2.request),
    challenge2.expires ?? "",
    challenge2.digest ?? ""
  ];
  const credentialHeader2 = challenge2.header;
  if (credentialHeader2 !== void 0 && !isDefaultCredentialHeader(credentialHeader2))
    values.push(credentialHeader2);
  values.push(challenge2.opaque ?? (challenge2.meta ? serialize(challenge2.meta) : ""));
  return values.join("|");
}
function credentialHeader(challenge2) {
  return challenge2.header ?? Headers2.authorization;
}
function isDefaultCredentialHeader(header2) {
  return header2?.toLowerCase() === Headers2.authorization.toLowerCase();
}
function computeId(challenge2, options) {
  const input = idBindingInput(challenge2);
  const key = Bytes_exports.fromString(options.secretKey);
  const data = Bytes_exports.fromString(input);
  const mac2 = Hash_exports.hmac256(key, data, { as: "Bytes" });
  return Base64_exports.fromBytes(mac2, { url: true, pad: false });
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Credential.js
var maxAuthorizationLength = 64 * 1024;
var MissingAuthorizationHeaderError = class extends Error {
  name = "MissingAuthorizationHeaderError";
  constructor(header2 = Headers2.authorization) {
    super(`Missing ${header2} header.`);
  }
};
var MissingPaymentSchemeError = class extends Error {
  name = "MissingPaymentSchemeError";
  constructor() {
    super("Missing Payment scheme.");
  }
};
var InvalidCredentialEncodingError = class extends Error {
  name = "InvalidCredentialEncodingError";
  constructor() {
    super("Invalid base64url or JSON.");
  }
};
function deserialize3(value) {
  if (value.length > maxAuthorizationLength)
    throw new InvalidCredentialEncodingError();
  const prefixMatch = value.match(new RegExp(`^${Schemes.payment}\\s+(.+)$`, "i"));
  if (!prefixMatch?.[1])
    throw new MissingPaymentSchemeError();
  try {
    const json = Base64_exports.toString(prefixMatch[1]);
    const parsed = JSON.parse(json);
    const { opaque: challengeOpaque, request: request2, meta: _meta, ...challengeFields } = parsed.challenge;
    const { meta: meta2, opaque } = normalizeCredentialOpaque(challengeOpaque);
    const challenge2 = Schema.parse({
      ...challengeFields,
      ...meta2 !== void 0 && { meta: meta2 },
      ...opaque !== void 0 && { opaque },
      request: deserialize(request2)
    });
    return {
      challenge: challenge2,
      payload: parsed.payload,
      ...parsed.source && { source: parsed.source }
    };
  } catch {
    throw new InvalidCredentialEncodingError();
  }
}
function normalizeCredentialOpaque(value) {
  if (value === void 0)
    return {};
  if (typeof value === "string")
    return { opaque: value };
  if (!isStringRecord(value))
    throw new Error("Invalid opaque.");
  return {
    meta: value,
    opaque: serialize(value)
  };
}
function isStringRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  return Object.values(value).every((entry) => typeof entry === "string");
}
function from6(parameters) {
  const { challenge: challenge2, payload, source } = parameters;
  return {
    challenge: challenge2,
    payload,
    ...source && { source }
  };
}
function serialize3(credential) {
  const { meta: meta2, opaque, request: request2, ...challenge2 } = credential.challenge;
  const wireOpaque = opaque ?? (meta2 !== void 0 ? serialize(meta2) : void 0);
  const wire = {
    challenge: {
      ...challenge2,
      ...wireOpaque !== void 0 && { opaque: wireOpaque },
      request: serialize(request2)
    },
    payload: credential.payload,
    ...credential.source && { source: credential.source }
  };
  const json = JSON.stringify(wire);
  const encoded = Base64_exports.fromString(json, { pad: false, url: true });
  return `${Schemes.payment} ${encoded}`;
}
function extractPaymentScheme(header2) {
  if (header2.length > maxAuthorizationLength)
    return null;
  const schemes2 = header2.split(",").map((s) => s.trim());
  return schemes2.find((s) => new RegExp(`^${Schemes.payment}\\s+`, "i").test(s)) ?? null;
}

// packages/payment-adapters/node_modules/.pnpm/structured-headers@2.1.0/node_modules/structured-headers/dist/util.js
var asciiRe = /^[\x20-\x7E]*$/;
var tokenRe = /^[a-zA-Z*][:/!#$%&'*+\-.^_`|~A-Za-z0-9]*$/;
var keyRe = /^[a-z*][*\-_.a-z0-9]*$/;
function isAscii(str) {
  return asciiRe.test(str);
}
function isValidTokenStr(str) {
  return tokenRe.test(str);
}
function isValidKeyStr(str) {
  return keyRe.test(str);
}
function isInnerList(input) {
  return Array.isArray(input[0]);
}
function arrayBufferToBase64(input) {
  const bytes = ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
function base64ToArrayBuffer(b64) {
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// packages/payment-adapters/node_modules/.pnpm/structured-headers@2.1.0/node_modules/structured-headers/dist/token.js
var Token = class {
  constructor(value) {
    if (!isValidTokenStr(value)) {
      throw new TypeError("Invalid character in Token string. Tokens must start with *, A-Z and the rest of the string may only contain a-z, A-Z, 0-9, :/!#$%&'*+-.^_`|~");
    }
    this.value = value;
  }
  toString() {
    return this.value;
  }
};

// packages/payment-adapters/node_modules/.pnpm/structured-headers@2.1.0/node_modules/structured-headers/dist/displaystring.js
var DisplayString = class {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
};

// packages/payment-adapters/node_modules/.pnpm/structured-headers@2.1.0/node_modules/structured-headers/dist/serializer.js
var SerializeError = class extends Error {
};
function serializeList(input) {
  return input.map((value) => {
    if (isInnerList(value)) {
      return serializeInnerList(value);
    } else {
      return serializeItem(value);
    }
  }).join(", ");
}
function serializeItem(input, params2) {
  if (Array.isArray(input)) {
    return serializeBareItem(input[0]) + serializeParameters(input[1]);
  } else {
    return serializeBareItem(input) + (params2 ? serializeParameters(params2) : "");
  }
}
function serializeInnerList(input) {
  return `(${input[0].map((value) => serializeItem(value)).join(" ")})${serializeParameters(input[1])}`;
}
function serializeBareItem(input) {
  if (typeof input === "number") {
    if (Number.isInteger(input)) {
      return serializeInteger(input);
    }
    return serializeDecimal(input);
  }
  if (typeof input === "string") {
    return serializeString(input);
  }
  if (input instanceof Token) {
    return serializeToken(input);
  }
  if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
    return serializeByteSequence(input);
  }
  if (input instanceof DisplayString) {
    return serializeDisplayString(input);
  }
  if (input instanceof Date) {
    return serializeDate(input);
  }
  if (typeof input === "boolean") {
    return serializeBoolean(input);
  }
  throw new SerializeError(`Cannot serialize values of type ${typeof input}`);
}
function serializeInteger(input) {
  if (input < -999999999999999 || input > 999999999999999) {
    throw new SerializeError("Structured headers can only encode integers in the range range of -999,999,999,999,999 to 999,999,999,999,999 inclusive");
  }
  return input.toString();
}
function serializeDecimal(input) {
  const out = input.toFixed(3).replace(/0+$/, "");
  const signifantDigits = out.split(".")[0].replace("-", "").length;
  if (signifantDigits > 12) {
    throw new SerializeError("Fractional numbers are not allowed to have more than 12 significant digits before the decimal point");
  }
  return out;
}
function serializeString(input) {
  if (!isAscii(input)) {
    throw new SerializeError("Only ASCII strings may be serialized");
  }
  return `"${input.replace(/("|\\)/g, (v) => "\\" + v)}"`;
}
function serializeDisplayString(input) {
  let out = '%"';
  const textEncoder = new TextEncoder();
  for (const char of textEncoder.encode(input.toString())) {
    if (char === 37 || char === 34 || char <= 31 || char >= 127) {
      out += "%" + char.toString(16);
    } else {
      out += String.fromCharCode(char);
    }
  }
  return out + '"';
}
function serializeBoolean(input) {
  return input ? "?1" : "?0";
}
function serializeByteSequence(input) {
  return `:${arrayBufferToBase64(input)}:`;
}
function serializeToken(input) {
  return input.toString();
}
function serializeDate(input) {
  return "@" + Math.floor(input.getTime() / 1e3);
}
function serializeParameters(input) {
  return Array.from(input).map(([key, value]) => {
    let out = ";" + serializeKey(key);
    if (value !== true) {
      out += "=" + serializeBareItem(value);
    }
    return out;
  }).join("");
}
function serializeKey(input) {
  if (!isValidKeyStr(input)) {
    throw new SerializeError("Keys in dictionaries must only contain lowercase letter, numbers, _-*. and must start with a letter or *");
  }
  return input;
}

// packages/payment-adapters/node_modules/.pnpm/structured-headers@2.1.0/node_modules/structured-headers/dist/parser.js
function parseList(input) {
  const parser = new Parser(input);
  return parser.parseList();
}
var ParseError = class extends Error {
  constructor(position, message) {
    super(`Parse error: ${message} at offset ${position}`);
  }
};
var Parser = class {
  constructor(input) {
    this.input = input;
    this.pos = 0;
  }
  parseDictionary() {
    this.skipWS();
    const dictionary = /* @__PURE__ */ new Map();
    while (!this.eof()) {
      const thisKey = this.parseKey();
      let member;
      if (this.lookChar() === "=") {
        this.pos++;
        member = this.parseItemOrInnerList();
      } else {
        member = [true, this.parseParameters()];
      }
      dictionary.set(thisKey, member);
      this.skipOWS();
      if (this.eof()) {
        return dictionary;
      }
      this.expectChar(",");
      this.pos++;
      this.skipOWS();
      if (this.eof()) {
        throw new ParseError(this.pos, "Dictionary contained a trailing comma");
      }
    }
    return dictionary;
  }
  parseList() {
    this.skipWS();
    const members2 = [];
    while (!this.eof()) {
      members2.push(this.parseItemOrInnerList());
      this.skipOWS();
      if (this.eof()) {
        return members2;
      }
      this.expectChar(",");
      this.pos++;
      this.skipOWS();
      if (this.eof()) {
        throw new ParseError(this.pos, "A list may not end with a trailing comma");
      }
    }
    return members2;
  }
  parseItem(standaloneItem = true) {
    if (standaloneItem)
      this.skipWS();
    const result = [
      this.parseBareItem(),
      this.parseParameters()
    ];
    if (standaloneItem)
      this.checkTrail();
    return result;
  }
  parseItemOrInnerList() {
    if (this.lookChar() === "(") {
      return this.parseInnerList();
    } else {
      return this.parseItem(false);
    }
  }
  parseInnerList() {
    this.expectChar("(");
    this.pos++;
    const innerList = [];
    while (!this.eof()) {
      this.skipWS();
      if (this.lookChar() === ")") {
        this.pos++;
        return [
          innerList,
          this.parseParameters()
        ];
      }
      innerList.push(this.parseItem(false));
      const nextChar = this.lookChar();
      if (nextChar !== " " && nextChar !== ")") {
        throw new ParseError(this.pos, "Expected a whitespace or ) after every item in an inner list");
      }
    }
    throw new ParseError(this.pos, "Could not find end of inner list");
  }
  parseBareItem() {
    const char = this.lookChar();
    if (char === void 0) {
      throw new ParseError(this.pos, "Unexpected end of string");
    }
    if (char.match(/^[-0-9]/)) {
      return this.parseIntegerOrDecimal();
    }
    if (char === '"') {
      return this.parseString();
    }
    if (char.match(/^[A-Za-z*]/)) {
      return this.parseToken();
    }
    if (char === ":") {
      return this.parseByteSequence();
    }
    if (char === "?") {
      return this.parseBoolean();
    }
    if (char === "@") {
      return this.parseDate();
    }
    if (char === "%") {
      return this.parseDisplayString();
    }
    throw new ParseError(this.pos, "Unexpected input");
  }
  parseParameters() {
    const parameters = /* @__PURE__ */ new Map();
    while (!this.eof()) {
      const char = this.lookChar();
      if (char !== ";") {
        break;
      }
      this.pos++;
      this.skipWS();
      const key = this.parseKey();
      let value = true;
      if (this.lookChar() === "=") {
        this.pos++;
        value = this.parseBareItem();
      }
      parameters.set(key, value);
    }
    return parameters;
  }
  parseIntegerOrDecimal() {
    let type = "integer";
    let sign2 = 1;
    let inputNumber = "";
    if (this.lookChar() === "-") {
      sign2 = -1;
      this.pos++;
    }
    if (!isDigit(this.lookChar())) {
      throw new ParseError(this.pos, "Expected a digit (0-9)");
    }
    while (!this.eof()) {
      const char = this.getChar();
      if (isDigit(char)) {
        inputNumber += char;
      } else if (type === "integer" && char === ".") {
        if (inputNumber.length > 12) {
          throw new ParseError(this.pos, "Exceeded maximum decimal length");
        }
        inputNumber += ".";
        type = "decimal";
      } else {
        this.pos--;
        break;
      }
      if (type === "integer" && inputNumber.length > 15) {
        throw new ParseError(this.pos, "Exceeded maximum integer length");
      }
      if (type === "decimal" && inputNumber.length > 16) {
        throw new ParseError(this.pos, "Exceeded maximum decimal length");
      }
    }
    if (type === "integer") {
      return parseInt(inputNumber, 10) * sign2;
    } else {
      if (inputNumber.endsWith(".")) {
        throw new ParseError(this.pos, "Decimal cannot end on a period");
      }
      if (inputNumber.split(".")[1].length > 3) {
        throw new ParseError(this.pos, "Number of digits after the decimal point cannot exceed 3");
      }
      return parseFloat(inputNumber) * sign2;
    }
  }
  parseString() {
    let outputString = "";
    this.expectChar('"');
    this.pos++;
    while (!this.eof()) {
      const char = this.getChar();
      if (char === "\\") {
        if (this.eof()) {
          throw new ParseError(this.pos, "Unexpected end of input");
        }
        const nextChar = this.getChar();
        if (nextChar !== "\\" && nextChar !== '"') {
          throw new ParseError(this.pos, "A backslash must be followed by another backslash or double quote");
        }
        outputString += nextChar;
      } else if (char === '"') {
        return outputString;
      } else if (!isAscii(char)) {
        throw new ParseError(this.pos, "Strings must be in the ASCII range");
      } else {
        outputString += char;
      }
    }
    throw new ParseError(this.pos, "Unexpected end of input");
  }
  parseDisplayString() {
    const chars = this.getChars(2);
    if (chars !== '%"') {
      throw new ParseError(this.pos, "Unexpected character. Display strings should start with %=");
    }
    const result = [];
    while (!this.eof()) {
      const char = this.getChar();
      if (char.charCodeAt(0) <= 31 || char.charCodeAt(0) >= 127 && char.charCodeAt(0) <= 255) {
        throw new ParseError(this.pos, "Invalid char found in DisplayString. Did you forget to escape?");
      }
      if (char === "%") {
        const hexChars = this.getChars(2);
        if (/^[0-9a-f]{2}$/.test(hexChars)) {
          result.push(parseInt(hexChars, 16));
        } else {
          throw new ParseError(this.pos, `Unexpected sequence after % in DispalyString: "${hexChars}". Note that hexidecimals must be lowercase`);
        }
        continue;
      }
      if (char === '"') {
        const textDecoder = new TextDecoder("utf-8", {
          fatal: true
        });
        try {
          return new DisplayString(textDecoder.decode(new Uint8Array(result)));
        } catch {
          throw new ParseError(this.pos, "Fatal error decoding UTF-8 sequence in Display String");
        }
      }
      result.push(char.charCodeAt(0));
    }
    throw new ParseError(this.pos, "Unexpected end of input");
  }
  parseToken() {
    let outputString = "";
    while (!this.eof()) {
      const char = this.lookChar();
      if (char === void 0 || !/^[:/!#$%&'*+\-.^_`|~A-Za-z0-9]$/.test(char)) {
        return new Token(outputString);
      }
      outputString += this.getChar();
    }
    return new Token(outputString);
  }
  parseByteSequence() {
    this.expectChar(":");
    this.pos++;
    const endPos = this.input.indexOf(":", this.pos);
    if (endPos === -1) {
      throw new ParseError(this.pos, 'Could not find a closing ":" character to mark end of Byte Sequence');
    }
    const b64Content = this.input.substring(this.pos, endPos);
    this.pos += b64Content.length + 1;
    if (!/^[A-Za-z0-9+/=]*$/.test(b64Content)) {
      throw new ParseError(this.pos, "ByteSequence does not contain a valid base64 string");
    }
    try {
      return base64ToArrayBuffer(b64Content);
    } catch {
      throw new ParseError(this.pos, "ByteSequence does not contain a valid base64 string");
    }
  }
  parseBoolean() {
    this.expectChar("?");
    this.pos++;
    const char = this.getChar();
    if (char === "1") {
      return true;
    }
    if (char === "0") {
      return false;
    }
    throw new ParseError(this.pos, 'Unexpected character. Expected a "1" or a "0"');
  }
  parseDate() {
    this.expectChar("@");
    this.pos++;
    let sign2 = 1;
    let inputNumber = "";
    if (this.lookChar() === "-") {
      sign2 = -1;
      this.pos++;
    }
    if (!isDigit(this.lookChar())) {
      throw new ParseError(this.pos, "Expected a digit (0-9)");
    }
    while (!this.eof()) {
      const char = this.getChar();
      if (isDigit(char)) {
        inputNumber += char;
      } else {
        throw new ParseError(this.pos, "Expected a digit (0-9), whitespace or EOL");
      }
    }
    if (inputNumber.length > 15) {
      throw new ParseError(this.pos, "Exceeded max length for a date value");
    }
    return new Date(parseInt(inputNumber, 10) * sign2 * 1e3);
  }
  parseKey() {
    if (!this.lookChar()?.match(/^[a-z*]/)) {
      throw new ParseError(this.pos, "A key must begin with an asterisk or letter (a-z)");
    }
    let outputString = "";
    while (!this.eof()) {
      const char = this.lookChar();
      if (char === void 0 || !/^[a-z0-9_\-.*]$/.test(char)) {
        return outputString;
      }
      outputString += this.getChar();
    }
    return outputString;
  }
  /**
   * Looks at the next character without advancing the cursor.
   *
   * Returns undefined if we were at the end of the string.
   */
  lookChar() {
    return this.input[this.pos];
  }
  /**
   * Checks if the next character is 'char', and fail otherwise.
   */
  expectChar(char) {
    if (this.lookChar() !== char) {
      throw new ParseError(this.pos, `Expected ${char}`);
    }
  }
  getChar() {
    return this.input[this.pos++];
  }
  getChars(count) {
    const result = this.input.substr(this.pos, count);
    this.pos += count;
    return result;
  }
  eof() {
    return this.pos >= this.input.length;
  }
  // Advances the pointer to skip all whitespace.
  skipOWS() {
    while (true) {
      const c = this.input.substr(this.pos, 1);
      if (c === " " || c === "	") {
        this.pos++;
      } else {
        break;
      }
    }
  }
  // Advances the pointer to skip all spaces
  skipWS() {
    while (this.lookChar() === " ") {
      this.pos++;
    }
  }
  // At the end of parsing, we need to make sure there are no bytes after the
  // header except whitespace.
  checkTrail() {
    this.skipWS();
    if (!this.eof()) {
      throw new ParseError(this.pos, "Unexpected characters at end of input");
    }
  }
};
var isDigitRegex = /^[0-9]$/;
function isDigit(char) {
  if (char === void 0)
    return false;
  return isDigitRegex.test(char);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/identity/internal/Requirements.js
var header = "Identity-Required";
function serialize4(requirements) {
  return serializeList(requirements.map(({ issuer, type }) => [new Token(type), new Map(issuer === void 0 ? [] : [["issuer", issuer]])]));
}
function parse3(value) {
  if (!value)
    return [];
  let list;
  try {
    list = parseList(value);
  } catch {
    return [];
  }
  const requirements = [];
  for (const member of list) {
    if (isInnerList(member) || !(member[0] instanceof Token))
      continue;
    const issuer = member[1].get("issuer");
    requirements.push(Object.freeze({
      type: member[0].toString(),
      ...typeof issuer === "string" && { issuer }
    }));
  }
  return Object.freeze(requirements);
}
var alternativeHeaders = Object.freeze([
  "identity-attestation-required"
]);
function alternatives(values) {
  const items = [];
  for (const value of values) {
    let list;
    try {
      list = parseList(value);
    } catch {
      return values.join(", ");
    }
    const [member] = list;
    if (list.length !== 1 || !member)
      return values.join(", ");
    items.push(...isInnerList(member) ? member[0] : [member]);
  }
  const unique = [...new Map(items.map((item) => [serializeItem(item), item])).values()];
  return serializeList(unique.length === 1 ? unique : [[unique, /* @__PURE__ */ new Map()]]);
}
function merge2(lists) {
  const seen = /* @__PURE__ */ new Map();
  for (const requirement of lists.flat()) {
    const key = JSON.stringify([requirement.type, requirement.issuer ?? null]);
    if (!seen.has(key))
      seen.set(key, requirement);
  }
  return Object.freeze([...seen.values()]);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/identity/internal/SigningContext.js
function create() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return {
    created: Math.floor(Date.now() / 1e3),
    nonce: Base64_exports.fromBytes(bytes, { pad: false, url: true })
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/identity/Client.js
var skipPayment = /* @__PURE__ */ Symbol.for("mppx.fetch.skipPayment");
var x402CredentialHeaders = ["payment-signature", "x-payment"];
var credentialHeaders = /* @__PURE__ */ new Set([
  "authorization",
  "payment-authorization",
  ...x402CredentialHeaders
]);
var initial = Object.freeze({ phase: "unproved" });
function transition(attempt, event) {
  switch (event.type) {
    case "send":
      if (attempt.phase !== "unproved")
        break;
      return Object.freeze({ phase: event.payment === "paid" ? "paid" : "sent" });
    case "response":
      if (event.resend === void 0) {
        if (attempt.phase === "unproved" || attempt.phase === "done")
          break;
        return Object.freeze({ phase: "done" });
      }
      if (attempt.phase !== "sent")
        break;
      return Object.freeze({ phase: "resent", headers: event.resend });
  }
  const resend = event.type === "response" && event.resend !== void 0 ? " with resend" : "";
  throw new TypeError(`Illegal identity attempt transition "${event.type}${resend}" from phase "${attempt.phase}".`);
}
function from7(provers) {
  if (provers.length === 0)
    throw new TypeError("Mppx client identity must configure at least one prover.");
  for (const prover of provers)
    if (prover.scope !== "*" && !Array.isArray(prover.scope))
      throw new TypeError('Identity prover scope must be "*" or an array of origins.');
  const headers = Object.freeze([
    ...new Set(provers.flatMap((prover) => {
      if (prover.headers !== void 0 && !Array.isArray(prover.headers))
        throw new TypeError("Identity prover headers must be an array of header names.");
      return (prover.headers ?? []).map((name) => name.toLowerCase());
    }))
  ]);
  const inScope = (url) => {
    const origin = new URL(url).origin;
    return provers.filter((prover) => prover.scope === "*" || prover.scope.includes(origin));
  };
  async function sendOnce(parameters) {
    const { context, fetch, headers: headers2, keepReadable, request: request2 } = parameters;
    const source = keepReadable ? request2.clone() : request2;
    const scoped = inScope(request2.url);
    if (scoped.length === 0)
      return { request: source, response: await fetch(source) };
    const attempt = Object.freeze({
      ...create(),
      ...context.challenge && { challenge: context.challenge }
    });
    const merged = new Headers(source.headers);
    const protectedHeaders = new Set(credentialHeaders);
    if (context.challenge)
      protectedHeaders.add(credentialHeader(context.challenge).toLowerCase());
    for (const [name, value] of source.headers)
      if (extractPaymentScheme(value) !== null)
        protectedHeaders.add(name.toLowerCase());
    for (const [name, value] of headers2)
      if (!protectedHeaders.has(name.toLowerCase()))
        merged.set(name, value);
    let sent = new Request(source, {
      headers: merged,
      redirect: request2.redirect === "follow" ? "error" : request2.redirect
    });
    for (const prover of scoped)
      sent = await prover.prove(sent, attempt);
    return { request: sent, response: await fetch(sent) };
  }
  return {
    headers,
    async send(fetch, request2, context = {}) {
      let attempt = transition(initial, {
        type: "send",
        payment: isPaid(request2, context) ? "paid" : "unpaid"
      });
      const retriers = inScope(request2.url).filter((prover) => prover.retry);
      const keepReadable = attempt.phase === "sent" && retriers.length > 0;
      const carried = context.headers ?? [];
      const result = await sendOnce({ context, fetch, headers: carried, keepReadable, request: request2 });
      const { response: response2 } = result;
      const resend = keepReadable && response2.status >= 400 && response2.status !== 402 ? await resendHeaders(retriers, response2, result.request) : void 0;
      attempt = transition(attempt, { type: "response", resend });
      if (attempt.phase !== "resent")
        return { ...result, headers: carried };
      release([response2]);
      const headers2 = mergeHeaders(carried, attempt.headers);
      const resent = await sendOnce({ context, fetch, headers: headers2, keepReadable: false, request: request2 });
      transition(attempt, { type: "response", resend: void 0 });
      return { ...resent, headers: headers2 };
    },
    async challenge(response2, { challenge: challenge2 }, url) {
      const context = Object.freeze({
        challenge: challenge2,
        requirements: parse3(response2.headers.get(header))
      });
      for (const prover of inScope(url)) {
        if (!prover.prepare)
          continue;
        const copy = response2.clone();
        try {
          await prover.prepare(copy, context);
        } finally {
          release([copy]);
        }
      }
    }
  };
}
function isPaid(request2, context) {
  return context.challenge !== void 0 || x402CredentialHeaders.some((name) => request2.headers.has(name)) || [...request2.headers.values()].some((value) => extractPaymentScheme(value) !== null);
}
async function resendHeaders(provers, response2, request2) {
  const context = Object.freeze({ request: request2 });
  const copies = [];
  let resend = false;
  const headers = new Headers();
  try {
    for (const prover of provers) {
      const copy = response2.clone();
      copies.push(copy);
      const decision = await prover.retry(copy, context);
      if (decision === true)
        resend = true;
      else if (typeof decision === "object" && decision !== null) {
        resend = true;
        for (const [name, value] of new Headers(decision))
          if (!credentialHeaders.has(name))
            headers.append(name, value);
      }
    }
  } finally {
    release(copies);
  }
  if (!resend)
    return void 0;
  return Object.freeze([...headers].map(([name, value]) => Object.freeze([name, value])));
}
function release(responses) {
  for (const unread of responses)
    if (!unread.bodyUsed)
      void unread.body?.cancel().catch(() => {
      });
}
function wrapFetch(fetch, client, context = {}) {
  return async (input, init) => {
    const request2 = new Request(input, init);
    const challenge2 = credentialChallenge(request2.headers) ?? context.challenge;
    const { response: response2 } = await client.send((input2, options) => fetch(input2, {
      ...options,
      ...init?.[skipPayment] ? { [skipPayment]: true } : {}
    }), request2, { ...context, challenge: challenge2 });
    if (response2.status === 402 && challenge2) {
      for (const next of challengesOf(response2))
        if (next.method === challenge2.method && next.intent === challenge2.intent)
          await client.challenge(response2, { challenge: next }, request2.url);
    }
    return response2;
  };
}
function credentialChallenge(headers) {
  for (const [, value] of headers) {
    const payment = extractPaymentScheme(value);
    if (!payment)
      continue;
    try {
      return deserialize3(payment).challenge;
    } catch {
    }
  }
  return void 0;
}
function challengesOf(response2) {
  try {
    return fromResponseList(response2);
  } catch {
    return [];
  }
}
function mergeHeaders(previous, next) {
  const merged = new Headers();
  for (const [name, value] of previous)
    merged.set(name, value);
  for (const [name, value] of next)
    merged.set(name, value);
  return Object.freeze([...merged].map((entry) => Object.freeze(entry)));
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/internal/ChallengeBrand.js
var x402Challenge = /* @__PURE__ */ Symbol.for("mppx.x402.challenge");
function mark(challenge2) {
  Object.defineProperty(challenge2, x402Challenge, {
    value: true
  });
  return challenge2;
}
function is(challenge2) {
  return Boolean(challenge2?.[x402Challenge]);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/internal/AcceptPayment.js
var deferredContext = /* @__PURE__ */ Symbol("mppx.deferredContext");
function buildKeys(methods) {
  const keys = {};
  for (const method of methods) {
    const group = keys[method.name] ??= {};
    group[method.intent] = keyOf(method);
  }
  return keys;
}
function resolve(methods, config2) {
  const keys = buildKeys(methods);
  const definition = resolveDefinition(methods, keys, config2);
  const entries = methods.map((method, index) => ({
    intent: method.intent,
    method: method.name,
    q: definition[keyOf(method)] ?? 1,
    index
  }));
  return {
    definition,
    entries,
    header: serialize5(entries),
    keys
  };
}
function parse4(header2) {
  const parts = header2.split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0)
    throw new Error("Accept-Payment header is empty.");
  return parts.map((part, index) => parseEntry(part, index));
}
function serialize5(entries) {
  return entries.map(({ method, intent, q }) => {
    const value = `${method}/${intent}`;
    return q === 1 ? value : `${value};q=${formatQ(q)}`;
  }).join(", ");
}
function rank(offers, preferences) {
  return offers.map((offer, index) => {
    const match = bestMatch(offer, preferences);
    return match && match.q > 0 ? { match, offer, index } : void 0;
  }).filter((candidate) => Boolean(candidate)).sort((left, right) => right.match.q - left.match.q || left.index - right.index).map(({ offer }) => offer);
}
function selectChallengeCandidates(challenges, methods, preferences, context) {
  const methodsByKey = /* @__PURE__ */ new Map();
  for (const method of methods) {
    const key = keyOf(method);
    const matchingMethods = methodsByKey.get(key);
    if (matchingMethods)
      matchingMethods.push(method);
    else
      methodsByKey.set(key, [method]);
  }
  return challenges.flatMap((challenge2, index) => {
    const matchingMethods = methodsByKey.get(keyOf(challenge2));
    if (!matchingMethods)
      return [];
    const match = bestMatch(challenge2, preferences);
    if (!match || match.q <= 0)
      return [];
    return matchingMethods.filter((method) => method.canHandleChallenge?.(context === void 0 ? { challenge: challenge2 } : { challenge: challenge2, context }) ?? true).map((method) => ({
      challenge: challenge2,
      index,
      match,
      method
    }));
  }).sort((left, right) => protocolRank(left.challenge) - protocolRank(right.challenge) || right.match.q - left.match.q || left.index - right.index).map((candidate) => {
    const { match: _match, ...rest } = candidate;
    return rest;
  });
}
function keyOf(value) {
  const method = value.method ?? value.name;
  if (!method)
    throw new Error("Missing payment method name.");
  return `${method}/${value.intent}`;
}
function bestMatch(offer, preferences) {
  let best;
  for (const preference of preferences) {
    if (!matches(offer, preference))
      continue;
    const candidate = { ...preference, specificity: specificity(preference) };
    if (!best || candidate.specificity > best.specificity || candidate.specificity === best.specificity && candidate.q > best.q || candidate.specificity === best.specificity && candidate.q === best.q && candidate.index < best.index) {
      best = candidate;
    }
  }
  return best;
}
function matches(offer, preference) {
  return (preference.method === "*" || preference.method === offer.method) && (preference.intent === "*" || preference.intent === offer.intent);
}
function specificity(preference) {
  return Number(preference.method !== "*") + Number(preference.intent !== "*");
}
function protocolRank(challenge2) {
  return is(challenge2) ? 1 : 0;
}
function parseEntry(part, index) {
  const match = /^(?<method>[^/;\s]+|\*)\s*\/\s*(?<intent>[^/;\s]+|\*)(?<params>(?:\s*;\s*.+)?)$/u.exec(part);
  const method = match?.groups?.method;
  const intent = match?.groups?.intent;
  if (!method || !intent) {
    throw new Error(`Invalid Accept-Payment entry: ${part}`);
  }
  assertToken(method, "method");
  assertToken(intent, "intent");
  let q = 1;
  for (const param of splitParameters(match.groups?.params)) {
    if (!param)
      continue;
    const parameterMatch = /^(?<name>[A-Za-z0-9_-]+)\s*=\s*(?<value>\S+)$/u.exec(param);
    const name = parameterMatch?.groups?.name;
    const rawValue = parameterMatch?.groups?.value;
    if (!name || !rawValue) {
      throw new Error(`Invalid Accept-Payment parameter: ${param}`);
    }
    if (name !== "q")
      continue;
    q = parseHeaderQ(rawValue, `Accept-Payment entry "${part}"`);
  }
  return { intent, method, q, index };
}
function splitParameters(value) {
  return value ? value.split(/\s*;\s*/).filter(Boolean) : [];
}
function resolveDefinition(methods, keys, config2) {
  if (!config2)
    return {};
  const raw = typeof config2 === "function" ? config2(keys) : config2;
  const allowed = new Set(methods.map((method) => keyOf(method)));
  const normalized = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown payment preference "${key}". Available: ${[...allowed].join(", ")}`);
    }
    normalized[key] = parseQ(value, `payment preference "${key}"`);
  }
  return normalized;
}
function parseQ(value, context) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`Invalid q-value for ${context}. Expected a finite number.`);
  }
  return assertQ(value, context);
}
function parseHeaderQ(value, context) {
  if (!/^0(?:\.\d{0,3})?$|^1(?:\.0{0,3})?$/.test(value)) {
    throw new Error(`Invalid q-value for ${context}. Expected an HTTP qvalue.`);
  }
  return assertQ(Number(value), context);
}
function assertQ(value, context) {
  if (value < 0 || value > 1) {
    throw new Error(`Invalid q-value for ${context}. Expected a value between 0 and 1.`);
  }
  const rounded = Math.round(value * 1e3);
  if (Math.abs(value * 1e3 - rounded) > 1e-9) {
    throw new Error(`Invalid q-value for ${context}. Expected at most 3 decimal places.`);
  }
  return rounded / 1e3;
}
function formatQ(value) {
  return value.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
function assertToken(value, label) {
  if (value !== "*" && !/^[a-z0-9-]+$/.test(value)) {
    throw new Error(`Invalid Accept-Payment ${label}: ${value}`);
  }
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Mcp.js
var paymentRequiredCode = -32042;
var paymentVerificationFailedCode = -32043;
var credentialMetaKey = "org.paymentauth/credential";
var paymentRequiredMetaKey = "org.paymentauth/payment-required";

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/internal/sse.js
function createParser(onEvent) {
  let buffer = "";
  let started = false;
  let skipLineFeed = false;
  let data;
  let event = "";
  function parseLine(line) {
    if (line === "") {
      if (data !== void 0)
        onEvent({ data, event: event || "message" });
      data = void 0;
      event = "";
      return;
    }
    const colon = line.indexOf(":");
    if (colon === 0)
      return;
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== "data" && field !== "event")
      return;
    let value = "";
    if (colon !== -1)
      value = line.slice(line.charCodeAt(colon + 1) === 32 ? colon + 2 : colon + 1);
    if (field === "event")
      event = value;
    else
      data = data === void 0 ? value : data + "\n" + value;
  }
  return {
    /** Parses the next chunk of the stream. */
    feed(chunk) {
      if (!started && chunk) {
        started = true;
        if (chunk.startsWith("\uFEFF"))
          chunk = chunk.slice(1);
      }
      if (skipLineFeed && chunk) {
        skipLineFeed = false;
        if (chunk.startsWith("\n"))
          chunk = chunk.slice(1);
      }
      buffer += chunk;
      if (chunk.indexOf("\n") === -1 && chunk.indexOf("\r") === -1)
        return;
      let start = 0;
      let lineFeed = buffer.indexOf("\n");
      let carriageReturn = buffer.indexOf("\r");
      while (lineFeed !== -1 || carriageReturn !== -1) {
        const end = lineFeed === -1 ? carriageReturn : carriageReturn === -1 ? lineFeed : Math.min(lineFeed, carriageReturn);
        parseLine(buffer.slice(start, end));
        start = end + 1;
        if (end === carriageReturn) {
          if (start === buffer.length)
            skipLineFeed = true;
          else if (lineFeed === start)
            start++;
          carriageReturn = buffer.indexOf("\r", start);
        }
        if (lineFeed !== -1 && lineFeed < start)
          lineFeed = buffer.indexOf("\n", start);
      }
      buffer = buffer.slice(start);
    }
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/Types.js
var paymentMethod = "evm";
var exactIntent = "charge";
var schemes = ["exact"];
var evmNetworkPrefix = "eip155:";
var syntheticChallengeIdPrefix = "x402:";
var paymentRequiredHeader = "PAYMENT-REQUIRED";
var paymentSignatureHeader = "PAYMENT-SIGNATURE";
var paymentResponseHeader = "PAYMENT-RESPONSE";
var nonEmptyString = string2().check(_minLength(1));
var positiveNumber = number2().check(refine((value) => value > 0, "Must be positive"));
var atomicAmount = string2().check(_regex(/^\d+$/, "Invalid atomic amount"));
var address2 = address();
var evmNetwork = string2().check(_regex(new RegExp(`^${evmNetworkPrefix}\\d+$`), "Invalid EVM CAIP-2 network"));
var ResourceInfoSchema = object({
  description: optional(string2()),
  iconUrl: optional(string2()),
  mimeType: optional(string2()),
  serviceName: optional(string2()),
  tags: optional(array(string2())),
  url: nonEmptyString
});
var ExactTransferSchema = discriminatedUnion("type", [
  object({
    name: nonEmptyString,
    type: literal("eip3009"),
    version: nonEmptyString
  }),
  object({
    name: optional(string2()),
    type: literal("permit2"),
    version: optional(string2())
  })
]);
var PaymentRequirementsSchema = object({
  amount: atomicAmount,
  asset: nonEmptyString,
  extra: optional(record(string2(), unknown())),
  maxTimeoutSeconds: positiveNumber,
  network: evmNetwork,
  payTo: nonEmptyString,
  scheme: _enum(schemes)
});
var ExtensionSchema = object({
  info: record(string2(), unknown()),
  schema: record(string2(), unknown())
});
var ExtensionsSchema = record(string2(), ExtensionSchema);
var PaymentRequiredSchema = object({
  accepts: array(PaymentRequirementsSchema).check(_minLength(1)),
  error: optional(string2()),
  extensions: optional(ExtensionsSchema),
  resource: ResourceInfoSchema,
  x402Version: literal(2)
});
var ExactEip3009PayloadSchema = object({
  authorization: object({
    from: address2,
    nonce: hash(),
    to: address2,
    validAfter: atomicAmount,
    validBefore: atomicAmount,
    value: atomicAmount
  }),
  signature: signature()
});
var ExactPermit2PayloadSchema = object({
  permit2Authorization: object({
    deadline: atomicAmount,
    from: address2,
    nonce: atomicAmount,
    permitted: object({
      amount: atomicAmount,
      token: address2
    }),
    spender: address2,
    witness: object({
      to: address2,
      validAfter: atomicAmount
    })
  }),
  signature: signature()
});
var ExactPayloadSchema = union([ExactEip3009PayloadSchema, ExactPermit2PayloadSchema]);
var PaymentPayloadSchema = object({
  accepted: PaymentRequirementsSchema,
  extensions: optional(ExtensionsSchema),
  payload: ExactPayloadSchema,
  resource: optional(ResourceInfoSchema),
  x402Version: literal(2)
});
var VerifyResponseSchema = object({
  extensions: optional(ExtensionsSchema),
  extra: optional(record(string2(), unknown())),
  invalidMessage: optional(string2()),
  invalidReason: optional(string2()),
  isValid: boolean2(),
  payer: optional(string2())
});
var SettleResponseSchema = object({
  amount: optional(atomicAmount),
  errorMessage: optional(string2()),
  errorReason: optional(string2()),
  extensions: optional(ExtensionsSchema),
  extra: optional(record(string2(), unknown())),
  network: nonEmptyString,
  payer: optional(string2()),
  success: boolean2(),
  transaction: string2()
});
function toPaymentRequirements(request2) {
  const { extensions: _extensions, resource: _resource, ...paymentRequirements } = request2;
  return PaymentRequirementsSchema.parse(paymentRequirements);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/protocols/Shared.js
var paymentRequiredStatus = 402;
var credentialHeaders2 = [
  Headers2.authorization,
  paymentRequiredHeader,
  paymentResponseHeader,
  paymentSignatureHeader
];
function setCredentialHeader(request2, header2, credential) {
  const headers = new Headers(request2.headers);
  for (const stale of credentialHeaders2) {
    if (stale === Headers2.authorization && !headers.get(stale)?.startsWith("Payment "))
      continue;
    headers.delete(stale);
  }
  headers.set(header2, credential);
  return { ...request2, headers };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/protocols/Mcp.js
function jsonRpcRequestId(body) {
  if (typeof body !== "string")
    return void 0;
  try {
    const message = JSON.parse(body);
    const id = message?.id;
    if (message?.jsonrpc !== "2.0" || typeof message?.method !== "string")
      return void 0;
    return typeof id === "string" || typeof id === "number" ? id : void 0;
  } catch {
    return void 0;
  }
}
var adapterPaymentMetaKey = "mppx/payment-client";
function adapterOwnsPayment(request2) {
  if (typeof request2?.body !== "string")
    return false;
  try {
    const message = JSON.parse(request2.body);
    return message?.jsonrpc === "2.0" && message?.method === "tools/call" && message.params?._meta?.[adapterPaymentMetaKey] === true;
  } catch {
    return false;
  }
}
var maxInspectionBytes = 1024 * 1024;
var responseCache = /* @__PURE__ */ new WeakMap();
function mcpHttpRequestId(request2) {
  const id = jsonRpcRequestId(request2?.body);
  if (id === void 0)
    return void 0;
  const headers = new Headers(request2?.headers);
  if (headers.has("mcp-method"))
    return id;
  const accept = headers.get("accept")?.toLowerCase() ?? "";
  return accept.includes("application/json") && accept.includes("text/event-stream") ? id : void 0;
}
function parseMessage(value) {
  if (!value || typeof value !== "object")
    return void 0;
  const message = value;
  const id = message.id;
  if (message.jsonrpc !== "2.0")
    return void 0;
  if (id !== void 0 && typeof id !== "string" && typeof id !== "number")
    return void 0;
  const hasError = "error" in message;
  const hasResult = "result" in message;
  if (hasError === hasResult)
    return void 0;
  if (hasError)
    return Number.isInteger(message.error?.code) && typeof message.error?.message === "string" ? value : void 0;
  return id !== void 0 && typeof message.result === "object" ? value : void 0;
}
function paymentRequiredDataFromValue(data) {
  if (!data || typeof data !== "object")
    return void 0;
  const challenges = data?.challenges;
  if (!Array.isArray(challenges) || challenges.length === 0)
    return void 0;
  const parsed = [];
  for (const challenge2 of challenges) {
    const result = Schema.safeParse(challenge2);
    if (!result.success)
      return void 0;
    parsed.push(result.data);
  }
  const { httpStatus, problem } = data;
  return {
    challenges: parsed,
    ...typeof httpStatus === "number" ? { httpStatus } : {},
    ...problem !== void 0 ? { problem } : {}
  };
}
function paymentRequiredData(message) {
  if (!message)
    return void 0;
  if ("error" in message) {
    if (message.error?.code !== paymentRequiredCode && message.error?.code !== paymentVerificationFailedCode)
      return void 0;
    return paymentRequiredDataFromValue(message.error.data);
  }
  return paymentRequiredDataFromValue(message.result?._meta?.[paymentRequiredMetaKey]);
}
function paymentRequiredChallenges(message, id) {
  if (!message || message.id !== id)
    return [];
  return paymentRequiredData(message)?.challenges ?? [];
}
async function parseSseJsonRpcResponse(response2) {
  const reader = response2.clone().body?.getReader();
  if (!reader)
    return void 0;
  const decoder3 = new TextDecoder();
  let received = 0;
  let dataEventSeen = false;
  let message;
  const parser = createParser((event) => {
    if (dataEventSeen || !event.data)
      return;
    dataEventSeen = true;
    if (event.event !== "message")
      return;
    try {
      message = parseMessage(JSON.parse(event.data));
    } catch {
    }
  });
  try {
    for (; ; ) {
      if (dataEventSeen)
        return message;
      const { done, value } = await reader.read();
      if (done) {
        parser.feed(decoder3.decode());
        return message;
      }
      received += value.byteLength;
      if (received > maxInspectionBytes)
        return void 0;
      parser.feed(decoder3.decode(value, { stream: true }));
    }
  } finally {
    void reader.cancel().catch(() => {
    });
  }
}
async function parseJsonResponse(response2) {
  const reader = response2.clone().body?.getReader();
  if (!reader)
    return void 0;
  const decoder3 = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done)
        return parseMessage(JSON.parse(text + decoder3.decode()));
      received += value.byteLength;
      if (received > maxInspectionBytes)
        return void 0;
      text += decoder3.decode(value, { stream: true });
    }
  } catch {
    return void 0;
  } finally {
    void reader.cancel().catch(() => {
    });
  }
}
function parseJsonRpcResponse(response2) {
  const cached2 = responseCache.get(response2);
  if (cached2)
    return cached2;
  const promise = (async () => {
    const contentType = response2.headers.get("content-type")?.toLowerCase() ?? "";
    if (Number(response2.headers.get("content-length")) > maxInspectionBytes)
      return void 0;
    if (contentType.includes("application/json"))
      return parseJsonResponse(response2);
    if (contentType.includes("text/event-stream"))
      return parseSseJsonRpcResponse(response2);
    return void 0;
  })();
  responseCache.set(response2, promise);
  return promise;
}
function mcp() {
  return {
    getChallenges(response2, request2) {
      const id = mcpHttpRequestId(request2);
      if (response2.status === paymentRequiredStatus || id === void 0)
        return [];
      return parseJsonRpcResponse(response2).then((message) => paymentRequiredChallenges(message, id));
    },
    setCredential(request2, credential) {
      const message = JSON.parse(request2.body);
      const parsed = deserialize3(credential);
      return {
        ...request2,
        body: JSON.stringify({
          ...message,
          params: {
            ...message.params,
            ["_meta"]: { ...message.params?.["_meta"], [credentialMetaKey]: parsed }
          }
        })
      };
    }
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/protocols/Mpp.js
function mpp() {
  return {
    getChallenges(response2) {
      const header2 = response2.headers.get(Headers2.wwwAuthenticate);
      if (response2.status !== paymentRequiredStatus || !header2 || !hasPaymentScheme(header2))
        return [];
      return fromResponseList(response2);
    },
    setCredential(request2, credential, options) {
      return setCredentialHeader(request2, options?.challenge ? credentialHeader(options.challenge) : Headers2.authorization, credential);
    }
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/internal/HeaderCodec.js
function createJson(schema) {
  return {
    encode(value) {
      return Base64_exports.fromString(JSON.stringify(schema.parse(value)));
    },
    decode(value) {
      try {
        return schema.parse(JSON.parse(Base64_exports.toString(value)));
      } catch {
        throw new InvalidJsonHeaderError();
      }
    }
  };
}
var InvalidJsonHeaderError = class extends Error {
  name = "InvalidJsonHeaderError";
  constructor() {
    super("Invalid base64 JSON header.");
  }
};

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/Header.js
var paymentRequired = createJson(PaymentRequiredSchema);
var paymentSignature = createJson(PaymentPayloadSchema);
var paymentResponse = createJson(SettleResponseSchema);
var encodePaymentRequired = paymentRequired.encode;
var decodePaymentRequired = paymentRequired.decode;
function decodePaymentRequiredEnvelope(value) {
  try {
    const parsed = JSON.parse(Base64_exports.toString(value));
    return parsePaymentRequiredEnvelope(parsed);
  } catch {
    throw new InvalidJsonHeaderError();
  }
}
var encodePaymentSignature = paymentSignature.encode;
var decodePaymentSignature = paymentSignature.decode;
var encodePaymentResponse = paymentResponse.encode;
var decodePaymentResponse = paymentResponse.decode;
var parsePaymentRequiredEnvelope = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new InvalidJsonHeaderError();
  const record2 = value;
  if (record2.x402Version !== 2 || !Array.isArray(record2.accepts))
    throw new InvalidJsonHeaderError();
  const resource = ResourceInfoSchema.parse(record2.resource);
  const extensions = record2.extensions !== void 0 ? ExtensionsSchema.safeParse(record2.extensions).data : void 0;
  return {
    accepts: record2.accepts,
    ...extensions ? { extensions } : {},
    resource,
    x402Version: 2
  };
};

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/protocols/X402.js
function x402() {
  return {
    getChallenges(response2) {
      if (response2.status !== paymentRequiredStatus)
        return [];
      const header2 = response2.headers.get(paymentRequiredHeader);
      if (!header2)
        return [];
      const paymentRequired2 = decodePaymentRequiredEnvelope(header2);
      return paymentRequired2.accepts.flatMap((rawAccepted, index) => {
        const parsed = PaymentRequirementsSchema.safeParse(rawAccepted);
        if (!parsed.success)
          return [];
        const accepted = parsed.data;
        return mark(from5({
          id: `${syntheticChallengeIdPrefix}${index}`,
          intent: exactIntent,
          method: paymentMethod,
          realm: new URL(paymentRequired2.resource.url).host,
          request: {
            ...accepted,
            ...paymentRequired2.extensions ? { extensions: paymentRequired2.extensions } : {},
            resource: paymentRequired2.resource
          }
        }));
      });
    },
    setCredential(request2, credential) {
      return setCredentialHeader(request2, paymentSignatureHeader, credential);
    }
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/Transport.js
function from8(transport) {
  return transport;
}
function http() {
  const protocols = [mpp(), x402(), mcp()];
  const protocolForChallenge = /* @__PURE__ */ new WeakMap();
  const remember = (protocol, challenges) => {
    for (const challenge2 of challenges)
      protocolForChallenge.set(challenge2, protocol);
    return challenges;
  };
  const collect = (response2, request2) => {
    const collectFrom = (index, collected) => {
      for (let i = index; i < protocols.length; i++) {
        const protocol = protocols[i];
        const challenges = protocol.getChallenges(response2, request2);
        if (challenges instanceof Promise)
          return challenges.then((list) => collectFrom(i + 1, [...collected, ...remember(protocol, list)]));
        collected.push(...remember(protocol, challenges));
      }
      return collected;
    };
    return collectFrom(0, []);
  };
  return from8({
    name: "http",
    isPaymentRequired(response2, request2) {
      if (response2.status === paymentRequiredStatus)
        return true;
      const challenges = collect(response2, request2);
      return challenges instanceof Promise ? challenges.then((list) => list.length > 0) : challenges.length > 0;
    },
    getChallenges(response2, request2) {
      return collect(response2, request2);
    },
    setCredential(request2, credential, options) {
      const protocol = options?.challenge ? protocolForChallenge.get(options.challenge) : void 0;
      const fallback = protocols[0];
      if (!protocol && !fallback)
        throw new Error("No protocol to attach the credential.");
      return (protocol ?? fallback).setCredential(request2, credential, options);
    }
  });
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/MethodChallenge.js
var handlers = /* @__PURE__ */ new WeakMap();
function has(method) {
  return handlers.has(method);
}
function handle(method, parameters) {
  return Promise.resolve(handlers.get(method)?.(parameters));
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/MethodResponse.js
var handlers2 = /* @__PURE__ */ new WeakMap();
var attempts = /* @__PURE__ */ new WeakMap();
var origins = /* @__PURE__ */ new WeakMap();
var transactionHashes = /* @__PURE__ */ new WeakMap();
function attachAttempt(method, parameters, attempt) {
  if (handlers2.has(method))
    attempts.set(parameters, attempt);
}
function handle2(method, parameters) {
  return Promise.resolve(handlers2.get(method)?.(parameters) ?? parameters.response);
}
function getTransactionHash(method, credential) {
  try {
    return transactionHashes.get(method)?.(credential);
  } catch {
    return void 0;
  }
}
function attachOrigin(parameters, origin) {
  origins.set(parameters, origin);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/ProofRealm.js
function assert6(challenge2, url, trustedRealms) {
  if (!isProof(challenge2) && !(challenge2.method === "tempo" && challenge2.intent === "session"))
    return;
  url = typeof url === "function" ? url() : url;
  const { realm } = challenge2;
  if (realm.toLowerCase() === url.hostname.toLowerCase())
    return;
  const origin = url.origin.toLowerCase();
  for (const [trustedOrigin, trustedRealm] of Object.entries(trustedRealms ?? {}))
    if (trustedRealm === realm && normalizeOrigin(trustedOrigin) === origin)
      return;
  throw new Error(`Refusing to sign Tempo proof for realm ${JSON.stringify(realm)} from ${url.origin}. Pin the realm to this origin with \`trustedTempoProofRealms\` if this server is expected to issue it.`);
}
function assertWithoutOrigin(challenge2, trustedRealms) {
  if (!isProof(challenge2) && !(challenge2.method === "tempo" && challenge2.intent === "session"))
    return;
  if (trustedRealms?.includes(challenge2.realm))
    return;
  throw new Error(`Refusing to sign Tempo proof for untrusted realm ${JSON.stringify(challenge2.realm)}. Add it to \`trustedTempoProofRealms\` if this server is expected to issue it.`);
}
function isProof(challenge2) {
  if (challenge2.method !== "tempo" || challenge2.intent !== "charge")
    return false;
  try {
    return BigInt(challenge2.request.amount) === 0n;
  } catch {
    return false;
  }
}
function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin.toLowerCase();
  } catch {
    return origin.toLowerCase();
  }
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/internal/Fetch.js
var MPPX_FETCH_WRAPPER = /* @__PURE__ */ Symbol.for("mppx.fetch.wrapper");
var MPPX_FETCH_IDENTITY = /* @__PURE__ */ Symbol.for("mppx.fetch.identity");
var skipPayment2 = /* @__PURE__ */ Symbol.for("mppx.fetch.skipPayment");
var defaultMaxPaymentRetries = 3;
var maxErrorBodyBytes = 64 * 1024;
var errorBodyTimeoutMs = 2e3;
var bodyTruncatedHeader = "Mppx-Body-Truncated";
var originalFetch;
var eventObserverChecks = /* @__PURE__ */ new WeakMap();
async function bufferErrorBody(response2) {
  if (!response2.body)
    return response2;
  const reader = response2.clone().body.getReader();
  const chunks = [];
  let received = 0;
  let truncated = false;
  const timeout = setTimeout(() => {
    truncated = true;
    void reader.cancel().catch(() => {
    });
  }, errorBodyTimeoutMs);
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done)
        break;
      chunks.push(value);
      received += value.byteLength;
      if (received > maxErrorBodyBytes) {
        truncated = true;
        break;
      }
    }
  } finally {
    clearTimeout(timeout);
    void reader.cancel().catch(() => {
    });
  }
  if (!truncated)
    return response2;
  void response2.body.cancel().catch(() => {
  });
  const headers = new Headers(response2.headers);
  headers.delete("content-length");
  headers.set(bodyTruncatedHeader, "true");
  const truncatedResponse = new Response(new Blob(chunks).slice(0, maxErrorBodyBytes), {
    headers,
    status: response2.status,
    statusText: response2.statusText
  });
  for (const key of ["redirected", "type", "url"])
    Object.defineProperty(truncatedResponse, key, { value: response2[key] });
  return truncatedResponse;
}
async function settleAttempt(prepared, outcome) {
  const settle = prepared?.attempt.settle;
  if (!settle)
    return outcome.status !== "pending";
  prepared.attempt.settle = void 0;
  const settled = await settle(outcome);
  if (!settled)
    prepared.attempt.settle = settle;
  return settled;
}
function from9(config2) {
  const { acceptPayment, acceptPaymentPolicy = "always", fetch = globalThis.fetch, maxPaymentRetries = defaultMaxPaymentRetries, methods, onChallenge, orderChallenges, transport = http(), trustedTempoProofRealms } = config2;
  const identity = config2.identity ?? (config2.fetch && identityOf(config2.fetch));
  const events = config2.eventDispatcher ?? createEventDispatcher();
  const resolvedAcceptPayment = acceptPayment ?? resolve(methods);
  const baseFetch = unwrapFetch(fetch);
  const send = async (input, init, context) => identity ? identity.send(baseFetch, new Request(input, init), context) : { response: await baseFetch(input, init), headers: [] };
  const request2 = async (input, init, canRefetch) => {
    const callerHeaders = getCallerHeaders(input, init?.headers);
    const hasExplicitAcceptPayment = callerHeaders.has(Headers2.acceptPayment);
    const paymentPreferences = resolvePaymentPreferences(callerHeaders, resolvedAcceptPayment);
    const capturedBody = captureRequestBody(input, init, callerHeaders);
    const initialRequest = prepareInitialRequest(input, init, callerHeaders, paymentPreferences.header, hasExplicitAcceptPayment, acceptPaymentPolicy);
    const first = await send(cloneRequestInput(initialRequest.input), initialRequest.init);
    let response2 = first.response;
    const identityHeaders = first.headers;
    const transportRequest = withCapturedBody(initialRequest.init, await capturedBody);
    if (init?.[skipPayment2])
      return response2;
    if (adapterOwnsPayment(transportRequest))
      return response2;
    if (!await transport.isPaymentRequired(response2, transportRequest))
      return response2;
    const context = init?.context;
    const { context: _, orderChallenges: requestOrderChallenges, ...fetchInit } = transportRequest ?? {};
    let challenge2;
    let challenges;
    let mi;
    let preparedCredential;
    let outcomeUnknown;
    try {
      for (let retry = 0; retry < maxPaymentRetries; retry++) {
        challenges = await transport.getChallenges(response2, transportRequest);
        const candidates = selectChallengeCandidates(challenges, methods, paymentPreferences.entries, context);
        const orderedCandidates = await resolveChallengeOrder(candidates, requestOrderChallenges ?? orderChallenges);
        const selected = orderedCandidates[0];
        if (!selected) {
          await settleAttempt(preparedCredential, {
            challenges,
            response: response2,
            status: "rejected"
          });
          if (retry > 0)
            return response2;
          throw new Error(`No method found for challenges: ${challenges.map((c) => `${c.method}.${c.intent}`).join(", ")}. Available: ${methods.map((m) => `${m.name}.${m.intent}`).join(", ")}`);
        }
        const selectedChallenge = selected.challenge;
        challenge2 = selectedChallenge;
        mi = selected.method;
        if (challenge2.expires)
          assert(challenge2.expires, challenge2.id);
        await identity?.challenge(response2, { challenge: selectedChallenge }, resolveRequestUrl(initialRequest.input).href);
        const paymentInput = await resolvePaymentRetryInput(response2, initialRequest.input, initialRequest.input, fetchInit);
        assert6(selectedChallenge, () => resolveRequestUrl(paymentInput), trustedTempoProofRealms);
        const previousCredential = preparedCredential;
        const key = serialize2(selectedChallenge);
        const sameAttempt = previousCredential?.method === selected.method && previousCredential?.key === key;
        let canReusePrevious = false;
        if (previousCredential) {
          const settled = await settleAttempt(previousCredential, {
            challenges,
            response: response2,
            status: sameAttempt ? "pending" : "rejected"
          });
          canReusePrevious = sameAttempt && !settled;
        }
        preparedCredential = canReusePrevious ? previousCredential : void 0;
        const createCredential2 = memoizeCreateCredential(async (overrideContext) => {
          if (overrideContext === void 0 && canReusePrevious && previousCredential) {
            return previousCredential.promise;
          }
          if (canReusePrevious && previousCredential) {
            await settleAttempt(previousCredential, { status: "rejected" });
            preparedCredential = void 0;
          }
          resolveRequestSignal(input, init)?.throwIfAborted();
          const credentialContext = overrideContext ?? context;
          if (!has(selected.method))
            return resolveCredential(selectedChallenge, selected.method, credentialContext);
          const attempt = {
            origin: resolveRequestUrl(paymentInput).origin,
            prepare: () => handle(selected.method, {
              challenge: selectedChallenge,
              context: credentialContext,
              // Management requests (e.g. session top-ups) carry the same identity proofs.
              fetch: identity ? wrapFetch(baseFetch, identity, {
                challenge: selectedChallenge
              }) : baseFetch,
              input: paymentInput,
              signal: resolveRequestSignal(input, init)
            })
          };
          const promise = attempt.prepare().then(() => resolveCredential(selectedChallenge, selected.method, credentialContext, attempt));
          preparedCredential = {
            context: credentialContext,
            attempt,
            key: overrideContext === void 0 ? key : void 0,
            method: selected.method,
            promise
          };
          return promise;
        });
        const eventCredential = await events.emit("challenge.received", createChallengeReceivedPayload({
          challenge: selectedChallenge,
          challenges,
          createCredential: createCredential2,
          init,
          input,
          method: selected.method,
          response: response2
        }));
        const onChallengeCredential = eventCredential ?? (onChallenge ? await onChallenge(challenge2, {
          createCredential: createCredential2
        }) : void 0);
        const credential = onChallengeCredential ?? await createCredential2();
        const prepared = preparedCredential;
        if (prepared && await prepared.promise.catch(() => void 0) !== credential) {
          await settleAttempt(prepared, { status: "rejected" });
          preparedCredential = void 0;
        }
        const effectiveContext = preparedCredential ? preparedCredential.context : context;
        validateCredentialHeaderValue(credential);
        await events.emit("credential.created", createCredentialCreatedPayload({
          challenge: selectedChallenge,
          credential,
          init,
          input,
          method: selected.method,
          response: response2
        }));
        const unknownOutcome = (cause) => new PaymentOutcomeUnknownError({
          cause,
          challenge: selectedChallenge,
          credential,
          transactionHash: getTransactionHash(selected.method, credential)
        });
        try {
          ;
          ({ response: response2 } = await send(paymentInput, {
            ...transport.setCredential({
              ...fetchInit,
              headers: initialRequest.headers
            }, credential, { challenge: selectedChallenge }),
            // Runtimes do not strip custom payment headers on cross-origin redirects.
            redirect: "manual"
          }, { challenge: selectedChallenge, headers: identityHeaders }));
        } catch (cause) {
          outcomeUnknown = unknownOutcome(cause);
          throw cause;
        }
        const paymentRequired2 = await transport.isPaymentRequired(response2, transportRequest);
        if (!paymentRequired2) {
          await settleAttempt(prepared, {
            response: response2,
            // A redirect does not tell us whether the paid request was accepted.
            status: response2.status >= 300 && response2.status < 400 ? "pending" : response2.ok ? "accepted" : "rejected"
          });
          preparedCredential = void 0;
        }
        if (response2.ok && hasEventObservers(events, "payment.response"))
          await events.emit("payment.response", createPaymentResponsePayload({
            challenge: selectedChallenge,
            credential,
            init,
            input,
            method: selected.method,
            response: response2
          }));
        if (!paymentRequired2) {
          if (response2.status >= 500 && hasEventObservers(events, "payment.failed")) {
            try {
              response2 = await bufferErrorBody(response2);
            } catch (cause) {
              outcomeUnknown = unknownOutcome(cause);
              response2 = new Response(null, {
                headers: response2.headers,
                status: response2.status,
                statusText: response2.statusText
              });
              throw cause;
            }
            await events.emit("payment.failed", createPaymentFailedPayload({
              challenge: selectedChallenge,
              challenges,
              error: unknownOutcome(),
              init,
              input,
              method: selected.method,
              response: response2
            }));
          }
          if (!response2.ok)
            return response2;
          return handle2(selected.method, {
            context: effectiveContext,
            challenge: selectedChallenge,
            credential,
            fetch: baseFetch,
            headers: initialRequest.headers,
            input: paymentInput,
            ...canRefetch ? {
              refetch: () => request2(cloneRequestInput(initialRequest.input), init, false)
            } : {},
            response: response2,
            signal: resolveRequestSignal(input, init)
          });
        }
      }
      challenges = void 0;
      try {
        challenges = await transport.getChallenges(response2, transportRequest);
      } catch {
      }
      await settleAttempt(preparedCredential, {
        challenges,
        response: response2,
        status: "rejected"
      });
      return response2;
    } catch (error) {
      await settleAttempt(preparedCredential, {
        challenges,
        response: response2,
        status: "rejected"
      });
      await events.emit("payment.failed", createPaymentFailedPayload({
        challenge: challenge2,
        challenges,
        // Observers get the credential to reconcile; callers keep the original error.
        error: outcomeUnknown ?? error,
        init,
        input,
        method: mi,
        response: response2
      }));
      throw error;
    }
  };
  const wrappedFetch = (input, init) => request2(input, init, true);
  wrappedFetch[MPPX_FETCH_WRAPPER] = baseFetch;
  if (identity)
    wrappedFetch[MPPX_FETCH_IDENTITY] = identity;
  return wrappedFetch;
}
function polyfill(config2) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  if (!descriptor || !descriptor.writable && !descriptor.set) {
    throw new Error("globalThis.fetch is not writable");
  }
  if (!originalFetch)
    originalFetch = globalThis.fetch;
  globalThis.fetch = from9({
    ...config2,
    acceptPaymentPolicy: config2.acceptPaymentPolicy ?? (isBrowser() ? "same-origin" : "always"),
    // Unwrapped so a previous polyfill's identity provers are not inherited.
    fetch: unwrapFetch(globalThis.fetch)
  });
}
function restore() {
  if (originalFetch && isWrappedFetch(globalThis.fetch)) {
    globalThis.fetch = originalFetch;
    originalFetch = void 0;
  }
}
function createEventDispatcher() {
  const handlers3 = {
    "*": /* @__PURE__ */ new Set(),
    "challenge.received": /* @__PURE__ */ new Set(),
    "credential.created": /* @__PURE__ */ new Set(),
    "payment.failed": /* @__PURE__ */ new Set(),
    "payment.response": /* @__PURE__ */ new Set()
  };
  const on = (name, handler) => {
    switch (name) {
      case "*":
      case "challenge.received":
      case "credential.created":
      case "payment.failed":
      case "payment.response":
        handlers3[name].add(handler);
        return () => handlers3[name].delete(handler);
      default:
        throw new Error(`Unknown client event "${String(name)}".`);
    }
  };
  const dispatcher = {
    async emit(name, payload) {
      switch (name) {
        case "challenge.received": {
          let credential;
          for (const handler of handlers3["challenge.received"]) {
            const value = await emitChallengeReceived(handler, payload);
            if (typeof value === "string" && value.length > 0) {
              credential = value;
              break;
            }
          }
          await emitCatchall(handlers3["*"], name, payload);
          return credential;
        }
        case "credential.created":
          await emitObserveHandlers(handlers3["credential.created"], payload);
          await emitCatchall(handlers3["*"], name, payload);
          return void 0;
        case "payment.failed":
          await emitObserveHandlers(handlers3["payment.failed"], payload);
          await emitCatchall(handlers3["*"], name, payload);
          return void 0;
        case "payment.response":
          await emitObserveHandlers(handlers3["payment.response"], payload);
          await emitCatchall(handlers3["*"], name, payload);
          return void 0;
      }
    },
    on
  };
  eventObserverChecks.set(dispatcher, (name) => handlers3[name].size > 0 || handlers3["*"].size > 0);
  return dispatcher;
}
function hasEventObservers(dispatcher, name) {
  return eventObserverChecks.get(dispatcher)?.(name) ?? true;
}
async function emitChallengeReceived(handler, payload) {
  try {
    return await handler(payload);
  } catch {
    return void 0;
  }
}
async function emitObserveHandlers(handlers3, payload) {
  for (const handler of handlers3) {
    try {
      await handler(payload);
    } catch {
    }
  }
}
async function emitCatchall(handlers3, name, payload) {
  await emitObserveHandlers(handlers3, Object.freeze({ name, payload }));
}
function memoizeCreateCredential(createCredential2) {
  let promise;
  return (context) => {
    promise ??= createCredential2(context);
    return promise;
  };
}
function createChallengeReceivedPayload(parameters) {
  return Object.freeze({
    challenge: snapshotValue(parameters.challenge),
    challenges: parameters.challenges.map((challenge2) => snapshotValue(challenge2)),
    createCredential: parameters.createCredential,
    init: snapshotInit(parameters.init),
    input: snapshotInput(parameters.input),
    method: snapshotMethod(parameters.method),
    response: snapshotResponse(parameters.response)
  });
}
function createCredentialCreatedPayload(parameters) {
  return Object.freeze({
    challenge: snapshotValue(parameters.challenge),
    credential: parameters.credential,
    init: snapshotInit(parameters.init),
    input: snapshotInput(parameters.input),
    method: snapshotMethod(parameters.method),
    ...parameters.response !== void 0 ? { response: snapshotResponse(parameters.response) } : {}
  });
}
function createPaymentResponsePayload(parameters) {
  return Object.freeze({
    challenge: snapshotValue(parameters.challenge),
    credential: parameters.credential,
    init: snapshotInit(parameters.init),
    input: snapshotInput(parameters.input),
    method: snapshotMethod(parameters.method),
    response: snapshotResponse(parameters.response)
  });
}
function createPaymentFailedPayload(parameters) {
  return Object.freeze({
    ...parameters.challenge ? { challenge: snapshotValue(parameters.challenge) } : {},
    ...parameters.challenges ? { challenges: parameters.challenges.map((challenge2) => snapshotValue(challenge2)) } : {},
    error: parameters.error,
    init: snapshotInit(parameters.init),
    input: snapshotInput(parameters.input),
    ...parameters.method ? { method: snapshotMethod(parameters.method) } : {},
    ...parameters.response !== void 0 ? { response: snapshotResponse(parameters.response) } : {}
  });
}
function snapshotInit(init) {
  if (!init)
    return void 0;
  return freezeSnapshot({
    ...init,
    ...init.headers ? { headers: new Headers(init.headers) } : {}
  });
}
function snapshotInput(input) {
  if (input instanceof Request) {
    try {
      return input.clone();
    } catch {
      return input;
    }
  }
  if (input instanceof URL)
    return new URL(input);
  return input;
}
function snapshotMethod(method) {
  return freezeSnapshot(Object.assign({}, method));
}
function snapshotResponse(response2) {
  if (response2 instanceof Response) {
    try {
      return response2.clone();
    } catch {
      const snapshot = new Response(null, {
        headers: response2.headers,
        status: response2.status,
        statusText: response2.statusText
      });
      for (const key of ["redirected", "type", "url"])
        Object.defineProperty(snapshot, key, { value: response2[key] });
      return snapshot;
    }
  }
  return snapshotValue(response2);
}
function snapshotValue(value) {
  try {
    return deepFreeze(structuredClone(value));
  } catch {
    return freezeSnapshot(value);
  }
}
function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  Object.freeze(value);
  for (const child of Object.values(value))
    deepFreeze(child);
  return value;
}
function freezeSnapshot(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  Object.freeze(value);
  return value;
}
function prepareInitialRequest(input, init, callerHeaders, header2, hasExplicitAcceptPayment, policy) {
  const shouldInjectAcceptPayment = Boolean(header2) && !hasExplicitAcceptPayment && shouldInjectForPolicy(input, policy);
  if (!shouldInjectAcceptPayment)
    return { headers: callerHeaders, init, input };
  const headers = new Headers(input instanceof Request ? input.headers : void 0);
  callerHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  headers.set(Headers2.acceptPayment, header2);
  if (init) {
    ;
    init.headers = headers;
    return {
      headers,
      init,
      input
    };
  }
  return {
    headers,
    init: shouldInjectAcceptPayment ? { headers } : void 0,
    input
  };
}
function captureRequestBody(input, init, headers) {
  if (!(input instanceof Request) || init?.body !== void 0 || !input.body || input.bodyUsed)
    return void 0;
  if (!headers.has("mcp-method")) {
    const accept = headers.get("accept")?.toLowerCase() ?? "";
    if (!accept.includes("application/json") || !accept.includes("text/event-stream"))
      return void 0;
  }
  try {
    return input.clone().text().catch(() => void 0);
  } catch {
    return void 0;
  }
}
function withCapturedBody(init, body) {
  return body === void 0 ? init : { ...init, body };
}
function getCallerHeaders(input, headers) {
  if (headers)
    return new Headers(headers);
  return new Headers(input instanceof Request ? input.headers : void 0);
}
function identityOf(fetch) {
  return fetch[MPPX_FETCH_IDENTITY];
}
function unwrapFetch(fetch) {
  let current = fetch;
  while (current[MPPX_FETCH_WRAPPER]) {
    current = current[MPPX_FETCH_WRAPPER];
  }
  return current;
}
function cloneRequestInput(input) {
  if (!(input instanceof Request) || !input.body || input.bodyUsed)
    return input;
  try {
    return input.clone();
  } catch {
    return input;
  }
}
function resolveRequestSignal(input, init) {
  if (init?.signal === null)
    return void 0;
  if (init?.signal !== void 0)
    return init.signal;
  return input instanceof Request ? input.signal : void 0;
}
function isWrappedFetch(fetch) {
  return Boolean(fetch[MPPX_FETCH_WRAPPER]);
}
function validateCredentialHeaderValue(credential) {
  if (!credential.trim())
    throw new Error("Credential header value must be non-empty");
  if (credential.includes("\r") || credential.includes("\n")) {
    throw new Error("Credential header value contains illegal newline characters");
  }
}
async function resolveCredential(challenge2, mi, context, attempt) {
  const parsedContext = mi.context && context !== void 0 ? mi.context.parse(context) : void 0;
  const parameters = parsedContext !== void 0 ? { challenge: challenge2, context: parsedContext } : { challenge: challenge2 };
  if (attempt?.origin)
    attachOrigin(parameters, attempt.origin);
  if (attempt)
    attachAttempt(mi, parameters, attempt);
  return mi.createCredential(parameters);
}
function resolvePaymentPreferences(headers, acceptPayment) {
  const header2 = headers.get(Headers2.acceptPayment);
  if (!header2)
    return acceptPayment;
  try {
    return {
      ...acceptPayment,
      entries: parse4(header2),
      header: header2
    };
  } catch {
    return acceptPayment;
  }
}
async function resolveChallengeOrder(candidates, orderChallenges) {
  return orderChallenges ? orderChallenges(candidates) : candidates;
}
function shouldInjectForPolicy(input, policy) {
  if (policy === "always")
    return true;
  if (policy === "never")
    return false;
  const url = resolveRequestUrl(input);
  if (policy === "same-origin") {
    if (!isBrowser())
      return true;
    return url.origin === globalThis.location.origin;
  }
  return policy.origins.some((origin) => matchesOrigin(url, origin));
}
function matchesOrigin(url, pattern) {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);
    return url.hostname.endsWith(suffix) || url.hostname === pattern.slice(2);
  }
  return url.origin === new URL(pattern).origin;
}
function isBrowser() {
  return typeof globalThis.location !== "undefined";
}
function resolveRequestUrl(input) {
  if (input instanceof URL)
    return input;
  if (input instanceof Request)
    return new URL(input.url);
  return new URL(input, isBrowser() ? globalThis.location.href : void 0);
}
function assertPayableRequest(input, init) {
  const request2 = input instanceof Request ? input : void 0;
  const mode = init.mode ?? request2?.mode;
  if (mode === "no-cors")
    throw new Error("Cannot automatically pay a no-cors request: it cannot carry a credential.");
  const cache = init.cache ?? request2?.cache;
  if (cache === "only-if-cached")
    throw new Error("Cannot automatically pay an only-if-cached request: its retry cannot reach the server.");
}
async function resolvePaymentRetryInput(response2, fallback, initialInput, init) {
  assertPayableRequest(fallback, init);
  if (!response2.url)
    return fallback;
  const responseUrl = new URL(response2.url);
  const initialUrl = resolveRequestUrl(initialInput);
  if (responseUrl.origin !== initialUrl.origin) {
    throw new Error(`Refusing to send payment credential across redirect from ${initialUrl.origin} to ${responseUrl.origin}`);
  }
  const method = (init.method ?? (fallback instanceof Request ? fallback.method : "GET")).toUpperCase();
  if (response2.redirected && method !== "GET" && method !== "HEAD")
    throw new Error(`Cannot automatically pay a redirected ${method} request. Use prepareRequest() to preserve redirect semantics.`);
  if (fallback instanceof Request) {
    const source = init.body != null ? fallback : fallback.clone();
    const request2 = new Request(source, fallback.mode === "navigate" && init.mode === void 0 ? { ...init, mode: "same-origin" } : init);
    if (request2.url.split("#")[0] === response2.url)
      return request2;
    if (request2.body) {
      return new Request(response2.url, {
        body: await request2.arrayBuffer(),
        cache: request2.cache,
        credentials: request2.credentials,
        headers: request2.headers,
        integrity: request2.integrity,
        keepalive: request2.keepalive,
        method: request2.method,
        mode: request2.mode,
        redirect: request2.redirect,
        referrer: request2.referrer,
        referrerPolicy: request2.referrerPolicy,
        signal: request2.signal
      });
    }
    return new Request(response2.url, request2);
  }
  return response2.url;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/Assets.js
var Assets_exports = {};
__export(Assets_exports, {
  base: () => base,
  baseSepolia: () => baseSepolia,
  celo: () => celo,
  celoSepolia: () => celoSepolia,
  define: () => define,
  fromToken: () => fromToken,
  isAsset: () => isAsset,
  isRawAddress: () => isRawAddress,
  isToken: () => isToken,
  matches: () => matches2,
  resolve: () => resolve2,
  toChainId: () => toChainId,
  toNetwork: () => toNetwork
});

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js
init_getAddress();
init_keccak256();
function publicKeyToAddress(publicKey) {
  const address3 = keccak2562(`0x${publicKey.substring(4)}`).substring(26);
  return checksumAddress(`0x${address3}`);
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/signature/recoverPublicKey.js
init_isHex();
init_size();
init_fromHex();
init_toHex();
async function recoverPublicKey2({ hash: hash2, signature: signature2 }) {
  const hashHex = isHex(hash2) ? hash2 : toHex4(hash2);
  const { secp256k1: secp256k12 } = await Promise.resolve().then(() => (init_secp256k1(), secp256k1_exports));
  const signature_ = (() => {
    if (typeof signature2 === "object" && "r" in signature2 && "s" in signature2) {
      const { r, s, v, yParity } = signature2;
      const yParityOrV2 = Number(yParity ?? v);
      const recoveryBit2 = toRecoveryBit(yParityOrV2);
      return new secp256k12.Signature(hexToBigInt(r), hexToBigInt(s)).addRecoveryBit(recoveryBit2);
    }
    const signatureHex = isHex(signature2) ? signature2 : toHex4(signature2);
    if (size3(signatureHex) !== 65)
      throw new Error("invalid signature length");
    const yParityOrV = hexToNumber2(`0x${signatureHex.slice(130)}`);
    const recoveryBit = toRecoveryBit(yParityOrV);
    return secp256k12.Signature.fromCompact(signatureHex.substring(2, 130)).addRecoveryBit(recoveryBit);
  })();
  const publicKey = signature_.recoverPublicKey(hashHex.substring(2)).toHex(false);
  return `0x${publicKey}`;
}
function toRecoveryBit(yParityOrV) {
  if (yParityOrV === 0 || yParityOrV === 1)
    return yParityOrV;
  if (yParityOrV === 27)
    return 0;
  if (yParityOrV === 28)
    return 1;
  throw new Error("Invalid yParityOrV value");
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/signature/recoverAddress.js
async function recoverAddress2({ hash: hash2, signature: signature2 }) {
  return publicKeyToAddress(await recoverPublicKey2({ hash: hash2, signature: signature2 }));
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/signature/hashTypedData.js
init_encodeAbiParameters();
init_concat();
init_toHex();
init_keccak256();

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/typedData.js
init_abi();
init_address();

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/errors/typedData.js
init_stringify();
init_base();
var InvalidDomainError = class extends BaseError2 {
  constructor({ domain }) {
    super(`Invalid domain "${stringify2(domain)}".`, {
      metaMessages: ["Must be a valid EIP-712 domain."]
    });
  }
};
var InvalidPrimaryTypeError = class extends BaseError2 {
  constructor({ primaryType, types }) {
    super(`Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`, {
      docsPath: "/api/glossary/Errors#typeddatainvalidprimarytypeerror",
      metaMessages: ["Check that the primary type is a key in `types`."]
    });
  }
};
var InvalidStructTypeError = class extends BaseError2 {
  constructor({ type }) {
    super(`Struct type "${type}" is invalid.`, {
      metaMessages: ["Struct type must not be a Solidity type."],
      name: "InvalidStructTypeError"
    });
  }
};
var InvalidTypedDataTypeError = class extends BaseError2 {
  constructor({ type }) {
    const canonicalType = type.replace(/^(u?int)/, "$&256");
    super(`Type "${type}" is not a valid EIP-712 type.`, {
      metaMessages: [`Use "${canonicalType}" instead.`],
      name: "InvalidTypedDataTypeError"
    });
  }
};

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/typedData.js
init_isAddress();
init_size();
init_toHex();
init_regex();
function validateTypedData(parameters) {
  const { domain, message, primaryType, types } = parameters;
  const validateData = (struct, data) => {
    for (const param of struct) {
      const { name, type } = param;
      const value = data[name];
      const baseType = type.replace(/(\[[0-9]*\])+$/, "");
      if (baseType === "int" || baseType === "uint")
        throw new InvalidTypedDataTypeError({ type });
      const integerMatch = type.match(integerRegex);
      if (integerMatch && (typeof value === "number" || typeof value === "bigint")) {
        const [_type, base3, size_] = integerMatch;
        numberToHex(value, {
          signed: base3 === "int",
          size: Number.parseInt(size_, 10) / 8
        });
      }
      if (type === "address" && typeof value === "string" && !isAddress(value))
        throw new InvalidAddressError2({ address: value });
      const bytesMatch = type.match(bytesRegex);
      if (bytesMatch) {
        const [_type, size_] = bytesMatch;
        if (size_ && size3(value) !== Number.parseInt(size_, 10))
          throw new BytesSizeMismatchError({
            expectedSize: Number.parseInt(size_, 10),
            givenSize: size3(value)
          });
      }
      const struct2 = types[type];
      if (struct2) {
        validateReference(type);
        validateData(struct2, value);
      }
    }
  };
  if (types.EIP712Domain && domain) {
    if (typeof domain !== "object")
      throw new InvalidDomainError({ domain });
    validateData(types.EIP712Domain, domain);
  }
  if (primaryType !== "EIP712Domain") {
    if (types[primaryType])
      validateData(types[primaryType], message);
    else
      throw new InvalidPrimaryTypeError({ primaryType, types });
  }
}
function getTypesForEIP712Domain({ domain }) {
  return [
    typeof domain?.name === "string" && { name: "name", type: "string" },
    domain?.version && { name: "version", type: "string" },
    (typeof domain?.chainId === "number" || typeof domain?.chainId === "bigint") && {
      name: "chainId",
      type: "uint256"
    },
    domain?.verifyingContract && {
      name: "verifyingContract",
      type: "address"
    },
    domain?.salt && { name: "salt", type: "bytes32" }
  ].filter(Boolean);
}
function validateReference(type) {
  if (type === "address" || type === "bool" || type === "string" || type.startsWith("bytes") || type.startsWith("uint") || type.startsWith("int"))
    throw new InvalidStructTypeError({ type });
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/signature/hashTypedData.js
function hashTypedData(parameters) {
  const { domain = {}, message, primaryType } = parameters;
  const types = {
    EIP712Domain: getTypesForEIP712Domain({ domain }),
    ...parameters.types
  };
  validateTypedData({
    domain,
    message,
    primaryType,
    types
  });
  const parts = ["0x1901"];
  if (domain)
    parts.push(hashDomain({
      domain,
      types
    }));
  if (primaryType !== "EIP712Domain")
    parts.push(hashStruct({
      data: message,
      primaryType,
      types
    }));
  return keccak2562(concat3(parts));
}
function hashDomain({ domain, types }) {
  return hashStruct({
    data: domain,
    primaryType: "EIP712Domain",
    types
  });
}
function hashStruct({ data, primaryType, types }) {
  const encoded = encodeData({
    data,
    primaryType,
    types
  });
  return keccak2562(encoded);
}
function encodeData({ data, primaryType, types }) {
  const encodedTypes = [{ type: "bytes32" }];
  const encodedValues = [hashType({ primaryType, types })];
  for (const field of types[primaryType]) {
    const [type, value] = encodeField({
      types,
      name: field.name,
      type: field.type,
      value: data[field.name]
    });
    encodedTypes.push(type);
    encodedValues.push(value);
  }
  return encodeAbiParameters(encodedTypes, encodedValues);
}
function hashType({ primaryType, types }) {
  const encodedHashType = toHex4(encodeType({ primaryType, types }));
  return keccak2562(encodedHashType);
}
function encodeType({ primaryType, types }) {
  let result = "";
  const unsortedDeps = findTypeDependencies({ primaryType, types });
  unsortedDeps.delete(primaryType);
  const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
  for (const type of deps) {
    result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
  }
  return result;
}
function findTypeDependencies({ primaryType: primaryType_, types }, results2 = /* @__PURE__ */ new Set()) {
  const match = primaryType_.match(/^\w*/u);
  const primaryType = match?.[0];
  if (results2.has(primaryType) || types[primaryType] === void 0) {
    return results2;
  }
  results2.add(primaryType);
  for (const field of types[primaryType]) {
    findTypeDependencies({ primaryType: field.type, types }, results2);
  }
  return results2;
}
function encodeField({ types, name, type, value }) {
  if (types[type] !== void 0) {
    return [
      { type: "bytes32" },
      keccak2562(encodeData({ data: value, primaryType: type, types }))
    ];
  }
  if (type === "bytes")
    return [{ type: "bytes32" }, keccak2562(value)];
  if (type === "string")
    return [{ type: "bytes32" }, keccak2562(toHex4(value))];
  if (type.lastIndexOf("]") === type.length - 1) {
    const parsedType = type.slice(0, type.lastIndexOf("["));
    const typeValuePairs = value.map((item) => encodeField({
      name,
      type: parsedType,
      types,
      value: item
    }));
    return [
      { type: "bytes32" },
      keccak2562(encodeAbiParameters(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v)))
    ];
  }
  return [{ type }, value];
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/signature/recoverTypedDataAddress.js
async function recoverTypedDataAddress(parameters) {
  const { domain, message, primaryType, signature: signature2, types } = parameters;
  return recoverAddress2({
    hash: hashTypedData({
      domain,
      message,
      primaryType,
      types
    }),
    signature: signature2
  });
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/utils/unit/parseUnits.js
init_Value();
function parseUnits(value, decimals) {
  return from10(value, decimals);
}

// packages/payment-adapters/node_modules/.pnpm/viem@2.57.4_zod@4.6.7/node_modules/viem/_esm/index.js
init_getAddress();

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/Assets.js
var knownAsset = /* @__PURE__ */ Symbol("mppx.x402.asset");
function define(parameters) {
  return {
    [knownAsset]: true,
    address: parameters.address,
    decimals: parameters.decimals,
    network: parameters.network,
    transfer: parameters.transfer
  };
}
function fromToken(token, parameters) {
  const resolved = token(parameters.chainId);
  return define({
    address: resolved.address,
    decimals: resolved.decimals,
    network: toNetwork(parameters.chainId),
    transfer: withTokenDefaults(parameters.transfer, resolved)
  });
}
var base = {
  USDC: define({
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    network: "eip155:8453",
    transfer: {
      // USDC's EIP-712 domain name differs between Base and Base Sepolia.
      name: "USD Coin",
      type: "eip3009",
      version: "2"
    }
  })
};
var baseSepolia = {
  USDC: define({
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    network: "eip155:84532",
    transfer: {
      // Base Sepolia test USDC signs with the shorter EIP-712 domain name.
      name: "USDC",
      type: "eip3009",
      version: "2"
    }
  })
};
var celo = {
  USDC: define({
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    decimals: 6,
    network: "eip155:42220",
    transfer: {
      // Celo USDC signs with the shorter EIP-712 domain name.
      name: "USDC",
      type: "eip3009",
      version: "2"
    }
  }),
  USDT: define({
    address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    decimals: 6,
    network: "eip155:42220",
    transfer: {
      // Celo USDT signs with domain version "1", unlike Circle's FiatToken "2".
      name: "Tether USD",
      type: "eip3009",
      version: "1"
    }
  })
};
var celoSepolia = {
  USDC: define({
    address: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
    decimals: 6,
    network: "eip155:11142220",
    transfer: {
      name: "USDC",
      type: "eip3009",
      version: "2"
    }
  })
};
function isAsset(value) {
  if (typeof value !== "object" || value === null)
    return false;
  return value[knownAsset] === true;
}
function isToken(value) {
  return typeof value === "function" && typeof value.addresses === "object" && typeof value.decimals === "number";
}
function isRawAddress(currency) {
  return typeof currency === "string";
}
function resolve2(currency, network) {
  if (isAsset(currency)) {
    if (currency.network !== network)
      return void 0;
    return {
      address: currency.address,
      decimals: currency.decimals,
      transfer: currency.transfer
    };
  }
  if (isToken(currency)) {
    const address3 = currency.addresses[toChainId(network)];
    if (!address3)
      return void 0;
    return {
      address: address3,
      decimals: currency.decimals,
      name: currency.name
    };
  }
  return {
    address: currency
  };
}
function matches2(currency, acceptedCurrency, network) {
  const resolved = resolve2(currency, network);
  if (!resolved)
    return false;
  return getAddress(resolved.address) === getAddress(acceptedCurrency);
}
function toNetwork(chainId) {
  return `eip155:${chainId}`;
}
function toChainId(network) {
  return Number(network.slice("eip155:".length));
}
function withTokenDefaults(transfer, token) {
  if (transfer.type !== "eip3009")
    return transfer;
  if (transfer.name)
    return { ...transfer, name: transfer.name };
  if (!token.name)
    throw new Error("EIP-3009 token assets require a token name.");
  return {
    ...transfer,
    name: token.name
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/Chains.js
var Chains_exports = {};
__export(Chains_exports, {
  base: () => base2,
  baseSepolia: () => baseSepolia2,
  celo: () => celo2,
  celoSepolia: () => celoSepolia2
});
var base2 = 8453;
var baseSepolia2 = 84532;
var celo2 = 42220;
var celoSepolia2 = 11142220;

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Method.js
function from11(method) {
  return method;
}
function toClient(method, options) {
  const { canHandleChallenge: canHandleChallenge2, context, createCredential: createCredential2 } = options;
  return {
    ...method,
    canHandleChallenge: canHandleChallenge2,
    context,
    createCredential: createCredential2
  };
}
function toServer(method, options) {
  const { alias, authorize, canOffer, defaults: defaults2, extensions, html: html2, onPaymentSuccess, preflight: preflight2, request: request2, respond, broadcast, stableBinding, transport, validate: validate5, verify: verify5 } = options;
  const effectiveVerify = verify5 ?? (async (parameters) => {
    if (validate5)
      await validate5({ ...parameters, operation: "broadcast" });
    if (!broadcast)
      throw new VerificationFailedError({
        reason: `${method.name}/${method.intent} does not support credential broadcast`
      });
    return broadcast(parameters);
  });
  return {
    ...method,
    alias,
    authorize,
    canOffer,
    defaults: defaults2,
    extensions,
    html: html2,
    onPaymentSuccess,
    preflight: preflight2,
    request: request2,
    respond,
    broadcast,
    stableBinding,
    transport,
    validate: validate5,
    verify: effectiveVerify
  };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/internal/RouteBinding.js
function nonce(parameters) {
  const input = [
    serialize(parameters.accepted),
    serialize(parameters.resource),
    serialize(parameters.extensions)
  ].join("|");
  return Hash_exports.sha256(Bytes_exports.fromString(input), { as: "Hex" });
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/client/Exact.js
async function createCredential(parameters) {
  const account = parameters.context?.account ?? parameters.config.account;
  if (!account?.signTypedData)
    throw new Error("x402 exact requires a typed-data signer.");
  const request2 = parameters.challenge.request;
  const accepted = toPaymentRequirements(request2);
  assertPolicy(parameters.config, accepted);
  if (!request2.resource)
    throw new Error("x402 exact EIP-3009 requires resource information.");
  const extensions = request2.extensions?.mppx ? withNonceSalt(request2.extensions) : request2.extensions;
  const transferMethod = accepted.extra?.assetTransferMethod ?? "eip3009";
  if (transferMethod !== "eip3009")
    throw new Error(`x402 exact ${String(transferMethod)} signing is not implemented yet.`);
  const name = accepted.extra?.name;
  const version4 = accepted.extra?.version;
  if (typeof name !== "string" || typeof version4 !== "string")
    throw new Error("x402 exact EIP-3009 requires token name and version.");
  const now = Math.floor(Date.now() / 1e3);
  const authorization = {
    from: getAddress(account.address),
    nonce: extensions?.mppx ? nonce({
      accepted,
      extensions,
      resource: request2.resource
    }) : randomAuthorizationNonce(),
    to: getAddress(accepted.payTo),
    validAfter: (now - 600).toString(),
    validBefore: (now + accepted.maxTimeoutSeconds).toString(),
    value: accepted.amount
  };
  const signature2 = await account.signTypedData({
    domain: {
      chainId: chainIdOf(accepted.network),
      name,
      verifyingContract: getAddress(accepted.asset),
      version: version4
    },
    message: {
      ...authorization,
      value: BigInt(authorization.value),
      validAfter: BigInt(authorization.validAfter),
      validBefore: BigInt(authorization.validBefore)
    },
    primaryType: "TransferWithAuthorization",
    types: authorizationTypes
  });
  return encodePaymentSignature({
    accepted,
    ...extensions ? { extensions } : {},
    payload: {
      authorization,
      signature: signature2
    },
    ...request2.resource ? { resource: request2.resource } : {},
    x402Version: 2
  });
}
function canHandleChallenge(parameters) {
  const request2 = parameters.challenge.request;
  let accepted;
  try {
    accepted = toPaymentRequirements(request2);
    assertPolicy(parameters.config, accepted);
  } catch {
    return false;
  }
  if (!request2.resource)
    return false;
  const transferMethod = accepted.extra?.assetTransferMethod ?? "eip3009";
  if (transferMethod !== "eip3009")
    return false;
  const name = accepted.extra?.name;
  const version4 = accepted.extra?.version;
  return typeof name === "string" && typeof version4 === "string";
}
var authorizationTypes = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
};
function chainIdOf(network) {
  return Number(network.slice(evmNetworkPrefix.length));
}
function assertPolicy(parameters, accepted) {
  const chainId = chainIdOf(accepted.network);
  if (parameters.networks && !parameters.networks.includes(chainId))
    throw new Error(`x402 exact chain ID is not allowed: ${chainId}.`);
  const currencies = parameters.currencies ?? parameters.assets;
  if (currencies?.some((currency) => isRawAddress(currency)) && !parameters.networks?.length)
    throw new Error("x402 exact raw currency allowlists require networks.");
  if (currencies) {
    const acceptedCurrency = getAddress(accepted.asset);
    const allowed = currencies.some((currency) => matches2(currency, acceptedCurrency, accepted.network));
    if (!allowed)
      throw new Error(`x402 exact currency is not allowed: ${acceptedCurrency}.`);
  }
  if (parameters.maxAtomicAmount !== void 0 && BigInt(accepted.amount) > BigInt(parameters.maxAtomicAmount))
    throw new Error("x402 exact amount exceeds maxAtomicAmount.");
  if (parameters.maxAmount !== void 0) {
    const decimals = decimalsOfAcceptedCurrency(parameters, accepted);
    if (decimals === void 0)
      throw new Error("x402 exact maxAmount requires currency decimals.");
    if (BigInt(accepted.amount) > parseUnits(parameters.maxAmount, decimals))
      throw new Error("x402 exact amount exceeds maxAmount.");
  }
}
function decimalsOfAcceptedCurrency(parameters, accepted) {
  const currencies = parameters.currencies ?? parameters.assets;
  const acceptedCurrency = getAddress(accepted.asset);
  const currency = currencies?.find((currency2) => matches2(currency2, acceptedCurrency, accepted.network));
  const resolved = currency ? resolve2(currency, accepted.network) : void 0;
  if (resolved?.decimals !== void 0)
    return resolved.decimals;
  return parameters.decimals;
}
function withNonceSalt(extensions) {
  const mppx = extensions.mppx;
  if (!mppx)
    return extensions;
  return {
    ...extensions,
    mppx: {
      ...mppx,
      info: {
        ...mppx.info,
        nonce: randomNonceSalt()
      }
    }
  };
}
function randomNonceSalt() {
  return randomBytes32().slice(2);
}
function randomAuthorizationNonce() {
  return randomBytes32();
}
function randomBytes32() {
  const crypto3 = globalThis.crypto;
  if (!crypto3?.getRandomValues)
    throw new Error("x402 exact requires crypto randomness.");
  const bytes = crypto3.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/Types.js
var paymentMethod2 = "evm";
var chargeIntent = "charge";
var evmNetworkPrefix2 = "eip155:";
var eip3009 = "eip3009";
var credentialTypes = ["authorization"];
var atomicAmount2 = string2().check(_regex(/^\d+$/, "Invalid atomic amount"));
var AuthorizationConfigSchema = object({
  name: string2().check(_minLength(1)),
  version: string2().check(_minLength(1))
});
var MethodDetailsSchema = object({
  chainId: number2(),
  credentialTypes: optional(array(_enum(credentialTypes)).check(_minLength(1))),
  decimals: optional(number2()),
  permit2Address: optional(address()),
  splits: optional(array(object({
    amount: atomicAmount2,
    recipient: address()
  })))
});
var ChargeRequestSchema = object({
  amount: atomicAmount2,
  currency: address(),
  description: optional(string2()),
  externalId: optional(string2()),
  methodDetails: MethodDetailsSchema,
  recipient: address()
});
var ChargeRequestInputSchema = object({
  amount: amount(),
  chainId: number2(),
  currency: address(),
  credentialTypes: optional(array(_enum(credentialTypes)).check(_minLength(1))),
  decimals: number2(),
  description: optional(string2()),
  externalId: optional(string2()),
  permit2Address: optional(address()),
  recipient: address(),
  splits: optional(array(object({
    amount: atomicAmount2,
    recipient: address()
  })))
});
var AuthorizationPayloadSchema = object({
  from: address(),
  nonce: hash(),
  signature: signature(),
  to: address(),
  type: literal("authorization"),
  validAfter: atomicAmount2,
  validBefore: atomicAmount2,
  value: atomicAmount2
});
var ChargePayloadSchema = AuthorizationPayloadSchema;
var authorizationTypes2 = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
};
function authorizationDomain(parameters) {
  return {
    chainId: parameters.chainId,
    name: parameters.authorization.name,
    verifyingContract: parameters.currency,
    version: parameters.authorization.version
  };
}
function challengeHash(challenge2) {
  return Hash_exports.keccak256(Bytes_exports.fromString(JSON.stringify([challenge2.id, challenge2.realm])), {
    as: "Hex"
  });
}
function networkOf(chainId) {
  return `${evmNetworkPrefix2}${chainId}`;
}
function toSource(parameters) {
  return `did:pkh:eip155:${parameters.chainId}:${parameters.address}`;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/Methods.js
var charge = from11({
  name: paymentMethod2,
  intent: chargeIntent,
  schema: {
    credential: {
      payload: ChargePayloadSchema
    },
    request: pipe(ChargeRequestInputSchema, transform(({ amount: amount2, chainId, credentialTypes: credentialTypes2 = ["authorization"], currency, decimals, permit2Address, recipient, splits, ...request2 }) => ({
      ...request2,
      amount: parseUnits(amount2, decimals).toString(),
      currency: getAddress(currency),
      methodDetails: {
        chainId,
        credentialTypes: credentialTypes2,
        decimals,
        ...permit2Address ? { permit2Address: getAddress(permit2Address) } : {},
        ...splits ? { splits } : {}
      },
      recipient: getAddress(recipient)
    })))
  }
});

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/client/Charge.js
function charge2(parameters) {
  return toClient(charge, {
    canHandleChallenge({ challenge: challenge2 }) {
      if (!isX402Challenge(challenge2))
        return true;
      return canHandleChallenge({
        challenge: challenge2,
        config: parameters
      });
    },
    context: object({
      account: optional(custom())
    }),
    async createCredential({ challenge: challenge2, context }) {
      if (isX402Challenge(challenge2))
        return createCredential({
          challenge: challenge2,
          config: parameters,
          context
        });
      const account = context?.account ?? parameters.account;
      if (!account?.signTypedData)
        throw new Error("EVM authorization requires a typed-data signer.");
      const request2 = challenge2.request;
      assertPolicy2(parameters, request2);
      if (!request2.methodDetails.credentialTypes?.includes("authorization")) {
        throw new Error("EVM authorization is not accepted by this challenge.");
      }
      if (request2.methodDetails.splits?.length) {
        throw new Error("EVM authorization does not support payment splits.");
      }
      const authorization = resolveAuthorization(parameters, request2);
      const validBefore = challenge2.expires ? Math.floor(new Date(challenge2.expires).getTime() / 1e3).toString() : (Math.floor(Date.now() / 1e3) + 300).toString();
      const payload = {
        from: getAddress(account.address),
        nonce: challengeHash(challenge2),
        signature: await account.signTypedData({
          domain: authorizationDomain({
            authorization,
            chainId: request2.methodDetails.chainId,
            currency: request2.currency
          }),
          message: {
            from: getAddress(account.address),
            nonce: challengeHash(challenge2),
            to: getAddress(request2.recipient),
            validAfter: 0n,
            validBefore: BigInt(validBefore),
            value: BigInt(request2.amount)
          },
          primaryType: "TransferWithAuthorization",
          types: authorizationTypes2
        }),
        to: getAddress(request2.recipient),
        type: "authorization",
        validAfter: "0",
        validBefore,
        value: request2.amount
      };
      return serialize3(from6({
        challenge: challenge2,
        payload,
        source: toSource({
          address: getAddress(account.address),
          chainId: request2.methodDetails.chainId
        })
      }));
    }
  });
}
function isX402Challenge(challenge2) {
  return is(challenge2) && challenge2.request.scheme === "exact" && typeof challenge2.request.network === "string";
}
function assertPolicy2(parameters, request2) {
  const chainId = request2.methodDetails.chainId;
  const network = networkOf(chainId);
  if (parameters.networks && !parameters.networks.includes(chainId))
    throw new Error(`EVM chain ID is not allowed: ${chainId}.`);
  const currencies = parameters.currencies ?? parameters.assets;
  if (currencies?.some((currency) => isRawAddress(currency)) && !parameters.networks?.length)
    throw new Error("EVM raw currency allowlists require networks.");
  if (currencies) {
    const acceptedCurrency = getAddress(request2.currency);
    const allowed = currencies.some((currency) => matches2(currency, acceptedCurrency, network));
    if (!allowed)
      throw new Error(`EVM currency is not allowed: ${acceptedCurrency}.`);
  }
  if (parameters.maxAtomicAmount !== void 0 && BigInt(request2.amount) > BigInt(parameters.maxAtomicAmount))
    throw new Error("EVM charge amount exceeds maxAtomicAmount.");
  if (parameters.maxAmount !== void 0) {
    const decimals = decimalsOfAcceptedCurrency2(parameters, request2);
    if (decimals === void 0)
      throw new Error("EVM charge maxAmount requires currency decimals.");
    if (BigInt(request2.amount) > parseUnits(parameters.maxAmount, decimals))
      throw new Error("EVM charge amount exceeds maxAmount.");
  }
}
function resolveAuthorization(parameters, request2) {
  const currencies = parameters.currencies ?? parameters.assets;
  const acceptedCurrency = getAddress(request2.currency);
  const network = networkOf(request2.methodDetails.chainId);
  const currency = currencies?.find((currency2) => matches2(currency2, acceptedCurrency, network));
  const resolved = currency ? resolve2(currency, network) : void 0;
  if (resolved?.transfer?.type === eip3009)
    return {
      name: resolved.transfer.name,
      version: resolved.transfer.version
    };
  if (parameters.authorization)
    return parameters.authorization;
  throw new Error("EVM authorization requires token name and version.");
}
function decimalsOfAcceptedCurrency2(parameters, request2) {
  const currencies = parameters.currencies ?? parameters.assets;
  const acceptedCurrency = getAddress(request2.currency);
  const network = networkOf(request2.methodDetails.chainId);
  const currency = currencies?.find((currency2) => matches2(currency2, acceptedCurrency, network));
  const resolved = currency ? resolve2(currency, network) : void 0;
  if (resolved?.decimals !== void 0)
    return resolved.decimals;
  return parameters.decimals;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/client/Methods.js
function evm(parameters) {
  return [evm.charge(parameters)];
}
(function(evm3) {
  evm3.charge = charge2;
  evm3.assets = Assets_exports;
  evm3.chains = Chains_exports;
})(evm || (evm = {}));

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/Mppx.js
var Mppx_exports = {};
__export(Mppx_exports, {
  create: () => create2,
  restore: () => restore2
});

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/identity/Headers.js
var request = Object.freeze(["identity-attestation"]);
var response = Object.freeze([
  "identity-attestation-required",
  "identity-required"
]);

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/client/Mppx.js
var preparedPaymentMethods = /* @__PURE__ */ new WeakMap();
function create2(config2) {
  const { identity, maxPaymentRetries, onChallenge, orderChallenges, polyfill: polyfill2 = true, acceptPaymentPolicy = polyfill2 && typeof globalThis.location !== "undefined" ? "same-origin" : "always", transport = http(), trustedTempoProofRealms } = config2;
  if ("attestation" in config2)
    throw new TypeError("Mppx client `attestation` was replaced by `identity: [prover]`.");
  const rawFetch = unwrapFetch(config2.fetch ?? globalThis.fetch);
  const identityClient = identity ? from7(identity) : config2.fetch && identityOf(config2.fetch);
  const methods = config2.methods.flat();
  const acceptPayment = resolve(methods, config2.paymentPreferences);
  const events = createEventDispatcher();
  const resolvedOnChallenge = onChallenge;
  const config_fetch = {
    acceptPayment,
    acceptPaymentPolicy,
    ...config2.fetch && { fetch: rawFetch },
    ...identityClient && { identity: identityClient },
    eventDispatcher: events,
    ...maxPaymentRetries !== void 0 && { maxPaymentRetries },
    ...resolvedOnChallenge && { onChallenge: resolvedOnChallenge },
    ...orderChallenges && { orderChallenges },
    methods,
    transport,
    ...trustedTempoProofRealms && { trustedTempoProofRealms }
  };
  const fetch = from9(config_fetch);
  if (polyfill2)
    polyfill(config_fetch);
  function onChallengeReceived(handler) {
    return events.on("challenge.received", handler);
  }
  function onCredentialCreated(handler) {
    return events.on("credential.created", handler);
  }
  function onPaymentFailed(handler) {
    return events.on("payment.failed", handler);
  }
  function onPaymentResponse(handler) {
    return events.on("payment.response", handler);
  }
  async function preparePayment(response2, options, selectionContext) {
    const eventResponse = snapshotResponse2(response2);
    const challenges = await transport.getChallenges(response2, options?.request);
    const challengeSnapshots = Object.freeze(challenges.map((candidate) => snapshotValue2(candidate)));
    const preferences = resolveChallengePreferences(acceptPayment.entries, options?.acceptPayment);
    let challenge2;
    let mi;
    try {
      let candidates = selectChallengeCandidates(challenges, methods, preferences, selectionContext);
      if (candidates.length === 0 && selectionContext === void 0)
        candidates = selectChallengeCandidates(challenges, methods, preferences, deferredContext);
      const orderedCandidates = await resolveChallengeOrder2(candidates, options?.orderChallenges ?? orderChallenges);
      const selected = orderedCandidates[0];
      if (!selected)
        throw new Error(`No method found for challenges: ${challenges.map((challenge3) => `${challenge3.method}.${challenge3.intent}`).join(", ")}. Available: ${methods.map((m) => `${m.name}.${m.intent}`).join(", ")}`);
      const transportChallenge = selected.challenge;
      challenge2 = challengeSnapshots[selected.index];
      mi = selected.method;
      if (challenge2.expires)
        assert(challenge2.expires, challenge2.id);
      const responseUrl = resolveResponseUrl(response2);
      if (responseUrl)
        assert6(challenge2, responseUrl, trustedTempoProofRealms);
      else if (transport.name === "mcp")
        assertWithoutOrigin(challenge2, trustedTempoProofRealms && Object.values(trustedTempoProofRealms));
      const selectedChallenge = challenge2;
      const selectedMethod = mi;
      const createPreparedCredential = memoizeCreateCredential2(async (context) => {
        try {
          if (selectedChallenge.expires)
            assert(selectedChallenge.expires, selectedChallenge.id);
          const createCredential2 = memoizeCreateCredential2((overrideContext) => createCredentialForMethod(selectedChallenge, selectedMethod, overrideContext ?? context, responseUrl?.origin));
          const eventCredential = await events.emit("challenge.received", createChallengeReceivedPayload2({
            challenge: selectedChallenge,
            challenges,
            createCredential: createCredential2,
            method: selectedMethod,
            response: eventResponse
          }));
          const credential = eventCredential ?? await createCredential2();
          validateCredentialHeaderValue(credential);
          await events.emit("credential.created", createCredentialCreatedPayload2({
            challenge: selectedChallenge,
            credential,
            method: selectedMethod,
            response: eventResponse
          }));
          return credential;
        } catch (error) {
          await events.emit("payment.failed", createPaymentFailedPayload2({
            challenge: selectedChallenge,
            challenges,
            error,
            method: selectedMethod,
            response: eventResponse
          }));
          throw error;
        }
      });
      const prepared = Object.freeze({
        challenge: selectedChallenge,
        challenges: challengeSnapshots,
        createCredential: createPreparedCredential,
        method: snapshotMethod2(selectedMethod),
        setCredential(request2, credential) {
          validateCredentialHeaderValue(credential);
          return transport.setCredential(request2, credential, { challenge: transportChallenge });
        }
      });
      preparedPaymentMethods.set(prepared, selectedMethod);
      return prepared;
    } catch (error) {
      await events.emit("payment.failed", createPaymentFailedPayload2({
        challenge: challenge2,
        challenges,
        error,
        method: mi,
        response: eventResponse
      }));
      throw error;
    }
  }
  async function prepareRequest(input, init, options) {
    const { maxRedirects = 20, requirePayment = false, ...paymentOptions } = options ?? {};
    const preparedHttp = await prepareHttpRequest({
      acceptPayment: acceptPayment.header,
      acceptPaymentPolicy,
      fetch: rawFetch,
      init,
      input,
      maxRedirects,
      identity: identityClient
    });
    const requestInit2 = requestToInit(preparedHttp.replayRequest, preparedHttp.body);
    if (!await transport.isPaymentRequired(preparedHttp.response, requestInit2)) {
      if (requirePayment)
        throw new Error("Response does not require payment.");
      return Object.freeze({
        payment: void 0,
        request: preparedHttp.request,
        response: preparedHttp.response,
        redirects: preparedHttp.redirects
      });
    }
    const payment = await preparePayment(preparedHttp.response, {
      ...paymentOptions,
      request: requestInit2
    });
    assert6(payment.challenge, new URL(preparedHttp.replayRequest.url), trustedTempoProofRealms);
    const paymentMethod3 = preparedPaymentMethods.get(payment) ?? payment.method;
    const createRequestCredential = memoizeCreateCredential2(async (context) => {
      await identityClient?.challenge(preparedHttp.response, { challenge: payment.challenge }, preparedHttp.replayRequest.url);
      if (has(paymentMethod3))
        await handle(paymentMethod3, {
          challenge: payment.challenge,
          context,
          fetch: identityClient ? wrapFetch(rawFetch, identityClient, { challenge: payment.challenge }) : rawFetch,
          input: preparedHttp.replayRequest,
          signal: preparedHttp.replayRequest.signal
        });
      return payment.createCredential(context);
    });
    const preparedPayment = Object.freeze({
      ...payment,
      createCredential: createRequestCredential,
      async pay(context) {
        const credential = await createRequestCredential(context);
        const paidInit = payment.setCredential(requestToInit(preparedHttp.replayRequest, preparedHttp.body), credential);
        const paidRequest = new Request(preparedHttp.replayRequest.url, {
          ...paidInit,
          redirect: "manual"
        });
        if (!identityClient)
          return rawFetch(paidRequest);
        const { response: response2 } = await identityClient.send(rawFetch, paidRequest, {
          challenge: payment.challenge,
          headers: preparedHttp.identityHeaders
        });
        return response2;
      }
    });
    return Object.freeze({
      payment: preparedPayment,
      request: preparedHttp.request,
      response: preparedHttp.response,
      redirects: preparedHttp.redirects
    });
  }
  return {
    fetch,
    rawFetch,
    methods,
    transport,
    on: events.on,
    onChallengeReceived,
    onCredentialCreated,
    onPaymentFailed,
    onPaymentResponse,
    preparePayment,
    prepareRequest,
    async createCredential(response2, context, options) {
      const prepared = await preparePayment(response2, options, context);
      return prepared.createCredential(context);
    }
  };
}
function restore2() {
  restore();
}
var redirectStatuses = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
var bodyHeaders = [
  "content-encoding",
  "content-language",
  "content-length",
  "content-location",
  "content-type",
  "transfer-encoding"
];
var crossOriginHeaders = [
  "authorization",
  "cookie",
  "cookie2",
  "host",
  "payment-authorization",
  "payment-signature",
  "proxy-authorization",
  "x-payment"
];
async function prepareHttpRequest(parameters) {
  const { acceptPayment, acceptPaymentPolicy, fetch, identity, init, input, maxRedirects } = parameters;
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0)
    throw new TypeError("maxRedirects must be a non-negative integer.");
  const stripped = /* @__PURE__ */ new Set([
    ...crossOriginHeaders,
    ...request,
    ...identity?.headers ?? []
  ]);
  let request2 = new Request(input, { ...init, redirect: "manual" });
  const explicitAcceptPayment = request2.headers.has(Headers2.acceptPayment);
  let body = await replayBody(request2, init?.body);
  const redirects = [];
  for (; ; ) {
    request2 = withAcceptPayment(request2, acceptPayment, explicitAcceptPayment, acceptPaymentPolicy);
    const { request: sentRequest, response: response2, headers: identityHeaders } = await (async () => {
      if (identity)
        return identity.send(fetch, request2.clone());
      const sent = request2.clone();
      return { request: sent, response: await fetch(sent), headers: [] };
    })();
    if (response2.type === "opaqueredirect" || response2.status === 0)
      throw new Error("prepareRequest requires a runtime that exposes manual redirect responses.");
    if (!redirectStatuses.has(response2.status))
      return {
        body,
        identityHeaders,
        replayRequest: request2,
        request: sentRequest,
        response: response2,
        redirects: Object.freeze(redirects)
      };
    const location = response2.headers.get("location");
    if (!location)
      return {
        body,
        identityHeaders,
        replayRequest: request2,
        request: sentRequest,
        response: response2,
        redirects: Object.freeze(redirects)
      };
    if (redirects.length >= maxRedirects) {
      await response2.body?.cancel();
      throw new Error(`Payment request exceeded ${maxRedirects} redirects.`);
    }
    const from14 = new URL(request2.url);
    const to = new URL(location, from14);
    if (from14.protocol === "https:" && to.protocol !== "https:") {
      await response2.body?.cancel();
      throw new Error(`Payment request refused HTTPS downgrade redirect to ${to.href}`);
    }
    const headers = new Headers(request2.headers);
    let method = request2.method;
    const switchesToGet = (response2.status === 301 || response2.status === 302) && method === "POST" || response2.status === 303 && method !== "GET" && method !== "HEAD";
    if (switchesToGet) {
      method = "GET";
      body = void 0;
      for (const header2 of bodyHeaders)
        headers.delete(header2);
    }
    if (from14.origin !== to.origin)
      for (const header2 of [...headers.keys()]) {
        const value = headers.get(header2) ?? "";
        if (stripped.has(header2) || value.startsWith("Payment "))
          headers.delete(header2);
      }
    redirects.push(Object.freeze({ from: from14.href, status: response2.status, to: to.href }));
    await response2.body?.cancel();
    request2 = new Request(to, requestInit(request2, headers, method, body));
  }
}
function requestToInit(request2, body) {
  return requestInit(request2, new Headers(request2.headers), request2.method, body);
}
async function replayBody(request2, suppliedBody) {
  if (typeof suppliedBody === "string")
    return suppliedBody;
  if (!request2.body)
    return void 0;
  const accept = request2.headers.get("accept")?.toLowerCase() ?? "";
  if (request2.headers.has("mcp-method") || accept.includes("application/json") && accept.includes("text/event-stream"))
    return request2.clone().text();
  return request2.clone().arrayBuffer();
}
function withAcceptPayment(request2, acceptPayment, explicit, policy) {
  if (explicit)
    return request2;
  const headers = new Headers(request2.headers);
  headers.delete(Headers2.acceptPayment);
  if (acceptPayment && shouldInjectForPolicy(request2, policy))
    headers.set(Headers2.acceptPayment, acceptPayment);
  return new Request(request2, { headers });
}
function requestInit(request2, headers, method, body) {
  return {
    ...body ? { body } : {},
    cache: request2.cache,
    credentials: request2.credentials,
    headers,
    integrity: request2.integrity,
    keepalive: request2.keepalive,
    method,
    mode: request2.mode,
    redirect: "manual",
    referrer: request2.referrer,
    referrerPolicy: request2.referrerPolicy,
    signal: request2.signal
  };
}
function memoizeCreateCredential2(createCredential2) {
  let promise;
  return (context) => {
    promise ??= createCredential2(context);
    return promise;
  };
}
function createChallengeReceivedPayload2(parameters) {
  return Object.freeze({
    challenge: snapshotValue2(parameters.challenge),
    challenges: parameters.challenges.map((challenge2) => snapshotValue2(challenge2)),
    createCredential: parameters.createCredential,
    method: snapshotMethod2(parameters.method),
    response: snapshotResponse2(parameters.response)
  });
}
function createCredentialCreatedPayload2(parameters) {
  return Object.freeze({
    challenge: snapshotValue2(parameters.challenge),
    credential: parameters.credential,
    method: snapshotMethod2(parameters.method),
    response: snapshotResponse2(parameters.response)
  });
}
function createPaymentFailedPayload2(parameters) {
  return Object.freeze({
    ...parameters.challenge ? { challenge: snapshotValue2(parameters.challenge) } : {},
    ...parameters.challenges ? { challenges: parameters.challenges.map((challenge2) => snapshotValue2(challenge2)) } : {},
    error: parameters.error,
    ...parameters.method ? { method: snapshotMethod2(parameters.method) } : {},
    response: snapshotResponse2(parameters.response)
  });
}
function snapshotMethod2(method) {
  return freezeSnapshot2(Object.assign({}, method));
}
function snapshotResponse2(response2) {
  if (response2 instanceof Response) {
    if (response2.body === null)
      return response2.clone();
    return new Response(null, {
      headers: response2.headers,
      status: response2.status,
      statusText: response2.statusText
    });
  }
  return snapshotValue2(response2);
}
function snapshotValue2(value) {
  try {
    const snapshot = structuredClone(value);
    if (value && snapshot && typeof value === "object" && typeof snapshot === "object")
      for (const symbol of Object.getOwnPropertySymbols(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, symbol);
        if (descriptor)
          Object.defineProperty(snapshot, symbol, descriptor);
      }
    return deepFreeze2(snapshot);
  } catch {
    return freezeSnapshot2(value);
  }
}
function deepFreeze2(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  Object.freeze(value);
  for (const child of Object.values(value))
    deepFreeze2(child);
  return value;
}
function freezeSnapshot2(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  Object.freeze(value);
  return value;
}
function resolveChallengePreferences(fallback, override) {
  if (!override)
    return fallback;
  return typeof override === "string" ? parse4(override) : override;
}
async function resolveChallengeOrder2(candidates, orderChallenges) {
  return orderChallenges ? orderChallenges(candidates) : candidates;
}
async function createCredentialForMethod(challenge2, mi, context, origin) {
  const parsedContext = mi.context && context !== void 0 ? mi.context.parse(context) : void 0;
  const parameters = parsedContext !== void 0 ? { challenge: challenge2, context: parsedContext } : { challenge: challenge2 };
  if (origin)
    attachOrigin(parameters, origin);
  return mi.createCredential(parameters);
}
function resolveResponseUrl(response2) {
  if (typeof Response !== "undefined" && response2 instanceof Response && response2.url)
    return new URL(response2.url);
  return void 0;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/Receipt.js
var shape = {
  /** Currency actually debited to fund the payment, when known. */
  fundingCurrency: optional(string2()),
  /** Payment method used (e.g., "tempo", "stripe"). */
  method: string2(),
  /** Method-specific reference (e.g., transaction hash). */
  reference: string2(),
  /** Optional external reference ID echoed from the credential payload. */
  externalId: optional(string2()),
  /** Optional server-issued subscription identifier for recurring payments. */
  subscriptionId: optional(string2()),
  /** Payment status. Always "success" — failures use 402 + Problem Details. */
  status: literal("success"),
  /** RFC 3339 settlement timestamp. */
  timestamp: datetime2()
};
var BaseSchema = object(shape);
var Schema2 = looseObject(shape);
function from12(parameters) {
  return Schema2.parse(parameters);
}
function serialize6(receipt) {
  const json = JSON.stringify(receipt);
  return Base64_exports.fromString(json, { pad: false, url: true });
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/html/compose.main.gen.js
var tabScript = '<script>(function(){let e={serviceWorker:`__mppx_worker`,tab:`__mppx_tab`},t={error:`mppx-error`,header:`mppx-header`,logo:`mppx-logo`,summary:`mppx-summary`,summaryAmount:`mppx-summary-amount`,summaryDescription:`mppx-summary-description`,summaryExpires:`mppx-summary-expires`,tab:`mppx-tab`,tabList:`mppx-tablist`,tabPanel:`mppx-tabpanel`},n=document.querySelector(`.${t.tabList}`),r=document.querySelector(`.${t.summary}`),i=r.querySelector(`.${t.summaryAmount}`),a=Array.from(n.querySelectorAll(`[role="tab"]`)),o=[],s={};for(let e of a){let t=e.textContent.trim().toLowerCase();s[t]=(s[t]||0)+1,o.push(s[t]===1?t:`${t}-${s[t]}`)}function c(e){if(i.textContent=e.dataset.amount,r.querySelector(`.${t.summaryDescription}`)?.remove(),e.dataset.description){let n=document.createElement(`p`);n.className=t.summaryDescription,n.textContent=e.dataset.description,i.after(n)}if(r.querySelector(`.${t.summaryExpires}`)?.remove(),e.dataset.expires){let n=document.createElement(`p`);n.className=t.summaryExpires;let i=new Date(e.dataset.expires),a=document.createElement(`time`);a.dateTime=i.toISOString(),a.textContent=i.toLocaleString(),n.textContent=`${e.dataset.expiresLabel} `,n.appendChild(a),r.appendChild(n)}}function l(t,n=!0){if(a.forEach(e=>{e.setAttribute(`aria-selected`,`false`),e.setAttribute(`tabindex`,`-1`)}),t.setAttribute(`aria-selected`,`true`),t.removeAttribute(`tabindex`),t.focus(),document.querySelectorAll(`[role="tabpanel"]`).forEach(e=>{e.hidden=!0}),document.getElementById(t.getAttribute(`aria-controls`)).hidden=!1,c(t),n){let n=new URL(location.href);n.searchParams.set(e.tab,o[a.indexOf(t)]),history.replaceState(null,``,n)}}let u=new URL(location.href).searchParams.get(e.tab);if(u!==null){let e=o.indexOf(u);e>=0&&l(a[e],!1)}n.addEventListener(`click`,e=>{let t=e.target.closest(`[role="tab"]`);t&&l(t)}),n.addEventListener(`keydown`,e=>{let t=a.indexOf(e.target);if(t<0)return;let n;e.key===`ArrowRight`?n=a[(t+1)%a.length]:e.key===`ArrowLeft`?n=a[(t-1+a.length)%a.length]:e.key===`Home`?n=a[0]:e.key===`End`&&(n=a[a.length-1]),n&&(e.preventDefault(),l(n))})})();</script>';

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/html/constants.js
var ids = {
  data: "__MPPX_DATA__",
  error: "root_error",
  root: "root"
};
var params = {
  serviceWorker: "__mppx_worker",
  tab: "__mppx_tab"
};
var attrs = {
  challengeId: "data-mppx-challenge-id",
  remaining: "data-remaining"
};
var classNames = {
  error: "mppx-error",
  header: "mppx-header",
  logo: "mppx-logo",
  summary: "mppx-summary",
  summaryAmount: "mppx-summary-amount",
  summaryDescription: "mppx-summary-description",
  summaryExpires: "mppx-summary-expires",
  tab: "mppx-tab",
  tabList: "mppx-tablist",
  tabPanel: "mppx-tabpanel"
};

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/html/config.js
async function resolveContent(content) {
  return typeof content === "function" ? content() : content;
}
function logoColorScheme(colorScheme) {
  return colorScheme === "dark" || colorScheme === "light" ? `${classNames.logo}--${colorScheme}` : void 0;
}
var CssVar = class {
  name;
  constructor(token) {
    this.name = `--mppx-${token}`;
  }
  toString() {
    return `var(${this.name})`;
  }
};
var vars = {
  accent: new CssVar("accent"),
  background: new CssVar("background"),
  border: new CssVar("border"),
  foreground: new CssVar("foreground"),
  muted: new CssVar("muted"),
  negative: new CssVar("negative"),
  positive: new CssVar("positive"),
  surface: new CssVar("surface"),
  fontFamily: new CssVar("font-family"),
  fontSizeBase: new CssVar("font-size-base"),
  radius: new CssVar("radius"),
  spacingUnit: new CssVar("spacing-unit")
};
var defaultText = {
  expires: "Expires at",
  pay: "Pay",
  paymentRequired: "Payment Required",
  title: "Payment Required"
};
var defaultTheme = {
  colorScheme: "light dark",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSizeBase: "16px",
  radius: "6px",
  spacingUnit: "2px",
  accent: ["#171717", "#ededed"],
  background: ["#ffffff", "#0a0a0a"],
  border: ["#e5e5e5", "#2e2e2e"],
  foreground: ["#0a0a0a", "#ededed"],
  muted: ["#666666", "#a1a1a1"],
  negative: ["#e5484d", "#e5484d"],
  positive: ["#30a46c", "#30a46c"],
  surface: ["#f5f5f5", "#1a1a1a"]
};
function resolveColor(value, fallback) {
  if (!value)
    return fallback;
  if (typeof value === "string")
    return [value, value];
  return value;
}
var colorTokens = [
  "accent",
  "negative",
  "positive",
  "background",
  "foreground",
  "muted",
  "surface",
  "border"
];
function resolveOptions(options) {
  const theme = mergeDefined({
    favicon: void 0,
    fontUrl: void 0,
    logo: void 0,
    ...defaultTheme
  }, options.theme ?? {});
  const textOverrides = options.text ?? void 0;
  const mergedText = mergeDefined(defaultText, textOverrides ?? {});
  const text = sanitizeRecord({
    ...mergedText,
    title: typeof textOverrides?.title === "string" && textOverrides.title.length > 0 ? mergedText.title : mergedText.paymentRequired
  });
  return { theme, text };
}
var html = String.raw;
function render(options) {
  const { entries, dataMap, formattedAmount, text, theme } = options;
  const firstChallenge = entries[0].challenge;
  const hasTabs = entries.length > 1;
  const hasPanels = options.panels ?? hasTabs;
  const dataValues = Object.values(dataMap);
  const tabListHtml = hasTabs ? html`<nav class="${classNames.tabList}" role="tablist" aria-label="Payment methods">
        ${dataValues.map((data, i) => html`<button
                class="${classNames.tab}"
                role="tab"
                id="mppx-tab-${i}"
                aria-selected="${i === 0 ? "true" : "false"}"
                aria-controls="mppx-panel-${i}"
                ${i !== 0 ? 'tabindex="-1"' : ""}
                data-amount="${sanitize(data.formattedAmount)}"
                ${data.challenge.description ? `data-description="${sanitize(data.challenge.description)}"` : ""}
                ${data.challenge.expires ? `data-expires="${sanitize(data.challenge.expires)}"` : ""}
                ${data.challenge.expires ? `data-expires-label="${sanitize(text.expires)}"` : ""}
              >
                ${sanitize(data.label)}
              </button>`).join("")}
      </nav>` : "";
  const panelsHtml = hasPanels ? entries.map((_entry, i) => html`<div
              ${hasTabs ? `role="tabpanel" aria-labelledby="mppx-tab-${i}"` : ""}
              id="mppx-panel-${i}"
              ${i !== 0 ? "hidden" : ""}
            >
              <div id="${ids.root}-${i}" aria-label="Payment form"></div>
            </div>`).join("") : html`<div id="${ids.root}" aria-label="Payment form"></div>`;
  const contentScripts = hasTabs ? entries.map((entry) => entry.content.replace("<script>", `<script ${attrs.challengeId}="${sanitize(entry.challenge.id)}">`)).join("\n") : entries[0].content;
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <meta name="color-scheme" content="${theme.colorScheme}" />
        <title>${text.title}</title>
        ${preflight} ${favicon(theme, firstChallenge.realm)} ${font(theme)} ${style(theme)}
        ${hasTabs ? tabStyle() : ""}
      </head>
      <body>
        <main>
          <header class="${classNames.header}">
            ${logo(theme)}
            <span>${text.paymentRequired}</span>
          </header>
          <section class="${classNames.summary}" aria-label="Payment summary">
            <h1 class="${classNames.summaryAmount}">${sanitize(formattedAmount)}</h1>
            ${firstChallenge.description ? `<p class="${classNames.summaryDescription}">${sanitize(firstChallenge.description)}</p>` : ""}
            ${firstChallenge.expires ? `<p class="${classNames.summaryExpires}">${text.expires} <time datetime="${new Date(firstChallenge.expires).toISOString()}">${new Date(firstChallenge.expires).toLocaleString()}</time></p>` : ""}
          </section>
          ${tabListHtml} ${panelsHtml}
          <script
            id="${ids.data}"
            type="application/json"
            ${entries.length > 1 ? ` ${attrs.remaining}="${entries.length}"` : ""}
          >
            ${Json_exports.stringify(dataMap).replace(/</g, "\\u003c")}
          </script>
          ${contentScripts} ${hasTabs ? tabScript : ""}
        </main>
      </body>
    </html>`;
}
function style(theme) {
  const colors = Object.fromEntries(colorTokens.map((name) => [name, resolveColor(theme[name], defaultTheme[name])]));
  const lightVars = colorTokens.map((token) => `${vars[token].name}: ${colors[token][0]};`).join("\n      ");
  const darkVars = colorTokens.map((token) => `${vars[token].name}: ${colors[token][1]};`).join("\n      ");
  const isLightOnly = theme.colorScheme === "light";
  const isDarkOnly = theme.colorScheme === "dark";
  const rootVars = isDarkOnly ? darkVars : lightVars;
  const darkMedia = !isLightOnly && !isDarkOnly ? `
    @media (prefers-color-scheme: dark) {
      :root {
        ${darkVars}
      }
    }` : "";
  return html`
    <style>
      :root {
        color-scheme: ${theme.colorScheme};
        ${vars.fontFamily.name}: ${theme.fontFamily};
        ${vars.fontSizeBase.name}: ${theme.fontSizeBase};
        ${vars.radius.name}: ${theme.radius};
        ${vars.spacingUnit.name}: ${theme.spacingUnit};
        ${rootVars}
      }${darkMedia}
      *:focus-visible {
        outline-color: ${vars.accent};
        outline-offset: 0.15rem;
        outline-style: solid;
        outline-width: 2px;
      }
      body {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: ${vars.background};
        color: ${vars.foreground};
        font-family: ${vars.fontFamily};
        font-size: ${vars.fontSizeBase};
      }
      main {
        display: flex;
        flex-direction: column;
        gap: calc(${vars.spacingUnit} * 8);
        margin-left: auto;
        margin-right: auto;
        max-width: clamp(300px, calc(${vars.spacingUnit} * 224), 896px);
        padding: calc(${vars.spacingUnit} * 12) calc(${vars.spacingUnit} * 8) calc(${vars.spacingUnit} * 16);
      }
      .${classNames.header} {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: calc(${vars.spacingUnit} * 4);
        justify-content: space-between;
        span {
          background: ${vars.surface};
          border: 1px solid ${vars.border};
          border-radius: calc(${vars.spacingUnit} * 50);
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.025em;
          padding: calc(${vars.spacingUnit} * 1) calc(${vars.spacingUnit} * 4);
        }
      }
      .${classNames.logo} {
        max-height: 1.75rem;
      }
      .${logoColorScheme("dark")} {
        @media (prefers-color-scheme: light) {
          display: none;
        }
      }
      .${logoColorScheme("light")} {
        @media (prefers-color-scheme: dark) {
          display: none;
        }
      }
      .${classNames.summary} {
        background: ${vars.surface};
        border: 1px solid ${vars.border};
        border-radius: ${vars.radius};
        display: flex;
        flex-direction: column;
        gap: calc(${vars.spacingUnit} * 3);
        padding: calc(${vars.spacingUnit} * 6) calc(${vars.spacingUnit} * 6);
      }
      .${classNames.summaryAmount} {
        font-size: 2.5rem;
        font-variant-numeric: tabular-nums;
        font-weight: 700;
        line-height: 1.2;
      }
      .${classNames.summaryDescription} {
        font-size: 1.25rem;
      }
      .${classNames.summaryExpires} {
        color: ${vars.muted};
      }
      .${classNames.error} {
        color: ${vars.negative};
        font-size: 0.95rem;
        margin-top: calc(${vars.spacingUnit} * -1.5);
        text-align: center;
      }
    </style>
  `;
}
function favicon(theme, realm) {
  if (typeof theme.favicon === "string")
    return html`<link rel="icon" href="${sanitize(theme.favicon)}" />`;
  if (typeof theme.favicon === "object") {
    return html`<link
        rel="icon"
        href="${sanitize(theme.favicon.light)}"
        media="(prefers-color-scheme: light)"
      />
      <link
        rel="icon"
        href="${sanitize(theme.favicon.dark)}"
        media="(prefers-color-scheme: dark)"
      />`;
  }
  try {
    const domain = new URL(realm).hostname;
    return html`<link
      rel="icon"
      href="https://www.google.com/s2/favicons?domain=${domain}&sz=64"
    />`;
  } catch {
    return "";
  }
}
function font(theme) {
  if (!theme.fontUrl)
    return "";
  return html`<link
      rel="preconnect"
      href="${sanitize(new URL(theme.fontUrl).origin)}"
      crossorigin
    />
    <link rel="stylesheet" href="${sanitize(theme.fontUrl)}" />`;
}
function logo(value) {
  if (typeof value.logo === "undefined")
    return "";
  if (typeof value.logo === "string")
    return html`<img alt="" class="${classNames.logo}" src="${sanitize(value.logo)}" />`;
  return Object.entries(value.logo).map((entry) => html`<img
          alt=""
          class="${classNames.logo} ${logoColorScheme(entry[0])}"
          src="${sanitize(entry[1])}"
        />`).join("\n");
}
function tabStyle() {
  return html`
    <style>
      .${classNames.tabList} {
        display: flex;
        gap: calc(${vars.spacingUnit} * 2);
        border-bottom: 1px solid ${vars.border};
      }
      .${classNames.tab} {
        background: none !important;
        border: none !important;
        border-bottom: 1px solid transparent !important;
        border-radius: 0 !important;
        color: ${vars.muted} !important;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: -1px !important;
        padding: calc(${vars.spacingUnit} * 2) calc(${vars.spacingUnit} * 4) !important;
        text-transform: capitalize;
        width: auto !important;
      }
      .${classNames.tab}[aria-selected='true'] {
        border-bottom-color: ${vars.foreground} !important;
        color: ${vars.foreground} !important;
      }
      .${classNames.tab}:hover:not([aria-selected='true']) {
        color: ${vars.foreground} !important;
      }
      .${classNames.tabPanel}[hidden] {
        display: none;
      }
    </style>
  `;
}
var preflight = html`<style>
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
    border-color: ${vars.border};
  }
  html,
  :host {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    tab-size: 4;
    -webkit-tap-highlight-color: transparent;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: inherit;
    font-weight: inherit;
  }
  a {
    color: inherit;
    -webkit-text-decoration: inherit;
    text-decoration: inherit;
  }
  b,
  strong {
    font-weight: bolder;
  }
  code,
  kbd,
  samp,
  pre {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace;
    font-size: 1em;
  }
  small {
    font-size: 80%;
  }
  ol,
  ul,
  menu {
    list-style: none;
  }
  img,
  svg,
  video,
  canvas,
  audio,
  iframe,
  embed,
  object {
    display: block;
    vertical-align: middle;
  }
  img,
  video {
    max-width: 100%;
    height: auto;
  }
  button,
  input,
  select,
  optgroup,
  textarea,
  ::file-selector-button {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    border-radius: 0;
    background-color: transparent;
    opacity: 1;
  }
  ::file-selector-button {
    margin-inline-end: 4px;
  }
  ::placeholder {
    opacity: 1;
  }
  @supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px) {
    ::placeholder {
      color: color-mix(in oklab, currentcolor 50%, transparent);
    }
  }
  textarea {
    resize: vertical;
  }
  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }
  :-moz-ui-invalid {
    box-shadow: none;
  }
  button,
  input:where([type='button'], [type='reset'], [type='submit']),
  ::file-selector-button {
    appearance: button;
  }
  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    height: auto;
  }
  [hidden]:where(:not([hidden='until-found'])) {
    display: none !important;
  }
</style>`;
function sanitize(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeRecord(record2) {
  return Object.fromEntries(Object.entries(record2).map(([key, value]) => [key, sanitize(value)]));
}
function mergeDefined(defaults2, value) {
  if (value === void 0 || value === null)
    return defaults2;
  if (!isPlainObject2(defaults2) || !isPlainObject2(value))
    return value ?? defaults2;
  const result = { ...defaults2 };
  for (const [key, nextValue] of Object.entries(value)) {
    if (nextValue === void 0 || nextValue === null || nextValue === "")
      continue;
    const currentValue = result[key];
    result[key] = isPlainObject2(currentValue) && isPlainObject2(nextValue) ? mergeDefined(currentValue, nextValue) : nextValue;
  }
  return result;
}
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/html/serviceWorker.gen.js
var serviceWorker = "(function(){let e=self,t,n=`Authorization`;e.addEventListener(`activate`,t=>{t.waitUntil(e.clients.claim())}),e.addEventListener(`message`,e=>{if(!e.source)return;let r=e.data?.credential;typeof r!=`string`||!r.startsWith(`Payment `)||(t=r,typeof e.data?.header==`string`&&(n=e.data.header),e.ports[0]?.postMessage(`ack`))}),e.addEventListener(`fetch`,r=>{if(!t||r.request.mode!==`navigate`||new URL(r.request.url).origin!==e.location.origin)return;let i=new Headers(r.request.headers);i.set(n,t),t=void 0,r.respondWith(fetch(r.request,{headers:i})),e.registration.unregister()})})();";

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/Transport.js
function from13(transport) {
  return transport;
}
function http2(options = {}) {
  const credentialHeader2 = options.requiresAuth ? Headers2.paymentAuthorization : Headers2.authorization;
  return from13({
    name: "http",
    credentialHeaders: [credentialHeader2],
    captureRequest(request2) {
      return {
        hasBody: request2.body !== null,
        headers: new Headers(request2.headers),
        method: request2.method,
        url: safeUrl(request2.url)
      };
    },
    getCredential(request2) {
      const header2 = request2.headers.get(credentialHeader2);
      if (!header2)
        return null;
      const payment = extractPaymentScheme(header2);
      if (!payment)
        return null;
      return deserialize3(payment);
    },
    async respondChallenge(options2) {
      const { challenge: challenge2, error, input } = options2;
      if (error?.status === 403)
        return new Response(JSON.stringify(error.toProblemDetails()), {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/problem+json"
          }
        });
      if (options2.html && new URL(input.url).searchParams.has(params.serviceWorker))
        return new Response(serviceWorker, {
          status: 200,
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-store"
          }
        });
      const headers = {
        [Headers2.wwwAuthenticate]: serialize2(challenge2),
        "Cache-Control": "no-store"
      };
      const body = await (async () => {
        if (options2.html && input.headers.get("Accept")?.includes("text/html")) {
          headers["Content-Type"] = "text/html; charset=utf-8";
          const { theme, text } = resolveOptions(options2.html);
          const amount2 = await options2.html.formatAmount(challenge2.request);
          const dataMap = {
            [challenge2.id]: {
              label: challenge2.method,
              rootId: ids.root,
              formattedAmount: amount2,
              config: options2.html.config,
              challenge: challenge2,
              text,
              theme
            }
          };
          return render({
            entries: [{ challenge: challenge2, content: await resolveContent(options2.html.content) }],
            dataMap,
            formattedAmount: amount2,
            text,
            theme
          });
        }
        if (error) {
          headers["Content-Type"] = "application/problem+json";
          return JSON.stringify(error.toProblemDetails(challenge2.id));
        }
        return null;
      })();
      return new Response(body, { status: error?.status ?? 402, headers });
    },
    respondReceipt({ receipt, response: response2 }) {
      const headers = new Headers(response2.headers);
      headers.set("Cache-Control", withPrivateCacheControl(headers.get("Cache-Control")));
      headers.set(Headers2.paymentReceipt, serialize6(receipt));
      return new Response(response2.body, {
        status: response2.status,
        statusText: response2.statusText,
        headers
      });
    }
  });
}
function withPrivateCacheControl(value) {
  if (!value)
    return "private";
  const directives = value.split(",").map((directive) => directive.trim().toLowerCase());
  if (directives.includes("private"))
    return value;
  return `${value}, private`;
}
function safeUrl(url) {
  try {
    if (url instanceof URL)
      return new URL(url.toString());
    if (url)
      return new URL(url);
  } catch {
  }
  return new URL("about:blank");
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/server/EvmCharge.js
import { isDeepStrictEqual } from "node:util";

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/BodyDigest.js
function compute(body) {
  const str = typeof body === "object" ? JSON.stringify(body) : body;
  const bytes = Bytes_exports.fromString(str);
  const hash2 = Hash_exports.sha256(bytes, { as: "Bytes" });
  const base64 = Base64_exports.fromBytes(hash2);
  return `sha-256=${base64}`;
}
function verify3(digest, body) {
  return constantTimeEqual(compute(body), normalize2(digest));
}
function normalize2(digest) {
  const match = /^sha-256=:([A-Za-z0-9+/]+)=*:$/.exec(digest);
  if (!match)
    return digest;
  const hash2 = match[1];
  return `sha-256=${hash2}${"=".repeat((4 - hash2.length % 4) % 4)}`;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/challengeMeta.js
var nonceKey = "_mppx_nonce";
function withNonce(meta2) {
  return { ...meta2, [nonceKey]: Secp256k1_exports.randomPrivateKey() };
}
var legacyIdentityKey = "_mppx_identity";
function routeMeta(meta2) {
  const { [nonceKey]: _, [legacyIdentityKey]: __, ...rest } = meta2 ?? {};
  return Object.keys(rest).length ? rest : void 0;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/scope.js
var requestScopes = /* @__PURE__ */ new WeakMap();
var reservedMetaKey = "_mppx_scope";
function get(request2) {
  return requestScopes.get(request2);
}
function read(meta2) {
  return meta2?.[reservedMetaKey];
}
function merge3(parameters) {
  const { meta: meta2, scope } = parameters;
  const metaScope = read(meta2);
  if (scope !== void 0 && metaScope !== void 0 && metaScope !== scope) {
    throw new Error(`Conflicting scope values: \`scope\` (${scope}) does not match \`meta.${reservedMetaKey}\` (${metaScope}).`);
  }
  if (scope === void 0 || metaScope === scope)
    return meta2;
  return { ...meta2, [reservedMetaKey]: scope };
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/server/Facilitator.js
var mppxFetchWrapper = /* @__PURE__ */ Symbol.for("mppx.fetch.wrapper");
function resolve3(facilitator, errorMessage = "x402 exact requires `facilitator`.", options) {
  if (typeof facilitator === "object" && facilitator !== null)
    return facilitator;
  if (typeof facilitator === "string")
    return http3(facilitator, options);
  throw new Error(errorMessage);
}
function http3(url, options) {
  const base3 = url.replace(/\/$/, "");
  const fetch = unwrapFetch2(options?.fetch ?? globalThis.fetch);
  return {
    async verify(paymentPayload, paymentRequirements) {
      const response2 = await fetch(`${base3}/verify`, {
        body: JSON.stringify({ paymentPayload, paymentRequirements, x402Version: 2 }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      return VerifyResponseSchema.parse(await response2.json());
    },
    async settle(paymentPayload, paymentRequirements) {
      const response2 = await fetch(`${base3}/settle`, {
        body: JSON.stringify({ paymentPayload, paymentRequirements, x402Version: 2 }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      return SettleResponseSchema.parse(await response2.json());
    }
  };
}
function unwrapFetch2(fetch) {
  let current = fetch;
  while (current[mppxFetchWrapper]) {
    current = current[mppxFetchWrapper];
  }
  return current;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/x402/server/EvmCharge.js
var pendingX402Credential = /* @__PURE__ */ Symbol("mppx.evm.pendingX402Credential");
var x402Credential = /* @__PURE__ */ Symbol("mppx.evm.x402Credential");
var mppxExtensionKey = "mppx";
var mppxRouteBindingSchema = {
  additionalProperties: false,
  properties: {
    [reservedMetaKey]: { type: "string" },
    digest: { type: "string" },
    method: { type: "string" },
    nonce: { type: "string" },
    opaque: { type: "string" }
  },
  required: ["method"],
  type: "object"
};
function resolveOptions2(parameters) {
  return {
    authorization: parameters.authorization,
    ...parameters.options?.facilitator ? {
      facilitator: resolve3(parameters.options.facilitator, "EVM authorization x402 requires `facilitator`.", { fetch: parameters.options.fetch })
    } : {},
    maxTimeoutSeconds: parameters.options?.maxTimeoutSeconds ?? 300,
    routeBinding: parameters.options?.routeBinding ?? "required"
  };
}
function createPath(config2) {
  return {
    credentialHeaders: [paymentSignatureHeader],
    getCredential(request2) {
      const paymentSignature2 = request2.headers.get(paymentSignatureHeader);
      if (!paymentSignature2)
        return null;
      const paymentPayload = decodePaymentSignature(paymentSignature2);
      return markPendingCredential(from6({
        challenge: pendingChallenge(paymentPayload),
        payload: paymentPayload
      }));
    },
    matchCredential({ input, request: request2 }) {
      const paymentSignature2 = input.headers.get(paymentSignatureHeader);
      if (!paymentSignature2)
        return false;
      try {
        const paymentPayload = decodePaymentSignature(paymentSignature2);
        return isDeepStrictEqual(paymentPayload.accepted, toPaymentRequirements2(request2, config2));
      } catch {
        return false;
      }
    },
    async bindCredential({ challenge: challenge2, credential, input }) {
      const paymentPayload = parsePaymentPayload(credential.payload);
      if (!paymentPayload)
        return credential;
      if (!isPendingCredential(credential))
        return credential;
      await assertBodyDigest(challenge2, input);
      const request2 = challenge2.request;
      const paymentRequirements = toPaymentRequirements2(request2, config2);
      if (!isDeepStrictEqual(paymentPayload.accepted, paymentRequirements))
        throw new VerificationFailedError({
          reason: "x402 payment payload does not match route requirements"
        });
      const expectedResource = { url: input.url };
      const clientNonce = paymentPayload.extensions?.[mppxExtensionKey]?.info.nonce;
      const isRouteBound = clientNonce !== void 0;
      const routeRequiresBinding = challenge2.digest !== void 0 || (challenge2.meta === void 0 ? challenge2.opaque !== void 0 : routeMeta(challenge2.meta) !== void 0);
      if (routeRequiresBinding && !isRouteBound && config2.routeBinding === "required")
        throw new VerificationFailedError({
          reason: "x402 payment payload does not bind required route metadata"
        });
      if (isRouteBound) {
        if (!isDeepStrictEqual(paymentPayload.resource, expectedResource))
          throw new VerificationFailedError({
            reason: "x402 payment payload resource does not match route resource"
          });
        const expectedExtensions = routeExtensions(challenge2, input);
        if (!containsExtensions(paymentPayload.extensions, expectedExtensions))
          throw new VerificationFailedError({
            reason: "x402 payment payload extensions do not match route binding"
          });
      } else if (routeRequiresBinding) {
        if (paymentPayload.resource?.url !== expectedResource.url)
          throw new VerificationFailedError({
            reason: "x402 payment payload resource does not match route resource"
          });
      } else if (paymentPayload.resource !== void 0 && paymentPayload.resource.url !== expectedResource.url)
        throw new VerificationFailedError({
          reason: "x402 payment payload resource does not match route resource"
        });
      const payload = payloadToAuthorization(paymentPayload);
      if (isRouteBound) {
        const expectedNonce = nonce({
          accepted: paymentRequirements,
          extensions: paymentPayload.extensions,
          resource: expectedResource
        });
        if (payload.nonce !== expectedNonce)
          throw new VerificationFailedError({
            reason: "x402 authorization nonce does not match route binding"
          });
      }
      return markCredential(from6({
        challenge: challenge2,
        payload,
        source: toSource({
          address: getAddress(payload.from),
          chainId: request2.methodDetails.chainId
        })
      }));
    },
    respondChallenge(options, response2) {
      if (!response2)
        throw new Error("x402 path requires a base challenge response.");
      const headers = new Headers(response2.headers);
      const request2 = options.challenge.request;
      headers.set(paymentRequiredHeader, encodePaymentRequired({
        accepts: [toPaymentRequirements2(request2, config2)],
        error: options.error?.message ?? `${paymentSignatureHeader} header is required`,
        extensions: routeExtensions(options.challenge, options.input),
        resource: { url: options.input.url },
        x402Version: 2
      }));
      return new Response(response2.body, {
        headers,
        status: response2.status,
        statusText: response2.statusText
      });
    },
    respondReceipt(options, response2) {
      if (!options.input.headers.has(paymentSignatureHeader))
        return response2;
      const payload = AuthorizationPayloadSchema.parse(options.credential.payload);
      const request2 = options.credential.challenge.request;
      const headers = new Headers(response2.headers);
      headers.set(paymentResponseHeader, encodePaymentResponse({
        network: networkOf(request2.methodDetails.chainId),
        payer: payload.from,
        success: true,
        transaction: options.receipt.reference
      }));
      return new Response(response2.body, {
        headers,
        status: response2.status,
        statusText: response2.statusText
      });
    }
  };
}
function settleWithFacilitator(parameters) {
  const { facilitator } = parameters;
  if (!facilitator)
    throw new Error("EVM authorization x402 requires `facilitator`.");
  return async (authorization) => {
    const { paymentPayload, paymentRequirements } = facilitatorPayment(parameters, authorization);
    const settled = await facilitator.settle(paymentPayload, paymentRequirements);
    if (!settled.success)
      throw new VerificationFailedError({
        reason: settled.errorMessage ?? settled.errorReason ?? "EVM facilitator settlement failed"
      });
    return {
      reference: settled.transaction
    };
  };
}
async function verifyWithFacilitator(parameters, authorization) {
  const { facilitator } = parameters;
  if (!facilitator)
    throw new Error("EVM authorization x402 requires `facilitator`.");
  const { paymentPayload, paymentRequirements } = facilitatorPayment(parameters, authorization);
  const verified = await facilitator.verify(paymentPayload, paymentRequirements);
  if (!verified.isValid)
    throw new VerificationFailedError({
      reason: verified.invalidMessage ?? verified.invalidReason ?? "EVM facilitator verify failed"
    });
}
function facilitatorPayment(parameters, { payload, request: request2 }) {
  const paymentRequirements = toPaymentRequirements2(request2, parameters);
  const paymentPayload = {
    accepted: paymentRequirements,
    payload: {
      authorization: {
        from: payload.from,
        nonce: payload.nonce,
        to: payload.to,
        validAfter: payload.validAfter,
        validBefore: payload.validBefore,
        value: payload.value
      },
      signature: payload.signature
    },
    x402Version: 2
  };
  return { paymentPayload, paymentRequirements };
}
function isCredential(credential) {
  return credential[x402Credential] === true;
}
function isPendingCredential(credential) {
  return credential[pendingX402Credential] === true;
}
function toPaymentRequirements2(request2, config2) {
  return {
    amount: request2.amount,
    asset: request2.currency,
    extra: {
      assetTransferMethod: eip3009,
      name: config2.authorization.name,
      version: config2.authorization.version
    },
    maxTimeoutSeconds: config2.maxTimeoutSeconds,
    network: networkOf(request2.methodDetails.chainId),
    payTo: request2.recipient,
    scheme: "exact"
  };
}
function parsePaymentPayload(payload) {
  const parsed = PaymentPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : void 0;
}
function payloadToAuthorization(paymentPayload) {
  if (!("authorization" in paymentPayload.payload))
    throw new VerificationFailedError({
      reason: "EVM charge only supports x402 EIP-3009 authorization payloads"
    });
  return AuthorizationPayloadSchema.parse({
    ...paymentPayload.payload.authorization,
    signature: paymentPayload.payload.signature,
    type: "authorization"
  });
}
function pendingChallenge(paymentPayload) {
  return from5({
    id: pendingChallengeId(paymentPayload),
    intent: chargeIntent,
    method: paymentMethod2,
    realm: "x402",
    request: paymentPayload.accepted
  });
}
function pendingChallengeId(paymentPayload) {
  const hash2 = Hash_exports.sha256(Bytes_exports.fromString(JSON.stringify(paymentPayload)), { as: "Hex" });
  return `${syntheticChallengeIdPrefix}${hash2}`;
}
function routeExtensions(challenge2, input) {
  const binding = { method: input.method };
  const scope = read(challenge2.meta);
  if (scope !== void 0)
    binding[reservedMetaKey] = scope;
  if (challenge2.digest !== void 0)
    binding.digest = challenge2.digest;
  const meta2 = routeMeta(challenge2.meta);
  const opaque = challenge2.meta === void 0 ? challenge2.opaque : meta2 ? serialize(meta2) : void 0;
  if (opaque !== void 0)
    binding.opaque = opaque;
  return {
    [mppxExtensionKey]: {
      info: binding,
      schema: mppxRouteBindingSchema
    }
  };
}
function containsExtensions(actual, expected) {
  if (!actual)
    return false;
  return Object.entries(expected).every(([key, expectedExtension]) => {
    const actualExtension = actual[key];
    return actualExtension !== void 0 && isDeepStrictEqual(actualExtension.schema, expectedExtension.schema) && isDeepStrictEqual(stripClientNonce(actualExtension.info), expectedExtension.info);
  });
}
function stripClientNonce(info) {
  const { nonce: nonce2, ...rest } = info;
  if (nonce2 !== void 0 && typeof nonce2 !== "string")
    return info;
  return rest;
}
async function assertBodyDigest(challenge2, input) {
  if (input.body === null || challenge2.digest === void 0)
    return;
  let body;
  try {
    body = await input.clone().text();
  } catch {
    throw new VerificationFailedError({
      reason: "x402 payment cannot bind streaming request body"
    });
  }
  if (!verify3(challenge2.digest, body))
    throw new VerificationFailedError({
      reason: "x402 payment body digest mismatch"
    });
}
function markPendingCredential(credential) {
  Object.defineProperty(credential, pendingX402Credential, {
    enumerable: true,
    value: true
  });
  return credential;
}
function markCredential(credential) {
  Object.defineProperty(credential, x402Credential, {
    enumerable: true,
    value: true
  });
  return credential;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/server/Charge.js
function charge3(parameters) {
  const config2 = resolveConfig(parameters);
  const paths = createPaths(config2);
  const transport = httpTransport(paths);
  return toServer(charge, {
    canOffer: parameters.canOffer,
    onPaymentSuccess: parameters.onPaymentSuccess,
    defaults: {
      chainId: config2.chainId,
      currency: config2.currency,
      credentialTypes: ["authorization"],
      decimals: config2.decimals,
      recipient: config2.recipient
    },
    transport,
    async validate({ credential }) {
      const payload = credential.payload;
      const request2 = credential.challenge.request;
      const chainId = request2.methodDetails.chainId;
      const isX402Credential = isCredential(credential);
      if (!request2.methodDetails.credentialTypes?.includes("authorization")) {
        throw new VerificationFailedError({
          reason: "EVM authorization credentials are not supported for this challenge"
        });
      }
      if (request2.methodDetails.splits?.length) {
        throw new VerificationFailedError({
          reason: "EVM authorization credentials do not support splits"
        });
      }
      assertAddressEqual(payload.to, request2.recipient, "EVM authorization recipient mismatch");
      if (payload.value !== request2.amount)
        throw new VerificationFailedError({ reason: "EVM authorization amount mismatch" });
      if (!isX402Credential && payload.nonce !== challengeHash(credential.challenge))
        throw new VerificationFailedError({ reason: "EVM authorization challenge hash mismatch" });
      const now = BigInt(Math.floor(Date.now() / 1e3));
      if (BigInt(payload.validAfter) > now)
        throw new VerificationFailedError({ reason: "EVM authorization is not valid yet" });
      if (BigInt(payload.validBefore) <= now)
        throw new VerificationFailedError({ reason: "EVM authorization has expired" });
      const signer = await recoverTypedDataAddress({
        domain: authorizationDomain({
          authorization: config2.authorization,
          chainId,
          currency: request2.currency
        }),
        message: {
          from: getAddress(payload.from),
          nonce: payload.nonce,
          to: getAddress(payload.to),
          validAfter: BigInt(payload.validAfter),
          validBefore: BigInt(payload.validBefore),
          value: BigInt(payload.value)
        },
        primaryType: "TransferWithAuthorization",
        signature: payload.signature,
        types: authorizationTypes2
      });
      assertAddressEqual(signer, payload.from, "EVM authorization signature mismatch");
      const source = toSource({ address: getAddress(payload.from), chainId });
      if (credential.source && credential.source !== source) {
        throw new VerificationFailedError({ reason: "EVM authorization source mismatch" });
      }
      const authorization = {
        credential,
        payload,
        request: request2,
        source
      };
      await config2.validate?.(authorization);
      const payer = getAddress(payload.from);
      return {
        challenge: credential.challenge,
        credential,
        details: { payer },
        intent: charge.intent,
        method: charge.name,
        payer,
        request: credential.challenge.request,
        source
      };
    },
    async broadcast({ credential }) {
      const payload = credential.payload;
      const request2 = credential.challenge.request;
      const settled = await config2.settle({
        credential,
        payload,
        request: request2,
        source: toSource({
          address: getAddress(payload.from),
          chainId: request2.methodDetails.chainId
        })
      });
      return from12({
        method: paymentMethod2,
        reference: settled.reference,
        status: "success",
        timestamp: settled.timestamp ?? (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
}
function resolveConfig(config2) {
  const { currency, recipient } = config2;
  let address3;
  let authorization = config2.authorization;
  let chainId = config2.chainId;
  let decimals = config2.decimals;
  if (isAsset(currency)) {
    chainId ??= toChainId(currency.network);
  }
  if (chainId !== void 0) {
    const resolved = resolve2(currency, networkOf(chainId));
    if (!resolved)
      throw new Error(`EVM currency is not available on chain ID ${chainId}.`);
    address3 = resolved.address;
    decimals ??= resolved.decimals;
    if (resolved.transfer?.type === eip3009) {
      authorization ??= {
        name: resolved.transfer.name,
        version: resolved.transfer.version
      };
    }
  } else if (isRawAddress(currency)) {
    address3 = currency;
  } else {
    throw new Error("EVM authorization requires `chainId`.");
  }
  if (!authorization)
    throw new Error("EVM authorization requires `authorization` metadata.");
  if (chainId === void 0)
    throw new Error("EVM authorization requires `chainId`.");
  if (decimals === void 0)
    throw new Error("EVM authorization requires `decimals`.");
  const x4022 = resolveOptions2({
    authorization,
    options: config2.x402
  });
  const settle = config2.settle ?? (x4022?.facilitator ? settleWithFacilitator(x4022) : void 0);
  if (!settle)
    throw new Error("EVM authorization requires `settle` or `x402.facilitator`.");
  return {
    authorization,
    chainId,
    currency: getAddress(address3),
    decimals,
    recipient: getAddress(recipient),
    settle,
    validate: !config2.settle && x4022.facilitator ? (parameters) => verifyWithFacilitator(x4022, parameters) : void 0,
    x402: x4022
  };
}
function createPaths(config2) {
  return {
    mpp: createMppPath(),
    x402: createPath(config2.x402)
  };
}
function createMppPath() {
  const transport = http2();
  return {
    credentialHeaders: transport.credentialHeaders ?? [],
    bindCredential: (options) => transport.bindCredential?.(options) ?? options.credential,
    captureRequest: transport.captureRequest,
    getCredential: transport.getCredential,
    respondChallenge: (options) => transport.respondChallenge(options),
    respondReceipt: (options, response2) => transport.respondReceipt({ ...options, response: response2 })
  };
}
function httpTransport(paths) {
  return from13({
    name: "evm-http",
    credentialHeaders: [
      .../* @__PURE__ */ new Set([...paths.mpp.credentialHeaders, ...paths.x402.credentialHeaders])
    ],
    captureRequest: paths.mpp.captureRequest,
    getCredential(input) {
      return paths.mpp.getCredential(input) ?? paths.x402.getCredential(input);
    },
    matchCredential: paths.x402.matchCredential,
    bindCredential(options) {
      if (isPendingCredential(options.credential))
        return paths.x402.bindCredential(options);
      return paths.mpp.bindCredential?.(options) ?? options.credential;
    },
    async respondChallenge(options) {
      const response2 = await paths.mpp.respondChallenge(options);
      return paths.x402.respondChallenge(options, response2);
    },
    respondReceipt(options) {
      const response2 = paths.mpp.respondReceipt(options, options.response);
      return paths.x402.respondReceipt(options, response2);
    }
  });
}
function assertAddressEqual(actual, expected, reason) {
  if (getAddress(actual) === getAddress(expected))
    return;
  throw new VerificationFailedError({ reason });
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/evm/server/Methods.js
function evm2(parameters) {
  if (parameters.currency !== void 0) {
    if (parameters.currencies !== void 0)
      throw new Error("Specify either `currency` or `currencies`, not both.");
    return [evm2.charge(parameters)];
  }
  const { currencies, ...shared } = parameters;
  const seen = /* @__PURE__ */ new Set();
  const methods = [];
  for (const currency of currencies) {
    const chainId = shared.chainId ?? (isAsset(currency) ? toChainId(currency.network) : void 0);
    if (chainId === void 0)
      throw new Error("EVM currencies require `chainId` or known asset metadata.");
    const resolved = resolve2(currency, toNetwork(chainId));
    if (!resolved)
      continue;
    if (isToken(currency) && currency.currency !== "USD")
      continue;
    const key = `${chainId}:${resolved.address.toLowerCase()}`;
    if (seen.has(key))
      continue;
    seen.add(key);
    methods.push(evm2.charge({ ...shared, chainId, currency }));
  }
  if (methods.length === 0)
    throw new Error("No accepted EVM currencies for the configured chain.");
  return methods;
}
(function(evm3) {
  evm3.charge = charge3;
  evm3.assets = Assets_exports;
  evm3.chains = Chains_exports;
})(evm2 || (evm2 = {}));

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/internal/env.js
var variables = {
  realm: [
    "MPP_REALM",
    "FLY_APP_NAME",
    "HEROKU_APP_NAME",
    "RAILWAY_PUBLIC_DOMAIN",
    "RENDER_EXTERNAL_HOSTNAME",
    "VERCEL_URL",
    "WEBSITE_HOSTNAME"
  ],
  secretKey: ["MPP_SECRET_KEY"]
};
var defaults = {};
function get2(key) {
  for (const name of variables[key]) {
    const value = read2(name);
    if (value)
      return value;
  }
  return defaults[key];
}
function read2(name) {
  try {
    if (typeof process !== "undefined" && process?.env)
      return process.env[name] || void 0;
  } catch {
  }
  try {
    const deno = globalThis.Deno;
    if (deno?.env?.get)
      return deno.env.get(name) || void 0;
  } catch {
  }
  return void 0;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/internal/warnOnce.js
var warned = /* @__PURE__ */ new Set();
function warnOnce(key, message) {
  if (warned.has(key))
    return;
  warned.add(key);
  console.warn(`[mppx] ${message}`);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/Mppx.js
var Mppx_exports2 = {};
__export(Mppx_exports2, {
  MissingReceiptResponseError: () => MissingReceiptResponseError,
  compose: () => compose,
  create: () => create3,
  isMissingReceiptResponseError: () => isMissingReceiptResponseError,
  reservedMppxKeys: () => reservedMppxKeys,
  supportsStreamingReceipts: () => supportsStreamingReceipts,
  toNodeListener: () => toNodeListener
});
import { isDeepStrictEqual as isDeepStrictEqual2 } from "node:util";

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/identity/Status.js
var codes = {
  missing: 401,
  invalid: 401,
  forbidden: 403,
  unavailable: 503
};
var precedence = [
  "forbidden",
  "unavailable",
  "invalid",
  "missing"
];

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/identity/Server.js
var anyOfMembers = /* @__PURE__ */ new WeakMap();
function combineAnyOf(outcomes) {
  const index = outcomes.findIndex((outcome) => outcome.status === "valid");
  const matched = outcomes[index];
  if (matched?.status === "valid")
    return Object.freeze({
      status: "valid",
      value: Object.freeze({ index, value: matched.value })
    });
  const rejected = outcomes;
  const decision = decide(rejected);
  return toVerification({
    ...decision,
    headers: groupAlternatives(rejected.map((outcome) => normalize3(outcome).headers)),
    ...decision.status === "missing" && {
      reason: "None of the accepted identity proofs was presented."
    }
  });
}
function groupAlternatives(members2) {
  const grouped = /* @__PURE__ */ new Map();
  const others = [];
  for (const [name, value] of members2.flat()) {
    if (!alternativeHeaders.includes(name))
      others.push(Object.freeze([name, value]));
    else
      grouped.set(name, [...grouped.get(name) ?? [], value]);
  }
  return Object.freeze([
    ...others,
    ...[...grouped].map(([name, values]) => Object.freeze([name, alternatives(values)]))
  ]);
}
var none = Object.freeze({ status: "valid", values: /* @__PURE__ */ new Map() });
var defaultReasons = {
  missing: "Identity verification is required.",
  invalid: "The identity proof is invalid.",
  forbidden: "This identity is not allowed.",
  unavailable: "Identity verification is unavailable."
};
function decide(outcomes) {
  if (outcomes.length === 0)
    throw new TypeError("An identity decision needs a rejected outcome.");
  const normalized = outcomes.map(normalize3);
  const rank2 = (decision) => precedence.indexOf(decision.status);
  const winner = normalized.reduce((best, next) => rank2(next) < rank2(best) ? next : best);
  return Object.freeze({
    ...winner,
    headers: Object.freeze(normalized.flatMap((decision) => decision.headers))
  });
}
function normalize3(outcome) {
  const known = Object.hasOwn(codes, outcome.status);
  const raw = known && "code" in outcome ? outcome.code : void 0;
  const code = Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : void 0;
  const status = !known ? "invalid" : code === codes.forbidden ? "forbidden" : code === codes.unavailable ? "unavailable" : outcome.status;
  return {
    status,
    code: code ?? codes[status],
    headers: Object.freeze([...new Headers(outcome.headers)].map(([name, value]) => Object.freeze([name, value]))),
    reason: known ? outcome.reason ?? defaultReasons[status] : "The identity verifier returned an unknown status."
  };
}
function toVerification(decision) {
  const headers = decision.headers.map(([name, value]) => [name, value]);
  const { code, reason, status } = decision;
  if (status === "forbidden" || status === "unavailable")
    return Object.freeze({ status, headers, reason });
  return Object.freeze({
    status,
    ...code !== codes[status] && { code },
    headers,
    reason
  });
}
var Context = class {
  /** Verification promises by verifier. Internal and mutable; outcomes are frozen. */
  verifications = /* @__PURE__ */ new Map();
  /**
   * Payment check promises by check, then by Challenge id and attempt (`paid` or `unpaid`), so
   * a check runs once per attempt even when `compose` calls the matched offer again.
   */
  checks = /* @__PURE__ */ new Map();
};
function createContext() {
  return new Context();
}
function contextOf(value) {
  return value instanceof Context ? value : createContext();
}
function evaluate(context, request2, verifier) {
  let outcome = context.verifications.get(verifier);
  if (outcome)
    return outcome;
  const nested = anyOfMembers.get(verifier);
  outcome = nested ? (async () => {
    const outcomes = [];
    for (const member of nested)
      outcomes.push(await evaluate(context, request2, member));
    return combineAnyOf(outcomes);
  })() : (async () => verifier.verify(request2))();
  context.verifications.set(verifier, outcome);
  return outcome;
}
async function verify4(context, request2, verifiers) {
  const values = /* @__PURE__ */ new Map();
  const rejected = [];
  for (const verifier of verifiers) {
    const outcome = await evaluate(context, request2, verifier);
    if (outcome.status !== "valid") {
      rejected.push(outcome);
      continue;
    }
    let current = verifier;
    let value = outcome.value;
    for (; ; ) {
      values.set(current, value);
      const nested = anyOfMembers.get(current);
      if (!nested)
        break;
      const matched = value;
      current = nested[matched.index];
      value = matched.value;
    }
  }
  if (rejected.length > 0)
    return decide(rejected);
  return Object.freeze({ status: "valid", values });
}
function check(context, paymentCheck, parameters) {
  const key = `${parameters.challenge.id}:${parameters.credential ? "paid" : "unpaid"}`;
  const outcomes = context.checks.get(paymentCheck) ?? /* @__PURE__ */ new Map();
  context.checks.set(paymentCheck, outcomes);
  let outcome = outcomes.get(key);
  if (outcome)
    return outcome;
  outcome = (async () => {
    const result = await paymentCheck.verify(Object.freeze({ ...parameters }));
    if (result.status !== "valid")
      return decide([result]);
    return Object.freeze({ status: "valid", values: /* @__PURE__ */ new Map([[paymentCheck, result.value]]) });
  })();
  outcomes.set(key, outcome);
  return outcome;
}
var initial2 = Object.freeze({ phase: "request" });
function transition2(state, event) {
  switch (event.type) {
    case "verified":
      if (state.phase !== "request")
        break;
      if (event.outcome.status !== "valid")
        return reject("request", event.outcome);
      return Object.freeze({ phase: "identified", values: event.outcome.values });
    case "pay":
      if (state.phase !== "identified")
        break;
      return Object.freeze({
        phase: "payment",
        values: state.values,
        challenge: event.challenge,
        credential: event.credential
      });
    case "checked":
      if (state.phase !== "payment")
        break;
      if (event.outcome.status === "valid")
        return Object.freeze({
          phase: "accepted",
          values: new Map([...state.values, ...event.outcome.values])
        });
      if (state.credential)
        return reject("payment", event.outcome);
      return Object.freeze({ phase: "identified", values: state.values });
    case "challenge":
      if (state.phase !== "identified" && state.phase !== "accepted")
        break;
      return Object.freeze({
        phase: "challenged",
        values: state.values,
        requirements: event.requirements
      });
  }
  throw new TypeError(`Illegal identity transition "${event.type}" from phase "${state.phase}".`);
}
function reject(stage, decision) {
  return Object.freeze({
    phase: "rejected",
    rejection: Object.freeze({ stage, status: decision.status, reason: decision.reason }),
    code: decision.code,
    headers: decision.headers
  });
}
function toResponse(state) {
  const headers = new Headers(state.headers.map(([name, value]) => [name, value]));
  headers.set("Cache-Control", "no-store");
  return new Response(state.rejection.reason, { headers, status: state.code });
}
function results(state) {
  const values = "values" in state ? state.values : /* @__PURE__ */ new Map();
  return Object.freeze({
    get(verifier) {
      return values.get(verifier);
    }
  });
}
function route(identity) {
  const { payment = void 0, request: request2 = [] } = Array.isArray(identity) ? { request: identity } : parseObject(identity);
  for (const verifier of request2)
    assertRequestStage(verifier);
  if (payment !== void 0) {
    if (typeof payment !== "object" || payment === null)
      throw new TypeError("Identity payment check must be { requires, verify }.");
    if (!Array.isArray(payment.requires))
      throw new TypeError("Identity payment check must list the identities it requires.");
    if (typeof payment.verify !== "function")
      throw new TypeError("Identity payment check must have a verify function.");
    serialize4(payment.requires);
  }
  return Object.freeze({ payment, request: Object.freeze([...request2]) });
}
function parseObject(identity) {
  if (identity === void 0)
    return {};
  if (typeof identity !== "object" || identity === null)
    throw new TypeError("Route identity must be an array of verifiers or { request, payment }.");
  const keys = Object.keys(identity);
  const unknown2 = keys.filter((key) => key !== "request" && key !== "payment");
  if (unknown2.length > 0 || "verify" in identity)
    throw new TypeError(`Route identity must be an array of verifiers or { request, payment }; got ${unknown2.length > 0 ? `key "${unknown2[0]}"` : "a verifier"}. Wrap a single verifier in an array.`);
  const { request: request2 } = identity;
  if (request2 !== void 0 && !Array.isArray(request2))
    throw new TypeError("Route identity request must be an array of verifiers.");
  return identity;
}
function assertRequestStage(verifier) {
  const stage = verifier.stage ?? "request";
  if (stage === "payment")
    throw new TypeError("Payment-stage identity verifiers were removed: pass a payment check as `identity: { payment }` instead.");
  if (stage !== "request")
    throw new TypeError(`Unknown identity verifier stage "${String(stage)}".`);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/internal/SecretKey.js
var minimumBytes = 32;
var generationCommand = "openssl rand -base64 32";
function assert7(secretKey) {
  if (new TextEncoder().encode(secretKey).byteLength >= minimumBytes)
    return;
  throw new Error(`Secret key must be at least ${minimumBytes} bytes. Generate one with \`${generationCommand}\` and set MPP_SECRET_KEY or pass it to Mppx.create().`);
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/NodeListener.js
async function sendResponse(res, response2) {
  if (isResponseClosed(res)) {
    await response2.body?.cancel("response connection closed").catch(() => {
    });
    return;
  }
  const headers = {};
  for (const [key, value] of response2.headers) {
    if (key in headers) {
      const existing = headers[key];
      if (Array.isArray(existing))
        existing.push(value);
      else
        headers[key] = [existing, value];
    } else {
      headers[key] = value;
    }
  }
  if ("req" in res && res.req?.httpVersionMajor === 1)
    res.writeHead(response2.status, response2.statusText, headers);
  else
    res.writeHead(response2.status, headers);
  if (response2.body != null && res.req?.method !== "HEAD") {
    const reader = response2.body.getReader();
    let connectionClosed = false;
    const onClose = () => {
      connectionClosed = true;
      void reader.cancel("response connection closed").catch(() => {
      });
    };
    res.once("close", onClose);
    if (isResponseClosed(res))
      onClose();
    try {
      if (res.destroyed || res.writableEnded) {
        await reader.cancel("response connection closed");
        return;
      }
      while (true) {
        const { done, value } = await reader.read();
        if (done || connectionClosed)
          break;
        if (res.write(value) === false) {
          try {
            if (!await waitForDrain(res)) {
              await reader.cancel("response connection closed");
              return;
            }
          } catch (error) {
            await reader.cancel(error).catch(() => {
            });
            throw error;
          }
        }
      }
    } finally {
      res.removeListener("close", onClose);
      reader.releaseLock();
    }
  }
  if (!isResponseClosed(res))
    res.end();
}
function isResponseClosed(res) {
  const stream = "stream" in res ? res.stream : void 0;
  return Boolean(res.destroyed || res.writableEnded || stream?.destroyed || stream?.closed);
}
function waitForDrain(res) {
  if (isResponseClosed(res))
    return Promise.resolve(false);
  return new Promise((resolve4, reject2) => {
    const cleanup = () => {
      res.removeListener("drain", onDrain);
      res.removeListener("close", onClose);
      res.removeListener("error", onError);
    };
    const onDrain = () => {
      cleanup();
      resolve4(true);
    };
    const onClose = () => {
      cleanup();
      resolve4(false);
    };
    const onError = (error) => {
      cleanup();
      reject2(error);
    };
    res.once("drain", onDrain);
    res.once("close", onClose);
    res.once("error", onError);
    if (isResponseClosed(res))
      onClose();
  });
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/Request.js
var defaultMaxBodySize = 10 * 1024 * 1024;
var bodyCompletions = /* @__PURE__ */ new WeakMap();
var RequestBodyTooLargeError = class extends Error {
  name = "RequestBodyTooLargeError";
};
function fromNodeListener(req, res, options) {
  let controller = new AbortController();
  res.once("close", () => controller?.abort());
  res.once("finish", () => {
    controller = null;
  });
  const method = req.method ?? "GET";
  const headers = createHeaders(req);
  const protocol = options?.protocol ?? ("encrypted" in req.socket && req.socket.encrypted ? "https:" : "http:");
  const host = options?.host ?? headers.get("Host") ?? req.headers[":authority"] ?? "localhost";
  const url = createRequestUrl(req.url, `${protocol}//${host}`);
  const init = {
    method,
    headers,
    signal: controller.signal
  };
  const maxBodySize = options?.maxBodySize ?? defaultMaxBodySize;
  validateBodySize(req, maxBodySize);
  let bodyCompletion;
  let body;
  if (hasBody(headers)) {
    const monitored = createBodyStream(req, maxBodySize);
    body = monitored.body;
    if (method !== "GET" && method !== "HEAD") {
      init.body = body;
      init.duplex = "half";
      bodyCompletion = monitored.completion;
    } else {
      void consumeBody(body).catch(() => {
      });
      bodyCompletion = monitored.completion;
    }
  }
  let request2;
  try {
    request2 = new Request(url, init);
  } catch (error) {
    void body?.cancel(error).catch(() => {
    });
    throw error;
  }
  if (bodyCompletion)
    bodyCompletions.set(request2, bodyCompletion);
  return request2;
}
async function waitForBody(request2) {
  const completion = bodyCompletions.get(request2);
  if (!completion)
    return;
  if (request2.body && !request2.bodyUsed && !request2.body.locked)
    await consumeBody(request2.body);
  const error = await completion;
  if (error !== void 0)
    throw error;
}
async function consumeBody(body) {
  const reader = body.getReader();
  try {
    while (!(await reader.read()).done) {
    }
  } finally {
    reader.releaseLock();
  }
}
function createBodyStream(req, maxBodySize) {
  let received = 0;
  let closed = false;
  let cleanup = () => {
  };
  let resolveCompletion;
  const completion = new Promise((resolve4) => {
    resolveCompletion = resolve4;
  });
  const body = new ReadableStream({
    start(controller) {
      const finish = (action, error) => {
        if (closed)
          return;
        closed = true;
        cleanup();
        action();
        resolveCompletion(error);
      };
      const onData = (value) => {
        const chunk = typeof value === "string" ? Buffer.from(value) : value;
        received += chunk.byteLength;
        if (received > maxBodySize) {
          const error = new RequestBodyTooLargeError(`Request body exceeds ${maxBodySize} bytes`);
          finish(() => controller.error(error), error);
          req.resume();
          return;
        }
        controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
        if ((controller.desiredSize ?? 0) <= 0)
          req.pause();
      };
      const onEnd = () => finish(() => controller.close());
      const onError = (error) => finish(() => controller.error(error), error);
      const onAborted = () => {
        const error = new Error("request aborted");
        finish(() => controller.error(error), error);
      };
      cleanup = () => {
        req.removeListener("data", onData);
        req.removeListener("end", onEnd);
        req.removeListener("error", onError);
        req.removeListener("aborted", onAborted);
      };
      req.pause();
      req.on("data", onData);
      req.once("end", onEnd);
      req.once("error", onError);
      req.once("aborted", onAborted);
    },
    pull() {
      if (!closed)
        req.resume();
    },
    cancel(reason) {
      if (closed)
        return;
      closed = true;
      cleanup();
      req.destroy(reason instanceof Error ? reason : void 0);
      resolveCompletion(reason);
    }
  });
  return { body, completion };
}
function validateBodySize(req, maxBodySize) {
  if (!Number.isSafeInteger(maxBodySize) || maxBodySize < 0)
    throw new TypeError("maxBodySize must be a non-negative safe integer");
  const contentLength = Number(req.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxBodySize) {
    req.resume();
    throw new RequestBodyTooLargeError(`Request body exceeds ${maxBodySize} bytes`);
  }
}
function hasBody(headers) {
  const contentLength = headers.get("content-length");
  return contentLength !== null && contentLength !== "0" || headers.has("transfer-encoding");
}
function createRequestUrl(target, origin) {
  const url = new URL(origin);
  if (!target)
    return url;
  let parsed;
  try {
    parsed = new URL(target, "http://mppx.invalid");
  } catch {
    throw new TypeError("Invalid request target");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
    throw new TypeError("Unsupported request target protocol");
  url.pathname = parsed.pathname;
  url.search = parsed.search;
  url.hash = "";
  return url;
}
function createHeaders(req) {
  const headers = new Headers();
  const raw = req.rawHeaders;
  for (let i = 0; i < raw.length; i += 2) {
    if (raw[i].startsWith(":"))
      continue;
    headers.append(raw[i], raw[i + 1]);
  }
  return headers;
}

// packages/payment-adapters/node_modules/.pnpm/mppx@0.18.0_@x402+core@2.30.0_viem@2.57.4_zod@4.6.7_/node_modules/mppx/dist/server/Mppx.js
var streamingReceiptWrappers = /* @__PURE__ */ new WeakSet();
function supportsStreamingReceipts(result) {
  return streamingReceiptWrappers.has(result.withReceipt);
}
var reservedMppxKeyValues = [
  "challenge",
  "compose",
  "methods",
  "on",
  "onChallengeCreated",
  "onPaymentFailed",
  "onPaymentSuccess",
  "realm",
  "broadcastCredential",
  "transport",
  "validateCredential",
  "verifyCredential"
];
var reservedMppxKeys = new Set(reservedMppxKeyValues);
function create3(config2) {
  const { requiresAuth, realm = get2("realm"), selectOffers, secretKey = get2("secretKey"), transport = http2({ requiresAuth }) } = config2;
  const credentialHeader2 = requiresAuth ? Headers2.paymentAuthorization : void 0;
  if ("attestation" in config2)
    throw new TypeError("Mppx server `attestation` was replaced by per-route `identity`: pass `identity: [verifier]` to each route.");
  if ("identity" in config2)
    throw new TypeError("Mppx server identity is configured per route: pass `identity: [verifier]` to each route.");
  if (!secretKey) {
    throw new Error("Missing secret key. Set the MPP_SECRET_KEY environment variable or pass `secretKey` to Mppx.create().");
  }
  assert7(secretKey);
  const methods = config2.methods.flat();
  const serverEvents = createServerEventDispatcher();
  const handlers3 = {};
  const methodHandlers = /* @__PURE__ */ new Map();
  const intentCount = {};
  function composeConfigured(configured) {
    if (transport.name === "mcp" || transport.name === "mcp-sdk")
      return composeMcpHandlers(configured, transport);
    return composeHandlers(configured, void 0, selectOffers);
  }
  function createGroupedHandler(group) {
    return (options) => composeConfigured(group.map((method) => methodHandlers.get(method)(options)));
  }
  for (const mi of methods) {
    intentCount[mi.intent] = (intentCount[mi.intent] ?? 0) + 1;
  }
  assertNoReservedMppxKeys(methods);
  for (const mi of methods) {
    const fn = createMethodFn({
      authorize: mi.authorize,
      credentialHeader: credentialHeader2,
      defaults: mi.defaults,
      method: mi,
      realm,
      events: serverEvents,
      preflight: mi.preflight,
      request: mi.request,
      respond: mi.respond,
      broadcast: mi.broadcast,
      secretKey,
      stableBinding: mi.stableBinding,
      transport: mi.transport ?? transport,
      validate: mi.validate,
      verify: mi.verify
    });
    const wireKey = `${mi.name}/${mi.intent}`;
    const aliasKey = mi.alias ? `${mi.name}/${mi.alias}` : void 0;
    if (mi.extensions)
      Object.assign(fn, mi.extensions);
    Object.assign(fn, { _method: mi });
    methodHandlers.set(mi, fn);
    if (!aliasKey || !handlers3[wireKey])
      handlers3[wireKey] = fn;
    if (aliasKey)
      handlers3[aliasKey] = fn;
  }
  const processedIntents = /* @__PURE__ */ new Set();
  for (const mi of methods) {
    if (processedIntents.has(mi.intent))
      continue;
    processedIntents.add(mi.intent);
    if (intentCount[mi.intent] === 1) {
      handlers3[mi.intent] = handlers3[`${mi.name}/${mi.intent}`];
    } else {
      const intentMethods = methods.filter((m) => m.intent === mi.intent);
      handlers3[mi.intent] = createGroupedHandler(intentMethods);
    }
  }
  for (const key of new Set(methods.filter((m) => !m.alias).map((m) => `${m.name}/${m.intent}`))) {
    const matching = methods.filter((m) => !m.alias && `${m.name}/${m.intent}` === key);
    if (matching.length < 2)
      continue;
    const composed = createGroupedHandler(matching);
    Object.assign(composed, matching[0].extensions);
    handlers3[key] = composed;
  }
  for (const mi of methods) {
    if (!handlers3[mi.name])
      handlers3[mi.name] = {};
    const key = mi.alias ? `${mi.name}/${mi.alias}` : `${mi.name}/${mi.intent}`;
    const fn = handlers3[key];
    fn._method ??= mi;
    handlers3[mi.name][mi.alias ?? mi.intent] = fn;
  }
  const challengeHandlers = {};
  for (const mi of methods) {
    if (!challengeHandlers[mi.name])
      challengeHandlers[mi.name] = {};
    if (challengeHandlers[mi.name][mi.alias ?? mi.intent])
      continue;
    challengeHandlers[mi.name][mi.alias ?? mi.intent] = createChallengeFn({
      credentialHeader: credentialHeader2,
      defaults: mi.defaults,
      method: mi,
      realm,
      request: mi.request,
      secretKey
    });
  }
  async function prepareStandaloneCredential(input, options, parameters = {}) {
    const credential = hydrateCredentialMeta(typeof input === "string" ? deserialize3(input) : input);
    const emitFailures = parameters.emitFailures === true;
    const { method: credMethod, intent: credIntent } = credential.challenge;
    const methodCandidates = methods.filter((m) => m.name === credMethod && m.intent === credIntent);
    let mi = methodCandidates[0];
    const eventMethod = mi ?? { intent: credIntent, name: credMethod };
    const emitStandalonePaymentFailed = async (failure2) => {
      if (!emitFailures)
        return;
      await serverEvents.emit("payment.failed", createPaymentFailedContext({
        capturedRequest: options?.capturedRequest,
        challenge: failure2.challenge,
        credential: failure2.credential,
        error: failure2.error,
        method: eventMethod,
        request: failure2.request,
        submittedChallenge: failure2.submittedChallenge
      }));
    };
    const fail = async (error, failure2 = {}, thrown = error) => {
      await emitStandalonePaymentFailed({
        challenge: credential.challenge,
        credential: failure2.credential ?? credential,
        error,
        request: failure2.request ?? credential.challenge.request,
        submittedChallenge: failure2.submittedChallenge ?? credential.challenge
      });
      throw thrown;
    };
    if (!mi) {
      await fail(new InvalidChallengeError({
        id: credential.challenge.id,
        reason: `no registered method for ${credMethod}/${credIntent}`
      }));
    }
    if (!verify2(credential.challenge, { secretKey })) {
      await fail(new InvalidChallengeError({
        id: credential.challenge.id,
        reason: "challenge was not issued by this server"
      }));
    }
    try {
      assert(credential.challenge.expires, credential.challenge.id);
    } catch (e) {
      if (e instanceof PaymentError)
        await fail(e);
      throw e;
    }
    if (methodCandidates.length > 1) {
      const matches3 = [
        ...new Set(methodCandidates.filter((candidate) => matchesStandaloneMethod(candidate, credential.challenge.request, options?.request)))
      ];
      if (matches3.length !== 1)
        await fail(new InvalidChallengeError({
          id: credential.challenge.id,
          reason: matches3.length === 0 ? "no configured method matches the challenge request" : "multiple configured methods match the challenge request; use a configured route handler"
        }));
      mi = matches3[0];
    }
    if (parameters.requireValidate && !mi.validate)
      await fail(new VerificationFailedError({
        details: { intent: credIntent, method: credMethod },
        reason: `${credMethod}/${credIntent} does not support non-mutating credential validation`
      }));
    let parsedCredential;
    try {
      parsedCredential = withParsedCredentialPayload(credential, mi.schema.credential.payload.parse(credential.payload));
    } catch (e) {
      await fail(new InvalidPayloadError(), {}, e);
    }
    const expectedMeta = merge3({ meta: options?.meta, scope: options?.scope });
    if (options?.scope !== void 0 && read(credential.challenge.meta) !== options.scope) {
      await fail(new InvalidChallengeError({
        id: credential.challenge.id,
        reason: "credential scope does not match this route's requirements"
      }), { credential: parsedCredential });
    }
    const shouldValidateRoute = options?.capturedRequest !== void 0 || options?.meta !== void 0 || options?.realm !== void 0 || options?.request !== void 0;
    const expectedRealm = options?.realm ?? realm;
    if (expectedRealm === void 0 && options?.capturedRequest === void 0 || expectedRealm !== void 0 && credential.challenge.realm !== expectedRealm)
      await fail(new InvalidChallengeError({
        id: credential.challenge.id,
        reason: "standalone verification requires a matching configured realm or trusted route context"
      }), { credential: parsedCredential });
    let parsedRequest = credential.challenge.request;
    let request2;
    try {
      request2 = shouldValidateRoute ? await resolveRouteChallenge({
        capturedRequest: options?.capturedRequest,
        credential: parsedCredential,
        defaults: mi.defaults,
        expires: credential.challenge.expires,
        header: credential.challenge.header,
        meta: expectedMeta,
        method: mi,
        realm: expectedRealm,
        request: mi.request,
        routeRequest: options?.request ?? {},
        secretKey
      }).then((resolved) => {
        const mismatch = getChallengeBindingMismatch(resolved.challenge, credential.challenge, mi.stableBinding);
        if (mismatch)
          throw new InvalidChallengeError({
            id: credential.challenge.id,
            reason: `credential ${mismatch} does not match this route's requirements`
          });
        parsedRequest = resolved.parsedRequest;
        return resolved.request;
      }) : credential.challenge.request;
    } catch (e) {
      if (e instanceof PaymentError)
        await fail(e, {
          credential: parsedCredential,
          request: credential.challenge.request
        });
      throw e;
    }
    const envelope = options?.capturedRequest ? {
      capturedRequest: options.capturedRequest,
      challenge: credential.challenge,
      credential: parsedCredential,
      request: parsedRequest
    } : void 0;
    return {
      credential,
      envelope,
      eventMethod,
      method: mi,
      parsedCredential,
      parsedRequest,
      request: request2,
      requestInput: shouldValidateRoute ? request2 : void 0
    };
  }
  async function validateCredentialFn(input, options) {
    const prepared = await prepareStandaloneCredential(input, options, { requireValidate: true });
    return prepared.method.validate({
      credential: prepared.parsedCredential,
      envelope: prepared.envelope,
      operation: "validate",
      request: prepared.request
    });
  }
  async function broadcastCredentialFn(input, options) {
    const prepared = await prepareStandaloneCredential(input, options, { emitFailures: true });
    const { method: mi, parsedCredential, parsedRequest, request: request2, requestInput, envelope } = prepared;
    const emitStandalonePaymentFailed = async (parameters) => {
      await serverEvents.emit("payment.failed", createPaymentFailedContext({
        capturedRequest: options?.capturedRequest,
        challenge: parameters.challenge,
        credential: parameters.credential,
        error: parameters.error,
        method: prepared.eventMethod,
        request: parameters.request,
        submittedChallenge: parameters.submittedChallenge
      }));
    };
    let receipt;
    let validation;
    try {
      if (mi.broadcast && mi.validate)
        validation = await mi.validate({
          credential: parsedCredential,
          envelope,
          operation: "broadcast",
          request: request2
        });
      const broadcast = mi.broadcast ?? mi.verify;
      receipt = await broadcast({ credential: parsedCredential, envelope, request: request2 });
    } catch (e) {
      const error = e instanceof PaymentError ? e : new InternalPaymentError({ cause: e });
      await emitStandalonePaymentFailed({
        challenge: prepared.credential.challenge,
        credential: parsedCredential,
        error,
        request: parsedRequest,
        submittedChallenge: prepared.credential.challenge
      });
      throw e;
    }
    await serverEvents.emit("payment.success", createPaymentSuccessContext({
      capturedRequest: options?.capturedRequest,
      challenge: prepared.credential.challenge,
      credential: parsedCredential,
      envelope,
      method: mi,
      payer: validation?.payer,
      receipt,
      request: parsedRequest,
      ...requestInput !== void 0 && { requestInput }
    }), mi);
    return receipt;
  }
  const verifyCredentialFn = broadcastCredentialFn;
  function composeFn(...entries) {
    const isMcp = transport.name === "mcp" || transport.name === "mcp-sdk";
    if (transport.name !== "http" && !isMcp)
      throw new Error("compose() only supports HTTP and MCP transports");
    if (entries.length === 0)
      throw new Error("compose() requires at least one entry");
    const configured = entries.map(([methodOrKey, options]) => {
      const method = typeof methodOrKey === "string" ? void 0 : typeof methodOrKey === "function" ? methodOrKey._method : methodOrKey;
      const key = typeof methodOrKey === "string" ? methodOrKey : `${method.name}/${method.alias ?? method.intent}`;
      const handlerFn = typeof methodOrKey === "function" && handlers3[key] === methodOrKey ? methodOrKey : method ? methodHandlers.get(method) : handlers3[key];
      if (!handlerFn)
        throw new Error(`No handler for "${key}". Is this method in your methods array?`);
      const configuredMethod = handlerFn._method;
      if (isMcp && configuredMethod?.transport && configuredMethod.transport.name !== transport.name)
        throw new Error("MCP compose() requires methods using the configured MCP transport");
      if (isMcp && configuredMethod?.canOffer)
        throw new Error("MCP compose() does not support HTTP canOffer hooks");
      return handlerFn(options);
    });
    if (isMcp)
      return composeMcpHandlers(configured, transport);
    return composeHandlers(configured, void 0, selectOffers);
  }
  function onChallengeCreated(handler) {
    return serverEvents.on("challenge.created", handler);
  }
  function onPaymentFailed(handler) {
    return serverEvents.on("payment.failed", handler);
  }
  function onPaymentSuccess(handler) {
    return serverEvents.on("payment.success", handler);
  }
  return {
    methods,
    challenge: challengeHandlers,
    compose: composeFn,
    on: serverEvents.on,
    onChallengeCreated,
    onPaymentFailed,
    onPaymentSuccess,
    realm,
    broadcastCredential: broadcastCredentialFn,
    transport,
    validateCredential: validateCredentialFn,
    verifyCredential: verifyCredentialFn,
    ...handlers3
  };
}
function createMethodFn(parameters) {
  const { authorize, credentialHeader: credentialHeader2, defaults: defaults2, events, method, preflight: preflight2, realm, respond, secretKey, broadcast, stableBinding, transport, validate: validate5, verify: verify5 } = parameters;
  return (routeOptions) => {
    const { identity, ...options } = routeOptions;
    const identityRoute = route(identity);
    const paymentCheck = identityRoute.payment;
    const identityRequirements = paymentCheck?.requires ?? [];
    const hasIdentity = identityRoute.request.length > 0 || paymentCheck !== void 0;
    if (paymentCheck && preflight2)
      throw new TypeError(`Payment-stage identity is not supported on ${method.name}/${method.intent} routes with a preflight hook.`);
    if (paymentCheck && method.html)
      throw new TypeError(`Payment-stage identity is not supported on ${method.name}/${method.intent} routes with the HTML checkout.`);
    const { description, meta: meta2, scope, ...rest } = options;
    const staticMeta = merge3({ meta: meta2, scope });
    const internal = {
      ...method,
      ...defaults2,
      ...options,
      ...staticMeta !== void 0 ? { meta: staticMeta } : {},
      name: method.name,
      intent: method.intent,
      html: method.html,
      credentialHeaders: [
        .../* @__PURE__ */ new Set([
          credentialHeader2 ?? Headers2.authorization,
          ...transport.credentialHeaders ?? []
        ])
      ],
      _canonicalRequest: fromMethod(method, { ...defaults2, ...rest }),
      _identity: hasIdentity,
      _paymentCheck: paymentCheck,
      _stableBinding: stableBinding,
      _transport: transport
    };
    Object.defineProperty(internal, "_method", { value: method });
    const handler = async (input, context) => {
      const identityContext = contextOf(context);
      if (hasIdentity && !(input instanceof globalThis.Request))
        throw new TypeError("Route identity requires the HTTP transport.");
      let identityState = transition2(initial2, {
        type: "verified",
        outcome: identityRoute.request.length > 0 ? await verify4(identityContext, input, identityRoute.request) : none
      });
      if (identityState.phase === "rejected")
        return identityRejection(identityState);
      const checkIdentity = async (challenge3, credential2, options2 = {}) => {
        identityState = transition2(identityState, {
          type: "pay",
          challenge: challenge3,
          credential: credential2
        });
        identityState = transition2(identityState, {
          type: "checked",
          outcome: !paymentCheck ? none : options2.challengeFromTransport ? (
            // Fails closed before settlement: the client proved nothing bound to this Challenge.
            decide([
              {
                status: "invalid",
                reason: "This route's identity payment check does not accept x402 credentials."
              }
            ])
          ) : await check(identityContext, paymentCheck, {
            challenge: challenge3,
            credential: credential2,
            request: input
          })
        });
        return identityState;
      };
      if (method.html && isServiceWorkerRequest(input))
        return {
          status: 402,
          challenge: createServiceWorkerResponse()
        };
      const expires = "expires" in options ? normalizeExpires(options.expires) : minutes(5);
      const capturedRequest = await captureRequest(transport, input);
      const effectiveMeta = scope === void 0 && input instanceof globalThis.Request ? merge3({ meta: staticMeta, scope: get(input) }) : staticMeta;
      const challengeMeta = effectiveMeta;
      let [credential, credentialError] = (() => {
        try {
          const credential2 = transport.getCredential(input);
          return [credential2 ? hydrateCredentialMeta(credential2) : null, void 0];
        } catch (e) {
          return [null, e];
        }
      })();
      if (preflight2 && input instanceof globalThis.Request) {
        const response2 = await preflight2({
          capturedRequest,
          credential,
          expires,
          input,
          options: { ...defaults2, ...rest },
          realm: realm ?? new URL(input.url).hostname ?? "MPP Payment",
          secretKey
        });
        if (response2) {
          if (response2.status === 402)
            return { challenge: response2, status: 402 };
          return {
            status: 200,
            identity: results(identityState),
            withReceipt() {
              return response2;
            }
          };
        }
      }
      const emitChallenge = async (parameters2) => {
        let response2 = await transport.respondChallenge({
          challenge: parameters2.challenge,
          input,
          ...parameters2.error && { error: parameters2.error },
          ...parameters2.html && { html: parameters2.html }
        });
        if (paymentCheck && response2 instanceof globalThis.Response && response2.headers.has(paymentRequiredHeader))
          response2 = withoutX402Offer(response2);
        const challenged = transition2(identityState, {
          type: "challenge",
          requirements: identityRequirements
        });
        identityState = challenged;
        if (challenged.phase === "challenged" && challenged.requirements.length > 0 && response2 instanceof globalThis.Response)
          response2 = withIdentityRequirements(response2, challenged.requirements);
        if (isIssuedChallengeResponse(response2))
          await events.emit("challenge.created", createChallengeContext({
            capturedRequest,
            challenge: parameters2.challenge,
            credential: parameters2.credential,
            error: parameters2.error,
            input,
            method,
            request: parameters2.request
          }));
        return response2;
      };
      const emitPaymentFailed = async (parameters2) => {
        await events.emit("payment.failed", createPaymentFailedContext({
          capturedRequest,
          challenge: parameters2.challenge,
          credential: parameters2.credential,
          error: parameters2.error,
          input,
          method,
          request: parameters2.request,
          retryChallenge: parameters2.retryChallenge,
          submittedChallenge: parameters2.submittedChallenge
        }));
      };
      const routeChallenge = await resolveRouteChallenge({
        capturedRequest,
        credential,
        defaults: defaults2,
        description,
        expires,
        header: credentialHeader2,
        meta: challengeMeta,
        method,
        realm,
        request: parameters.request,
        routeRequest: rest,
        secretKey
      }).catch(async (e) => {
        if (!(e instanceof PaymentError))
          throw e;
        const challenge3 = createFallbackChallenge({
          capturedRequest,
          defaults: defaults2 ?? {},
          description,
          expires,
          header: credentialHeader2,
          meta: challengeMeta,
          method,
          realm,
          routeRequest: rest,
          secretKey
        });
        if (credential)
          await emitPaymentFailed({
            challenge: challenge3,
            credential,
            error: e,
            request: challenge3.request,
            retryChallenge: challenge3,
            submittedChallenge: credential.challenge
          });
        const response2 = await emitChallenge({
          challenge: challenge3,
          credential,
          request: challenge3.request,
          error: e,
          html: method.html
        });
        return { response: response2 };
      });
      if ("response" in routeChallenge)
        return { challenge: routeChallenge.response, status: 402 };
      const { challenge: challenge2, parsedRequest, request: request2 } = routeChallenge;
      internal._canonicalRequest = parsedRequest;
      let challengeFromTransport = false;
      if (credential && transport.bindCredential) {
        const submitted = credential.challenge;
        try {
          credential = hydrateCredentialMeta(await transport.bindCredential({
            challenge: challenge2,
            credential,
            input
          }));
          challengeFromTransport = credential.challenge.id !== submitted.id;
        } catch (e) {
          credential = null;
          credentialError = e;
        }
      }
      if (credentialError) {
        const reason = getSafeCredentialReason(credentialError);
        const error = credentialError instanceof PaymentError ? credentialError : reason ? new MalformedCredentialError({ reason }) : new InternalPaymentError({ cause: credentialError });
        await emitPaymentFailed({
          challenge: challenge2,
          credential: null,
          error,
          request: parsedRequest,
          retryChallenge: challenge2
        });
        const response2 = await emitChallenge({
          challenge: challenge2,
          credential: null,
          request: parsedRequest,
          error,
          html: method.html
        });
        return { challenge: response2, status: 402 };
      }
      const success = (receiptData2, options2 = {}) => {
        const { challengeId = challenge2.id, credentialForReceipt = { challenge: challenge2, payload: {} }, envelopeForReceipt, managementResponse: managementResponse2 } = options2;
        const result = {
          status: 200,
          challenge: challenge2,
          identity: results(identityState),
          withReceipt(response2) {
            if (managementResponse2) {
              return transport.respondReceipt({
                challengeId,
                credential: credentialForReceipt,
                ...envelopeForReceipt ? { envelope: envelopeForReceipt } : {},
                input,
                receipt: receiptData2,
                response: managementResponse2
              });
            }
            if (!response2)
              throw new MissingReceiptResponseError();
            return transport.respondReceipt({
              challengeId,
              credential: credentialForReceipt,
              ...envelopeForReceipt ? { envelope: envelopeForReceipt } : {},
              input,
              receipt: receiptData2,
              response: response2
            });
          }
        };
        if (transport.supportsStreamingReceipts)
          streamingReceiptWrappers.add(result.withReceipt);
        return result;
      };
      if (!credential) {
        if (authorize && input instanceof globalThis.Request && (await checkIdentity(challenge2, void 0)).phase === "accepted") {
          try {
            const authorized = await authorize({
              challenge: challenge2,
              input,
              request: challenge2.request
            });
            if (authorized) {
              return success(authorized.receipt, {
                managementResponse: authorized.response
              });
            }
          } catch (e) {
            if (!(e instanceof PaymentError))
              console.error("mppx: internal authorization error", e);
            const error2 = e instanceof PaymentError ? e : new InternalPaymentError({ cause: e });
            await emitPaymentFailed({
              challenge: challenge2,
              credential: null,
              error: error2,
              request: parsedRequest,
              retryChallenge: challenge2
            });
            const response3 = await emitChallenge({
              challenge: challenge2,
              request: parsedRequest,
              error: error2,
              html: method.html
            });
            return { challenge: response3, status: 402 };
          }
        }
        const error = new PaymentRequiredError({ description });
        const response2 = await emitChallenge({
          challenge: challenge2,
          credential: null,
          request: parsedRequest,
          error,
          html: method.html
        });
        return { challenge: response2, status: 402 };
      }
      if (!verify2(credential.challenge, { secretKey })) {
        const error = new InvalidChallengeError({
          id: credential.challenge.id,
          reason: "challenge was not issued by this server"
        });
        await emitPaymentFailed({
          challenge: challenge2,
          credential,
          error,
          request: parsedRequest,
          retryChallenge: challenge2,
          submittedChallenge: credential.challenge
        });
        const response2 = await emitChallenge({
          challenge: challenge2,
          credential,
          request: parsedRequest,
          error,
          html: method.html
        });
        return { challenge: response2, status: 402 };
      }
      {
        const mismatch = getChallengeBindingMismatch(challenge2, credential.challenge, stableBinding);
        if (mismatch) {
          const error = new InvalidChallengeError({
            id: credential.challenge.id,
            reason: `credential ${mismatch} does not match this route's requirements`
          });
          await emitPaymentFailed({
            challenge: challenge2,
            credential,
            error,
            request: parsedRequest,
            retryChallenge: challenge2,
            submittedChallenge: credential.challenge
          });
          const response2 = await emitChallenge({
            challenge: challenge2,
            credential,
            request: parsedRequest,
            error,
            html: method.html
          });
          return { challenge: response2, status: 402 };
        }
      }
      try {
        assert(credential.challenge.expires, credential.challenge.id);
      } catch (error) {
        await emitPaymentFailed({
          challenge: challenge2,
          credential,
          error,
          request: parsedRequest,
          retryChallenge: challenge2,
          submittedChallenge: credential.challenge
        });
        const response2 = await emitChallenge({
          challenge: challenge2,
          credential,
          request: parsedRequest,
          error
        });
        return { challenge: response2, status: 402 };
      }
      let parsedCredential;
      try {
        parsedCredential = withParsedCredentialPayload(credential, method.schema.credential.payload.parse(credential.payload));
      } catch {
        const error = new InvalidPayloadError();
        await emitPaymentFailed({
          challenge: challenge2,
          credential,
          error,
          request: parsedRequest,
          retryChallenge: challenge2,
          submittedChallenge: credential.challenge
        });
        const response2 = await emitChallenge({
          challenge: challenge2,
          credential,
          request: parsedRequest,
          error
        });
        return { challenge: response2, status: 402 };
      }
      const envelope = Object.freeze({
        capturedRequest,
        challenge: credential.challenge,
        credential: parsedCredential,
        request: parsedRequest
      });
      const checked = await checkIdentity(credential.challenge, parsedCredential, {
        challengeFromTransport
      });
      if (checked.phase === "rejected") {
        const error = new VerificationFailedError({ reason: checked.rejection.reason });
        await emitPaymentFailed({
          challenge: challenge2,
          credential: parsedCredential,
          error,
          request: parsedRequest,
          retryChallenge: challenge2,
          submittedChallenge: credential.challenge
        });
        return identityRejection(checked);
      }
      let receiptData;
      let validation;
      try {
        if (broadcast && validate5)
          validation = await validate5({
            credential: parsedCredential,
            envelope,
            operation: "broadcast",
            request: request2
          });
        const broadcastCredential = broadcast ?? verify5;
        receiptData = await broadcastCredential({
          credential: parsedCredential,
          envelope,
          request: request2
        });
      } catch (e) {
        if (!(e instanceof PaymentError))
          console.error("mppx: internal verification error", e);
        const error = e instanceof PaymentError ? e : new InternalPaymentError({ cause: e });
        await emitPaymentFailed({
          challenge: challenge2,
          credential: parsedCredential,
          error,
          request: parsedRequest,
          retryChallenge: challenge2,
          submittedChallenge: credential.challenge
        });
        const response2 = await emitChallenge({
          challenge: challenge2,
          credential: parsedCredential,
          request: parsedRequest,
          error
        });
        return { challenge: response2, status: 402 };
      }
      const managementResponse = respond ? await respond({
        credential: parsedCredential,
        envelope,
        input,
        receipt: receiptData,
        request: request2
      }) : void 0;
      await events.emit("payment.success", createPaymentSuccessContext({
        capturedRequest,
        challenge: credential.challenge,
        credential: parsedCredential,
        envelope,
        input,
        method,
        payer: validation?.payer,
        receipt: receiptData,
        request: parsedRequest,
        requestInput: request2
      }), method);
      return success(receiptData, {
        challengeId: credential.challenge.id,
        credentialForReceipt: parsedCredential,
        envelopeForReceipt: envelope,
        managementResponse
      });
    };
    return Object.assign(handler, { _internal: internal });
  };
}
function createChallengeFn(parameters) {
  const { credentialHeader: credentialHeader2, defaults: defaults2, method, realm, secretKey } = parameters;
  return async (options) => {
    const { description, identity: _, meta: meta2, scope, ...rest } = options;
    const effectiveMeta = merge3({ meta: meta2, scope });
    const expires = "expires" in options ? normalizeExpires(options.expires) : minutes(5);
    return resolveRouteChallenge({
      defaults: defaults2,
      description,
      expires,
      header: credentialHeader2,
      meta: effectiveMeta,
      method,
      realm,
      request: parameters.request,
      routeRequest: rest,
      secretKey
    }).then((resolved) => resolved.challenge);
  };
}
function createServerEventDispatcher() {
  const handlers3 = {
    "*": /* @__PURE__ */ new Set(),
    "challenge.created": /* @__PURE__ */ new Set(),
    "payment.failed": /* @__PURE__ */ new Set(),
    "payment.success": /* @__PURE__ */ new Set()
  };
  const on = (name, handler) => {
    switch (name) {
      case "*":
      case "challenge.created":
      case "payment.failed":
      case "payment.success":
        handlers3[name].add(handler);
        return () => handlers3[name].delete(handler);
      default:
        throw new Error(`Unknown server event "${String(name)}".`);
    }
  };
  return {
    async emit(name, context, method) {
      if (name === "payment.success" && method?.onPaymentSuccess) {
        const success = context;
        try {
          await method.onPaymentSuccess({
            challenge: success.challenge,
            input: success.input,
            ...success.payer !== void 0 && { payer: success.payer },
            receipt: success.receipt,
            request: success.request,
            ...success.requestInput !== void 0 && { requestInput: success.requestInput }
          });
        } catch {
        }
      }
      await emitServerEventHandlers(handlers3[name], context);
      await emitServerEventHandlers(handlers3["*"], toServerEventEnvelope(name, context));
    },
    on
  };
}
function toServerEventEnvelope(name, payload) {
  return Object.freeze({ name, payload });
}
async function emitServerEventHandlers(handlers3, context) {
  for (const handler of handlers3) {
    try {
      await handler(context);
    } catch {
    }
  }
}
function assertNoReservedMppxKeys(methods) {
  for (const method of methods) {
    if (reservedMppxKeys.has(method.name))
      throw new Error(`Method name "${method.name}" conflicts with a reserved Mppx property.`);
    if (reservedMppxKeys.has(method.intent))
      throw new Error(`Method intent "${method.intent}" conflicts with a reserved Mppx property.`);
  }
}
function createChallengeContext(parameters) {
  return Object.freeze({
    ...parameters.capturedRequest ? { capturedRequest: snapshotCapturedRequest(parameters.capturedRequest) } : {},
    challenge: snapshotValue3(parameters.challenge),
    credential: parameters.credential === void 0 ? void 0 : snapshotNullableValue(parameters.credential),
    error: snapshotError(parameters.error),
    ...snapshotInputProperty(parameters.input),
    method: snapshotMethod3(parameters.method),
    request: snapshotValue3(parameters.request)
  });
}
function createPaymentFailedContext(parameters) {
  return Object.freeze({
    ...parameters.capturedRequest ? { capturedRequest: snapshotCapturedRequest(parameters.capturedRequest) } : {},
    challenge: snapshotValue3(parameters.challenge),
    credential: snapshotNullableValue(parameters.credential),
    error: snapshotError(parameters.error),
    ...snapshotInputProperty(parameters.input),
    method: snapshotMethod3(parameters.method),
    request: snapshotValue3(parameters.request),
    ...parameters.retryChallenge ? { retryChallenge: snapshotValue3(parameters.retryChallenge) } : {},
    ...parameters.submittedChallenge ? { submittedChallenge: snapshotValue3(parameters.submittedChallenge) } : {}
  });
}
function createPaymentSuccessContext(parameters) {
  return Object.freeze({
    ...parameters.capturedRequest ? { capturedRequest: snapshotCapturedRequest(parameters.capturedRequest) } : {},
    challenge: snapshotValue3(parameters.challenge),
    ...parameters.credential ? { credential: snapshotValue3(parameters.credential) } : {},
    ...parameters.envelope ? { envelope: snapshotVerifiedEnvelope(parameters.envelope) } : {},
    ...snapshotInputProperty(parameters.input),
    method: snapshotMethod3(parameters.method),
    ...parameters.payer !== void 0 && { payer: parameters.payer },
    receipt: snapshotValue3(parameters.receipt),
    request: snapshotValue3(parameters.request),
    ...parameters.requestInput !== void 0 && {
      requestInput: snapshotValue3(parameters.requestInput)
    }
  });
}
function snapshotMethod3(method) {
  return Object.freeze({
    intent: method.intent,
    name: method.name
  });
}
function snapshotError(error) {
  if (!error)
    return error;
  const snapshot = Object.assign(Object.create(Object.getPrototypeOf(error)), error);
  Object.defineProperties(snapshot, {
    ..."cause" in error && { cause: { value: error.cause, enumerable: false } },
    message: { value: error.message, enumerable: false },
    name: { value: error.name, enumerable: false }
  });
  return Object.freeze(snapshot);
}
function snapshotVerifiedEnvelope(envelope) {
  return Object.freeze({
    capturedRequest: snapshotCapturedRequest(envelope.capturedRequest),
    challenge: snapshotValue3(envelope.challenge),
    credential: snapshotValue3(envelope.credential),
    request: snapshotValue3(envelope.request)
  });
}
function snapshotCapturedRequest(capturedRequest) {
  return Object.freeze({
    headers: new Headers(capturedRequest.headers),
    hasBody: capturedRequest.hasBody,
    method: capturedRequest.method,
    url: new URL(capturedRequest.url)
  });
}
function snapshotNullableValue(value) {
  if (value === null)
    return null;
  return snapshotValue3(value);
}
function snapshotValue3(value) {
  try {
    return freezeSnapshot3(structuredClone(value));
  } catch {
    return freezeSnapshot3(cloneSnapshotFallback(value));
  }
}
function cloneSnapshotFallback(value, seen = /* @__PURE__ */ new WeakMap()) {
  if (!value || typeof value !== "object")
    return value;
  const existing = seen.get(value);
  if (existing)
    return existing;
  if (value instanceof Date)
    return new Date(value);
  if (value instanceof RegExp)
    return new RegExp(value.source, value.flags);
  if (value instanceof URL)
    return new URL(value);
  if (value instanceof Headers)
    return new Headers(value);
  if (value instanceof ArrayBuffer)
    return value.slice(0);
  if (ArrayBuffer.isView(value)) {
    const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice().buffer;
    if (value instanceof DataView)
      return new DataView(buffer);
    const Constructor = value.constructor;
    return new Constructor(buffer);
  }
  if (value instanceof Map) {
    const snapshot2 = /* @__PURE__ */ new Map();
    seen.set(value, snapshot2);
    for (const [key, entry] of value)
      snapshot2.set(cloneSnapshotFallback(key, seen), cloneSnapshotFallback(entry, seen));
    return snapshot2;
  }
  if (value instanceof Set) {
    const snapshot2 = /* @__PURE__ */ new Set();
    seen.set(value, snapshot2);
    for (const entry of value)
      snapshot2.add(cloneSnapshotFallback(entry, seen));
    return snapshot2;
  }
  const snapshot = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, snapshot);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length")
      continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor)
      continue;
    if ("value" in descriptor)
      descriptor.value = cloneSnapshotFallback(descriptor.value, seen);
    Object.defineProperty(snapshot, key, descriptor);
  }
  return snapshot;
}
function snapshotInputProperty(input) {
  if (input === void 0)
    return {};
  const snapshot = snapshotTransportInput(input);
  return snapshot === void 0 ? {} : { input: snapshot };
}
function snapshotTransportInput(input) {
  if (input instanceof globalThis.Request) {
    try {
      return new globalThis.Request(input.url, {
        headers: new Headers(input.headers),
        method: input.method
      });
    } catch {
      return void 0;
    }
  }
  try {
    return freezeSnapshot3(structuredClone(input));
  } catch {
    warnOnce(Warnings.transportInputSnapshot, "Could not clone server event input; omitting `context.input`. Use `capturedRequest` for request correlation.");
    return void 0;
  }
}
function freezeSnapshot3(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  Object.freeze(value);
  return value;
}
function isServiceWorkerRequest(input) {
  return input instanceof globalThis.Request && new URL(input.url).searchParams.has(params.serviceWorker);
}
function createServiceWorkerResponse() {
  return new Response(serviceWorker, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store"
    }
  });
}
function isIssuedChallengeResponse(response2) {
  return !(response2 instanceof globalThis.Response) || response2.status === 402;
}
function getSafeCredentialReason(error) {
  if (error instanceof InvalidCredentialEncodingError)
    return error.message;
  if (error instanceof MissingAuthorizationHeaderError)
    return error.message;
  if (error instanceof MissingPaymentSchemeError)
    return error.message;
  return void 0;
}
var defaultRealm = "MPP Payment";
var Warnings = {
  realmFallback: "realm-fallback",
  transportInputSnapshot: "transport-input-snapshot"
};
var missingReceiptResponseErrorName = "MissingReceiptResponseError";
var missingReceiptResponseErrorMessage = "withReceipt() requires a response argument";
var MissingReceiptResponseError = class extends Error {
  name = missingReceiptResponseErrorName;
  constructor() {
    super(missingReceiptResponseErrorMessage);
  }
};
function isMissingReceiptResponseError(error) {
  if (error instanceof MissingReceiptResponseError)
    return true;
  if (!error || typeof error !== "object")
    return false;
  const value = error;
  return value.name === missingReceiptResponseErrorName && value.message === missingReceiptResponseErrorMessage;
}
function normalizeExpires(expires) {
  return expires === void 0 ? void 0 : toDatetimeString(expires);
}
function resolveRealmFromCapturedRequest(capturedRequest) {
  try {
    const { protocol, hostname } = capturedRequest.url;
    if (/^https?:$/.test(protocol) && hostname)
      return hostname;
  } catch {
  }
  warnOnce(Warnings.realmFallback, `Could not auto-detect realm from request. Falling back to "${defaultRealm}". Set \`realm\` in Mppx.create() or the MPP_REALM env var.`);
  return defaultRealm;
}
async function resolveRouteChallenge(parameters) {
  const request2 = await (async () => {
    const merged = { ...parameters.defaults, ...parameters.routeRequest };
    return parameters.request ? await parameters.request({
      capturedRequest: parameters.capturedRequest,
      credential: parameters.credential,
      expires: parameters.credential?.challenge.expires ?? parameters.expires,
      request: merged
    }) : merged;
  })();
  const effectiveRealm = parameters.realm ?? (parameters.capturedRequest ? resolveRealmFromCapturedRequest(parameters.capturedRequest) : defaultRealm);
  const challenge2 = fromMethod2(parameters.method, {
    description: parameters.description,
    expires: parameters.expires,
    header: parameters.header,
    meta: withNonce(parameters.meta),
    realm: effectiveRealm,
    request: request2,
    secretKey: parameters.secretKey
  });
  return {
    challenge: challenge2,
    parsedRequest: challenge2.request,
    request: request2
  };
}
function createFallbackChallenge(parameters) {
  return fromMethod2(parameters.method, {
    description: parameters.description,
    expires: parameters.expires,
    header: parameters.header,
    meta: withNonce(parameters.meta),
    realm: parameters.realm ?? (parameters.capturedRequest ? resolveRealmFromCapturedRequest(parameters.capturedRequest) : defaultRealm),
    request: { ...parameters.defaults, ...parameters.routeRequest },
    secretKey: parameters.secretKey
  });
}
async function captureRequest(transport, input) {
  const capturedRequest = transport.captureRequest ? await transport.captureRequest(input) : captureRequestFromInput(input);
  return Object.freeze(capturedRequest);
}
function captureRequestFromInput(input) {
  const source = input;
  return {
    headers: new Headers(source.headers),
    hasBody: source.body === void 0 ? void 0 : source.body !== null,
    method: source.method ?? "POST",
    url: safeUrl(source.url)
  };
}
var coreBindingFields = ["amount", "currency", "recipient"];
var methodBindingFields = ["chainId", "memo", "sessionProtocol", "splits", "unitType"];
var pinnedRequestBindingFields = [...coreBindingFields, ...methodBindingFields];
function getChallengeBindingMismatch(expectedChallenge, actualChallenge, stableBinding) {
  if (!stableBinding)
    return getPinnedChallengeMismatch(expectedChallenge, actualChallenge);
  for (const field of ["method", "intent", "realm"]) {
    if (actualChallenge[field] !== expectedChallenge[field])
      return field;
  }
  if (!opaqueValuesMatch(expectedChallenge.meta, actualChallenge.meta))
    return "opaque";
  return getRequestBindingMismatch(getStableBinding(expectedChallenge.request, stableBinding), getStableBinding(actualChallenge.request, stableBinding));
}
function getPinnedChallengeMismatch(expectedChallenge, actualChallenge) {
  for (const field of ["method", "intent", "realm"]) {
    if (actualChallenge[field] !== expectedChallenge[field])
      return field;
  }
  if (!opaqueValuesMatch(expectedChallenge.meta, actualChallenge.meta))
    return "opaque";
  return getPinnedRequestBindingMismatch(expectedChallenge.request, actualChallenge.request);
}
function matchesStandaloneMethod(method, request2, routeRequest) {
  try {
    const configured = { ...method.defaults, ...routeRequest };
    const parsed = method.schema.request.safeParse(configured);
    const expectedRequest = parsed.success ? parsed.data : configured;
    const binding = (value) => {
      if (method.stableBinding)
        return getStableBinding(value, method.stableBinding);
      const { coreBinding, methodBinding } = getPinnedRequestBinding(value);
      return { ...coreBinding, ...methodBinding };
    };
    const expected = binding(expectedRequest);
    const actual = binding(request2);
    return Object.entries(expected).every(([key, value]) => value === void 0 || isDeepStrictEqual2(normalizeComparable(value), normalizeComparable(actual[key])));
  } catch {
    return false;
  }
}
function getPinnedRequestBindingMismatch(expectedRequest, actualRequest) {
  const expected = getPinnedRequestBinding(expectedRequest);
  const actual = getPinnedRequestBinding(actualRequest);
  return getCoreBindingMismatch(expected.coreBinding, actual.coreBinding) ?? getMethodBindingMismatch(expected.methodBinding, actual.methodBinding);
}
function getConfiguredRequestBindingMismatch(configuredRequest, actualRequest) {
  const expected = getPinnedRequestBinding(configuredRequest);
  const actual = getPinnedRequestBinding(actualRequest);
  return getCoreBindingMismatch(expected.coreBinding, actual.coreBinding) ?? methodBindingFields.find((field) => expected.methodBinding[field] !== void 0 && !isDeepStrictEqual2(expected.methodBinding[field], actual.methodBinding[field]));
}
function getCoreBindingMismatch(expected, actual) {
  return coreBindingFields.find((field) => !isDeepStrictEqual2(expected[field], actual[field]));
}
function getMethodBindingMismatch(expected, actual) {
  return methodBindingFields.find((field) => !isDeepStrictEqual2(expected[field], actual[field]));
}
function getPinnedRequestBinding(request2) {
  const methodDetails = request2.methodDetails ?? {};
  const amount2 = normalizeScalar(request2.amount ?? methodDetails.amount);
  const chainId = normalizeScalar(request2.chainId ?? methodDetails.chainId);
  const currency = normalizeScalar(request2.currency ?? methodDetails.currency);
  const memo = normalizeHex(methodDetails.memo);
  const recipient = normalizeScalar(request2.recipient ?? methodDetails.recipient);
  const sessionProtocol = normalizeScalar(methodDetails.sessionProtocol);
  const splits = normalizeComparable(methodDetails.splits);
  const unitType = normalizeScalar(request2.unitType ?? methodDetails.unitType);
  return {
    coreBinding: {
      ...amount2 !== void 0 ? { amount: amount2 } : {},
      ...currency !== void 0 ? { currency } : {},
      ...recipient !== void 0 ? { recipient } : {}
    },
    methodBinding: {
      ...chainId !== void 0 ? { chainId } : {},
      ...memo !== void 0 ? { memo } : {},
      ...sessionProtocol !== void 0 ? { sessionProtocol } : {},
      ...splits !== void 0 ? { splits } : {},
      ...unitType !== void 0 ? { unitType } : {}
    }
  };
}
function getConfiguredStableBindingMismatch(expected, actual) {
  return Object.keys(expected).find((field) => expected[field] !== void 0 && !isDeepStrictEqual2(normalizeComparable(expected[field]), normalizeComparable(actual[field])));
}
function getRequestBindingMismatch(expected, actual) {
  const fields = [
    ...Object.keys(expected),
    ...Object.keys(actual).filter((key) => !(key in expected))
  ];
  return fields.find((field) => !isDeepStrictEqual2(normalizeComparable(expected[field]), normalizeComparable(actual[field])));
}
function getStableBinding(request2, stableBinding) {
  return stableBinding(request2);
}
function normalizeScalar(value) {
  return value === void 0 ? void 0 : String(value);
}
function normalizeHex(value) {
  if (value === void 0)
    return void 0;
  const normalized = String(value);
  return normalized.startsWith("0x") ? normalized.toLowerCase() : normalized;
}
function normalizeComparable(value) {
  if (value === void 0)
    return void 0;
  if (Array.isArray(value))
    return value.map(normalizeComparable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, normalizeComparable(nested)]));
  }
  return typeof value === "string" ? normalizeHex(value) : value;
}
function opaqueValuesMatch(expected, actual) {
  return isDeepStrictEqual2(routeMeta(expected), routeMeta(actual));
}
function hydrateCredentialMeta(credential) {
  const { challenge: challenge2 } = credential;
  if (challenge2.opaque === void 0)
    return credential;
  const hydratedChallenge = Schema.parse({
    ...challenge2,
    meta: deserialize(challenge2.opaque)
  });
  return {
    ...credential,
    challenge: hydratedChallenge
  };
}
function withParsedCredentialPayload(credential, payload) {
  return {
    ...credential,
    payload
  };
}
var paymentAuthChallengeHeader = Headers2.wwwAuthenticate;
function identityRejection(state) {
  return {
    challenge: toResponse(state),
    rejection: state.rejection,
    status: 402
  };
}
function withIdentityRequirements(response2, requirements) {
  return withHeaders(response2, (headers) => headers.set(header, serialize4(requirements)));
}
function withHeaders(response2, edit) {
  const headers = new Headers(response2.headers);
  edit(headers);
  const result = new Response(response2.body, {
    headers,
    status: response2.status,
    statusText: response2.statusText
  });
  const withheld = withheldX402.get(response2);
  if (withheld)
    withheldX402.set(result, withheld);
  return result;
}
var withheldX402 = /* @__PURE__ */ new WeakMap();
function withoutX402Offer(response2) {
  const value = response2.headers.get(paymentRequiredHeader);
  const result = withHeaders(response2, (headers) => headers.delete(paymentRequiredHeader));
  const accepts = (() => {
    try {
      return value ? decodePaymentRequiredEnvelope(value).accepts : [];
    } catch {
      return [];
    }
  })();
  withheldX402.set(result, [...withheldX402.get(response2) ?? [], ...accepts]);
  return result;
}
function withWithheldX402(response2, withheld) {
  if (withheld.length > 0)
    withheldX402.set(response2, withheld);
  return response2;
}
function withoutWithheldX402(value, withheld) {
  if (withheld.length === 0)
    return value;
  const paymentRequired2 = decodePaymentRequired(value);
  const accepts = paymentRequired2.accepts.filter((accept) => !withheld.some((requirement) => isDeepStrictEqual2(accept, requirement)));
  if (accepts.length === paymentRequired2.accepts.length)
    return value;
  if (accepts.length === 0)
    return void 0;
  return encodePaymentRequired({ ...paymentRequired2, accepts });
}
var challengeHeaderMerges = [
  {
    name: paymentAuthChallengeHeader,
    values: (context) => context.challengeEntries.map((entry) => entry.result.challenge.headers.get(paymentAuthChallengeHeader)).filter((value) => value !== null),
    merge: (values) => values
  },
  {
    name: paymentRequiredHeader,
    values: (context) => context.negotiatedChallengeResponses.map((response2) => response2.headers.get(paymentRequiredHeader)).filter((value) => value !== null).map((value) => withoutWithheldX402(value, context.withheldX402)).filter((value) => value !== void 0),
    merge: mergeX402PaymentRequiredHeaders
  }
];
function compose(...args) {
  const last = args[args.length - 1];
  const composeOptions = typeof last === "object" && last !== null && typeof last !== "function" && !("_internal" in last) ? (() => {
    const opts = last;
    return {
      config: {},
      content: "",
      formatAmount: () => "",
      text: opts.text,
      theme: opts.theme
    };
  })() : void 0;
  const handlers3 = composeOptions ? args.slice(0, -1) : args;
  return composeHandlers(handlers3, composeOptions);
}
function composeHandlers(handlers3, composeOptions, selectOffers) {
  handlers3 = handlers3.flatMap((handler) => {
    const internal = handler._internal;
    return internal?.selectOffers === selectOffers ? internal?.handlers ?? [handler] : [handler];
  });
  if (handlers3.length === 0)
    throw new Error("compose() requires at least one handler");
  const paymentChecks = new Set(handlers3.flatMap((handler) => getConfiguredOffers(handler)).flatMap((offer) => offer._paymentCheck ?? []));
  if (paymentChecks.size > 1)
    throw new TypeError("Offers in a composed route must use the same identity payment check.");
  if (hasCheckedTwin(handlers3.flatMap((handler) => getConfiguredOffers(handler))))
    throw new TypeError("A composed route cannot pair offers with the same payment terms where only one has an identity payment check.");
  const offerSelector = selectOffers;
  const offerEntries = handlers3.map((handler) => {
    const internal = handler._internal;
    const offer = internal && !isComposedHandlerMetadata(internal) ? createServerOffer(internal) : void 0;
    const method = internal && !isComposedHandlerMetadata(internal) ? internal._method : void 0;
    return { handler, method, offer };
  });
  const hasOfferPolicy = offerSelector !== void 0 || offerEntries.some(({ method }) => method?.canOffer !== void 0);
  const composed = async (input, context) => {
    const identityContext = contextOf(context);
    const call = (handler) => handler(input, identityContext);
    if (new URL(input.url).searchParams.has(params.serviceWorker)) {
      const hasHtml = handlers3.some((h) => h._internal?.html);
      if (hasHtml)
        return {
          status: 402,
          challenge: new Response(serviceWorker, {
            status: 200,
            headers: {
              "Content-Type": "application/javascript",
              "Cache-Control": "no-store"
            }
          })
        };
    }
    const credentialHeaders3 = new Set(handlers3.flatMap((handler) => getConfiguredOffers(handler).flatMap((internal) => internal.credentialHeaders ?? [])));
    const paymentHeader = Array.from(credentialHeaders3).map((header2) => input.headers.get(header2)).filter((value) => value !== null).map((value) => extractPaymentScheme(value)).find((value) => value !== null);
    if (paymentHeader) {
      let credential;
      try {
        credential = hydrateCredentialMeta(deserialize3(paymentHeader));
      } catch {
      }
      if (credential) {
        const { method: credMethod, intent: credIntent } = credential.challenge;
        const credReq = credential.challenge.request;
        const matches3 = (internal) => {
          try {
            if (internal.name !== credMethod || internal.intent !== credIntent)
              return false;
            const mismatch = internal._stableBinding ? getConfiguredStableBindingMismatch(getStableBinding(internal._canonicalRequest, internal._stableBinding), getStableBinding(credReq, internal._stableBinding)) : getConfiguredRequestBindingMismatch(internal._canonicalRequest, credReq);
            const effectiveMeta = internal.scope === void 0 ? merge3({ meta: internal.meta, scope: get(input) }) : internal.meta;
            return !mismatch && opaqueValuesMatch(effectiveMeta, credential.challenge.meta);
          } catch {
            return false;
          }
        };
        const candidates = handlers3.filter((handler) => getConfiguredOffers(handler).some(matches3));
        const match = candidates.find((handler) => getConfiguredOffers(handler).some((internal) => matches3(internal) && internal._paymentCheck !== void 0)) ?? candidates[0] ?? handlers3.find((handler) => getConfiguredOffers(handler).some((internal) => internal.name === credMethod && internal.intent === credIntent));
        if (match)
          return call(match);
      }
    }
    const selectedHandlers = hasOfferPolicy ? await selectOfferHandlers({
      entries: offerEntries,
      input,
      selectOffers: offerSelector
    }) : handlers3;
    const transportResults = /* @__PURE__ */ new Map();
    const transportMatches = [];
    for (const handler of selectedHandlers) {
      let matched = false;
      let checked = false;
      for (const internal of getConfiguredOffers(handler)) {
        const matchCredential = internal._transport.matchCredential;
        if (!matchCredential)
          continue;
        try {
          if (!await matchCredential({ input, request: internal._canonicalRequest }))
            continue;
        } catch {
          continue;
        }
        matched = true;
        if (internal._paymentCheck !== void 0)
          checked = true;
      }
      if (matched)
        transportMatches.push({ handler, checked });
    }
    for (const { handler } of [
      ...transportMatches.filter(({ checked }) => checked),
      ...transportMatches.filter(({ checked }) => !checked)
    ]) {
      const result = await call(handler);
      transportResults.set(handler, result);
      if (result.status === 200 || result.rejection)
        return result;
    }
    const transportCredentialHandler = selectedHandlers.find((handler) => getConfiguredOffers(handler).some((internal) => internal.credentialHeaders?.some((header2) => {
      const value = input.headers.get(header2);
      return header2.toLowerCase() !== Headers2.authorization.toLowerCase() && value !== null && extractPaymentScheme(value) === null;
    })));
    if (transportCredentialHandler)
      return call(transportCredentialHandler);
    const results2 = [];
    for (const handler of selectedHandlers) {
      const result = transportResults.get(handler) ?? await call(handler);
      if (result.status === 200)
        return result;
      if (result.challenge.status !== 402 && !result.rejection)
        return result;
      results2.push(result);
    }
    const offers2 = results2.filter((result) => result.status === 402 && !result.rejection);
    if (offers2.length === 0 && results2[0])
      return results2[0];
    const challengeEntries = (() => {
      const entries = [];
      for (let i = 0; i < selectedHandlers.length; i++) {
        const result = results2[i];
        if (result?.status !== 402)
          continue;
        if (result.rejection)
          continue;
        const response2 = result.challenge;
        const wwwAuth = response2.headers.get(paymentAuthChallengeHeader);
        if (!wwwAuth)
          continue;
        entries.push({
          handler: selectedHandlers[i],
          challenge: deserialize2(wwwAuth),
          result
        });
      }
      const acceptPayment = input.headers.get(Headers2.acceptPayment);
      if (!acceptPayment)
        return entries;
      try {
        const ranked = rank(entries.map((entry) => entry.challenge), parse4(acceptPayment));
        if (ranked.length === 0)
          return entries;
        const entriesById = new Map(entries.map((entry) => [entry.challenge.id, entry]));
        return ranked.map((challenge2) => entriesById.get(challenge2.id));
      } catch {
        return entries;
      }
    })();
    const challengeResponses = offers2.map((result) => result.challenge);
    const unnegotiatedX402Responses = input.headers.has(Headers2.acceptPayment) || challengeEntries.length === 0 ? [] : challengeResponses.filter((response2) => response2.headers.has(paymentRequiredHeader) && !response2.headers.has(paymentAuthChallengeHeader));
    const negotiatedChallengeResponses = challengeEntries.length > 0 ? [
      ...challengeEntries.map((entry) => entry.result.challenge),
      ...unnegotiatedX402Responses
    ] : challengeResponses;
    const identityRequirements = merge2(negotiatedChallengeResponses.map((response2) => parse3(response2.headers.get(header))));
    const withheld = results2.flatMap((result) => result.status === 402 && result.challenge instanceof globalThis.Response ? withheldX402.get(result.challenge) ?? [] : []);
    const mergedHeaders = new Headers();
    mergedHeaders.set("Cache-Control", "no-store");
    for (const header2 of challengeHeaderMerges) {
      for (const value of header2.merge(header2.values({
        challengeEntries,
        challengeResponses,
        negotiatedChallengeResponses,
        withheldX402: withheld
      }))) {
        mergedHeaders.append(header2.name, value);
      }
    }
    if (identityRequirements.length > 0)
      mergedHeaders.set(header, serialize4(identityRequirements));
    const htmlEntries = challengeEntries.filter((entry) => entry.handler._internal?.html);
    const wantsHtml = input.headers.get("Accept")?.includes("text/html");
    if (wantsHtml && htmlEntries.length > 0) {
      const { theme, text } = resolveOptions(
        // Use compose-level options or first html-enabled method's config for the page shell
        composeOptions ?? htmlEntries[0]?.handler._internal.html ?? {}
      );
      const dataMap = {};
      for (let i = 0; i < htmlEntries.length; i++) {
        const entry = htmlEntries[i];
        dataMap[entry.challenge.id] = {
          label: entry.handler._internal.name,
          rootId: `${ids.root}-${i}`,
          formattedAmount: await entry.handler._internal.html.formatAmount(entry.challenge.request),
          config: entry.handler._internal.html.config,
          challenge: entry.challenge,
          text,
          theme
        };
      }
      mergedHeaders.set("Content-Type", "text/html; charset=utf-8");
      const firstData = Object.values(dataMap)[0];
      const entries = await Promise.all(htmlEntries.map(async (entry) => ({
        challenge: entry.challenge,
        content: await resolveContent(entry.handler._internal.html.content)
      })));
      const body2 = render({
        entries,
        dataMap,
        formattedAmount: firstData.formattedAmount,
        panels: true,
        text,
        theme
      });
      return {
        status: 402,
        challenge: withWithheldX402(new Response(body2, { status: 402, headers: mergedHeaders }), withheld)
      };
    }
    let body = null;
    const bodyResponses = challengeEntries.length > 0 ? challengeEntries.map((entry) => entry.result.challenge) : challengeResponses;
    for (const response2 of bodyResponses) {
      if (!body) {
        const contentType = response2.headers.get("Content-Type");
        if (contentType)
          mergedHeaders.set("Content-Type", contentType);
        body = await response2.text();
        break;
      }
    }
    return {
      status: 402,
      challenge: withWithheldX402(new Response(body, { status: 402, headers: mergedHeaders }), withheld)
    };
  };
  const offers = handlers3.flatMap(getConfiguredOffers);
  if (offers.length > 0)
    composed._internal = { offers, handlers: handlers3, selectOffers };
  return composed;
}
function hasCheckedTwin(offers) {
  const checked = offers.filter((offer) => offer._paymentCheck !== void 0);
  const unchecked = offers.filter((offer) => offer._paymentCheck === void 0);
  return checked.some((a) => unchecked.some((b) => a.name === b.name && a.intent === b.intent && sameTerms(a, b) && sameTerms(b, a)));
}
function sameTerms(a, b) {
  try {
    return !(a._stableBinding ? getConfiguredStableBindingMismatch(getStableBinding(a._canonicalRequest, a._stableBinding), getStableBinding(b._canonicalRequest, a._stableBinding)) : getConfiguredRequestBindingMismatch(a._canonicalRequest, b._canonicalRequest));
  } catch {
    return false;
  }
}
function getConfiguredOffers(handler) {
  const internal = handler._internal;
  if (!internal)
    return [];
  if (isComposedHandlerMetadata(internal))
    return internal.offers;
  return [internal];
}
function composeMcpHandlers(handlers3, transport) {
  const composed = async (input) => {
    let credential;
    try {
      const parsed = transport.getCredential(input);
      credential = parsed ? hydrateCredentialMeta(parsed) : null;
    } catch {
      return handlers3[0](input);
    }
    if (credential) {
      const candidates = handlers3.filter((handler) => getConfiguredOffers(handler).some((internal) => internal.name === credential.challenge.method && internal.intent === credential.challenge.intent));
      const match = candidates.find((handler) => getConfiguredOffers(handler).some((internal) => {
        try {
          const mismatch = internal._stableBinding ? getConfiguredStableBindingMismatch(getStableBinding(internal._canonicalRequest, internal._stableBinding), getStableBinding(credential.challenge.request, internal._stableBinding)) : getConfiguredRequestBindingMismatch(internal._canonicalRequest, credential.challenge.request);
          return !mismatch && opaqueValuesMatch(internal.meta, credential.challenge.meta);
        } catch {
          return false;
        }
      }));
      return (match ?? candidates[0] ?? handlers3[0])(input);
    }
    const challenges = [];
    let first;
    for (const handler of handlers3) {
      const result = await handler(input);
      if (result.status === 200)
        return result;
      const response2 = result.challenge;
      const error = "code" in response2 ? response2 : response2.error;
      if (!error || error.code !== paymentRequiredCode)
        return result;
      const data = error.data;
      if (!data?.challenges?.length)
        return result;
      first ??= response2;
      challenges.push(...data.challenges);
    }
    if (!first)
      throw new Error("compose() requires at least one handler");
    if ("code" in first) {
      const { McpError } = await import("@modelcontextprotocol/sdk/types.js");
      return {
        status: 402,
        challenge: new McpError(first.code, "Payment Required", {
          ...first.data,
          challenges
        })
      };
    }
    return {
      status: 402,
      challenge: {
        jsonrpc: first.jsonrpc,
        id: first.id,
        error: { ...first.error, data: { ...first.error.data, challenges } }
      }
    };
  };
  composed._internal = {
    offers: handlers3.flatMap((handler) => getConfiguredOffers(handler))
  };
  return composed;
}
function isComposedHandlerMetadata(internal) {
  return "offers" in internal && !("_canonicalRequest" in internal);
}
function createServerOffer(internal) {
  return Object.freeze({
    key: `${internal.name}/${internal.intent}`,
    method: Object.freeze({
      ...internal._method.alias ? { alias: internal._method.alias } : {},
      intent: internal.intent,
      name: internal.name
    }),
    request: immutableSnapshot(internal._canonicalRequest)
  });
}
async function selectOfferHandlers(parameters) {
  const { entries, input, selectOffers } = parameters;
  const eligibleEntries = [];
  for (const entry of entries) {
    const canOffer = entry.method?.canOffer;
    if (canOffer) {
      const approved = await canOffer({
        input: cloneOfferInput(input),
        request: entry.offer.request
      });
      if (typeof approved !== "boolean")
        throw new Error("canOffer() must return a boolean");
      if (!approved)
        continue;
    }
    eligibleEntries.push(entry);
  }
  if (eligibleEntries.length === 0)
    throw new Error("No payment offers are available for this request");
  if (!selectOffers)
    return eligibleEntries.map(({ handler }) => handler);
  const offers = eligibleEntries.map(({ offer }) => {
    if (!offer)
      throw new Error("selectOffers() can only select configured payment offers");
    return offer;
  });
  const selected = await selectOffers(Object.freeze(offers), Object.freeze({ request: cloneOfferInput(input) }));
  if (!Array.isArray(selected))
    throw new Error("selectOffers() must return an array of offers");
  if (selected.length === 0)
    throw new Error("selectOffers() must select at least one offer");
  let previousIndex = -1;
  const selectedHandlers = selected.map((offer) => {
    const index = offers.indexOf(offer);
    if (index === -1)
      throw new Error("selectOffers() must return only offers from its input array");
    if (index <= previousIndex)
      throw new Error("selectOffers() must preserve offer order and must not return duplicates");
    previousIndex = index;
    return eligibleEntries[index].handler;
  });
  return selectedHandlers;
}
function cloneOfferInput(input) {
  try {
    return input.clone();
  } catch {
    return new globalThis.Request(input.url, {
      headers: new Headers(input.headers),
      method: input.method,
      signal: input.signal
    });
  }
}
function immutableSnapshot(value) {
  return deepFreeze3(structuredClone(value));
}
function deepFreeze3(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value))
    return value;
  for (const nested of Object.values(value))
    deepFreeze3(nested);
  return Object.freeze(value);
}
function mergeX402PaymentRequiredHeaders(values) {
  if (values.length === 0)
    return [];
  const [first, ...rest] = values.map((value) => decodePaymentRequired(value));
  if (!first)
    throw new Error("Expected at least one x402 payment-required header.");
  const incompatible = rest.some((value) => !isDeepStrictEqual2(value.resource, first.resource) || !isDeepStrictEqual2(value.extensions, first.extensions));
  if (incompatible)
    return [
      encodePaymentRequired({
        ...first,
        error: [first.error, "Cannot merge x402 payment requirements with different resources."].filter((value) => value !== void 0 && value.length > 0).join("; ")
      })
    ];
  const error = [first.error, ...rest.map((value) => value.error)].filter((value) => value !== void 0 && value.length > 0).join("; ");
  return [
    encodePaymentRequired({
      ...first,
      accepts: [first.accepts, ...rest.map((value) => value.accepts)].flat(),
      ...error ? { error } : {}
    })
  ];
}
function toNodeListener(handler, options) {
  return async (req, res) => {
    let result;
    try {
      const request2 = fromNodeListener(req, res, options);
      await waitForBody(request2);
      result = await handler(request2);
    } catch (error) {
      if (!(error instanceof RequestBodyTooLargeError))
        throw error;
      const response2 = new globalThis.Response("Payload Too Large", {
        status: 413,
        headers: { "Content-Type": "text/plain" }
      });
      await sendResponse(res, response2);
      return { challenge: response2, status: 402 };
    }
    if (result.status === 402) {
      await sendResponse(res, result.challenge);
    } else {
      const managementResponse = await getManagementResponse(result);
      if (managementResponse) {
        await sendResponse(res, managementResponse);
        return { challenge: managementResponse, status: 402 };
      }
      const wrapped = await result.withReceipt(new globalThis.Response(null, { status: 204 }));
      if (wrapped.status === 402) {
        await sendResponse(res, wrapped);
        return { challenge: wrapped, status: 402 };
      }
      for (const [name, value] of wrapped.headers)
        res.setHeader(name, value);
    }
    return result;
  };
}
async function getManagementResponse(result) {
  try {
    return await result.withReceipt();
  } catch (error) {
    if (isMissingReceiptResponseError(error)) {
      return null;
    }
    throw error;
  }
}
export {
  Mppx_exports as MppClient,
  Mppx_exports2 as MppServer,
  evm as clientEvm,
  evm2 as serverEvm
};
/*! For license information please see mpp-runtime.mjs.LEGAL.txt */
