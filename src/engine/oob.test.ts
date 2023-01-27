import {oobVariants} from './oob-data';
import {Oob} from './oob';
import {Game} from './game';
import {ScenarioKey, scenarios} from './scenarios';
import {PlayerKey} from './defs';



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