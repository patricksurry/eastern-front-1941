import {players, PlayerKey, DirectionKey} from './defs';
import {ScenarioKey, scenarios} from './scenarios';
import {Grid} from './grid';
import {oobVariants} from './oob-data';
import {Oob} from './oob';
import {Game} from './game';


// the second last column of raw data is CORPT for both apx and cart,
// and indexes the main unit name.  the high bit of low nibble is unused
test("CORPT bit 4 is unused", () => {
    Object.values(oobVariants).forEach(
        data => data.forEach(xs => expect(xs[xs.length - 2] & 0x08).toBe(0))
    );
})

test("Load OoBs doesn't throw", () => {
    const g = new Game(ScenarioKey.learner);
    Object.keys(scenarios).forEach(k => {
        g.scenario = +k;
        expect(() => new Oob(g)).not.toThrow()
    });
})

test("Unit counts", () => {
    const game = new Game(ScenarioKey.apx, 9792904);

    expect(game.oob.filter(u => u.player == PlayerKey.German).length).toBe(55);
    expect(game.oob.filter(u => u.player == PlayerKey.Russian).length).toBe(104);
})

test("No ZoC for beginners", () => {
    const g = new Game(ScenarioKey.beginner, 12345),
        loc = g.mapboard.locationOf(Grid.point({lon: 40, lat: 15}));
    for (const k in players) {
        const p = +k as PlayerKey;
        expect(g.oob.zocAffecting(p, loc)).toBe(0);
    }
});

test("ZoC blocked", () => {
    // blocked scenario from doc/apxzoc1.png
    const g = new Game(ScenarioKey.advanced, 123456789);
    const p0 = g.oob.findIndex(u => u.active && u.player == PlayerKey.German),
        p1 = g.oob.findIndex(u => u.active && u.player == PlayerKey.Russian),
        u = g.oob.at(p0),
        start = g.mapboard.locationOf(Grid.lonlat(14, 25));

    g.mapboard.locationOf(Grid.lonlat(12, 24)).unitid = p1;
    g.mapboard.locationOf(Grid.lonlat(12, 26)).unitid = p1;

    u.moveTo(start);
    for (let i=0; i<4; i++) u.addOrder(DirectionKey.east);
    g.resolveTurn();
    expect(u).toMatchObject({lon: 13, lat: 25});
})

test("ZoC not blocked", () => {
    // unblocked scenario from doc/apxzoc1.png
    const g = new Game(ScenarioKey.learner, 123456789);
    const p0 = g.oob.findIndex(u => u.active && u.player == PlayerKey.German),
        p1 = g.oob.findIndex(u => u.active && u.player == PlayerKey.Russian),
        u = g.oob.at(p0),
        start = g.mapboard.locationOf(Grid.point({lon: 14, lat: 25}));

    g.mapboard.locationOf(Grid.lonlat(12, 24)).unitid = p1;
    g.mapboard.locationOf(Grid.lonlat(12, 27)).unitid = p1;

    u.moveTo(start);
    for (let i=0; i<4; i++) u.addOrder(DirectionKey.east);
    g.resolveTurn();
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

    const game = new Game(ScenarioKey.apx, 9792904),
        locs = Grid.squareSpiral(Grid.lonlat(20, 20), 1)
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
