var gameState = {
    turn: 0,
    icelat: 39,     // via M.ASM:8600 PSXVAL initial value is 0x27
}

var zoom = 1
    handicap = 0,
    activeunits = null,  // a list of active units for each player
    selidx = null,  // current selected german unit
    kreuze = null,  // d3 selection with the chr displaying the maltakreuze
    arrows = null;  // d3 selection of the four arrow chrs


function stepdir(pt, dir) {
    let {lon: lon, lat: lat} = pt,
        {lon: dlon, lat: dlat} = directions[dir],
        lon2 = lon + dlon,
        lat2 = lat + dlat,
        legal = (
            mapdata[maxlat - lat2][maxlon - lon2].terrain != Terrain.impassable
            && !(
                (dir == Direction.north || dir == Direction.south)
                ? blocked[0].find(d => d.lon == lon && d.lat == (dir == Direction.north ? lat : lat2))
                : blocked[1].find(d => d.lon == (dir == Direction.west ? lon : lon2) && d.lat == lat)
            ));
    return legal ? {lon: lon2, lat: lat2}: null;
}

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

function showUnitInfo(u) {
    putlines('#info-window', [u.label, `COMBAT: ${u.cstrng}  MUSTER: ${u.mstrng}`]);
}

function focusUnitById(id) {
    unfocusUnit();
    let idx = activeunits[Player.german].findIndex(d => d.id == id);
    if (idx >= 0) selidx = idx;
    showFocusedUnit();
}

function focusUnitRelative(offset) {
    unfocusUnit();
    let n = activeunits[Player.german].length;
    if (selidx === null) selidx = offset > 0 ? -1: 0;
    selidx = (selidx + n + offset) % n;
    showFocusedUnit();
}

function getFocusedUnit() {
    return selidx === null ? null: activeunits[Player.german][selidx]
}

function unfocusUnit() {
    hideUnitPath();
    d3.selectAll('.blink').classed('blink', false);
}

function showFocusedUnit() {
    let u = getFocusedUnit()
    if (!u) return;

    showUnitInfo(u);
    showUnitPath(u);
    d3.selectAll('.chr-fg')
        .filter(d => d.unitid == u.id)
        .classed('blink', true);
}

function showUnitPath(u) {
    let pts = getUnitPath(u),
        pt = pts.pop();
    kreuze
        .style('top', `${(maxlat - pt.lat)*8}px`)
        .style('left', `${(maxlon - pt.lon)*8}px`)
        .style('visibility', 'visible')
        .node().scrollIntoView({block: "center", inline: "center"});

    arrows.style('visibility', 'hidden').interrupt();
    if (!pts.length) return;

    let i = 0;
    function animateUnitPath() {
        let p = pts[i], dir = u.orders[i], step = directions[dir], interrupted = false;
        arrows.filter((_, j) => j == dir)
            .style('top', `${(maxlat - p.lat)*8}px`)
            .style('left', `${(maxlon - p.lon)*8}px`)
        .transition()
            .delay(i ? 0: 250)
            .duration(500)
            .ease(d3.easeLinear)
            .style('visibility', 'visible')
            .style('top', `${(maxlat - p.lat - step.lat)*8}px`)
            .style('left', `${(maxlon - p.lon - step.lon)*8}px`)
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

function getUnitPath(u) {
    let pt = {lon: u.lon, lat: u.lat},
        pts = [pt];
    u.orders.forEach(dir => {
        let p = stepdir(pt, dir);
        if (!p) return;
        pts.push(pt = p)
    });
    return pts;
}

function addOrder(dir) {
    let u = getFocusedUnit();
    if (!u) return;

    let pts = getUnitPath(u),
        pt = stepdir(pts.pop(), dir);
    if (pt) {
        u.orders.push(dir);
        showUnitPath(u);
    }
}

function resetOrders() {
    let u = getFocusedUnit();
    if (!u) return;
    u.orders = [];
    showFocusedUnit();
}

function mapclick(ev, m) {
    if (m.unitid === null) return;

    const u = oob[m.unitid];

    if (u.player == Player.german) focusUnitById(u.id);
    else showUnitInfo(u);
}

function keyhandler(e) {
    console.log(e.key);
    let n = activeunits[Player.german].length;
    switch (e.key) {

        case 'ArrowUp':
            addOrder(Direction.north);
            break;
        case 'ArrowRight':
            addOrder(Direction.east);
            break;
        case 'ArrowDown':
            addOrder(Direction.south);
            break;
        case 'ArrowLeft':
            addOrder(Direction.west);
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
            resetOrders();
            break;

        case 'End':  // Fn + Rt on a mac
            nextTurn();
            break;

        //TODO 'x' toggle extras like labels

        //TODO handicap - increase muster strength of all your units by 50% but halve score
        // modifes the VBI to change color of text window

        case 'z':
            var elt;
            if (getFocusedUnit()) {
                elt = kreuze.node();
            } else {
                let x = 320/2,
                    y = 144/2 + d3.select('#map-window').node().offsetTop - window.scrollY;
                elt = document.elementFromPoint(x*4, y*4);
                console.log(x, y, d3.select(elt).datum())
            }
            zoom = zoom == 1 ? 2: 1;
            d3.select('#map-window .container').classed('doubled', zoom == 2);
            elt.scrollIntoView({block: "center", inline: "center"})
            break;

        default:
            return;
    }
    e.preventDefault();
};



function sortUnits(units) {
    return units.sort((a, b) => ((b.lat - a.lat) << 8) + (b.lon - a.lon));
}


function start() {
    activeunits = players.map((_, i) => sortUnits(oob.filter(u => u.player == i && u.arrive == 0)));

    activeunits.forEach(us => us.forEach(u => {mapdata[maxlat-u.lat][maxlon-u.lon].unitid = u.id}));

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
        .text(d => d.label)
        .style('left', d => `${(maxlon - d.lon) * 8 + 4}px`)
        .style('top', d => `${(maxlat - d.lat) * 8 - 4}px`)
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

    //TODO unselect if selected
    selidx = null;

    gameState.turn++;

    //TODO enter new units

    let dt = new Date('1941/06/15');
    dt.setDate(dt.getDate() + 7*gameState.turn);

    let label = dt.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
        minfo = monthdata[dt.getMonth()];  // note JS getMonth is 0-indexed

    putlines('#date-window .container', [label], '6A', 'B0')

    console.log('month info', minfo);

    //TODO hexcolor?
    d3.selectAll('#map .label')
        .style('color', minfo.weather == Weather.snow ? '#333': '#ccc');

    if (minfo.rivers) {
        // => thaw swamp/rivers
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)

        let oldlat = gameState.icelat,
            change = Math.floor(Math.random()*8) + 7;

        if (minfo.rivers == 'freeze') {
            gameState.icelat = Math.max(1, oldlat - change);
            for (i=gameState.icelat; i<oldlat; i++)
                mapdata[maxlat-i].forEach(d => {
                    if (d.terrain == Terrain.swamp) d.terrain = Terrain.frozen_swamp;
                    if (d.terrain == Terrain.river) d.terrain = Terrain.frozen_river;
                });
        } else {
            gameState.icelat = Math.min(39, oldlat + change);
            for (i=oldlat; i<gameState.icelat; i++)
                mapdata[maxlat-i].forEach(d => {
                    if (d.terrain == Terrain.frozen_swamp) d.terrain = Terrain.swamp;
                    if (d.terrain == Terrain.frozen_river) d.terrain = Terrain.river;
                });
        }
    }

    // update the tree color in place
    terraintypes[Terrain.mountain_forest].altcolor = minfo.trees;

    putlines('#map', mapdata, mapfg, weatherdata[minfo.weather].earth, mapicon)
        .attr('title', JSON.stringify)
        .on('click', mapclick)
        .filter(d => d.unitid !== null)
        .classed('chr-unit', true)

    console.log(JSON.stringify(gameState));
    console.log('Current score', score())
}

