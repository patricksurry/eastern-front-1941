function sum(xs) {
    return xs.reduce((s, x) => s + x, 0);
}

function score() {
    // M.asm:4050
    let eastwest = sum(
            oob.filter(u => u.isActive())
            .map(u => u.player == Player.german
                    ? (mapboard.maxlon + 2 - u.lon)*(u.mstrng >> 1)
                    : - u.lon*(u.cstrng >> 3)
            )
        ),
        bonus = sum(
            cities.filter(c => c.owner == Player.german)
            .map(c => c.points || 0)
        ),
        score = (Math.max(eastwest, 0) >> 8) + bonus;

    if (gameState.handicap) score >>= 1;
    return score;
}

function think(train) {
    if (train == null) {
        think.delay = 250;
        think.depth = 0;
        think.concluded = false;
    } else if (train != think.trainOfThought) {
        // skip pre-scheduled old train of thought
        console.log(`Skipped passing thought, train ${train}`);
        return;
    }
    think.depth++;

    console.log(`Connsidering the merits... train ${train}, depth ${think.depth}, delay ${think.delay}ms`);

    //TODO start thinking
    const t0 = performance.now();
    calcForceRatios(Player.russian);
    const dt = performance.now() - t0;
    console.log(`califr took ${dt}ms`);

    think.delay *= 1.25;

    //TODO backoff, perhaps based on change since last time?
    setTimeout(think, think.delay, think.trainOfThought);
}
think.trainOfThought = 0;


function conclude() {
    console.log("Concluding...")
    think.trainOfThought++;
    think.concluded = true;
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
    // curious that this doesn't consider terrain, e.g. a line ending at the coast will get penalized heavily?
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

function calcForceRatios(player) {
    // TODO create a ghostoob where we can modify position, flag as reinf

    let active = oob.filter(u => u.isActive()),
        ofr = Math.floor(
            ( sum(active.filter(u => u.player != player).map(u => u.cstrng)) << 4)
            / sum(active.filter(u => u.player == player).map(u => u.cstrng))
        );
    console.log('ofr:', ofr);
    active.forEach(u => {
        let nearby = active.filter(v => manhattanDistance(u, v) <= 8)
            friendly = 0,
            loc = Location.of(u);
        u.ifrdir = [0, 0, 0, 0];
        nearby.forEach(v => {
            let inc = v.cstrng >> 4;
            if (v.player == player) friendly += inc;
            else u.ifrdir[directionFrom(loc, Location.of(v))] += inc;
        })
        u.ifr = Math.floor((sum(u.ifrdir) << 4) / friendly);
    })
}
