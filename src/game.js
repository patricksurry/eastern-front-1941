import {fibencode, fibdecode, rlencode, rldecode} from './fibcodec.js';
import {sum, Player, Variant, Scenario, scenarios, monthdata} from './defs.js';
import {Mapboard} from './map.js';
import {Oob} from './oob.js';

const tokenVersion = 1,
    rlmarker = 6;  // highest 5-bit coded value, so values 0..3 (& 4,5) are unchanged by rlencode

class Game {
    variant = Variant.apx;
    scenario = Scenario['41'];
    human = Player.german;
    turn = 0;       // 0-based turn index

    // helpers derived from turn
    date = null;
    month = null;
    weather = null;

    // flags
    help = 0;        // after init, has 0/1 indicating help hide/show state
    handicap = 0;    // whether the game is handicapped
    zoom = 0;        // display zoom on or off
    extras = 1;      // display extras like labels, health, zoc
    debug = 0;       // whether to display debug info for Russian units

    listeners = [];

    constructor(options) {
        let memento = null;
        if (typeof options === 'string') {
            memento = rldecode(fibdecode(options), rlmarker);
            const version = memento.shift();
            if (version != tokenVersion) throw new Error("Unrecognized save version", version);

            this.variant = memento.shift();
            this.scenario = memento.shift();
            this.human = memento.shift();
            this.turn = memento.shift();

            this.help = memento.shift();
            this.handicap = memento.shift();
            this.zoom = memento.shift();
            this.extras = memento.shift();
            this.debug = memento.shift();
        } else {
            Object.assign(this, options ?? {});
        }
        this.mapboard = new Mapboard(this, memento);
        this.oob = new Oob(this, memento);

        if (memento && memento.length != 0) throw new Error("Unexpected save data overflow");
    }
    score(player) {
        // M.asm:4050
        let eastwest = sum(this.oob.map(u => u.score(this) * (u.player == player ? 1: -1))),
            bonus = sum(this.mapboard.cities.filter(c => c.owner == player).map(c => c.points)),
            score = Math.max(0, eastwest) + bonus;
        if (this.handicap) score >>= 1;
        return score;
    }
    nextTurn(initialSetup) {
        // start next turn, add a week to the date
        if (!initialSetup) this.turn++;

        let dt = new Date(scenarios[this.scenario].start);
        this.date = new Date(dt.setDate(dt.getDate() + 7 * this.turn));
        this.month = this.date.getMonth();     // note JS getMonth is 0-indexed
        this.weather = monthdata[this.month].weather;

        this.mapboard.nextTurn(initialSetup);
        this.oob.nextTurn(initialSetup);
        return this;
    }
    resolveTurn(callback, delay) {
        // process the orders for this turn
        // if `callback` is provided the turn is processed asynchronously in increments of delay (ms)
        // and callback is called on completion.
        // otherwise the turn is resolved immediately and returns to caller
        const oob = this.oob;
        let tick = 0;

        oob.scheduleOrders();

        // Set up a function that loops synchronously or asynchornously
        function tickTock() {
            // original code processes movement in reverse-oob order
            // could be interesting to randomize, or support a 'pause' order to handle traffic
            oob.executeOrders(tick++);
            if (callback) {
                setTimeout(tick < 32 ? tickTock : callback, delay || 250);
            } else if (tick < 32) {
                tickTock();
            }
        }
        tickTock();
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
    notify(typ, event, obj, options) {
        // console.debug(`game.notify: ${typ}-${event}`);
        this.listeners.forEach(listener => listener(typ, event, obj, options));

        if (typ == 'msg') {
            let s = typeof obj === 'string' ? obj: obj.join('\n'),
                logger = (event == 'err' ? console.warn: console.info);
            logger(s);
        }
    }
    get memento() {
        // return a list of uint representing the state of the game
        return [
            tokenVersion,

            this.variant,
            this.scenario,
            this.human,
            this.turn,

            +this.help,
            +this.handicap,
            +this.zoom,
            +this.extras,
            +this.debug,
        ].concat(
            this.mapboard.memento,
            this.oob.memento,
        );
    }
    get token() {
        return fibencode(rlencode(this.memento, rlmarker));
    }
}

export {Game};
