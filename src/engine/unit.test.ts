import {Game} from './game';
import {Grid} from './grid';
import {DirectionKey, PlayerKey, UnitKindKey} from './defs';
import {ScenarioKey, scenarios} from './scenarios';
import {unitFlag, UnitMode} from './unit';

test("No fog is a no-op", () => {
    const game = new Game(ScenarioKey.apx, 9792904);

    game.oob.activeUnits().forEach(u => {
        const {mstrng, cstrng} = u;
        expect(u.foggyStrength(1-u.player)).toEqual({mstrng, cstrng})
    })
})

test("Fog is bounded", () => {
    const k = ScenarioKey.expert42,
        scenario = scenarios[k],
        fog = scenario.fog ?? 0,
        g = new Game(k, 123456789);
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
    const g = new Game(ScenarioKey.expert41, 123456789);
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
    const g = new Game(ScenarioKey.advanced, 123456789);
    const ms  = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng),
        m2s = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    expect(ms).toEqual(m2s);
})

test("Fog strength changes each turn", () => {
    const g = new Game(ScenarioKey.advanced, 123456789);
    const ms  = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    g.resolveTurn();
    const m2s = g.oob.activeUnits().map(u => u.foggyStrength(1-u.player).mstrng);
    expect(ms).not.toEqual(m2s);
})

test("Fog values update each turn", () => {
    const g = new Game(ScenarioKey.advanced, 123456789),
        fs = g.oob.activeUnits().map(u => u.fog);
    g.resolveTurn();
    const f2s = g.oob.activeUnits().map(u => u.fog);
    expect(fs).not.toEqual(f2s);
})

test("Simple supply", () => {
    const g = new Game(ScenarioKey.learner, 123456789);
    g.oob.activeUnits().forEach(u => {
        expect(u.traceSupply()).toBe(1);
        expect(u.flags & unitFlag.oos).toBeFalsy();
    })
});

test("Supply blocked", () => {
    const g = new Game(ScenarioKey.advanced, 1234567899);
    const u0 = g.oob.activeUnits(PlayerKey.Russian)[0],
        u1 = g.oob.activeUnits(PlayerKey.German)[0];

    for (let lat=7; lat<=38; lat+=3) {
        g.mapboard.locationOf(Grid.lonlat(18,lat)).unitid = u1.id;
    }
    expect(u0.traceSupply()).toBe(0);
    expect(u0.flags & unitFlag.oos).toBeTruthy();
})

test("Supply thru gaps", () => {
    const g = new Game(ScenarioKey.advanced, 123456789);
    const u0 = g.oob.activeUnits(PlayerKey.Russian)[0],
        u1 = g.oob.activeUnits(PlayerKey.German)[0];

    for (let lat=7; lat<=38; lat+=4) {
        g.mapboard.locationOf(Grid.lonlat(18,lat)).unitid = u1.id;
    }
    expect(u0.traceSupply()).toBe(1);
    expect(u0.flags & unitFlag.oos).toBeFalsy();
})

test("Finns in supply", () => {
    const g = new Game(ScenarioKey.expert41, 123456789);
    const finns = g.oob.activeUnits(PlayerKey.German).filter(u => u.lat > 35);
    expect(finns.length).toBe(2);
    finns.forEach(u => expect(u.traceSupply()).toBe(1));
})

test("Air doesn't move in assault mode", () => {
    const g = new Game(ScenarioKey.expert41, 123456789);
    const flieger = g.oob.activeUnits(PlayerKey.German).filter(u => u.kind == UnitKindKey.air);
    flieger.forEach(u => expect(u.mode).toBe(UnitMode.assault));
    const start = flieger.map(u => u.location.gid);
    flieger.forEach(u => u.addOrder(DirectionKey.east));
    g.resolveTurn();
    flieger.forEach((u, i) => expect(u.location.gid).toBe(start[i]));
})