/**
 * Contains a bunch of routines to compact various integer data into
 * a sequence of six-bit unsigned ints (uint6) which we map to
 * a base64-like encoding
 */
import {memoize} from './defs';

const chrs64 = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '-', '_'
] as const;

type chr64 = typeof chrs64[number]
type uint6 = number;
type uint = number;
type int = number;

const chr2int = Object.fromEntries(chrs64.map((c,i) => [c, i])) as Record<chr64, uint6>,
      int2chr = Object.fromEntries(chrs64.map((c,i) => [i, c])) as Record<uint6, chr64>;

function ischr64(c: string): c is chr64 {
    return (chrs64 as readonly string[]).includes(c);
}

/** test v is unsigned integer */
function isuint(v: number): v is uint {
    return Number.isInteger(v) && v >= 0;
}

// memoized Fibonacci numbers
const fib = memoize((n: uint): uint => n < 2 ? n: fib(n-1) + fib(n-2));


function seq2str(seq: uint6[]): string {
    if (seq.some(u => !isuint(u) || u >= 64))
        throw new Error(`seq2str: Invalid uint6 in input ${seq}`)
    return seq.map(u => int2chr[u]).join('');
}

function str2seq(s: string): uint6[] {
    const chrs = s.split('');
    if (!chrs.every(ischr64) )
        throw new Error(`str2seq: Unexpected characters in '${s}'`);
    return chrs.map(c => chr2int[c]);
}

/** convert payload to string, wrapping with optional prefix string, length marker, and CRC check */
function wrap64(payload: uint6[], prefix: string, length_maxbits = 12): string {
    const seq = ([] as number[]).concat(
        bitsencode(payload.length, length_maxbits),
        payload,
        fletcher6(payload),
    );
    return (prefix || '') + seq2str(seq);
}

/** unwrap payload to seqas wrapped by wrap64, ignoring garbage and trailing characters */
function unwrap64(s: string, prefix: string, length_maxbits = 12): uint6[] {
    prefix ||= '';

    // check prefix
    if (!s.startsWith(prefix)) throw new Error(`unwrap64: string didn't start with expected prefix '${prefix}'`);

    // remove prefix and extraenous characters, and convert to seq<uint64>
    const seq = str2seq(s.slice(prefix.length).replace(/[^-\w]/g, ''));

    // get payload length
    const n = bitsdecode(seq, length_maxbits);
    if (seq.length < n + 2) {
        throw new Error(`unwrap: expected at least ${n} + 2 characters after length marker, got ${seq.length}`);
    }
    // get payload and compute checksum
    const payload = seq.slice(0, n),
        chk = fletcher6(payload);

    // validate checksum
    if (!chk.every((u, i) => u == seq[n+i]))
        throw new Error(`unwrap64: checksum mismatch got ${s.slice(0, 2)}, expected ${chk}`);
    return payload;
}

/**
 * computes achecksum for sequence as a typle
 * using a six bit version of the Fletcher checksum
 */
function fletcher6(seq: uint6[], modulus = 61): [uint6, uint6] {
    let x = 0, y = 0;
    seq.forEach(u => {
        x = (x + u) % modulus;
        y = (y + x) % modulus;
    });
    return [x, y];
}

/**
 * Encode a fixed-size uint of up to 1<<nbits as a seq of uint6
 */
function bitsencode(n: uint, nbits: uint): uint6[] {
    if (!isuint(n) || n >= (1<<nbits))
        throw new Error(`bitsencode: value ${n} exceeds max ${1 << nbits}`)
    const seq: number[] = [];
    for (let i=0; i<Math.ceil(nbits/6); i++) {
        seq.push(n & 0x3f);
        n >>= 6;
    }
    return seq;
}

/**
 * Decode a fixed-size value of up to nbits from a seq<uint6>
 * modifying seq in place
 */
function bitsdecode(seq: uint6[], nbits: uint): uint {
    const nchars = Math.ceil(nbits/6);
    if (nchars > seq.length) {
        throw new Error(`bitsdecode: expected at least ${nchars} characters, got ${seq.length}`);
    }
    let n = 0;
    seq.splice(0, nchars).reverse().forEach(u => {n = (n << 6) + u});
    return n;
}

/** Fibnonacci encode a single uint to a uint with prefix-free bit pattern,
 * returned as a value >= 3 (b000011)
 * see https://en.wikipedia.org/wiki/Fibonacci_coding
 */
function _fibencode_uint(n: uint): uint {
    if (!isuint(n)) throw new Error(`fibencode_uint: Invalid unsigned integer: ${n}`)

    let n1 = n + 1,   // fib coding wants a natural number rather than a unit, i.e. 0 => 1
        k: number,
        bits = 1;
    for(k=2; fib(k) <= n1; k++) /**/ ;      // k is index of largest fibonacci number in n1
    // create the fibonacci bit pattern by flagging presence/absence of each smaller number
    for(--k; k >= 2; k--) {
        bits <<= 1;
        const m = fib(k);
        if (n1 >= m) {
            bits |= 1;
            n1 -= m;
        }
    }
    return bits;
}
const fibencode_uint = memoize(_fibencode_uint);

/** helper function estimating the size of an encoded value, used for run-length coding */
function fibencsize(n: uint): uint {
    return fibencode_uint(n).toString(2).length;
}

/** Fibonacci decode a prefix-free bit pattern to recover the original uint value */
function _fibdecode_uint(bits: uint): uint {
    if (!(isuint(bits) && bits >= 3)) throw new Error(`fibdecode_uint: Invalid encoded integer: ${bits.toString(2)}`)

    // sum the fibonacci numbers represented by the bit pattern, ignoring the MSB flag
    let n = 0;
    for(let k=2; bits > 1; k++) {
        if (bits & 0x1) n += fib(k);
        bits >>= 1;
    }
    return n-1;
}
const fibdecode_uint = memoize(_fibdecode_uint);

/** Fibonacci code a seq<uint> to a prefix free encoding chunked into seq<uint6> */
function fibencode(vs: uint[]): uint[] {
    if (typeof vs === 'number') return fibencode([vs]);
    if (!vs.every(isuint)) throw new Error(`fibencode: Expected list of unsigned integers ${vs}`);
    const fibs = vs.map(fibencode_uint),
        seq: number[] = [];
    let bits = 0,
        k = 0,
        lead_bit = 0x1;
    while (fibs.length && k < 6) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bits |= fibs.shift()! << k;
        while (lead_bit <= bits) {
            k++;
            lead_bit <<= 1;
        }
        while (k >= 6) {
            seq.push(bits & 0x3f);
            bits >>= 6;
            lead_bit >>= 6;
            k -= 6;
        }
    }
    if (k) seq.push(bits);
    return seq;
}

/** Decode prefix-free Fibonacci coding chunked into seq<64> by fibencode() to recover original seq<uint> */
function fibdecode(seq: uint[]): uint[] {
    const vs: number[] = [];
    let bitseq = 0,
        m = 0,
        mask = 0x3,
        k = 2;
    while (seq.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bitseq |= (seq.shift()! << m);
        m += 6;
        while (k <= m) {
            if ((mask & bitseq) == mask) {
                const bits = bitseq & ((1 << k) - 1),
                    v = fibdecode_uint(bits);
                vs.push(v);
                bitseq >>= k;
                m -= k;
                k = 2;
                mask = 0x3;
            } else {
                k++;
                mask <<= 1;
            }
        }
    }
    return vs;
}

/** run length code seq<uint> => seq<uint> (hopefully shorter) by replacing runs of consecutive
 * values by <marker> <value> <repeat - min_repeat>, returning a new array of unsigned integer.
 * @param {Array[uint]} vs - The list of values to encode
 * @param {uint} marker - value to use as repeat token; existing values >= marker are incremented
 * @param {function} vsize - Function returning the expected size of encoding a value
 */
function rlencode(vs: uint[], marker = 0, vsize = fibencsize): uint[] {

    if (!vs.every(isuint)) throw new Error(`rlencode: Expected list of unsigned integers: ${vs}`);
    if (!isuint(marker)) throw new Error(`rlencode: Expected unsigned integer marker: ${marker}`);

    /*
    for efficient run coding we want len(<marker><value><0>) < len(<value><value>...)
    =>  len(<marker><0>) < len(<value>) * (repeat - 1)
    =>  repeat > len(<marker><0>) / len(<value>) + 1
    */

    const rptlen = vsize(marker) + vsize(0);

    const zs: number[] = [],
        seq = vs.map(v => v >= marker ? v + 1: v);
    let prev = -1,
        repeat = 0;

    seq.push(-1);  // dummy to make sure we flush final value(s)
    seq.forEach(v => {
        if (v == prev) {
            repeat++;
        } else {
            const prev_1 = prev > marker ? prev - 1: prev,
                min_repeat = repeat > 1 ? Math.ceil(rptlen/vsize(prev_1)) + 1: 2;
            if (repeat >= min_repeat) {
                zs.push(marker);
                zs.push(prev_1);
                zs.push(repeat - min_repeat);
            } else {
                while(repeat--) zs.push(prev);
            }
            repeat = 1;
            prev = v;
        }
    });
    return zs;
}

/** run length decode seq<uint> => seq<uint> to recover original array provided to rlencode
 *  the marker and vsize function must match the original encoding
 */
function rldecode(zs: uint[], marker = 0, vsize = fibencsize): uint[] {
    if (!zs.every(isuint)) throw new Error(`rldecode: Expected list of unsigned integers: ${zs}`);
    if (!isuint(marker)) throw new Error(`rldecode: Expected unsigned integer marker: ${marker}`);

    const rptlen = vsize(marker) + vsize(0),
        vs: number[] = [];

    while(zs.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let v = zs.shift()!;
        if (v != marker) {
            vs.push(v > marker ? v - 1: v);
        } else {
            if (zs.length < 2) throw new Error('rldecode: Malformed run definition');
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            v = zs.shift()!;
            const min_repeat = Math.ceil(rptlen/vsize(v)) + 1;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            let repeat = zs.shift()! + min_repeat;
            while(repeat--) vs.push(v);
        }
    }
    return vs;
}

/** map a seq<int> (or singleton int) to seq<uint> */
function zigzag(vs: int[]): uint[] {
    if (!vs.every(Number.isInteger)) throw new Error(`zigzag: Expected list of integers: ${vs}`);
    return vs.map(v => v < 0 ? ((-v) << 1) - 1: v << 1);
}

/** recover seq<int> from a zigzag()d seq<uint> */
function zagzig(vs: uint[]): int[] {
    if (!vs.every(isuint)) throw new Error(`zagzig: Expected list of unsigned integers: ${vs}`);
    return vs.map(v => v & 0x1 ? -((v + 1) >> 1): v >> 1);
}

/** combine multiple small numbers into a single result by interleaving bits
 * this is not safe for large numbers / long lists without switching to bigint
 * since JS works with signed 32-bit integers for bitwise ops
 */
function ravel(vs: uint[]): uint {
    let z = 0, m = Math.max(...vs), bit = 1;
    if (!vs.every(isuint)) throw new Error(`ravel: Expected list of unsigned integers: ${vs}`);
    while(m) {
        vs = vs.map(v => {
            if (v & 1) z |= bit;
            bit <<= 1;
            return v >> 1;
        });
        m >>= 1;
    }
    return z;
}

function unravel(z: uint, n: uint): uint[] {
    if (!isuint(z)) throw new Error(`unravel: Expected unsigned int: ${z}`)
    let vs = new Array(n).fill(0), bit = 1;
    while(z) {
        vs = vs.map(v => {
            if (z & 1) v |= bit;
            z >>= 1;
            return v;
        })
        bit <<= 1;
    }
    return vs;
}

export {
    wrap64, unwrap64,
    str2seq, seq2str,
    fletcher6,
    bitsencode, bitsdecode,
    fibencode, fibdecode,
    rlencode, rldecode,
    zigzag, zagzig,
    ravel, unravel,
};
