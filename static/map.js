// the map is made up of locations, each with a lon and lat
function Location(lon, lat, ...data) {
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

cities.forEach(city => {
    let loc = Location.of(city);
    console.assert(loc.terrain == Terrain.city, `Expected city terrain for ${city}`);
    loc.alt = city.owner;
});

function manhattanDistance(p, q) {
    // calculate the taxicab metric between two locations
    return Math.abs(p.lat - q.lat) + Math.abs(p.lon - q.lon);
}

function directionFrom(p, q) {
    // calculate the major direction from p to q, with tie breaking so no direction is preferred
    let dlat = (q.lat - p.lat),
        dlon = (q.lon - p.lon);
    if (!dlat && !dlon) return null;
    let projections = directions
        .map((d, i) => [d.dlon * dlon + d.dlat * dlat, i])
        .sort(([a, i], [b, j]) => (b - a) || ((i - j + 4)%4) - 2);
    return projections[0][1];
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
