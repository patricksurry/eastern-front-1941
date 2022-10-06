import {
    directions, Direction,
    terraintypes, Terrain,
    waterstate, Water,
    randbyte,
} from './defs.js';
import {mapVariants, blocked} from './map-data.js';


// the map is made up of locations, each with a lon and lat
function Location(lon, lat, ...data) {
    if (!Number.isInteger(lon) || !Number.isInteger(lat))
        throw(`bad Location(lon: int, lat: int, ...data), got lon=${lon}, lat=${lat}`)
    return Object.assign({
            lon,
            lat,
            put: Location.put,
        }, ...data);
}
Location.put = function(d) {
    d.lon = this.lon;
    d.lat = this.lat;
    return d;
}


// mapboard constructor, used as a container of Locations
function Mapboard(options, memento) {
    const variant = mapVariants[options && options.variant || 'apx'],
        mapencoding = variant.encoding.map((enc, i) => {
            // convert the encoding table into a lookup of char => [icon, terraintype, alt-flag]
            let lookup = {}, ch=0;
            enc.split('|').forEach((s, t) =>
                s.split('').forEach(c => {
                    let alt = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                    if (ch==0x40) ch--;
                    lookup[c] = {
                        icon: 0x80 + i * 0x40 + ch++,
                        terrain: t,
                        alt: alt
                    };
                })
            );
            return lookup;
        }),
        // decode the map into a 2-d array of rows x cols of  {lon: , lat:, icon:, terrain:, alt:}
        mapdata = variant.ascii.split(/\n/).slice(1,-1).map(
                (row, i) =>
                row.split('').map(
                    c => Object.assign({}, mapencoding[i <= 25 ? 0: 1][c])
                )
            ),
        maxlon = mapdata[0].length-2,       // excluding the impassable border valid is 0..maxlon-1, 0..maxlat-1
        maxlat = mapdata.length-2,
        mapboard = {
            locations: mapdata.map(
                (row, i) => row.map(
                    (data, j) => {
                        let lon = maxlon - j,
                            lat = maxlat - i,
                            id = (lat << 8) + lon;
                        return Location(lon, lat, data, {id, row: i, col: j})
                    }
                )
            ),
            maxlon,
            maxlat,
            icelat: 39,     // via M.ASM:8600 PSXVAL initial value is 0x27
            cities: variant.cities.map(c => {return {...c}}),

            memento: Mapboard.memento,
            locationOf: Mapboard.locationOf,
            fromid: Mapboard.fromid,
            valid: Mapboard.valid,
            neighbor: Mapboard.neighbor,
            fgcolor: Mapboard.fgcolor,
            moveIceLine: Mapboard.freezeThaw,
            occupy: Mapboard.occupy,
            manhattanDistance: Mapboard.manhattanDistance,
            boundaryDistance: Mapboard.boundaryDistance,
            directionFrom: Mapboard.directionFrom,
            squareSpiral: Mapboard.squareSpiral,
            directPath: Mapboard.directPath,
            bestPath: Mapboard.bestPath,
            reach: Mapboard.reach,
        };

    mapboard.cities.forEach((city, i) => {
        city.points ||= 0;
        let loc = mapboard.locationOf(city);
        loc.cityid = i;
    });
    if (memento) {
        mapboard.icelat = memento.shift();
        //TODO freezethaw between old icelat and this
        mapboard.cities.forEach(c => c.owner = memento.shift())
    }
    return mapboard;
}
Mapboard.memento = function() {
    return [].concat(
        [this.icelat],
        this.cities.map(c => c.owner)
    )
}
Mapboard.valid = function(loc) {
    return loc.lat >= 0 && loc.lat < this.maxlat && loc.lon >= 0 && loc.lon < this.maxlon;
}
Mapboard.locationOf = function(d) {
    let loc = Location(d.lon, d.lat);
    return this.valid(loc) ? this.locations[this.maxlat - loc.lat][this.maxlon - loc.lon]: loc;
}
Mapboard.fromid = function(x) {
    return this.locationOf({lon: x & 0xff, lat: x >> 8});
}
Mapboard.boundaryDistance = function(loc, dir) {
    switch (dir) {
        case Direction.north: return this.maxlat - 1 - loc.lat;
        case Direction.south: return loc.lat;
        case Direction.east: return loc.lon;
        case Direction.west: return this.maxlon - 1 - loc.lon;
    }
}
Mapboard.neighbor = function(loc, dir, skipcheck) {
    let d = directions[dir],
        lon = loc.lon + d.dlon,
        lat = loc.lat + d.dlat,
        nbr = this.locationOf({lon, lat});

    if (skipcheck) return nbr;
    if (!this.valid(nbr)) return null;

    let legal = (
            nbr.terrain != Terrain.impassable
            && !(
                (dir == Direction.north || dir == Direction.south)
                ? blocked[0].find(d => d.lon == loc.lon && d.lat == (dir == Direction.north ? loc.lat : nbr.lat))
                : blocked[1].find(d => d.lon == (dir == Direction.west ? loc.lon : nbr.lon) && d.lat == loc.lat)
            )
        );
    return legal ? nbr: null;
}
Mapboard.fgcolor = function(loc) {
    // return the antic fg color for a given location
    let tinfo = terraintypes[loc.terrain],
        alt = (loc.terrain == Terrain.city) ? this.cities[loc.cityid].owner : loc.alt;
    return alt ? tinfo.altcolor : tinfo.color;
}
Mapboard.freezeThaw = function(w) {
    // move ice by freeze/thaw rivers and swamps, where w is Water.freeze or Water.thaw
    // ICELAT -= [7,14] incl]; clamp 1-39 incl
    // small bug in APX code? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
    let state = waterstate[w],
        other = waterstate[1-w],
        oldlat = this.icelat,
        dlat = directions[state.dir].dlat,
        change = (randbyte() & 0x8) + 7;

    this.icelat = Math.min(this.maxlat, Math.max(1, oldlat + dlat * change));

    let skip = (w == Water.freeze) ? oldlat: this.icelat;  // for freeze skip old line, for thaw skip new new
    for (let i = oldlat; i != this.icelat + dlat; i += dlat) {
        if (i == skip) continue;
        this.locations[this.maxlat - i].forEach(d => {
            let k = other.terrain.indexOf(d.terrain);
            if (k != -1) d.terrain = state.terrain[k];
        });
    }
}
Mapboard.occupy = function(loc, player) {
    if (loc.cityid != null) this.cities[loc.cityid].owner = player;
    //TODO repaint this square
}
Mapboard.manhattanDistance = function(p, q) {
    // calculate the taxicab metric between two locations
    return Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon);
}
Mapboard.directionFrom = function(p, q) {
    // return the index of the winning direction
    let projections = _directionsFrom(p, q);
    return projections && projections[0][1];
}
Mapboard.squareSpiral = function(center, diameter) {
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
        loc = this.neighbor(loc, dir, true);
        locs.push(loc);
        if (i == side) {
            side += dir % 2;
            dir = (dir + 1) % 4;
            i = 0;
        }
    }
    return locs;
}
Mapboard.directPath = function(p, q, costs) {
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

    let loc = this.locationOf(p),
        goal = this.locationOf(q);
    if (loc.id == goal.id) return {cost: 0, orders: []};

    const
        A = q.lat - p.lat,
        B = - (q.lon - p.lon),
        // C = q.lon * p.lat - q.lat * p.lon,
        projections = _directionsFrom(p, q),
        i = projections[0][1], j = projections[1][1], // best two directinoe
        s = directions[i], t = directions[j],
        ds = A * s.dlon + B * s.dlat,
        dt = A * t.dlon + B * t.dlat;

    let err = 0,
        cost = 0,
        orders = [];

    while (loc.id != goal.id) {
        let [k, de] = Math.abs(err + ds) < Math.abs(err + dt) ? [i, ds]: [j, dt];
        err += de;
        orders.push(k);
        loc = this.neighbor(loc, k, true);
        cost += costs ? costs[loc.terrain]: 1;
    }

    return {cost, orders}
}
Mapboard.bestPath = function (p, q, costs) {
    // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
    // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
    // or null if goal is unreachable
    const minCost = Math.min(...costs);
    let src = this.locationOf(p),
        goal = this.locationOf(q),
        frontEst = {_: 0},              // estimated total cost via this square, _ is head
        frontNext = {_: src.id},        // linked list with next best frontier square to check
        dirTo = {[src.id]: null},       // direction index which arrived at keyed square
        costTo = {[src.id]: 0};         // actual cost to get to keyed square

    while (frontNext._) {
        let next = frontNext._;
        src = this.fromid(next);
        if (src.id == goal.id) break;
        frontNext._ = frontNext[next];
        frontEst._ = frontEst[next];
        delete frontNext[next], frontEst[next]

        directions.forEach((_, i) => {
            let dst = this.neighbor(src, i);
            if (!dst) return;
            let cost = costTo[src.id] + costs[dst.terrain];
            if (!(dst.id in costTo)) {  // with consistent estimate we always find best first
                costTo[dst.id] = cost;
                dirTo[dst.id] = i;
                let est = cost + minCost * this.manhattanDistance(src, dst),
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
    for(;;) {
        let dir = dirTo[src.id];
        if (dir == null) break;
        orders.unshift(dir);
        src = this.neighbor(src, (dir + 2) % 4);    // walk back in reverse direction
    }
    return {cost: costTo[goal.id], orders: orders}
}
Mapboard.reach = function(src, range, costs) {
    // find all squares accessible to unit within range, ignoring other units, zoc
    let cost = 0,
        start = this.locationOf(src),
        locs = {[start.id]: 0};

    while (cost < range) {
        // eslint-disable-next-line no-unused-vars
        Object.entries(locs).filter(([_,v]) => v == cost).forEach(([k,_]) => {
            let src = this.fromid(k);
            Object.values(Direction).forEach(i => {
                let dst = this.neighbor(src, i);
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

function _directionsFrom(p, q) {
    // project all directions from p to q and rank them, ensuring tie breaking has no bias
    let dlat = (q.lat - p.lat),
        dlon = (q.lon - p.lon);
    if (!dlat && !dlon) return null;
    return directions
        .map((d, i) => [d.dlon * dlon + d.dlat * dlat, i])
        // in case tied dirs (which will be neighbors) pick the  the clockwise leader
        .sort(([a, i], [b, j]) => (b - a) || ((j - i + 4 + 2)%4) - 2);
}

export {Location, Mapboard};
