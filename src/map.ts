import {
    type Flag, type Point,
    directions, DirectionKey,
    terraintypes, TerrainKey,
    waterstate, WaterStateKey,
    monthdata,
    weatherdata, WeatherKey,
    PlayerKey,
} from './defs';
import {ravel, unravel, zigzag, zagzig} from './codec';
import {mapVariants, blocked} from './map-data';
import {scenarios} from './scenarios';

import type {Game} from './game';

type Path = {cost: number, orders: DirectionKey[]};

// the map is made up of locations, each with a lon and lat
// grid points have integer coordinates and a unique identifier
class GridPoint implements Point {
    lon: number;
    lat: number;
    constructor(lon: number, lat: number) {
        if (!Number.isInteger(lon) || !Number.isInteger(lat))
            throw(`bad Location(lon: int, lat: int, ...data), got lon=${lon}, lat=${lat}`)
        this.lon = lon;
        this.lat = lat;
    }
    get id() {
        return ravel(zigzag([this.lon, this.lat]))
    }
    get point(): Point {
        return {lon: this.lon, lat: this.lat}
    }
    next(dir: DirectionKey): GridPoint {
        const d = directions[dir];
        return new GridPoint(this.lon + d.dlon, this.lat + d.dlat);
    }
    static get(p: Point): GridPoint {
        return new GridPoint(p.lon, p.lat)
    }
    static fromid(v: number): GridPoint {
        const [lon, lat] = zagzig(unravel(v, 2));
        return new GridPoint(lon, lat);
    }
    static manhattanDistance = function(p: Point, q: Point): number {
        // calculate the taxicab metric between two locations
        return Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon);
    }
    static directionFrom = function(p: Point, q: Point): (DirectionKey|null) {
        // return the index of the winning direction
        let projections = GridPoint.directionsFrom(p, q);
        return projections.length ? projections[0][1]: null;
    }
    static directionsFrom(p: Point, q: Point): [number, DirectionKey][] {
        // project all directions from p to q and rank them, ensuring tie breaking has no bias
        let dlat = (q.lat - p.lat),
            dlon = (q.lon - p.lon);
        if (dlat == 0 && dlon == 0) return [];
        return Object.entries(directions)
            .map(([k, d]) => <[number, DirectionKey]>[d.dlon * dlon + d.dlat * dlat, +k])
            // in case tied dirs (which will be neighbors) pick the  the clockwise leader
            .sort(([a, i], [b, j]) => (b - a) || ((j - i + 4 + 2)%4) - 2);
    }
    static squareSpiral(center: Point, diameter: number): GridPoint[] {
        // return list of the diameter^2 locations spiraling out from loc
        // which form a square of 'radius' (diameter-1)/2, based on a spiralpattern
        // that looks like N, E, S,S, W,W, N,N,N, E,E,E, S,S,S,S, W,W,W,W, ...

        if (diameter % 2 != 1) throw(`squareSpiral: diameter should be odd, got ${diameter}`);
        let loc = new GridPoint(center.lon, center.lat),
            locs = [loc],
            dir = 0,
            i = 0,
            side = 1;

        while (++i < diameter) {
            loc = loc.next(dir)!;
            locs.push(loc);
            if (i == side) {
                side += dir % 2;
                dir = (dir + 1) % 4;
                i = 0;
            }
        }
        return locs;
    }

}

class MapPoint extends GridPoint {
    terrain: TerrainKey;
    alt: Flag;
    icon: number;
    cityid?: number;
    unitid?: number;

    constructor(lon: number, lat: number, terrain: TerrainKey, alt: Flag, icon: number) {
        super(lon, lat);
        this.terrain = terrain;
        this.alt = alt;
        this.icon = icon;
    }
    describe() {
        return `[${this.id}] ${terraintypes[this.terrain].label}${this.alt ? "-alt": ""}\n`
            + `lon ${this.lon}, lat ${this.lat}`;
    }
}


// mapboard constructor, used as a container of MapPoints
class Mapboard {
    locations: MapPoint[][];
    cities;
    font;
    #game;      //TODO only wants .month, .emit, .rand
    #maxlon;
    #maxlat;
    #icelat = 39;       // via M.ASM:8600 PSXVAL initial value is 0x27

    constructor(game: Game, memento?: number[]) {
        const variant = mapVariants[scenarios[game.scenario].map],
            mapencoding = variant.encoding.map((enc, i) => {
                // convert the encoding table into a lookup of char => [icon, terraintype, alt-flag]
                type LocT = {icon: number, terrain: TerrainKey, alt: number};
                let lookup: {[key: string]: LocT} = {}, ch=0;
                enc.split('|').forEach((s, t) =>
                    s.split('').forEach(c => {
                        let alt: Flag = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                        if (ch==0x40) ch--;
                        lookup[c] = {
                            icon: i * 0x40 + ch++,
                            terrain: t as TerrainKey,
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
            );

        this.font = variant.font;

        // excluding the impassable border valid is 0..maxlon-1, 0..maxlat-1
        this.#maxlon = mapdata[0].length-2;
        this.#maxlat = mapdata.length-2;

        this.#game = game;
        this.locations = mapdata.map(
            (row, i) => row.map(
                (data, j) => {
                    const lon = this.#maxlon - j,
                        lat = this.#maxlat - i;
                    return new MapPoint(lon, lat, data.terrain, data.alt as Flag, data.icon);
                }
            )
        );

        this.cities = variant.cities.map(c => {return {...c}});
        this.cities.forEach((city, i) => {
            city.points ||= 0;
            let loc = this.locationOf(city);
            if (loc.terrain != TerrainKey.city)
                throw new Error(`Mapboard: city at (${loc.lon}, ${loc.lat}) missing city terrain`);
            loc.cityid = i;
        });
        // verify each city terrain has a cityid
        const missing = this.locations.map(
            row => row.filter(
                loc => loc.terrain == TerrainKey.city && typeof loc.cityid === 'undefined'
            )).flat();
        if (missing.length > 0)
            throw new Error(`Mapboard: city terrain missing city details at ${missing}`);

        if (memento) {
            if (memento.length < this.cities.length + 1)
                throw new Error("Mapboard: malformed save data");
            this.#freezeThaw(WaterStateKey.freeze, memento.shift()!);
            this.cities.forEach(c => c.owner = memento.shift()!)
        }
    }
    newTurn(initialize = false) {
        let mdata = monthdata[this.#game.month],
            earth = weatherdata[mdata.weather].earth;

        // update the tree color in place in the terrain data :grimace:
        terraintypes[TerrainKey.mountain_forest].altcolor = mdata.trees;

        if (!initialize && mdata.water != null) this.#freezeThaw(mdata.water);

        this.#game.emit('map', 'recolor', {
            fgcolorfn: (loc: MapPoint) => this.#fgcolor(loc),
            bgcolor: earth,
            labelcolor: mdata.weather == WeatherKey.snow ? '04': '08'
        });
    }
    get extent() {
        return {width: this.locations[0].length, height: this.locations.length}
    }
    get memento(): number[] {
        let vs = ([] as number[])
            .concat(
                [this.#icelat],
                this.cities.map(c => c.owner)
            );
        return vs;
    }
    valid(pt: Point) {
        return pt.lat >= 0 && pt.lat < this.#maxlat && pt.lon >= 0 && pt.lon < this.#maxlon;
    }
    locationOf(pt: Point): MapPoint {
        if (!this.valid(pt))  // nb this throws for impassable boundary points
            throw new Error(`MapBoard.locationOf: invalid point ${pt.lon}, ${pt.lat}`);
        return this.locations[this.#maxlat - pt.lat][this.#maxlon - pt.lon];
    }
    boundaryDistance(pt: Point, dir: DirectionKey): number {
        switch (dir) {
            case DirectionKey.north: return this.#maxlat - 1 - pt.lat;
            case DirectionKey.south: return pt.lat;
            case DirectionKey.east: return pt.lon;
            case DirectionKey.west: return this.#maxlon - 1 - pt.lon;
        }
    }
    neighborOf(pt: GridPoint, dir: DirectionKey): (MapPoint|null) {
        let q = pt.next(dir);
        if (!this.valid(q)) return null;
        let nbr = this.locationOf(q);

        const legal = (
            nbr.terrain != TerrainKey.impassable
            && !(
                (dir == DirectionKey.north || dir == DirectionKey.south)
                ? blocked[0].find(d => d.lon == pt.lon && d.lat == (dir == DirectionKey.north ? pt.lat : nbr.lat))
                : blocked[1].find(d => d.lon == (dir == DirectionKey.west ? pt.lon : nbr.lon) && d.lat == pt.lat)
            )
        );

        return legal ? nbr: null;
    }
    #fgcolor(loc: MapPoint) {
        // return the antic fg color for a given location
        let tinfo = terraintypes[loc.terrain],
            alt = typeof loc.cityid === 'undefined' ? loc.alt : this.cities[loc.cityid].owner;
        return alt ? tinfo.altcolor : tinfo.color;
    }
    #freezeThaw(w: WaterStateKey, newlat?: number) {
        // move ice by freeze/thaw rivers and swamps, where w is Water.freeze or Water.thaw
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug in APX code? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
        let state = waterstate[w],
            other = waterstate[1-w as WaterStateKey],
            oldlat = this.#icelat,
            dlat = directions[state.dir].dlat;

        if (newlat != null) {
            // initial setup where we freeze to saved value
            this.#icelat = newlat;
        } else {
            let change = this.#game.rand.bits(3) + 7;
            this.#icelat = Math.min(this.#maxlat, Math.max(1, oldlat + dlat * change));
        }

        let skip = (w == WaterStateKey.freeze) ? oldlat: this.#icelat;  // for freeze skip old line, for thaw skip new new
        for (let i = oldlat; i != this.#icelat + dlat; i += dlat) {
            if (i == skip) continue;
            this.locations[this.#maxlat - i].forEach(d => {
                let k = other.terrain.indexOf(d.terrain);
                if (k != -1) d.terrain = state.terrain[k];
            });
        }
    }
    occupy(loc: MapPoint, player: PlayerKey) {
        if (loc.cityid != null) this.cities[loc.cityid].owner = player;
        //TODO repaint this square
    }
    directPath(p: Point, q: Point, costs?: {[key: number]: number}): Path {
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
            projections = GridPoint.directionsFrom(p, q),
            i = projections[0][1], j = projections[1][1], // best two directinoe
            s = directions[i], t = directions[j],
            ds = A * s.dlon + B * s.dlat,
            dt = A * t.dlon + B * t.dlat;

        let err = 0,
            cost = 0,
            orders: number[] = [];

        while (loc.id != goal.id) {
            let [k, de] = Math.abs(err + ds) < Math.abs(err + dt) ? [i, ds]: [j, dt];
            err += de;
            orders.push(k);
            //NB. not validating that we can actually take this path
            loc = this.locationOf(loc.next(k));
            cost += costs ? costs[loc.terrain]: 1;
        }

        return {cost, orders}
    }
    bestPath(p: Point, q: Point, costs: number[]): Path {
        // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
        // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
        // or null if goal is unreachable
        const minCost = Math.min(...costs),
            _head = -1;
        type FrontierPoint = {id: number, est: number};
        type Step = {dir: DirectionKey | null, cost: number};
        let src = this.locationOf(p),
            goal = this.locationOf(q),
            // linked list of points to search next, ordered by estimated total cost via this point
            frontier = new Map<number, FrontierPoint>([[_head, {id: src.id, est: 0}]]),
            // dir arrived from and cost from start to here
            found = new Map<number, Step>([[src.id, {dir: null, cost: 0}]]);

        while (frontier.has(_head)) {
            const {id: next} = frontier.get(_head)!;
            src = this.locationOf(GridPoint.fromid(next));
            if (src.id == goal.id) break;
            if (frontier.has(next)) {
                frontier.set(_head, frontier.get(next)!);
                frontier.delete(next);
            } else {
                frontier.delete(_head);
            }

            Object.keys(directions).forEach(i => {
                const d = +i as DirectionKey,
                    dst = this.neighborOf(src, d);
                if (!dst) return;
                const cost = found.get(src.id)!.cost + costs[dst.terrain];
                if (!found.has(dst.id)) {  // with consistent estimate we always find best first
                    found.set(dst.id, {dir: d, cost});
                    const est = cost + minCost * GridPoint.manhattanDistance(src, dst);
                    let tail = _head;
                    // insert point in linked list before tail to maintain asc sort by est
                    while (frontier.has(tail)) {
                        const {id: _next, est: _est} = frontier.get(tail)!;
                        if (est <= _est) break;
                        tail = _next;
                    }
                    if (frontier.has(tail)) {
                        frontier.set(dst.id, frontier.get(tail)!);
                    }
                    frontier.set(tail, {id: dst.id, est: est})
                }
            });
        }
        if (src.id != goal.id)
            throw new Error(`MapBoard.bestPath: no path from ${p} to ${q}`)

        let orders: number[] = [],
            pt: GridPoint = goal;
        for(;;) {
            const dir = found.get(pt.id)!.dir;
            if (dir == null) break;
            orders.unshift(dir);
            pt = pt.next((dir + 2) % 4);    // walk back in reverse direction
        }
        return {cost: found.get(goal.id)!.cost, orders: orders}
    }
    reach(src: Point, range: number, costs: number[]) {
        // find all squares accessible to unit within range, ignoring other units, zoc
        let cost = 0,
            start = this.locationOf(src),
            locs: {[key: number]: number} = {[start.id]: 0};

        while (cost < range) {
            // eslint-disable-next-line no-unused-vars
            Object.entries(locs).filter(([_,v]) => v == cost).forEach(([k,_]) => {
                let src = GridPoint.fromid(+k);
                Object.keys(directions).forEach(i => {
                    let dst = this.neighborOf(src, +i);
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
}

export {MapPoint, GridPoint, Mapboard, Path};
