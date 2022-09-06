function getUnitPath(u) {
    let loc = Location.of(u),
        path = [loc];
    u.orders.forEach(dir => {
        let dst = loc.neighbor(dir);
        if (!dst) return;
        path.push(loc = dst)
    });
    return path;
}

function addOrder(u, dir) {
    let path = getUnitPath(u),
        dst = path.pop().neighbor(dir);
    if (dst) {
        u.orders.push(dir);
    }
    return dst;
}

function resetOrders(u) {
    u.orders = [];
}

function moveCost(u, dir) {
    let dst = Location.of(u).neighbor(dir);
    return dst
        ? terraintypes[dst.terrain].movecost[u.armor][gameState.weather]
        : 255;
}

function nextOrderCost(u) {
    return u.orders.length
        ? moveCost(u, u.orders[0])
        : 255;
}

function reach(u) {
    // find all squares accessible to u, ignoring zoc
    let cost = 0,
        start = Location.of(u),
        locs = {[start.id]: 0};

    while (cost < 32) {
        Object.entries(locs).filter(([k,v]) => v == cost).forEach(([k,_]) => {
            let src = Location.fromid(k);
            src.put(u);
            Object.keys(directions).forEach(i => {
                let dst = src.neighbor(i);
                if (!dst) return;
                let curr = dst.id in locs ? locs[dst.id] : 255;
                if (curr <= cost) return;
                let c = cost + moveCost(u, i);
                if (c <= 32 && c < curr) locs[dst.id] = c;
            });
        });
        cost++;
    }
    start.put(u);
    return locs;
}

function maybeMove(u) {
    let start = Location.of(u),
        dest = start.neighbor(u.orders[0]),  // assumes legal
        enemy = Player.other(u.player);

    if (dest.unitid != null) {
        if (oob[dest.unitid].player == u.player) {
            u.tick += 2;
            return;
        } else {
            //TODO combat; and retreat clears orders?
            console.log('TODO: battle!')
        }
    } else if (zoneOfControl(enemy, start) >= 2 && zoneOfControl(enemy, dest) >= 2) {
        // moving between enemy ZOC M.ASM:5740
        u.tick += 2;
        return;
    }

    // move the unit
    start.unitid = null;
    dest.unitid = u.id;
    dest.put(u);
    u.orders.shift();
    u.tick += nextOrderCost(u);
}

function zoneOfControl(player, loc) {
    // evaluate player's zoc in square at pt
    let zoc = 0;
    // same player in target square exerts 4, enemy negates zoc
    if (loc.unitid != null) {
        if (oob[loc.unitid].player != player) return zoc;
        zoc += 4;
    }
    spiral1.forEach((d, i) => {
        loc = loc.neighbor(d, true);
        // even steps in the spiral exert 2, odd steps exert 1
        if (loc.unitid != null && oob[loc.unitid].player == player) zoc += (i % 2) ? 1: 2;
    });
    return zoc;
}

function traceSupply(u, weather) {
    // implement the supply check from C.ASM:3430
    const sinfo = players[u.player].supply,
        enemy = Player.other(u.player);
    let fail = 0,
        loc = Location.of(u),
        dir = sinfo.home;

    if (sinfo.freeze && weather == Weather.snow) {
        // C.ASM:3620
        if (randint(256) >= 74 + 4*(sinfo.home == Direction.west ? u.lon: maxlon-u.lon)) {
            return 0;
        }
    }
    while(fail < sinfo.maxfail[weather]) {
        let dst = loc.neighbor(dir, true),
            cost = 0;

        if (dst.lon < 0 || dst.lon >= mapboard.maxlon) {
            return 1;
        } else if (dst.terrain == Terrain.impassable && (sinfo.sea == 0 || dst.alt == 1)) {
            cost = 1;
        } else if (zoneOfControl(enemy, dst) >= 2) {
            cost = 2;
        } else {
            loc = dst;
        }
        if (cost) {
            fail += cost;
            dir = randint(2) ? Direction.north : Direction.south;
        } else {
            dir = sinfo.home;
        }
    }
    return 0;
}

//TODO supply penalty & replacements

/* combat C.ASM:1150

no finnish attack (make this a generic unit flag)

flashing red/white solid for defender, machine gun?

defender cstrng + terrain modifier + moving penalty (max 255) => random256
if hit, mstrng--, cstrng -=5
dead?
attacker break?  (no retreat)

attacker cstrng + offence terrain modifier
if hit, as above
break => retreat

retreat:  (check move legal C.ASM:2800)
- same dir as attacker order (away from them)
- then home dir (e/w)
- then north  [could randomize these]
- then south
- then opp home dir (w/e)

legal retreat?
- square occupied?
- legal move (excl blocked hexsides)
- no zone of control >=2 in target
- fail cstrng -=5


inc tick (for next round/move)

set victory flag (to consume order)




*/
