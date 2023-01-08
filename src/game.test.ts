import {PlayerKey, players} from './defs';
import {ScenarioKey} from './scenarios';
import {Game} from './game';

let game: Game;

// TODO - test reloaded game has units and cities on map

beforeEach(() => {
    game = new Game().start();
    game.rand.state(9792904);
})

function addSimpleOrders(g: Game) {
    for (const k in players) {
        const p = +k as PlayerKey,
            d = (players[p].homedir + 2) % 4;
        g.oob.activeUnits(p).forEach(u => {
            for (let i=0; i<2; i++) {
                if (u.moveCost(d)) u.addOrder(d);
            }
        });
    }
}

test("Unit scores should be non-negative", () => {
    game.oob.forEach(u => expect(u.score()).toBeGreaterThanOrEqual(0));
});

test("Initial score should be 12", () => {
    expect(game.score(PlayerKey.German)).toBe(12);
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

test("Switch scenario", () => {
    //TODO fails with game.start(ScenarioKey.expert42);
    game.start(ScenarioKey.advanced);
    addSimpleOrders(game);
    game.nextTurn();
    const token = game.token;
    const game2 = new Game(token);
    expect(game2.token).toEqual(token);
})

