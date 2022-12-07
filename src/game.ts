import {wrap64, unwrap64, fibencode, fibdecode, rlencode, rldecode, bitsencode, bitsdecode} from './codec';
import {sum, PlayerKey, monthdata, MonthKey, WeatherKey} from './defs';
import {scenarios, ScenarioKey} from './scenarios';
import {Mapboard} from './map';
import {Oob} from './oob';
import {lfsr24, GeneratorT} from './rng';

import { EventEmitter } from 'events';

const
    tokenPrefix = 'EF41',
    tokenVersion = 1,
    rlSigil = 6;  // highest 5-bit coded value, so values 0..3 (& 4,5) are unchanged by rlencode

class Game extends EventEmitter {
    scenario = ScenarioKey.apx;
    human = PlayerKey.German;

    turn = 0;       // 0-based turn index
    // helpers derived from turn
    date = new Date('1941/6/22');
    month = MonthKey.Jun;
    weather = WeatherKey.dry;

    // flags
    handicap = 0;    // whether the game is handicapped

    mapboard: Mapboard;
    oob: Oob;
    rand: GeneratorT;

    constructor(token?: string) {
        super();

        this.on('message', (typ, obj) => {
            if (this.listenerCount('message') == 1) {
                let s = typeof obj === 'string' ? obj: obj.join('\n'),
                    logger = (typ == 'error' ? console.warn: console.info);
                logger(s);
            }
        });

        let memento: number[] | undefined = undefined,
            seed: number | undefined = undefined;
        if (token != null) {
            let payload = unwrap64(token, tokenPrefix);

            seed = bitsdecode(payload, 24);
            memento = rldecode(fibdecode(payload), rlSigil);

            if (memento.length < 7) throw new Error('Game: malformed save data');
            const version = memento.shift()!;
            if (version != tokenVersion) throw new Error(`Game: unrecognized save version ${version}`);

            this.scenario = memento.shift()!;
            this.human = memento.shift()!;
            this.turn = memento.shift()!;

            this.handicap = memento.shift()!;
        }
        this.mapboard = new Mapboard(this, memento);
        this.oob = new Oob(this, memento);
        this.rand = lfsr24(seed);

        if (memento && memento.length != 0) throw new Error("Game: unexpected save data overflow");
    }
    get memento() {
        // return a list of uint representing the state of the game
        return [
            tokenVersion,

            this.scenario,
            this.human,
            this.turn,

            +this.handicap,
        ].concat(
            this.mapboard.memento,
            this.oob.memento,
        );
    }
    get token() {
        let payload = ([] as number[]).concat(
            bitsencode(this.rand.state(), 24),
            fibencode(rlencode(this.memento, rlSigil))
        );
        return wrap64(payload, tokenPrefix);
    }
    start() {
        this.#newTurn(true);
        return this;
    }
    #setDates(start: Date) {
        let dt = new Date(start);
        this.date = new Date(dt.setDate(dt.getDate() + 7 * this.turn));
        this.month = this.date.getMonth() as MonthKey;     // note JS getMonth is 0-indexed
        this.weather = monthdata[this.month].weather;
    }
    #newTurn(initialize = false) {
        if (!initialize) this.turn++;

        this.#setDates(new Date(scenarios[this.scenario].start));

        this.mapboard.newTurn(initialize);
        this.oob.newTurn(initialize);

        this.emit('game', 'turn', this);
    }
    nextTurn(delay?: number) {
        // process the orders for this turn, if delay we tick asynchrnously,
        // otherwise we resolve synchronously
        // either way we proceed to subsequent startTurn or game end
        let tick = 0,
            g = this;  // for the closure

        this.oob.scheduleOrders();

        // Set up for a sync or async loop
        function tickTock() {
            g.oob.executeOrders(tick);
            g.emit('game', 'tick', tick);
            let next = ++tick < 32 ? tickTock : () => g.#newTurn();
            if (delay) setTimeout(next, delay);
            else next();
        }
        tickTock();
    }
    score(player: PlayerKey): number {
        // M.asm:4050
        let eastwest = sum(this.oob.map(u => u.score() * (u.player == player ? 1: -1))),
            bonus = sum(this.mapboard.cities.filter(c => c.owner == player).map(c => c.points)),
            score = Math.max(0, eastwest) + bonus;
        if (this.handicap) score >>= 1;
        return score;
    }
}

export {Game};
