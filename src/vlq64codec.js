/*
simmple interface for encoding a list of integers to a url-safe string
adapted from https://github.com/Rich-Harris/vlq

the core encode/decode converts a list of unsigned integers <=> a string,
with integers mapped to a variable-length quantity in base-32 representation (5 bits)
with bit 6 used as a continuation character.   See https://en.wikipedia.org/wiki/Variable-length_quantity
A 65th character '~' is used as a sentinel for run-length coding,
with runs represented as < ~, repeat-count, value >

zigzag/zagzig provide zigzag encoding to map lists of signed integers to unsigned ints
*/

const repeat_min = 4;

let chr2int = {}, int2chr = {};

'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    .split('').forEach((c, i) => {
        chr2int[c] = i;
        int2chr[i] = c;
    });

function isuint(v) {
    return Number.isInteger(v) && v >= 0;
}

function zigzag(vs) {
    if (typeof vs === 'number') return zigzag([vs])[0];

    if (!vs.every(Number.isInteger)) throw new Error('Expected list of integers', vs);
    return vs.map(v => v < 0 ? ((-v) << 1) - 1: v << 1);
}

function zagzig(vs) {
    if (!vs.every(isuint)) throw new Error('Expected list of unsigned integers', vs);
    return vs.map(v => v & 0x1 ? -((v + 1) >> 1): v >> 1);
}

// encode an array of unsigned ints, or a singleton
function encode(value) {
    if (typeof value === 'number') return encode([value]);
    let i = 0,
        s = "";
    while (i < value.length) {
        let n = value[i],
            repeat = 1;
        while (++i < value.length && value[i] == n) repeat++;
        if (repeat >= repeat_min) {
            s += '~' + encode_uint(repeat - repeat_min) + encode_uint(n);
        } else {
            s += encode_uint(n).repeat(repeat);
        }
    }
    return s;
}

function encode_uint(n) {
    if (!isuint(n)) throw new Error(`Invalid unsigned integer: ${n}`)

    let s = '',
        has_continuation_bit = 1;

    while (has_continuation_bit) {
        let clamped = n & 0x1f;
        n >>= 5;
        has_continuation_bit = (n > 0);
        if (has_continuation_bit) {
            clamped |= 0x20;
            n--;             // remove redundancy since continuation_bit tells us n > clamped
        }
        s += int2chr[clamped];
    }

    return s;
}

function decode(s) {
    let result = [],
        i = 0;

    function decode_uint() {
        let shift = 0,
            value = 0,
            has_continuation_bit = 0;

        do {
            if (i >= s.length) throw new Error('Input ended unexpectedly while decoding run-length')
            let c = s[i++],
                u = chr2int[c];

            if (u === undefined) throw new Error(`Invalid character: ${c} as position ${i} of ${s}`);

            if (has_continuation_bit) u++;

            has_continuation_bit = u & 0x20;
            u &= 0x1f;
            value += u << shift;

            if (!has_continuation_bit) return value;

            shift += 5;
        } while(i < s.length);

        if (has_continuation_bit) throw new Error('Input ended unexpectedly while decoding multi-character value');
    }

    while (i < s.length) {
        if (s[i] == '~') {
            ++i;
            let repeat = decode_uint() + repeat_min,
                n = decode_uint();
            for (let k=0; k<repeat; k++) result.push(n);
        } else {
            result.push(decode_uint());
        }
    }

    return result;
}

export {encode, decode, zigzag, zagzig};

