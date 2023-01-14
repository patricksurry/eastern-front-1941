import {Point, directions, memoize, DirectionKey} from './defs';
import {ravel2, unravel2, zigzag1, zagzig} from './codec';

// the map is made up of locations, each with a lon and lat
// grid points have integer coordinates and a unique identifier

interface GridPoint extends Point {
    lon: number;
    lat: number;
    gid: number;
}

function toid(lon: number, lat: number): number {
    return ravel2(zigzag1(lon), zigzag1(lat));
}

function byid_(gid: number): GridPoint {
    const [lon, lat] = zagzig(unravel2(gid));
    return {lon, lat, gid};
}
const byid = memoize(byid_);

function nbrsbyid_(gid: number): number[] {
    const {lon, lat} = Grid.byid(gid);
    return Object.values(directions)
        .map(({dlon, dlat}) => Grid.lonlat(lon + dlon, lat + dlat).gid);
}
const nbrsbyid = memoize(nbrsbyid_);

function directionsFrom(p: Point, q: Point): [number, DirectionKey][] {
    // project all directions from p to q and rank them, ensuring tie breaking has no bias
    // returned pairs are like [ (q - p) . dir, key ], ordered by projection magnitude
    // if p == q an empty list is returned
    const dlat = (q.lat - p.lat),
        dlon = (q.lon - p.lon);
    if (dlat == 0 && dlon == 0) return [];
    return Object.entries(directions)
        .map(([k, d]) => <[number, DirectionKey]>[d.dlon * dlon + d.dlat * dlat, +k])
        // in case of tied dirs (which will be neighbors) pick the clockwise leader
        .sort(([a, i], [b, j]) => (b - a) || ((j - i + 4 + 2)%4) - 2);
}

function directionFrom(p: Point, q: Point): (DirectionKey|null) {
    // return the index of the closest cardinal direction from p to q, null if p == q
    const projections = directionsFrom(p, q);
    return projections.length ? projections[0][1]: null;
}

function squareSpiral(center: GridPoint, radius: number): GridPoint[] {
    // return list of the (2*radius+1)^2 locations spiraling out from loc
    // which form a square of given radius, based on a spiralpattern
    // that looks like N, E, S,S, W,W, N,N,N, E,E,E, S,S,S,S, W,W,W,W, ...

    let loc = center,
        dir = 0,
        i = 0,
        side = 1;
    const locs = [loc];

    while (++i < 2*radius+1) {
        loc = Grid.adjacent(loc, dir);
        locs.push(loc);
        if (i == side) {
            side += dir % 2;
            dir = (dir + 1) % 4;
            i = 0;
        }
    }
    return locs;
}

// hack to memoize squarespiral of radius 1 which get used a lot
function squareSpira11_(gid: number): number[] {
    return squareSpiral(Grid.byid(gid), 1).map(({gid}) => gid);
}
const squareSpira11 = memoize(squareSpira11_);


function diamondSpiral(center: Point, radius: number, facing = DirectionKey.north): GridPoint[] {
    // return list of GridPoints within radius manhattan distance of center,
    // spiraling out from the origin starting in direction facting
    // the 0th shell has a single point, with the i-th shell having 4*i points for i>1
    // so the result has 2*r*(r+1) + 1 points
    let loc = Grid.lonlat(center.lon, center.lat);
    // the zeroth shell
    const locs = [loc];
    for (let r=1; r<=radius; r++) {
        // bump out one shell in the required direction
        loc = Grid.adjacent(loc, facing);
        // loop over the four sides of the shell
        for (let d=0; d<4; d++) {
            const d1 = (facing+d+1) % 4,
                d2 = (facing+d+2) % 4;
            for (let i=0; i<r; i++) {
                // push the point and make a diagonal step
                locs.push(loc)
                loc = Grid.adjacent(Grid.adjacent(loc, d1), d2)
            }
        }
    }
    return locs;
}

const Grid = {
    byid: byid,
    lonlat: (lon: number, lat: number): GridPoint => byid(toid(lon, lat)),
    point: ({lon, lat}: Point): GridPoint => byid(toid(lon, lat)),

    neighbors: ({gid}: GridPoint): GridPoint[] => nbrsbyid(gid).map(Grid.byid),
    adjacent: ({gid}: GridPoint, d: DirectionKey): GridPoint => Grid.byid(nbrsbyid(gid)[d]),

    // calculate the taxicab metric between two locations
    manhattanDistance: (p: Point, q: Point): number => Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon),
    directionsFrom: directionsFrom,
    directionFrom: directionFrom,
    squareSpiral: (center: GridPoint, radius: number): GridPoint[] => {
        return (radius == 1) ? squareSpira11(center.gid).map(Grid.byid): squareSpiral(center, radius);
    },
    diamondSpiral: diamondSpiral,
};

export {GridPoint, Grid};