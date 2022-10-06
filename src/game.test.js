import {Player, Weather} from './defs.js';
import {Game} from './game.js';
import {Mapboard} from './map.js';
import {Oob} from './oob.js';

const game = Game();

test("Unit scores should be non-negative", () => {
    game.oob.forEach(u => expect(u.score()).toBeGreaterThanOrEqual(0));
});

test("Initial score should be 12", () => {
    expect(game.score(Player.german)).toBe(12);
});

test("Game roundtrip", () => {
    // game.nextturn() => oob.nexturn(), mapboard.nextturn() ?
    game.turn++;
    game.oob.regroup();
    game.oob.reinforce();
    game.weather = Weather.dry;

    let token = game.token();
    console.log(token);

    let game2 = Game(token);

    expect(game2.oob.map(u => u.lon)).toEqual(game.oob.map(u => u.lon));
})


