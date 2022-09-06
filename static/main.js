/*
TODO
- switch to rand256 instead of randint
- game end check after scoring turn 40 M.ASM:4780 with 'GAME OVER' message
- static units can't move
- attack != units can't attack
- showNewOrder: flash on illegal move
- flash style for combat
- something to toggle handicap - increase muster strength of all your units by 50% but halve score, self-modifies VBI to change color of text window
- update map after each tick with delay
- swith maplabel colors to atari hexcolors
- score in info window instead of console

- extras should just be a class tag with visibility on/off

- add a health meter with mstrng/cstrng bar scaled to 255 as height or width of unit
- show movement cost or range somehow?

- implement AI
*/

var gameState = {
    turn: -1,       // 0-index turn counter
    icelat: 39,     // via M.ASM:8600 PSXVAL initial value is 0x27
    handicap: 0,    // whether the game is handicapped
    zoom: false,    // display zoom on or off
    extras: false,  // display extras like labels, health, zoc
    weather: null,
}

var activeunits = null,  // a list of active units for each player
    focusid = null,  // current focused unit id
    kreuze = null,  // d3 selection with the chr displaying the maltakreuze
    arrows = null;  // d3 selection of the four arrow chrs


function mapfg(d) {
    if (d.unitid !== null) {
        return players[oob[d.unitid].player].color;
    }
    let ter = terraintypes[d.terrain];
    return d.alt ? ter.altcolor : ter.color
}

function mapicon(d) {
    return d.unitid == null ? d.icon: oob[d.unitid].icon;
}

function mapinfo(ev, m) {
    let clauses = [
        `lon ${m.lon}, lat ${m.lat}`,
        `${terraintypes[m.terrain].key}` + (m.alt ? "-alt": ""),
        // `ZoC: German ${zoneOfControl(Player.german, m)}, Russian ${zoneOfControl(Player.russian, m)}`,
    ]
    if (m.unitid != null) {
        let u = oob[m.unitid];
        clauses.push(`${u.label} (${u.cstrng}/${u.mstrng})`);
        // clauses.push(`Supply: ${traceSupply(u, gameState.weather)}`);
    }
    d3.select(this).attr('title', clauses.join('\n'));
}

function mapclick(ev, m) {
    if (m.unitid == null || m.unitid == focusid) unfocusUnit();
    else focusUnit(oob[m.unitid]);
}

function focusUnit(u) {
    unfocusUnit();
    if (!u) return;

    focusid = u.id;
    showUnitInfo(u);
    if (u.player == Player.german) {
        showUnitPath(u);
        d3.selectAll('.chr-fg')
            .filter(d => d.unitid == u.id)
            .classed('blink', true);
    }
}

function focusUnitRelative(offset) {
    let german = activeunits[Player.german],
        n = german.length,
        i = focusid == null ? null: german.findIndex(u => u.id == focusid);
    if (i == null || i < 0) i = offset > 0 ? -1: 0;
    i = (i + n + offset) % n;
    focusUnit(german[i]);
}

function unfocusUnit() {
    focusid = null;
    hideUnitPath();
    d3.selectAll('.blink').classed('blink', false);
    d3.selectAll('.chr-dim').style('visibility', 'hidden');
}

function getFocusedUnit() {
    return focusid === null ? null: oob[focusid];
}

function showUnitInfo(u) {
    putlines('#info-window', [u.label, `COMBAT: ${u.cstrng}  MUSTER: ${u.mstrng}`]);
    let locs = reach(u);
    d3.selectAll('.chr-dim').filter(d => !(d.id in locs)).style('visibility', 'visible');
}

function showUnitPath(u) {
    let path = getUnitPath(u),
        loc = path.pop();
    kreuze
        .style('top', `${loc.row*8}px`)
        .style('left', `${loc.col*8}px`)
        .style('visibility', 'visible')
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
        resetOrders(u);
    } else {
        let dest = addOrder(u, dir);
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

function keyhandler(e) {
    switch (e.key) {
        case 'ArrowUp':
            showNewOrder(Direction.north);
            break;
        case 'ArrowRight':
            showNewOrder(Direction.east);
            break;
        case 'ArrowDown':
            showNewOrder(Direction.south);
            break;
        case 'ArrowLeft':
            showNewOrder(Direction.west);
            break;

        case 'Enter':
            unfocusUnit();
            break;

        case 'n':
            focusUnitRelative(1);
            break;
        case 'p':
            focusUnitRelative(-1);
            break;

        case ' ':
        case 'Escape':
            showNewOrder(null);
            break;

        case 'End':  // Fn + Rt on a mac
            nextTurn();
            break;

        case 'x':
            toggleExtras();
            break;

        case 'z':
            toggleZoom();
            break;

        default:
            // allow event to propagate
            return;
    }
    e.preventDefault();     //  eat handled events
};


function start() {
    setclr('body', 'D4');
    setclr('.date-rule', '1A');
    setclr('.info-rule', '02');  // same as map
    setclr('.err-rule', '8A');

    putlines('#info-window', ['EASTERN FRONT 1941', 'COPYRIGHT 1981 CHRIS CRAWFORD'], '28', '22')
    putlines('#err-window', ['PLEASE ENTER YOUR ORDERS NOW'], '22', '3A')

    d3.select('#map')
        .selectAll('div.label')
        .data(cities)
      .join('div')
        .classed('label', true)
        .classed('extra', true)
        .text(d => d.label)
        .style('left', d => `${Location.of(d).col * 8 + 4}px`)
        .style('top', d => `${Location.of(d).row * 8 - 4}px`)
        ;

    let chrs = putlines('#overlay', [[256], directions.map(d => d.icon)], '1A', null, d => d)
        .style('visibility', 'hidden');
    kreuze = chrs.filter(d => d == 256);
    arrows = chrs.filter(d => d != 256);

    /* debug blocked sides */
    /*
    putchrs(
        '#label-overlay',
        blocked[0].map(d => {{lat: d.lat+0.5, lon: d.lon}})
            .concat(blocked[1].map(d => {{d.lat, d.lon+0.5}})),
        '6A', '02',
        d => Math.floor(d[0]) != d[0] ? 82 : 124,
    );
    */

    document.addEventListener('keydown', keyhandler);

    nextTurn();
}


function nextTurn() {
    // process movement from prior turn

    // M.asm:4950 movement execution
    oob.forEach(u => { u.tick = nextOrderCost(u); });

    for (tick=0; tick<32; tick++) {
        // original code processes movement in reverse-oob order
        oob.filter(u => u.tick == tick).reverse().forEach(maybeMove);
    }

    gameState.turn++;

    fcsidx = null;
    unfocusUnit();

    activeunits = Object.keys(players).map(
        i => {
            let us = oob.filter(u => u.player == i);
            // M.ASM:3720  delay reinforcements scheduled for an occuplied square
            us.filter(u => u.arrive == gameState.turn && Location.of(u).unitid != null)
                .forEach(u => {u.arrive++});
            return us.filter(u => u.arrive <= gameState.turn)
                // M.ASM:5070  recover combat strength
                .map(u => {if (u.mstrng - u.cstrng >= 2) u.cstring += 1 + randint(2); return u;})
                .sort((a, b) => ((b.lat - a.lat) << 8) + (b.lon - a.lon));
        }
    );

    activeunits.forEach(us => us.forEach(u => {Location.of(u).unitid = u.id}));

    let dt = new Date('1941/06/15');
    dt.setDate(dt.getDate() + 7*gameState.turn);

    let label = dt.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
        minfo = monthdata[dt.getMonth()];  // note JS getMonth is 0-indexed

    gameState.weather = minfo.weather;

    putlines('#date-window .container', [label], '6A', 'B0')

    d3.selectAll('#map .label')
        .style('color', minfo.weather == Weather.snow ? '#333': '#ccc');

    if (minfo.rivers) {
        // => thaw swamp/rivers
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)

        let oldlat = gameState.icelat,
            change = randint(8) + 7;

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

    let chrs = putlines('#map', mapboard, mapfg, weatherdata[minfo.weather].earth, mapicon)
        .on('click', mapclick)
        .on('mouseover', mapinfo);

    chrs.filter(d => d.unitid != null)
        .classed('chr-unit', true)
        .append('div')
        .classed('chr-overlay', true)
        .classed('extra', true)
        .append('div')
        .classed('chr-mstrng', true)
        .style('width', d => (90*oob[d.unitid].mstrng/255) + '%')
        .append('div')
        .classed('chr-cstrng', true)
        .style('width', d => (100*oob[d.unitid].cstrng/oob[d.unitid].mstrng) + '%');

    chrs.append('div')
        .classed('chr-dim', true)
        .classed('extra', true);

    console.log(JSON.stringify(gameState));
    console.log('Current score', score());
}

