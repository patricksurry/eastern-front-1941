import {Player, players} from './defs.js';
import {Game} from './game.js';

var game;

beforeEach(() => {
    game = new Game().nextTurn();
})

test("Unit scores should be non-negative", () => {
    game.oob.forEach(u => expect(u.score()).toBeGreaterThanOrEqual(0));
});

test("Initial score should be 12", () => {
    expect(game.score(Player.german)).toBe(12);
});

test("Game roundtrip", () => {
    let arr = game.memento,
        token = game.token,
        buf = '';
    arr.forEach(v => buf += String.fromCharCode(v));
    let b64 = btoa(buf);
    console.log('state array length', arr.length, 'min/max', Math.min(...arr), Math.max(...arr), arr);
    console.log('state array of', arr.length, 'ints =>', token.length, 'byte token:', token);
    console.log('cf', b64.length, 'base64 encoding', b64);

    let game2 = new Game(token);

    expect(game2.oob.map(u => u.lon)).toEqual(game.oob.map(u => u.lon));

    expect(game2.token).toEqual(token);
})

test("Game turn", () => {
    let d = (players[game.human].homedir + 2) % 4;
    game.oob.activeUnits(game.human).forEach(u => {
        for (let i=0; i<2; i++) u.addOrder(d);
    });
    expect(() => {
        game.resolveTurn();
        game.nextTurn();
    }).not.toThrow();
})

