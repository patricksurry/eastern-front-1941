import {oob} from './unit.js';
import {Player, cities} from './data.js';

// Atari had a memory location that could be read for a byte of random noise
function randbyte() {
    return Math.floor(Math.random()*256);
}

function sum(xs) {
    return xs.reduce((s, x) => s + x, 0);
}

function score(player) {
    // M.asm:4050
    let eastwest = sum(oob.map(u => u.score() * (u.player == player ? 1: -1))),
        bonus = sum(cities.filter(c => c.owner == player).map(c => c.points)),
        score = Math.max(0, eastwest) + bonus;
    if (gameState.handicap) score >>= 1;
    return score;
}

var gameState = {
    human: Player.german,
    turn: -1,       // 0-based turn counter, -1 is pre-game
    startDate: null,
    icelat: 39,     // via M.ASM:8600 PSXVAL initial value is 0x27
    handicap: 0,    // whether the game is handicapped
    zoom: false,    // display zoom on or off
    extras: true,   // display extras like labels, health, zoc
    debug: false,   // whether to display debug info for Russian units
    weather: null,
    help: null,     // after init, has boolean indicating help hide/show state
}

export {
    randbyte,
    sum,
    gameState,
    score,
}
