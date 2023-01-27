/* eslint-disable  @typescript-eslint/no-non-null-assertion */
import {
    type Flag, type Point,
    directions, DirectionKey,
    terraintypes, TerrainKey,
    waterstate, WaterStateKey,
    monthdata,
    PlayerKey,
    clamp,
    memoize,
} from './defs';
import {Grid, type GridPoint} from './grid';
import {mapVariants, blocked} from './map-data';
import {scenarios} from './scenarios';

import type {Game} from './game';
import {options} from '../config';

type Path = {cost: number, orders: DirectionKey[]};

type MapEvent = 'citycontrol';

interface LocationData {
    icon: number,
    terrain: TerrainKey,
    alt: Flag
}

interface MapPoint extends GridPoint, LocationData {
    cityid?: number;
    unitid?: number;
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
    #validlocs: Map<number, MapPoint> = new Map();

    constructor(game: Game, memento?: number[]) {
        const
            scenario = scenarios[game.scenario],
            variant = mapVariants[scenario.map],
            ncity = scenario.ncity,
            mapencoding = variant.encoding.map((enc, i) => {
                // convert the encoding table into a lookup of char => [icon, terraintype, alt-flag]
                const lookup: {[key: string]: LocationData} = {};
                let ch = 0;
                enc.split('|').forEach((s, t) =>
                    s.split('').forEach(c => {
                        const alt: Flag = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                        if (ch==0x40) ch--;
                        lookup[c] = {
                            icon: i * 0x40 + ch++,
                            terrain: t as TerrainKey,
                            alt: alt
                        };
                    })
                );
                return lookup;
            });

        let raw = variant.ascii;
        if (options.mapIncludesSevastopol) raw = raw.slice().replace('~~FJ~~', '~~$J~~');

        // decode the map into a 2-d array of rows x cols of  {lon: , lat:, icon:, terrain:, alt:}
        const mapdata = raw.split(/\n/).slice(1,-1).map(
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
                    const lon: number = this.#maxlon - j,
                        lat = this.#maxlat - i,
                        pt = Grid.lonlat(lon, lat),
                        loc = {...pt, ...data};
                    if (pt.lat >= 0 && pt.lat < this.#maxlat && pt.lon >= 0 && pt.lon < this.#maxlon) {
                        this.#validlocs.set(pt.gid, loc);
                    }
                    return loc
                }
            )
        );

        this.cities = variant.cities
            .filter(c => options.mapIncludesSevastopol || c.label != 'Sevastopol')
            .map(c => ({...c}));
        this.cities.forEach((city, i) => {
            city.points = i < ncity ? (city.points ?? 0): 0;
            const loc = this.locationOf(Grid.point(city));
            if (loc.terrain != TerrainKey.city)
                throw new Error(`Mapboard: city at (${loc.lon}, ${loc.lat}) missing city terrain`);
            loc.cityid = i;
            if (scenario.control && scenario.control.includes(city.label)) {
                city.owner = 1 - city.owner;
            }
        });

        // verify each city terrain has a cityid
        const missing = this.locations.map(
            row => row.filter(
                loc => loc.terrain == TerrainKey.city && typeof loc.cityid === 'undefined'
            )).flat();
        if (missing.length > 0)
            throw new Error(`Mapboard: city terrain missing city details, e.g. ${this.describe(missing[0])}`);
        // verify that any control cities exist
        if (scenario.control) {
            const labels = this.cities.map(c => c.label),
                diff = scenario.control.filter(label => !labels.includes(label));
            if (diff.length > 0)
                throw new Error(`Mapboard: scenario.control has unknown cities ${diff}`);
        }
        if (memento) {
            if (memento.length < variant.cities.length + 1)
                throw new Error("Mapboard: malformed save data");
            this.#freezeThaw(WaterStateKey.freeze, memento.shift()!);
            this.cities.forEach((c, i) => {
                // skip the control flag for Sevastopol if we're not using it
                if (!options.mapIncludesSevastopol && variant.cities[i].label == 'Sevastopol') {
                    memento.shift()!;
                }
                c.owner = memento.shift()!;
            });
        }
    }
    get memento(): number[] {
        const
            scenario = scenarios[this.#game.scenario],
            variant = mapVariants[scenario.map],
            control = this.cities.map(c => c.owner);
        if (!options.mapIncludesSevastopol) {
            // always include a control flag for Sevastopol so config doesn't change save format
            const i = variant.cities.findIndex(c => c.label == 'Sevastopol');
            control.splice(i, 0, variant.cities[i].owner);
        }
        return ([] as number[]).concat([this.#icelat],control);
    }
    nextTurn(startOrResume = false) {
        const mdata = monthdata[this.#game.month];

        //TODO :grimace: update the tree color in place in the terrain data
        terraintypes[TerrainKey.mountain_forest].altcolor = mdata.trees;

        if (!startOrResume && mdata.water != null) this.#freezeThaw(mdata.water);
    }
    get extent() {
        // map dimension including impassable boundary
        return {width: this.locations[0].length, height: this.locations.length}
    }
    get bbox() {
        // bounding box for valid map area
        return {
            [DirectionKey.north]: this.#maxlat-1,
            [DirectionKey.south]: 0,
            [DirectionKey.west]: this.#maxlon-1,
            [DirectionKey.east]: 0,
        }
    }
    xy({lon, lat}: Point) {
        // return an x, y indexed from top, left rather than lon, lat indexed from bottom, right
        return {x: this.#maxlon - lon, y: this.#maxlat - lat}
    }
    describe(loc: MapPoint, debug = false) {
        const city = loc.cityid != null ? this.cities[loc.cityid] : undefined,
            label = city
                ? ` ${city.label} (${city.points ?? 0})`
                : (terraintypes[loc.terrain].label + (loc.alt ? "-alt": "")),
            unit = loc.unitid != null ? this.#game.oob.at(loc.unitid).describe(debug): "";
        return `[${loc.gid}] ${label}\nlon ${loc.lon}, lat ${loc.lat}\n\n${unit}`.trim()
    }
    valid(pt: GridPoint) {
        return this.#validlocs.has(pt.gid);
    }
    locationOf(pt: GridPoint): MapPoint {
        // nb throws for impassable boundary points
        const loc = this.#validlocs.get(pt.gid);
        if (loc == null)
            throw new Error(`MapBoard.locationOf: invalid point ${pt.lon}, ${pt.lat}`);
        return loc;
    }
    boundaryDistance(pt: Point, dir: DirectionKey): number {
        switch (dir) {
            case DirectionKey.north: return this.#maxlat - 1 - pt.lat;
            case DirectionKey.south: return pt.lat;
            case DirectionKey.east: return pt.lon;
            case DirectionKey.west: return this.#maxlon - 1 - pt.lon;
        }
    }
    #neighborids_(gid: number): [number?, number?, number?, number?] {
        const pt = this.#validlocs.get(gid);
        if (pt == null) return [undefined, undefined, undefined, undefined];

        return Grid.adjacencies(pt).map((q, i) => {
            const nbr = this.#validlocs.get(q.gid),
                dir = +i as DirectionKey;
            if (nbr == null) return undefined;
            const legal = (
                nbr.terrain != TerrainKey.impassable
                && !(
                    (dir == DirectionKey.north || dir == DirectionKey.south)
                    ? blocked[0].find(d => d.lon == pt.lon && d.lat == (dir == DirectionKey.north ? pt.lat : nbr.lat))
                    : blocked[1].find(d => d.lon == (dir == DirectionKey.west ? pt.lon : nbr.lon) && d.lat == pt.lat)
                )
            );
            return legal ? nbr.gid: null;
        }) as [number?, number?, number?, number?];
    }
    // hack to memoize class method.  probably a better way to do it?
    #neighborids = memoize(
        (gid: number): [number?, number?, number?, number?] => this.#neighborids_(gid)
    )
    neighborsOf({gid}: GridPoint): [MapPoint?, MapPoint?, MapPoint?, MapPoint?] {
        return this.#neighborids(gid)
            .map(v => v == null ? v : this.#validlocs.get(v)) as
            [MapPoint?, MapPoint?, MapPoint?, MapPoint?];
    }
    neighborOf({gid}: GridPoint, dir: DirectionKey): MapPoint | undefined {
        const nbrid = this.#neighborids(gid)[dir];
        return nbrid == null ? undefined : this.#validlocs.get(nbrid);
    }
    #freezeThaw(w: WaterStateKey, newlat?: number) {
        // move ice by freeze/thaw rivers and swamps, where w is Water.freeze or Water.thaw
        // ICELAT -= [7,14] incl]; clamp 1-39 incl
        // small bug in APX code? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
        const state = waterstate[w],
            other = waterstate[1-w as WaterStateKey],
            oldlat = this.#icelat,
            dlat = directions[state.dir].dlat;

        if (newlat != null) {
            // initial setup where we freeze to saved value
            this.#icelat = newlat;
        } else {
            const change = this.#game.rand.bits(3) + 7;
            this.#icelat = clamp(oldlat + dlat * change, 1, this.#maxlat);
        }

        const skip = (w == WaterStateKey.freeze) ? oldlat: this.#icelat;  // for freeze skip old line, for thaw skip new new
        for (let i = oldlat; i != this.#icelat + dlat; i += dlat) {
            if (i == skip) continue;
            this.locations[this.#maxlat - i].forEach(d => {
                const k = other.terrain.indexOf(d.terrain);
                if (k != -1) d.terrain = state.terrain[k];
            });
        }
    }
    occupy(loc: MapPoint, player: PlayerKey) {
        if (loc.cityid != null) {
            const c = this.cities[loc.cityid];
            if (c.owner != player) {
                c.owner = player;
                this.#game.emit('map', 'citycontrol', loc);
            }
        }
    }
    directPath(p: GridPoint, q: GridPoint, costs?: number[]): Path {
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

        let loc = this.locationOf(p);
        const goal = this.locationOf(q);
        if (loc.gid == goal.gid) return {cost: 0, orders: []};

        const
            A = q.lat - p.lat,
            B = - (q.lon - p.lon),
            // C = q.lon * p.lat - q.lat * p.lon,
            projections = Grid.directionsFrom(p, q),
            i = projections[0][1], j = projections[1][1], // best two directinoe
            s = directions[i], t = directions[j],
            ds = A * s.dlon + B * s.dlat,
            dt = A * t.dlon + B * t.dlat;

        let err = 0,
            cost = 0;
        const orders: number[] = [];

        while (loc.gid != goal.gid) {
            const [k, de] = Math.abs(err + ds) < Math.abs(err + dt) ? [i, ds]: [j, dt];
            err += de;
            orders.push(k);
            //NB. not validating that we can actually take this path
            loc = this.locationOf(Grid.adjacent(loc, k));
            cost += costs ? costs[loc.terrain]: 1;
        }

        return {cost, orders}
    }
    bestPath(p: GridPoint, q: GridPoint, costs: number[]): Path {
        // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
        // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
        // or null if goal is unreachable
        const minCost = Math.min(...costs),
            _head = -1;
        type FrontierPoint = {id: number, est: number};
        type Step = {dir: DirectionKey | null, cost: number};
        let src = this.locationOf(p);
        const goal = this.locationOf(q),
            // linked list of points to search next, ordered by estimated total cost via this point
            frontier = new Map<number, FrontierPoint>([[_head, {id: src.gid, est: 0}]]),
            // dir arrived from and cost from start to here
            found = new Map<number, Step>([[src.gid, {dir: null, cost: 0}]]);

        while (frontier.has(_head)) {
            const {id: next} = frontier.get(_head)!;
            src = this.locationOf(Grid.byid(next));
            if (src.gid == goal.gid) break;
            if (frontier.has(next)) {
                frontier.set(_head, frontier.get(next)!);
                frontier.delete(next);
            } else {
                frontier.delete(_head);
            }

            this.neighborsOf(src).forEach((dst, i) => {
                if (!dst) return;
                const d = +i as DirectionKey,
                    cost = found.get(src.gid)!.cost + costs[dst.terrain];
                if (!found.has(dst.gid)) {  // with consistent estimate we always find best first
                    found.set(dst.gid, {dir: d, cost});
                    const est = cost + minCost * Grid.manhattanDistance(src, dst);
                    let tail = _head;
                    // insert point in linked list before tail to maintain asc sort by est
                    while (frontier.has(tail)) {
                        const {id: _next, est: _est} = frontier.get(tail)!;
                        if (est <= _est) break;
                        tail = _next;
                    }
                    if (frontier.has(tail)) {
                        frontier.set(dst.gid, frontier.get(tail)!);
                    }
                    frontier.set(tail, {id: dst.gid, est: est})
                }
            });
        }
        if (src.gid != goal.gid)
            throw new Error(`MapBoard.bestPath: no path from ${p} to ${q}`)

        const orders: number[] = [];
        let pt: GridPoint = goal;
        for(;;) {
            const dir = found.get(pt.gid)!.dir;
            if (dir == null) break;
            orders.unshift(dir);
            pt = Grid.adjacent(pt, (dir + 2) % 4);    // walk back in reverse direction
        }
        return {cost: found.get(goal.gid)!.cost, orders: orders}
    }
    reach(src: GridPoint, range: number, costs: number[]) {
        // find all squares accessible to unit within range, ignoring other units, zoc
        // returns a map of point ids => range
        let cost = 0;
        const start = this.locationOf(src),
            locs: {[key: number]: number} = {[start.gid]: 0};

        while (cost < range) {
            Object.entries(locs).filter(([ ,v]) => v == cost).forEach(([k, ]) => {
                const src = Grid.byid(+k);
                this.neighborsOf(src).forEach(dst => {
                    if (!dst) return;
                    const curr = dst.gid in locs ? locs[dst.gid] : 255;
                    if (curr <= cost) return;
                    const c = cost + costs[dst.terrain];
                    if (c <= range && c < curr) locs[dst.gid] = c;
                });
            });
            cost++;
        }
        return locs;
    }
}

export {MapPoint, Mapboard, Path, type MapEvent};
