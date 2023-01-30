/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {wrap64, unwrap64, fibencode, fibdecode, rlencode, rldecode, bitsencode, bitsdecode} from './codec';
import {sum, PlayerKey, monthdata, MonthKey, WeatherKey} from './defs';
import {scenarios, ScenarioKey} from './scenarios';
import {Mapboard, type MapEvent, type MapPoint} from './map';
import {Oob} from './oob';
import type {Unit, UnitEvent} from './unit';
import {lfsr24, type Generator} from './rng';

import {EventEmitter} from 'events';

const
    tokenPrefix = 'EF41',
    tokenVersion = 1,
    rlSigil = 6;  // highest 5-bit coded value, so values 0..3 (& 4,5) are unchanged by rlencode

type GameEvent = 'turn' | 'tick' | 'over';
type MessageLevel = 'error'; // currently only error is defined

class Game extends EventEmitter {
    scenario = ScenarioKey.learner;
    human = PlayerKey.German;

    turn = 0;       // 0-based turn index

    // helpers derived from turn via #setDates
    date!: Date;
    month!: MonthKey;
    weather!: WeatherKey;

    // flags
    handicap = 0;    // whether the game is handicapped

    mapboard: Mapboard;
    oob: Oob;
    rand: Generator;

    // create a game from a saved state token, a scenario key, or default
    constructor(token: string)
    constructor(scenario: ScenarioKey, seed?: number)
    constructor(tokenOrScenario: string | ScenarioKey, seed?: number) {
        super();    // init EventEmitter
        let memento: number[] | undefined;

        if (typeof tokenOrScenario === 'number') {
            this.scenario = tokenOrScenario;
        } else if (typeof tokenOrScenario === 'string') {
            const payload = unwrap64(tokenOrScenario, tokenPrefix);

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
        // create the oob and maboard, using memento if there was one
        this.mapboard = new Mapboard(this, memento);
        this.oob = new Oob(this, memento);
        this.rand = lfsr24(seed);

        if (memento && memento.length != 0) {
            throw new Error("Game: unexpected save data overflow");
        }

        this.nextTurn(true);
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
        const payload = ([] as number[]).concat(
            bitsencode(this.rand.state(), 24),
            fibencode(rlencode(this.memento, rlSigil))
        );
        return wrap64(payload, tokenPrefix);
    }
    get over() {
        const scenario = scenarios[this.scenario];

        return (
            this.turn >= scenario.endturn
            || this.score(PlayerKey.German) >= scenario.scoring.win
            // special end condition for learner mode
            || (this.scenario == ScenarioKey.learner && this.mapboard.cities[0].owner == PlayerKey.German)
        );
    }
    resolveTurn(delay?: number) {
        // external entry for nextTurn to process orders for this turn
        // and advance to next
        // if delay is provided we tick asynchrnously,
        // otherwise we resolve synchronously
        let tick = 0;

        this.oob.scheduleOrders();

        // Set up for a sync or async loop
        const tickTock = () => {
            this.oob.executeOrders(tick);
            this.emit('game', 'tick');
            const next = tick++ < 32 ? tickTock : () => this.nextTurn();
            if (!delay) next(); else setTimeout(next, delay);
        }
        tickTock();
    }
    nextTurn(startOrResume = false) {
        const dt = new Date(scenarios[this.scenario].start),
            ongoing = !this.over;

        if (!startOrResume && ongoing) this.turn++;

        this.date = new Date(dt.setDate(dt.getDate() + 7 * this.turn));
        this.month = this.date.getMonth() as MonthKey;     // note JS getMonth is 0-indexed
        this.weather = monthdata[this.month].weather;

        if (startOrResume || ongoing) {
            this.mapboard.nextTurn(startOrResume);
            this.oob.nextTurn(startOrResume);
        }

        this.emit('game', ongoing ? 'turn': 'over');
    }
    score(player: PlayerKey): number {
        // M.asm:4050
        const scoring = scenarios[this.scenario].scoring;
        const eastwest = sum(this.oob.map(u => u.locScore() * (u.player == player ? 1: -1))),
            strng = this.oob.scoreStrengths(player),
            cities = sum(this.mapboard.cities.filter(c => c.owner == player).map(c => c.points));
        let score = cities + (scoring.location ? Math.max(0, eastwest) : 0) + strng + (scoring.adjust ?? 0);
        if (this.handicap) score >>= 1;
        return score;
    }
    // declare legal event signatures
    emit(event: 'game', action: GameEvent): boolean;
    emit(event: 'map', action: MapEvent, loc: MapPoint): boolean;
    emit(event: 'unit', action: UnitEvent, u: Unit): boolean;
    emit(event: 'message', level: MessageLevel, message: string): boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(event: string, ...args: any[]): boolean {
        return super.emit(event, ...args)
    }
    on(event: 'game', listener: (action: GameEvent) => void): this;
    on(event: 'map', listener: (action: MapEvent, loc: MapPoint) => void): this;
    on(event: 'unit', listener: (action: UnitEvent, u: Unit) => void): this;
    on(event: 'message', listener: (level: MessageLevel, message: string) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener)
    }
}

export {Game};
