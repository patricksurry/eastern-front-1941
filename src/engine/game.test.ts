import {PlayerKey, players} from './defs';
import {ScenarioKey, scenarios} from './scenarios';
import {Game} from './game';
import {Grid} from './grid';

function addSimpleOrders(g: Game, player?: PlayerKey) {
    for (const k in players) {
        const p = +k as PlayerKey,
            d = (players[p].homedir + 2) % 4;
        if (player != null && p != player) continue;
        g.oob.activeUnits(p).forEach(u => {
            for (let i=0; i<2; i++) {
                if (u.orderCost(d) < 255) u.addOrder(d);
            }
        });
    }
}

test("Unit scores should be non-negative", () => {
    const game = new Game(ScenarioKey.apx, 9792904);

    game.oob.forEach(u => expect(u.locScore()).toBeGreaterThanOrEqual(0));
});

test("Initial score check", () => {
    const expected = {
        [ScenarioKey.learner]: 0,
        [ScenarioKey.beginner]: 0,
        [ScenarioKey.intermediate]: 0,
        [ScenarioKey.advanced]: 0,
        [ScenarioKey.expert41]: -128,
        [ScenarioKey.expert42]: -130, // cartridge shows -131 after initial supply check, due to bug with Finns
        [ScenarioKey.apx]: 12,
    };

    Object.entries(expected).forEach(([k, score]) => {
        const g = new Game(+k as ScenarioKey, 123456789);
        //console.log(`checking initial score for ${scenarios[+k as ScenarioKey].label}`)
        expect(g.score(PlayerKey.German)).toBe(score);
    })
});

test("Game turn", () => {
    const game = new Game(ScenarioKey.apx, 9792904);
    addSimpleOrders(game);
    expect(() => game.resolveTurn()).not.toThrow();
})

test("Russians surprised in '41", () => {
    const game = new Game(ScenarioKey.expert41, 9792904),
        locs = game.oob.activeUnits(PlayerKey.Russian).map(u => ({id: u.id, lon: u.lon, lat: u.lat}));

    expect(game.oob.activeUnits(PlayerKey.Russian).every(u => !u.movable)).toBeTruthy();
    addSimpleOrders(game, PlayerKey.Russian);
    expect(game.oob.activeUnits(PlayerKey.Russian).every(u => u.orders.length==0)).toBeTruthy();
    game.resolveTurn();
    expect(locs.every(({id, lat, lon}) => {
        const u = game.oob.at(id);
        return u.lon == lon && u.lat == lat
    })).toBeTruthy();
})

test("Russians not surprised in '42", () => {
    const game = new Game(ScenarioKey.expert42, 9792904),
        locs = game.oob.activeUnits(PlayerKey.Russian).map(u => ({id: u.id, lon: u.lon, lat: u.lat}));

    expect(game.oob.activeUnits(PlayerKey.Russian).some(u => u.movable)).toBeTruthy();
    addSimpleOrders(game, PlayerKey.Russian);
    expect(game.oob.activeUnits(PlayerKey.Russian).some(u => u.orders.length)).toBeTruthy();
    game.resolveTurn();
    expect(locs.some(({id, lat, lon}) => {
        const u = game.oob.at(id);
        return u.lon != lon || u.lat != lat
    })).toBeTruthy();
})

test("Game roundtrip", () => {
    const game = new Game(ScenarioKey.apx, 9792904);
    addSimpleOrders(game);
    game.resolveTurn();

    const arr = game.memento,
        token = game.token;
    const buf = arr.map(v => String.fromCharCode(v)).join('');
    const b64 = Buffer.from(buf).toString('base64');
    console.log(`state array int[${arr.length}] => chr[${token.length}] token vs base64[${b64.length}]`);

    expect(game.oob.every(u => u.lon >= 0 && u.lat >= 0)).toBe(true);

    const game2 = new Game(token);
    expect(game2.token).toEqual(token);
})

test("Game turn roundtrip", () => {
    const game = new Game(ScenarioKey.apx, 9792904),
        game2 = new Game(game.token);
    addSimpleOrders(game);
    game.resolveTurn();
    addSimpleOrders(game2);
    game2.resolveTurn();
    expect(game2.token).toEqual(game.token);
})

test("Play and recover all scenarios", () => {
    const tokens: {[key: number]: string} = {};
    for (const s in scenarios) {
        const k = +s as ScenarioKey,
            g = new Game(k, 123456789);
        addSimpleOrders(g);
        g.resolveTurn();
        tokens[k] = g.token;
    }
    for (const s in scenarios) {
        const k = +s as ScenarioKey;
        const g2 = new Game(tokens[k]);
        expect(g2.token).toEqual(tokens[k]);
    }
});

test("nextTurn is idempotent on resume", () => {
    const g = new Game(ScenarioKey.expert42);
    addSimpleOrders(g);
    g.resolveTurn();
    const tok = g.token;
    g.nextTurn(true);
    expect(g.token).toEqual(tok);
});

test("Maelstrom doesn't throw", () => {
    Object.keys(scenarios).forEach(v => {
        const k = +v as ScenarioKey,
            g = new Game(k, 123456789),
            moscow = Grid.point(g.mapboard.cities[0]);

        expect(() => {
            let lastturn = -1;
            while (g.turn != lastturn) {
                lastturn = g.turn;
                g.oob.activeUnits().forEach(u => {
                    if (u.movable && u.orders.length == 0) {
                        const {orders} = g.mapboard.directPath(Grid.point(u), moscow);
                        u.setOrders(orders);
                    }
                });
                g.resolveTurn();
                // integrity test: only active units on the board
                g.mapboard.locations.forEach(
                    row => row.filter(p => p.unitid).forEach(p => {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        if (!g.oob.at(p.unitid!).active)
                            throw new Error(`${g.mapboard.describe(p)} occupied by inactive unit`);
                    })
                );
                // integrity tests: strength not out of whack, and each active unit on unique square
                const locmap = new Map<number, number>();
                g.oob.activeUnits().forEach(u => {
                    const loc = u.location;
                    if (locmap.has(loc.gid)) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        throw new Error(`scenario ${scenarios[k].label}, turn ${g.turn}: two active units occupy ${loc.gid}:\n${u.describe()}\nand\n${g.oob.at(locmap.get(loc.gid)!).describe()}`)
                    }
                    locmap.set(loc.gid, u.id);
                    if (loc.unitid != u.id) {
                        throw new Error(`scenario ${scenarios[k].label}, turn ${g.turn} ${u.describe()} not found at ${g.mapboard.describe(loc)} state ${g.token}`);
                    }
                    if(u.mstrng > 255 || u.cstrng > u.mstrng || u.cstrng < 0) {
                        throw new Error(`strength out of range for ${u.describe()}`)
                    }
                });
            }
        }).not.toThrow();
    });
})