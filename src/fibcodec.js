// see https://en.wikipedia.org/wiki/Fibonacci_coding

let chr2int = {},
    int2chr = {};

'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    .split('').forEach((c, i) => {
        chr2int[c] = i;
        int2chr[i] = c;
    });


let fib = n => (n in fib.memo) ? fib.memo[n] : (fib.memo[n] = fib(n-1) + fib(n-2));
fib.memo = {0: 0, 1: 1};


/** test v is unsigned integer */
function isuint(v) {
    return Number.isInteger(v) && v >= 0;
}

/** map an array (or singleton) of signed integer to an array of unsigned integers */
function zigzag(vs) {
    if (typeof vs === 'number') return zigzag([vs])[0];

    if (!vs.every(Number.isInteger)) throw new Error('zigzag: Expected list of integers:', vs);
    return vs.map(v => v < 0 ? ((-v) << 1) - 1: v << 1);
}

/** recover an array of signed integer from a zigzag()d array */
function zagzig(vs) {
    if (!vs.every(isuint)) throw new Error('zagzig: Expected list of unsigned integers:', vs);
    return vs.map(v => v & 0x1 ? -((v + 1) >> 1): v >> 1);
}

/** run length code an array of unsigned integer by replacing runs of consecutive
 * values by <marker> <value> <repeat - min_repeat>, returning a new array of unsigned integer.
 * @param {Array[uint]} vs - The list of values to encode
 * @param {uint} marker - value to use as repeat token; existing values >= marker are incremented
 * @param {function} vsize - Function returning the expected size of encoding a value
 */
function rlencode(vs, marker, vsize) {
    marker ??= 0;
    vsize ??= fibencsize;

    if (!vs.every(isuint)) throw new Error('rlencode: Expected list of unsigned integers:', vs);
    if (!isuint(marker)) throw new Error('rlencode: Expected unsigned integer marker:', marker);

    /*
    for efficient run coding we want len(<marker><value><0>) < len(<value><value>...)
    =>  len(<marker><0>) < len(<value>) * (repeat - 1)
    =>  repeat > len(<marker><0>) / len(<value>) + 1
    */

    const rptlen = vsize(marker) + vsize(0);

    let zs = [],
        prev = -1,
        repeat = 0,
        seq = vs.map(v => v >= marker ? v + 1: v);

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

/** run length decode an array of unsinged ints to recover the original array provided to rlencode
 *  the marker and vsize function must match the original encoding
 */
function rldecode(zs, marker, vsize) {
    marker ??= 0;
    vsize ??= fibencsize;

    if (!zs.every(isuint)) throw new Error('rldecode: Expected list of unsigned integers:', zs);
    if (!isuint(marker)) throw new Error('rldecode: Expected unsigned integer marker:', marker);

    const rptlen = vsize(marker) + vsize(0);

    let vs = [];
    while(zs.length) {
        let v = zs.shift();
        if (v != marker) {
            vs.push(v > marker ? v - 1: v);
        } else {
            v = zs.shift();
            const min_repeat = Math.ceil(rptlen/vsize(v)) + 1;
            let repeat = zs.shift() + min_repeat;
            while(repeat--) vs.push(v);
        }
    }
    return vs;
}

function fibencsize(n) {
    return fibencode_uint(n).toString(2).length;
}

/** fibnonacci encode a single unsigned int to a bit pattern returned as a value >= 3 */
function fibencode_uint(n) {
    if (!isuint(n)) throw new Error(`fibencode_uint: Invalid unsigned integer: ${n}`)

    if (n in fibencode_uint.memo) return fibencode_uint.memo[n];

    var n1 = n + 1,   // fib coding wants a natural number rather than a unit, i.e. 0 => 1
        k,
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
    fibencode_uint.memo[n] = bits;          // remember for future reference
    return bits;
}
fibencode_uint.memo = {}

/** fibonacci decode an encoded bit pattern to recover the original uint value */
function fibdecode_uint(bits) {
    if (!(isuint(bits) && bits >= 3)) throw new Error(`fibdecode_uint: Invalid encoded integer: ${bits.toString(2)}`)

    if (bits in fibdecode_uint.memo) return fibdecode_uint.memo[bits];
    // sum the fibonacci numbers represented by the bit pattern, ignoring the MSB flag
    var n=0;
    for(let k=2; bits > 1; k++) {
        if (bits & 0x1) n += fib(k);
        bits >>= 1;
    }
    fibdecode_uint.memo[bits] = n-1;
    return n-1;
}
fibdecode_uint.memo = {};

/** encode an array of unsigned int to a base64-string using fibonacci encoding */
function fibencode(vs) {
    if (typeof vs === 'number') return fibencode([vs]);
    if (!vs.every(isuint)) throw new Error('fibencode: Expected list of unsigned integers', vs);
    let seq = vs.map(fibencode_uint),
        s = "",
        bits = 0,
        k = 0,
        lead_bit = 0x1;
    while (seq.length && k < 6) {
        bits |= seq.shift() << k;
        while (lead_bit <= bits) {
            k++;
            lead_bit <<= 1;
        }
        while (k >= 6) {
            s += int2chr[bits & 0x3f];
            bits >>= 6;
            lead_bit >>= 6;
            k -= 6;
        }
    }
    if (k) s += int2chr[bits];
    return s;
}

/** decode a base64 fibonnaci encoded string to recover the original unsigned int array */
function fibdecode(s) {
    let vs = [],
        seq = s.split('').map(c => chr2int[c]),
        bitseq = 0,
        m = 0,
        mask = 0x3,
        k = 2;
    while (seq.length) {
        bitseq |= (seq.shift() << m);
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

export {zigzag, zagzig, rlencode, rldecode, fibencode, fibdecode};
