var turninfo = {
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

function showpath(u) {
    let pts = unitpath(u),
        pt = pts.pop();
    kreuze
        .style('top', `${(maxlat - pt.lat)*8}px`)
        .style('left', `${(maxlon - pt.lon)*8}px`)
        .style('visibility', 'visible')
        .node().scrollIntoView({block: "center", inline: "center"});

    arrows.interrupt().style('visibility', 'hidden');
    if (!pts.length) return;

    let i = 0;
    function animate() {
        let p = pts[i], dir = u.orders[i], step = directions[dir], interrupted = false;
        arrows.filter((_, j) => j == dir)
            .style('top', `${(maxlat - p.lat)*8}px`)
            .style('left', `${(maxlon - p.lon)*8}px`)
            .style('visibility', 'visible')
        .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .style('top', `${(maxlat - p.lat - step.lat)*8}px`)
            .style('left', `${(maxlon - p.lon - step.lon)*8}px`)
        .transition()
            .duration(0)
            .style('visibility', 'hidden')
        .on("interrupt", () => { interrupted = true; })
        .on("end", () => {
            i = (i+1) % u.orders.length;
            if (!interrupted) animate();
        });
    }

    animate();
}

function hidetarget() {
    kreuze.style('visibility', 'hidden');
    d3.select('.blink').classed('blink', false);
}

// d3.select('#map .row:nth-child(19) .chr:nth-child(26)').style('background-color', 'yellow').node().scrollIntoView({block: "center", inline: "center"});

function selectbyid(id) {
    hideselectedunit();
    let idx = activeunits[Player.german].findIndex(d => d.id == id);
    if (idx >= 0) selidx = idx;
    showselectedunit();
}
function selectrelative(offset) {
    hideselectedunit();
    let n = activeunits[Player.german].length;
    if (selidx === null) selidx = offset > 0 ? -1: 0;
    selidx = (selidx + n + offset) % n;
    showselectedunit();
}
function selectedunit() {
    return selidx === null ? null: activeunits[Player.german][selidx]
}
function hideselectedunit() {
    hidetarget();
    d3.selectAll('.blink').classed('blink', false);
}
function showselectedunit() {
    let u = selectedunit()
    if (!u) return;

    showpath(u);
    d3.selectAll('.chr')
        .filter(d => d.unitid == u.id)
        .classed('blink', true);
}

function unitpath(u) {
    let pt = {lon: u.lon, lat: u.lat},
        pts = [pt];
    u.orders.forEach(dir => {
        let p = stepdir(pt, dir);
        if (!p) return;
        pts.push(pt = p)
    });
    return pts;
}


function addorder(dir) {
    let u = selectedunit();
    if (!u) return;

    let pts = unitpath(u),
        pt = stepdir(pts.pop(), dir);
    if (pt) {
        u.orders.push(dir);
        showpath(u);
    }
}

function resetorders() {
    let u = selectedunit();
    if (!u) return;
    u.orders = [];
    showselectedunit();
}

function mapclick(ev, m) {
    if (m.unitid === null) return;

    const u = oob[m.unitid];
    putlines('#info-window', [u.label, `COMBAT: ${u.cstrng}  MUSTER: ${u.mstrng}`]);
    if (u.player == Player.german) {
        selectbyid(u.id);
    }
}

function keyhandler(e) {
    console.log(e.key);
    let n = activeunits[Player.german].length;
    switch (e.key) {

        case 'ArrowUp':
            addorder(Direction.north);
            break;
        case 'ArrowRight':
            addorder(Direction.east);
            break;
        case 'ArrowDown':
            addorder(Direction.south);
            break;
        case 'ArrowLeft':
            addorder(Direction.west);
            break;

        case 'Enter':
            hideselectedunit();
            break;

        case 'n':
            selectrelative(1);
            break;
        case 'p':
            selectrelative(-1);
            break;

        case ' ':
        case 'Escape':
            resetorders();
            break;

        case 'End':  // Fn + Rt on a mac
            nextturn();
            break;


//TODO handicap - increase muster strength of all your units by 50% but halve score
// modifes the VBI to change color of text window

        case 'z':
            zoom = zoom == 1 ? 2: 1;
            d3.select('#map').style('transform', `scale(${zoom})`);
            //TODO fix me centertarget();
            break;
        //TODO 'x' toggle extras like labels

        default:
            // console.log(`Ignoring ${e.key}`)
            return;
    }
    e.preventDefault();
};



function sortunits(units) {
    return units.sort((a, b) => ((b.lat - a.lat) << 8) + (b.lon - a.lon));
}


function start() {
    activeunits = players.map((_, i) => sortunits(oob.filter(u => u.player == i && u.arrive == 0)));

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

    nextturn();
}


function nextturn() {

    //TODO unselect if selected
    selidx = null;

    turninfo.turn++;

    //TODO enter new units

    let dt = new Date('1941/06/15');
    dt.setDate(dt.getDate() + 7*turninfo.turn);

    let label = dt.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
        minfo = monthdata[dt.getMonth()],  // note 0-indexed
        earth = weatherdata[minfo.weather].earth,
        trees = minfo.trees;

    putlines('#date-window', [label], '6A', 'B0')
    //TODO use setclr ?
    d3.selectAll('#terrain .chr').filter(d => d.terrain == Terrain.mountain_forest && d.alt == 1)
        .style('background-color', hexcolor(trees));
    //TODO hexcolor?
    d3.selectAll('#label-overlay .label').style('color', minfo.weather == Weather.snow ? '#333': '#ccc');
    //TODO should unit background change or not?
    setclr('#terrain .row, #unit-overlay .row', earth);

    if (minfo.rivers) {
        // => thaw swamp/rivers
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)

        let oldlat = turninfo.icelat,
            change = Math.floor(Math.random()*8) + 7,
            dir = minfo.rivers == 'freeze' ? -1 : +1;
        turninfo.icelat = Math.max(1, Math.min(39, turninfo.icelat + dir * change));

        //TODO update terrain type and color between oldlat/icelat
        // unfreeze as well as freeze...
        d3.selectAll('#terrain .chr')
            .filter(d => d.lat >= turninfo.icelat && (d.terrain == Terrain.river || d.terrain == Terrain.swamp))
            .style('background-color', hexcolor('0C'));
    }

    putlines('#map', mapdata, mapfg, '02', mapicon)
        .attr('title', JSON.stringify)
        .on('click', mapclick)
        .filter(d => d.unitid !== null)
        .classed('chr-unit', true)

    console.log(JSON.stringify(turninfo));
    console.log('Current score', score())
}
