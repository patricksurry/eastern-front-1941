import {sum, players, type Point, PlayerKey, directions, DirectionKey, terraintypes} from './defs';
import {MapPoint, GridPoint} from './map';
import {type Oob} from './oob';
import {Unit} from './unit';

import {type Game} from './game';
class Thinker {
    #game: Game;
    #player: PlayerKey;
    #trainOfThought = 0;
    #depth = 0;
    #delay = 0;
    finalized = true;

    constructor(game: Game, player: PlayerKey) {
        this.#game = game;
        this.#player = player;
    }

    thinkRecurring(delay?: number) {
        this.#delay = (delay == null) ? 250: delay;
        this.finalized = false;

        this.#recur(this.#trainOfThought);
    }

    #recur(train: number) {
        if (train != this.#trainOfThought) {
            // skip pre-scheduled old train of thought
            console.debug(`Skipped passing thought, train ${train}`);
            return;
        }
        const t0 = performance.now();
        this.think();
        const dt = performance.now() - t0;

        this.#delay *= 1.1;  // gradually back off thinking rate
        console.debug(`Think.#recur ${train}-${this.#depth} took ${Math.round(dt)}ms; waiting ${Math.round(this.#delay)}ms`);
        this.#depth++;

        setTimeout(() => this.#recur(train), this.#delay);
    }
    finalize() {
        console.debug("Finalizing...")
        this.#trainOfThought++;
        this.#depth = 0;
        this.finalized = true;
        this.#game.oob.activeUnits(this.#player).forEach(u => u.setOrders(u.orders.slice(0, 8)));
    }
    think() {
        const
            firstpass = this.#depth == 0,
            pinfo = players[this.#player],
            friends = this.#game.oob.activeUnits(this.#player),
            foes = this.#game.oob.activeUnits(1-this.#player);

        // set up the ghost army
        let ofr = 0;  // only used in first pass
        if (firstpass) {
            ofr = calcForceRatios(this.#game.oob, this.#player).ofr;
            friends.forEach(u => {u.objective = u.point});
        }

        friends.filter(u => u.canMove).forEach(u => {
            //TODO these first two checks don't seem to depend on ghost army so are fixed on first pass?
            if (firstpass && u.ifr == (ofr >> 1)) {
                // head to reinforce if no local threat since (Local + OFR) / 2 = OFR / 2
                //TODO this tends to send most units to same beleagured square
                const v = this.#findBeleaguered(u, friends);
                if (v) u.objective = v.point;
            } else if (firstpass && (u.cstrng <= (u.mstrng >> 1) || u.ifrdir[pinfo.homedir] >= 16)) {
                // run home if hurting or outnumbered in the rear
                //TODO could look for farthest legal square (valid & not impassable) 5, 4, ...
                //!this fails if the target point is impassable, better to aim for nearest valid point on home border
                const {dlon, dlat} = directions[pinfo.homedir];
                u.objective = {lon: u.lon + 5 * dlon, lat: u.lat + 5 * dlat};
            } else {
                // find nearest best square
                const start = this.#game.mapboard.locationOf(u.objective!);
                let bestval = this.#evalLocation(u, start, friends, foes);
                Object.keys(directions).forEach(d => {
                    const loc = this.#game.mapboard.neighborOf(start, +d as DirectionKey);
                    if (!loc) return;
                    const sqval = this.#evalLocation(u, loc, friends, foes);
                    if (sqval > bestval) {
                        bestval = sqval;
                        u.objective = loc.point;
                    }
                });
            }
            if (!u.objective) return;
            const result = u.bestPath(u.objective);
            if (!result) return;
            u.setOrders(result.orders);  // We'll prune to 8 later
        });

        return friends.filter(u => u.objective);
    }
    #findBeleaguered(u: Unit, friends: Unit[]): Unit | null {
        let best: Unit | null = null, score = 0;
        friends.filter(v => v.ifr > u.ifr).forEach(v => {
            const d = GridPoint.manhattanDistance(u, v);
                if (d <= 8) return;  // APX code does weird bit 3 check
                const s = v.ifr - (d >> 3);
                if (s > score) {
                    score = s;
                    best = v;
                }
            });
        return best;
    }
    #evalLocation(u: Unit, loc: MapPoint, friends: Unit[], foes: Unit[]) {
        const ghosts: Record<number, number> = {},
            range = GridPoint.manhattanDistance(u, loc);

        // too far, early exit
        if (range >= 8) return 0;

        const nbval = Math.min(...foes.map(v => GridPoint.manhattanDistance(loc, v)));

        // on the defensive and square is occupied by an enemy
        if (u.ifr >= 16 && nbval == 0) return 0;

        friends.filter(v => v.id != u.id)
            .forEach(v => { ghosts[GridPoint.get(v.objective!).id] = v.id; });

        const isOccupied = (pt: GridPoint) => !!ghosts[pt.id];
        let dibs = false;

        if (isOccupied(loc)) dibs = true;      // someone else have dibs already?
        else ghosts[loc.id] = u.id;

        const square = GridPoint.squareSpiral(loc, 5),
            linepts = Object.keys(directions).map(
                d => linePoints(sortSquareFacing(loc, 5, +d, square), 5, isOccupied)
            ),
            tadj = terraintypes[loc.terrain].defence + 2;  // our 0 adj is equiv to his 2

        let sqval = sum(linepts.map((scr, i) => scr * u.ifrdir[i])) >> 8;
        sqval += u.ifr >= 16 ? u.ifr * (nbval + tadj) : 2 * (15 - u.ifr) * (9 - nbval + tadj);
        if (dibs) sqval -= 32;
        sqval -= 1 << range;
        return sqval < 0 ? 0 : sqval;
    }
}

function calcForceRatios(oob: Oob, player: PlayerKey) {
    const active = oob.activeUnits(),
        friend = sum(active.filter(u => u.player == player).map(u => u.cstrng)),
        foe = sum(active.filter(u => u.player != player).map(u => u.cstrng)),
        ofr = Math.floor((foe << 4) / friend),
        ofropp = Math.floor((friend << 4) / foe);

    active.forEach(u => {
        const nearby = active.filter(v => GridPoint.manhattanDistance(u, v) <= 8),
            p = u.point;
        let friend = 0;
        u.ifrdir = [0, 0, 0, 0];
        nearby.forEach(v => {
            const inc = v.cstrng >> 4;
            if (v.player == u.player) friend += inc;
            else u.ifrdir[GridPoint.directionFrom(p, v.point)!] += inc;
        })
        // individual and overall ifr max 255
        const ifr = Math.floor((sum(u.ifrdir) << 4) / friend);
        // we actually work with average of IFR + OFR
        u.ifr = (ifr + (u.player == player ? ofr: ofropp)) >> 1;
    });
    return {ofr, friend, foe};
}

function sortSquareFacing(center: Point, diameter: number, dir: DirectionKey, locs: Point[]) {
    if (diameter % 2 != 1) throw(`sortSquareFacing: diameter should be odd, got ${diameter}`);
    if (!locs || locs.length != diameter * diameter) throw(`sortSquareFacing: diameter : size mismatch ${locs.length} != ${diameter}^2`);

    const r = (diameter - 1)/2,
        minor = directions[(dir+1)%4 as DirectionKey],
        major = directions[(dir+2)%4 as DirectionKey],
        out = new Array(locs.length);

    locs.forEach(loc => {
        const dlat = loc.lat - center.lat,
            dlon = loc.lon - center.lon,
            idx = (
                r + dlat * major.dlat + dlon * major.dlon
                + diameter * (r + dlat * minor.dlat + dlon * minor.dlon)
            );
        out[idx] = loc;
    })
    return out;
}

function linePoints(locs: GridPoint[], diameter: number, occupied: (pt: GridPoint) => boolean) {
    // curious that this doesn't consider terrain, e.g. a line ending at the coast will get penalized heavily?
    const r = (diameter-1)/2,
        frontline = Array(diameter).fill(diameter),
        counts = Array(diameter).fill(0);
    let row = -1, col = -1,
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
        const delta = Math.abs(frontline[i]-frontline[j]);
        if (delta) score -= 1 << delta;
    }
    return score;
}

const privateExports = {calcForceRatios, linePoints, sortSquareFacing};

export {Thinker, privateExports};
