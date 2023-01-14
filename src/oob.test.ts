import {oobVariants} from './oob-data';
import {Grid} from './grid';

import {Game} from './game';
import { DirectionKey, PlayerKey } from './defs';
import { ScenarioKey } from './scenarios';

let game: Game;

beforeEach(() => {
    game = new Game();
    game.rand.state(9792904);
})

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
    const fog = 7;
    let diff = 0;
    game.oob.activeUnits().forEach(u => {
        u.fog = fog;
        const {mstrng, cstrng} = u,
            {mstrng: mfog, cstrng: cfog} = u.foggyStrength(1-u.player);
        const dm = Math.abs(mfog-mstrng),
            dc = Math.abs(cfog-cstrng);
        expect(mfog).toBeGreaterThan(0);
        expect(mfog).toBeLessThanOrEqual(255);
        expect(cfog).toBeGreaterThan(0);
        expect(cfog).toBeLessThanOrEqual(255);
        expect(mfog).toBeGreaterThanOrEqual(cfog);
        expect(dm).toBeLessThan(1 << (fog-1));
        expect(dc).toBeLessThan(1 << (fog-1));
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

test("Fog changes each turn", () => {
    game.oob.activeUnits().forEach(u => {u.fog = 3});
    const ms  = game.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    game.nextTurn();
    const m2s = game.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    expect(ms).not.toEqual(m2s);
    game.oob.activeUnits().forEach(u => {u.fog = 0});
})

test("ZoC blocked", () => {
    // blocked scenario from doc/apxzoc1.png
    const g = new Game(ScenarioKey.learner);
    const p0 = g.oob.findIndex(u => u.player == PlayerKey.German),
        p1 = g.oob.findIndex(u => u.player == PlayerKey.Russian),
        u = g.oob.at(p0),
        start = g.mapboard.locationOf(Grid.lonlat(14, 25));

    g.mapboard.locationOf(Grid.lonlat(12, 24)).unitid = p1;
    g.mapboard.locationOf(Grid.lonlat(12, 26)).unitid = p1;

    u.moveTo(start);
    for (let i=0; i<4; i++) u.addOrder(DirectionKey.east);
    g.nextTurn();
    expect(u).toMatchObject({lon: 13, lat: 25});
})

test("ZoC not blocked", () => {
    // unblocked scenario from doc/apxzoc1.png
    const g = new Game(ScenarioKey.learner);
    const p0 = g.oob.findIndex(u => u.player == PlayerKey.German),
        p1 = g.oob.findIndex(u => u.player == PlayerKey.Russian),
        u = g.oob.at(p0),
        start = g.mapboard.locationOf(Grid.point({lon: 14, lat: 25}));

    g.mapboard.locationOf(Grid.lonlat(12, 24)).unitid = p1;
    g.mapboard.locationOf(Grid.lonlat(12, 27)).unitid = p1;

    u.moveTo(start);
    for (let i=0; i<4; i++) u.addOrder(DirectionKey.east);
    g.nextTurn();
    expect(u).toMatchObject({lon: 10, lat: 25});
})


test("ZoC is calculated correctly", () => {
    /*
    set up a config like

        . O .       0 0 2
        . . X   =>  3 5 5
        X X .       6 7 4

    in spiral ordering that's []. O . X . X X . .] => [5 0 2 5 4 7 6 3 0]
    */

    const locs = Grid.squareSpiral(Grid.lonlat(20, 20), 1)
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
