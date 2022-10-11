import {Player, players, Direction} from './defs.js';
import {Game} from './game.js';
import {Display} from './display.js';
import {Thinker} from './think.js';

import * as d3 from 'd3';

var game,
    display,
    ai,
    initialSetup = true,
    focusid = null,  // current focused unit id
    lastid = null;   // must recent focused unit id (= focusid or null)

function mapHover(ev, loc) {
    let s = game.mapboard.describe(loc);
    if (loc.unitid != null) s += '\n' + game.oob.at(loc.unitid).describe(game.debug);
    d3.select(this).attr('title', s);
}

function mapClick(ev, loc) {
    let u = getFocusedUnit();
    display.errmsg();       // clear errror window
    if (loc.unitid == null || (u && u.id == loc.unitid)) {
        // clicking an empty square or already-focused unit unfocuses
        unfocusUnit();
        if (loc.cityid) {
            const label = game.mapboard.cities[loc.cityid].label.toUpperCase()
            display.infomsg(Display.centered(label));
        }
    } else {
        focusUnit(game.oob.at(loc.unitid));
    }
}

function toggleHelp() {
    game.help = !game.help;
    display.setVisibility('#help-window', game.help);
    display.setVisibility('#map-scroller', !game.help);  //TODO needs to be display not visibility

    if (!game.help && initialSetup) nextTurn();  // start the game
}

function toggleExtras() {
    game.extras = !game.extras;
    display.setVisibility('.extra', game.extras);
}

function toggleDebug() {
    game.debug = !game.debug;
    display.setVisibility('.debug', game.debug);
}

function toggleZoom() {
    game.zoom = !game.zoom;
    display.setZoom(game.zoom, getFocusedUnit());
}

function setLevel(key) {
/*
    orginal game shows errmsg "[SELECT]: LEARNER  [START] TO BEGIN" with copyright in txt window,
    where [] is reverse video.  could switch to "[< >]: LEARNER  [ENTER] TO BEGIN(RESUME)"
    so < > increments level, # picks directly
*/
    console.log('set level', +key)
}

const keyboardCommands = {
    n:          {action: focusUnitRelative, args: [1], help: "Select: Click, [n]ext, [p]rev"},
    Enter:      {action: focusUnitRelative, args: [1]},
    p:          {action: focusUnitRelative, args: [-1]},
    ArrowUp:    {action: showNewOrder, args: [Direction.north], help: "Orders: \x1f, \x1c, \x1d, \x1e, [Bksp]"},
    ArrowRight: {action: showNewOrder, args: [Direction.east]},
    ArrowDown:  {action: showNewOrder, args: [Direction.south]},
    ArrowLeft:  {action: showNewOrder, args: [Direction.west]},
    Backspace:  {action: showNewOrder, args: [-1]},
    Escape:     {action: showNewOrder, help: "Cancel: [Space], [Esc]"},
    " ":        {action: showNewOrder},
    End:        {action: resolveTurn, help: "Submit: [End], [Fn \x1f]"},
    z:          {action: toggleZoom, help: "Toggle: [z]oom, e[x]tras, debu[g]"},
    x:          {action: toggleExtras},
    g:          {action: toggleDebug},
    "?":        {action: toggleHelp},
    "/":        {action: toggleHelp},
    "1":        {action: setLevel},
    "2":        {action: setLevel},
    "3":        {action: setLevel},
    "4":        {action: setLevel},
    "5":        {action: setLevel},
    "6":        {action: setLevel},
    "0":        {action: setLevel},
}

function keyhandler(e) {
    let cmd = (
        game.help   // if help is displayed, pretend any key  is '?' to toggle off
        ? keyboardCommands["?"]
        : (keyboardCommands[e.key] || keyboardCommands[e.key.toLowerCase()])
    );
    if (cmd) {
        let args = [].concat(cmd.args || [], [e.key]);
        display.errmsg();   // clear error
        cmd.action(...args);
        e.preventDefault();     // eat event if handled
    } else {
        console.log(e.key)
    }
}

const helpText = [].concat(
    [
        "",
        "",
        Display.centered("Welcome to Chris Crawford's"),
        Display.centered("Eastern Front  1941"),
        "",
        Display.centered("Ported by Patrick Surry }"),
        "",
    ],
    Object.values(keyboardCommands)
        .filter(d => d.help)
        .map(d => "  " + d.help),
    [
        "",
        Display.centered("[?] shows this help"),
        "",
        Display.centered("Press any key to play!"),
    ]
);

// main entry point
function start() {
    const resume = window.location.hash.slice(1) || null;
    game = new Game(resume);
    display = new Display(helpText, game);

    ai = Object.values(Player).filter(player => player != game.human).map(player => new Thinker(game, player));

    // for amusement add a hyperlink on help page
    d3.selectAll('#help-window .chr')
        .filter(d => d == "}")
        .on('click', () => window.open('https://github.com/patricksurry/eastern-front-1941'))

    // set up a click handler to toggle help
    d3.select('#help-window').on('click', toggleHelp);
    display.setVisibility('#help-window', false);

    // add map square click handlers
    d3.selectAll('#map .chr')
        .on('click', mapClick)
        .on('mouseover', mapHover);

    // either show help which starts the game on dismiss, or start immediately if resuming
    if (!resume) toggleHelp();
    else nextTurn();

    // start the key handler
    if (game.human != null) document.addEventListener('keydown', keyhandler);
}

function resolveTurn() {
    // if some thinker is `concluded` it means we're already resolving a turn, so ignore
    if (ai.some(t => t.concluded)) return;

    // tell thinker(s) to finalize orders
    ai.forEach(t => t.concludeRecurring());

    // process movement from prior turn
    display.errmsg('EXECUTING MOVE');
    unfocusUnit();

    game.resolveTurn(nextTurn, 250);
}

function nextTurn() {
    game.nextTurn(initialSetup);
    display.nextTurn(game.date, game.score(game.human));
    initialSetup = false;
    window.location.hash = game.token;
    // start thinking...
    ai.forEach(t => t.thinkRecurring(250));
}

function focusUnit(u) {
    unfocusUnit();
    if (!u) return;

    focusid = u.id;
    lastid = focusid;

    display.infomsg(`     ${u.label}`, `     MUSTER: ${u.mstrng}  COMBAT: ${u.cstrng}`);

    if (game.extras) {
        let locs = u.reach();
        d3.selectAll('.chr-dim').filter(d => !(d.id in locs)).style('opacity', 0.5);
    }

    game.notify('unit', 'selected', u);
}

function focusUnitRelative(offset) {
    // sort active germans descending by location id (right => left reading order)
    let humanUnits = game.oob.activeUnits(game.human)
            .sort((a, b) => game.mapboard.locationOf(b).id - game.mapboard.locationOf(a).id),
        n = humanUnits.length;
    var i;
    if (lastid) {
        i = humanUnits.findIndex(u => u.id == lastid);
        if (i < 0) {
            // if last unit no longer active, find the nearest active unit
            let locid = game.mapboard.locationOf(game.oob.at(lastid)).id;
            while (++i < humanUnits.length && game.mapboard.locationOf(humanUnits[i]).id > locid) {/**/}
        }
    } else {
        i = offset > 0 ? -1: 0;
    }
    i = (i + n + offset) % n;
    focusUnit(humanUnits[i]);
}

function getFocusedUnit() {
    return focusid === null ? null: game.oob.at(focusid);
}

function unfocusUnit() {
    const u = getFocusedUnit();
    if (u) game.notify('unit', 'unselected', u);
    display.infomsg();
    focusid = null;
    d3.selectAll('.chr-dim').style('opacity', 0);
    window.location.hash = game.token;
}

function showNewOrder(dir) {
    let u = getFocusedUnit();
    if (!u) return;
    if (!u.human) {
        display.errmsg(`THAT IS A ${players[u.player].key.toUpperCase()} UNIT!`)
        return;
    }
    if (dir == null) {
        if (u.orders.length == 0) {
            unfocusUnit();
            return;
        }
        u.resetOrders();
    } else if (dir == -1) {
        u.orders.pop();
    } else {
        u.addOrder(dir);
    }
    focusUnit(u);
}

export {start};
