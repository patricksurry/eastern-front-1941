/*
TODO

- game end check after scoring turn 40 M.ASM:4780 with 'GAME OVER' message

- toggle key for handicap - increase muster strength of all your units by 50% but halve score, self-modifies VBI to change color of text window

- update title/hover on click (for supply and zoc)

- some indicator for zoc (both sides?) on click square

- fogofwar option for enemy unit strength a la cartridge
*/

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

function mapinfo(ev, m) {
    // maybe location describe?
    let clauses = [
        `[${m.id}] ${terraintypes[m.terrain].key}` + (m.alt ? "-alt": ""),
        `lon ${m.lon}, lat ${m.lat}`,
        // `ZoC: German ${zoneOfControl(Player.german, m)}, Russian ${zoneOfControl(Player.russian, m)}`,
    ]
    //TODO check debug, maybe refactor as Unit.describe?
    if (m.unitid != null) {
        let u = oob[m.unitid];
        clauses.push(''),
        clauses.push(`[${u.id}] ${u.mstrng} / ${u.cstrng}`);
        clauses.push(`${u.label}`);
        if (u.ifr && gameState.debug) {
            let s = directions.map((d, i) => `${d.key[0]}: ${u.ifrdir[i]}`).join(' ');
            clauses.push(`ifr: ${u.ifr}; ${s}`);
        }
        // clauses.push(`Supply: ${traceSupply(u, gameState.weather)}`);
    }
    d3.select(this).attr('title', clauses.join('\n'));
}

function mapclick(ev, m) {
    errmsg();
    if (m.unitid == null || m.unitid == focusid) {
        unfocusUnit();
        if (m.cityid) infomsg(centered(cities[m.cityid].label.toUpperCase()));
    } else {
        focusUnit(oob[m.unitid]);
    }
}

function toggleZoom() {
    var elt;
    // remember either the focused unit's target, or elt currently near center of screen
    if (getFocusedUnit()) {
        elt = kreuze.node();
    } else {
        let x = 320/2,
            y = 144/2 + d3.select('#map-window').node().offsetTop - window.scrollY;
        elt = document.elementFromPoint(x*4, y*4);
    }
    // toggle zoom level, apply it, and re-center target eleemnt
    gameState.zoom = !gameState.zoom;
    d3.select('#map-window .container').classed('doubled', gameState.zoom);
    elt.scrollIntoView({block: "center", inline: "center"})
}

function toggleExtras() {
    gameState.extras = !gameState.extras;
    d3.selectAll('.extra').style('visibility', gameState.extras ? 'visible': 'hidden')
}

function toggleDebug() {
    gameState.debug = !gameState.debug;
    d3.selectAll('.debug').style('visibility', gameState.debug ? 'visible': 'hidden')
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
    // configure the scenario-based start date
    gameState.startDate = new Date('1941/06/22');

    setupDisplay(helpText, mapboard, oob);

    // add a link on help page
    d3.selectAll('#help-window .chr-fg')
        .filter(d => d == "}")
        .style('background-color', hexcolor('94'))
        .on('click', () => window.open('https://github.com/patricksurry/eastern-front-1941'));

    // set up a click handler to toggle help
    d3.select('#help-window').on('click', toggleHelp);

    // add map square click handlers
    d3.selectAll('#map .chr-fg')
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
    const delay = 100;

    if (think.concluded) {
        return;
    }
    // process movement from prior turn
    fcsidx = null;
    unfocusUnit();

    errmsg('EXECUTING MOVE');

    // stop thinking and collect orders
    Object.values(Player).forEach(player => { if (player != gameState.human) conclude(player) });

    // M.asm:4950 movement execution
    oob.forEach(u => u.scheduleOrder(true));

    let tick = 0;
    function tickTock() {
        // original code processes movement in reverse-oob order
        oob.filter(u => u.tick == tick).reverse().forEach(u => u.tryOrder());
        if (tick++ < 32) {
            setTimeout(tickTock, delay);
        } else {
            nextTurn();
        }
    }
    tickTock();
}

function nextTurn() {
    // start next turn, add a week to the date
    gameState.turn++;
    // clear error, show score for this turn
    errmsg('PLEASE ENTER YOUR ORDERS NOW');

    let dt = new Date(gameState.startDate);
    dt.setDate(dt.getDate() + 7 * gameState.turn);
    let datelabel = dt.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
        minfo = monthdata[dt.getMonth()];  // note JS getMonth is 0-indexed

    gameState.weather = minfo.weather;

    // regroup, reinforce, recover...
    oob.filter(u => u.isActive()).forEach(u => u.recover());

    // M.ASM:3720  delay reinforcements scheduled for an occuplied square
    oob.filter(u => u.arrive == gameState.turn)
        .forEach(u => {if (Location.of(u).unitid != null) u.arrive++;});

    // show newly arrived units
    d3.selectAll('#units .chr')
        .filter(u => u.arrive == gameState.turn)
        .each(function(u) { u.moveTo(Location.of(u)); });

    putlines('#date-window', ["", " " + datelabel])

    if (minfo.rivers) {
        // => thaw swamp/rivers
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)

        let oldlat = gameState.icelat,
            change = (rand256() & 0x8) + 7;

        if (minfo.rivers == 'freeze') {
            gameState.icelat = Math.max(1, oldlat - change);
            for (i=gameState.icelat; i<oldlat; i++)
                mapboard[maxlat - i].forEach(d => {
                    if (d.terrain == Terrain.swamp) d.terrain = Terrain.frozen_swamp;
                    if (d.terrain == Terrain.river) d.terrain = Terrain.frozen_river;
                });
        } else {
            gameState.icelat = Math.min(39, oldlat + change);
            for (i=oldlat; i<gameState.icelat; i++)
                mapboard[maxlat - i].forEach(d => {
                    if (d.terrain == Terrain.frozen_swamp) d.terrain = Terrain.swamp;
                    if (d.terrain == Terrain.frozen_river) d.terrain = Terrain.river;
                });
        }
    }

    // update the tree color in place
    terraintypes[Terrain.mountain_forest].altcolor = minfo.trees;

    // apply current fg/bg colors to map and unit background
    const mapfg = (loc) => {
            let tinfo = terraintypes[loc.terrain],
                alt = (loc.terrain == Terrain.city) ? cities[loc.cityid].owner : loc.alt;
            return alt ? tinfo.altcolor : tinfo.color;
        },
        earth = weatherdata[minfo.weather].earth;

    d3.selectAll('#map .chr-bg, #units .chr-bg')
        .style('background-color', hexcolor(earth));

    d3.selectAll('#map .chr-fg')
        .style('background-color', d => hexcolor(mapfg(d)))

    // contrasting label colors
    d3.selectAll('.label')
        .style('color', minfo.weather == Weather.snow ? hexcolor('04'): hexcolor('08'));

    // start thinking...
    players.forEach((_, player) => { if (player != gameState.human) think(player); });
}
