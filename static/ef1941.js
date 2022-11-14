var ef1941 = (function (exports, node_crypto) {
    'use strict';

    function sum(xs) {
        return xs.reduce((s, x) => s + x, 0);
    }
    function memoize(fn) {
        const cache = new Map();
        const cached = function (x) {
            if (!cache.has(x)) {
                cache.set(x, fn(x));
            }
            return cache.get(x);
        };
        return cached;
    }
    const directions = {
        [0 /* DirectionKey.north */]: { label: 'N', dlon: 0, dlat: 1, icon: 257 },
        [1 /* DirectionKey.east */]: { label: 'E', dlon: -1, dlat: 0, icon: 258 },
        [2 /* DirectionKey.south */]: { label: 'S', dlon: 0, dlat: -1, icon: 259 },
        [3 /* DirectionKey.west */]: { label: 'W', dlon: 1, dlat: 0, icon: 260 }, // left  1011 => 3
    };
    const players = {
        [0 /* PlayerKey.German */]: {
            label: 'German', unit: 'CORPS', color: '0C', homedir: 3 /* DirectionKey.west */,
            supply: { sea: 1, replacements: 0, maxfail: [24, 0, 16], freeze: 1 }
        },
        [1 /* PlayerKey.Russian */]: {
            label: 'Russian', unit: 'ARMY', color: '46', homedir: 1 /* DirectionKey.east */,
            supply: { sea: 0, replacements: 2, maxfail: [24, 24, 24], freeze: 0 }
        },
    };
    const terraintypes = {
        [0 /* TerrainKey.clear */]: {
            label: 'clear', color: '02',
            offence: 0, defence: 0, movecost: [[6, 24, 10], [4, 30, 6]]
        },
        [1 /* TerrainKey.mountain_forest */]: {
            label: 'mountain/forest', color: '28', altcolor: 'D6',
            offence: 0, defence: 1, movecost: [[12, 30, 16], [8, 30, 10]]
        },
        [2 /* TerrainKey.city */]: {
            label: 'city', color: '0C', altcolor: '46',
            offence: 0, defence: 1, movecost: [[8, 24, 10], [6, 30, 8]]
        },
        [3 /* TerrainKey.frozen_swamp */]: {
            label: 'frozen swamp', color: '0C',
            offence: 0, defence: 0, movecost: [[0, 0, 12], [0, 0, 8]]
        },
        [4 /* TerrainKey.frozen_river */]: {
            label: 'frozen river', color: '0C',
            offence: 0, defence: 0, movecost: [[0, 0, 12], [0, 0, 8]]
        },
        [5 /* TerrainKey.swamp */]: {
            label: 'swamp', color: '94',
            offence: 0, defence: 0, movecost: [[18, 30, 24], [18, 30, 24]]
        },
        [6 /* TerrainKey.river */]: {
            label: 'river', color: '94',
            offence: -1, defence: -1, movecost: [[14, 30, 28], [13, 30, 28]]
        },
        [7 /* TerrainKey.coastline */]: {
            // strange that coastline acts like river but estuary doesn't?
            label: 'coastline', color: '94',
            offence: -1, defence: -1, movecost: [[8, 26, 12], [6, 30, 8]]
        },
        [8 /* TerrainKey.estuary */]: {
            label: 'estuary', color: '94',
            offence: 0, defence: 0, movecost: [[20, 28, 24], [16, 30, 20]],
        },
        [9 /* TerrainKey.impassable */]: {
            label: 'impassable', color: '94', altcolor: '0C',
            offence: 0, defence: 0, movecost: [[0, 0, 0], [0, 0, 0]]
        }
    };
    const weatherdata = {
        [0 /* WeatherKey.dry */]: { label: 'dry', earth: '10' },
        [1 /* WeatherKey.mud */]: { label: 'mud', earth: '02' },
        [2 /* WeatherKey.snow */]: { label: 'snow', earth: '0A' },
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
        [0 /* MonthKey.Jan */]: { label: "January", trees: '12', weather: 2 /* WeatherKey.snow */ },
        [1 /* MonthKey.Feb */]: { label: "February", trees: '12', weather: 2 /* WeatherKey.snow */ },
        [2 /* MonthKey.Mar */]: { label: "March", trees: '12', weather: 2 /* WeatherKey.snow */, water: 1 /* WaterStateKey.thaw */ },
        [3 /* MonthKey.Apr */]: { label: "April", trees: 'D2', weather: 1 /* WeatherKey.mud */ },
        [4 /* MonthKey.May */]: { label: "May", trees: 'D8', weather: 0 /* WeatherKey.dry */ },
        [5 /* MonthKey.Jun */]: { label: "June", trees: 'D6', weather: 0 /* WeatherKey.dry */ },
        [6 /* MonthKey.Jul */]: { label: "July", trees: 'C4', weather: 0 /* WeatherKey.dry */ },
        [7 /* MonthKey.Aug */]: { label: "August", trees: 'D4', weather: 0 /* WeatherKey.dry */ },
        [8 /* MonthKey.Sep */]: { label: "September", trees: 'C2', weather: 0 /* WeatherKey.dry */ },
        [9 /* MonthKey.Oct */]: { label: "October", trees: '12', weather: 1 /* WeatherKey.mud */ },
        [10 /* MonthKey.Nov */]: { label: "November", trees: '12', weather: 2 /* WeatherKey.snow */, water: 0 /* WaterStateKey.freeze */ },
        [11 /* MonthKey.Dec */]: { label: "December", trees: '12', weather: 2 /* WeatherKey.snow */ },
    };
    const unitkinds = {
        [0 /* UnitKindKey.infantry */]: { key: 'infantry', icon: 0xfd },
        [1 /* UnitKindKey.armor */]: { key: 'armor', icon: 0xfe },
        [2 /* UnitKindKey.air */]: { key: 'air', icon: 0xfc },
    };
    function moveCost(terrain, kind, weather) {
        return kind == 2 /* UnitKindKey.air */ ? 4 : (terraintypes[terrain].movecost[kind][weather] || 255);
    }
    function moveCosts(kind, weather) {
        // return a table of movement costs based on armor/inf and weather
        return Object.keys(terraintypes).map(t => moveCost(+t, kind, weather));
    }

    const scenarios = {
        [0 /* ScenarioKey.apx */]: {
            label: 'APX MODE', map: 0 /* MapVariantKey.apx */, oob: 0 /* OobVariantKey.apx */, level: 3 /* LevelKey.advanced */, start: '1941/6/22'
        },
        [1 /* ScenarioKey.learner */]: {
            label: 'LEARNER', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, level: 0 /* LevelKey.learner */, start: '1941/6/22'
        },
        [2 /* ScenarioKey.beginner */]: {
            label: 'BEGINNER', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, level: 1 /* LevelKey.beginner */, start: '1941/6/22'
        },
        [3 /* ScenarioKey.intermediate */]: {
            label: 'INTERMED', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, level: 2 /* LevelKey.intermediate */, start: '1941/6/22'
        },
        [4 /* ScenarioKey.advanced */]: {
            label: 'ADVANCED', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, level: 3 /* LevelKey.advanced */, start: '1941/6/22'
        },
        [5 /* ScenarioKey.expert41 */]: {
            label: 'EXPERT41', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, level: 4 /* LevelKey.expert */, start: '1941/6/22'
        },
        [6 /* ScenarioKey.expert42 */]: {
            //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
            label: 'EXPERT42', map: 1 /* MapVariantKey.cart */, oob: 1 /* OobVariantKey.cart41 */, level: 4 /* LevelKey.expert */, start: '1942/5/24'
        },
    };

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
        let seq = [].concat(bitsencode(payload.length, length_maxbits), payload, fletcher6(payload));
        return (prefix || '') + seq2str(seq);
    }
    /** unwrap payload to seqas wrapped by wrap64, ignoring garbage and trailing characters */
    function unwrap64(s, prefix, length_maxbits = 12) {
        prefix || (prefix = '');
        // check prefix
        if (!s.startsWith(prefix))
            throw new Error(`unwrap64: string didn't start with expected prefix '${prefix}'`);
        // remove prefix and extraenous characters, and convert to seq<uint64>
        let seq = str2seq(s.slice(prefix.length).replace(/[^-\w]/g, ''));
        // get payload length
        let n = bitsdecode(seq, length_maxbits);
        if (seq.length < n + 2) {
            throw new Error(`unwrap: expected at least ${n} + 2 characters after length marker, got ${seq.length}`);
        }
        // get payload and compute checksum
        let payload = seq.slice(0, n), chk = fletcher6(payload);
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
        let seq = [];
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
        let nchars = Math.ceil(nbits / 6);
        if (nchars > seq.length) {
            throw new Error(`bitsdecode: expected at least ${nchars} characters, got ${seq.length}`);
        }
        let n = 0, us = seq.splice(0, nchars);
        us.reverse().forEach(u => { n = (n << 6) + u; });
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
        var n = 0;
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
        let fibs = vs.map(fibencode_uint), seq = [], bits = 0, k = 0, lead_bit = 0x1;
        while (fibs.length && k < 6) {
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
        let vs = [], bitseq = 0, m = 0, mask = 0x3, k = 2;
        while (seq.length) {
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
        let zs = [], prev = -1, repeat = 0, seq = vs.map(v => v >= marker ? v + 1 : v);
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
        const rptlen = vsize(marker) + vsize(0);
        let vs = [];
        while (zs.length) {
            let v = zs.shift();
            if (v != marker) {
                vs.push(v > marker ? v - 1 : v);
            }
            else {
                if (zs.length < 2)
                    throw new Error('rldecode: Malformed run definition');
                v = zs.shift();
                const min_repeat = Math.ceil(rptlen / vsize(v)) + 1;
                let repeat = zs.shift() + min_repeat;
                while (repeat--)
                    vs.push(v);
            }
        }
        return vs;
    }
    /** map a seq<int> (or singleton int) to seq<uint> */
    function zigzag(vs) {
        if (!vs.every(Number.isInteger))
            throw new Error(`zigzag: Expected list of integers: ${vs}`);
        return vs.map(v => v < 0 ? ((-v) << 1) - 1 : v << 1);
    }
    /** recover seq<int> from a zigzag()d seq<uint> */
    function zagzig(vs) {
        if (!vs.every(isuint))
            throw new Error(`zagzig: Expected list of unsigned integers: ${vs}`);
        return vs.map(v => v & 0x1 ? -((v + 1) >> 1) : v >> 1);
    }
    /** combine multiple small numbers into a single result by interleaving bits
     * this is not safe for large numbers / long lists without switching to bigint
     * since JS works with signed 32-bit integers for bitwise ops
     */
    function ravel(vs) {
        let z = 0, m = Math.max(...vs), bit = 1;
        if (!vs.every(isuint))
            throw new Error(`ravel: Expected list of unsigned integers: ${vs}`);
        while (m) {
            vs = vs.map(v => {
                if (v & 1)
                    z |= bit;
                bit <<= 1;
                return v >> 1;
            });
            m >>= 1;
        }
        return z;
    }
    function unravel(z, n) {
        if (!isuint(z))
            throw new Error(`unravel: Expected unsigned int: ${z}`);
        let vs = new Array(n).fill(0), bit = 1;
        while (z) {
            vs = vs.map(v => {
                if (z & 1)
                    v |= bit;
                z >>= 1;
                return v;
            });
            bit <<= 1;
        }
        return vs;
    }

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
                { owner: 0 /* PlayerKey.German */, lon: 44, lat: 19, points: 0, label: 'Warsaw' },
                //        {owner: PlayerKey.Russian, lon: 20, lat:  0, points: 10,  label: 'Sevastopol'},
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
                { owner: 0 /* PlayerKey.German */, lon: 44, lat: 19, points: 0, label: 'Warsaw' },
                //        {owner: PlayerKey.Russian, lon: 20, lat:  0, points: 5,  label: 'Sevastopol'},
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

    var _Mapboard_instances, _Mapboard_game, _Mapboard_maxlon, _Mapboard_maxlat, _Mapboard_icelat, _Mapboard_fgcolor, _Mapboard_freezeThaw;
    // the map is made up of locations, each with a lon and lat
    // grid points have integer coordinates and a unique identifier
    class GridPoint {
        constructor(lon, lat) {
            if (!Number.isInteger(lon) || !Number.isInteger(lat))
                throw (`bad Location(lon: int, lat: int, ...data), got lon=${lon}, lat=${lat}`);
            this.lon = lon;
            this.lat = lat;
        }
        get id() {
            return ravel(zigzag([this.lon, this.lat]));
        }
        put(d) {
            d.lon = this.lon;
            d.lat = this.lat;
            return d;
        }
        next(dir) {
            const d = directions[dir];
            return new GridPoint(this.lon + d.dlon, this.lat + d.dlat);
        }
        static get(p) {
            return new GridPoint(p.lon, p.lat);
        }
        static fromid(v) {
            const [lon, lat] = zagzig(unravel(v, 2));
            return new GridPoint(lon, lat);
        }
        static directionsFrom(p, q) {
            // project all directions from p to q and rank them, ensuring tie breaking has no bias
            let dlat = (q.lat - p.lat), dlon = (q.lon - p.lon);
            if (dlat == 0 && dlon == 0)
                return [];
            return Object.entries(directions)
                .map(([k, d]) => [d.dlon * dlon + d.dlat * dlat, +k])
                // in case tied dirs (which will be neighbors) pick the  the clockwise leader
                .sort(([a, i], [b, j]) => (b - a) || ((j - i + 4 + 2) % 4) - 2);
        }
        static squareSpiral(center, diameter) {
            // return list of the diameter^2 locations spiraling out from loc
            // which form a square of 'radius' (diameter-1)/2, based on a spiralpattern
            // that looks like N, E, S,S, W,W, N,N,N, E,E,E, S,S,S,S, W,W,W,W, ...
            if (diameter % 2 != 1)
                throw (`squareSpiral: diameter should be odd, got ${diameter}`);
            let loc = new GridPoint(center.lon, center.lat), locs = [loc], dir = 0, i = 0, side = 1;
            while (++i < diameter) {
                loc = loc.next(dir);
                locs.push(loc);
                if (i == side) {
                    side += dir % 2;
                    dir = (dir + 1) % 4;
                    i = 0;
                }
            }
            return locs;
        }
    }
    GridPoint.manhattanDistance = function (p, q) {
        // calculate the taxicab metric between two locations
        return Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon);
    };
    GridPoint.directionFrom = function (p, q) {
        // return the index of the winning direction
        let projections = GridPoint.directionsFrom(p, q);
        return projections.length ? projections[0][1] : null;
    };
    class MapPoint extends GridPoint {
        constructor(lon, lat, row, col, terrain, alt, icon) {
            super(lon, lat);
            this.row = row;
            this.col = col;
            this.terrain = terrain;
            this.alt = alt;
            this.icon = icon;
        }
        describe() {
            return `[${this.id}] ${terraintypes[this.terrain].label}${this.alt ? "-alt" : ""}\n`
                + `lon ${this.lon}, lat ${this.lat}`;
        }
    }
    // mapboard constructor, used as a container of MapPoints
    class Mapboard {
        constructor(game, memento) {
            _Mapboard_instances.add(this);
            _Mapboard_game.set(this, void 0); //TODO only wants .month, .emit, .rand
            _Mapboard_maxlon.set(this, void 0);
            _Mapboard_maxlat.set(this, void 0);
            _Mapboard_icelat.set(this, 39); // via M.ASM:8600 PSXVAL initial value is 0x27
            const variant = mapVariants[scenarios[game.scenario].map], mapencoding = variant.encoding.map((enc, i) => {
                let lookup = {}, ch = 0;
                enc.split('|').forEach((s, t) => s.split('').forEach(c => {
                    let alt = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                    if (ch == 0x40)
                        ch--;
                    lookup[c] = {
                        icon: 0x80 + i * 0x40 + ch++,
                        terrain: t,
                        alt: alt
                    };
                }));
                return lookup;
            }), 
            // decode the map into a 2-d array of rows x cols of  {lon: , lat:, icon:, terrain:, alt:}
            mapdata = variant.ascii.split(/\n/).slice(1, -1).map((row, i) => row.split('').map(c => Object.assign({}, mapencoding[i <= 25 ? 0 : 1][c])));
            // excluding the impassable border valid is 0..maxlon-1, 0..maxlat-1
            __classPrivateFieldSet(this, _Mapboard_maxlon, mapdata[0].length - 2, "f");
            __classPrivateFieldSet(this, _Mapboard_maxlat, mapdata.length - 2, "f");
            __classPrivateFieldSet(this, _Mapboard_game, game, "f");
            this.locations = mapdata.map((row, i) => row.map((data, j) => {
                let lon = __classPrivateFieldGet(this, _Mapboard_maxlon, "f") - j, lat = __classPrivateFieldGet(this, _Mapboard_maxlat, "f") - i;
                return new MapPoint(lon, lat, i, j, data.terrain, data.alt, data.icon);
            }));
            this.cities = variant.cities.map(c => { return Object.assign({}, c); });
            this.cities.forEach((city, i) => {
                city.points || (city.points = 0);
                let loc = this.locationOf(city);
                if (loc.terrain != 2 /* TerrainKey.city */)
                    throw new Error(`Mapboard: city at (${loc.lon}, ${loc.lat}) missing city terrain`);
                loc.cityid = i;
            });
            // verify each city terrain has a cityid
            const missing = this.locations.map(row => row.filter(loc => loc.terrain == 2 /* TerrainKey.city */ && typeof loc.cityid === 'undefined')).flat();
            if (missing.length > 0)
                throw new Error(`Mapboard: city terrain missing city details at ${missing}`);
            if (memento) {
                if (memento.length < this.cities.length + 1)
                    throw new Error("Mapboard: malformed save data");
                __classPrivateFieldGet(this, _Mapboard_instances, "m", _Mapboard_freezeThaw).call(this, 0 /* WaterStateKey.freeze */, memento.shift());
                this.cities.forEach(c => c.owner = memento.shift());
            }
        }
        newTurn(initialize = false) {
            let mdata = monthdata[__classPrivateFieldGet(this, _Mapboard_game, "f").month], earth = weatherdata[mdata.weather].earth;
            // update the tree color in place in the terrain data :grimace:
            terraintypes[1 /* TerrainKey.mountain_forest */].altcolor = mdata.trees;
            if (!initialize && mdata.water != null)
                __classPrivateFieldGet(this, _Mapboard_instances, "m", _Mapboard_freezeThaw).call(this, mdata.water);
            __classPrivateFieldGet(this, _Mapboard_game, "f").emit('map', 'recolor', {
                fgcolorfn: (loc) => __classPrivateFieldGet(this, _Mapboard_instances, "m", _Mapboard_fgcolor).call(this, loc),
                bgcolor: earth,
                labelcolor: mdata.weather == 2 /* WeatherKey.snow */ ? '04' : '08'
            });
        }
        get memento() {
            let vs = []
                .concat([__classPrivateFieldGet(this, _Mapboard_icelat, "f")], this.cities.map(c => c.owner));
            return vs;
        }
        valid(pt) {
            return pt.lat >= 0 && pt.lat < __classPrivateFieldGet(this, _Mapboard_maxlat, "f") && pt.lon >= 0 && pt.lon < __classPrivateFieldGet(this, _Mapboard_maxlon, "f");
        }
        locationOf(pt) {
            if (!this.valid(pt))
                throw new Error(`MapBoard.locationOf: invalid point ${pt.lon}, ${pt.lat}`);
            return this.locations[__classPrivateFieldGet(this, _Mapboard_maxlat, "f") - pt.lat][__classPrivateFieldGet(this, _Mapboard_maxlon, "f") - pt.lon];
        }
        boundaryDistance(pt, dir) {
            switch (dir) {
                case 0 /* DirectionKey.north */: return __classPrivateFieldGet(this, _Mapboard_maxlat, "f") - 1 - pt.lat;
                case 2 /* DirectionKey.south */: return pt.lat;
                case 1 /* DirectionKey.east */: return pt.lon;
                case 3 /* DirectionKey.west */: return __classPrivateFieldGet(this, _Mapboard_maxlon, "f") - 1 - pt.lon;
            }
        }
        neighborOf(pt, dir) {
            let q = pt.next(dir);
            if (!this.valid(q))
                return null;
            let nbr = this.locationOf(q);
            const legal = (nbr.terrain != 9 /* TerrainKey.impassable */
                && !((dir == 0 /* DirectionKey.north */ || dir == 2 /* DirectionKey.south */)
                    ? blocked[0].find(d => d.lon == pt.lon && d.lat == (dir == 0 /* DirectionKey.north */ ? pt.lat : nbr.lat))
                    : blocked[1].find(d => d.lon == (dir == 3 /* DirectionKey.west */ ? pt.lon : nbr.lon) && d.lat == pt.lat)));
            return legal ? nbr : null;
        }
        occupy(loc, player) {
            if (loc.cityid != null)
                this.cities[loc.cityid].owner = player;
            //TODO repaint this square
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
            let loc = this.locationOf(p), goal = this.locationOf(q);
            if (loc.id == goal.id)
                return { cost: 0, orders: [] };
            const A = q.lat - p.lat, B = -(q.lon - p.lon), 
            // C = q.lon * p.lat - q.lat * p.lon,
            projections = GridPoint.directionsFrom(p, q), i = projections[0][1], j = projections[1][1], // best two directinoe
            s = directions[i], t = directions[j], ds = A * s.dlon + B * s.dlat, dt = A * t.dlon + B * t.dlat;
            let err = 0, cost = 0, orders = [];
            while (loc.id != goal.id) {
                let [k, de] = Math.abs(err + ds) < Math.abs(err + dt) ? [i, ds] : [j, dt];
                err += de;
                orders.push(k);
                //NB. not validating that we can actually take this path
                loc = this.locationOf(loc.next(k));
                cost += costs ? costs[loc.terrain] : 1;
            }
            return { cost, orders };
        }
        bestPath(p, q, costs) {
            // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
            // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
            // or null if goal is unreachable
            const minCost = Math.min(...costs);
            let src = this.locationOf(p), goal = this.locationOf(q), frontEst = { _: 0 }, // estimated total cost via this square, _ is head
            frontNext = { _: src.id }, // linked list with next best frontier square to check
            dirTo = { [src.id]: null }, // direction index which arrived at keyed square
            costTo = { [src.id]: 0 }; // actual cost to get to keyed square
            while (frontNext._) {
                let next = frontNext._;
                src = this.locationOf(GridPoint.fromid(next));
                if (src.id == goal.id)
                    break;
                frontNext._ = frontNext[next];
                frontEst._ = frontEst[next];
                delete frontNext[next], frontEst[next];
                Object.keys(directions).forEach(i => {
                    let d = +i, dst = this.neighborOf(src, d);
                    if (!dst)
                        return;
                    let cost = costTo[src.id] + costs[dst.terrain];
                    if (!(dst.id in costTo)) { // with consistent estimate we always find best first
                        costTo[dst.id] = cost;
                        dirTo[dst.id] = d;
                        let est = cost + minCost * GridPoint.manhattanDistance(src, dst), at = '_';
                        while (frontNext[at] && frontEst[at] < est)
                            at = frontNext[at].toString();
                        next = frontNext[at];
                        frontNext[at] = dst.id;
                        frontNext[dst.id] = next;
                        frontEst[dst.id] = est;
                    }
                });
            }
            if (src.id != goal.id)
                throw new Error(`MapBoard.bestPath: no path from ${p} to ${q}`);
            let orders = [], pt = src;
            for (;;) {
                let dir = dirTo[pt.id];
                if (dir == null)
                    break;
                orders.unshift(dir);
                pt = pt.next((dir + 2) % 4); // walk back in reverse direction
            }
            return { cost: costTo[goal.id], orders: orders };
        }
        reach(src, range, costs) {
            // find all squares accessible to unit within range, ignoring other units, zoc
            let cost = 0, start = this.locationOf(src), locs = { [start.id]: 0 };
            while (cost < range) {
                // eslint-disable-next-line no-unused-vars
                Object.entries(locs).filter(([_, v]) => v == cost).forEach(([k, _]) => {
                    let src = GridPoint.fromid(+k);
                    Object.keys(directions).forEach(i => {
                        let dst = this.neighborOf(src, +i);
                        if (!dst)
                            return;
                        let curr = dst.id in locs ? locs[dst.id] : 255;
                        if (curr <= cost)
                            return;
                        let c = cost + costs[dst.terrain];
                        if (c <= range && c < curr)
                            locs[dst.id] = c;
                    });
                });
                cost++;
            }
            return locs;
        }
    }
    _Mapboard_game = new WeakMap(), _Mapboard_maxlon = new WeakMap(), _Mapboard_maxlat = new WeakMap(), _Mapboard_icelat = new WeakMap(), _Mapboard_instances = new WeakSet(), _Mapboard_fgcolor = function _Mapboard_fgcolor(loc) {
        // return the antic fg color for a given location
        let tinfo = terraintypes[loc.terrain], alt = typeof loc.cityid === 'undefined' ? loc.alt : this.cities[loc.cityid].owner;
        return alt ? tinfo.altcolor : tinfo.color;
    }, _Mapboard_freezeThaw = function _Mapboard_freezeThaw(w, newlat) {
        // move ice by freeze/thaw rivers and swamps, where w is Water.freeze or Water.thaw
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug in APX code? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
        let state = waterstate[w], other = waterstate[1 - w], oldlat = __classPrivateFieldGet(this, _Mapboard_icelat, "f"), dlat = directions[state.dir].dlat;
        if (newlat != null) {
            // initial setup where we freeze to saved value
            __classPrivateFieldSet(this, _Mapboard_icelat, newlat, "f");
        }
        else {
            let change = __classPrivateFieldGet(this, _Mapboard_game, "f").rand.bits(3) + 7;
            __classPrivateFieldSet(this, _Mapboard_icelat, Math.min(__classPrivateFieldGet(this, _Mapboard_maxlat, "f"), Math.max(1, oldlat + dlat * change)), "f");
        }
        let skip = (w == 0 /* WaterStateKey.freeze */) ? oldlat : __classPrivateFieldGet(this, _Mapboard_icelat, "f"); // for freeze skip old line, for thaw skip new new
        for (let i = oldlat; i != __classPrivateFieldGet(this, _Mapboard_icelat, "f") + dlat; i += dlat) {
            if (i == skip)
                continue;
            this.locations[__classPrivateFieldGet(this, _Mapboard_maxlat, "f") - i].forEach(d => {
                let k = other.terrain.indexOf(d.terrain);
                if (k != -1)
                    d.terrain = state.terrain[k];
            });
        }
    };

    var _Unit_instances, _Unit_game, _Unit_resolveCombat, _Unit_takeDamage;
    const unittypes = {
        [0 /* UnitTypeKey.infantry */]: { label: "infantry", kind: 0 /* UnitKindKey.infantry */ },
        [1 /* UnitTypeKey.militia */]: { label: "militia", kind: 0 /* UnitKindKey.infantry */, canMove: 0 },
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
    class Unit {
        constructor(game, id, ...args) {
            var _a, _b;
            _Unit_instances.add(this);
            this.canMove = 1;
            this.canAttack = 1;
            this.resolute = 0;
            this.orders = []; // WHORDRS, HMORDS
            this.ifr = 0;
            this.ifrdir = [0, 0, 0, 0];
            _Unit_game.set(this, void 0);
            let corpsx, corpsy, mstrng, arrive, corpt, corpno;
            if (args.length == 7) { // apx
                let swap, corptapx;
                [corpsx, corpsy, mstrng, swap, arrive, corptapx, corpno] = args;
                // translate apx => cart format
                corpt = (swap & 0x80) | (corptapx & 0x70) | apxXref[corptapx & 0x7];
            }
            else { // cart
                console.assert(args.length == 6, "Expected 6 or 7 args for cartridge or apx unit def respectively");
                [corpsx, corpsy, mstrng, arrive, corpt, corpno] = args;
            }
            this.id = id;
            this.player = (corpt & 0x80) ? 1 /* PlayerKey.Russian */ : 0 /* PlayerKey.German */; // german=0, russian=1; equiv i >= 55
            this.unitno = corpno;
            this.type = corpt & 0x7;
            let ut = unittypes[this.type];
            if (ut == null)
                throw new Error(`Unused unit type for unit id ${id}`);
            this.kind = ut.kind;
            this.icon = unitkinds[this.kind].icon;
            this.modifier = (corpt >> 4) & 0x7;
            this.arrive = arrive;
            this.scheduled = arrive;
            this.lon = corpsx;
            this.lat = corpsy;
            this.mstrng = mstrng;
            this.cstrng = mstrng;
            this.canMove = (_a = ut.canMove) !== null && _a !== void 0 ? _a : 1;
            this.canAttack = (_b = modifiers[this.modifier].canAttack) !== null && _b !== void 0 ? _b : 1;
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
        get human() {
            return this.player == __classPrivateFieldGet(this, _Unit_game, "f").human;
        }
        get location() {
            return __classPrivateFieldGet(this, _Unit_game, "f").mapboard.locationOf(this);
        }
        get path() {
            let loc = this.location, path = [loc];
            this.orders.forEach(dir => {
                let dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(loc, dir);
                if (!dst)
                    return;
                path.push(loc = dst);
            });
            return path;
        }
        addOrder(dir) {
            let dst = null, err = null;
            if (!this.canMove) {
                err = "MILITIA UNITS CAN'T MOVE!";
            }
            else if (this.orders.length == 8) {
                err = "ONLY 8 ORDERS ARE ALLOWED!";
            }
            else {
                dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(this.path.pop(), dir);
                if (!dst) {
                    err = "IMPASSABLE!";
                }
                else {
                    this.orders.push(dir);
                }
            }
            if (err) {
                __classPrivateFieldGet(this, _Unit_game, "f").emit('message', 'error', err);
            }
            else {
                __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'orders', this);
            }
            return dst;
        }
        delOrder() {
            if (this.orders.length) {
                __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'orders', this);
                this.orders.pop();
            }
        }
        setOrders(dirs) {
            this.orders = dirs;
            __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'orders', this);
        }
        resetOrders() {
            this.orders = [];
            this.tick = 255;
            __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'orders', this);
        }
        moveCost(dir) {
            if (!this.canMove)
                return 255;
            let dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(GridPoint.get(this), dir);
            if (!dst)
                return 255;
            return moveCost(dst.terrain, this.kind, __classPrivateFieldGet(this, _Unit_game, "f").weather);
        }
        scheduleOrder(reset = false) {
            if (reset || !this.tick)
                this.tick = 0;
            if (this.orders.length)
                this.tick += this.moveCost(this.orders[0]);
            else
                this.tick = 255;
        }
        bestPath(goal) {
            //TODO config directPath for comparison
            return __classPrivateFieldGet(this, _Unit_game, "f").mapboard.bestPath(this, goal, moveCosts(this.kind, __classPrivateFieldGet(this, _Unit_game, "f").weather));
        }
        reach(range = 32) {
            return __classPrivateFieldGet(this, _Unit_game, "f").mapboard.reach(this, range, moveCosts(this.kind, __classPrivateFieldGet(this, _Unit_game, "f").weather));
        }
        moveTo(dst) {
            let action = 'move';
            if (this.location.unitid) {
                this.location.unitid = undefined; // leave the current location
            }
            else {
                action = 'enter';
            }
            if (dst != null) {
                // occupy the new one and repaint
                dst.put(this);
                dst.unitid = this.id;
                __classPrivateFieldGet(this, _Unit_game, "f").mapboard.occupy(dst, this.player);
            }
            else {
                action = 'exit';
            }
            __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', action, this);
        }
        tryOrder() {
            if (this.tick == null)
                throw new Error('Unit:tryOrder tick not set');
            let src = this.location, dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(src, this.orders[0]); // assumes already validated
            if (dst == null)
                throw new Error("Unit.tryOrder: invalid order");
            if (dst.unitid != null) {
                let opp = __classPrivateFieldGet(this, _Unit_game, "f").oob.at(dst.unitid);
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
            // M.ASM:5070  recover combat strength
            if (this.mstrng - this.cstrng >= 2)
                this.cstrng += 1 + __classPrivateFieldGet(this, _Unit_game, "f").rand.bit();
        }
        traceSupply() {
            // implement the supply check from C.ASM:3430, returns 1 if supplied, 0 if not
            const player = players[this.player], supply = player.supply;
            let fail = 0, loc = this.location, dir = player.homedir;
            if (supply.freeze && __classPrivateFieldGet(this, _Unit_game, "f").weather == 2 /* WeatherKey.snow */) {
                // C.ASM:3620
                if (__classPrivateFieldGet(this, _Unit_game, "f").rand.byte() >= 74 + 4 * (__classPrivateFieldGet(this, _Unit_game, "f").mapboard.boundaryDistance(loc, dir) + (dir == 1 /* DirectionKey.east */ ? 1 : 0))) {
                    return 0;
                }
            }
            while (fail < supply.maxfail[__classPrivateFieldGet(this, _Unit_game, "f").weather]) {
                let dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.locationOf(loc.next(dir)), cost = 0;
                if (__classPrivateFieldGet(this, _Unit_game, "f").mapboard.boundaryDistance(this, player.homedir) < 0) {
                    return 1;
                }
                else if (dst == null || (dst.terrain == 9 /* TerrainKey.impassable */ && (supply.sea == 0 || dst.alt == 1))) {
                    cost = 1;
                }
                else if (__classPrivateFieldGet(this, _Unit_game, "f").oob.zocAffecting(this.player, dst) >= 2) {
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
            return 0;
        }
        score() {
            let v = 0, dist = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.boundaryDistance(this, players[this.player].homedir);
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
        describe(debug) {
            let s = `[${this.id}] ${this.mstrng} / ${this.cstrng}\n`;
            s += `${this.label}\n`;
            if (this.orders)
                s += 'orders: ' + this.orders.map(d => directions[d].label).join('');
            if (debug && this.ifr !== undefined && this.ifrdir !== undefined) {
                s += `ifr: ${this.ifr}; `;
                s += Object.entries(directions)
                    .map(([i, d]) => `${d.label}: ${this.ifrdir[+i]}`).join(' ') + '\n';
                s += this.objective
                    ? `obj: lon ${this.objective.lon} lat ${this.objective.lat}\n`
                    : 'no objective\n';
            }
            return s;
        }
    }
    _Unit_game = new WeakMap(), _Unit_instances = new WeakSet(), _Unit_resolveCombat = function _Unit_resolveCombat(opp) {
        // return 1 if target square is vacant
        if (!this.canAttack)
            return 0;
        __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'attack', this);
        __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'defend', opp);
        let modifier = terraintypes[__classPrivateFieldGet(this, _Unit_game, "f").mapboard.locationOf(opp).terrain].defence;
        if (opp.orders.length)
            modifier--; // movement penalty
        // opponent attacks
        let str = modifyStrength(opp.cstrng, modifier);
        // note APX doesn't skip attacker if break, but cart does
        if (str >= __classPrivateFieldGet(this, _Unit_game, "f").rand.byte()) {
            __classPrivateFieldGet(this, _Unit_instances, "m", _Unit_takeDamage).call(this, 1, 5, true);
            if (!this.orders)
                return 0;
        }
        let t = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.locationOf(opp).terrain;
        modifier = terraintypes[t].offence;
        str = modifyStrength(this.cstrng, modifier);
        if (str >= __classPrivateFieldGet(this, _Unit_game, "f").rand.byte()) {
            return __classPrivateFieldGet(opp, _Unit_instances, "m", _Unit_takeDamage).call(opp, 1, 5, true, this.orders[0]);
        }
        else {
            return 0;
        }
    }, _Unit_takeDamage = function _Unit_takeDamage(mdmg, cdmg, checkBreak = false, retreatDir) {
        // return 1 if this square is vacated, 0 otherwise
        // apply mdmg/cdmg to unit
        this.mstrng -= mdmg;
        this.cstrng -= cdmg;
        // dead?
        if (this.cstrng <= 0) {
            // TODO show as scrolling status window
            console.log(`${this.label} eliminated`);
            this.mstrng = 0;
            this.cstrng = 0;
            this.arrive = 255;
            this.resetOrders();
            this.moveTo(null);
            return 1;
        }
        __classPrivateFieldGet(this, _Unit_game, "f").emit('unit', 'damage', this);
        if (!checkBreak)
            return 0;
        // russian (& ger allies) break if cstrng <= 7/8 mstrng
        // german regulars break if cstrng < 1/2 mstrng
        let brkpt = this.mstrng - (this.mstrng >> (this.resolute ? 1 : 3));
        if (this.cstrng < brkpt) {
            this.resetOrders();
            if (retreatDir != null) {
                const homedir = players[this.player].homedir, nxtdir = __classPrivateFieldGet(this, _Unit_game, "f").rand.bit() ? 0 /* DirectionKey.north */ : 2 /* DirectionKey.south */, dirs = [retreatDir, homedir, nxtdir, (nxtdir + 2) % 4, (homedir + 2) % 4];
                for (let dir of dirs) {
                    let src = this.location, dst = __classPrivateFieldGet(this, _Unit_game, "f").mapboard.neighborOf(src, dir);
                    if (!dst || dst.unitid != null || __classPrivateFieldGet(this, _Unit_game, "f").oob.zocBlocked(this.player, src, dst)) {
                        if (__classPrivateFieldGet(this, _Unit_instances, "m", _Unit_takeDamage).call(this, 0, 5))
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
    function modifyStrength(strength, modifier) {
        if (modifier > 0) {
            while (modifier-- > 0)
                strength = Math.min(strength << 1, 255);
        }
        else {
            while (modifier++ < 0)
                strength = Math.max(strength >> 1, 1);
        }
        return strength;
    }

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
        [2 /* OobVariantKey.cart42 */]: [
            // ["CORPSX42", "CORPSY42", "MSTRNG42", "ARRIVE", "CORPT", "CORPNO"]
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
            [19, 14, 201, 2, 4, 40],
            [20, 18, 98, 3, 84, 1],
            [22, 23, 110, 4, 0, 27],
            [21, 22, 95, 5, 0, 23],
            [16, 12, 52, 6, 48, 5],
            [20, 17, 97, 7, 0, 12],
            [20, 1, 106, 8, 0, 13],
            [19, 0, 101, 9, 0, 34],
            [18, 3, 96, 10, 0, 35],
            [17, 2, 55, 11, 64, 4],
            [27, 26, 102, 0, 3, 1],
            [22, 20, 138, 0, 3, 2],
            [16, 10, 142, 0, 3, 3],
            [20, 2, 124, 0, 3, 4],
            [20, 15, 115, 0, 3, 5],
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
            [22, 24, 136, 1, 128, 14],
            [21, 24, 137, 1, 128, 15],
            [21, 23, 121, 2, 128, 20],
            [20, 23, 126, 3, 128, 24],
            [20, 22, 122, 3, 128, 40],
            [19, 22, 113, 4, 128, 29],
            [19, 21, 112, 4, 128, 30],
            [19, 20, 121, 5, 128, 31],
            [19, 19, 111, 5, 128, 32],
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
            [14, 14, 117, 1, 128, 7],
            [31, 37, 121, 1, 129, 2],
            [31, 36, 110, 1, 129, 4],
            [13, 13, 110, 6, 128, 41],
            [13, 12, 105, 8, 128, 42],
            [13, 11, 127, 10, 128, 43],
            [13, 10, 126, 2, 128, 16],
            [13, 9, 119, 2, 128, 56],
            [13, 8, 122, 6, 128, 33],
            [13, 7, 113, 5, 246, 1],
            [30, 30, 123, 5, 128, 34],
            [19, 25, 124, 2, 128, 35],
            [17, 23, 121, 3, 128, 28],
            [14, 18, 118, 3, 128, 25],
            [15, 21, 112, 3, 128, 23],
            [20, 0, 70, 4, 129, 7],
            [12, 4, 160, 5, 129, 11],
            [12, 8, 138, 6, 129, 10],
            [6, 15, 230, 2, 129, 3],
            [16, 3, 192, 2, 129, 5],
            [0, 20, 144, 9, 128, 17],
            [0, 12, 133, 12, 128, 44],
            [0, 30, 135, 10, 128, 45],
            [0, 10, 137, 18, 128, 46],
            [0, 6, 141, 11, 128, 47],
            [0, 22, 128, 15, 128, 48],
            [0, 15, 157, 13, 133, 9],
            [0, 24, 124, 19, 133, 13],
            [0, 16, 159, 20, 133, 14],
            [0, 18, 129, 22, 133, 15],
            [0, 35, 135, 24, 133, 16],
            [0, 10, 123, 11, 134, 7],
            [0, 20, 167, 10, 128, 37],
            [0, 26, 149, 7, 128, 43],
            [0, 5, 139, 6, 128, 49],
            [0, 11, 138, 8, 128, 50],
            [0, 14, 153, 11, 128, 52],
            [0, 22, 165, 9, 128, 54],
            [0, 33, 124, 12, 128, 55],
            [0, 19, 178, 3, 240, 1],
            [0, 8, 150, 9, 240, 2],
            [0, 28, 141, 13, 240, 3],
            [0, 15, 206, 14, 240, 4],
            [0, 13, 150, 1, 128, 79],
            [0, 35, 132, 2, 133, 18],
            [0, 6, 149, 3, 133, 19],
            [0, 10, 161, 4, 128, 95],
            [0, 30, 152, 5, 133, 20],
            [0, 15, 141, 6, 128, 67],
            [0, 25, 137, 7, 128, 66],
            [0, 11, 176, 8, 133, 28],
            [0, 22, 219, 7, 128, 39],
            [0, 19, 192, 12, 128, 59],
            [0, 30, 195, 6, 128, 60],
            [0, 21, 233, 10, 128, 61],
            [0, 15, 244, 11, 246, 2],
            [0, 7, 223, 12, 133, 31],
            [0, 28, 227, 13, 245, 1],
            [0, 10, 245, 14, 240, 5],
            [0, 33, 242, 15, 133, 32],
            [0, 12, 229, 16, 240, 6],
            [0, 26, 251, 17, 133, 33],
            [0, 14, 246, 18, 133, 34],
            [0, 24, 235, 19, 128, 38],
            [0, 16, 237, 20, 128, 36],
            [0, 6, 221, 21, 133, 8],
            [0, 35, 236, 21, 133, 12],
            [0, 10, 203, 22, 240, 7],
            [0, 30, 202, 23, 240, 8],
            [0, 19, 222, 23, 133, 11],
            [0, 37, 204, 24, 240, 9],
            [0, 23, 215, 25, 240, 10],
            [0, 31, 245, 25, 133, 7],
        ],
    };

    var _Oob_game, _Oob_units;
    class Oob {
        constructor(game, memento) {
            _Oob_game.set(this, void 0);
            _Oob_units.set(this, void 0);
            __classPrivateFieldSet(this, _Oob_units, oobVariants[scenarios[game.scenario].oob].map((vs, i) => new Unit(game, i, ...vs)), "f");
            __classPrivateFieldSet(this, _Oob_game, game, "f");
            if (memento) {
                let scheduled = this.filter(u => u.scheduled <= game.turn);
                if (memento.length < scheduled.length)
                    throw new Error('Oob: malformed save data for scheduled unit status');
                scheduled.forEach(u => {
                    let status = memento.shift();
                    if (status == 1) { // eliminated
                        //TODO via unit function to match with unit elimination code
                        u.mstrng = 0;
                        u.cstrng = 0;
                        u.arrive = 255;
                    }
                    else if (status == 2) { // delayed
                        u.arrive = game.turn + 1;
                    }
                });
                let active = this.activeUnits(), human = active.filter(u => u.human);
                if (memento.length < 4 * active.length + human.length)
                    throw new Error('oob: malformed save data for active unit properties');
                let lats = zagzig(memento.splice(0, active.length)), lons = zagzig(memento.splice(0, active.length)), mstrs = zagzig(memento.splice(0, active.length)), cdmgs = memento.splice(0, active.length), nords = memento.splice(0, human.length), lat = 0, lon = 0, mstr = 255;
                active.forEach(u => {
                    lat += lats.shift();
                    lon += lons.shift();
                    mstr += mstrs.shift();
                    [u.lat, u.lon, u.mstrng] = [lat, lon, mstr];
                    u.cstrng = u.mstrng - cdmgs.shift();
                });
                if (memento.length < sum(nords))
                    throw new Error('oob: malformed save data for unit orders');
                human.forEach(u => {
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
            let lats = [], lons = [], mstrs = [], cdmgs = [], nords = [], ords = [], lat = 0, lon = 0, mstr = 255;
            // for scheduled units, status = 0 (active), 1 (dead), 2 (delayed)
            let scheduled = this.filter(u => u.scheduled <= __classPrivateFieldGet(this, _Oob_game, "f").turn), status = scheduled.map(u => u.active ? 0 : (u.cstrng == 0 ? 1 : 2)), active = scheduled.filter(u => u.active);
            active.forEach(u => {
                lats.push(u.lat - lat);
                lons.push(u.lon - lon);
                mstrs.push(u.mstrng - mstr);
                [lat, lon, mstr] = [u.lat, u.lon, u.mstrng];
                cdmgs.push(u.mstrng - u.cstrng);
                if (u.human) {
                    nords.push(u.orders.length);
                    ords = ords.concat(u.orders);
                }
            });
            return status.concat(zigzag(lats), zigzag(lons), zigzag(mstrs), cdmgs, nords, ords);
        }
        newTurn(initialize) {
            if (initialize) {
                this.activeUnits().forEach(u => u.moveTo(u.location));
            }
            else {
                this.regroup();
                // TODO trace supply, with CSTR >> 1 if not, russian MSTR+2 (for apx)
                this.reinforce();
            }
        }
        activeUnits(player) {
            return this.filter((u) => u.active && (player == null || u.player == player));
        }
        scheduleOrders() {
            // M.asm:4950 movement execution
            this.forEach(u => u.scheduleOrder(true));
        }
        executeOrders(tick) {
            // original code processes movement in reverse-oob order
            // could be interesting to randomize, or support a 'pause' order to handle traffic
            this.filter(u => u.tick == tick).reverse().forEach(u => u.tryOrder());
        }
        regroup() {
            // regroup, recover...
            this.activeUnits().forEach(u => u.recover());
        }
        reinforce() {
            // M.ASM:3720  delay reinforcements scheduled for an occuplied square
            this.filter(u => u.arrive == __classPrivateFieldGet(this, _Oob_game, "f").turn)
                .forEach(u => {
                const loc = u.location;
                if (loc.unitid != null) {
                    u.arrive++;
                }
                else {
                    u.moveTo(loc); // reveal unit and link to the map square
                }
            });
        }
        zocAffecting(player, loc) {
            // evaluate zoc experienced by player (eg. exerted by !player) in square at loc
            let zoc = 0;
            // same player in target square negates zoc, enemy exerts 4
            if (loc.unitid != null) {
                if (this.at(loc.unitid).player == player)
                    return zoc;
                zoc += 4;
            }
            GridPoint.squareSpiral(loc, 3).slice(1).forEach((p, i) => {
                if (!__classPrivateFieldGet(this, _Oob_game, "f").mapboard.valid(p))
                    return;
                const pt = __classPrivateFieldGet(this, _Oob_game, "f").mapboard.locationOf(p);
                // even steps in the spiral exert 2, odd steps exert 1
                if (pt.unitid != null && this.at(pt.unitid).player != player)
                    zoc += (i % 2) ? 1 : 2;
            });
            return zoc;
        }
        zocBlocked(player, src, dst) {
            // does enemy ZoC block player move from src to dst?
            return this.zocAffecting(player, src) >= 2 && this.zocAffecting(player, dst) >= 2;
        }
    }
    _Oob_game = new WeakMap(), _Oob_units = new WeakMap();

    // Atari had a memory location that could be read for a byte of random noise
    const _crypto = node_crypto.webcrypto !== null && node_crypto.webcrypto !== void 0 ? node_crypto.webcrypto : (window && window.crypto);
    function lfsr24(seed) {
        const beforezero = 0xEF41CC; // arbitrary location to insert zero in the sequence
        seed !== null && seed !== void 0 ? seed : (seed = _crypto.getRandomValues(new Uint32Array(1))[0]);
        var r;
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

    var domain;

    // This constructor is used to store event handlers. Instantiating this is
    // faster than explicitly calling `Object.create(null)` to get a "clean" empty
    // object (tested with v8 v4.9).
    function EventHandlers() {}
    EventHandlers.prototype = Object.create(null);

    function EventEmitter() {
      EventEmitter.init.call(this);
    }

    // nodejs oddity
    // require('events') === require('events').EventEmitter
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.usingDomains = false;

    EventEmitter.prototype.domain = undefined;
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

    EventEmitter.init = function() {
      this.domain = null;
      if (EventEmitter.usingDomains) {
        // if there is an active domain, then attach to it.
        if (domain.active ) ;
      }

      if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      }

      this._maxListeners = this._maxListeners || undefined;
    };

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || isNaN(n))
        throw new TypeError('"n" argument must be a positive number');
      this._maxListeners = n;
      return this;
    };

    function $getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter.defaultMaxListeners;
      return that._maxListeners;
    }

    EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
      return $getMaxListeners(this);
    };

    // These standalone emit* functions are used to optimize calling of event
    // handlers for fast cases because emit() itself often has a variable number of
    // arguments and can be deoptimized because of that. These functions always have
    // the same number of arguments and thus do not get deoptimized, so the code
    // inside them can execute faster.
    function emitNone(handler, isFn, self) {
      if (isFn)
        handler.call(self);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self);
      }
    }
    function emitOne(handler, isFn, self, arg1) {
      if (isFn)
        handler.call(self, arg1);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1);
      }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
      if (isFn)
        handler.call(self, arg1, arg2);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2);
      }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
      if (isFn)
        handler.call(self, arg1, arg2, arg3);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2, arg3);
      }
    }

    function emitMany(handler, isFn, self, args) {
      if (isFn)
        handler.apply(self, args);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].apply(self, args);
      }
    }

    EventEmitter.prototype.emit = function emit(type) {
      var er, handler, len, args, i, events, domain;
      var doError = (type === 'error');

      events = this._events;
      if (events)
        doError = (doError && events.error == null);
      else if (!doError)
        return false;

      domain = this.domain;

      // If there is no 'error' event listener then throw.
      if (doError) {
        er = arguments[1];
        if (domain) {
          if (!er)
            er = new Error('Uncaught, unspecified "error" event');
          er.domainEmitter = this;
          er.domain = domain;
          er.domainThrown = false;
          domain.emit('error', er);
        } else if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          // At least give some kind of context to the user
          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
        return false;
      }

      handler = events[type];

      if (!handler)
        return false;

      var isFn = typeof handler === 'function';
      len = arguments.length;
      switch (len) {
        // fast cases
        case 1:
          emitNone(handler, isFn, this);
          break;
        case 2:
          emitOne(handler, isFn, this, arguments[1]);
          break;
        case 3:
          emitTwo(handler, isFn, this, arguments[1], arguments[2]);
          break;
        case 4:
          emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
          break;
        // slower
        default:
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          emitMany(handler, isFn, this, args);
      }

      return true;
    };

    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = target._events;
      if (!events) {
        events = target._events = new EventHandlers();
        target._eventsCount = 0;
      } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener) {
          target.emit('newListener', type,
                      listener.listener ? listener.listener : listener);

          // Re-assign `events` because a newListener handler could have caused the
          // this._events to be assigned to a new object
          events = target._events;
        }
        existing = events[type];
      }

      if (!existing) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          // Adding the second element, need to change to array.
          existing = events[type] = prepend ? [listener, existing] :
                                              [existing, listener];
        } else {
          // If we've already got an array, just append.
          if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
        }

        // Check for listener leak
        if (!existing.warned) {
          m = $getMaxListeners(target);
          if (m && m > 0 && existing.length > m) {
            existing.warned = true;
            var w = new Error('Possible EventEmitter memory leak detected. ' +
                                existing.length + ' ' + type + ' listeners added. ' +
                                'Use emitter.setMaxListeners() to increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            emitWarning(w);
          }
        }
      }

      return target;
    }
    function emitWarning(e) {
      typeof console.warn === 'function' ? console.warn(e) : console.log(e);
    }
    EventEmitter.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };

    function _onceWrap(target, type, listener) {
      var fired = false;
      function g() {
        target.removeListener(type, g);
        if (!fired) {
          fired = true;
          listener.apply(target, arguments);
        }
      }
      g.listener = listener;
      return g;
    }

    EventEmitter.prototype.once = function once(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };

    EventEmitter.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;

          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');

          events = this._events;
          if (!events)
            return this;

          list = events[type];
          if (!list)
            return this;

          if (list === listener || (list.listener && list.listener === listener)) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length; i-- > 0;) {
              if (list[i] === listener ||
                  (list[i].listener && list[i].listener === listener)) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }

            if (position < 0)
              return this;

            if (list.length === 1) {
              list[0] = undefined;
              if (--this._eventsCount === 0) {
                this._events = new EventHandlers();
                return this;
              } else {
                delete events[type];
              }
            } else {
              spliceOne(list, position);
            }

            if (events.removeListener)
              this.emit('removeListener', type, originalListener || listener);
          }

          return this;
        };
        
    // Alias for removeListener added in NodeJS 10.0
    // https://nodejs.org/api/events.html#events_emitter_off_eventname_listener
    EventEmitter.prototype.off = function(type, listener){
        return this.removeListener(type, listener);
    };

    EventEmitter.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events;

          events = this._events;
          if (!events)
            return this;

          // not listening for removeListener, no need to emit
          if (!events.removeListener) {
            if (arguments.length === 0) {
              this._events = new EventHandlers();
              this._eventsCount = 0;
            } else if (events[type]) {
              if (--this._eventsCount === 0)
                this._events = new EventHandlers();
              else
                delete events[type];
            }
            return this;
          }

          // emit removeListener for all listeners on all events
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            for (var i = 0, key; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = new EventHandlers();
            this._eventsCount = 0;
            return this;
          }

          listeners = events[type];

          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners) {
            // LIFO order
            do {
              this.removeListener(type, listeners[listeners.length - 1]);
            } while (listeners[0]);
          }

          return this;
        };

    EventEmitter.prototype.listeners = function listeners(type) {
      var evlistener;
      var ret;
      var events = this._events;

      if (!events)
        ret = [];
      else {
        evlistener = events[type];
        if (!evlistener)
          ret = [];
        else if (typeof evlistener === 'function')
          ret = [evlistener.listener || evlistener];
        else
          ret = unwrapListeners(evlistener);
      }

      return ret;
    };

    EventEmitter.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };

    EventEmitter.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;

      if (events) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener) {
          return evlistener.length;
        }
      }

      return 0;
    }

    EventEmitter.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
    };

    // About 1.5x faster than the two-arg version of Array#splice().
    function spliceOne(list, index) {
      for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
        list[i] = list[k];
      list.pop();
    }

    function arrayClone(arr, i) {
      var copy = new Array(i);
      while (i--)
        copy[i] = arr[i];
      return copy;
    }

    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }

    var _Game_instances, _Game_setDates, _Game_newTurn;
    const tokenPrefix = 'EF41', tokenVersion = 1, rlSigil = 6; // highest 5-bit coded value, so values 0..3 (& 4,5) are unchanged by rlencode
    class Game extends EventEmitter {
        constructor(token) {
            super();
            _Game_instances.add(this);
            this.scenario = 0 /* ScenarioKey.apx */;
            this.human = 0 /* PlayerKey.German */;
            this.turn = 0; // 0-based turn index
            // helpers derived from turn
            this.date = new Date('1941/6/22');
            this.month = 5 /* MonthKey.Jun */;
            this.weather = 0 /* WeatherKey.dry */;
            // flags
            this.handicap = 0; // whether the game is handicapped
            this.extras = 1; // display extras like labels, health, zoc
            this.debug = 0; // whether to display debug info for Russian units
            this.on('message', (typ, obj) => {
                if (this.listenerCount('message') == 1) {
                    let s = typeof obj === 'string' ? obj : obj.join('\n'), logger = (typ == 'error' ? console.warn : console.info);
                    logger(s);
                }
            });
            let memento = undefined, seed = undefined;
            if (token != null) {
                let payload = unwrap64(token, tokenPrefix);
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
                this.extras = memento.shift();
                this.debug = memento.shift();
            }
            this.mapboard = new Mapboard(this, memento);
            this.oob = new Oob(this, memento);
            this.rand = lfsr24(seed);
            if (memento && memento.length != 0)
                throw new Error("Game: unexpected save data overflow");
        }
        get memento() {
            // return a list of uint representing the state of the game
            return [
                tokenVersion,
                this.scenario,
                this.human,
                this.turn,
                +this.handicap,
                +this.extras,
                +this.debug,
            ].concat(this.mapboard.memento, this.oob.memento);
        }
        get token() {
            let payload = [].concat(bitsencode(this.rand.state(), 24), fibencode(rlencode(this.memento, rlSigil)));
            return wrap64(payload, tokenPrefix);
        }
        start() {
            __classPrivateFieldGet(this, _Game_instances, "m", _Game_newTurn).call(this, true);
            return this;
        }
        nextTurn(delay) {
            // process the orders for this turn, if delay we tick asynchrnously,
            // otherwise we resolve synchronously
            // either way we proceed to subsequent startTurn or game end
            let tick = 0, g = this; // for the closure
            this.oob.scheduleOrders();
            // Set up for a sync or async loop
            function tickTock() {
                g.oob.executeOrders(tick);
                g.emit('game', 'tick', tick);
                let next = ++tick < 32 ? tickTock : () => __classPrivateFieldGet(g, _Game_instances, "m", _Game_newTurn).call(g);
                if (delay)
                    setTimeout(next, delay);
                else
                    next();
            }
            tickTock();
        }
        score(player) {
            // M.asm:4050
            let eastwest = sum(this.oob.map(u => u.score() * (u.player == player ? 1 : -1))), bonus = sum(this.mapboard.cities.filter(c => c.owner == player).map(c => c.points)), score = Math.max(0, eastwest) + bonus;
            if (this.handicap)
                score >>= 1;
            return score;
        }
    }
    _Game_instances = new WeakSet(), _Game_setDates = function _Game_setDates(start) {
        let dt = new Date(start);
        this.date = new Date(dt.setDate(dt.getDate() + 7 * this.turn));
        this.month = this.date.getMonth(); // note JS getMonth is 0-indexed
        this.weather = monthdata[this.month].weather;
    }, _Game_newTurn = function _Game_newTurn(initialize = false) {
        if (!initialize)
            this.turn++;
        __classPrivateFieldGet(this, _Game_instances, "m", _Game_setDates).call(this, new Date(scenarios[this.scenario].start));
        this.mapboard.newTurn(initialize);
        this.oob.newTurn(initialize);
        this.emit('game', 'turn', this);
    };

    var noop = {value: () => {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames$1(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames$1(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get$1(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set$1(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    var xhtml = "http://www.w3.org/1999/xhtml";

    var namespaces = {
      svg: "http://www.w3.org/2000/svg",
      xhtml: xhtml,
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function namespace(name) {
      var prefix = name += "", i = prefix.indexOf(":");
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
    }

    function creatorInherit(name) {
      return function() {
        var document = this.ownerDocument,
            uri = this.namespaceURI;
        return uri === xhtml && document.documentElement.namespaceURI === xhtml
            ? document.createElement(name)
            : document.createElementNS(uri, name);
      };
    }

    function creatorFixed(fullname) {
      return function() {
        return this.ownerDocument.createElementNS(fullname.space, fullname.local);
      };
    }

    function creator(name) {
      var fullname = namespace(name);
      return (fullname.local
          ? creatorFixed
          : creatorInherit)(fullname);
    }

    function none() {}

    function selector(selector) {
      return selector == null ? none : function() {
        return this.querySelector(selector);
      };
    }

    function selection_select(select) {
      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
          }
        }
      }

      return new Selection$1(subgroups, this._parents);
    }

    // Given something array like (or null), returns something that is strictly an
    // array. This is used to ensure that array-like objects passed to d3.selectAll
    // or selection.selectAll are converted into proper arrays when creating a
    // selection; we don’t ever want to create a selection backed by a live
    // HTMLCollection or NodeList. However, note that selection.selectAll will use a
    // static NodeList as a group, since it safely derived from querySelectorAll.
    function array(x) {
      return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
    }

    function empty() {
      return [];
    }

    function selectorAll(selector) {
      return selector == null ? empty : function() {
        return this.querySelectorAll(selector);
      };
    }

    function arrayAll(select) {
      return function() {
        return array(select.apply(this, arguments));
      };
    }

    function selection_selectAll(select) {
      if (typeof select === "function") select = arrayAll(select);
      else select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            subgroups.push(select.call(node, node.__data__, i, group));
            parents.push(node);
          }
        }
      }

      return new Selection$1(subgroups, parents);
    }

    function matcher(selector) {
      return function() {
        return this.matches(selector);
      };
    }

    function childMatcher(selector) {
      return function(node) {
        return node.matches(selector);
      };
    }

    var find = Array.prototype.find;

    function childFind(match) {
      return function() {
        return find.call(this.children, match);
      };
    }

    function childFirst() {
      return this.firstElementChild;
    }

    function selection_selectChild(match) {
      return this.select(match == null ? childFirst
          : childFind(typeof match === "function" ? match : childMatcher(match)));
    }

    var filter = Array.prototype.filter;

    function children() {
      return Array.from(this.children);
    }

    function childrenFilter(match) {
      return function() {
        return filter.call(this.children, match);
      };
    }

    function selection_selectChildren(match) {
      return this.selectAll(match == null ? children
          : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
    }

    function selection_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Selection$1(subgroups, this._parents);
    }

    function sparse(update) {
      return new Array(update.length);
    }

    function selection_enter() {
      return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
    }

    function EnterNode(parent, datum) {
      this.ownerDocument = parent.ownerDocument;
      this.namespaceURI = parent.namespaceURI;
      this._next = null;
      this._parent = parent;
      this.__data__ = datum;
    }

    EnterNode.prototype = {
      constructor: EnterNode,
      appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
      insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
      querySelector: function(selector) { return this._parent.querySelector(selector); },
      querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
    };

    function constant$1(x) {
      return function() {
        return x;
      };
    }

    function bindIndex(parent, group, enter, update, exit, data) {
      var i = 0,
          node,
          groupLength = group.length,
          dataLength = data.length;

      // Put any non-null nodes that fit into update.
      // Put any null nodes into enter.
      // Put any remaining data into enter.
      for (; i < dataLength; ++i) {
        if (node = group[i]) {
          node.__data__ = data[i];
          update[i] = node;
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Put any non-null nodes that don’t fit into exit.
      for (; i < groupLength; ++i) {
        if (node = group[i]) {
          exit[i] = node;
        }
      }
    }

    function bindKey(parent, group, enter, update, exit, data, key) {
      var i,
          node,
          nodeByKeyValue = new Map,
          groupLength = group.length,
          dataLength = data.length,
          keyValues = new Array(groupLength),
          keyValue;

      // Compute the key for each node.
      // If multiple nodes have the same key, the duplicates are added to exit.
      for (i = 0; i < groupLength; ++i) {
        if (node = group[i]) {
          keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
          if (nodeByKeyValue.has(keyValue)) {
            exit[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
        }
      }

      // Compute the key for each datum.
      // If there a node associated with this key, join and add it to update.
      // If there is not (or the key is a duplicate), add it to enter.
      for (i = 0; i < dataLength; ++i) {
        keyValue = key.call(parent, data[i], i, data) + "";
        if (node = nodeByKeyValue.get(keyValue)) {
          update[i] = node;
          node.__data__ = data[i];
          nodeByKeyValue.delete(keyValue);
        } else {
          enter[i] = new EnterNode(parent, data[i]);
        }
      }

      // Add any remaining nodes that were not bound to data to exit.
      for (i = 0; i < groupLength; ++i) {
        if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
          exit[i] = node;
        }
      }
    }

    function datum(node) {
      return node.__data__;
    }

    function selection_data(value, key) {
      if (!arguments.length) return Array.from(this, datum);

      var bind = key ? bindKey : bindIndex,
          parents = this._parents,
          groups = this._groups;

      if (typeof value !== "function") value = constant$1(value);

      for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
        var parent = parents[j],
            group = groups[j],
            groupLength = group.length,
            data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
            dataLength = data.length,
            enterGroup = enter[j] = new Array(dataLength),
            updateGroup = update[j] = new Array(dataLength),
            exitGroup = exit[j] = new Array(groupLength);

        bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

        // Now connect the enter nodes to their following update node, such that
        // appendChild can insert the materialized enter node before this node,
        // rather than at the end of the parent node.
        for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
          if (previous = enterGroup[i0]) {
            if (i0 >= i1) i1 = i0 + 1;
            while (!(next = updateGroup[i1]) && ++i1 < dataLength);
            previous._next = next || null;
          }
        }
      }

      update = new Selection$1(update, parents);
      update._enter = enter;
      update._exit = exit;
      return update;
    }

    // Given some data, this returns an array-like view of it: an object that
    // exposes a length property and allows numeric indexing. Note that unlike
    // selectAll, this isn’t worried about “live” collections because the resulting
    // array will only be used briefly while data is being bound. (It is possible to
    // cause the data to change while iterating by using a key function, but please
    // don’t; we’d rather avoid a gratuitous copy.)
    function arraylike(data) {
      return typeof data === "object" && "length" in data
        ? data // Array, TypedArray, NodeList, array-like
        : Array.from(data); // Map, Set, iterable, string, or anything else
    }

    function selection_exit() {
      return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
    }

    function selection_join(onenter, onupdate, onexit) {
      var enter = this.enter(), update = this, exit = this.exit();
      if (typeof onenter === "function") {
        enter = onenter(enter);
        if (enter) enter = enter.selection();
      } else {
        enter = enter.append(onenter + "");
      }
      if (onupdate != null) {
        update = onupdate(update);
        if (update) update = update.selection();
      }
      if (onexit == null) exit.remove(); else onexit(exit);
      return enter && update ? enter.merge(update).order() : update;
    }

    function selection_merge(context) {
      var selection = context.selection ? context.selection() : context;

      for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Selection$1(merges, this._parents);
    }

    function selection_order() {

      for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
        for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
          if (node = group[i]) {
            if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
            next = node;
          }
        }
      }

      return this;
    }

    function selection_sort(compare) {
      if (!compare) compare = ascending;

      function compareNode(a, b) {
        return a && b ? compare(a.__data__, b.__data__) : !a - !b;
      }

      for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            sortgroup[i] = node;
          }
        }
        sortgroup.sort(compareNode);
      }

      return new Selection$1(sortgroups, this._parents).order();
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function selection_call() {
      var callback = arguments[0];
      arguments[0] = this;
      callback.apply(null, arguments);
      return this;
    }

    function selection_nodes() {
      return Array.from(this);
    }

    function selection_node() {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
          var node = group[i];
          if (node) return node;
        }
      }

      return null;
    }

    function selection_size() {
      let size = 0;
      for (const node of this) ++size; // eslint-disable-line no-unused-vars
      return size;
    }

    function selection_empty() {
      return !this.node();
    }

    function selection_each(callback) {

      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) callback.call(node, node.__data__, i, group);
        }
      }

      return this;
    }

    function attrRemove$1(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS$1(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant$1(name, value) {
      return function() {
        this.setAttribute(name, value);
      };
    }

    function attrConstantNS$1(fullname, value) {
      return function() {
        this.setAttributeNS(fullname.space, fullname.local, value);
      };
    }

    function attrFunction$1(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttribute(name);
        else this.setAttribute(name, v);
      };
    }

    function attrFunctionNS$1(fullname, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
        else this.setAttributeNS(fullname.space, fullname.local, v);
      };
    }

    function selection_attr(name, value) {
      var fullname = namespace(name);

      if (arguments.length < 2) {
        var node = this.node();
        return fullname.local
            ? node.getAttributeNS(fullname.space, fullname.local)
            : node.getAttribute(fullname);
      }

      return this.each((value == null
          ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
          ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
          : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
    }

    function defaultView(node) {
      return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
          || (node.document && node) // node is a Window
          || node.defaultView; // node is a Document
    }

    function styleRemove$1(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant$1(name, value, priority) {
      return function() {
        this.style.setProperty(name, value, priority);
      };
    }

    function styleFunction$1(name, value, priority) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) this.style.removeProperty(name);
        else this.style.setProperty(name, v, priority);
      };
    }

    function selection_style(name, value, priority) {
      return arguments.length > 1
          ? this.each((value == null
                ? styleRemove$1 : typeof value === "function"
                ? styleFunction$1
                : styleConstant$1)(name, value, priority == null ? "" : priority))
          : styleValue(this.node(), name);
    }

    function styleValue(node, name) {
      return node.style.getPropertyValue(name)
          || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
    }

    function propertyRemove(name) {
      return function() {
        delete this[name];
      };
    }

    function propertyConstant(name, value) {
      return function() {
        this[name] = value;
      };
    }

    function propertyFunction(name, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (v == null) delete this[name];
        else this[name] = v;
      };
    }

    function selection_property(name, value) {
      return arguments.length > 1
          ? this.each((value == null
              ? propertyRemove : typeof value === "function"
              ? propertyFunction
              : propertyConstant)(name, value))
          : this.node()[name];
    }

    function classArray(string) {
      return string.trim().split(/^|\s+/);
    }

    function classList(node) {
      return node.classList || new ClassList(node);
    }

    function ClassList(node) {
      this._node = node;
      this._names = classArray(node.getAttribute("class") || "");
    }

    ClassList.prototype = {
      add: function(name) {
        var i = this._names.indexOf(name);
        if (i < 0) {
          this._names.push(name);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      remove: function(name) {
        var i = this._names.indexOf(name);
        if (i >= 0) {
          this._names.splice(i, 1);
          this._node.setAttribute("class", this._names.join(" "));
        }
      },
      contains: function(name) {
        return this._names.indexOf(name) >= 0;
      }
    };

    function classedAdd(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.add(names[i]);
    }

    function classedRemove(node, names) {
      var list = classList(node), i = -1, n = names.length;
      while (++i < n) list.remove(names[i]);
    }

    function classedTrue(names) {
      return function() {
        classedAdd(this, names);
      };
    }

    function classedFalse(names) {
      return function() {
        classedRemove(this, names);
      };
    }

    function classedFunction(names, value) {
      return function() {
        (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
      };
    }

    function selection_classed(name, value) {
      var names = classArray(name + "");

      if (arguments.length < 2) {
        var list = classList(this.node()), i = -1, n = names.length;
        while (++i < n) if (!list.contains(names[i])) return false;
        return true;
      }

      return this.each((typeof value === "function"
          ? classedFunction : value
          ? classedTrue
          : classedFalse)(names, value));
    }

    function textRemove() {
      this.textContent = "";
    }

    function textConstant$1(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction$1(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.textContent = v == null ? "" : v;
      };
    }

    function selection_text(value) {
      return arguments.length
          ? this.each(value == null
              ? textRemove : (typeof value === "function"
              ? textFunction$1
              : textConstant$1)(value))
          : this.node().textContent;
    }

    function htmlRemove() {
      this.innerHTML = "";
    }

    function htmlConstant(value) {
      return function() {
        this.innerHTML = value;
      };
    }

    function htmlFunction(value) {
      return function() {
        var v = value.apply(this, arguments);
        this.innerHTML = v == null ? "" : v;
      };
    }

    function selection_html(value) {
      return arguments.length
          ? this.each(value == null
              ? htmlRemove : (typeof value === "function"
              ? htmlFunction
              : htmlConstant)(value))
          : this.node().innerHTML;
    }

    function raise() {
      if (this.nextSibling) this.parentNode.appendChild(this);
    }

    function selection_raise() {
      return this.each(raise);
    }

    function lower() {
      if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
    }

    function selection_lower() {
      return this.each(lower);
    }

    function selection_append(name) {
      var create = typeof name === "function" ? name : creator(name);
      return this.select(function() {
        return this.appendChild(create.apply(this, arguments));
      });
    }

    function constantNull() {
      return null;
    }

    function selection_insert(name, before) {
      var create = typeof name === "function" ? name : creator(name),
          select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
      return this.select(function() {
        return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
      });
    }

    function remove() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    }

    function selection_remove() {
      return this.each(remove);
    }

    function selection_cloneShallow() {
      var clone = this.cloneNode(false), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_cloneDeep() {
      var clone = this.cloneNode(true), parent = this.parentNode;
      return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
    }

    function selection_clone(deep) {
      return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
    }

    function selection_datum(value) {
      return arguments.length
          ? this.property("__data__", value)
          : this.node().__data__;
    }

    function contextListener(listener) {
      return function(event) {
        listener.call(this, event, this.__data__);
      };
    }

    function parseTypenames(typenames) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        return {type: t, name: name};
      });
    }

    function onRemove(typename) {
      return function() {
        var on = this.__on;
        if (!on) return;
        for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
          if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.options);
          } else {
            on[++i] = o;
          }
        }
        if (++i) on.length = i;
        else delete this.__on;
      };
    }

    function onAdd(typename, value, options) {
      return function() {
        var on = this.__on, o, listener = contextListener(value);
        if (on) for (var j = 0, m = on.length; j < m; ++j) {
          if ((o = on[j]).type === typename.type && o.name === typename.name) {
            this.removeEventListener(o.type, o.listener, o.options);
            this.addEventListener(o.type, o.listener = listener, o.options = options);
            o.value = value;
            return;
          }
        }
        this.addEventListener(typename.type, listener, options);
        o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
        if (!on) this.__on = [o];
        else on.push(o);
      };
    }

    function selection_on(typename, value, options) {
      var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

      if (arguments.length < 2) {
        var on = this.node().__on;
        if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
          for (i = 0, o = on[j]; i < n; ++i) {
            if ((t = typenames[i]).type === o.type && t.name === o.name) {
              return o.value;
            }
          }
        }
        return;
      }

      on = value ? onAdd : onRemove;
      for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
      return this;
    }

    function dispatchEvent(node, type, params) {
      var window = defaultView(node),
          event = window.CustomEvent;

      if (typeof event === "function") {
        event = new event(type, params);
      } else {
        event = window.document.createEvent("Event");
        if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
        else event.initEvent(type, false, false);
      }

      node.dispatchEvent(event);
    }

    function dispatchConstant(type, params) {
      return function() {
        return dispatchEvent(this, type, params);
      };
    }

    function dispatchFunction(type, params) {
      return function() {
        return dispatchEvent(this, type, params.apply(this, arguments));
      };
    }

    function selection_dispatch(type, params) {
      return this.each((typeof params === "function"
          ? dispatchFunction
          : dispatchConstant)(type, params));
    }

    function* selection_iterator() {
      for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
        for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
          if (node = group[i]) yield node;
        }
      }
    }

    var root = [null];

    function Selection$1(groups, parents) {
      this._groups = groups;
      this._parents = parents;
    }

    function selection() {
      return new Selection$1([[document.documentElement]], root);
    }

    function selection_selection() {
      return this;
    }

    Selection$1.prototype = selection.prototype = {
      constructor: Selection$1,
      select: selection_select,
      selectAll: selection_selectAll,
      selectChild: selection_selectChild,
      selectChildren: selection_selectChildren,
      filter: selection_filter,
      data: selection_data,
      enter: selection_enter,
      exit: selection_exit,
      join: selection_join,
      merge: selection_merge,
      selection: selection_selection,
      order: selection_order,
      sort: selection_sort,
      call: selection_call,
      nodes: selection_nodes,
      node: selection_node,
      size: selection_size,
      empty: selection_empty,
      each: selection_each,
      attr: selection_attr,
      style: selection_style,
      property: selection_property,
      classed: selection_classed,
      text: selection_text,
      html: selection_html,
      raise: selection_raise,
      lower: selection_lower,
      append: selection_append,
      insert: selection_insert,
      remove: selection_remove,
      clone: selection_clone,
      datum: selection_datum,
      on: selection_on,
      dispatch: selection_dispatch,
      [Symbol.iterator]: selection_iterator
    };

    function select(selector) {
      return typeof selector === "string"
          ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
          : new Selection$1([[selector]], root);
    }

    function selectAll(selector) {
      return typeof selector === "string"
          ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
          : new Selection$1([array(selector)], root);
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
        reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
        reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
        reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
        reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
        reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHex8: color_formatHex8,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHex8() {
      return this.rgb().formatHex8();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb() {
        return this;
      },
      clamp() {
        return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
      },
      displayable() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatHex8: rgb_formatHex8,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
    }

    function rgb_formatHex8() {
      return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
    }

    function rgb_formatRgb() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
    }

    function clampa(opacity) {
      return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
    }

    function clampi(value) {
      return Math.max(0, Math.min(255, Math.round(value) || 0));
    }

    function hex(value) {
      value = clampi(value);
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      clamp() {
        return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
      },
      displayable() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl() {
        const a = clampa(this.opacity);
        return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
      }
    }));

    function clamph(value) {
      value = (value || 0) % 360;
      return value < 0 ? value + 360 : value;
    }

    function clampt(value) {
      return Math.max(0, Math.min(1, value || 0));
    }

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    var constant = x => () => x;

    function linear$1(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear$1(a, d) : constant(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    var degrees = 180 / Math.PI;

    var identity = {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      scaleX: 1,
      scaleY: 1
    };

    function decompose(a, b, c, d, e, f) {
      var scaleX, scaleY, skewX;
      if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
      if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
      if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
      if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
      return {
        translateX: e,
        translateY: f,
        rotate: Math.atan2(b, a) * degrees,
        skewX: Math.atan(skewX) * degrees,
        scaleX: scaleX,
        scaleY: scaleY
      };
    }

    var svgNode;

    /* eslint-disable no-undef */
    function parseCss(value) {
      const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
      return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
    }

    function parseSvg(value) {
      if (value == null) return identity;
      if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
      svgNode.setAttribute("transform", value);
      if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
      value = value.matrix;
      return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
    }

    function interpolateTransform(parse, pxComma, pxParen, degParen) {

      function pop(s) {
        return s.length ? s.pop() + " " : "";
      }

      function translate(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push("translate(", null, pxComma, null, pxParen);
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb || yb) {
          s.push("translate(" + xb + pxComma + yb + pxParen);
        }
      }

      function rotate(a, b, s, q) {
        if (a !== b) {
          if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
          q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "rotate(" + b + degParen);
        }
      }

      function skewX(a, b, s, q) {
        if (a !== b) {
          q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
        } else if (b) {
          s.push(pop(s) + "skewX(" + b + degParen);
        }
      }

      function scale(xa, ya, xb, yb, s, q) {
        if (xa !== xb || ya !== yb) {
          var i = s.push(pop(s) + "scale(", null, ",", null, ")");
          q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
        } else if (xb !== 1 || yb !== 1) {
          s.push(pop(s) + "scale(" + xb + "," + yb + ")");
        }
      }

      return function(a, b) {
        var s = [], // string constants and placeholders
            q = []; // number interpolators
        a = parse(a), b = parse(b);
        translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
        rotate(a.rotate, b.rotate, s, q);
        skewX(a.skewX, b.skewX, s, q);
        scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
        a = b = null; // gc
        return function(t) {
          var i = -1, n = q.length, o;
          while (++i < n) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        };
      };
    }

    var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
    var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

    var frame = 0, // is an animation frame pending?
        timeout$1 = 0, // is a timeout pending?
        interval = 0, // are any timers active?
        pokeDelay = 1000, // how frequently we check for clock skew
        taskHead,
        taskTail,
        clockLast = 0,
        clockNow = 0,
        clockSkew = 0,
        clock = typeof performance === "object" && performance.now ? performance : Date,
        setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

    function now() {
      return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
    }

    function clearNow() {
      clockNow = 0;
    }

    function Timer() {
      this._call =
      this._time =
      this._next = null;
    }

    Timer.prototype = timer.prototype = {
      constructor: Timer,
      restart: function(callback, delay, time) {
        if (typeof callback !== "function") throw new TypeError("callback is not a function");
        time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
        if (!this._next && taskTail !== this) {
          if (taskTail) taskTail._next = this;
          else taskHead = this;
          taskTail = this;
        }
        this._call = callback;
        this._time = time;
        sleep();
      },
      stop: function() {
        if (this._call) {
          this._call = null;
          this._time = Infinity;
          sleep();
        }
      }
    };

    function timer(callback, delay, time) {
      var t = new Timer;
      t.restart(callback, delay, time);
      return t;
    }

    function timerFlush() {
      now(); // Get the current time, if not already set.
      ++frame; // Pretend we’ve set an alarm, if we haven’t already.
      var t = taskHead, e;
      while (t) {
        if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
        t = t._next;
      }
      --frame;
    }

    function wake() {
      clockNow = (clockLast = clock.now()) + clockSkew;
      frame = timeout$1 = 0;
      try {
        timerFlush();
      } finally {
        frame = 0;
        nap();
        clockNow = 0;
      }
    }

    function poke() {
      var now = clock.now(), delay = now - clockLast;
      if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
    }

    function nap() {
      var t0, t1 = taskHead, t2, time = Infinity;
      while (t1) {
        if (t1._call) {
          if (time > t1._time) time = t1._time;
          t0 = t1, t1 = t1._next;
        } else {
          t2 = t1._next, t1._next = null;
          t1 = t0 ? t0._next = t2 : taskHead = t2;
        }
      }
      taskTail = t0;
      sleep(time);
    }

    function sleep(time) {
      if (frame) return; // Soonest alarm already set, or will be.
      if (timeout$1) timeout$1 = clearTimeout(timeout$1);
      var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
      if (delay > 24) {
        if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
        if (interval) interval = clearInterval(interval);
      } else {
        if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
        frame = 1, setFrame(wake);
      }
    }

    function timeout(callback, delay, time) {
      var t = new Timer;
      delay = delay == null ? 0 : +delay;
      t.restart(elapsed => {
        t.stop();
        callback(elapsed + delay);
      }, delay, time);
      return t;
    }

    var emptyOn = dispatch("start", "end", "cancel", "interrupt");
    var emptyTween = [];

    var CREATED = 0;
    var SCHEDULED = 1;
    var STARTING = 2;
    var STARTED = 3;
    var RUNNING = 4;
    var ENDING = 5;
    var ENDED = 6;

    function schedule(node, name, id, index, group, timing) {
      var schedules = node.__transition;
      if (!schedules) node.__transition = {};
      else if (id in schedules) return;
      create(node, id, {
        name: name,
        index: index, // For context during callback.
        group: group, // For context during callback.
        on: emptyOn,
        tween: emptyTween,
        time: timing.time,
        delay: timing.delay,
        duration: timing.duration,
        ease: timing.ease,
        timer: null,
        state: CREATED
      });
    }

    function init(node, id) {
      var schedule = get(node, id);
      if (schedule.state > CREATED) throw new Error("too late; already scheduled");
      return schedule;
    }

    function set(node, id) {
      var schedule = get(node, id);
      if (schedule.state > STARTED) throw new Error("too late; already running");
      return schedule;
    }

    function get(node, id) {
      var schedule = node.__transition;
      if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
      return schedule;
    }

    function create(node, id, self) {
      var schedules = node.__transition,
          tween;

      // Initialize the self timer when the transition is created.
      // Note the actual delay is not known until the first callback!
      schedules[id] = self;
      self.timer = timer(schedule, 0, self.time);

      function schedule(elapsed) {
        self.state = SCHEDULED;
        self.timer.restart(start, self.delay, self.time);

        // If the elapsed delay is less than our first sleep, start immediately.
        if (self.delay <= elapsed) start(elapsed - self.delay);
      }

      function start(elapsed) {
        var i, j, n, o;

        // If the state is not SCHEDULED, then we previously errored on start.
        if (self.state !== SCHEDULED) return stop();

        for (i in schedules) {
          o = schedules[i];
          if (o.name !== self.name) continue;

          // While this element already has a starting transition during this frame,
          // defer starting an interrupting transition until that transition has a
          // chance to tick (and possibly end); see d3/d3-transition#54!
          if (o.state === STARTED) return timeout(start);

          // Interrupt the active transition, if any.
          if (o.state === RUNNING) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("interrupt", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }

          // Cancel any pre-empted transitions.
          else if (+i < id) {
            o.state = ENDED;
            o.timer.stop();
            o.on.call("cancel", node, node.__data__, o.index, o.group);
            delete schedules[i];
          }
        }

        // Defer the first tick to end of the current frame; see d3/d3#1576.
        // Note the transition may be canceled after start and before the first tick!
        // Note this must be scheduled before the start event; see d3/d3-transition#16!
        // Assuming this is successful, subsequent callbacks go straight to tick.
        timeout(function() {
          if (self.state === STARTED) {
            self.state = RUNNING;
            self.timer.restart(tick, self.delay, self.time);
            tick(elapsed);
          }
        });

        // Dispatch the start event.
        // Note this must be done before the tween are initialized.
        self.state = STARTING;
        self.on.call("start", node, node.__data__, self.index, self.group);
        if (self.state !== STARTING) return; // interrupted
        self.state = STARTED;

        // Initialize the tween, deleting null tween.
        tween = new Array(n = self.tween.length);
        for (i = 0, j = -1; i < n; ++i) {
          if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
            tween[++j] = o;
          }
        }
        tween.length = j + 1;
      }

      function tick(elapsed) {
        var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
            i = -1,
            n = tween.length;

        while (++i < n) {
          tween[i].call(node, t);
        }

        // Dispatch the end event.
        if (self.state === ENDING) {
          self.on.call("end", node, node.__data__, self.index, self.group);
          stop();
        }
      }

      function stop() {
        self.state = ENDED;
        self.timer.stop();
        delete schedules[id];
        for (var i in schedules) return; // eslint-disable-line no-unused-vars
        delete node.__transition;
      }
    }

    function interrupt(node, name) {
      var schedules = node.__transition,
          schedule,
          active,
          empty = true,
          i;

      if (!schedules) return;

      name = name == null ? null : name + "";

      for (i in schedules) {
        if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
        active = schedule.state > STARTING && schedule.state < ENDING;
        schedule.state = ENDED;
        schedule.timer.stop();
        schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
        delete schedules[i];
      }

      if (empty) delete node.__transition;
    }

    function selection_interrupt(name) {
      return this.each(function() {
        interrupt(this, name);
      });
    }

    function tweenRemove(id, name) {
      var tween0, tween1;
      return function() {
        var schedule = set(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = tween0 = tween;
          for (var i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1 = tween1.slice();
              tween1.splice(i, 1);
              break;
            }
          }
        }

        schedule.tween = tween1;
      };
    }

    function tweenFunction(id, name, value) {
      var tween0, tween1;
      if (typeof value !== "function") throw new Error;
      return function() {
        var schedule = set(this, id),
            tween = schedule.tween;

        // If this node shared tween with the previous node,
        // just assign the updated shared tween and we’re done!
        // Otherwise, copy-on-write.
        if (tween !== tween0) {
          tween1 = (tween0 = tween).slice();
          for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
            if (tween1[i].name === name) {
              tween1[i] = t;
              break;
            }
          }
          if (i === n) tween1.push(t);
        }

        schedule.tween = tween1;
      };
    }

    function transition_tween(name, value) {
      var id = this._id;

      name += "";

      if (arguments.length < 2) {
        var tween = get(this.node(), id).tween;
        for (var i = 0, n = tween.length, t; i < n; ++i) {
          if ((t = tween[i]).name === name) {
            return t.value;
          }
        }
        return null;
      }

      return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
    }

    function tweenValue(transition, name, value) {
      var id = transition._id;

      transition.each(function() {
        var schedule = set(this, id);
        (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
      });

      return function(node) {
        return get(node, id).value[name];
      };
    }

    function interpolate(a, b) {
      var c;
      return (typeof b === "number" ? interpolateNumber
          : b instanceof color ? interpolateRgb
          : (c = color(b)) ? (b = c, interpolateRgb)
          : interpolateString)(a, b);
    }

    function attrRemove(name) {
      return function() {
        this.removeAttribute(name);
      };
    }

    function attrRemoveNS(fullname) {
      return function() {
        this.removeAttributeNS(fullname.space, fullname.local);
      };
    }

    function attrConstant(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttribute(name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrConstantNS(fullname, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = this.getAttributeNS(fullname.space, fullname.local);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function attrFunction(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttribute(name);
        string0 = this.getAttribute(name);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function attrFunctionNS(fullname, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0, value1 = value(this), string1;
        if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
        string0 = this.getAttributeNS(fullname.space, fullname.local);
        string1 = value1 + "";
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function transition_attr(name, value) {
      var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
      return this.attrTween(name, typeof value === "function"
          ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
          : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
          : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
    }

    function attrInterpolate(name, i) {
      return function(t) {
        this.setAttribute(name, i.call(this, t));
      };
    }

    function attrInterpolateNS(fullname, i) {
      return function(t) {
        this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
      };
    }

    function attrTweenNS(fullname, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function attrTween(name, value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_attrTween(name, value) {
      var key = "attr." + name;
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      var fullname = namespace(name);
      return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
    }

    function delayFunction(id, value) {
      return function() {
        init(this, id).delay = +value.apply(this, arguments);
      };
    }

    function delayConstant(id, value) {
      return value = +value, function() {
        init(this, id).delay = value;
      };
    }

    function transition_delay(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? delayFunction
              : delayConstant)(id, value))
          : get(this.node(), id).delay;
    }

    function durationFunction(id, value) {
      return function() {
        set(this, id).duration = +value.apply(this, arguments);
      };
    }

    function durationConstant(id, value) {
      return value = +value, function() {
        set(this, id).duration = value;
      };
    }

    function transition_duration(value) {
      var id = this._id;

      return arguments.length
          ? this.each((typeof value === "function"
              ? durationFunction
              : durationConstant)(id, value))
          : get(this.node(), id).duration;
    }

    function easeConstant(id, value) {
      if (typeof value !== "function") throw new Error;
      return function() {
        set(this, id).ease = value;
      };
    }

    function transition_ease(value) {
      var id = this._id;

      return arguments.length
          ? this.each(easeConstant(id, value))
          : get(this.node(), id).ease;
    }

    function easeVarying(id, value) {
      return function() {
        var v = value.apply(this, arguments);
        if (typeof v !== "function") throw new Error;
        set(this, id).ease = v;
      };
    }

    function transition_easeVarying(value) {
      if (typeof value !== "function") throw new Error;
      return this.each(easeVarying(this._id, value));
    }

    function transition_filter(match) {
      if (typeof match !== "function") match = matcher(match);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
          if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
            subgroup.push(node);
          }
        }
      }

      return new Transition(subgroups, this._parents, this._name, this._id);
    }

    function transition_merge(transition) {
      if (transition._id !== this._id) throw new Error;

      for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
        for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
          if (node = group0[i] || group1[i]) {
            merge[i] = node;
          }
        }
      }

      for (; j < m0; ++j) {
        merges[j] = groups0[j];
      }

      return new Transition(merges, this._parents, this._name, this._id);
    }

    function start$1(name) {
      return (name + "").trim().split(/^|\s+/).every(function(t) {
        var i = t.indexOf(".");
        if (i >= 0) t = t.slice(0, i);
        return !t || t === "start";
      });
    }

    function onFunction(id, name, listener) {
      var on0, on1, sit = start$1(name) ? init : set;
      return function() {
        var schedule = sit(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

        schedule.on = on1;
      };
    }

    function transition_on(name, listener) {
      var id = this._id;

      return arguments.length < 2
          ? get(this.node(), id).on.on(name)
          : this.each(onFunction(id, name, listener));
    }

    function removeFunction(id) {
      return function() {
        var parent = this.parentNode;
        for (var i in this.__transition) if (+i !== id) return;
        if (parent) parent.removeChild(this);
      };
    }

    function transition_remove() {
      return this.on("end.remove", removeFunction(this._id));
    }

    function transition_select(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selector(select);

      for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
          if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
            if ("__data__" in node) subnode.__data__ = node.__data__;
            subgroup[i] = subnode;
            schedule(subgroup[i], name, id, i, subgroup, get(node, id));
          }
        }
      }

      return new Transition(subgroups, this._parents, name, id);
    }

    function transition_selectAll(select) {
      var name = this._name,
          id = this._id;

      if (typeof select !== "function") select = selectorAll(select);

      for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
              if (child = children[k]) {
                schedule(child, name, id, k, children, inherit);
              }
            }
            subgroups.push(children);
            parents.push(node);
          }
        }
      }

      return new Transition(subgroups, parents, name, id);
    }

    var Selection = selection.prototype.constructor;

    function transition_selection() {
      return new Selection(this._groups, this._parents);
    }

    function styleNull(name, interpolate) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            string1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, string10 = string1);
      };
    }

    function styleRemove(name) {
      return function() {
        this.style.removeProperty(name);
      };
    }

    function styleConstant(name, interpolate, value1) {
      var string00,
          string1 = value1 + "",
          interpolate0;
      return function() {
        var string0 = styleValue(this, name);
        return string0 === string1 ? null
            : string0 === string00 ? interpolate0
            : interpolate0 = interpolate(string00 = string0, value1);
      };
    }

    function styleFunction(name, interpolate, value) {
      var string00,
          string10,
          interpolate0;
      return function() {
        var string0 = styleValue(this, name),
            value1 = value(this),
            string1 = value1 + "";
        if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
        return string0 === string1 ? null
            : string0 === string00 && string1 === string10 ? interpolate0
            : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
      };
    }

    function styleMaybeRemove(id, name) {
      var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
      return function() {
        var schedule = set(this, id),
            on = schedule.on,
            listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

        schedule.on = on1;
      };
    }

    function transition_style(name, value, priority) {
      var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
      return value == null ? this
          .styleTween(name, styleNull(name, i))
          .on("end.style." + name, styleRemove(name))
        : typeof value === "function" ? this
          .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
          .each(styleMaybeRemove(this._id, name))
        : this
          .styleTween(name, styleConstant(name, i, value), priority)
          .on("end.style." + name, null);
    }

    function styleInterpolate(name, i, priority) {
      return function(t) {
        this.style.setProperty(name, i.call(this, t), priority);
      };
    }

    function styleTween(name, value, priority) {
      var t, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
        return t;
      }
      tween._value = value;
      return tween;
    }

    function transition_styleTween(name, value, priority) {
      var key = "style." + (name += "");
      if (arguments.length < 2) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
    }

    function textConstant(value) {
      return function() {
        this.textContent = value;
      };
    }

    function textFunction(value) {
      return function() {
        var value1 = value(this);
        this.textContent = value1 == null ? "" : value1;
      };
    }

    function transition_text(value) {
      return this.tween("text", typeof value === "function"
          ? textFunction(tweenValue(this, "text", value))
          : textConstant(value == null ? "" : value + ""));
    }

    function textInterpolate(i) {
      return function(t) {
        this.textContent = i.call(this, t);
      };
    }

    function textTween(value) {
      var t0, i0;
      function tween() {
        var i = value.apply(this, arguments);
        if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
        return t0;
      }
      tween._value = value;
      return tween;
    }

    function transition_textTween(value) {
      var key = "text";
      if (arguments.length < 1) return (key = this.tween(key)) && key._value;
      if (value == null) return this.tween(key, null);
      if (typeof value !== "function") throw new Error;
      return this.tween(key, textTween(value));
    }

    function transition_transition() {
      var name = this._name,
          id0 = this._id,
          id1 = newId();

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            var inherit = get(node, id0);
            schedule(node, name, id1, i, group, {
              time: inherit.time + inherit.delay + inherit.duration,
              delay: 0,
              duration: inherit.duration,
              ease: inherit.ease
            });
          }
        }
      }

      return new Transition(groups, this._parents, name, id1);
    }

    function transition_end() {
      var on0, on1, that = this, id = that._id, size = that.size();
      return new Promise(function(resolve, reject) {
        var cancel = {value: reject},
            end = {value: function() { if (--size === 0) resolve(); }};

        that.each(function() {
          var schedule = set(this, id),
              on = schedule.on;

          // If this node shared a dispatch with the previous node,
          // just assign the updated shared dispatch and we’re done!
          // Otherwise, copy-on-write.
          if (on !== on0) {
            on1 = (on0 = on).copy();
            on1._.cancel.push(cancel);
            on1._.interrupt.push(cancel);
            on1._.end.push(end);
          }

          schedule.on = on1;
        });

        // The selection was empty, resolve end immediately
        if (size === 0) resolve();
      });
    }

    var id = 0;

    function Transition(groups, parents, name, id) {
      this._groups = groups;
      this._parents = parents;
      this._name = name;
      this._id = id;
    }

    function newId() {
      return ++id;
    }

    var selection_prototype = selection.prototype;

    Transition.prototype = {
      constructor: Transition,
      select: transition_select,
      selectAll: transition_selectAll,
      selectChild: selection_prototype.selectChild,
      selectChildren: selection_prototype.selectChildren,
      filter: transition_filter,
      merge: transition_merge,
      selection: transition_selection,
      transition: transition_transition,
      call: selection_prototype.call,
      nodes: selection_prototype.nodes,
      node: selection_prototype.node,
      size: selection_prototype.size,
      empty: selection_prototype.empty,
      each: selection_prototype.each,
      on: transition_on,
      attr: transition_attr,
      attrTween: transition_attrTween,
      style: transition_style,
      styleTween: transition_styleTween,
      text: transition_text,
      textTween: transition_textTween,
      remove: transition_remove,
      tween: transition_tween,
      delay: transition_delay,
      duration: transition_duration,
      ease: transition_ease,
      easeVarying: transition_easeVarying,
      end: transition_end,
      [Symbol.iterator]: selection_prototype[Symbol.iterator]
    };

    const linear = t => +t;

    function cubicInOut(t) {
      return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
    }

    var defaultTiming = {
      time: null, // Set on use.
      delay: 0,
      duration: 250,
      ease: cubicInOut
    };

    function inherit(node, id) {
      var timing;
      while (!(timing = node.__transition) || !(timing = timing[id])) {
        if (!(node = node.parentNode)) {
          throw new Error(`transition ${id} not found`);
        }
      }
      return timing;
    }

    function selection_transition(name) {
      var id,
          timing;

      if (name instanceof Transition) {
        id = name._id, name = name._name;
      } else {
        id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
      }

      for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
        for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
          if (node = group[i]) {
            schedule(node, name, id, i, group, timing || inherit(node, id));
          }
        }
      }

      return new Transition(groups, this._parents, name, id);
    }

    selection.prototype.interrupt = selection_interrupt;
    selection.prototype.transition = selection_transition;

    function Transform(k, x, y) {
      this.k = k;
      this.x = x;
      this.y = y;
    }

    Transform.prototype = {
      constructor: Transform,
      scale: function(k) {
        return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
      },
      translate: function(x, y) {
        return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
      },
      apply: function(point) {
        return [point[0] * this.k + this.x, point[1] * this.k + this.y];
      },
      applyX: function(x) {
        return x * this.k + this.x;
      },
      applyY: function(y) {
        return y * this.k + this.y;
      },
      invert: function(location) {
        return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
      },
      invertX: function(x) {
        return (x - this.x) / this.k;
      },
      invertY: function(y) {
        return (y - this.y) / this.k;
      },
      rescaleX: function(x) {
        return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
      },
      rescaleY: function(y) {
        return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
      },
      toString: function() {
        return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
      }
    };

    new Transform(1, 0, 0);

    Transform.prototype;

    var _Display_score;
    const 
    // Antic NTSC palette via https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#NTSC
    // 128 colors indexed via high 7 bits, e.g. 0x00 and 0x01 refer to the first entry
    anticPaletteRGB = [
        "#000000", "#404040", "#6c6c6c", "#909090", "#b0b0b0", "#c8c8c8", "#dcdcdc", "#ececec",
        "#444400", "#646410", "#848424", "#a0a034", "#b8b840", "#d0d050", "#e8e85c", "#fcfc68",
        "#702800", "#844414", "#985c28", "#ac783c", "#bc8c4c", "#cca05c", "#dcb468", "#ecc878",
        "#841800", "#983418", "#ac5030", "#c06848", "#d0805c", "#e09470", "#eca880", "#fcbc94",
        "#880000", "#9c2020", "#b03c3c", "#c05858", "#d07070", "#e08888", "#eca0a0", "#fcb4b4",
        "#78005c", "#8c2074", "#a03c88", "#b0589c", "#c070b0", "#d084c0", "#dc9cd0", "#ecb0e0",
        "#480078", "#602090", "#783ca4", "#8c58b8", "#a070cc", "#b484dc", "#c49cec", "#d4b0fc",
        "#140084", "#302098", "#4c3cac", "#6858c0", "#7c70d0", "#9488e0", "#a8a0ec", "#bcb4fc",
        "#000088", "#1c209c", "#3840b0", "#505cc0", "#6874d0", "#7c8ce0", "#90a4ec", "#a4b8fc",
        "#00187c", "#1c3890", "#3854a8", "#5070bc", "#6888cc", "#7c9cdc", "#90b4ec", "#a4c8fc",
        "#002c5c", "#1c4c78", "#386890", "#5084ac", "#689cc0", "#7cb4d4", "#90cce8", "#a4e0fc",
        "#003c2c", "#1c5c48", "#387c64", "#509c80", "#68b494", "#7cd0ac", "#90e4c0", "#a4fcd4",
        "#003c00", "#205c20", "#407c40", "#5c9c5c", "#74b474", "#8cd08c", "#a4e4a4", "#b8fcb8",
        "#143800", "#345c1c", "#507c38", "#6c9850", "#84b468", "#9ccc7c", "#b4e490", "#c8fca4",
        "#2c3000", "#4c501c", "#687034", "#848c4c", "#9ca864", "#b4c078", "#ccd488", "#e0ec9c",
        "#442800", "#644818", "#846830", "#a08444", "#b89c58", "#d0b46c", "#e8cc7c", "#fce08c",
    ];
    function centered(s, width = 40) {
        let pad = width - s.length;
        return s.padStart((pad >> 1) + s.length).padEnd(width);
    }
    function setclr(sel, c) {
        //TODO support sel as existing d3 selection
        selectAll(sel).style('background-color', anticColor(c));
    }
    function anticColor(v) {
        return anticPaletteRGB[Math.floor(parseInt(v, 16) / 2)];
    }
    function atascii(c) {
        return c.charCodeAt(0) & 0x7f;
    }
    function maskpos(c) {
        return `${-(c % 16) * 8}px ${-Math.floor(c / 16) * 8}px`;
    }
    function putlines(win, lines, fg, bg, chrfn, idfn) {
        // fg color can be a function of the data element, bg should be a constant
        const w = select(win);
        chrfn !== null && chrfn !== void 0 ? chrfn : (chrfn = atascii);
        fg !== null && fg !== void 0 ? fg : (fg = w.attr('data-fg-color'));
        bg !== null && bg !== void 0 ? bg : (bg = w.attr('data-bg-color'));
        w.attr('data-fg-color', () => fg);
        if (bg) {
            w.attr('data-bg-color', () => bg);
            w.style('background-color', anticColor(bg));
        }
        w.selectAll('div.chr').remove(); //TODO don't deal with enter/update yet
        let fgfn = typeof fg == 'string' ? ((d) => fg) : fg, data = [].concat(...lines.map((ds, i) => (typeof (ds) == 'string' ? ds.split('') : ds)
            .map((d, j) => [i, j, d])));
        let chrs = w
            .selectAll('div.chr')
            .data(data)
            .join('div')
            .classed('chr', true)
            .style('top', ([i, _, __]) => `${i * 8}px`) // eslint-disable-line no-unused-vars
            .style('left', ([_, j, __]) => `${j * 8}px`) // eslint-disable-line no-unused-vars
            .datum(([_, __, d]) => d); // eslint-disable-line no-unused-vars
        if (idfn)
            chrs.attr('id', idfn);
        chrs.append('div')
            .classed('chr-bg', true)
            .style('background-color', bg ? anticColor(bg) : null);
        chrs.append('div')
            .classed('chr-fg', true)
            .style('background-color', d => anticColor(fgfn(d)))
            .style("-webkit-mask-position", d => maskpos(chrfn(d)));
        return chrs;
    }
    function showAt(sel, loc, dx, dy) {
        return sel
            .style('left', `${loc.col * 8 + (dx || 0)}px`)
            .style('top', `${loc.row * 8 + (dy || 0)}px`)
            .style('opacity', 1);
    }
    function animateUnitPath(u) {
        selectAll('#arrows .chr').interrupt().style('opacity', 0);
        if (u == null)
            return;
        let path = u.path;
        if (path.length < 1)
            return;
        const elt = select('#kreuze')
            .call(showAt, path[path.length - 1])
            .node();
        elt.scrollIntoView({ block: "center", inline: "center" });
        if (path.length < 2)
            return;
        let i = 0;
        function animateStep() {
            let loc = path[i], dst = path[i + 1], dir = u.orders[i], interrupted = false;
            select(`#arrow-${dir}`)
                .call(showAt, loc)
                .transition()
                .delay(i ? 0 : 250)
                .duration(500)
                .ease(linear)
                .call(showAt, dst)
                .transition()
                .duration(0)
                .style('opacity', 0)
                .on("interrupt", () => { interrupted = true; })
                .on("end", () => {
                i = (i + 1) % (path.length - 1);
                if (!interrupted)
                    animateStep();
            });
        }
        animateStep();
    }
    function pathSVG(orders) {
        const r = 0.25;
        let x = 0, y = 0, lastd = null, s = "M0,0";
        orders.forEach(d => {
            let dir = directions[d], dx = dir.dlon, dy = dir.dlat;
            // add prev corner
            if (lastd == null) {
                s = `M${dx * r},${dy * r}`;
            }
            else {
                const turn = (lastd - d + 4) % 4;
                if (turn == 0) {
                    s += ` l${dx * 2 * r},${dy * 2 * r}`;
                }
                else if (turn % 2) {
                    let cx = (dx + directions[lastd].dlon) * r, cy = (dy + directions[lastd].dlat) * r;
                    s += ` a${r},${r} 0 0 ${turn == 1 ? 0 : 1} ${cx},${cy}`;
                }
            }
            lastd = d;
            s += ` l${dx * (1 - 2 * r)},${dy * (1 - 2 * r)}`;
            x += dx;
            y += dy;
        });
        if (orders.length)
            s += ` L${x},${y}`;
        let svg = `<path d="${s}"/>`;
        if (orders.length)
            svg += `<circle r="${r}" cx="${x}" cy="${y}">`;
        return svg;
    }
    function paintMap(action, opts) {
        if (action != 'recolor') {
            console.warn('paintMap: unrecognized action', action);
            return;
        }
        // apply current fg/bg colors to map and unit background
        selectAll('#map .chr-bg, #units .chr-bg')
            .style('background-color', anticColor(opts.bgcolor));
        selectAll('#map .chr-fg')
            .style('background-color', d => anticColor(opts.fgcolorfn(d)));
        // contrasting label colors
        selectAll('.label')
            .style('color', anticColor(opts.labelcolor));
    }
    function paintUnit(event, u) {
        let chr = select(`#unit-${u.id}`), path = select(`#path-${u.id}`), loc = u.location;
        if (['move', 'enter', 'exit'].includes(event)) {
            chr = chr.transition().duration(250).ease(linear);
        }
        switch (event) {
            case 'enter':
            case 'move':
                chr.call(showAt, loc);
            // eslint-disable-next-line no-fallthrough
            case 'orders':
                path.attr('transform', `translate(${loc.col + 0.5},${loc.row + 0.5}) scale(-1)`)
                    .html(pathSVG(u.orders));
            // eslint-disable-next-line no-fallthrough
            case 'damage':
                chr.select('.chr-mstrng').style('width', (90 * u.mstrng / 255) + '%');
                chr.select('.chr-cstrng').style('width', (100 * u.cstrng / u.mstrng) + '%');
                break;
            case 'exit':
                chr.style('opacity', 0);
                break;
            case 'attack':
            case 'defend':
                chr.select('.chr-fg')
                    .classed('flash', true)
                    .style('animation-direction', event == 'defend' ? 'reverse' : 'normal');
                break;
            case 'focus':
            case 'blur':
                chr.classed('blink', event == 'focus');
                animateUnitPath(event == 'focus' && u.human ? u : null);
                break;
            default:
                console.warn('paintUnit ignoring unknown event', event);
        }
    }
    class Display {
        constructor(game, helpText, helpUrl) {
            _Display_score.set(this, null);
            this.centered = centered;
            const iconfn = (d) => d.icon, unitcolor = (u) => players[u.player].color, root = document.querySelector(':root'), font = mapVariants[scenarios[game.scenario].map].font;
            //TODO needs adjusted with setLevel
            // pick the right fontmap
            root.style.setProperty('--fontmap', `url(fontmap-${font}.png)`);
            // set up background colors
            setclr('body', 'D4');
            setclr('.date-rule', '1A');
            setclr('.info-rule', '02'); // same as map
            setclr('.err-rule', '8A');
            // set up info, error and help
            putlines('#help-window', helpText, c => c == "}" ? '94' : '04', '0e');
            // for amusement add a hyperlink on help page
            selectAll('#help-window .chr')
                .filter(d => d == "}")
                .on('click', () => window.open(helpUrl));
            putlines('#date-window', [''], '6A', 'B0');
            putlines('#info-window', [''], '28', '22');
            putlines('#err-window', [''], '22', '3A');
            this.datemsg(centered("EASTERN FRONT 1941", 20));
            // draw the map characters with a semi-transparent dimming layer which we can hide/show
            putlines('#map', game.mapboard.locations, 'ff', '00', iconfn, m => `map-${m.id}`)
                .append('div')
                .classed('chr-dim', true)
                .classed('extra', true);
            // add the city labels
            select('#labels')
                .selectAll('div.label')
                .data(game.mapboard.cities)
                .join('div')
                .classed('label', true)
                .classed('extra', true)
                .text(d => d.label)
                .each(function (d) { select(this).call(showAt, game.mapboard.locationOf(d), 4, -4); });
            // create a layer to show paths with unit orders
            select('#orders')
                .append('svg')
                .attr('width', 48 * 8)
                .attr('height', 41 * 8)
                .append('g')
                .attr('transform', 'scale(8)')
                .selectAll('.unit-path')
                .data(game.oob.slice())
                .join('g')
                .attr('id', u => `path-${u.id}`)
                .classed('unit-path', true)
                .classed('debug', u => !u.human)
                .classed('extra', true)
                .attr('style', u => {
                const c = anticColor(unitcolor(u));
                return `stroke: ${c}; fill: ${c};`;
            });
            // draw all of the units
            putlines('#units', [game.oob.slice()], unitcolor, '00', iconfn, (u) => `unit-${u.id}`)
                .each(function (u) { select(this).call(showAt, u.location); })
                .style('opacity', 0)
                .append('div')
                .attr('class', 'chr-overlay extra')
                .append('div')
                .classed('chr-mstrng', true)
                .append('div')
                .classed('chr-cstrng', true);
            // put arrows and kreuze in layer for path animation
            putlines('#arrows', [[256], Object.values(directions).map(iconfn)], d => d == 256 ? '1A' : 'DC', undefined, c => c, (d, i) => d == 256 ? 'kreuze' : `arrow-${i - 1}`)
                .style('opacity', 0);
            game.on('game', (action, obj) => {
                selectAll('#units .chr-fg').classed('flash', false);
                if (action == 'turn') {
                    __classPrivateFieldSet(this, _Display_score, obj.score(obj.human), "f");
                    this.errmsg(centered('PLEASE ENTER YOUR ORDERS NOW'));
                    this.datemsg(" " + obj.date.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));
                    this.infomsg();
                }
            });
            game.on('message', (typ, ...lines) => {
                switch (typ) {
                    case 'error':
                        this.errmsg(...lines);
                        break;
                    case 'info':
                        this.infomsg(...lines);
                        break;
                    case 'date':
                        this.datemsg(...lines);
                        break;
                }
            });
            game.on('unit', paintUnit);
            game.on('map', paintMap);
        }
        datemsg(line2, line1) {
            putlines('#date-window', [line1 !== null && line1 !== void 0 ? line1 : "", line2 !== null && line2 !== void 0 ? line2 : ""]);
        }
        infomsg(line1, line2) {
            putlines('#info-window', [line1 !== null && line1 !== void 0 ? line1 : "", line2 !== null && line2 !== void 0 ? line2 : ""]);
        }
        errmsg(text) {
            text !== null && text !== void 0 ? text : (text = '');
            let s;
            if (__classPrivateFieldGet(this, _Display_score, "f") == null) {
                s = centered(text);
            }
            else {
                s = __classPrivateFieldGet(this, _Display_score, "f").toString().padStart(3).padEnd(4) + centered(text, 36);
            }
            putlines('#err-window', [s]);
        }
        setZoom(zoomed, u) {
            var elt;
            if (u != null) {
                elt = select('#kreuze').node();
            }
            else {
                let x = 320 / 2, y = 144 / 2 + select('#map-window').node().offsetTop - window.scrollY;
                elt = document.elementFromPoint(x * 4, y * 4);
            }
            // toggle zoom level, apply it, and re-center target eleemnt
            select('#map-window .container').classed('doubled', zoomed);
            elt.scrollIntoView({ block: "center", inline: "center" });
        }
        setVisibility(sel, visible) {
            selectAll(sel).style('visibility', visible ? 'visible' : 'hidden');
        }
    }
    _Display_score = new WeakMap();

    var _Thinker_instances, _Thinker_game, _Thinker_player, _Thinker_trainOfThought, _Thinker_depth, _Thinker_delay, _Thinker_concluded, _Thinker_recur, _Thinker_findBeleaguered, _Thinker_evalLocation;
    class Thinker {
        constructor(game, player) {
            _Thinker_instances.add(this);
            _Thinker_game.set(this, void 0);
            _Thinker_player.set(this, void 0);
            _Thinker_trainOfThought.set(this, 0);
            _Thinker_depth.set(this, 0);
            _Thinker_delay.set(this, 0);
            _Thinker_concluded.set(this, false);
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
            var ofr = 0; // only used in first pass
            if (firstpass) {
                ofr = calcForceRatios(__classPrivateFieldGet(this, _Thinker_game, "f").oob, __classPrivateFieldGet(this, _Thinker_player, "f")).ofr;
                console.log('Overall force ratio (OFR) is', ofr);
                friends.forEach(u => { u.objective = u.location; });
            }
            friends.filter(u => u.canMove).forEach(u => {
                //TODO these first two checks don't seem to depend on ghost army so are fixed on first pass?
                if (firstpass && u.ifr == (ofr >> 1)) {
                    // head to reinforce if no local threat since (Local + OFR) / 2 = OFR / 2
                    //TODO this tends to send most units to same beleagured square
                    let v = __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_findBeleaguered).call(this, u, friends);
                    if (v)
                        u.objective = v.location;
                }
                else if (firstpass && (u.cstrng <= (u.mstrng >> 1) || u.ifrdir[pinfo.homedir] >= 16)) {
                    // run home if hurting or outnumbered in the rear
                    //TODO could look for farthest legal square (valid & not impassable) 5, 4, ...
                    let d = directions[pinfo.homedir];
                    u.objective = { lon: u.lon + 5 * d.dlon, lat: u.lat + 5 * d.dlat };
                }
                else {
                    // find nearest best square
                    let start = __classPrivateFieldGet(this, _Thinker_game, "f").mapboard.locationOf(u.objective), bestval = __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_evalLocation).call(this, u, start, friends, foes);
                    Object.keys(directions).forEach(d => {
                        let loc = __classPrivateFieldGet(this, _Thinker_game, "f").mapboard.neighborOf(start, +d);
                        if (!loc)
                            return;
                        let sqval = __classPrivateFieldGet(this, _Thinker_instances, "m", _Thinker_evalLocation).call(this, u, loc, friends, foes);
                        if (sqval > bestval) {
                            bestval = sqval;
                            loc.put(u.objective);
                        }
                    });
                }
                if (!u.objective)
                    return;
                let result = u.bestPath(u.objective);
                if (!result)
                    return;
                u.setOrders(result.orders); // We'll prune to 8 later
            });
            return friends.filter(u => u.objective);
        }
    }
    _Thinker_game = new WeakMap(), _Thinker_player = new WeakMap(), _Thinker_trainOfThought = new WeakMap(), _Thinker_depth = new WeakMap(), _Thinker_delay = new WeakMap(), _Thinker_concluded = new WeakMap(), _Thinker_instances = new WeakSet(), _Thinker_recur = function _Thinker_recur(train) {
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
            let d = GridPoint.manhattanDistance(u, v);
            if (d <= 8)
                return; // APX code does weird bit 3 check
            let s = v.ifr - (d >> 3);
            if (s > score) {
                score = s;
                best = v;
            }
        });
        return best;
    }, _Thinker_evalLocation = function _Thinker_evalLocation(u, loc, friends, foes) {
        let ghosts = {}, range = GridPoint.manhattanDistance(u, loc);
        // too far, early exit
        if (range >= 8)
            return 0;
        const nbval = Math.min(...foes.map(v => GridPoint.manhattanDistance(loc, v)));
        // on the defensive and square is occupied by an enemy
        if (u.ifr >= 16 && nbval == 0)
            return 0;
        friends.filter(v => v.id != u.id)
            .forEach(v => { ghosts[GridPoint.get(v.objective).id] = v.id; });
        let isOccupied = (pt) => !!ghosts[pt.id], dibs = false;
        if (isOccupied(loc))
            dibs = true; // someone else have dibs already?
        else
            ghosts[loc.id] = u.id;
        const square = GridPoint.squareSpiral(loc, 5), linepts = Object.keys(directions).map(d => linePoints(sortSquareFacing(loc, 5, +d, square), 5, isOccupied)), tadj = terraintypes[loc.terrain].defence + 2; // our 0 adj is equiv to his 2
        let sqval = sum(linepts.map((scr, i) => scr * u.ifrdir[i])) >> 8;
        sqval += u.ifr >= 16 ? u.ifr * (nbval + tadj) : 2 * (15 - u.ifr) * (9 - nbval + tadj);
        if (dibs)
            sqval -= 32;
        sqval -= 1 << range;
        return sqval < 0 ? 0 : sqval;
    };
    function calcForceRatios(oob, player) {
        let active = oob.activeUnits(), friend = sum(active.filter(u => u.player == player).map(u => u.cstrng)), foe = sum(active.filter(u => u.player != player).map(u => u.cstrng)), ofr = Math.floor((foe << 4) / friend), ofropp = Math.floor((friend << 4) / foe);
        active.forEach(u => {
            let nearby = active.filter(v => GridPoint.manhattanDistance(u, v) <= 8), friend = 0, loc = u.location;
            u.ifrdir = [0, 0, 0, 0];
            nearby.forEach(v => {
                let inc = v.cstrng >> 4;
                if (v.player == u.player)
                    friend += inc;
                else
                    u.ifrdir[GridPoint.directionFrom(loc, v.location)] += inc;
            });
            // individual and overall ifr max 255
            let ifr = Math.floor((sum(u.ifrdir) << 4) / friend);
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
        let r = (diameter - 1) / 2, minor = directions[(dir + 1) % 4], major = directions[(dir + 2) % 4], out = new Array(locs.length);
        locs.forEach(loc => {
            let dlat = loc.lat - center.lat, dlon = loc.lon - center.lon, idx = (r + dlat * major.dlat + dlon * major.dlon
                + diameter * (r + dlat * minor.dlat + dlon * minor.dlon));
            out[idx] = loc;
        });
        return out;
    }
    function linePoints(locs, diameter, occupied) {
        // curious that this doesn't consider terrain, e.g. a line ending at the coast will get penalized heavily?
        let r = (diameter - 1) / 2, frontline = Array(diameter).fill(diameter), counts = Array(diameter).fill(0), row = -1, col = -1, score = 0;
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
                let delta = Math.abs(frontline[i] - frontline[j]);
                if (delta)
                    score -= 1 << delta;
            }
        return score;
    }

    const helpText = `
0123456789012345678901234567890123456789


      Welcome to Chris Crawford's
          Eastern Front  1941

       Ported by Patrick Surry }

  Select: Click, [n]ext, [p]rev
  Orders: \x1f, \x1c, \x1d, \x1e, [Bksp]
  Cancel: [Space], [Esc]
  Submit: [End], [Fn \x1f]
  Toggle: [z]oom, e[x]tras, debu[g]

          [?] shows this help

         Press any key to play!

0123456789012345678901234567890123456789
`.split('\n').slice(2, -2);
    var game, display, ai, zoom = 0, // display zoom 0 or 1
    help = 1, // help visible 0 or 1
    uimode = null, focusid = null, // current focused unit id
    lastid = null; // most recent focused unit id (= focusid or null)
    // main entry point
    function start() {
        const resume = window.location.hash.slice(1) || undefined;
        game = new Game(resume);
        display = new Display(game, helpText, 'https://github.com/patricksurry/eastern-front-1941');
        game.start();
        game.on('game', (action) => {
            if (action == 'turn' && uimode == 2 /* UIModeKey.resolve */)
                setMode(1 /* UIModeKey.orders */);
        });
        ai = Object.keys(players)
            .filter(player => +player != game.human)
            .map(player => new Thinker(game, +player));
        // set up a click handler to toggle help
        select('#help-window').on('click', toggleHelp);
        // add map square click handlers
        selectAll('#map .chr')
            .on('click', mapClickHandler)
            .on('mouseover', mapHoverHandler);
        // start the key handler
        document.addEventListener('keydown', keyHandler);
        if (resume) {
            // hide help and keep going
            toggleHelp();
            setMode(1 /* UIModeKey.orders */);
        }
        else {
            setMode(0 /* UIModeKey.setup */);
        }
    }
    const modes = {
        [0 /* UIModeKey.setup */]: {
            enter: () => {
                display.infomsg(display.centered('COPYRIGHT 1982 ATARI'), display.centered('ALL RIGHTS RESERVED'));
                //TODO this won't work until game responds appropriately
                //setScenario(Scenario.beginner);
            },
            keyHandler: (key) => {
                if (keymap.prev.includes(key) || key == 'ArrowLeft') {
                    setScenario(null, -1);
                }
                else if (keymap.next.includes(key) || key == 'ArrowRight') {
                    setScenario(null, +1);
                }
                else if (keymap.scenario.includes(key)) {
                    setScenario(parseInt(key));
                }
                else if (key == 'Enter') {
                    setMode(1 /* UIModeKey.orders */);
                }
                else {
                    return false;
                }
                return true;
            },
        },
        [1 /* UIModeKey.orders */]: {
            enter: () => {
                window.location.hash = game.token;
                // start thinking...
                ai.forEach(t => t.thinkRecurring(250));
            },
            keyHandler: (key) => {
                if (keymap.prev.includes(key)) {
                    focusUnitRelative(-1);
                }
                else if (keymap.next.includes(key) || key == 'Enter') {
                    focusUnitRelative(+1);
                }
                else if (key in arrowmap) {
                    showNewOrder(arrowmap[key]);
                }
                else if (keymap.cancel.includes(key)) {
                    showNewOrder(null);
                }
                else if (key == 'Backspace') {
                    showNewOrder(-1);
                }
                else if (key == 'End') {
                    setMode(2 /* UIModeKey.resolve */);
                }
                else {
                    return false;
                }
                return true;
            },
            mapClickHandler: (ev, loc) => {
                let u = getFocusedUnit();
                display.errmsg(); // clear errror window
                if (loc.unitid == null || (u && u.id == loc.unitid)) {
                    // clicking an empty square or already-focused unit unfocuses
                    blurUnit();
                    if (loc.cityid) {
                        const label = game.mapboard.cities[loc.cityid].label.toUpperCase();
                        display.infomsg(display.centered(label));
                    }
                }
                else {
                    focusUnit(game.oob.at(loc.unitid));
                }
            },
        },
        [2 /* UIModeKey.resolve */]: {
            enter: () => {
                // finalize AI orders
                ai.forEach(t => t.finalize());
                blurUnit();
                display.errmsg('EXECUTING MOVE');
                game.nextTurn(250);
            },
            keyHandler: (key) => {
                if (keymap.prev.includes(key)) {
                    focusUnitRelative(-1);
                }
                else if (keymap.next.includes(key) || key == 'Enter') {
                    focusUnitRelative(+1);
                }
                else {
                    return false;
                }
                return true;
            }
        }
    };
    function setMode(m) {
        if (uimode && modes[uimode].exit != null)
            modes[uimode].exit();
        uimode = m;
        if (modes[m].enter != null)
            modes[m].enter();
    }
    const keymap = {
        help: '?/',
        prev: '<,p',
        next: '>.n',
        cancel: ['Escape', ' '],
        scenario: '0123456789'.slice(0, Object.keys(scenarios).length),
        extras: 'xX',
        zoom: 'zZ',
        debug: 'gG',
    }, arrowmap = {
        ArrowUp: 0 /* DirectionKey.north */,
        ArrowDown: 2 /* DirectionKey.south */,
        ArrowRight: 1 /* DirectionKey.east */,
        ArrowLeft: 3 /* DirectionKey.west */,
    };
    function keyHandler(e) {
        let handled = true;
        display.errmsg(); // clear error
        if (help || keymap.help.includes(e.key)) {
            toggleHelp();
        }
        else if (keymap.zoom.includes(e.key)) {
            toggleZoom();
        }
        else if (keymap.extras.includes(e.key)) {
            toggleExtras();
        }
        else if (keymap.debug.includes(e.key)) {
            toggleDebug();
        }
        else if (uimode && modes[uimode].keyHandler != null) {
            handled = modes[uimode].keyHandler(e.key);
        }
        if (handled)
            e.preventDefault(); // eat event if handled
    }
    function mapClickHandler(ev, loc) {
        if (uimode && modes[uimode].mapClickHandler != null)
            modes[uimode].mapClickHandler(ev, loc);
    }
    function mapHoverHandler(ev, loc) {
        let s = loc.describe();
        if (loc.unitid != null)
            s += '\n' + game.oob.at(loc.unitid).describe(!!game.debug);
        select(this).attr('title', s);
    }
    function toggleHelp() {
        help = help ? 0 : 1;
        display.setVisibility('#help-window', !!help);
        display.setVisibility('#map-scroller', !help); //TODO needs to be display not visibility
    }
    function toggleZoom() {
        zoom = zoom ? 0 : 1;
        display.setZoom(!!zoom, getFocusedUnit());
    }
    function toggleExtras() {
        game.extras = game.extras ? 0 : 1;
        display.setVisibility('.extra', !!game.extras);
    }
    function toggleDebug() {
        game.debug = game.debug ? 0 : 1;
        display.setVisibility('.debug', !!game.debug);
    }
    function setScenario(scenario, inc) {
        /*
            orginal game shows errmsg "[SELECT]: LEARNER  [START] TO BEGIN" with copyright in txt window,
            where [] is reverse video.  could switch to "[< >]: LEARNER  [ENTER] TO BEGIN(RESUME)"
            so < > increments scenario, # picks directly
        */
        inc !== null && inc !== void 0 ? inc : (inc = 0);
        let n = Object.keys(scenarios).length;
        if (scenario == null) {
            scenario = (game.scenario + inc + n) % n;
        }
        // TODO setter
        game.scenario = scenario;
        let label = scenarios[scenario].label.padEnd(8, ' ');
        display.errmsg(display.centered(`[<] ${label} [>]  [ENTER] TO START`));
    }
    function focusUnit(u) {
        blurUnit();
        if (!u)
            return;
        focusid = u.id;
        lastid = focusid;
        display.infomsg(`     ${u.label}`, `     MUSTER: ${u.mstrng}  COMBAT: ${u.cstrng}`);
        if (game.extras) {
            let locs = u.reach();
            selectAll('.chr-dim').filter((d) => !(d.id in locs)).style('opacity', 0.5);
        }
        game.emit('unit', 'focus', u);
    }
    function focusUnitRelative(offset) {
        // sort active germans descending by location id (right => left reading order)
        let humanUnits = game.oob.activeUnits(game.human)
            .sort((a, b) => game.mapboard.locationOf(b).id - game.mapboard.locationOf(a).id), n = humanUnits.length;
        var i;
        if (lastid) {
            i = humanUnits.findIndex(u => u.id == lastid);
            if (i < 0) {
                // if last unit no longer active, find the nearest active unit
                let locid = game.mapboard.locationOf(game.oob.at(lastid)).id;
                while (++i < humanUnits.length && game.mapboard.locationOf(humanUnits[i]).id > locid) { /**/ }
            }
        }
        else {
            i = offset > 0 ? -1 : 0;
        }
        i = (i + n + offset) % n;
        focusUnit(humanUnits[i]);
    }
    function getFocusedUnit() {
        return focusid === null ? null : game.oob.at(focusid);
    }
    function blurUnit() {
        const u = getFocusedUnit();
        if (u)
            game.emit('unit', 'blur', u);
        display.infomsg();
        focusid = null;
        selectAll('.chr-dim').style('opacity', 0);
        window.location.hash = game.token;
    }
    function showNewOrder(dir) {
        let u = getFocusedUnit();
        if (!u)
            return;
        if (!u.human) {
            display.errmsg(`THAT IS A ${players[u.player].label.toUpperCase()} UNIT!`);
            return;
        }
        if (dir == null) {
            if (u.orders.length == 0) {
                blurUnit();
                return;
            }
            u.resetOrders();
        }
        else if (dir == -1) {
            u.delOrder();
        }
        else {
            u.addOrder(dir);
        }
        focusUnit(u);
    }

    exports.start = start;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, window);
//# sourceMappingURL=ef1941.js.map
