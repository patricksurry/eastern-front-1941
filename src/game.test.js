import {score} from './game.js';
import {oob} from './unit.js';

test("Unit scores should be non-negative", () => {
    oob.forEach(u => expect(u.score()).toBeGreaterThanOrEqual(0));
});

