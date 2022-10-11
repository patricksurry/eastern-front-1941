import {players, directions, terraintypes, sum} from './defs.js';
import {Mapboard, Location} from './map.js';


class Thinker {
    #game;
    #player;
    #trainOfThought = 0;
    #depth = 0;
    #delay;
    #concluded = false;

    constructor(game, player) {
        this.#game = game;
        this.#player = player;
    }

    thinkRecurring(delay) {
        this.#delay = (delay == null) ? 250: delay;
        this.concluded = false;

        this.#recur(this.#trainOfThought);
    }

    #recur(train) {
        if (train != this.#trainOfThought) {
            // skip pre-scheduled old train of thought
            console.debug(`Skipped passing thought, train ${train}`);
            return;
        }
        const t0 = performance.now();
        this.think()
            .forEach(u => this.#game.notify('unit', 'orders', u));
        const dt = performance.now() - t0;

        this.#delay *= 1.1;  // gradually back off thinking rate
        console.debug(`Think.#recur ${train}-${this.#depth} took ${Math.round(dt)}ms; waiting ${Math.round(this.#delay)}ms`);
        this.#depth++;

        setTimeout(() => this.#recur(train), this.#delay);
    }
    concludeRecurring() {
        console.debug("Concluding...")
        this.#trainOfThought++;
        this.#depth = 0;
        this.concluded = true;
        this.#game.oob.activeUnits(this.#player).forEach(u => {u.orders = u.orders.slice(0, 8)});
    }
    think() {
        const
            firstpass = this.#depth == 0,
            pinfo = players[this.#player],
            friends = this.#game.oob.activeUnits(this.#player),
            foes = this.#game.oob.activeUnits(1-this.#player);

        // set up the ghost army
        var ofr = 0;  // only used in first pass
        if (firstpass) {
            ofr = calcForceRatios(this.#game.oob, this.#player).ofr;
            console.log('Overall force ratio (OFR) is', ofr);
            friends.forEach(u => {u.objective = u.location});
        }

        friends.filter(u => u.canMove).forEach(u => {
            //TODO these first two checks don't seem to depend on ghost army so are fixed on first pass?
            if (firstpass && u.ifr == (ofr >> 1)) {
                // head to reinforce if no local threat since (Local + OFR) / 2 = OFR / 2
                //TODO this tends to send most units to same beleagured square
                let v = this.#findBeleaguered(u, friends);
                if (v) u.objective = v.location;
            } else if (firstpass && (u.cstrng <= (u.mstrng >> 1) || u.ifrdir[pinfo.homedir] >= 16)) {
                // run home if hurting or outnumbered in the rear
                //TODO could look for farthest legal square (valid & not impassable) 5, 4, ...
                let d = directions[pinfo.homedir];
                u.objective = new Location(u.lon + 5 * d.dlon, u.lat + 5 * d.dlat);
            } else {
                // find nearest best square
                let start = u.objective,
                    bestval = this.#evalLocation(u, start, friends, foes);
                directions.forEach((_, i) => {
                    let loc = this.#game.mapboard.neighbor(start, i);
                    if (!loc) return;
                    let sqval = this.#evalLocation(u, loc, friends, foes);
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
        });

        return friends.filter(u => u.objective);
    }
    #findBeleaguered(u, friends) {
        let best = null, score = 0;
        friends.filter(v => v.ifr > u.ifr).forEach(v => {
                let d = Mapboard.manhattanDistance(u, v);
                if (d <= 8) return;  // APX code does weird bit 3 check
                let s = v.ifr - (d >> 3);
                if (s > score) {
                    score = s;
                    best = v;
                }
            });
        return best;
    }
    #evalLocation(u, loc, friends, foes) {
        let ghosts = {},
            range = Mapboard.manhattanDistance(u, loc);

        // too far, early exit
        if (range >= 8) return 0;

        const nbval = Math.min(...foes.map(v => Mapboard.manhattanDistance(loc, v)));

        // on the defensive and square is occupied by an enemy
        if (u.ifr >= 16 && nbval == 0) return 0;

        friends.filter(v => v.id != u.id)
            .forEach(v => { ghosts[v.objective.id] = v.id; });

        let isOccupied = pt => ghosts[pt.id],
            dibs = false;

        if (isOccupied(loc)) dibs = true;      // someone else have dibs already?
        else ghosts[loc.id] = u.id;

        const square = this.#game.mapboard.squareSpiral(loc, 5),
            linepts = directions.map(
                (_, i) => linePoints(sortSquareFacing(loc, 5, i, square), 5, isOccupied)
            ),
            tadj = terraintypes[loc.terrain].defence + 2;  // our 0 adj is equiv to his 2

        let sqval = sum(linepts.map((scr, i) => scr * u.ifrdir[i])) >> 8;
        sqval += u.ifr >= 16 ? u.ifr * (nbval + tadj) : 2 * (15 - u.ifr) * (9 - nbval + tadj);
        if (dibs) sqval -= 32;
        sqval -= 1 << range;
        return sqval < 0 ? 0 : sqval;
    }
}

function calcForceRatios(oob, player) {
    let active = oob.activeUnits(),
        friend = sum(active.filter(u => u.player == player).map(u => u.cstrng)),
        foe = sum(active.filter(u => u.player != player).map(u => u.cstrng)),
        ofr = Math.floor((foe << 4) / friend),
        ofropp = Math.floor((friend << 4) / foe);

    active.forEach(u => {
        let nearby = active.filter(v => Mapboard.manhattanDistance(u, v) <= 8),
            friend = 0,
            loc = u.location;
        u.ifrdir = [0, 0, 0, 0];
        nearby.forEach(v => {
            let inc = v.cstrng >> 4;
            if (v.player == u.player) friend += inc;
            else u.ifrdir[Mapboard.directionFrom(loc, v.location)] += inc;
        })
        // individual and overall ifr max 255
        let ifr = Math.floor((sum(u.ifrdir) << 4) / friend);
        // we actually work with average of IFR + OFR
        u.ifr = (ifr + (u.player == player ? ofr: ofropp)) >> 1;
    });
    return {ofr, friend, foe};
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

const privateExports = {calcForceRatios, linePoints, sortSquareFacing};

export {Thinker, privateExports};
