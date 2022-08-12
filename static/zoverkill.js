function zc(k) {
    // https://en.wikipedia.org/wiki/Z-order_curve
    const z16 = [
        0b00000000, 0b00000001, 0b00000100, 0b00000101,
        0b00010000, 0b00010001, 0b00010100, 0b00010101,
        0b01000000, 0b01000001, 0b00000100, 0b00000101,
        0b01010000, 0b01010001, 0b01010100, 0b01010101,
    ];
    let v = z16[k & 0xf];
    if (k > 16) v += zc(k>>4)<<8;
    return v;
}

function zcurve(i, j) {
    return (zc(i) << 1) | zc(j);
}


function niceorder(units) {
    units.sort((a, b) => zcurve(a.X, a.Y) - zcurve(b.X, b.Y));

    function d2(i, j) {
        const w = 1.1; // avoid excess north-south moves
        if (i < 0 || j < 0 || i >= units.length || j >= units.length) {
            return 0;
        } else {
            return (units[j].X - units[i].X) ** 2 + w*(units[j].Y - units[i].Y) ** 2;
        }
    }
    function twoopt(units) {
        for (i=0; i<units.length-1; i++)
            for (j=i+1; j<units.length; j++) {
                const
                    ij   = d2(i, j),
                    ii1  = d2(i, i+1),
                    i1j  = d2(i+1, j),
                    j_1j = d2(j-1, j),
                    i_1j = d2(i-1, j),
                    i_1i = d2(i-1, i),
                    i_1i1= d2(i-1, i+1),
                    ij1  = d2(i, j+1),
                    jj1  = d2(j, j+1),
                    j_1j1= d2(j-1, j+1);
                if (j > i + 1) {
                    delta = ij + ij1 + i_1i1 - i_1i - ii1 - jj1;
                    if (delta < 0) {
                        console.log(`move ${i} after ${j} with delta ${delta}`)
                        // move i after j, replacing i-1 => i, i => i+1, j => j+1 with j => i, i => j+1, i-1 => i+1
                        return [].concat(
                            units.slice(0, i),
                            units.slice(i+1, j+1),
                            units.slice(i, i+1),
                            units.slice(j+1)
                        )
                    }
                    delta = ij + i1j + j_1j1 - ii1 - j_1j - jj1;
                    if (delta < 0) {
                        console.log(`move ${j} after ${i} with delta ${delta}`)
                        // move j after i, replacing i => i+1, j-1 => j, j => j+1 with i => j, j => i+1, j-1 => j+1
                        return [].concat(
                            units.slice(0, i+1),
                            units.slice(j, j+1),
                            units.slice(i+1, j),
                            units.slice(j+1)
                        )
                    }
                }
                delta = i_1j - i_1i + ij1 - jj1;
                if (delta < 0) {
                    // flip [i...j] inclusive, i.e. replace edges i-1 => i, j => j+1 with i => j+1, i-1 => j
                    console.log(`flip ${i} - ${j} with delta ${delta}`)
                    return [].concat(units.slice(0, i), units.slice(i, j+1).reverse(), units.slice(j+1))
                }
            }
        return null;
    }

    while (true) {
        better = twoopt(units);
        if (!better) return units;
        units = better;
    }
}
