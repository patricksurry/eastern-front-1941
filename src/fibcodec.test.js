import {zigzag, zagzig, rlencode, rldecode, fibencode, fibdecode} from './fibcodec.js';


const fibs = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811],
    fibs2 = [-8, 5, -3, 2, -1, 1, 0, 1, 1, 2, 3, 5, 8];

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

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

test("run-length is reversible", () => {
    let vs = [0, 1, 1, 1, 1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 8, 8];
    expect(rldecode(rlencode(vs))).toEqual(vs);

    expect(rldecode(rlencode(vs, 4), 4)).toEqual(vs);
})

test("fibencode throws on negative", () => {
    expect(() => fibencode(fibs2)).toThrow();
})

test("fibdecode throws on bad char", () => {
    expect(() => fibdecdode('abc/@')).toThrow();
})

test("fibencode is urlsafe", () => {
    let s = fibencode(fibs);
    expect(encodeURIComponent(s)).toEqual(s);
})

test("fibencode uses 64 chrs", () => {
    // need to simulate a small-number-biased distrib with runs of zeros particularly
    // since that's the only way to get long sequences of 1s
    let pseudorandom = mulberry32(112358),
        vs = [...Array(1<<10).keys()]
            .map(k => Math.floor(Math.exp(10*pseudorandom())) - 1),
        s = fibencode(vs),
        uniq = new Set(s);
    expect(uniq.size).toBe(64);
})

test("codec is reversible", () => {
    expect(fibdecode(fibencode(fibs))).toEqual(fibs);
})

test("codec+zigzag is reversible", () => {
    expect(zagzig(fibdecode(fibencode(zigzag(fibs2))))).toEqual(fibs2);
})

