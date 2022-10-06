import {encode, decode} from './vlq64.js';
import {sum, Player, Variant, Scenario} from './defs.js';
import {Mapboard} from './map.js';
import {Oob} from './oob.js';


function Game(options) {
    let memento = typeof options === 'string' ? decode(options): null,
        state = Object.assign(
        {
            score: Game.score,
            memento: Game.memento,
            token: Game.token,
        },
        Game.defaults,
    );
    if (memento) {
        let version = memento.shift();
        if (version != 1) throw new Error("Unknown save version", version);
        state.human = memento.shift();
        state.turn = memento.shift();
        state.variant = memento.shift();
        state.scenario = memento.shift();
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
    human: Player.german,
    turn: -1,       // 0-based turn counter, -1 is pre-game
    variant: Variant.apx,
    scenario: Scenario['41'],
    weather: null,
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
Game.memento = function() {
    // return a list of uint representing the state of the game
    return [
        1, // version
        this.human,
        this.turn,
        this.variant,
        this.scenario,
        this.help,
        this.handicap,
        this.zoom,
        this.extras,
        this.debug,
    ].concat(
        this.mapboard.memento(),
        this.oob.memento(),
    )
}
Game.token = function() {
    // TODO get/set window.location.href
    return encode(this.memento());
}

export {Game};
