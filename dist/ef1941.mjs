import { webcrypto } from 'node:crypto';
import { EventEmitter } from 'events';

function sum(xs) {
    return xs.reduce((s, x) => s + x, 0);
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
function memoize(fn) {
    const cache = new Map();
    const cached = function (x) {
        if (!cache.has(x))
            cache.set(x, fn(x));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return cache.get(x);
    };
    return cached;
}
const directions = {
    [0 /* DirectionKey.north */]: { label: 'N', dlon: 0, dlat: 1, icon: 0x81 },
    [1 /* DirectionKey.east */]: { label: 'E', dlon: -1, dlat: 0, icon: 0x82 },
    [2 /* DirectionKey.south */]: { label: 'S', dlon: 0, dlat: -1, icon: 0x83 },
    [3 /* DirectionKey.west */]: { label: 'W', dlon: 1, dlat: 0, icon: 0x84 }, // left  1011 => 3
};
const weatherdata = {
    [0 /* WeatherKey.dry */]: { label: 'dry', earth: 0x10, contrast: 0x06 },
    [1 /* WeatherKey.mud */]: { label: 'mud', earth: 0x02, contrast: 0x06 },
    [2 /* WeatherKey.snow */]: { label: 'snow', earth: 0x0A, contrast: 0x04 },
};
const players = {
    [0 /* PlayerKey.German */]: {
        label: 'German', unit: 'CORPS', color: 0x0C, homedir: 3 /* DirectionKey.west */,
        supply: { sea: 1, maxfail: [24, 0, 16], freeze: 1 }
    },
    [1 /* PlayerKey.Russian */]: {
        label: 'Russian', unit: 'ARMY', color: 0x46, homedir: 1 /* DirectionKey.east */,
        supply: { sea: 0, maxfail: [24, 24, 24], freeze: 0 }
    },
};
const terraintypes = {
    [0 /* TerrainKey.clear */]: {
        label: 'clear', color: 0x02,
        offence: 0, defence: 0, movecost: [[6, 24, 10], [4, 30, 6]]
    },
    [1 /* TerrainKey.mountain_forest */]: {
        label: 'mountain/forest', color: 0x28, altcolor: 0xD6,
        offence: 0, defence: 1, movecost: [[12, 30, 16], [8, 30, 10]]
    },
    [2 /* TerrainKey.city */]: {
        label: 'city', color: 0x00,
        offence: 0, defence: 1, movecost: [[8, 24, 10], [6, 30, 8]]
    },
    [3 /* TerrainKey.frozen_swamp */]: {
        label: 'frozen swamp', color: 0x0C,
        offence: 0, defence: 0, movecost: [[0, 0, 12], [0, 0, 8]]
    },
    [4 /* TerrainKey.frozen_river */]: {
        label: 'frozen river', color: 0x0C,
        offence: 0, defence: 0, movecost: [[0, 0, 12], [0, 0, 8]]
    },
    [5 /* TerrainKey.swamp */]: {
        label: 'swamp', color: 0x94,
        offence: 0, defence: 0, movecost: [[18, 30, 24], [18, 30, 24]]
    },
    [6 /* TerrainKey.river */]: {
        label: 'river', color: 0x94,
        offence: -1, defence: -1, movecost: [[14, 30, 28], [13, 30, 28]]
    },
    [7 /* TerrainKey.coastline */]: {
        // strange that coastline acts like river but estuary doesn't?
        label: 'coastline', color: 0x94,
        offence: -1, defence: -1, movecost: [[8, 26, 12], [6, 30, 8]]
    },
    [8 /* TerrainKey.estuary */]: {
        label: 'estuary', color: 0x94,
        offence: 0, defence: 0, movecost: [[20, 28, 24], [16, 30, 20]],
    },
    [9 /* TerrainKey.impassable */]: {
        label: 'impassable', color: 0x94, altcolor: 0x0C,
        offence: 0, defence: 0, movecost: [[0, 0, 0], [0, 0, 0]]
    }
};
const waterstate = {
    [0 /* WaterStateKey.freeze */]: {
        dir: 2 /* DirectionKey.south */, terrain: [3 /* TerrainKey.frozen_swamp */, 4 /* TerrainKey.frozen_river */]
    },
    [1 /* WaterStateKey.thaw */]: {
        dir: 0 /* DirectionKey.north */, terrain: [5 /* TerrainKey.swamp */, 6 /* TerrainKey.river */]
    },
};
const monthdata = {
    [0 /* MonthKey.Jan */]: { label: "January", trees: 0x12, weather: 2 /* WeatherKey.snow */ },
    [1 /* MonthKey.Feb */]: { label: "February", trees: 0x12, weather: 2 /* WeatherKey.snow */ },
    [2 /* MonthKey.Mar */]: { label: "March", trees: 0x12, weather: 2 /* WeatherKey.snow */, water: 1 /* WaterStateKey.thaw */ },
    [3 /* MonthKey.Apr */]: { label: "April", trees: 0xD2, weather: 1 /* WeatherKey.mud */ },
    [4 /* MonthKey.May */]: { label: "May", trees: 0xD8, weather: 0 /* WeatherKey.dry */ },
    [5 /* MonthKey.Jun */]: { label: "June", trees: 0xD6, weather: 0 /* WeatherKey.dry */ },
    [6 /* MonthKey.Jul */]: { label: "July", trees: 0xC4, weather: 0 /* WeatherKey.dry */ },
    [7 /* MonthKey.Aug */]: { label: "August", trees: 0xD4, weather: 0 /* WeatherKey.dry */ },
    [8 /* MonthKey.Sep */]: { label: "September", trees: 0xC2, weather: 0 /* WeatherKey.dry */ },
    [9 /* MonthKey.Oct */]: { label: "October", trees: 0x12, weather: 1 /* WeatherKey.mud */ },
    [10 /* MonthKey.Nov */]: { label: "November", trees: 0x12, weather: 2 /* WeatherKey.snow */, water: 0 /* WaterStateKey.freeze */ },
    [11 /* MonthKey.Dec */]: { label: "December", trees: 0x12, weather: 2 /* WeatherKey.snow */ },
};
const unitkinds = {
    [0 /* UnitKindKey.infantry */]: { key: 'infantry', icon: 0x7d },
    [1 /* UnitKindKey.armor */]: { key: 'armor', icon: 0x7e },
    [2 /* UnitKindKey.air */]: { key: 'air', icon: 0x7c },
};

/**
 * Contains a bunch of routines to compact various integer data into
 * a sequence of six-bit unsigned ints (uint6) which we map to
 * a base64-like encoding
 */
const chrs64 = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
    'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '-', '_'
];
const chr2int = Object.fromEntries(chrs64.map((c, i) => [c, i])), int2chr = Object.fromEntries(chrs64.map((c, i) => [i, c]));
function ischr64(c) {
    return chrs64.includes(c);
}
/** test v is unsigned integer */
function isuint(v) {
    return Number.isInteger(v) && v >= 0;
}
// memoized Fibonacci numbers
const fib = memoize((n) => n < 2 ? n : fib(n - 1) + fib(n - 2));
function seq2str(seq) {
    if (seq.some(u => !isuint(u) || u >= 64))
        throw new Error(`seq2str: Invalid uint6 in input ${seq}`);
    return seq.map(u => int2chr[u]).join('');
}
function str2seq(s) {
    const chrs = s.split('');
    if (!chrs.every(ischr64))
        throw new Error(`str2seq: Unexpected characters in '${s}'`);
    return chrs.map(c => chr2int[c]);
}
/** convert payload to string, wrapping with optional prefix string, length marker, and CRC check */
function wrap64(payload, prefix, length_maxbits = 12) {
    const seq = [].concat(bitsencode(payload.length, length_maxbits), payload, fletcher6(payload));
    return (prefix || '') + seq2str(seq);
}
/** unwrap payload to seqas wrapped by wrap64, ignoring garbage and trailing characters */
function unwrap64(s, prefix, length_maxbits = 12) {
    prefix || (prefix = '');
    // check prefix
    if (!s.startsWith(prefix))
        throw new Error(`unwrap64: string didn't start with expected prefix '${prefix}'`);
    // remove prefix and extraenous characters, and convert to seq<uint64>
    const seq = str2seq(s.slice(prefix.length).replace(/[^-\w]/g, ''));
    // get payload length
    const n = bitsdecode(seq, length_maxbits);
    if (seq.length < n + 2) {
        throw new Error(`unwrap: expected at least ${n} + 2 characters after length marker, got ${seq.length}`);
    }
    // get payload and compute checksum
    const payload = seq.slice(0, n), chk = fletcher6(payload);
    // validate checksum
    if (!chk.every((u, i) => u == seq[n + i]))
        throw new Error(`unwrap64: checksum mismatch got ${s.slice(0, 2)}, expected ${chk}`);
    return payload;
}
/**
 * computes achecksum for sequence as a typle
 * using a six bit version of the Fletcher checksum
 */
function fletcher6(seq, modulus = 61) {
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
function bitsencode(n, nbits) {
    if (!isuint(n) || n >= (1 << nbits))
        throw new Error(`bitsencode: value ${n} exceeds max ${1 << nbits}`);
    const seq = [];
    for (let i = 0; i < Math.ceil(nbits / 6); i++) {
        seq.push(n & 0x3f);
        n >>= 6;
    }
    return seq;
}
/**
 * Decode a fixed-size value of up to nbits from a seq<uint6>
 * modifying seq in place
 */
function bitsdecode(seq, nbits) {
    const nchars = Math.ceil(nbits / 6);
    if (nchars > seq.length) {
        throw new Error(`bitsdecode: expected at least ${nchars} characters, got ${seq.length}`);
    }
    let n = 0;
    seq.splice(0, nchars).reverse().forEach(u => { n = (n << 6) + u; });
    return n;
}
/** Fibnonacci encode a single uint to a uint with prefix-free bit pattern,
 * returned as a value >= 3 (b000011)
 * see https://en.wikipedia.org/wiki/Fibonacci_coding
 */
function _fibencode_uint(n) {
    if (!isuint(n))
        throw new Error(`fibencode_uint: Invalid unsigned integer: ${n}`);
    let n1 = n + 1, // fib coding wants a natural number rather than a unit, i.e. 0 => 1
    k, bits = 1;
    for (k = 2; fib(k) <= n1; k++) /**/
        ; // k is index of largest fibonacci number in n1
    // create the fibonacci bit pattern by flagging presence/absence of each smaller number
    for (--k; k >= 2; k--) {
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
function fibencsize(n) {
    return fibencode_uint(n).toString(2).length;
}
/** Fibonacci decode a prefix-free bit pattern to recover the original uint value */
function _fibdecode_uint(bits) {
    if (!(isuint(bits) && bits >= 3))
        throw new Error(`fibdecode_uint: Invalid encoded integer: ${bits.toString(2)}`);
    // sum the fibonacci numbers represented by the bit pattern, ignoring the MSB flag
    let n = 0;
    for (let k = 2; bits > 1; k++) {
        if (bits & 0x1)
            n += fib(k);
        bits >>= 1;
    }
    return n - 1;
}
const fibdecode_uint = memoize(_fibdecode_uint);
/** Fibonacci code a seq<uint> to a prefix free encoding chunked into seq<uint6> */
function fibencode(vs) {
    if (typeof vs === 'number')
        return fibencode([vs]);
    if (!vs.every(isuint))
        throw new Error(`fibencode: Expected list of unsigned integers ${vs}`);
    const fibs = vs.map(fibencode_uint), seq = [];
    let bits = 0, k = 0, lead_bit = 0x1;
    while (fibs.length && k < 6) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bits |= fibs.shift() << k;
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
    if (k)
        seq.push(bits);
    return seq;
}
/** Decode prefix-free Fibonacci coding chunked into seq<64> by fibencode() to recover original seq<uint> */
function fibdecode(seq) {
    const vs = [];
    let bitseq = 0, m = 0, mask = 0x3, k = 2;
    while (seq.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        bitseq |= (seq.shift() << m);
        m += 6;
        while (k <= m) {
            if ((mask & bitseq) == mask) {
                const bits = bitseq & ((1 << k) - 1), v = fibdecode_uint(bits);
                vs.push(v);
                bitseq >>= k;
                m -= k;
                k = 2;
                mask = 0x3;
            }
            else {
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
function rlencode(vs, marker = 0, vsize = fibencsize) {
    if (!vs.every(isuint))
        throw new Error(`rlencode: Expected list of unsigned integers: ${vs}`);
    if (!isuint(marker))
        throw new Error(`rlencode: Expected unsigned integer marker: ${marker}`);
    /*
    for efficient run coding we want len(<marker><value><0>) < len(<value><value>...)
    =>  len(<marker><0>) < len(<value>) * (repeat - 1)
    =>  repeat > len(<marker><0>) / len(<value>) + 1
    */
    const rptlen = vsize(marker) + vsize(0);
    const zs = [], seq = vs.map(v => v >= marker ? v + 1 : v);
    let prev = -1, repeat = 0;
    seq.push(-1); // dummy to make sure we flush final value(s)
    seq.forEach(v => {
        if (v == prev) {
            repeat++;
        }
        else {
            const prev_1 = prev > marker ? prev - 1 : prev, min_repeat = repeat > 1 ? Math.ceil(rptlen / vsize(prev_1)) + 1 : 2;
            if (repeat >= min_repeat) {
                zs.push(marker);
                zs.push(prev_1);
                zs.push(repeat - min_repeat);
            }
            else {
                while (repeat--)
                    zs.push(prev);
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
function rldecode(zs, marker = 0, vsize = fibencsize) {
    if (!zs.every(isuint))
        throw new Error(`rldecode: Expected list of unsigned integers: ${zs}`);
    if (!isuint(marker))
        throw new Error(`rldecode: Expected unsigned integer marker: ${marker}`);
    const rptlen = vsize(marker) + vsize(0), vs = [];
    while (zs.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let v = zs.shift();
        if (v != marker) {
            vs.push(v > marker ? v - 1 : v);
        }
        else {
            if (zs.length < 2)
                throw new Error('rldecode: Malformed run definition');
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            v = zs.shift();
            const min_repeat = Math.ceil(rptlen / vsize(v)) + 1;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            let repeat = zs.shift() + min_repeat;
            while (repeat--)
                vs.push(v);
        }
    }
    return vs;
}
/** map a seq<int> (or singleton int) to seq<uint> */
const zigzag1 = memoize((v) => v < 0 ? ((-v) << 1) - 1 : v << 1);
function zigzag(vs) {
    if (!vs.every(Number.isInteger))
        throw new Error(`zigzag: Expected list of integers: ${vs}`);
    return vs.map(zigzag1);
}
/** recover seq<int> from a zigzag()d seq<uint> */
const zagzig1 = memoize((v) => v & 0x1 ? -((v + 1) >> 1) : v >> 1);
function zagzig(vs) {
    if (!vs.every(isuint))
        throw new Error(`zagzig: Expected list of unsigned integers: ${vs}`);
    return vs.map(zagzig1);
}
/** combine multiple small numbers into a single result by interleaving bits
 * this is not safe for large numbers / long lists without switching to bigint
 * since JS works with signed 32-bit integers for bitwise ops
 */
function ravel0_(v) {
    v = (v | (v << 8)) & 0x00FF00FF;
    v = (v | (v << 4)) & 0x0F0F0F0F;
    v = (v | (v << 2)) & 0x33333333;
    v = (v | (v << 1)) & 0x55555555;
    return v;
}
const ravel0 = memoize(ravel0_);
function unravel0_(v) {
    v &= 0x55555555;
    v = (v | (v >> 1)) & 0x33333333;
    v = (v | (v >> 2)) & 0x0F0F0F0F;
    v = (v | (v >> 4)) & 0x00FF00FF;
    v = (v | (v >> 8)) & 0x0000FFFF;
    return v;
}
const unravel0 = memoize(unravel0_);
function ravel2(x, y) {
    if (!(isuint(x) && isuint(y)))
        throw new Error(`ravel: Expected pair of unsigned int, got ${x}, ${y}`);
    return ravel0(x) | (ravel0(y) << 1);
}
function unravel2(z) {
    if (!isuint(z))
        throw new Error(`unravel: Expected unsigned int: ${z}`);
    return [unravel0(z), unravel0(z >> 1)];
}

// Atari had a memory location that could be read for a byte of random noise
const _crypto = webcrypto !== null && webcrypto !== void 0 ? webcrypto : (window && window.crypto);
function lfsr24(seed) {
    const beforezero = 0xEF41CC; // arbitrary location to insert zero in the sequence
    seed !== null && seed !== void 0 ? seed : (seed = _crypto.getRandomValues(new Uint32Array(1))[0]);
    let r;
    function bit() {
        const v = r & 0x1;
        if (r == beforezero) {
            r = 0;
        }
        else {
            if (r == 0)
                r = beforezero; // continue on
            // constant via // https://en.wikipedia.org/wiki/Linear-feedback_shift_register
            r = (r >> 1) ^ (-(r & 1) & 0xe10000);
        }
        return v;
    }
    function bits(k) {
        let v = 0;
        for (let i = 0; i < k; i++)
            v = (v << 1) | bit();
        return v;
    }
    function state(seed) {
        if (seed != null)
            r = seed & 0xffffff;
        return r;
    }
    state(seed);
    return {
        state: state,
        bit: bit,
        bits: bits,
        byte: () => bits(8),
    };
}

function toid(lon, lat) {
    return ravel2(zigzag1(lon), zigzag1(lat));
}
function byid_(gid) {
    const [lon, lat] = zagzig(unravel2(gid));
    return { lon, lat, gid };
}
const byid = memoize(byid_);
function adjsbyid_(gid) {
    const { lon, lat } = Grid.byid(gid);
    return Object.values(directions)
        .map(({ dlon, dlat }) => Grid.lonlat(lon + dlon, lat + dlat).gid);
}
const adjsbyid = memoize(adjsbyid_);
function directionsFrom(p, q) {
    // project all directions from p to q and rank them, ensuring tie breaking has no bias
    // returned pairs are like [ (q - p) . dir, key ], ordered by projection magnitude
    // if p == q an empty list is returned
    const dlat = (q.lat - p.lat), dlon = (q.lon - p.lon);
    if (dlat == 0 && dlon == 0)
        return [];
    return Object.entries(directions)
        .map(([k, d]) => [d.dlon * dlon + d.dlat * dlat, +k])
        // in case of tied dirs (which will be neighbors) pick the clockwise leader
        .sort(([a, i], [b, j]) => (b - a) || ((j - i + 4 + 2) % 4) - 2);
}
function directionFrom(p, q) {
    // return the index of the closest cardinal direction from p to q, null if p == q
    const projections = directionsFrom(p, q);
    return projections.length ? projections[0][1] : null;
}
function squareSpiral(center, radius) {
    // return list of the (2*radius+1)^2 locations spiraling out from loc
    // which form a square of given radius, based on a spiralpattern
    // that looks like N, E, S,S, W,W, N,N,N, E,E,E, S,S,S,S, W,W,W,W, ...
    let loc = center, dir = 0, i = 0, side = 1;
    const locs = [loc];
    while (++i < 2 * radius + 1) {
        loc = Grid.adjacent(loc, dir);
        locs.push(loc);
        if (i == side) {
            side += dir % 2;
            dir = (dir + 1) % 4;
            i = 0;
        }
    }
    return locs;
}
// hack to memoize squarespiral of radius 1 which get used a lot
function squareSpira11_(gid) {
    return squareSpiral(Grid.byid(gid), 1).map(({ gid }) => gid);
}
const squareSpira11 = memoize(squareSpira11_);
function diamondSpiral(center, radius, facing = 0 /* DirectionKey.north */) {
    // return list of GridPoints within radius manhattan distance of center,
    // spiraling out from the origin starting in direction facting
    // the 0th shell has a single point, with the i-th shell having 4*i points for i>1
    // so the result has 2*r*(r+1) + 1 points
    let loc = Grid.lonlat(center.lon, center.lat);
    // the zeroth shell
    const locs = [loc];
    for (let r = 1; r <= radius; r++) {
        // bump out one shell in the required direction
        loc = Grid.adjacent(loc, facing);
        // loop over the four sides of the shell
        for (let d = 0; d < 4; d++) {
            const d1 = (facing + d + 1) % 4, d2 = (facing + d + 2) % 4;
            for (let i = 0; i < r; i++) {
                // push the point and make a diagonal step
                locs.push(loc);
                loc = Grid.adjacent(Grid.adjacent(loc, d1), d2);
            }
        }
    }
    return locs;
}
const Grid = {
    byid: byid,
    lonlat: (lon, lat) => byid(toid(lon, lat)),
    point: ({ lon, lat }) => byid(toid(lon, lat)),
    adjacencies: ({ gid }) => adjsbyid(gid).map(Grid.byid),
    adjacent: ({ gid }, d) => Grid.byid(adjsbyid(gid)[d]),
    // calculate the taxicab metric between two locations
    manhattanDistance: (p, q) => Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon),
    directionsFrom: directionsFrom,
    directionFrom: directionFrom,
    squareSpiral: (center, radius) => {
        return (radius == 1) ? squareSpira11(center.gid).map(Grid.byid) : squareSpiral(center, radius);
    },
    diamondSpiral: diamondSpiral,
};

const mapVariants = {
    [0 /* MapVariantKey.apx */]: {
        font: 'apx',
        encoding: [
            ' |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQR|{}??|~#',
            ' |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUVW|{}<??|~#'
        ],
        ascii: `
################################################
#~~~A        L~~B                              #
#~~~GJ   MNPONK{H                              #
#~~~~GPOQ~~IH@om                               #
#~~~~~IDEF{}v;f.        ow nrtx                #
#~~~~~C   RJj:g15       fcsl  dqw    nv        #
#~~~~~B   LBe.h26       i      nz* oskcrw      #
#~~~~~GJ   Hg,i31              gcrqm   0dx     #
#~~~~~~A      j43             ol         g     #
#~~ID~~B*     f 2       2     h          btqy  #
#~~B KE}qrw             1     i            nk  #
#~~A      av     om   0   $  nk            g   #
#~~C       bsx  nl     36    j             e   #
#~~GJ        ctuk   2i412pusqm             h   #
#~~~B              ntk 34f                nl   #
#~~I}rqsv   265  oul@ 16 e  j             i$   #
#~IH    ct 1431 pm          i             f    #
#EH        26$ .h,          aty          pm    #
#        135   :bw;      @    h0         j     #
#       26    ;,:dy           cw         h     #
#x0     54  ,.:;. j            g         g     #
#dw     31  ;quw:,f       h    bsv       i     #
# ay   346 ,.:;crxi       cx     dx      f     #
#  g   25,:;,.,:.dz        i      auqsrx j     #
# nl     .,;:.   ,f       $f           e@aqrtw #
#ki       :      @g        bw          g     bx#
#16               ans       dnmolnr    f      d#
#2534               cmp           cop jh       #
#  1563  ns   nq      blr          ktmi        #
#    4315 cq   dop      doq       ji           #
#     246  amnlr als      ap     kh            #
#      135     bp  cr     *e   NC<0            #
#       264     ds  bq    kh ODHPL             #
#        516 r   aq  dp   g MI~QK              #
#        1243bs   cr0 e  ji B~~FR              #
#        53621aq   d{C}DE<TJ~~~PL $jlonq       #
#  451523614562cp  NH~~~PKUVVWASkomh   f       #
#  5364142 3416 d{EI~~~~FR  NH~G}DER           #
#               OJ~~~~~~~GSMI~~~~~~GCS542361621#
#               B~~~~~~~~~FJ~~~~~~~~~FDES123433#
################################################
`,
        // M.ASM:8630 MPTS / MOSCX / MOSCY - special city victory points; updated in CITYxxx for CART
        // oddly Sevastpol is assigned points but is not coded as a city in either version of the map?
        //TODO  create a variant that replaces F => @ in the bottom row of the map, and adds to city list
        cities: [
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 28, points: 20, label: 'Moscow' },
            { owner: 1 /* PlayerKey.Russian */, lon: 33, lat: 36, points: 10, label: 'Leningrad' },
            { owner: 1 /* PlayerKey.Russian */, lon: 6, lat: 15, points: 10, label: 'Stalingrad' },
            { owner: 1 /* PlayerKey.Russian */, lon: 12, lat: 4, points: 0, label: 'Krasnodar' },
            { owner: 1 /* PlayerKey.Russian */, lon: 13, lat: 33, points: 0, label: 'Gorky' },
            { owner: 1 /* PlayerKey.Russian */, lon: 7, lat: 32, points: 0, label: 'Kazan' },
            { owner: 1 /* PlayerKey.Russian */, lon: 38, lat: 30, points: 0, label: 'Riga' },
            { owner: 1 /* PlayerKey.Russian */, lon: 24, lat: 28, points: 0, label: 'Rzhev' },
            { owner: 1 /* PlayerKey.Russian */, lon: 26, lat: 24, points: 0, label: 'Smolensk' },
            { owner: 1 /* PlayerKey.Russian */, lon: 3, lat: 24, points: 0, label: 'Kuibishev' },
            { owner: 1 /* PlayerKey.Russian */, lon: 33, lat: 22, points: 0, label: 'Minsk' },
            { owner: 1 /* PlayerKey.Russian */, lon: 15, lat: 21, points: 0, label: 'Voronezh' },
            { owner: 1 /* PlayerKey.Russian */, lon: 21, lat: 21, points: 0, label: 'Orel' },
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 15, points: 0, label: 'Kharkov' },
            { owner: 1 /* PlayerKey.Russian */, lon: 29, lat: 14, points: 0, label: 'Kiev' },
            { owner: 1 /* PlayerKey.Russian */, lon: 12, lat: 8, points: 0, label: 'Rostov' },
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 8, points: 0, label: 'Dnepropetrovsk' },
            { owner: 1 /* PlayerKey.Russian */, lon: 26, lat: 5, points: 0, label: 'Odessa' },
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 0, points: 0, label: 'Sevastopol' },
            { owner: 0 /* PlayerKey.German */, lon: 44, lat: 19, points: 0, label: 'Warsaw' },
        ]
    },
    [1 /* MapVariantKey.cart */]: {
        font: 'cart',
        encoding: [
            " |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQ|{}???|~#",
            " |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUV|{}<???|~#"
        ],
        ascii: `
################################################
#~~~A        L~~B                              #
#~~~GJ   MNPONK{H                              #
#~~~~GPOO~~IH0om                               #
#~~~~~IDEF{}v;f.        ow nrtx                #
#~~~~~C   QJj:g15       fcsl  dqw    nv        #
#~~~~~B   LBe.h26       i      nz* oskcrw      #
#~~~~~GJ   Hg,i31              gcrqm   @dx     #
#~~~~~~A      j43             ol         g     #
#~~ID~~B*     f 2       2     h          btqy  #
#~~B KE}qrw             1     i            nk  #
#~~A      av     om   @   $  nk            g   #
#~~C       bsx  nl     36    j             e   #
#~~GJ        ctuk   2i412pusqm             h   #
#~~~B              ntk 34f                nl   #
#~~I}rqsv   265  oul@ 16 e  j             i*   #
#~IH    ct 1431 pm          i             f    #
#EH        26@ .h,          aty          pm    #
#        135   :bw;      @    h*         j     #
#       26    ;,:dy           cw         h     #
#x@     54  ,.:;. j            g         g     #
#dw     31  ;quw:,f       h    bsv       i     #
# ay   346 ,.:;crxi       cx     dx      f     #
#  g   25,:;,.,:.dz        i      auqsrx j     #
# nl     .,;:.   ,f       *f           e0aqrtw #
# i       :      @g        bw          g     bx#
#16               ans       dnmolnr    f      d#
#2534               cmp           cop jh       #
#  1563  ns   nq      blr          ktmi        #
#    4315 cq   dop      doq       ji           #
#     246  amnlr als      ap     kh            #
#      135     bp  cr     *e   NC<@            #
#       264     ds  bq    kh ODHPL             #
#        516 r   aq  dp   g MI~QK              #
#        1243bs   cr* e  ji B~~FR              #
#        53621aq   d{C}DE<TJ~~~PL 0jlonq       #
#  451523614562cp  NH~~~PKUVVVASkomh   f       #
#  5364142 3416 d{EI~~~~FR  NH~G}DER           #
#               OJ~~~~~~~GSMI~~~~~~GCS542361621#
#               B~~~~~~~~~FJ~~~~~~~~~FDES123433#
################################################
`,
        // M.ASM:8630 MPTS / MOSCX / MOSCY - special city victory points; updated in CITYxxx for CART
        // oddly Sevastpol is assigned points but is not coded as a city in either version of the map?
        //TODO  create a variant that replaces F => @ in the bottom row of the map, and adds to city list
        cities: [
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 28, points: 10, label: 'Moscow' },
            { owner: 1 /* PlayerKey.Russian */, lon: 33, lat: 36, points: 5, label: 'Leningrad' },
            { owner: 1 /* PlayerKey.Russian */, lon: 6, lat: 15, points: 5, label: 'Stalingrad' },
            { owner: 1 /* PlayerKey.Russian */, lon: 12, lat: 4, points: 5, label: 'Krasnodar' },
            { owner: 1 /* PlayerKey.Russian */, lon: 13, lat: 33, points: 5, label: 'Gorky' },
            { owner: 1 /* PlayerKey.Russian */, lon: 7, lat: 32, points: 5, label: 'Kazan' },
            { owner: 1 /* PlayerKey.Russian */, lon: 38, lat: 30, points: 2, label: 'Riga' },
            { owner: 1 /* PlayerKey.Russian */, lon: 24, lat: 28, points: 2, label: 'Rzhev' },
            { owner: 1 /* PlayerKey.Russian */, lon: 26, lat: 24, points: 2, label: 'Smolensk' },
            { owner: 1 /* PlayerKey.Russian */, lon: 3, lat: 24, points: 5, label: 'Kuibishev' },
            { owner: 1 /* PlayerKey.Russian */, lon: 33, lat: 22, points: 2, label: 'Minsk' },
            { owner: 1 /* PlayerKey.Russian */, lon: 15, lat: 21, points: 2, label: 'Voronezh' },
            { owner: 1 /* PlayerKey.Russian */, lon: 21, lat: 21, points: 2, label: 'Orel' },
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 15, points: 2, label: 'Kharkov' },
            { owner: 1 /* PlayerKey.Russian */, lon: 29, lat: 14, points: 2, label: 'Kiev' },
            { owner: 1 /* PlayerKey.Russian */, lon: 12, lat: 8, points: 2, label: 'Rostov' },
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 8, points: 2, label: 'Dnepropetrovsk' },
            { owner: 1 /* PlayerKey.Russian */, lon: 26, lat: 5, points: 2, label: 'Odessa' },
            { owner: 1 /* PlayerKey.Russian */, lon: 20, lat: 0, points: 0, label: 'Sevastopol' },
            { owner: 0 /* PlayerKey.German */, lon: 44, lat: 19, points: 5, label: 'Warsaw' },
        ]
    },
};
// D.ASM:5500 BHX1 .BYTE ... / BHY1 / BHX2 / BHY2
// there are 11 impassable square-sides
// the original game stores 22 sets of (x1,y1),(x2,y2) coordinates
// to enumerate the to/from coordinates in both senses
// but we can reduce from 88 to 22 bytes by storing a list of
// squares you can't move north from (or south to), and likewise west from (or east to)
const blocked = [
    // can't move north from here (or south into here)
    [
        { lon: 40, lat: 35 },
        { lon: 39, lat: 35 },
        { lon: 38, lat: 35 },
        { lon: 35, lat: 36 },
        { lon: 34, lat: 36 },
        { lon: 22, lat: 3 },
        { lon: 15, lat: 6 },
        { lon: 14, lat: 7 },
        { lon: 19, lat: 3 }
    ],
    // can't move west from here (or east into here)
    [
        { lon: 35, lat: 33 },
        { lon: 14, lat: 7 },
    ]
];

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

const scenarios = {
    [0 /* ScenarioKey.apx */]: {
        label: 'APX MODE', map: 0 /* MapVariantKey.apx */, oob: 0 /* OobVariantKey.apx */, start: '1941/6/22',
        //TODO fix me
        ncity: 18, mdmg: 1, cdmg: 5, cadj: 0, nunit: [0x37, 0x9f], endturn: 44,
        scoring: { win: 255, location: true },
        surprised: 1 /* PlayerKey.Russian */, repl: [0, 2]
    },
    [1 /* ScenarioKey.learner */]: {
        label: 'LEARNER', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 255, nunit: [0x2, 0x31], endturn: 14,
        scoring: { win: 5, strength: [null, 'losses'] },
        surprised: 1 /* PlayerKey.Russian */, skipsupply: true, nozoc: true, simplebreak: true
    },
    [2 /* ScenarioKey.beginner */]: {
        label: 'BEGINNER', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 150, nunit: [0x12, 0x50], endturn: 14,
        scoring: { win: 25, strength: [null, 'losses'] },
        surprised: 1 /* PlayerKey.Russian */, skipsupply: true, nozoc: true, simplebreak: true
    },
    [3 /* ScenarioKey.intermediate */]: {
        label: 'INTERMED', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, start: '1941/6/22',
        ncity: 3, mdmg: 2, cdmg: 8, cadj: 75, nunit: [0x1f, 0x72], endturn: 40,
        surprised: 1 /* PlayerKey.Russian */, scoring: { win: 40, strength: ['losses', 'losses'] },
    },
    [4 /* ScenarioKey.advanced */]: {
        label: 'ADVANCED', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 5, cadj: 25, nunit: [0x2b, 0x90], endturn: 40,
        scoring: { win: 80, strength: ['losses', 'losses'] },
        surprised: 1 /* PlayerKey.Russian */, fog: 6,
    },
    [5 /* ScenarioKey.expert41 */]: {
        label: 'EXPERT41', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, nunit: [0x30, 0xa8], endturn: 44,
        scoring: { win: 255, strength: ['losses', 'current'] },
        surprised: 1 /* PlayerKey.Russian */, mvmode: true, fog: 7, defmod: 1,
    },
    [6 /* ScenarioKey.expert42 */]: {
        //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
        label: 'EXPERT42', map: 1 /* MapVariantKey.cart */, oob: 2 /* OobVariantKey.cart42 */, start: '1942/5/24',
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, nunit: [0x30, 0xa8], endturn: 44,
        // adjust by 9 here because cart measures losses wrt to 1941 start value
        scoring: { win: 255, strength: ['losses', 'current'], adjust: -9 },
        mvmode: true, fog: 7, defmod: 1,
        control: ['Riga', 'Rzhev', 'Smolensk', 'Minsk', 'Orel', 'Kharkov', 'Kiev', 'Dnepropetrovsk', 'Odessa']
    },
};

//TODO these represent deviations from the original implementation
// in general false reflects the original APX/cartridge condition
// the values here show my current choices, but aren't actually configurable in code yet
const options = {
    colorPalette: 'WikiNTSC',
    astarPathFinding: true,
    reduceInitialFogInContact: true,
    mapIncludesSevastopol: true,
    disperseEliminatedUnits: true,
    defenderFirstStrike: true,
    // hard-wired settings (these config options aren't referenced)
    mapIncludeSevastopol: true,
    germanReinforcementsMoveOnArrival: true,
    russianReinforcementsMoveOnArrival: false,
    moreRandomSupplyAndRetreat: true,
    shuffleUnitInitiative: false,
    shuffleThinkingOrder: false,
};

var _Mapboard_instances, _Mapboard_game, _Mapboard_maxlon, _Mapboard_maxlat, _Mapboard_icelat, _Mapboard_validlocs, _Mapboard_neighborids_, _Mapboard_neighborids, _Mapboard_freezeThaw;
// mapboard constructor, used as a container of MapPoints
class Mapboard {
    constructor(game, memento) {
        _Mapboard_instances.add(this);
        _Mapboard_game.set(this, void 0); //TODO only wants .month, .emit, .rand
        _Mapboard_maxlon.set(this, void 0);
        _Mapboard_maxlat.set(this, void 0);
        _Mapboard_icelat.set(this, 39); // via M.ASM:8600 PSXVAL initial value is 0x27
        _Mapboard_validlocs.set(this, new Map());
        // hack to memoize class method.  probably a better way to do it?
        _Mapboard_neighborids.set(this, memoize((gid) => __classPrivateFieldGet(this, _Mapboard_instances, "m", _Mapboard_neighborids_).call(this, gid)));
        const scenario = scenarios[game.scenario], variant = mapVariants[scenario.map], ncity = scenario.ncity, mapencoding = variant.encoding.map((enc, i) => {
            // convert the encoding table into a lookup of char => [icon, terraintype, alt-flag]
            const lookup = {};
            let ch = 0;
            enc.split('|').forEach((s, t) => s.split('').forEach(c => {
                const alt = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                if (ch == 0x40)
                    ch--;
                lookup[c] = {
                    icon: i * 0x40 + ch++,
                    terrain: t,
                    alt: alt
                };
            }));
            return lookup;
        });
        let raw = variant.ascii;
        raw = raw.slice().replace('~~FJ~~', '~~$J~~');
        // decode the map into a 2-d array of rows x cols of  {lon: , lat:, icon:, terrain:, alt:}
        const mapdata = raw.split(/\n/).slice(1, -1).map((row, i) => row.split('').map(c => Object.assign({}, mapencoding[i <= 25 ? 0 : 1][c])));
        this.font = variant.font;
        // excluding the impassable border valid is 0..maxlon-1, 0..maxlat-1
        __classPrivateFieldSet(this, _Mapboard_maxlon, mapdata[0].length - 2, "f");
        __classPrivateFieldSet(this, _Mapboard_maxlat, mapdata.length - 2, "f");
        __classPrivateFieldSet(this, _Mapboard_game, game, "f");
        this.locations = mapdata.map((row, i) => row.map((data, j) => {
            const lon = __classPrivateFieldGet(this, _Mapboard_maxlon, "f") - j, lat = __classPrivateFieldGet(this, _Mapboard_maxlat, "f") - i, pt = Grid.lonlat(lon, lat), loc = Object.assign(Object.assign({}, pt), data);
            if (pt.lat >= 0 && pt.lat < __classPrivateFieldGet(this, _Mapboard_maxlat, "f") && pt.lon >= 0 && pt.lon < __classPrivateFieldGet(this, _Mapboard_maxlon, "f")) {
                __classPrivateFieldGet(this, _Mapboard_validlocs, "f").set(pt.gid, loc);
            }
            return loc;
        }));
        this.cities = variant.cities
            .filter(c => options.mapIncludesSevastopol )
            .map(c => (Object.assign({}, c)));
        this.cities.forEach((city, i) => {
            var _a;
            city.points = i < ncity ? ((_a = city.points) !== null && _a !== void 0 ? _a : 0) : 0;
            const loc = this.locationOf(Grid.point(city));
            if (loc.terrain != 2 /* TerrainKey.city */)
                throw new Error(`Mapboard: city at (${loc.lon}, ${loc.lat}) missing city terrain`);
            loc.cityid = i;
            if (scenario.control && scenario.control.includes(city.label)) {
                city.owner = 1 - city.owner;
            }
        });
        // verify each city terrain has a cityid
        const missing = this.locations.map(row => row.filter(loc => loc.terrain == 2 /* TerrainKey.city */ && typeof loc.cityid === 'undefined')).flat();
        if (missing.length > 0)
            throw new Error(`Mapboard: city terrain missing city details, e.g. ${this.describe(missing[0])}`);
        // verify that any control cities exist
        if (scenario.control) {
            const labels = this.cities.map(c => c.label), diff = scenario.control.filter(label => !labels.includes(label));
            if (diff.length > 0)
                throw new Error(`Mapboard: scenario.control has unknown cities ${diff}`);
        }
        if (memento) {
            if (memento.length < variant.cities.length + 1)
                throw new Error("Mapboard: malformed save data");
            __classPrivateFieldGet(this, _Mapboard_instances, "m", _Mapboard_freezeThaw).call(this, 0 /* WaterStateKey.freeze */, memento.shift());
            this.cities.forEach((c, i) => {
                c.owner = memento.shift();
            });
        }
    }
    get memento() {
        const scenario = scenarios[__classPrivateFieldGet(this, _Mapboard_game, "f").scenario]; mapVariants[scenario.map]; const control = this.cities.map(c => c.owner);
        return [].concat([__classPrivateFieldGet(this, _Mapboard_icelat, "f")], control);
    }
    nextTurn(startOrResume = false) {
        const mdata = monthdata[__classPrivateFieldGet(this, _Mapboard_game, "f").month];
        //TODO :grimace: update the tree color in place in the terrain data
        terraintypes[1 /* TerrainKey.mountain_forest */].altcolor = mdata.trees;
        if (!startOrResume && mdata.water != null)
            __classPrivateFieldGet(this, _Mapboard_instances, "m", _Mapboard_freezeThaw).call(this, mdata.water);
    }
    get extent() {
        // map dimension including impassable boundary
        return { width: this.locations[0].length, height: this.locations.length };
    }
    get bbox() {
        // bounding box for valid map area
        return {
            [0 /* DirectionKey.north */]: __classPrivateFieldGet(this, _Mapboard_maxlat, "f") - 1,
            [2 /* DirectionKey.south */]: 0,
            [3 /* DirectionKey.west */]: __classPrivateFieldGet(this, _Mapboard_maxlon, "f") - 1,
            [1 /* DirectionKey.east */]: 0,
        };
    }
    xy({ lon, lat }) {
        // return an x, y indexed from top, left rather than lon, lat indexed from bottom, right
        return { x: __classPrivateFieldGet(this, _Mapboard_maxlon, "f") - lon, y: __classPrivateFieldGet(this, _Mapboard_maxlat, "f") - lat };
    }
    describe(loc, debug = false) {
        var _a;
        const city = loc.cityid != null ? this.cities[loc.cityid] : undefined, label = city
            ? ` ${city.label} (${(_a = city.points) !== null && _a !== void 0 ? _a : 0})`
            : (terraintypes[loc.terrain].label + (loc.alt ? "-alt" : "")), unit = loc.unitid != null ? __classPrivateFieldGet(this, _Mapboard_game, "f").oob.at(loc.unitid).describe(debug) : "";
        return `[${loc.gid}] ${label}\nlon ${loc.lon}, lat ${loc.lat}\n\n${unit}`.trim();
    }
    valid(pt) {
        return __classPrivateFieldGet(this, _Mapboard_validlocs, "f").has(pt.gid);
    }
    locationOf(pt) {
        // nb throws for impassable boundary points
        const loc = __classPrivateFieldGet(this, _Mapboard_validlocs, "f").get(pt.gid);
        if (loc == null)
            throw new Error(`MapBoard.locationOf: invalid point ${pt.lon}, ${pt.lat}`);
        return loc;
    }
    boundaryDistance(pt, dir) {
        switch (dir) {
            case 0 /* DirectionKey.north */: return __classPrivateFieldGet(this, _Mapboard_maxlat, "f") - 1 - pt.lat;
            case 2 /* DirectionKey.south */: return pt.lat;
            case 1 /* DirectionKey.east */: return pt.lon;
            case 3 /* DirectionKey.west */: return __classPrivateFieldGet(this, _Mapboard_maxlon, "f") - 1 - pt.lon;
        }
    }
    neighborsOf({ gid }) {
        return __classPrivateFieldGet(this, _Mapboard_neighborids, "f").call(this, gid)
            .map(v => v == null ? v : __classPrivateFieldGet(this, _Mapboard_validlocs, "f").get(v));
    }
    neighborOf({ gid }, dir) {
        const nbrid = __classPrivateFieldGet(this, _Mapboard_neighborids, "f").call(this, gid)[dir];
        return nbrid == null ? undefined : __classPrivateFieldGet(this, _Mapboard_validlocs, "f").get(nbrid);
    }
    occupy(loc, player) {
        if (loc.cityid != null) {
            const c = this.cities[loc.cityid];
            if (c.owner != player) {
                c.owner = player;
                __classPrivateFieldGet(this, _Mapboard_game, "f").emit('map', 'citycontrol', loc);
            }
        }
    }
    directPath(p, q, costs) {
        /*
        implements a variation of Bresenham's algorith to get direct path from p to q
        returns the list of directions to step from p to q, along with the terrain cost
        similar to the original path algorithm described in the APX notes

        The straight line can be described by the equation A x + B y + C = 0 where
        A = (y1 - y0), B = -(x1 - x0) and C = x1 y0 - x0 y1.  (Here x is lon, y is lat)
        To follow the line most closely using grid point x*, y* we keep the error E = A x* + B y* + C
        as close to zero as possible.
        Taking a step in direction dx, dy will change E by A dx + B dy
        so we just keep choosing the step that moves E back towards zero.
        */
        let loc = this.locationOf(p);
        const goal = this.locationOf(q);
        if (loc.gid == goal.gid)
            return { cost: 0, orders: [] };
        const A = q.lat - p.lat, B = -(q.lon - p.lon), 
        // C = q.lon * p.lat - q.lat * p.lon,
        projections = Grid.directionsFrom(p, q), i = projections[0][1], j = projections[1][1], // best two directinoe
        s = directions[i], t = directions[j], ds = A * s.dlon + B * s.dlat, dt = A * t.dlon + B * t.dlat;
        let err = 0, cost = 0;
        const orders = [];
        while (loc.gid != goal.gid) {
            const [k, de] = Math.abs(err + ds) < Math.abs(err + dt) ? [i, ds] : [j, dt];
            err += de;
            orders.push(k);
            //NB. not validating that we can actually take this path
            loc = this.locationOf(Grid.adjacent(loc, k));
            cost += costs ? costs[loc.terrain] : 1;
        }
        return { cost, orders };
    }
    bestPath(p, q, costs) {
        // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
        // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
        // or null if goal is unreachable
        const minCost = Math.min(...costs), _head = -1;
        let src = this.locationOf(p);
        const goal = this.locationOf(q), 
        // linked list of points to search next, ordered by estimated total cost via this point
        frontier = new Map([[_head, { id: src.gid, est: 0 }]]), 
        // dir arrived from and cost from start to here
        found = new Map([[src.gid, { dir: null, cost: 0 }]]);
        while (frontier.has(_head)) {
            const { id: next } = frontier.get(_head);
            src = this.locationOf(Grid.byid(next));
            if (src.gid == goal.gid)
                break;
            if (frontier.has(next)) {
                frontier.set(_head, frontier.get(next));
                frontier.delete(next);
            }
            else {
                frontier.delete(_head);
            }
            this.neighborsOf(src).forEach((dst, i) => {
                if (!dst)
                    return;
                const d = +i, cost = found.get(src.gid).cost + costs[dst.terrain];
                if (!found.has(dst.gid)) { // with consistent estimate we always find best first
                    found.set(dst.gid, { dir: d, cost });
                    const est = cost + minCost * Grid.manhattanDistance(src, dst);
                    let tail = _head;
                    // insert point in linked list before tail to maintain asc sort by est
                    while (frontier.has(tail)) {
                        const { id: _next, est: _est } = frontier.get(tail);
                        if (est <= _est)
                            break;
                        tail = _next;
                    }
                    if (frontier.has(tail)) {
                        frontier.set(dst.gid, frontier.get(tail));
                    }
                    frontier.set(tail, { id: dst.gid, est: est });
                }
            });
        }
        if (src.gid != goal.gid)
            throw new Error(`MapBoard.bestPath: no path from ${p} to ${q}`);
        const orders = [];
        let pt = goal;
        for (;;) {
            const dir = found.get(pt.gid).dir;
            if (dir == null)
                break;
            orders.unshift(dir);
            pt = Grid.adjacent(pt, (dir + 2) % 4); // walk back in reverse direction
        }
        return { cost: found.get(goal.gid).cost, orders: orders };
    }
    reach(src, range, costs) {
        // find all squares accessible to unit within range, ignoring other units, zoc
        // returns a map of point ids => range
        let cost = 0;
        const start = this.locationOf(src), locs = { [start.gid]: 0 };
        while (cost < range) {
            Object.entries(locs).filter(([, v]) => v == cost).forEach(([k,]) => {
                const src = Grid.byid(+k);
                this.neighborsOf(src).forEach(dst => {
                    if (!dst)
                        return;
                    const curr = dst.gid in locs ? locs[dst.gid] : 255;
                    if (curr <= cost)
                        return;
                    const c = cost + costs[dst.terrain];
                    if (c <= range && c < curr)
                        locs[dst.gid] = c;
                });
            });
            cost++;
        }
        return locs;
    }
}
_Mapboard_game = new WeakMap(), _Mapboard_maxlon = new WeakMap(), _Mapboard_maxlat = new WeakMap(), _Mapboard_icelat = new WeakMap(), _Mapboard_validlocs = new WeakMap(), _Mapboard_neighborids = new WeakMap(), _Mapboard_instances = new WeakSet(), _Mapboard_neighborids_ = function _Mapboard_neighborids_(gid) {
    const pt = __classPrivateFieldGet(this, _Mapboard_validlocs, "f").get(gid);
    if (pt == null)
        return [undefined, undefined, undefined, undefined];
    return Grid.adjacencies(pt).map((q, i) => {
        const nbr = __classPrivateFieldGet(this, _Mapboard_validlocs, "f").get(q.gid), dir = +i;
        if (nbr == null)
            return undefined;
        const legal = (nbr.terrain != 9 /* TerrainKey.impassable */
            && !((dir == 0 /* DirectionKey.north */ || dir == 2 /* DirectionKey.south */)
                ? blocked[0].find(d => d.lon == pt.lon && d.lat == (dir == 0 /* DirectionKey.north */ ? pt.lat : nbr.lat))
                : blocked[1].find(d => d.lon == (dir == 3 /* DirectionKey.west */ ? pt.lon : nbr.lon) && d.lat == pt.lat)));
        return legal ? nbr.gid : null;
    });
}, _Mapboard_freezeThaw = function _Mapboard_freezeThaw(w, newlat) {
    // move ice by freeze/thaw rivers and swamps, where w is Water.freeze or Water.thaw
    // ICELAT -= [7,14] incl]; clamp 1-39 incl
    // small bug in APX code? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
    const state = waterstate[w], other = waterstate[1 - w], oldlat = __classPrivateFieldGet(this, _Mapboard_icelat, "f"), dlat = directions[state.dir].dlat;
    if (newlat != null) {
        // initial setup where we freeze to saved value
        __classPrivateFieldSet(this, _Mapboard_icelat, newlat, "f");
    }
    else {
        const change = __classPrivateFieldGet(this, _Mapboard_game, "f").rand.bits(3) + 7;
        __classPrivateFieldSet(this, _Mapboard_icelat, clamp(oldlat + dlat * change, 1, __classPrivateFieldGet(this, _Mapboard_maxlat, "f")), "f");
    }
    const skip = (w == 0 /* WaterStateKey.freeze */) ? oldlat : __classPrivateFieldGet(this, _Mapboard_icelat, "f"); // for freeze skip old line, for thaw skip new new
    for (let i = oldlat; i != __classPrivateFieldGet(this, _Mapboard_icelat, "f") + dlat; i += dlat) {
        if (i == skip)
            continue;
        this.locations[__classPrivateFieldGet(this, _Mapboard_maxlat, "f") - i].forEach(d => {
            const k = other.terrain.indexOf(d.terrain);
            if (k != -1)
                d.terrain = state.terrain[k];
        });
    }
};

const oobVariants = {
    [0 /* OobVariantKey.apx */]: [
        // CORPSX, CORPSY, MSTRNG, SWAP, ARRIVE, CORPT, CORPNO
        // German
        [0, 0, 0, 0, 255, 0, 0],
        [40, 20, 203, 126, 0, 3, 24],
        [40, 19, 205, 126, 255, 3, 39],
        [40, 18, 192, 126, 0, 3, 46],
        [40, 17, 199, 126, 0, 3, 47],
        [40, 16, 184, 126, 0, 3, 57],
        [41, 20, 136, 125, 0, 0, 5],
        [40, 19, 127, 125, 0, 0, 6],
        [41, 18, 150, 125, 0, 0, 7],
        [41, 17, 129, 125, 0, 0, 8],
        [41, 16, 136, 125, 0, 0, 9],
        [42, 20, 109, 125, 255, 0, 12],
        [42, 19, 72, 125, 255, 0, 13],
        [42, 18, 70, 125, 255, 0, 20],
        [42, 17, 81, 125, 255, 0, 42],
        [43, 19, 131, 125, 255, 0, 43],
        [43, 18, 102, 125, 255, 0, 53],
        [43, 17, 53, 125, 255, 64, 3],
        [41, 23, 198, 126, 0, 3, 41],
        [40, 22, 194, 126, 0, 3, 56],
        [40, 21, 129, 125, 0, 0, 1],
        [41, 21, 123, 125, 0, 0, 2],
        [41, 22, 101, 125, 0, 0, 10],
        [42, 22, 104, 125, 0, 0, 26],
        [42, 23, 112, 125, 0, 0, 28],
        [42, 24, 120, 125, 0, 0, 38],
        [40, 15, 202, 126, 0, 3, 3],
        [41, 14, 195, 126, 0, 3, 14],
        [42, 13, 191, 126, 0, 3, 48],
        [41, 15, 72, 126, 255, 3, 52],
        [42, 14, 140, 125, 0, 0, 49],
        [42, 12, 142, 125, 0, 0, 4],
        [43, 13, 119, 125, 0, 0, 17],
        [41, 15, 111, 125, 0, 0, 29],
        [42, 16, 122, 125, 255, 0, 44],
        [43, 16, 77, 125, 255, 0, 55],
        [30, 2, 97, 125, 0, 48, 1],
        [30, 3, 96, 125, 0, 48, 2],
        [31, 4, 92, 125, 0, 48, 4],
        [33, 6, 125, 125, 0, 0, 11],
        [35, 7, 131, 125, 0, 0, 30],
        [37, 8, 106, 125, 0, 0, 54],
        [35, 38, 112, 125, 0, 32, 2],
        [36, 37, 104, 125, 0, 32, 4],
        [36, 38, 101, 125, 255, 32, 6],
        [45, 20, 210, 126, 2, 3, 40],
        [45, 15, 97, 125, 255, 0, 27],
        [38, 8, 98, 126, 2, 83, 1],
        [45, 16, 95, 125, 5, 0, 23],
        [31, 1, 52, 125, 6, 48, 5],
        [45, 20, 98, 125, 9, 0, 34],
        [45, 19, 96, 125, 10, 0, 35],
        [32, 1, 55, 125, 11, 64, 4],
        [45, 17, 104, 125, 20, 0, 51],
        [45, 18, 101, 126, 24, 7, 50],
        // Russian
        [29, 32, 100, 253, 4, 4, 7],
        [27, 31, 103, 253, 5, 4, 11],
        [24, 38, 110, 253, 7, 0, 41],
        [23, 38, 101, 253, 9, 0, 42],
        [20, 38, 92, 253, 11, 0, 43],
        [15, 38, 103, 253, 13, 0, 44],
        [0, 20, 105, 253, 7, 0, 45],
        [0, 8, 107, 253, 12, 0, 46],
        [0, 18, 111, 253, 8, 0, 47],
        [0, 10, 88, 253, 10, 0, 48],
        [0, 14, 117, 254, 10, 1, 9],
        [0, 33, 84, 254, 14, 1, 13],
        [0, 11, 109, 254, 15, 1, 14],
        [0, 15, 89, 254, 16, 1, 15],
        [0, 20, 105, 254, 18, 1, 16],
        [0, 10, 93, 254, 7, 2, 7],
        [21, 28, 62, 254, 0, 1, 2],
        [21, 27, 104, 253, 0, 0, 19],
        [30, 14, 101, 253, 0, 0, 18],
        [30, 13, 67, 254, 0, 2, 1],
        [39, 28, 104, 253, 0, 0, 27],
        [38, 28, 84, 254, 0, 1, 10],
        [23, 31, 127, 253, 0, 0, 22],
        [19, 24, 112, 253, 0, 0, 21],
        [34, 22, 111, 253, 0, 0, 13],
        [34, 21, 91, 254, 0, 1, 6],
        [31, 34, 79, 253, 0, 4, 9],
        [27, 6, 69, 253, 0, 0, 2],
        [33, 37, 108, 253, 0, 4, 1],
        [41, 24, 118, 253, 0, 0, 8],
        [40, 23, 137, 253, 0, 0, 11],
        [39, 23, 70, 254, 0, 1, 1],
        [42, 25, 85, 254, 0, 1, 7],
        [39, 20, 130, 253, 0, 0, 3],
        [39, 22, 91, 253, 0, 0, 4],
        [39, 18, 131, 253, 0, 0, 10],
        [39, 17, 71, 254, 0, 1, 5],
        [39, 21, 86, 254, 0, 1, 8],
        [37, 20, 75, 254, 0, 2, 3],
        [39, 19, 90, 254, 0, 2, 6],
        [39, 16, 123, 253, 0, 0, 5],
        [39, 15, 124, 253, 0, 0, 6],
        [40, 14, 151, 253, 0, 0, 12],
        [41, 13, 128, 253, 0, 0, 26],
        [41, 12, 88, 254, 0, 1, 3],
        [39, 11, 77, 254, 0, 1, 4],
        [36, 9, 79, 254, 0, 1, 11],
        [34, 8, 80, 254, 0, 2, 5],
        [32, 6, 126, 253, 0, 0, 9],
        [35, 9, 79, 254, 0, 1, 12],
        [30, 4, 91, 254, 0, 2, 4],
        [28, 2, 84, 254, 0, 2, 2],
        [25, 6, 72, 253, 1, 0, 7],
        [29, 14, 86, 253, 1, 4, 2],
        [32, 22, 76, 253, 1, 0, 14],
        [33, 36, 99, 253, 1, 4, 4],
        [26, 23, 67, 253, 1, 0, 15],
        [21, 8, 78, 253, 2, 0, 16],
        [29, 33, 121, 253, 2, 0, 20],
        [0, 28, 114, 253, 2, 0, 6],
        [28, 30, 105, 253, 3, 0, 24],
        [21, 20, 122, 253, 3, 0, 40],
        [21, 28, 127, 253, 4, 0, 29],
        [21, 33, 129, 253, 4, 0, 30],
        [20, 27, 105, 253, 5, 0, 31],
        [20, 30, 111, 253, 5, 0, 32],
        [12, 8, 112, 253, 6, 0, 33],
        [0, 10, 127, 253, 6, 0, 37],
        [0, 32, 119, 253, 7, 0, 43],
        [0, 11, 89, 253, 8, 0, 49],
        [0, 25, 108, 253, 8, 0, 50],
        [0, 12, 113, 253, 8, 0, 52],
        [0, 23, 105, 253, 9, 0, 54],
        [0, 13, 94, 253, 9, 0, 55],
        [21, 29, 103, 254, 5, 114, 1],
        [25, 30, 97, 253, 5, 0, 34],
        [0, 31, 108, 253, 2, 112, 1],
        [0, 15, 110, 253, 9, 112, 2],
        [0, 27, 111, 253, 10, 112, 3],
        [0, 17, 96, 253, 10, 112, 4],
        [0, 25, 109, 253, 6, 0, 39],
        [0, 11, 112, 253, 11, 0, 59],
        [0, 23, 95, 253, 5, 0, 60],
        [0, 19, 93, 253, 17, 0, 61],
        [0, 21, 114, 254, 2, 114, 2],
        [0, 33, 103, 254, 11, 1, 1],
        [0, 28, 107, 254, 20, 113, 1],
        [0, 13, 105, 253, 21, 112, 5],
        [0, 26, 92, 254, 22, 1, 2],
        [0, 10, 109, 253, 23, 112, 6],
        [0, 29, 101, 254, 24, 1, 3],
        [0, 35, 106, 254, 26, 1, 4],
        [0, 27, 95, 253, 28, 0, 38],
        [0, 15, 99, 254, 30, 0, 36],
        [38, 30, 101, 253, 2, 0, 35],
        [21, 22, 118, 253, 3, 0, 28],
        [12, 8, 106, 253, 3, 0, 25],
        [20, 13, 112, 253, 3, 0, 23],
        [21, 14, 104, 253, 3, 0, 17],
        [20, 28, 185, 253, 6, 4, 8],
        [15, 3, 108, 253, 6, 4, 10],
        [21, 3, 94, 253, 4, 4, 3],
        [20, 3, 102, 253, 4, 4, 5],
        [19, 2, 98, 253, 4, 4, 6],
    ],
    [1 /* OobVariantKey.cart41 */]: [
        // ["CORPSX", "CORPSY", "MSTRNG", "ARRIVE", "CORPT", "CORPNO"]
        [0, 0, 0, 255, 0, 0],
        [40, 20, 223, 0, 4, 24],
        [40, 18, 192, 0, 4, 46],
        [40, 17, 199, 0, 4, 47],
        [40, 16, 184, 0, 4, 57],
        [41, 20, 136, 0, 0, 5],
        [40, 19, 127, 0, 0, 6],
        [41, 18, 150, 0, 0, 7],
        [41, 17, 129, 0, 0, 8],
        [41, 16, 136, 0, 0, 9],
        [41, 23, 198, 0, 4, 41],
        [40, 22, 194, 0, 4, 56],
        [40, 21, 129, 0, 0, 1],
        [41, 21, 123, 0, 0, 2],
        [41, 22, 101, 0, 0, 10],
        [42, 22, 104, 0, 0, 26],
        [42, 23, 112, 0, 0, 28],
        [42, 24, 120, 0, 0, 38],
        [40, 15, 202, 0, 4, 3],
        [41, 14, 195, 0, 4, 14],
        [42, 13, 191, 0, 4, 48],
        [42, 14, 140, 0, 0, 49],
        [42, 12, 142, 0, 0, 4],
        [43, 13, 119, 0, 0, 17],
        [41, 15, 111, 0, 0, 29],
        [30, 2, 97, 0, 48, 1],
        [30, 3, 96, 0, 48, 2],
        [31, 4, 92, 0, 48, 4],
        [33, 6, 125, 0, 0, 11],
        [35, 7, 131, 0, 0, 30],
        [37, 8, 106, 0, 0, 54],
        [35, 38, 112, 0, 32, 2],
        [36, 37, 104, 0, 32, 4],
        [45, 20, 210, 2, 4, 40],
        [38, 8, 98, 3, 84, 1],
        [45, 15, 97, 4, 0, 27],
        [45, 16, 95, 5, 0, 23],
        [31, 1, 52, 6, 48, 5],
        [45, 17, 97, 7, 0, 12],
        [45, 18, 109, 8, 0, 13],
        [45, 20, 98, 9, 0, 34],
        [45, 19, 96, 10, 0, 35],
        [32, 1, 55, 11, 64, 4],
        [44, 20, 219, 0, 3, 1],
        [44, 18, 183, 0, 3, 2],
        [44, 17, 206, 0, 3, 3],
        [44, 16, 237, 0, 3, 4],
        [44, 14, 191, 0, 3, 5],
        // Russian starting offset +48 hex #$3034
        [20, 28, 185, 0, 129, 1],
        [21, 28, 62, 0, 133, 2],
        [21, 27, 104, 0, 128, 19],
        [30, 14, 101, 0, 128, 18],
        [30, 13, 67, 0, 134, 1],
        [39, 28, 104, 0, 128, 27],
        [38, 28, 84, 0, 133, 10],
        [23, 31, 127, 0, 128, 22],
        [19, 24, 112, 0, 128, 21],
        [34, 22, 111, 0, 128, 13],
        [34, 21, 91, 0, 133, 6],
        [31, 34, 79, 0, 129, 9],
        [41, 24, 118, 0, 128, 8],
        [40, 23, 137, 0, 128, 11],
        [39, 23, 70, 0, 133, 1],
        [42, 25, 85, 0, 133, 7],
        [39, 20, 130, 0, 128, 3],
        [39, 22, 91, 0, 128, 4],
        [39, 18, 131, 0, 128, 10],
        [39, 17, 71, 0, 133, 5],
        [39, 21, 86, 0, 133, 8],
        [37, 20, 75, 0, 134, 3],
        [39, 19, 90, 0, 134, 6],
        [39, 16, 123, 0, 128, 5],
        [39, 15, 124, 0, 128, 6],
        [40, 14, 151, 0, 128, 12],
        [41, 13, 128, 0, 128, 26],
        [32, 22, 76, 1, 128, 14],
        [26, 23, 97, 1, 128, 15],
        [29, 33, 121, 2, 128, 20],
        [28, 30, 106, 3, 128, 24],
        [21, 20, 122, 3, 128, 40],
        [21, 28, 127, 4, 128, 29],
        [21, 33, 129, 4, 128, 30],
        [20, 27, 105, 5, 128, 31],
        [20, 30, 111, 5, 128, 32],
        [27, 6, 84, 0, 128, 2],
        [33, 37, 108, 0, 129, 8],
        [41, 12, 89, 0, 133, 3],
        [39, 11, 94, 0, 133, 4],
        [36, 9, 98, 0, 133, 11],
        [34, 8, 82, 0, 134, 5],
        [32, 6, 126, 0, 128, 9],
        [35, 9, 101, 0, 133, 12],
        [30, 4, 91, 0, 134, 4],
        [28, 2, 84, 0, 134, 2],
        [25, 6, 88, 1, 128, 7],
        [29, 14, 91, 1, 129, 2],
        [33, 36, 99, 1, 129, 4],
        [24, 38, 110, 6, 128, 41],
        [23, 38, 105, 8, 128, 42],
        [20, 38, 97, 10, 128, 43],
        [21, 8, 126, 2, 128, 16],
        [0, 28, 119, 2, 128, 56],
        [12, 8, 122, 6, 128, 33],
        [21, 29, 113, 5, 246, 1],
        [25, 30, 97, 5, 128, 34],
        [38, 30, 99, 2, 128, 35],
        [21, 22, 121, 3, 128, 28],
        [12, 8, 118, 3, 128, 25],
        [20, 13, 112, 3, 128, 23],
        [29, 32, 108, 4, 129, 7],
        [27, 31, 123, 5, 129, 11],
        [15, 3, 138, 6, 129, 10],
        [21, 3, 126, 2, 129, 3],
        [20, 3, 119, 2, 129, 5],
        [21, 14, 144, 9, 128, 17],
        [15, 38, 133, 12, 128, 44],
        [0, 20, 135, 10, 128, 45],
        [0, 8, 137, 18, 128, 46],
        [0, 18, 141, 11, 128, 47],
        [0, 10, 128, 15, 128, 48],
        [0, 14, 157, 13, 133, 9],
        [0, 33, 124, 19, 133, 13],
        [0, 11, 159, 20, 133, 14],
        [0, 15, 129, 22, 133, 15],
        [0, 20, 135, 24, 133, 16],
        [0, 10, 123, 11, 134, 7],
        [0, 10, 167, 10, 128, 37],
        [0, 32, 149, 7, 128, 43],
        [0, 11, 139, 6, 128, 49],
        [0, 25, 138, 8, 128, 50],
        [0, 12, 153, 11, 128, 52],
        [0, 23, 165, 9, 128, 54],
        [0, 13, 124, 12, 128, 55],
        [0, 31, 178, 3, 240, 1],
        [0, 15, 150, 9, 240, 2],
        [0, 27, 141, 13, 240, 3],
        [0, 17, 206, 14, 240, 4],
        [0, 7, 130, 1, 128, 79],
        [0, 10, 112, 2, 133, 18],
        [0, 8, 139, 3, 133, 19],
        [0, 9, 113, 4, 128, 95],
        [0, 18, 152, 5, 133, 20],
        [0, 16, 131, 6, 128, 67],
        [0, 12, 127, 7, 128, 66],
        [0, 14, 166, 8, 133, 28],
        [0, 25, 219, 7, 128, 39],
        [0, 11, 202, 12, 128, 59],
        [0, 23, 185, 6, 128, 60],
        [0, 19, 233, 10, 128, 61],
        [0, 21, 244, 11, 246, 2],
        [0, 33, 223, 12, 133, 31],
        [0, 28, 237, 13, 245, 1],
        [0, 13, 245, 14, 240, 5],
        [0, 26, 242, 15, 133, 32],
        [0, 10, 239, 16, 240, 6],
        [0, 29, 251, 17, 133, 33],
        [0, 35, 246, 18, 133, 34],
        [0, 27, 235, 19, 128, 38],
        [0, 22, 247, 20, 128, 36],
        [0, 32, 241, 21, 133, 8],
        [0, 26, 236, 21, 133, 12],
        [0, 8, 223, 22, 240, 7],
        [0, 28, 202, 23, 240, 8],
        [0, 16, 222, 23, 133, 11],
        [0, 12, 224, 24, 240, 9],
        [0, 30, 235, 25, 240, 10],
        [0, 24, 225, 25, 133, 7],
    ],
    // cart defines lat, lon, mstr for '42, but corpt & corpno duplicate '41, and arrive is calculated
    [2 /* OobVariantKey.cart42 */]: [
        // ["CORPSX42", "CORPSY42", "MSTRNG42", "ARRIVE42", "CORPT", "CORPNO"]
        [0, 0, 0, 255, 0, 0],
        [20, 20, 150, 0, 4, 24],
        [35, 29, 131, 0, 4, 46],
        [26, 26, 108, 0, 4, 47],
        [20, 21, 146, 0, 4, 57],
        [32, 36, 90, 0, 0, 5],
        [32, 35, 116, 0, 0, 6],
        [32, 34, 120, 0, 0, 7],
        [32, 32, 96, 0, 0, 8],
        [33, 31, 82, 0, 0, 9],
        [20, 19, 142, 0, 4, 41],
        [19, 16, 169, 0, 4, 56],
        [33, 29, 87, 0, 0, 1],
        [32, 28, 91, 0, 0, 2],
        [30, 28, 101, 0, 0, 10],
        [28, 28, 104, 0, 0, 26],
        [26, 28, 112, 0, 0, 28],
        [24, 27, 120, 0, 0, 38],
        [17, 12, 182, 0, 4, 3],
        [14, 11, 130, 0, 4, 14],
        [14, 9, 142, 0, 4, 48],
        [24, 28, 140, 0, 0, 49],
        [24, 26, 124, 0, 0, 4],
        [24, 24, 119, 0, 0, 17],
        [23, 23, 111, 0, 0, 29],
        [19, 15, 97, 0, 48, 1],
        [19, 13, 96, 0, 48, 2],
        [18, 12, 92, 0, 48, 4],
        [14, 12, 125, 0, 0, 11],
        [14, 10, 131, 0, 0, 30],
        [14, 8, 106, 0, 0, 54],
        [35, 38, 112, 0, 32, 2],
        [36, 37, 104, 0, 32, 4],
        [19, 14, 201, 0, 4, 40],
        [20, 18, 98, 0, 84, 1],
        [22, 23, 110, 0, 0, 27],
        [21, 22, 95, 0, 0, 23],
        [16, 12, 52, 0, 48, 5],
        [20, 17, 97, 0, 0, 12],
        [20, 1, 106, 0, 0, 13],
        [19, 0, 101, 0, 0, 34],
        [18, 3, 96, 0, 0, 35],
        [17, 2, 55, 0, 64, 4],
        [27, 26, 102, 0, 3, 1],
        [22, 20, 138, 0, 3, 2],
        [16, 10, 142, 0, 3, 3],
        [20, 2, 124, 0, 3, 4],
        [20, 15, 115, 0, 3, 5],
        // Russian offset +48 hex #$30
        [20, 28, 242, 0, 129, 1],
        [21, 29, 128, 0, 133, 2],
        [32, 37, 104, 0, 128, 19],
        [31, 34, 92, 0, 128, 18],
        [31, 35, 84, 0, 134, 1],
        [31, 32, 138, 0, 128, 27],
        [31, 33, 114, 0, 133, 10],
        [31, 31, 147, 0, 128, 22],
        [32, 31, 132, 0, 128, 21],
        [32, 30, 136, 0, 128, 13],
        [28, 30, 141, 0, 133, 6],
        [33, 36, 236, 0, 129, 9],
        [32, 29, 141, 0, 128, 8],
        [31, 29, 137, 0, 128, 11],
        [30, 29, 125, 0, 133, 1],
        [29, 29, 135, 0, 133, 7],
        [28, 29, 130, 0, 128, 3],
        [27, 29, 122, 0, 128, 4],
        [26, 29, 105, 0, 128, 10],
        [25, 29, 101, 0, 133, 5],
        [24, 29, 126, 0, 133, 8],
        [23, 29, 115, 0, 134, 3],
        [23, 28, 119, 0, 134, 6],
        [23, 27, 123, 0, 128, 5],
        [23, 26, 124, 0, 128, 6],
        [23, 25, 118, 0, 128, 12],
        [23, 24, 128, 0, 128, 26],
        [22, 24, 136, 0, 128, 14],
        [21, 24, 137, 0, 128, 15],
        [21, 23, 121, 0, 128, 20],
        [20, 23, 126, 0, 128, 24],
        [20, 22, 122, 0, 128, 40],
        [19, 22, 113, 0, 128, 29],
        [19, 21, 112, 0, 128, 30],
        [19, 20, 121, 0, 128, 31],
        [19, 19, 111, 0, 128, 32],
        [19, 18, 104, 0, 128, 2],
        [33, 37, 108, 0, 129, 8],
        [19, 17, 115, 0, 133, 3],
        [18, 16, 112, 0, 133, 4],
        [18, 15, 108, 0, 133, 11],
        [14, 19, 112, 0, 134, 5],
        [13, 16, 126, 0, 128, 9],
        [17, 14, 136, 0, 133, 12],
        [16, 14, 108, 0, 134, 4],
        [15, 14, 119, 0, 134, 2],
        [14, 14, 117, 0, 128, 7],
        [31, 37, 121, 0, 129, 2],
        [31, 36, 110, 0, 129, 4],
        [13, 13, 110, 0, 128, 41],
        [13, 12, 105, 0, 128, 42],
        [13, 11, 127, 0, 128, 43],
        [13, 10, 126, 0, 128, 16],
        [13, 9, 119, 0, 128, 56],
        [13, 8, 122, 0, 128, 33],
        [13, 7, 113, 0, 246, 1],
        [30, 30, 123, 0, 128, 34],
        [19, 25, 124, 0, 128, 35],
        [17, 23, 121, 0, 128, 28],
        [14, 18, 118, 0, 128, 25],
        [15, 21, 112, 0, 128, 23],
        [20, 0, 70, 0, 129, 7],
        [12, 4, 160, 0, 129, 11],
        [12, 8, 138, 0, 129, 10],
        [6, 15, 230, 0, 129, 3],
        [16, 3, 192, 0, 129, 5],
        [0, 20, 144, 2, 128, 17],
        [0, 12, 133, 3, 128, 44],
        [0, 30, 135, 3, 128, 45],
        [0, 10, 137, 4, 128, 46],
        [0, 6, 141, 4, 128, 47],
        [0, 22, 128, 5, 128, 48],
        [0, 15, 157, 5, 133, 9],
        [0, 24, 124, 6, 133, 13],
        [0, 16, 159, 6, 133, 14],
        [0, 18, 129, 7, 133, 15],
        [0, 35, 135, 7, 133, 16],
        [0, 10, 123, 8, 134, 7],
        [0, 20, 167, 8, 128, 37],
        [0, 26, 149, 9, 128, 43],
        [0, 5, 139, 9, 128, 49],
        [0, 11, 138, 10, 128, 50],
        [0, 14, 153, 10, 128, 52],
        [0, 22, 165, 11, 128, 54],
        [0, 33, 124, 11, 128, 55],
        [0, 19, 178, 12, 240, 1],
        [0, 8, 150, 12, 240, 2],
        [0, 28, 141, 13, 240, 3],
        [0, 15, 206, 13, 240, 4],
        [0, 13, 150, 14, 128, 79],
        [0, 35, 132, 14, 133, 18],
        [0, 6, 149, 15, 133, 19],
        [0, 10, 161, 15, 128, 95],
        [0, 30, 152, 16, 133, 20],
        [0, 15, 141, 16, 128, 67],
        [0, 25, 137, 17, 128, 66],
        [0, 11, 176, 17, 133, 28],
        [0, 22, 219, 18, 128, 39],
        [0, 19, 192, 18, 128, 59],
        [0, 30, 195, 19, 128, 60],
        [0, 21, 233, 19, 128, 61],
        [0, 15, 244, 20, 246, 2],
        [0, 7, 223, 20, 133, 31],
        [0, 28, 227, 21, 245, 1],
        [0, 10, 245, 21, 240, 5],
        [0, 33, 242, 22, 133, 32],
        [0, 12, 229, 22, 240, 6],
        [0, 26, 251, 23, 133, 33],
        [0, 14, 246, 23, 133, 34],
        [0, 24, 235, 24, 128, 38],
        [0, 16, 237, 24, 128, 36],
        [0, 6, 221, 25, 133, 8],
        [0, 35, 236, 25, 133, 12],
        [0, 10, 203, 26, 240, 7],
        [0, 30, 202, 26, 240, 8],
        [0, 19, 222, 27, 133, 11],
        [0, 37, 204, 27, 240, 9],
        [0, 23, 215, 28, 240, 10],
        [0, 31, 245, 28, 133, 7],
    ],
};

var _Unit_instances, _Unit_mode, _Unit_game, _Unit_resolveCombat, _Unit_takeDamage;
const unittypes = {
    [0 /* UnitTypeKey.infantry */]: { label: "infantry", kind: 0 /* UnitKindKey.infantry */ },
    [1 /* UnitTypeKey.militia */]: { label: "militia", kind: 0 /* UnitKindKey.infantry */, immobile: 1 },
    [2 /* UnitTypeKey.unused */]: null,
    [3 /* UnitTypeKey.flieger */]: { label: "flieger", kind: 2 /* UnitKindKey.air */ },
    [4 /* UnitTypeKey.panzer */]: { label: "panzer", kind: 1 /* UnitKindKey.armor */ },
    [5 /* UnitTypeKey.tank */]: { label: "tank", kind: 1 /* UnitKindKey.armor */ },
    [6 /* UnitTypeKey.cavalry */]: { label: "cavalry", kind: 1 /* UnitKindKey.armor */ },
    [7 /* UnitTypeKey.pzgrndr */]: { label: "pzgrndr", kind: 1 /* UnitKindKey.armor */ }, // apx only
};
const apxXref = {
    0: 0 /* UnitTypeKey.infantry */,
    1: 5 /* UnitTypeKey.tank */,
    2: 6 /* UnitTypeKey.cavalry */,
    3: 4 /* UnitTypeKey.panzer */,
    4: 1 /* UnitTypeKey.militia */,
    5: 2 /* UnitTypeKey.unused */ /* shock */,
    6: 2 /* UnitTypeKey.unused */ /* paratrp */,
    7: 7 /* UnitTypeKey.pzgrndr */,
}, modifiers = [
    { key: '' },
    { key: 'ss' },
    { key: 'finnish', canAttack: 0 },
    { key: 'rumanian' },
    { key: 'italian' },
    { key: 'hungarian' },
    { key: 'mountain' },
    { key: 'guards' },
];
// output-only status flags persisted during turn processing and emitted as events
const unitFlag = {
    orders: 1 << 0,
    attack: 1 << 1,
    defend: 1 << 2,
    damage: 1 << 3,
    move: 1 << 4,
    enter: 1 << 5,
    exit: 1 << 6,
    oos: 1 << 7,
};
const unitModes = {
    [0 /* UnitMode.standard */]: { label: 'STANDARD' },
    [1 /* UnitMode.assault */]: { label: 'ASSAULT' },
    [2 /* UnitMode.march */]: { label: 'MARCH' },
    [3 /* UnitMode.entrench */]: { label: 'ENTRENCH' },
};
// random bytes to use for deterministic fog of war matching
const fogTable = `
e6 63 03 60 39 b0 1a 5f 1b 2f 95 2c 37 0d 1c 09 08 a5 35 22 4f c5 fe fe c5 49 75 95 34 22 f8 37
c5 39 0c 51 48 53 d6 c2 c6 d8 1f 48 ac 2f f2 fb 91 06 34 86 a7 93 af f1 0a 3a 42 22 8b b4 e1 af
b4 21 93 60 85 f1 62 5c 11 f8 2f 7a 79 79 f0 9d cd 05 40 ae 2b d1 e2 94 bc d0 d1 88 dc 22 7d 93
61 bd cb 7f 64 79 a9 86 47 ee 6f a5 08 70 05 2f 01 2e b0 a5 8a 1e a5 00 c5 fa 0e 18 83 34 af 49
6b 2a 25 aa 30 64 d6 4c 79 03 7b d7 25 fe 88 04 f5 0f a1 af b3 18 dd f0 10 ca 69 08 07 0e a2 73
4b 27 4e ba 15 8a 5b d1 65 c1 3e 04 b2 13 2b f7 97 7e e7 e9 6f b8 5c 18 28 e5 65 d9 d7 65 26 4c
c6 5e 1f 3a 88 0a f4 54 ac 9f 04 d6 ab 83 c5 bf 38 0a 93 e4 76 46 15 0b 24 fb b4 ba e6 55 4f 45
aa ad d7 cd aa 70 ef 5c 0d 9f 12 84 ca b9 36 fa 72 26 f9 ae 6d af af cf 57 4c cc 62 6f e5 e3 b1
`.trim().split(/\s+/).map(s => parseInt(s, 16));
class Unit {
    constructor(game, id, ...args) {
        var _a, _b, _c;
        _Unit_instances.add(this);
        this.immobile = 0;
        this.canAttack = 1;
        this.resolute = 0;
        this.cadj = 0;
        _Unit_mode.set(this, void 0);
        this.orders = []; // WHORDRS, HMORDS
        this.tick = 255;
        this.ifr = 0;
        this.ifrdir = [0, 0, 0, 0];
        this.flags = 0;
        _Unit_game.set(this, void 0);
        let corpsx, corpsy, mstrng, arrive, corpt, corpno;
        switch (args.length) {
            case 7: { // apx
                let swap, corptapx;
                [corpsx, corpsy, mstrng, swap, arrive, corptapx, corpno] = args;
                // translate apx => cart format
                corpt = (swap & 0x80) | (corptapx & 0x70) | apxXref[corptapx & 0x7];
                break;
            }
            case 6: { // cart
                [corpsx, corpsy, mstrng, arrive, corpt, corpno] = args;
                break;
            }
            default:
                throw new Error("Expected 6 or 7 args for cartridge or apx unit definition respectively");
        }
        this.id = id;
        this.player = (corpt & 0x80) ? 1 /* PlayerKey.Russian */ : 0 /* PlayerKey.German */; // german=0, russian=1; equiv i >= 55
        this.unitno = corpno;
        this.type = corpt & 0x7;
        const ut = unittypes[this.type];
        if (ut == null)
            throw new Error(`Unused unit type for unit id ${id}`);
        this.kind = ut.kind;
        __classPrivateFieldSet(this, _Unit_mode, (this.kind == 2 /* UnitKindKey.air */) ? 1 /* UnitMode.assault */ : 0 /* UnitMode.standard */, "f");
        this.modifier = (corpt >> 4) & 0x7;
        this.arrive = arrive;
        this.scheduled = arrive;
        this.lon = corpsx;
        this.lat = corpsy;
        this.mstrng = mstrng;
        this.cstrng = mstrng;
        this.fog = (_a = scenarios[game.scenario].fog) !== null && _a !== void 0 ? _a : 0;
        this.immobile = (_b = ut.immobile) !== null && _b !== void 0 ? _b : 0;
        this.canAttack = (_c = modifiers[this.modifier].canAttack) !== null && _c !== void 0 ? _c : 1;
        this.resolute = this.player == 0 /* PlayerKey.German */ && !this.modifier ? 1 : 0;
        this.label = [
            this.unitno,
            modifiers[this.modifier].key,
            ut.label,
            players[this.player].unit
        ].filter(Boolean).join(' ').toUpperCase().trim();
        __classPrivateFieldSet(this, _Unit_game, game, "f");
    }
    get active() {
        return this.arrive <= __classPrivateFieldGet(this, _Unit_game, "f").turn && this.cstrng > 0;
    }
    get movable() {
        if (this.immobile)
            return 0;
        // game logic seems to be that German reinforcements can move on arrival turn but Russians can't,
        // including initially placed units because of surprise attack.
        // allow initially placed Russians to move for post 6/22 scenarios
        const start = __classPrivateFieldGet(this, _Unit_game, "f").turn == 0, green = this.arrive == __classPrivateFieldGet(this, _Unit_game, "f").turn && !start;
        if ((green && 1 /* PlayerKey.Russian */)
            || (start && this.player == scenarios[__classPrivateFieldGet(this, _Unit_game, "f").scenario].surprised)) {
            return 0;
        }
        return 1;
    }
    get human() {
        return this.player == __classPrivateFieldGet(this, _Unit_game, "f").human;
    }
    get location() {
        return __classPrivateFieldGet(this, _Unit_game, "f").mapboard.locationOf(Grid.point(this));
    }
    get path() {
        let loc = this.location;
        const path = [loc];
        this.orders.forEach(dir => {
            const dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(loc, dir);
            if (!dst)
                return;
            path.push(loc = dst);
        });
        return path;
    }
    emit(event) {
        this.flags |= unitFlag[event];
        if (event == 'move') {
            // clear attack and defend status after movement
            this.flags &= ~(unitFlag.attack | unitFlag.defend);
        }
        __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', event, this);
    }
    get mode() { return __classPrivateFieldGet(this, _Unit_mode, "f"); }
    set mode(mode) {
        if (this.kind == 2 /* UnitKindKey.air */ && ![1 /* UnitMode.assault */, 2 /* UnitMode.march */].includes(mode)) {
            __classPrivateFieldGet(this, _Unit_game, "f").emit('message', 'error', 'AIRPLANES CANNOT DO THAT');
        }
        else {
            __classPrivateFieldSet(this, _Unit_mode, mode, "f");
            this.resetOrders();
        }
    }
    nextmode() {
        this.mode = this.kind == 2 /* UnitKindKey.air */
            ? (this.mode == 1 /* UnitMode.assault */ ? 2 /* UnitMode.march */ : 1 /* UnitMode.assault */)
            : (this.mode + 1) % 4;
    }
    foggyStrength(observer) {
        let { mstrng, cstrng } = this;
        if (this.fog && this.player != observer) {
            // with fog of k bits, we apply noise with total range 2^k - 1,
            // between 2^(k-1), -2^(k-1)+1
            // we use the same offset for both cstrng and mstrng,
            // and predictable pseudo-random values that stay fixed given unit & turn
            // (and don't affect the core sequence of random values from the game's rng)
            const mask = (1 << this.fog) - 1, randbyte = fogTable[this.id & 0xff] ^ fogTable[(~__classPrivateFieldGet(this, _Unit_game, "f").turn) & 0xff], delta = (randbyte & mask) - (mask >> 1);
            //TODO use as offset not a simple random fill
            mstrng = clamp(mstrng + delta, 1, 255);
            cstrng = clamp(cstrng + delta, 1, 255);
        }
        return { mstrng, cstrng };
    }
    addOrder(dir) {
        let dst, err;
        if (this.mode == 3 /* UnitMode.entrench */) {
            err = "THAT UNIT IS ENTRENCHED";
        }
        else if (!this.movable) {
            err = this.immobile ? "MILITIA UNITS CAN'T MOVE" : "NEW ARRIVALS CAN'T MOVE";
        }
        else if (this.orders.length == 8) {
            err = "ONLY 8 ORDERS ARE ALLOWED";
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(this.path.pop(), dir);
            if (!dst) {
                err = "IMPASSABLE";
            }
            else {
                this.orders.push(dir);
            }
        }
        if (err) {
            __classPrivateFieldGet(this, _Unit_game, "f").emit('message', 'error', err);
        }
        else {
            this.emit('orders');
        }
        return dst;
    }
    delOrder() {
        if (this.orders.length) {
            this.orders.pop();
            this.emit('orders');
        }
    }
    setOrders(dirs) {
        this.orders = dirs;
        this.emit('orders');
    }
    resetOrders() {
        this.orders = [];
        this.tick = 255;
        this.emit('orders');
    }
    setOrdersSupportingFriendlyFurther(dir) {
        const mb = __classPrivateFieldGet(this, _Unit_game, "f").mapboard;
        let loc = Grid.point(this);
        this.orders.forEach(d => loc = Grid.adjacent(loc, d));
        const { dlon, dlat } = directions[dir], target = Grid.diamondSpiral(loc, 8, dir)
            .find(p => {
            if ((p.lon - loc.lon) * dlon + (p.lat - loc.lat) * dlat <= 0
                || Grid.manhattanDistance(p, this) > 8
                || !mb.valid(p)) {
                return false;
            }
            else {
                const mp = mb.locationOf(p);
                return (mp.unitid != null && mp.unitid != this.id
                    && __classPrivateFieldGet(this, _Unit_game, "f").oob.at(mp.unitid).player == this.player);
            }
        });
        if (target == null) {
            __classPrivateFieldGet(this, _Unit_game, "f").emit('message', 'error', 'NO FRIENDLY UNIT IN RANGE THAT WAY');
        }
        else {
            this.setOrders(__classPrivateFieldGet(this, _Unit_game, "f").mapboard.directPath(Grid.point(this), target).orders);
        }
    }
    moveCost(terrain, weather) {
        // cost to enter given terrain in weather
        if (this.mode == 3 /* UnitMode.entrench */) {
            return 255;
        }
        const notInfantry = this.kind == 0 /* UnitKindKey.infantry */ ? 0 : 1;
        let cost = terraintypes[terrain].movecost[notInfantry][weather] || 255;
        if (cost == 255) {
            return cost;
        }
        if (this.mode == 2 /* UnitMode.march */)
            cost = (cost >> 1) + 2;
        else if (this.mode == 1 /* UnitMode.assault */)
            cost += cost >> 1;
        return cost;
    }
    moveCosts(weather) {
        // return a table of movement costs based on armor/inf and weather
        return Object.keys(terraintypes).map(t => this.moveCost(+t, weather));
    }
    orderCost(dir) {
        if (!this.movable)
            return 255;
        const dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(Grid.point(this), dir);
        if (!dst)
            return 255;
        return this.moveCost(dst.terrain, __classPrivateFieldGet(this, _Unit_game, "f").weather);
    }
    scheduleOrder(startTurn = false) {
        if (startTurn) {
            this.tick = 0;
            if (this.mode == 2 /* UnitMode.march */ && this.orders.length && this.cstrng > 1) {
                // cstrng halved (min 1) before movement (cartridge.asm:4153)
                this.cstrng >>= 1;
            }
            if (this.kind == 2 /* UnitKindKey.air */ && this.mode == 1 /* UnitMode.assault */ && this.orders.length) {
                // add air strength to target cadj (cartridge.asm:4180)
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const dst = this.path.pop();
                if (dst.unitid != null && dst.gid != this.location.gid) {
                    const u = __classPrivateFieldGet(this, _Unit_game, "f").oob.at(dst.unitid);
                    if (u.player == this.player) {
                        const halfDistance = Math.max(1, this.orders.length >> 1);
                        u.cadj += Math.floor(this.cstrng / halfDistance);
                    }
                }
                this.resetOrders(); // clear orders: air mission flown
            }
        }
        this.tick = this.orders.length
            ? this.tick + this.orderCost(this.orders[0])
            : 255;
    }
    pathTo(goal) {
        const m = __classPrivateFieldGet(this, _Unit_game, "f").mapboard, costs = this.moveCosts(__classPrivateFieldGet(this, _Unit_game, "f").weather), p = Grid.point(goal);
        return m.bestPath(Grid.point(this), p, costs)
            ;
    }
    reach(range = 32) {
        // return a list of grid points within range of this unit
        if (this.mode == 3 /* UnitMode.entrench */) {
            return [Grid.point(this)];
        }
        else if (this.kind == 2 /* UnitKindKey.air */ && this.mode == 1 /* UnitMode.assault */) {
            return Grid.diamondSpiral(this, range / 4)
                .filter(p => __classPrivateFieldGet(this, _Unit_game, "f").mapboard.valid(p));
        }
        else {
            const costs = this.moveCosts(__classPrivateFieldGet(this, _Unit_game, "f").weather);
            return Object.keys(__classPrivateFieldGet(this, _Unit_game, "f").mapboard.reach(Grid.point(this), range, costs))
                .map(id => Grid.byid(+id));
        }
    }
    moveTo(dst, notify = true) {
        let action = 'move';
        if (this.location.unitid) {
            if (this.location.unitid != this.id) {
                throw (`moveTo from square occupied by both:\n${this.describe()}\nand:\n${__classPrivateFieldGet(this, _Unit_game, "f").oob.at(this.location.unitid).describe()}`);
            }
            this.location.unitid = undefined; // leave the current location
        }
        else {
            action = 'enter';
        }
        if (dst != null) {
            if (dst.unitid != null)
                throw new Error(`moveTo into occupied square:\n${__classPrivateFieldGet(this, _Unit_game, "f").mapboard.describe(dst)}\nby:\n${this.describe()}\nfrom lon: ${this.lon}, lat: ${this.lat}`);
            // occupy the new one and repaint
            this.lon = dst.lon;
            this.lat = dst.lat;
            dst.unitid = this.id;
            __classPrivateFieldGet(this, _Unit_game, "f").mapboard.occupy(dst, this.player);
        }
        else {
            action = 'exit';
        }
        if (notify)
            this.emit(action);
    }
    tryOrder() {
        // if we decided to try before this unit retreated (say), skip
        if (this.tick == 255 || this.orders.length == 0)
            return;
        const src = this.location, dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(src, this.orders[0]); // assumes already validated
        if (dst == null)
            throw new Error("Unit.tryOrder: invalid order");
        if (dst.unitid != null) {
            const opp = __classPrivateFieldGet(this, _Unit_game, "f").oob.at(dst.unitid);
            if (opp.player != this.player) {
                if (!__classPrivateFieldGet(this, _Unit_instances, "m", _Unit_resolveCombat).call(this, opp)) {
                    this.tick++;
                    return;
                }
                // otherwise fall through to advance after combat, ignoring ZoC
            }
            else {
                // traffic jam
                this.tick += 2;
                return;
            }
        }
        else if (__classPrivateFieldGet(this, _Unit_game, "f").oob.zocBlocked(this.player, src, dst)) {
            // moving between enemy ZOC M.ASM:5740
            this.tick += 2;
            return;
        }
        this.orders.shift();
        this.moveTo(dst);
        this.scheduleOrder();
    }
    recover() {
        // units recover a little each tick
        if (this.type == 1 /* UnitTypeKey.militia */ && this.lon == 20 && this.lat == 0) {
            // Sevastopol militia fully recovers each turn
            this.cstrng = this.mstrng;
        }
        else if (this.mstrng - this.cstrng >= 2) {
            // M.ASM:5070 recover one plus coin-flip combat strength
            this.cstrng += 1 + __classPrivateFieldGet(this, _Unit_game, "f").rand.bit();
        }
    }
    eliminate(disperse) {
        if (disperse) {
            // eliminated units disperse nearby (cartridge.asm:2509)
            __classPrivateFieldGet(this, _Unit_game, "f").mapboard
                .neighborsOf(this.location)
                .forEach(loc => {
                if ((loc === null || loc === void 0 ? void 0 : loc.unitid) == null)
                    return;
                const u = __classPrivateFieldGet(this, _Unit_game, "f").oob.at(loc.unitid);
                if (u.player == this.player) {
                    u.mstrng = Math.min(255, u.mstrng + (this.mstrng >> 2));
                }
            });
        }
        this.mstrng = 0;
        this.cstrng = 0;
        this.arrive = 255;
        this.flags = 0;
        this.resetOrders();
    }
    nextTurn(startOrResume) {
        var _a;
        // called for active (or potentially active) units
        const scenario = scenarios[__classPrivateFieldGet(this, _Unit_game, "f").scenario];
        if (startOrResume) {
            // place units on map but don't emit events
            this.moveTo(this.location, false);
            if (__classPrivateFieldGet(this, _Unit_game, "f").turn == 0 && scenario.fog) {
                this.fog = scenario.fog;
                {
                    // a unit completely surrounded sees zoc = 12, unit with seven units on a corner sees 7
                    this.fog >>= __classPrivateFieldGet(this, _Unit_game, "f").oob.zocAffecting(this.player, this.location, true) / 2;
                }
            }
        }
        else {
            // M.ASM:3720 delay reinforcements scheduled for an occuplied square
            if (this.arrive == __classPrivateFieldGet(this, _Unit_game, "f").turn) {
                if (this.location.unitid != null) {
                    this.arrive++;
                    return; // early return
                }
                this.moveTo(this.location); // place unit on the map
            }
            // supply check includes any new arrivals
            const inSupply = scenario.skipsupply || this.traceSupply();
            if (scenario.repl && inSupply) {
                // possibly receive replacements
                this.mstrng = Math.min(255, this.mstrng + scenario.repl[this.player]);
            }
            if (!this.active)
                return; // quit if eliminated OoS
            if (scenario.fog) {
                const change = __classPrivateFieldGet(this, _Unit_game, "f").oob.zocAffects(this.player, this.location, true) ? -1 : 1;
                this.fog = clamp(this.fog + change, 0, scenario.fog);
            }
        }
        this.flags = 0;
        this.cadj = this.player == 0 /* PlayerKey.German */ ? ((_a = scenarios[__classPrivateFieldGet(this, _Unit_game, "f").scenario].cadj) !== null && _a !== void 0 ? _a : 0) : 0;
    }
    traceSupply() {
        // implement the supply check from C.ASM:3430
        // loses half cstr (rounding up) if OoS, returning 1 if supplied, 0 if not
        const player = players[this.player], supply = player.supply, mb = __classPrivateFieldGet(this, _Unit_game, "f").mapboard;
        let fail = 0, loc = this.location, dir = player.homedir;
        if (supply.freeze && __classPrivateFieldGet(this, _Unit_game, "f").weather == 2 /* WeatherKey.snow */) {
            // C.ASM:3620
            if (__classPrivateFieldGet(this, _Unit_game, "f").rand.byte() >= 74 + 4 * (mb.boundaryDistance(loc, dir) + (dir == 1 /* DirectionKey.east */ ? 1 : 0))) {
                fail = 255;
            }
        }
        while (fail < supply.maxfail[__classPrivateFieldGet(this, _Unit_game, "f").weather]) {
            if (dir == player.homedir && mb.boundaryDistance(loc, player.homedir) == 0) {
                // hit an impassable boundary on our home boundary?
                return 1;
            }
            let dst = mb.neighborOf(loc, dir);
            if (dst == null && supply.sea) {
                const adj = Grid.adjacent(loc, dir);
                if (mb.valid(adj)) {
                    const sea = mb.locationOf(adj);
                    if (sea.terrain == 9 /* TerrainKey.impassable */ && sea.alt == 0)
                        dst = sea;
                }
            }
            let cost = 0;
            if (dst == null) {
                cost = 1;
            }
            else if (__classPrivateFieldGet(this, _Unit_game, "f").oob.zocAffects(this.player, dst)) {
                cost = 2;
            }
            else {
                loc = dst;
            }
            if (cost) {
                fail += cost;
                // either flip a coin or try the opposite direction (potentially repeatedly until failure)
                if (dir != player.homedir)
                    dir = (dir + 2) % 4;
                else
                    dir = __classPrivateFieldGet(this, _Unit_game, "f").rand.bit() ? 0 /* DirectionKey.north */ : 2 /* DirectionKey.south */;
            }
            else {
                dir = player.homedir;
            }
        }
        __classPrivateFieldGet(this, _Unit_instances, "m", _Unit_takeDamage).call(this, 0, Math.ceil(this.cstrng / 2));
        this.emit('oos');
        return 0;
    }
    locScore() {
        const dist = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.boundaryDistance(this, players[this.player].homedir);
        let v = 0;
        // see M.ASM:4050 - note even inactive units are scored based on future arrival/strength
        if (this.player == 0 /* PlayerKey.German */) {
            // maxlon + 2 == #$30 per M.ASM:4110
            v = (dist + 3) * (this.mstrng >> 1);
        }
        else {
            v = dist * (this.cstrng >> 3);
        }
        return v >> 8;
    }
    describe(debug = false) {
        const { cstrng, mstrng } = this.foggyStrength(__classPrivateFieldGet(this, _Unit_game, "f").human);
        let s = `[${this.id}] ${cstrng} / ${mstrng}`;
        if (debug && scenarios[__classPrivateFieldGet(this, _Unit_game, "f").scenario].fog && this.player != __classPrivateFieldGet(this, _Unit_game, "f").human) {
            s += ` (actual ${this.cstrng} / ${this.mstrng}; fog ${this.fog})`;
        }
        s += `\n${this.label}\n`;
        if (debug && this.ifr !== undefined && this.ifrdir !== undefined) {
            if (this.orders.length) {
                s += 'orders: ' + this.orders.map(d => directions[d].label).join('') + '\n';
            }
            s += `ifr: ${this.ifr}; `;
            s += Object.entries(directions)
                .map(([i, d]) => `${d.label}: ${this.ifrdir[+i]}`).join(' ') + '\n';
        }
        return s;
    }
}
_Unit_mode = new WeakMap(), _Unit_game = new WeakMap(), _Unit_instances = new WeakSet(), _Unit_resolveCombat = function _Unit_resolveCombat(opp) {
    var _a;
    // returns 1 if target square becomes vacant
    if (!this.canAttack)
        return 0;
    // Air suffers 75% loss and resetOrders if attack or defend, plus normal combat (cartridge.asm:1968)
    [this, opp].forEach(u => {
        if (u.kind == 2 /* UnitKindKey.air */) {
            u.cstrng >>= 2;
            u.resetOrders();
        }
    });
    const scenario = scenarios[__classPrivateFieldGet(this, _Unit_game, "f").scenario];
    this.emit('attack');
    opp.emit('defend');
    let modifier = terraintypes[opp.location.terrain].defence;
    // expert scenario defense bonus
    modifier += (_a = scenario.defmod) !== null && _a !== void 0 ? _a : 0;
    if (opp.orders.length)
        modifier--; // movement penalty
    if (opp.mode == 3 /* UnitMode.entrench */)
        modifier++; // entrench bonus
    // opponent attacks
    let strength = multiplier(opp.cstrng, modifier) + opp.cadj;
    if (strength >= __classPrivateFieldGet(this, _Unit_game, "f").rand.byte()) {
        // attacker in assault mode takes triple damage
        const mult = this.mode == 1 /* UnitMode.assault */ ? 3 : 1;
        __classPrivateFieldGet(this, _Unit_instances, "m", _Unit_takeDamage).call(this, mult * scenario.mdmg, mult * scenario.cdmg, true);
        // cartridge prevents attack if attacker breaks
        if (!this.orders && options.defenderFirstStrike)
            return 0;
    }
    // modifier based on attacker's square (cartridge.asm:2035)
    modifier = terraintypes[this.location.terrain].offence;
    strength = multiplier(this.cstrng, modifier) + this.cadj;
    if (strength >= __classPrivateFieldGet(this, _Unit_game, "f").rand.byte()) {
        // defender takes double damange
        const mult = this.mode == 1 /* UnitMode.assault */ ? 2 : 1;
        return __classPrivateFieldGet(opp, _Unit_instances, "m", _Unit_takeDamage).call(opp, mult * scenario.mdmg, mult * scenario.cdmg, true, this.orders[0]);
    }
    else {
        return 0;
    }
}, _Unit_takeDamage = function _Unit_takeDamage(mdmg, cdmg, checkBreak = false, retreatDir) {
    // return 1 if this square is vacated, 0 otherwise
    const scenario = scenarios[__classPrivateFieldGet(this, _Unit_game, "f").scenario];
    // apply mdmg/cdmg to unit
    this.mstrng -= mdmg;
    this.cstrng -= cdmg;
    // dead?
    if (this.cstrng <= 0) {
        this.eliminate(options.disperseEliminatedUnits);
        this.moveTo(null);
        return 1;
    }
    this.emit('damage');
    if (!checkBreak)
        return 0;
    let brkpt; // calculate the strength value to check for unit breaking point
    if (scenario.simplebreak) {
        // simplified break check at 25% strength
        brkpt = this.mstrng >> 2;
    }
    else {
        if (this.resolute) {
            // german regulars break if cstrng < 1/2 mstrng
            brkpt = this.mstrng >> 1;
        }
        else {
            // russian (& ger allies) break if cstrng < 7/8 mstrng
            brkpt = this.mstrng - (this.mstrng >> 3);
        }
        brkpt = this.mstrng - (this.mstrng >> (this.resolute ? 1 : 3));
        switch (this.mode) {
            case 2 /* UnitMode.march */:
                brkpt <<= 1;
                break;
            case 1 /* UnitMode.assault */:
            case 3 /* UnitMode.entrench */:
                brkpt >>= 1;
                break;
        }
    }
    if (this.cstrng < brkpt) {
        this.mode = this.kind == 2 /* UnitKindKey.air */ ? 2 /* UnitMode.march */ : 0 /* UnitMode.standard */;
        this.resetOrders();
        if (retreatDir != null) {
            const homedir = players[this.player].homedir, nxtdir = __classPrivateFieldGet(this, _Unit_game, "f").rand.bit() ? 0 /* DirectionKey.north */ : 2 /* DirectionKey.south */, dirs = [retreatDir, homedir, nxtdir, (nxtdir + 2) % 4, (homedir + 2) % 4];
            for (const dir of dirs) {
                const src = this.location, dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(src, dir);
                if (!dst || dst.unitid != null || __classPrivateFieldGet(this, _Unit_game, "f").oob.zocBlocked(this.player, src, dst)) {
                    // ZoC block deals only CSTR dmg (cartridge:2159)
                    if (__classPrivateFieldGet(this, _Unit_instances, "m", _Unit_takeDamage).call(this, 0, scenario.cdmg))
                        return 1; // dead
                }
                else {
                    this.moveTo(dst);
                    return 1;
                }
            }
        }
    }
    // otherwise square still occupied (no break or all retreats blocked but defender remains)
    return 0;
};
function multiplier(strength, modifier) {
    if (modifier > 0) {
        strength <<= modifier;
    }
    else {
        strength >>= (-modifier);
    }
    return clamp(strength, 1, 255);
}

var _Oob_game, _Oob_units;
class Oob {
    constructor(game, memento) {
        _Oob_game.set(this, void 0);
        _Oob_units.set(this, void 0);
        this.startmstrng = [0, 0]; // sum all mstrng for scoring
        const scenario = scenarios[game.scenario], maxunit = scenario.nunit;
        __classPrivateFieldSet(this, _Oob_units, oobVariants[scenario.oob]
            .map((vs, i) => {
            const u = new Unit(game, i, ...vs);
            // exclude units not in the scenario, but leave them in array
            if (u.id >= maxunit[u.player])
                u.eliminate();
            this.startmstrng[u.player] += u.mstrng;
            return u;
        }), "f");
        __classPrivateFieldSet(this, _Oob_game, game, "f");
        if (memento) {
            const scheduled = this.filter(u => u.scheduled <= game.turn);
            if (memento.length < scheduled.length)
                throw new Error('Oob: malformed save data for scheduled unit status');
            scheduled.forEach(u => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const status = memento.shift();
                if (status == 1) { // eliminated
                    u.eliminate();
                }
                else if (status == 2) { // delayed
                    u.arrive = game.turn + 1;
                }
            });
            const active = this.activeUnits(), human = active.filter(u => u.human), expected = (scenario.fog ? 5 : 4) * active.length + human.length * (scenario.mvmode ? 2 : 1);
            if (memento.length < expected)
                throw new Error('oob: malformed save data for active unit properties');
            const dlats = zagzig(memento.splice(0, active.length)), dlons = zagzig(memento.splice(0, active.length)), dmstrs = zagzig(memento.splice(0, active.length)), cdmgs = memento.splice(0, active.length), dfogs = scenario.fog ? memento.splice(0, active.length) : [], modes = scenario.mvmode ? memento.splice(0, human.length) : [], nords = memento.splice(0, human.length);
            let lat = 0, lon = 0, mstr = 255;
            active.forEach(u => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                lat += dlats.shift();
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                lon += dlons.shift();
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                mstr += dmstrs.shift();
                [u.lat, u.lon, u.mstrng] = [lat, lon, mstr];
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                u.cstrng = u.mstrng - cdmgs.shift();
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                if (scenario.fog)
                    u.fog -= dfogs.shift();
            });
            if (memento.length < sum(nords))
                throw new Error('oob: malformed save data for unit orders');
            human.forEach(u => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                if (scenario.mvmode)
                    u.mode = modes.shift();
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                u.orders = memento.splice(0, nords.shift());
            });
        }
    }
    at(index) {
        const u = __classPrivateFieldGet(this, _Oob_units, "f").at(index);
        if (!u)
            throw new Error(`Oob.at(${index}): Invalid unit index`);
        return u;
    }
    every(f) { return __classPrivateFieldGet(this, _Oob_units, "f").every(f); }
    some(f) { return __classPrivateFieldGet(this, _Oob_units, "f").some(f); }
    filter(f) { return __classPrivateFieldGet(this, _Oob_units, "f").filter(f); }
    find(f) { return __classPrivateFieldGet(this, _Oob_units, "f").find(f); }
    findIndex(f) { return __classPrivateFieldGet(this, _Oob_units, "f").findIndex(f); }
    forEach(f) { __classPrivateFieldGet(this, _Oob_units, "f").forEach(f); }
    map(f) { return __classPrivateFieldGet(this, _Oob_units, "f").map(f); }
    slice(start, end) { return __classPrivateFieldGet(this, _Oob_units, "f").slice(start, end); }
    get memento() {
        const scenario = scenarios[__classPrivateFieldGet(this, _Oob_game, "f").scenario], dlats = [], dlons = [], dmstrs = [], cdmgs = [], modes = [], dfogs = [], nords = [], ords = [];
        let lat = 0, lon = 0, mstr = 255;
        // for scheduled units, status = 0 (active), 1 (dead), 2 (delayed)
        const scheduled = this.filter(u => u.scheduled <= __classPrivateFieldGet(this, _Oob_game, "f").turn), status = scheduled.map(u => u.active ? 0 : (u.cstrng == 0 ? 1 : 2)), active = scheduled.filter(u => u.active);
        active.forEach(u => {
            dlats.push(u.lat - lat);
            dlons.push(u.lon - lon);
            dmstrs.push(u.mstrng - mstr);
            [lat, lon, mstr] = [u.lat, u.lon, u.mstrng];
            if (scenario.fog)
                dfogs.push(scenario.fog - u.fog);
            cdmgs.push(u.mstrng - u.cstrng);
            if (u.human) {
                nords.push(u.orders.length);
                ords.push(...u.orders);
                if (scenario.mvmode)
                    modes.push(u.mode);
            }
        });
        return status.concat(zigzag(dlats), zigzag(dlons), zigzag(dmstrs), cdmgs, dfogs, modes, nords, ords);
    }
    scoreStrengths(player) {
        var _a;
        const scenario = __classPrivateFieldGet(this, _Oob_game, "f").scenario, scoring = scenarios[scenario].scoring, current = Object.keys(players).map(p => sum(__classPrivateFieldGet(this, _Oob_units, "f").filter(u => (u.player == +p)).map(u => u.cstrng)) >> 7), losses = Object.keys(players).map(p => (this.startmstrng[+p] >> 7) - current[+p]);
        let score = 0;
        ((_a = scoring.strength) !== null && _a !== void 0 ? _a : []).forEach((mode, p) => {
            if (mode)
                score += ((p == player) ? 1 : -1) * (mode == 'current' ? current[p] : -losses[p]);
        });
        return (player == 0 /* PlayerKey.German */ ? 1 : -1) * score;
    }
    nextTurn(startOrResume) {
        this.activeUnits().forEach(u => u.nextTurn(startOrResume));
    }
    activeUnits(player) {
        return this.filter((u) => u.active && (player == null || u.player == player));
    }
    centerOfGravity(player) {
        const units = this.activeUnits(player), { lat, lon } = units.reduce(({ lat, lon }, u) => ({ lat: lat + u.lat, lon: lon + u.lon }), { lat: 0, lon: 0 });
        // note this usually returns fractional lat/lon which is ok for scroll management
        return { lat: lat / units.length, lon: lon / units.length };
    }
    scheduleOrders() {
        // M.asm:4950 movement execution
        this.activeUnits().forEach(u => u.scheduleOrder(true));
    }
    executeOrders(tick) {
        // original code processes movement in reverse-oob order
        //TODO config to randomize order, or allow a delay/no-op order type to manage traffic?
        this.activeUnits().forEach(u => u.recover());
        this.activeUnits()
            .filter(u => u.tick == tick)
            .reverse()
            .forEach(u => u.tryOrder());
    }
    zocAffects(player, loc, omitSelf = false) {
        return this.zocAffecting(player, loc, omitSelf, 2) >= 2;
    }
    zocAffecting(player, loc, omitSelf = false, threshold) {
        // evaluate zoc experienced by player (eg. exerted by !player) in the square at loc
        let zoc = 0;
        // same player in target square negates any zoc, enemy exerts 4
        if (loc.unitid != null) {
            if (this.at(loc.unitid).player == player) {
                if (!omitSelf)
                    return 0;
            }
            else {
                zoc += 4;
                if (threshold && zoc >= threshold)
                    return zoc;
            }
        }
        if (scenarios[__classPrivateFieldGet(this, _Oob_game, "f").scenario].nozoc)
            return zoc;
        // look at square spiral excluding center, so even squares are adj, odd are corners
        Grid.squareSpiral(loc, 1).slice(1).forEach((p, i) => {
            if (!__classPrivateFieldGet(this, _Oob_game, "f").mapboard.valid(p))
                return;
            const pt = __classPrivateFieldGet(this, _Oob_game, "f").mapboard.locationOf(p);
            // center-adjacent (even) exert 2, corners (odd) exert 1
            if (pt.unitid != null && this.at(pt.unitid).player != player) {
                zoc += (i % 2) ? 1 : 2;
                if (threshold && zoc >= threshold)
                    return zoc;
            }
        });
        return zoc;
    }
    zocBlocked(player, src, dst) {
        // does enemy ZoC block player move from src to dst?
        return this.zocAffects(player, src, true) && this.zocAffects(player, dst);
    }
}
_Oob_game = new WeakMap(), _Oob_units = new WeakMap();

var _Thinker_instances, _Thinker_game, _Thinker_player, _Thinker_trainOfThought, _Thinker_depth, _Thinker_delay, _Thinker_recur, _Thinker_findBeleaguered, _Thinker_evalLocation;
class Thinker {
    constructor(game, player) {
        _Thinker_instances.add(this);
        _Thinker_game.set(this, void 0);
        _Thinker_player.set(this, void 0);
        _Thinker_trainOfThought.set(this, 0);
        _Thinker_depth.set(this, 0);
        _Thinker_delay.set(this, 0);
        this.finalized = true;
        __classPrivateFieldSet(this, _Thinker_game, game, "f");
        __classPrivateFieldSet(this, _Thinker_player, player, "f");
    }
    thinkRecurring(delay) {
        __classPrivateFieldSet(this, _Thinker_delay, (delay == null) ? 250 : delay, "f");
        this.finalized = false;
        __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_recur).call(this, __classPrivateFieldGet(this, _Thinker_trainOfThought, "f"));
    }
    finalize() {
        var _a;
        console.debug("Finalizing...");
        __classPrivateFieldSet(this, _Thinker_trainOfThought, (_a = __classPrivateFieldGet(this, _Thinker_trainOfThought, "f"), _a++, _a), "f");
        __classPrivateFieldSet(this, _Thinker_depth, 0, "f");
        this.finalized = true;
        __classPrivateFieldGet(this, _Thinker_game, "f").oob.activeUnits(__classPrivateFieldGet(this, _Thinker_player, "f")).forEach(u => u.setOrders(u.orders.slice(0, 8)));
    }
    think() {
        const firstpass = __classPrivateFieldGet(this, _Thinker_depth, "f") == 0, pinfo = players[__classPrivateFieldGet(this, _Thinker_player, "f")], friends = __classPrivateFieldGet(this, _Thinker_game, "f").oob.activeUnits(__classPrivateFieldGet(this, _Thinker_player, "f")), foes = __classPrivateFieldGet(this, _Thinker_game, "f").oob.activeUnits(1 - __classPrivateFieldGet(this, _Thinker_player, "f"));
        // set up the ghost army
        let ofr = 0; // only used in first pass
        if (firstpass) {
            ofr = calcForceRatios(__classPrivateFieldGet(this, _Thinker_game, "f").oob, __classPrivateFieldGet(this, _Thinker_player, "f")).ofr;
            friends.forEach(u => { u.objective = { lon: u.lon, lat: u.lat }; });
        }
        friends.filter(u => u.movable).forEach(u => {
            var _a;
            //TODO these first two checks don't seem to depend on ghost army so are fixed on first pass?
            if (firstpass && u.ifr == (ofr >> 1)) {
                // head to reinforce if no local threat since (Local + OFR) / 2 = OFR / 2
                //TODO this tends to send most units to same beleagured square
                const v = __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_findBeleaguered).call(this, u, friends);
                if (v)
                    u.objective = { lon: v.lon, lat: v.lat };
            }
            else if (firstpass && (u.cstrng <= (u.mstrng >> 1) || u.ifrdir[pinfo.homedir] >= 16)) {
                // run home if hurting or outnumbered in the rear
                // for Russian the whole eastern edge is valid, but generalize to support German AI or variant maps
                const bbox = __classPrivateFieldGet(this, _Thinker_game, "f").mapboard.bbox, lon = bbox[pinfo.homedir], south = bbox[2 /* DirectionKey.south */], north = bbox[0 /* DirectionKey.north */], lat = (_a = [...Array(north - south + 1).keys()]
                    .map(k => k + south)
                    .sort((a, b) => (Math.abs(a - u.lat) - Math.abs(b - u.lat)) || a - b)
                    .find(lat => __classPrivateFieldGet(this, _Thinker_game, "f").mapboard.locationOf(Grid.lonlat(lon, lat)).terrain != 9 /* TerrainKey.impassable */)) !== null && _a !== void 0 ? _a : u.lat;
                u.objective = { lon, lat };
            }
            else {
                // find nearest best square
                const start = __classPrivateFieldGet(this, _Thinker_game, "f").mapboard.locationOf(Grid.point(u.objective));
                let bestval = __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_evalLocation).call(this, u, start, friends, foes);
                __classPrivateFieldGet(this, _Thinker_game, "f").mapboard.neighborsOf(start).forEach(loc => {
                    if (!loc)
                        return;
                    const sqval = __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_evalLocation).call(this, u, loc, friends, foes);
                    if (sqval > bestval) {
                        bestval = sqval;
                        u.objective = { lon: loc.lon, lat: loc.lat };
                    }
                });
            }
            if (!u.objective)
                return;
            const result = u.pathTo(u.objective);
            if (!result)
                return;
            u.setOrders(result.orders); // We'll prune to 8 later
        });
        return friends.filter(u => u.objective);
    }
}
_Thinker_game = new WeakMap(), _Thinker_player = new WeakMap(), _Thinker_trainOfThought = new WeakMap(), _Thinker_depth = new WeakMap(), _Thinker_delay = new WeakMap(), _Thinker_instances = new WeakSet(), _Thinker_recur = function _Thinker_recur(train) {
    var _a;
    if (train != __classPrivateFieldGet(this, _Thinker_trainOfThought, "f")) {
        // skip pre-scheduled old train of thought
        console.debug(`Skipped passing thought, train ${train}`);
        return;
    }
    const t0 = performance.now();
    this.think();
    const dt = performance.now() - t0;
    __classPrivateFieldSet(this, _Thinker_delay, __classPrivateFieldGet(this, _Thinker_delay, "f") * 1.1, "f"); // gradually back off thinking rate
    console.debug(`Think.#recur ${train}-${__classPrivateFieldGet(this, _Thinker_depth, "f")} took ${Math.round(dt)}ms; waiting ${Math.round(__classPrivateFieldGet(this, _Thinker_delay, "f"))}ms`);
    __classPrivateFieldSet(this, _Thinker_depth, (_a = __classPrivateFieldGet(this, _Thinker_depth, "f"), _a++, _a), "f");
    setTimeout(() => __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_recur).call(this, train), __classPrivateFieldGet(this, _Thinker_delay, "f"));
}, _Thinker_findBeleaguered = function _Thinker_findBeleaguered(u, friends) {
    let best = null, score = 0;
    friends.filter(v => v.ifr > u.ifr).forEach(v => {
        const d = Grid.manhattanDistance(u, v);
        if (d <= 8)
            return; // APX code does weird bit 3 check
        const s = v.ifr - (d >> 3);
        if (s > score) {
            score = s;
            best = v;
        }
    });
    return best;
}, _Thinker_evalLocation = function _Thinker_evalLocation(u, loc, friends, foes) {
    const ghosts = {}, range = Grid.manhattanDistance(u, loc);
    // too far, early exit
    if (range >= 8)
        return 0;
    const nbval = Math.min(...foes.map(v => Grid.manhattanDistance(loc, v)));
    // on the defensive and square is occupied by an enemy
    if (u.ifr >= 16 && nbval == 0)
        return 0;
    friends.filter(v => v.id != u.id)
        .forEach(v => { ghosts[Grid.point(v.objective).gid] = v.id; });
    const isOccupied = (pt) => !!ghosts[pt.gid];
    let dibs = false;
    if (isOccupied(loc))
        dibs = true; // someone else have dibs already?
    else
        ghosts[loc.gid] = u.id;
    const square = Grid.squareSpiral(loc, 2), linepts = Object.keys(directions).map(d => linePoints(sortSquareFacing(loc, 5, +d, square), 5, isOccupied)), tadj = terraintypes[loc.terrain].defence + 2; // our 0 adj is equiv to his 2
    let sqval = sum(linepts.map((scr, i) => scr * u.ifrdir[i])) >> 8;
    sqval += u.ifr >= 16 ? u.ifr * (nbval + tadj) : 2 * (15 - u.ifr) * (9 - nbval + tadj);
    if (dibs)
        sqval -= 32;
    sqval -= 1 << range;
    return sqval < 0 ? 0 : sqval;
};
function calcForceRatios(oob, player) {
    const active = oob.activeUnits(), friend = sum(active.filter(u => u.player == player).map(u => u.cstrng)), foe = sum(active.filter(u => u.player != player).map(u => u.cstrng)), ofr = Math.floor((foe << 4) / friend), ofropp = Math.floor((friend << 4) / foe);
    active.forEach(u => {
        const nearby = active.filter(v => Grid.manhattanDistance(u, v) <= 8), p = Grid.point(u);
        let friend = 0;
        u.ifrdir = [0, 0, 0, 0];
        nearby.forEach(v => {
            const inc = v.cstrng >> 4;
            if (v.player == u.player)
                friend += inc;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            else
                u.ifrdir[Grid.directionFrom(p, Grid.point(v))] += inc; // enemy can't be in same square
        });
        // individual and overall ifr max 255
        const ifr = Math.floor((sum(u.ifrdir) << 4) / friend);
        // we actually work with average of IFR + OFR
        u.ifr = (ifr + (u.player == player ? ofr : ofropp)) >> 1;
    });
    return { ofr, friend, foe };
}
function sortSquareFacing(center, diameter, dir, locs) {
    if (diameter % 2 != 1)
        throw (`sortSquareFacing: diameter should be odd, got ${diameter}`);
    if (!locs || locs.length != diameter * diameter)
        throw (`sortSquareFacing: diameter : size mismatch ${locs.length} != ${diameter}^2`);
    const r = (diameter - 1) / 2, minor = directions[(dir + 1) % 4], major = directions[(dir + 2) % 4], out = new Array(locs.length);
    locs.forEach(loc => {
        const dlat = loc.lat - center.lat, dlon = loc.lon - center.lon, idx = (r + dlat * major.dlat + dlon * major.dlon
            + diameter * (r + dlat * minor.dlat + dlon * minor.dlon));
        out[idx] = loc;
    });
    return out;
}
function linePoints(locs, diameter, occupied) {
    // curious that this doesn't consider terrain, e.g. a line ending at the coast will get penalized heavily?
    const r = (diameter - 1) / 2, frontline = Array(diameter).fill(diameter), counts = Array(diameter).fill(0);
    let row = -1, col = -1, score = 0;
    locs.forEach(loc => {
        row = (row + 1) % diameter;
        if (row == 0)
            col++;
        if (occupied(loc)) {
            counts[col] += 1;
            if (frontline[col] == diameter)
                frontline[col] = row;
        }
    });
    frontline.forEach((row, col) => {
        if (row < diameter)
            score += 40;
        if (row < diameter - 1 && occupied(locs[row + 1 + diameter * col]))
            score -= 32;
    });
    if (frontline[r] == r && counts[r] == 1)
        score += 48;
    // also curious that we look at all pairs not just adjacent ones?
    for (let i = 1; i < diameter; i++)
        for (let j = 0; j < i; j++) {
            const delta = Math.abs(frontline[i] - frontline[j]);
            if (delta)
                score -= 1 << delta;
        }
    return score;
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const tokenPrefix = 'EF41', tokenVersion = 1, rlSigil = 6; // highest 5-bit coded value, so values 0..3 (& 4,5) are unchanged by rlencode
class Game extends EventEmitter {
    constructor(tokenOrScenario, seed) {
        super(); // init EventEmitter
        this.scenario = 1 /* ScenarioKey.learner */;
        this.human = 0 /* PlayerKey.German */;
        this.turn = 0; // 0-based turn index
        // flags
        this.handicap = 0; // whether the game is handicapped
        let memento;
        if (typeof tokenOrScenario === 'number') {
            this.scenario = tokenOrScenario;
        }
        else if (typeof tokenOrScenario === 'string') {
            const payload = unwrap64(tokenOrScenario, tokenPrefix);
            seed = bitsdecode(payload, 24);
            memento = rldecode(fibdecode(payload), rlSigil);
            if (memento.length < 7)
                throw new Error('Game: malformed save data');
            const version = memento.shift();
            if (version != tokenVersion)
                throw new Error(`Game: unrecognized save version ${version}`);
            this.scenario = memento.shift();
            this.human = memento.shift();
            this.turn = memento.shift();
            this.handicap = memento.shift();
        }
        // create the oob and maboard, using memento if there was one
        this.mapboard = new Mapboard(this, memento);
        this.oob = new Oob(this, memento);
        this.rand = lfsr24(seed);
        if (memento && memento.length != 0) {
            throw new Error("Game: unexpected save data overflow");
        }
        this.nextTurn(true);
    }
    get memento() {
        // return a list of uint representing the state of the game
        return [
            tokenVersion,
            this.scenario,
            this.human,
            this.turn,
            +this.handicap,
        ].concat(this.mapboard.memento, this.oob.memento);
    }
    get token() {
        const payload = [].concat(bitsencode(this.rand.state(), 24), fibencode(rlencode(this.memento, rlSigil)));
        return wrap64(payload, tokenPrefix);
    }
    get over() {
        const scenario = scenarios[this.scenario];
        return (this.turn >= scenario.endturn
            || this.score(0 /* PlayerKey.German */) >= scenario.scoring.win
            // special end condition for learner mode
            || (this.scenario == 1 /* ScenarioKey.learner */ && this.mapboard.cities[0].owner == 0 /* PlayerKey.German */));
    }
    resolveTurn(delay) {
        // external entry for nextTurn to process orders for this turn
        // and advance to next
        // if delay is provided we tick asynchrnously,
        // otherwise we resolve synchronously
        let tick = 0;
        this.oob.scheduleOrders();
        // Set up for a sync or async loop
        const tickTock = () => {
            this.oob.executeOrders(tick);
            this.emit('game', 'tick');
            const next = tick++ < 32 ? tickTock : () => this.nextTurn();
            if (!delay)
                next();
            else
                setTimeout(next, delay);
        };
        tickTock();
    }
    nextTurn(startOrResume = false) {
        const dt = new Date(scenarios[this.scenario].start), ongoing = !this.over;
        if (!startOrResume && ongoing)
            this.turn++;
        this.date = new Date(dt.setDate(dt.getDate() + 7 * this.turn));
        this.month = this.date.getMonth(); // note JS getMonth is 0-indexed
        this.weather = monthdata[this.month].weather;
        if (startOrResume || ongoing) {
            this.mapboard.nextTurn(startOrResume);
            this.oob.nextTurn(startOrResume);
        }
        this.emit('game', ongoing ? 'turn' : 'over');
    }
    score(player) {
        var _a;
        // M.asm:4050
        const scoring = scenarios[this.scenario].scoring;
        const eastwest = sum(this.oob.map(u => u.locScore() * (u.player == player ? 1 : -1))), strng = this.oob.scoreStrengths(player), cities = sum(this.mapboard.cities.filter(c => c.owner == player).map(c => c.points));
        let score = cities + (scoring.location ? Math.max(0, eastwest) : 0) + strng + ((_a = scoring.adjust) !== null && _a !== void 0 ? _a : 0);
        if (this.handicap)
            score >>= 1;
        return score;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event, listener) {
        return super.on(event, listener);
    }
}

export { Game, Grid, Mapboard, Oob, Thinker, Unit, bitsdecode, bitsencode, blocked, clamp, directions, fibdecode, fibencode, fletcher6, lfsr24, mapVariants, memoize, monthdata, oobVariants, players, ravel2, rldecode, rlencode, scenarios, seq2str, str2seq, sum, terraintypes, unitFlag, unitModes, unitkinds, unravel2, unwrap64, waterstate, weatherdata, wrap64, zagzig, zagzig1, zigzag, zigzag1 };
//# sourceMappingURL=ef1941.mjs.map
