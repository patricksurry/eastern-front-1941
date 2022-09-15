function score() {
    // M.asm:4050
    let eastwest = [].concat(
            activeunits[Player.german].map(u => (mapboard.maxlon + 2 - u.lon)*(u.mstrng >> 1)),
            activeunits[Player.russian].map(u => - u.lon*(u.cstrng >> 3))
        ).reduce((s, x) => s + (x >> 8), 0),
        bonus = cities.filter(c => c.owner == Player.german)
            .map(c => c.points || 0)
            .reduce((s, x) => s + x, 0),
        score = Math.max(eastwest, 0) + bonus;

    if (gameState.handicap) score >>= 1;
    return score;
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

function sortSquareFacing(center, diameter, dir, locs) {
    if (diameter % 2 != 1) throw("Diameter should be odd: 1, 3, 5, ...");

    locs ||= squareSpiral(center, diameter);

    if (locs.length != diameter * diameter) throw("Square diameter doesn't match length");

    let r = (diameter - 1)/2,
        minor = directions[(dir+1)%4],
        major = directions[(dir+2)%4],
        out = new Array(locs.length);

    locs.forEach(loc => {
        let dlat = loc.lat - center.lat,
            dlon = loc.lon - center.lon,
            idx = (
                r + dlat * major.dlat + dlon * major.dlon
                + diameter * (r + dlat * minor.dlat + dlon * minor.dlon)
            );
        out[idx] = loc;
    })
    return out;
}

function linePoints(locs, diameter) {
    let r = (diameter-1)/2,
        frontline = Array(diameter).fill(diameter),
        counts = Array(diameter).fill(0),
        row = -1, col = -1,
        score = 0;

    locs.forEach(loc => {
        row = (row + 1) % diameter;
        if (row == 0) col++;
        if (loc.v) {
            counts[col] += 1;
            if (frontline[col] == diameter) frontline[col] = row;
        }
    })
    frontline.forEach((row, col) => {
        if (row < diameter) score += 40;
        if (row < diameter-1 && locs[row + 1 + diameter*col].v) score -= 32;
    })
    if (frontline[r] == r && counts[r] == 1) score += 48;
    for (i=1; i<diameter; i++) for (j=0; j<i; j++) {
        let delta = Math.abs(frontline[i]-frontline[j]);
        if (delta) score -= 1 << delta;
    }
    return score;
}
