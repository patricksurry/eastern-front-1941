import {zigzag, zagzig, encode, decode} from './vlq64codec.js';

const fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811],
    fibs2 = [-8, 5, -3, 2, -1, 1, 0, 1, 1, 2, 3, 5, 8];

test("zigzag throws on non-int", () => {
    expect(() => zigzag('abc')).toThrow();
})

test("zigzag is reversible", () => {
    expect(zagzig(zigzag(fibs2))).toEqual(fibs2);
})

test("zigzag is compact", () => {
    let xs=[], ys=[];
    for (let k=0; k<31; k++) {
        xs.push(k-15);
        ys.push(k);
    }
    expect(zigzag(xs).sort((a, b) => (a - b))).toEqual(ys);
})

test("encode throws on negative", () => {
    expect(() => encode(fibs2)).toThrow();
})

test("decode throws on bad char", () => {
    expect(() => decdode('abc/@')).toThrow();
})

test("encode is urlsafe", () => {
    let s = encode(fibs);
    expect(encodeURIComponent(s)).toEqual(s);
})

test("encode uses 64 chrs", () => {
    let vs = [...Array(1<<15).keys()],
        s = encode(vs),
        uniq = new Set(s);
    expect(uniq.size).toBe(64);
})

test("codec is reversible", () => {
    expect(decode(encode(fibs))).toEqual(fibs);
})

test("codec+zigzag is reversible", () => {
    expect(zagzig(decode(encode(zigzag(fibs2))))).toEqual(fibs2);
})

test("encode small vals is transparent", () => {
    expect(encode([0, 1, 2, 3])).toBe('0123');
})

test("encode is compact", () => {
    expect(encode([...Array(31).keys()]).length).toBe(31);
})

test("encode short run", () => {
    expect(encode([0, 1, 1, 1, 2])).not.toContain('~');
})

test("encode long run", () => {
    expect(encode([0, 1, 1, 1, 1, 2])).toContain('~');
})

test("run length coding roundtrip", () => {
    let run = [0, 1, 1, 1, 1, 2];
    expect(decode(encode(run))).toEqual(run);
})
