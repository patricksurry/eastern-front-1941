import {oobVariants} from './oob-data';
import {Grid} from './grid';

import {Game} from './game';
import { DirectionKey, PlayerKey } from './defs';
import { ScenarioKey, scenarios } from './scenarios';
import { unitFlag } from './unit';

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
    const k = ScenarioKey.expert42,
        scenario = scenarios[k],
        fog = scenario.fog ?? 0,
        g = new Game(k);
    let diff = 0;
    expect(fog).toBeGreaterThan(0);
    g.oob.activeUnits().forEach(u => {
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
    })
    expect(diff).toBeGreaterThan(0);
})

test("Fog is asymmetrical", () => {
    const g = new Game(ScenarioKey.expert41);
    g.oob.activeUnits().forEach(u => {
        const {mstrng, cstrng} = u,
            {mstrng: mfog, cstrng: cfog} = u.foggyStrength(u.player);
        const dm = Math.abs(mfog-mstrng),
            dc = Math.abs(cfog-cstrng);
        expect(dm).toBe(0);
        expect(dc).toBe(0);
    })
})

test("Fog is repeatable", () => {
    const g = new Game(ScenarioKey.advanced);
    const ms  = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng),
        m2s = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    expect(ms).toEqual(m2s);
})

test("Fog strength changes each turn", () => {
    const g = new Game(ScenarioKey.advanced);
    const ms  = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    g.nextTurn();
    const m2s = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    expect(ms).not.toEqual(m2s);
})

test("Fog values update each turn", () => {
    const g = new Game(ScenarioKey.advanced),
        fs = g.oob.activeUnits().map(u => u.fog);
    g.nextTurn();
    const f2s = g.oob.activeUnits().map(u => u.fog);
    expect(fs).not.toEqual(f2s);
})

test("Simple supply", () => {
    const g = new Game(ScenarioKey.learner);
    g.oob.activeUnits().forEach(u => {
        expect(u.traceSupply()).toBe(1);
        expect(u.flags & unitFlag.oos).toBeFalsy();
    })
});

test("Supply blocked", () => {
    const g = new Game(ScenarioKey.learner);
    const u0 = g.oob.activeUnits(PlayerKey.Russian)[0],
        u1 = g.oob.activeUnits(PlayerKey.German)[0];

    for (let lat=7; lat<=38; lat+=3) {
        g.mapboard.locationOf(Grid.lonlat(18,lat)).unitid = u1.id;
    }
    expect(u0.traceSupply()).toBe(0);
    expect(u0.flags & unitFlag.oos).toBeTruthy();
})

test("Supply thru gaps", () => {
    const g = new Game(ScenarioKey.learner);
    const u0 = g.oob.activeUnits(PlayerKey.Russian)[0],
        u1 = g.oob.activeUnits(PlayerKey.German)[0];

    for (let lat=7; lat<=38; lat+=4) {
        g.mapboard.locationOf(Grid.lonlat(18,lat)).unitid = u1.id;
    }
    expect(u0.traceSupply()).toBe(1);
    expect(u0.flags & unitFlag.oos).toBeFalsy();
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
