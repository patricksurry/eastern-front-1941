// the map is made up of locations, each with a lon and lat
function Location(lon, lat, ...data) {
    if (!Number.isInteger(lon) || !Number.isInteger(lat)) throw("bad Location(lon: int, lat: int, ...data)")
    return Object.assign({
            lon,
            lat,
            valid: lat >= 0 && lat < maxlat && lon >= 0 && lon < maxlon,
            id:  (lat << 8) + lon,
            row: maxlat - lat,
            col: maxlon - lon,
            put: Location.put,
            neighbor: Location.neighbor,
        }, ...data);
}
Location.of = d => {
    let loc = Location(d.lon, d.lat);
    return loc.valid ? mapboard[loc.row][loc.col]: loc;
}
Location.fromid = x => Location.of({lon: x & 0xff, lat: x >> 8});
Location.put = function(d) { d.lon = this.lon; d.lat = this.lat; return d; }
Location.neighbor = function(dir, skipcheck) {
    let d = directions[dir],
        lon = this.lon + d.dlon,
        lat = this.lat + d.dlat,
        loc = Location.of({lon, lat});

    if (skipcheck) return loc;
    if (!loc.valid) return null;

    let legal = (
            loc.terrain != Terrain.impassable
            && !(
                (dir == Direction.north || dir == Direction.south)
                ? blocked[0].find(d => d.lon == this.lon && d.lat == (dir == Direction.north ? this.lat : loc.lat))
                : blocked[1].find(d => d.lon == (dir == Direction.west ? this.lon : loc.lon) && d.lat == this.lat)
            )
        );
    return legal ? loc: null;
}

const mapboard = mapdata.map(
    (row, i) => row.map(
        (data, j) => Location(maxlon - j, maxlat - i, data, {unitid: null})
    )
);

cities.forEach((city, i) => {
    city.points ||= 0;
    let loc = Location.of(city);
    console.assert(loc.terrain == Terrain.city, `Expected city terrain for ${city}`);
    loc.cityid = i;
});

function mapForegroundColor(loc) {
    // return the antic fg color for a given location
    let tinfo = terraintypes[loc.terrain],
        alt = (loc.terrain == Terrain.city) ? cities[loc.cityid].owner : loc.alt;
    return alt ? tinfo.altcolor : tinfo.color;
}

function moveIceLine(w) {
    // move ice by freeze/thaw rivers and swamps, where w is Water.freeze or Water.thaw
    // ICELAT -= [7,14] incl]; clamp 1-39 incl
    // small bug in APX code? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
    let state = waterstate[w],
        other = waterstate[1-w],
        oldlat = gameState.icelat,
        dlat = directions[state.dir].dlat,
        change = (rand256() & 0x8) + 7;

    gameState.icelat = Math.min(maxlat, Math.max(1, oldlat + dlat * change));

    let skip = (w == Water.freeze) ? oldlat: gameState.icelat;  // for freeze skip old line, for thaw skip new new
    for (i = oldlat; i != gameState.icelat + dlat; i += dlat) {
        if (i == skip) continue;
        mapboard[maxlat - i].forEach(d => {
            let k = other.terrain.indexOf(d.terrain);
            if (k != -1) d.terrain = state.terrain[k];
        });
    }
}

function moveCosts(armor, weather) {
    // return a table of movement costs based on armor/inf and weather
    return terraintypes.map(t => t.movecost[armor][weather] || 255);
}

function manhattanDistance(p, q) {
    // calculate the taxicab metric between two locations
    return Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon);
}

function _directionsFrom(p, q) {
    // project all directions from p to q and rank them, ensuring tie breaking has no bias
    let dlat = (q.lat - p.lat),
        dlon = (q.lon - p.lon);
    if (!dlat && !dlon) return null;
    return directions
        .map((d, i) => [d.dlon * dlon + d.dlat * dlat, i])
        // in case of tie, which will be neighbors, should the clockwise leader
        .sort(([a, i], [b, j]) => (b - a) || ((i - j + 4)%4) - 2);
}

function directionFrom(p, q) {
    // return the index of the winning direction
    let projections = _directionsFrom(p, q);
    return projections && projections[0][1];
}

function squareSpiral(center, diameter) {
    // return list of the diameter^2 locations spiraling out from loc
    // which form a square of 'radius' (diameter-1)/2, based on a spiralpattern
    // that looks like N, E, S,S, W,W, N,N,N, E,E,E, S,S,S,S, W,W,W,W, ...

    if (diameter % 2 != 1) throw("Diameter should be odd: 1, 3, 5, ...");
    let loc = center,
        locs = [loc],
        dir = 0,
        i = 0,
        side = 1;

    while (++i < diameter) {
        loc = loc.neighbor(dir, true);
        locs.push(loc);
        if (i == side) {
            side += dir % 2;
            dir = (dir + 1) % 4;
            i = 0;
        }
    }
    return locs;
}

function directPath(p, q, costs) {
    /*
    implements a variation of Bresenham's algorith to get direct path from p to q
    returns the list of directions to step from p to q, along with the terrain cost
    similar to the original path algorithm described in the APX notes

    The straight line can be described by the equation A x + B y + C = 0 where
    A = (y1 - y0), B = -(x1 - x0) and C = x1 y0 - x0 y1.  (Here x is lon, y is lat)
    To follow the line most closely using grid point x*, y* we keep the error E = A x* + B y* + C
    as close to zero as possible.
    Taking a step in direction dx, dy will change E by A dx + B dy
    so we just keep choosing the step that moves E back towards zero.
    */

    let loc = Location.of(p),
        goal = Location.of(q);
    if (loc.id == goal.id) return {cost: 0, orders: []};

    const
        A = q.lat - p.lat,
        B = - (q.lon - p.lon),
        C = q.lon * p.lat - q.lat * p.lon,
        projections = _directionsFrom(p, q),
        i = projections[0][1], j = projections[1][1], // best two directinoe
        s = directions[i], t = directions[j],
        ds = A * s.dlon + B * s.dlat,
        dt = A * t.dlon + B * t.dlat;

    let err = 0,
        cost = 0,
        orders = [],
        k;

    while (loc.id != goal.id) {
        [k, de] = Math.abs(err + ds) < Math.abs(err + dt) ? [i, ds]: [j, dt];
        err += de;
        orders.push(k);
        loc = loc.neighbor(k, true);
        cost += costs ? costs[loc.terrain]: 1;
    }

    return {cost, orders}
}

function bestPath(p, q, costs) {
    // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
    // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
    // or null if goal is unreachable
    const minCost = Math.min(...costs);
    let src = Location.of(p),
        goal = Location.of(q),
        frontEst = {_: 0},              // estimated total cost via this square, _ is head
        frontNext = {_: src.id},        // linked list with next best frontier square to check
        dirTo = {[src.id]: null},       // direction index which arrived at keyed square
        costTo = {[src.id]: 0};         // actual cost to get to keyed square

    while (frontNext._) {
        let next = frontNext._;
        src = Location.fromid(next);
        if (src.id == goal.id) break;
        frontNext._ = frontNext[next];
        frontEst._ = frontEst[next];
        delete frontNext[next], frontEst[next]

        directions.forEach((_, i) => {
            let dst = src.neighbor(i);
            if (!dst) return;
            let cost = costTo[src.id] + costs[dst.terrain];
            if (!(dst.id in costTo)) {  // with consistent estimate we always find best first
                costTo[dst.id] = cost;
                dirTo[dst.id] = i;
                let est = cost + minCost * manhattanDistance(src, dst),
                    at = '_';
                while (frontNext[at] && frontEst[at] < est) at = frontNext[at];
                next = frontNext[at];
                frontNext[at] = dst.id;
                frontNext[dst.id] = next;
                frontEst[dst.id] = est;
            }
        });
    }
    if (src.id != goal.id) return null;

    let orders = [];
    while (true) {
        let dir = dirTo[src.id];
        if (dir == null) break;
        orders.unshift(dir);
        src = src.neighbor((dir + 2) % 4);
    }
    return {cost: costTo[goal.id], orders: orders}
}

function reach(src, range, costs) {
    // find all squares accessible to unit within range, ignoring other units, zoc
    let cost = 0,
        start = Location.of(src),
        locs = {[start.id]: 0};

    while (cost < range) {
        Object.entries(locs).filter(([k,v]) => v == cost).forEach(([k,_]) => {
            let src = Location.fromid(k);
            Object.values(Direction).forEach(i => {
                let dst = src.neighbor(i);
                if (!dst) return;
                let curr = dst.id in locs ? locs[dst.id] : 255;
                if (curr <= cost) return;
                let c = cost + costs[dst.terrain];
                if (c <= range && c < curr) locs[dst.id] = c;
            });
        });
        cost++;
    }
    return locs;
}
