/*
TODO
- map update in place each turn, e.g. freezing rivers

- opacity vs visibility so we can fade in/fade out reserves/daed; start reserves hidden in right spot

- game end check after scoring turn 40 M.ASM:4780 with 'GAME OVER' message

- showNewOrder: flash on illegal move

- flash style for combat

- toggle key for handicap - increase muster strength of all your units by 50% but halve score, self-modifies VBI to change color of text window

- switch maplabel colors to atari hexcolors

- score in info window instead of console

- update title/hover on click (for supply and zoc)

- add an 'active' flag or function for units to make oob filtering easier

- hide units at correct position and remove the optional delay stuff, visibilty => opacity so can animate

- implement AI
*/

var gameState = {
    turn: -1,       // 0-index turn counter
    icelat: 39,     // via M.ASM:8600 PSXVAL initial value is 0x27
    handicap: 0,    // whether the game is handicapped
    zoom: false,    // display zoom on or off
    extras: false,  // display extras like labels, health, zoc
    weather: null,
    help: false,     // whether help is showing
}

var activeunits = null,  // a list of active units for each player
    focusid = null,  // current focused unit id
    lastid = null,  // must recent focused unit id (= focusid or null)
    kreuze = null,  // d3 selection with the chr displaying the maltakreuze
    arrows = null;  // d3 selection of the four arrow chrs

function mapinfo(ev, m) {
    let clauses = [
        `lon ${m.lon}, lat ${m.lat}`,
        `${terraintypes[m.terrain].key}` + (m.alt ? "-alt": ""),
        // `ZoC: German ${zoneOfControl(Player.german, m)}, Russian ${zoneOfControl(Player.russian, m)}`,
    ]
    if (m.unitid != null) {
        let u = oob[m.unitid];
        clauses.push(`[${u.id}] ${u.label} (${u.cstrng}/${u.mstrng})`);
        // clauses.push(`Supply: ${traceSupply(u, gameState.weather)}`);
    }
    d3.select(this).attr('title', clauses.join('\n'));
}

function mapclick(ev, m) {
    if (m.unitid == null || m.unitid == focusid) {
        unfocusUnit();
    } else {
        focusUnit(oob[m.unitid]);
    }
}

function focusUnit(u) {
    unfocusUnit();
    if (!u) return;

    focusid = u.id;
    lastid = focusid;
    showUnitInfo(u);
    if (u.player == Player.german) {
        showUnitPath(u);
        u.chr.classed('blink', true);
    }
}

function focusUnitRelative(offset) {
    let german = activeunits[Player.german],
        n = german.length,
        i = lastid == null ? null: german.findIndex(u => u.id == lastid);
    if (i == null || i < 0) i = offset > 0 ? -1: 0;
    i = (i + n + offset) % n;
    focusUnit(german[i]);
}

function unfocusUnit() {
    focusid = null;
    hideUnitPath();
    d3.selectAll('.blink').classed('blink', false);
    d3.selectAll('.chr-dim').style('opacity', 0);
}

function getFocusedUnit() {
    return focusid === null ? null: oob[focusid];
}

function showUnitInfo(u) {
    putlines('#info-window', [u.label, `COMBAT: ${u.cstrng}  MUSTER: ${u.mstrng}`]);
    let locs = u.reach();
    d3.selectAll('.chr-dim').filter(d => !(d.id in locs)).style('opacity', 0.5);
}

function showSelAt(sel, loc, duration) {
    if (duration != 0) sel = sel.transition().duration(duration || 100);
    return sel
        .style('top', `${loc.row*8}px`)
        .style('left', `${loc.col*8}px`)
        .style('visibility', 'visible');

        //TODO opacity 0/1?, add delay arg, e.g. showSelAt(sel, loc, 0), hideSel(), show...
}

function showUnitPath(u) {
    let path = u.path(),
        loc = path.pop();
    showSelAt(kreuze, loc)
        .node().scrollIntoView({block: "center", inline: "center"});

    arrows.style('visibility', 'hidden').interrupt();
    if (!path.length) return;

    let i = 0;
    function animateUnitPath() {
        let loc = path[i],
            dir = u.orders[i],
            dest = loc.neighbor(dir),
            interrupted = false;
        arrows.filter((_, j) => j == dir)
            .style('top', `${loc.row*8}px`)
            .style('left', `${loc.col*8}px`)
        .transition()
            .delay(i ? 0: 250)
            .duration(500)
            .ease(d3.easeLinear)
            .style('visibility', 'visible')
            .style('top', `${dest.row*8}px`)
            .style('left', `${dest.col*8}px`)
        .transition()
            .duration(0)
            .style('visibility', 'hidden')
        .on("interrupt", () => { interrupted = true; })
        .on("end", () => {
            i = (i+1) % u.orders.length;
            if (!interrupted) animateUnitPath();
        });
    }

    animateUnitPath();
}

function hideUnitPath() {
    kreuze.style('visibility', 'hidden');
    arrows.style('visibility', 'hidden').interrupt();
    d3.select('.blink').classed('blink', false);
}

function showNewOrder(dir) {
    let u = getFocusedUnit();
    if (!u) return;
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

function toggleHelp() {
    gameState.help = !gameState.help;
    d3.select('#help-window').style('display', gameState.help ? 'block': 'none');
    d3.select('#map-scroller').style('display', gameState.help ? 'none': 'block');
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
    x:          {action: toggleExtras, help: "Toggle: e[x]tras, [z]oom, [?]help"},
    z:          {action: toggleZoom},
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
        cmd.action(...(cmd.args || []));
        e.preventDefault();     // eat event if handled
    }
}

const helpText = [].concat(
    [
        "",
        "",
        "      Welcome to Chris Crawford's       ",
        "          Eastern Front  1941           ",
        "",
        "       Ported by Patrick Surry }        ",
        "",
    ],
    Object.values(keyboardCommands)
        .filter(d => d.help)
        .map(d => "  " + d.help),
    [
        "",
        "        Press any key to play!          ",
    ]
)

function start() {
    setclr('body', 'D4');
    setclr('.date-rule', '1A');
    setclr('.info-rule', '02');  // same as map
    setclr('.err-rule', '8A');

    putlines('#info-window', ['EASTERN FRONT 1941', 'COPYRIGHT 1981 CHRIS CRAWFORD'], '28', '22')
    putlines('#err-window', ['PLEASE ENTER YOUR ORDERS NOW'], '22', '3A')
    putlines('#help-window', helpText, '04', '0e')
        .filter(d => d == "}")
        .select('.chr-fg')
        .style('background-color', hexcolor('94'))
        .on('click', () => window.open('https://github.com/patricksurry/eastern-front-1941'));

    d3.select('#help-window').on('click', toggleHelp)

    toggleHelp();

//TODO
/* weatherdata[minfo.weather].earth */

    const mapfg = (d) => {
            let ter = terraintypes[d.terrain];
            return d.alt ? ter.altcolor : ter.color
        },
        unitfg = (d) => players[d.player].color,
        icon = (d) => d.icon,
        earth = weatherdata[monthdata[Month.September].weather].earth; //TODO

    let chrs = putlines('#map', mapboard, mapfg, earth, icon);
    chrs.selectAll('.chr-fg')
        .on('click', mapclick)
        .on('mouseover', mapinfo);
    chrs.append('div')
        .classed('chr-dim', true)
        .classed('extra', true);

    putlines('#units', [oob], unitfg, earth, icon)
        .style('visibility', 'hidden')
        .each(function(u) {
            u.chr = d3.select(this);
            u.show = function(duration) {
                showSelAt(this.chr, Location.of(this), duration);
                this.chr.select('.chr-mstrng').style('width', (90 * this.mstrng/255) + '%');
                this.chr.select('.chr-cstrng').style('width', (100 * this.cstrng/this.mstrng) + '%');
            };
            u.hide = function(duration) {
                //TODO opacity
                this.chr.style('visibility', 'hidden');
            };
            showSelAt(u.chr, Location.of(u), 0).style('visibility', 'hidden');
        })
        .append('div')
        .attr('class', 'chr-overlay extra')
        .append('div')
        .classed('chr-mstrng', true)
        .append('div')
        .classed('chr-cstrng', true)

    d3.select('#labels')
        .selectAll('div.label')
        .data(cities)
      .join('div')
        .classed('label', true)
        .classed('extra', true)
        .text(d => d.label)
        .style('left', d => `${Location.of(d).col * 8 + 4}px`)
        .style('top', d => `${Location.of(d).row * 8 - 4}px`)
        ;

    chrs = putlines('#overlay', [[256], directions.map(d => d.icon)], '1A', null, d => d)
        .style('visibility', 'hidden');
    kreuze = chrs.filter(d => d == 256);
    arrows = chrs.filter(d => d != 256);

    document.addEventListener('keydown', keyhandler);

    endTurn(0);
}

function endTurn(delay) {
    // process movement from prior turn
    fcsidx = null;
    unfocusUnit();

    // M.asm:4950 movement execution
    oob.forEach(u => u.scheduleOrder(true));

    let tick = 0;
    function tickTock() {
        // original code processes movement in reverse-oob order
        oob.filter(u => u.tick == tick).reverse().forEach(u => u.tryOrder());
        if (tick++ < 32) {
            setTimeout(tickTock, delay != null ? delay: 100);
        } else {
            nextTurn();
        }
    }
    tickTock();
}

function nextTurn() {
    // start next turn
    gameState.turn++;

    // M.ASM:3720  delay reinforcements scheduled for an occuplied square
    oob.filter(u => u.arrive == gameState.turn)
        .forEach(u => {if (Location.of(u).unitid != null) u.arrive++;});

    //TODO get rid of active units, just search oob for focus, careful about hidden ones?
    activeunits = Object.keys(players).map(
        i => {
            return oob
                .filter(u => u.player == i && u.arrive <= gameState.turn)
                // M.ASM:5070  recover combat strength
                .map(u => {if (u.mstrng - u.cstrng >= 2) u.cstring += 1 + (rand256() & 0x1); return u;})
                .sort((a, b) => ((b.lat - a.lat) << 8) + (b.lon - a.lon));
        }
    );

    // show newly arrived units
    d3.selectAll('#units .chr')
        .filter(u => u.arrive == gameState.turn)
        .each(function(u) { u.moveTo(Location.of(u)); });

    let dt = new Date('1941/06/22');
    dt.setDate(dt.getDate() + 7*gameState.turn);

    let label = dt.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
        minfo = monthdata[dt.getMonth()];  // note JS getMonth is 0-indexed

    gameState.weather = minfo.weather;

    putlines('#date-window .container', [label], '6A', 'B0')

    d3.selectAll('.label')
        .style('color', minfo.weather == Weather.snow ? '#333': '#ccc');

    //TODO update terrain in place

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

    //TODO
    console.log(JSON.stringify(gameState));
    console.log('Current score', score());
}

