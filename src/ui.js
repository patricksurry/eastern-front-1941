import { Player, players, Direction } from './defs.js';
import { Game } from './game.js';
import { Display, centered } from './display.js';
import {think, conclude} from './think.js';

import * as d3 from 'd3';


var game,
    display,
    focusid = null,  // current focused unit id
    lastid = null;   // must recent focused unit id (= focusid or null)

function mapHover(ev, loc) {
    let s = game.mapboard.describe(loc);
    if (loc.unitid != null) s += '\n' + game.oob[loc.unitid].describe(game.debug);
    d3.select(this).attr('title', s);
}

function mapClick(ev, loc) {
    let u = getFocusedUnit();
    game.errmsg();       // clear errror window
    if (loc.unitid == null || (u && u.id == loc.unitid)) {
        // clicking an empty square or already-focused unit unfocuses
        unfocusUnit();
        if (loc.cityid) game.infomsg(centered(game.mapboard.cities[loc.cityid].label.toUpperCase()));
    } else {
        focusUnit(game.oob[loc.unitid]);
    }
}

function toggleHelp() {
    game.help = !game.help;
    display.setVisibility('#help-window', game.help);
    if (game.turn == -1 && !game.help) game.nextTurn();  // start the game
}

function toggleExtras() {
    game.extras = !game.extras;
    display.setVisibility('.extra').style('visibility', game.extras);
}

function toggleDebug() {
    game.debug = !game.debug;
    display.setVisibility('.debug').style('visibility', game.debug);
}

function toggleZoom() {
    game.zoom = !game.zoom;
    display.setZoom(game.zoom, getFocusedUnit());
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
    End:        {action: endTurn, help: "Submit: [End], [Fn \x1f]"},
    z:          {action: toggleZoom, help: "Toggle: [z]oom, e[x]tras, debu[g]"},
    x:          {action: toggleExtras},
    g:          {action: toggleDebug},
    "?":        {action: toggleHelp},
    "/":        {action: toggleHelp},
}

function keyhandler(e) {
    let cmd = (
        game.help   // if help is displayed, pretend any key  is '?' to toggle off
        ? keyboardCommands["?"]
        : (keyboardCommands[e.key] || keyboardCommands[e.key.toLowerCase()])
    );
    if (cmd) {
        game.errmsg();   // clear error
        cmd.action(...(cmd.args || []));
        e.preventDefault();     // eat event if handled
    }
}

const helpText = [].concat(
    [
        "",
        "",
        centered("Welcome to Chris Crawford's"),
        centered("Eastern Front  1941"),
        "",
        centered("Ported by Patrick Surry }"),
        "",
    ],
    Object.values(keyboardCommands)
        .filter(d => d.help)
        .map(d => "  " + d.help),
    [
        "",
        centered("[?] shows this help"),
        "",
        centered("Press any key to play!"),
    ]
);

// main entry point
function start() {
    game = Game();
    display = Display(helpText, game);

    // for amusement add a hyperlink on help page
    d3.selectAll('#help-window .chr')
        .filter(d => d == "}")
        .on('click', () => window.open('https://github.com/patricksurry/eastern-front-1941'))

    // set up a click handler to toggle help
    d3.select('#help-window').on('click', toggleHelp);

    // add map square click handlers
    d3.selectAll('#map .chr')
        .on('click', mapClick)
        .on('mouseover', mapHover);

    // show the help page, which starts the game when dismissed the first time
    toggleHelp();

    // start the key handler
    if (game.human != null) document.addEventListener('keydown', keyhandler);
}

function endTurn() {
    const delay = 250;

    if (think.concluded) return;   // ignore if not thinking yet

    // process movement from prior turn
    unfocusUnit();

    game.errmsg('EXECUTING MOVE');

    // stop thinking and collect orders
    Object.values(Player).forEach(player => { if (player != game.human) conclude(player) });

    game.oob.scheduleOrders();

    let tick = 0;
    function tickTock() {
        // original code processes movement in reverse-oob order
        // could be interesting to randomize, or support a 'pause' order to handle traffic
        game.oob.executeOrders(tick);
        //TODO should this be ++tick or <= 32?
        setTimeout(tick++ < 32 ? tickTock : game.nextTurn, delay);
    }
    tickTock();  // loop via setTimeout then land in nextTurn
}

function focusUnit(u) {
    unfocusUnit();
    if (!u) return;

    focusid = u.id;
    lastid = focusid;

    game.infomsg(`     ${u.label}`, `     MUSTER: ${u.mstrng}  COMBAT: ${u.cstrng}`);

    if (game.extras) {
        let locs = u.reach();
        d3.selectAll('.chr-dim').filter(d => !(d.id in locs)).style('opacity', 0.5);
    }

    game.changed('unit', u, {event: 'selected'});

    if (u.player == game.human) {
        display.animateUnitPath(u);
    }
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
            let locid = game.mapboard.locationOf(game.oob[lastid]).id;
            while (++i < humanUnits.length && game.mapboard.locationOf(humanUnits[i]).id > locid) {/**/}
        }
    } else {
        i = offset > 0 ? -1: 0;
    }
    i = (i + n + offset) % n;
    focusUnit(humanUnits[i]);
}

function getFocusedUnit() {
    return focusid === null ? null: game.oob[focusid];
}

function unfocusUnit() {
    const u = getFocusedUnit();
    if (u) {
        game.changed('unit', u, {event: 'unselected'});
        display.animateUnitPath(null);
    }
    game.infomsg();
    focusid = null;
    d3.selectAll('.chr-dim').style('opacity', 0);
}

function showNewOrder(dir) {
    let u = getFocusedUnit();
    if (!u) return;
    if (u.player != game.human) {
        game.errmsg(`THAT IS A ${players[u.player].key.toUpperCase()} UNIT!`)
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
