import {
    players, Player, terraintypes, Terrain, directions, Direction, weatherdata, Weather,
    monthdata, anticColor
} from './defs.js';
import {
    centered, errmsg, infomsg,
    focusUnit, focusUnitRelative, getFocusedUnit, unfocusUnit, showNewOrder, stopUnitsFlashing,
    setupDisplay, putlines, repaintMap,
    toggleZoom, toggleExtras, toggleDebug,
    putIcon
} from './display.js';
import {think, conclude} from './think.js';

import * as d3 from 'd3';

/*
    <script src="static/d3-7.6.1.min.js"></script>
    <script src="static/data.js"></script>
    <script src="static/map.js"></script>
    <script src="static/unit.js"></script>
    <script src="static/think.js"></script>
    <script src="static/display.js"></script>
    <script src="static/main.js"></script>
    <script src="static/tests.js"></script>
*/


function mapinfo(ev, m) {
    // maybe location describe?
    let clauses = [
        `[${m.id}] ${terraintypes[m.terrain].key}` + (m.alt ? "-alt": ""),
        `lon ${m.lon}, lat ${m.lat}`,
        // `ZoC: German ${zoneOfControl(Player.german, m)}, Russian ${zoneOfControl(Player.russian, m)}`,
    ]
    //TODO check debug, maybe refactor as Unit.describe?
    //TODO why is this here not display?
    if (m.unitid != null) {
        let u = oob[m.unitid];
        clauses.push(''),
        clauses.push(`[${u.id}] ${u.mstrng} / ${u.cstrng}`);
        clauses.push(`${u.label}`);
        if (u.ifr && gameState.debug) {
            let s = directions.map((d, i) => `${d.key[0]}: ${u.ifrdir[i]}`).join(' ');
            clauses.push(`ifr: ${u.ifr}; ${s}`);
            clauses.push(
                u.objective
                ? `obj: lon ${u.objective.lon} lat ${u.objective.lat}`
                : 'no objective'
            );
        }
        // clauses.push(`Supply: ${traceSupply(u, gameState.weather)}`);
    }
    d3.select(this).attr('title', clauses.join('\n'));
}

function mapclick(ev, m) {
    let u = getFocusedUnit();
    errmsg();
    if (m.unitid == null || (u && u.id == m.unitid)) {
        unfocusUnit();
        if (m.cityid) infomsg(centered(cities[m.cityid].label.toUpperCase()));
    } else {
        focusUnit(oob[m.unitid]);
    }
}

function toggleHelp() {
    gameState.help = !gameState.help;
    d3.select('#help-window').style('display', gameState.help ? 'block': 'none');
    d3.select('#map-scroller').style('display', gameState.help ? 'none': 'block');

    if (gameState.turn == -1 && !gameState.help) nextTurn();  // start the game
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
        gameState.help
        ? keyboardCommands["?"]
        : (keyboardCommands[e.key] || keyboardCommands[e.key.toLowerCase()])
    );
    if (cmd) {
        errmsg();
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

/*
    var r = document.querySelector(':root');
    r.style.setProperty('--fontmap', 'url(fontmap-cart.png)');
*/

    // configure the scenario-based start date
    gameState.startDate = new Date('1941/06/22');

    setupDisplay(helpText, mapboard, oob);

    // for amusement add a hyperlink on help page
    d3.selectAll('#help-window .chr')
        .filter(d => d == "}")
        .on('click', () => window.open('https://github.com/patricksurry/eastern-front-1941'))
        .select('.chr-fg')
        .style('background-color', anticColor('94'));

    // set up a click handler to toggle help
    d3.select('#help-window').on('click', toggleHelp);

    // add map square click handlers
    d3.selectAll('#map .chr')
        .on('click', mapclick)
        .on('mouseover', mapinfo);

    putlines('#date-window', ["", centered("EASTERN FRONT 1941", 20)], '6A', 'B0')

    infomsg(centered('COPYRIGHT 1982 ATARI'), centered('ALL RIGHTS RESERVED'));

    // start the key handler
    if (gameState.human != null) document.addEventListener('keydown', keyhandler);

    // show the help page, which starts the game when dismissed the first time
    toggleHelp();
}

function endTurn() {
    const delay = 250;

    if (think.concluded) {
        return;
    }
    // process movement from prior turn
    unfocusUnit();

    errmsg('EXECUTING MOVE');

    // stop thinking and collect orders
    Object.values(Player).forEach(player => { if (player != gameState.human) conclude(player) });

    oob.scheduleOrders();

    let tick = 0;
    function tickTock() {
        // original code processes movement in reverse-oob order
        // could be interesting to randomize, or support a 'pause' order to handle traffic
        stopUnitsFlashing();
        oob.executeOrders(tick);
        //TODO should this be ++tick or <= 32?
        setTimeout(tick++ < 32 ? tickTock: nextTurn, delay);
    }
    tickTock();  // loop via setTimeout then land in nextTurn
}

function nextTurn() {
    // start next turn, add a week to the date
    gameState.turn++;
    // clear error, show score for this turn
    errmsg('PLEASE ENTER YOUR ORDERS NOW');
    stopUnitsFlashing();

    oob.regroup();
    // TODO trace supply, with CSTR >> 1 if not, russian MSTR+2 (for apx)
    oob.reinforce();

    let dt = new Date(gameState.startDate);
    dt.setDate(dt.getDate() + 7 * gameState.turn);
    let datelabel = dt.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'}),
        minfo = monthdata[dt.getMonth()];  // note JS getMonth is 0-indexed

    putlines('#date-window', ["", " " + datelabel])

    gameState.weather = minfo.weather;

    if (minfo.water != null) game.mapboard.freezeThaw(minfo.water);

    // update the tree color in place in the terrain data :grimace:
    terraintypes[Terrain.mountain_forest].altcolor = minfo.trees;

    // paint the current map colors
    repaintMap(game.mapboard.fgcolor, weatherdata[minfo.weather].earth, minfo.weather == Weather.snow ? '04': '08');

    // start thinking...
    players.forEach((_, player) => { if (player != gameState.human) think(player); });
}

export {start, d3, putIcon};
