import {PlayerKey, players} from './defs';
import {Game} from './game';

let game: Game;

beforeEach(() => {
    game = new Game().start();
    game.rand.state(9792904);
})

function addSimpleOrders() {
    for (const k in players) {
        const p = +k as PlayerKey,
            d = (players[p].homedir + 2) % 4;
        game.oob.activeUnits(p).forEach(u => {
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
    addSimpleOrders();
    expect(() => game.nextTurn()).not.toThrow();
})

test("Game roundtrip", () => {
    addSimpleOrders();
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


