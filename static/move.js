function addDir(pt, dir) {
    let d = directions[dir];
    return {lon: pt.lon + d.dlon, lat: pt.lat + d.dlat}
}

function maybeStepDir(pt, dir) {
    let {lon: lon, lat: lat} = pt,
        p2 = addDir(pt, dir),
        legal = (
            mapboard.at(p2).terrain != Terrain.impassable
            && !(
                (dir == Direction.north || dir == Direction.south)
                ? blocked[0].find(d => d.lon == lon && d.lat == (dir == Direction.north ? lat : p2.lat))
                : blocked[1].find(d => d.lon == (dir == Direction.west ? lon : p2.lon) && d.lat == lat)
            ));
    return legal ? p2: null;
}

function getUnitPath(u) {
    let pt = {lon: u.lon, lat: u.lat},
        pts = [pt];
    u.orders.forEach(dir => {
        let p = maybeStepDir(pt, dir);
        if (!p) return;
        pts.push(pt = p)
    });
    return pts;
}

function addOrder(u, dir) {
    let pts = getUnitPath(u),
        pt = maybeStepDir(pts.pop(), dir);
    if (pt) {
        u.orders.push(dir);
    }
    return pt;
}

function resetOrders(u) {
    u.orders = [];
}

function nextMoveCost(u) {
    if (u.orders.length == 0) return 255;
    let pt = maybeStepDir(u, u.orders[0]),
        t = terraintypes[mapboard.at(pt).terrain];
    return t.move[u.armor][gameState.weather];
}

function maybeMove(u) {
    let pt = maybeStepDir(u, u.orders[0]),  // assumes legal
        m = mapboard.at(pt),
        m0 = mapboard.at(u),
        enemy = Player.other(u.player);


    if (m.unitid !== null) {
        if (oob[m.unitid].player == u.player) {
            u.tick += 2;
            return;
        } else {
            //TODO combat; and retreat clears orders?
        }
    } else if (zoneOfControl(enemy, u) >= 2 && zoneOfControl(enemy, pt) >= 2) {
        // moving between enemy ZOC M.ASM:5740
        u.tick += 2;
        return;
    }

    // move the unit
    m0.unitid = null;
    m.unitid = u.id;
    u.lat = pt.lat;
    u.lon = pt.lon;
    u.orders.shift();
    u.tick += nextMoveCost(u);
}

function zoneOfControl(player, pt) {
    // evaluate player's zoc in square at pt
    let m = mapboard.at(pt),
        zoc = 0;
    // same player in target square exerts 4, enemy negates zoc
    if (m.unitid) {
        if (oob[m.unitid].player != player) return zoc;
        zoc += 4;
    }
    spiral1.forEach((d, i) => {
        pt = addDir(pt, d);
        if (!mapboard.valid(pt)) return;
        m = mapboard.at(pt);
        // even steps in the spiral exert 2, odd steps exert 1
        if (m.unitid && oob[m.unitid].player == player) zoc += (i % 2) ? 1: 2;
    })
    return zoc;
}

function traceSupply(u, weather) {
    // implement the supply check from C.ASM:3430
    const sinfo = players[u.player].supply,
        enemy = Player.other(u.player);
    let fail = 0,
        pt = u,
        dir = sinfo.home;

    if (sinfo.freeze && weather == Weather.snow) {
        // C.ASM:3620
        if (randint(256) >= 74 + 4*(sinfo.home == Direction.west ? u.lon: mapboard.maxlon-u.lon)) {
            return 0;
        }
    }
    while(fail < sinfo.maxfail[weather]) {
        let q = addDir(pt, dir),
            m = mapboard.at(q),
            cost = 0;

        if (q.lon < 0 || q.lon >= mapboard.maxlon) {
            return 1;
        } else if (m.terrain == Terrain.impassable && (sinfo.sea == 0 || m.alt == 1)) {
            cost = 1;
        } else if (zoneOfControl(enemy, q) >= 2) {
            cost = 2;
        } else {
            pt = q;
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
