import {PlayerKey, players} from './defs';
import {ScenarioKey, scenarios} from './scenarios';
import {Game} from './game';
import {Grid} from './grid';

let game: Game;

beforeEach(() => {
    game = new Game();
    game.rand.state(9792904);
})

function addSimpleOrders(g: Game) {
    for (const k in players) {
        const p = +k as PlayerKey,
            d = (players[p].homedir + 2) % 4;
        g.oob.activeUnits(p).forEach(u => {
            for (let i=0; i<2; i++) {
                if (u.orderCost(d) < 255) u.addOrder(d);
            }
        });
    }
}

test("Unit scores should be non-negative", () => {
    game.oob.forEach(u => expect(u.score()).toBeGreaterThanOrEqual(0));
});

test("Initial score check", () => {
    const expected = {
/* TODO
        [ScenarioKey.learner]: 0,
        [ScenarioKey.beginner]: 0,
        [ScenarioKey.intermediate]: 0,
        [ScenarioKey.advanced]: 0,
        [ScenarioKey.expert41]: -128,
        [ScenarioKey.expert42]: -131,
*/
        [ScenarioKey.apx]: 12,
    };

    Object.entries(expected).forEach(([k, score]) => {
        const g = new Game(+k as ScenarioKey);
        expect(g.score(PlayerKey.German)).toBe(score);
    })
});

test("Game turn", () => {
    addSimpleOrders(game);
    expect(() => game.nextTurn()).not.toThrow();
})

test("Game roundtrip", () => {
    addSimpleOrders(game);
    game.nextTurn();

    const arr = game.memento,
        token = game.token;
    const buf = arr.map(v => String.fromCharCode(v)).join('');
    const b64 = Buffer.from(buf).toString('base64');
    console.log('state array length', arr.length, 'min/max', Math.min(...arr), Math.max(...arr), arr);
    console.log('state array of', arr.length, 'ints =>', token.length, 'byte token:', token);
    console.log('cf', b64.length, 'base64 encoding', b64);

    expect(game.oob.every(u => u.lon >= 0 && u.lat >= 0)).toBe(true);

    const game2 = new Game(token);
    expect(game2.token).toEqual(token);
})

test("Game turn roundtrip", () => {
    const game2 = new Game(game.token);
    addSimpleOrders(game);
    game.nextTurn();
    addSimpleOrders(game2);
    game2.nextTurn();
    expect(game2.token).toEqual(game.token);
})

test("Play and recover all scenarios", () => {
    const tokens: Partial<Record<ScenarioKey, string>> = {};
    for (const s in scenarios) {
        const k = +s as ScenarioKey,
            g = new Game(k);
        addSimpleOrders(g);
        g.nextTurn();
        tokens[k] = g.token;
    }
    for (const s in scenarios) {
        const k = +s as ScenarioKey;
        const g2 = new Game(tokens[k]);
        expect(g2.token).toEqual(tokens[k]);
    }
});

test("Maelstrom doesn't throw", () => {
    const moscow = Grid.point(game.mapboard.cities[0]);

    Object.keys(scenarios).forEach(v => {
        const k = +v as ScenarioKey,
            g = new Game(k);

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
                g.nextTurn();

                // integrity tests
                g.mapboard.locations.forEach(
                    row => row.filter(p => p.unitid).forEach(p => {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        if (!g.oob.at(p.unitid!).active)
                            throw new Error(`${g.mapboard.describe(p)} occupied by inactive unit`);
                    })
                );
                g.oob.activeUnits().forEach(u => {
                    const mp = g.mapboard.locationOf(Grid.point(u));
                    if (mp.unitid != u.id)
                        throw new Error(`${u.describe()} not found at ${g.mapboard.describe(mp)}`);
                });
            }
        }).not.toThrow();
    });
})
