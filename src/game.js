import {encode, decode} from './vlq64.js';
import {sum, Player, players, Variant, Scenario, scenarios, monthdata} from './defs.js';
import {Mapboard} from './map.js';
import {Oob} from './oob.js';

const tokenVersion = 1;

function Game(options) {
    let memento = typeof options === 'string' ? decode(options): null,
        state = Object.assign(
        {
            score: Game.score,
            memento: Game.memento,
            token: Game.token,
            nextTurn: Game.nextTurn,
            setTurn: Game.setTurn,
            changed: Game.changed,
            errmsg: Game.errmsg,
            infomsg: Game.infomsg,
            datemsg: Game.datemsg,
        },
        Game.defaults,
    );
    if (memento) {
        let version = memento.shift();
        if (version != tokenVersion) throw new Error("Unrecognized save version", version);

        state.variant = memento.shift();
        state.scenario = memento.shift();
        state.human = memento.shift();
        state.turn = memento.shift();

        state.help = memento.shift();
        state.handicap = memento.shift();
        state.zoom = memento.shift();
        state.extras = memento.shift();
        state.debug = memento.shift();
    } else {
        Object.assign(state, options);
    }
    state.mapboard = Mapboard(state, memento);
    state.oob = Oob(state, memento);
    if (memento && memento.length != 0) throw new Error("Unexpected save data overflow");
    return state;
}
Game.defaults = {
    variant: Variant.apx,
    scenario: Scenario['41'],
    human: Player.german,
    turn: -1,       // 0-based turn counter, -1 is pre-game

    // helpers derived from turn
    date: null,
    month: null,
    weather: null,

    // flags
    help: 0,        // after init, has 0/1 indicating help hide/show state
    handicap: 0,    // whether the game is handicapped
    zoom: 0,        // display zoom on or off
    extras: 1,      // display extras like labels, health, zoc
    debug: 0,       // whether to display debug info for Russian units
};
Game.score = function(player) {
    // M.asm:4050
    let eastwest = sum(this.oob.map(u => u.score(this) * (u.player == player ? 1: -1))),
        bonus = sum(this.mapboard.cities.filter(c => c.owner == player).map(c => c.points)),
        score = Math.max(0, eastwest) + bonus;
    if (this.handicap) score >>= 1;
    return score;
}
Game.setTurn = function(turn) {
    // update turn-based helpers
    if (!(turn == null)) this.turn = turn;

    let dt = new Date(scenarios[this.scenario].start);
    this.date = new Date(dt.setDate(dt.getDate() + 7 * this.turn));
    this.month = this.date.getMonth();     // note JS getMonth is 0-indexed
    this.weather = monthdata[this.month].weather;

    return dt;
}
Game.nextTurn = function() {
    // start next turn, add a week to the date
    this.turn++;
    this.setTurn();

    this.mapboard.nextTurn();
    this.oob.nextTurn();

    if (this.display) {
        this.display.nextTurn(this.date);

        // start thinking...
        //TODO configurable delay if interactive vs headless?
//        players.forEach((_, player) => { if (player != this.human) think(player); });
    }
}
Game.changed = function(typ, obj, options) {
    if (!this.display) return;
    switch (typ) {
        case 'map':
            this.display.paintMap(options);
            break;
        case 'unit':
            this.display.paintUnit(obj, options);
            break;
        default:
            console.warn('Ignoring game.changed', typ);
    }
}
Game.errmsg = function(txt) {
    let v = this.score(this.human);
    if (this.display) this.display._errmsg(v, txt);
    else console.warn(`[score=${v}] txt`);
}
Game.infomsg = function(...lines) {
    if (this.display) this.display._infomsg(...lines);
    else console.log(lines.join('\n'));
}
Game.datemsg = function(...lines) {
    if (this.display) this.display._datemsg(...lines);
    else console.log(lines.join('\n'));
}
Game.memento = function() {
    // return a list of uint representing the state of the game
    return [
        tokenVersion,

        this.variant,
        this.scenario,
        this.human,
        this.turn,

        this.help,
        this.handicap,
        this.zoom,
        this.extras,
        this.debug,
    ].concat(
        this.mapboard.memento(),
        this.oob.memento(),
    );
}
Game.token = function() {
    // TODO get/set window.location.href
    return encode(this.memento());
}

export {Game};
