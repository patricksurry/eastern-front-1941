import {players, Player, directions, terraintypes, sum} from './game.js';
import {Location, manhattanDistance, directionFrom, squareSpiral} from './map.js';
import {oob} from './unit.js';

function think(player, train) {
    if (train == null) {
        think.delay = 250;
        think.depth = 0;
        think.concluded = false;
    } else if (train != think.trainOfThought[player]) {
        // skip pre-scheduled old train of thought
        console.debug(`Skipped passing thought, train ${train}`);
        return;
    }
    think.depth++;

    const t0 = performance.now(),
        pinfo = players[player],
        firstpass = think.depth == 1,
        units = oob.filter(u => u.player == player && u.isActive());

    // set up the ghost army
    var ofr = 0;  // only used in first pass
    if (firstpass) {
        ofr = calcForceRatios(player);
        console.log('Overall force ratio (OFR) is', ofr);
        units.forEach(u => u.objective = Location.of(u));
    }

    units.filter(u => u.canMove).forEach(u => {
        //TODO these first two checks don't seem to depend on ghost army so are fixed on first pass?
        if (firstpass && u.ifr == ofr >> 1) {
            // head to reinforce if no local threat since (Local + OFR) / 2 = OFR / 2
            //TODO this tends to send most units to same beleagured square
            u.objective = Location.of(findBeleaguered(u));
        } else if (firstpass && (u.cstrng <= (u.mstrng >> 1) || u.ifrdir[pinfo.homedir] >= 16)) {
            // run home if hurting or blocked towards home
            //TODO could look for farthest legal square (valid & not impassable) 5, 4, ...
            u.objective = Location(u.lon + 5 * directions[pinfo.homedir].dlon, u.lat);
        } else {
            // find nearest best square
            let start = Location.of(u.objective),
                bestval = evalLocation(u, start);
            directions.forEach((_, i) => {
                let loc = start.neighbor(i);
                if (!loc) return;
                let sqval = evalLocation(u, loc);
                if (sqval > bestval) {
                    bestval = sqval;
                    u.objective = loc;
                }
            });
        }
        if (!u.objective) return;
        let result = u.bestPath(u.objective);
        if (!result) return;
        u.orders = result.orders;  // We'll prune to 8 later
        u.show();
    });
    const dt = performance.now() - t0;

    think.delay *= 1.1;  // gradually back off thinking rate

    console.debug(`thought ${think.trainOfThought[player]}-${think.depth} took ${Math.round(dt)}ms; waiting ${Math.round(think.delay)}ms`);

    setTimeout(think, think.delay, player, think.trainOfThought[player]);
}
think.trainOfThought = {[Player.german]: 0, [Player.russian]: 0};


function conclude(player) {
    console.debug("Concluding...")
    think.trainOfThought[player]++;
    think.concluded = true;

    oob.filter(u => u.player == player).forEach(u => {u.orders = u.orders.slice(0, 8)});
}

function calcForceRatios(player) {
    let active = oob.filter(u => u.isActive()),
        friend = sum(active.filter(u => u.player == player).map(u => u.cstrng)),
        foe = sum(active.filter(u => u.player != player).map(u => u.cstrng)),
        ofr = Math.floor((foe << 4) / friend),
        ofropp = Math.floor((friend << 4) / foe);

    active.forEach(u => {
        let nearby = active.filter(v => manhattanDistance(u, v) <= 8),
            friend = 0,
            loc = Location.of(u);
        u.ifrdir = [0, 0, 0, 0];
        nearby.forEach(v => {
            let inc = v.cstrng >> 4;
            if (v.player == u.player) friend += inc;
            else u.ifrdir[directionFrom(loc, Location.of(v))] += inc;
        })
        // individual and overall ifr max 255
        let ifr = Math.floor((sum(u.ifrdir) << 4) / friend);
        // we actually work with average of IFR + OFR
        u.ifr = (ifr + (u.player == player ? ofr: ofropp)) >> 1;
    });
    return ofr;
}

function findBeleaguered(u) {
    let best = null, score = u.ifr;
    oob.filter(v => v.isActive() && v.player == u.player)
        .forEach(v => {
            let d = manhattanDistance(u, v);
            if (d <= 8) return;  // APX code does weird bit 3 check
            let s = v.ifr - (d >> 3);
            if (s > score) {
                score = s;
                best = v;
            }
        });
    return best;
}

function evalLocation(u, loc) {
    let ghosts = {},
        range = manhattanDistance(u, loc);

    if (range >= 8) return 0;

    oob.filter(v => v.player == u.player && v.isActive() && v.id != u.id)
        .forEach(v => { ghosts[v.objective.id] = v.id; });

    let isOccupied = p => ghosts[p.id],
        dibs = false;

    if (isOccupied(loc)) dibs = true;      // someone else have dibs already?
    else ghosts[loc.id] = u.id;

    let square = squareSpiral(loc, 5),
        linepts = directions
            .map((_, i) => linePoints(sortSquareFacing(loc, 5, i, square), 5, isOccupied)),
        sqval = sum(linepts.map((pts, i) => pts * u.ifrdir[i])) >> 8,
        nbval = Math.min(...
            oob
            .filter(v => v.player != u.player && v.isActive())
            .map(v => manhattanDistance(loc, v))
        );
    if (u.ifr >= 16 && nbval == 0) return 0;

    nbval += terraintypes[loc.terrain].defence + 1;  // our 0 adj is equiv to his 1
    sqval += u.ifr >= 16 ? u.ifr * nbval : 2 * (15 - u.ifr) * (9 - nbval);
    if (dibs) sqval -= 32;
    sqval -= 1 << range;
    return sqval < 0 ? 0 : sqval;
}

function sortSquareFacing(center, diameter, dir, locs) {
    if (diameter % 2 != 1) throw("Diameter should be odd: 1, 3, 5, ...");
    if (!locs || locs.length != diameter * diameter) throw("Square diameter doesn't match length");

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

function linePoints(locs, diameter, occupied) {
    // curious that this doesn't consider terrain, e.g. a line ending at the coast will get penalized heavily?
    let r = (diameter-1)/2,
        frontline = Array(diameter).fill(diameter),
        counts = Array(diameter).fill(0),
        row = -1, col = -1,
        score = 0;

    locs.forEach(loc => {
        row = (row + 1) % diameter;
        if (row == 0) col++;
        if (occupied(loc)) {
            counts[col] += 1;
            if (frontline[col] == diameter) frontline[col] = row;
        }
    })
    frontline.forEach((row, col) => {
        if (row < diameter) score += 40;
        if (row < diameter-1 && occupied(locs[row + 1 + diameter*col])) score -= 32;
    })
    if (frontline[r] == r && counts[r] == 1) score += 48;
    // also curious that we look at all pairs not just adjacent ones?
    for (let i=1; i<diameter; i++) for (let j=0; j<i; j++) {
        let delta = Math.abs(frontline[i]-frontline[j]);
        if (delta) score -= 1 << delta;
    }
    return score;
}

export {think, conclude, linePoints, sortSquareFacing};
