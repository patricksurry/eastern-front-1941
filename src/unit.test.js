import {oobVariants} from './unit-data.js';
import {oob, zocAffecting} from './unit.js';
import {squareSpiral, Location} from './map.js';


// the second last column of raw data is CORPT for both apx and cart,
// and indexes the main unit name.  the high bit of low nibble is unused
test("CORPT bit 4 is unused", () => {
    Object.values(oobVariants).forEach(xs => expect(xs[xs.len - 2] & 0x08).toBe(0));
})

test("ZoC is calculated correctly", () => {
    /*
    set up a config like

        . O .       0 0 2
        . . X   =>  3 5 5
        X X .       6 7 4
    */

    let locs = squareSpiral(Location(20, 20), 3),
        p0 = 0, p1 = 0;

    while(oob[p0].player != 0) p0++;
    while(oob[p1].player != 1) p1++;

    locs[1].unitid = p0;
    locs[3].unitid = p1;
    locs[5].unitid = p1;
    locs[6].unitid = p1;
    let zocs = locs.map(loc => zocAffecting(0, loc));
    expect(zocs).toEqual([5,0,2,5,4,7,6,3,0]);

    locs.forEach(loc => {loc.unitid = null;});
});
