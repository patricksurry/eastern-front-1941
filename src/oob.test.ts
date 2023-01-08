import {oobVariants} from './oob-data';
import {GridPoint} from './map';

import {Game} from './game';
import { PlayerKey } from './defs';

const game = new Game().start();

// the second last column of raw data is CORPT for both apx and cart,
// and indexes the main unit name.  the high bit of low nibble is unused
test("CORPT bit 4 is unused", () => {
    Object.values(oobVariants).forEach(
        data => data.forEach(xs => expect(xs[xs.length - 2] & 0x08).toBe(0))
    );
})

test("Unit counts", () => {
    const counts = [0, 0];
    game.oob.forEach(u => counts[u.player]++);
    expect(counts).toEqual([55, 104])
});

test("No fog is a no-op", () => {
    game.oob.activeUnits().forEach(u => {
        const {mstrng, cstrng} = u;
        expect(u.foggyStrength(1-u.player)).toEqual({mstrng, cstrng})
    })
})

test("Fog is bounded", () => {
    let diff = 0;
    game.oob.activeUnits().forEach(u => {
        u.fog = 3;
        const {mstrng, cstrng} = u,
            {mstrng: mfog, cstrng: cfog} = u.foggyStrength(1-u.player);
        const dm = Math.abs(mfog-mstrng),
            dc = Math.abs(cfog-cstrng);
        expect(mfog).toBeGreaterThanOrEqual(cfog);
        expect(dm).toBeLessThan(8);
        expect(dc).toBeLessThan(8);
        diff += dm + dc;
        u.fog = 0;
    })
    expect(diff).toBeGreaterThan(0);
})

test("Fog is asymmetrical", () => {
    game.oob.activeUnits().forEach(u => {
        u.fog = 3;
        const {mstrng, cstrng} = u,
            {mstrng: mfog, cstrng: cfog} = u.foggyStrength(u.player);
        const dm = Math.abs(mfog-mstrng),
            dc = Math.abs(cfog-cstrng);
        expect(dm).toBe(0);
        expect(dc).toBe(0);
        u.fog = 0;
    })
})

test("Fog is repeatable", () => {
    game.oob.activeUnits().forEach(u => {u.fog = 3});
    const ms  = game.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng),
        m2s = game.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    expect(ms).toEqual(m2s);
    game.oob.activeUnits().forEach(u => {u.fog = 0});
})

test("ZoC is calculated correctly", () => {
    /*
    set up a config like

        . O .       0 0 2
        . . X   =>  3 5 5
        X X .       6 7 4

    in spiral ordering that's []. O . X . X X . .] => [5 0 2 5 4 7 6 3 0]
    */

    const locs = GridPoint.squareSpiral({lon: 20, lat: 20}, 1)
            .map(p => game.mapboard.locationOf(p)),
        p0 = game.oob.findIndex(u => u.player == PlayerKey.German),
        p1 = game.oob.findIndex(u => u.player == PlayerKey.Russian),
        expected = [5,0,2,5,4,7,6,3,0];

    locs[1].unitid = p0;
    locs[3].unitid = p1;
    locs[5].unitid = p1;
    locs[6].unitid = p1;
    const zocs = locs.map(loc => game.oob.zocAffecting(PlayerKey.German, loc));
    expect(zocs).toEqual(expected);
});
