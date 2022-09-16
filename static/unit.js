function Unit(corpsx, corpsy, mstrng, swap, arrive, corpt, corpno) {
    const types = ['', 'SS', 'FINNISH', 'RUMANIAN', 'ITALIAN', 'HUNGARAN', 'MOUNTAIN', 'GUARDS'],
        variants = ['INFANTRY', 'TANK', 'CAVALRY', 'PANZER', 'MILITIA', 'SHOCK', 'PARATRP', 'PZRGRNDR'];
    let u = Object.assign({
        id: Unit.id++,
        player: (swap & 0x80) ? Player.russian : Player.german,  // german=0, russian=1; equiv i >= 55
        lon: corpsx,
        lat: corpsy,
        mstrng: mstrng,
        cstrng: mstrng,
        icon: swap & 0x3f | 0x80,  // drop the color and address custom char pages
        arrive: arrive,
        flags: corpt,
        type: types[corpt >> 4],
        variant: variants[corpt & 0x0f],
        armor: (swap & 0x1) == 0 ? 1 : 0,        // inf is clr | 0x3d, armor is clr | 0x3e
        unitno: corpno,
        orders: [],      // WHORDRS, HMORDS
        isActive: Unit.isActive,
        path: Unit.path,
        addOrder: Unit.addOrder,
        resetOrders: Unit.resetOrders,
        moveCost: Unit.moveCost,
        scheduleOrder: Unit.scheduleOrder,
        bestPath: Unit.bestPath,
        reach: Unit.reach,
        moveTo: Unit.moveTo,
        tryOrder: Unit.tryOrder,
        resolveCombat: Unit.resolveCombat,
        takeDamage: Unit.takeDamage,
        recover: Unit.recover,
        traceSupply: Unit.traceSupply,
    });
    u.canAttack = u.type != 'FINNISH' ? 1: 0;
    u.canMove = u.variant != 'MILITIA' ? 1: 0;
    u.label = [u.unitno, u.variant, u.type, players[u.player].unit].filter(Boolean).join(' ').trim();
    return u;
}
Unit.id = 0;
Unit.isActive = function() { return this.arrive <= gameState.turn && this.cstrng > 0; }
Unit.path = function() {
    let loc = Location.of(this),
        path = [loc];
    this.orders.forEach(dir => {
        let dst = loc.neighbor(dir);
        if (!dst) return;
        path.push(loc = dst)
    });
    return path;
}
Unit.addOrder = function(dir) {
    if (!this.canMove) return null;
    let path = this.path(),
        dst = path.pop().neighbor(dir);
    if (dst) this.orders.push(dir);
    return dst;
}
Unit.resetOrders = function() { this.orders = []; this.tick = 255;}
Unit.moveCost = function(dir) {
    if (!this.canMove) return 255;
    let dst = Location.of(this).neighbor(dir);
    return dst ? terraintypes[dst.terrain].movecost[this.armor][gameState.weather]: 255;
}
Unit.scheduleOrder = function(reset) {
    if (reset) this.tick = 0;
    if (this.orders.length) this.tick += this.moveCost(this.orders[0]);
    else this.tick = 255;
}
Unit.bestPath = function(goal) {
    // implements A* shortest path, e.g. see https://www.redblobgames.com/pathfinding/a-star/introduction.html
    // returns {cost: , orders: []} where cost is the movement cost (ticks), and orders is a seq of dir indices
    // or null if goal is unreachable
    const costs = terraintypes.map(t => t.movecost[this.armor][gameState.weather] || 255),
        minCost = Math.min(...costs);
    let src = Location.of(this),
        frontEst = {_: 0},              // estimated total cost via this square, _ is head
        frontNext = {_: src.id},        // linked list with next best frontier square to check
        dirTo = {[src.id]: null},       // direction index which arrived at keyed square
        costTo = {[src.id]: 0};         // actual cost to get to keyed square

    while (frontNext._) {
        let next = frontNext._;
        src = Location.fromid(next);
        if (src.id == goal.id) break;
        frontNext._ = frontNext[next];
        frontEst._ = frontEst[next];
        delete frontNext[next], frontEst[next]

        Object.values(Direction).forEach(i => {
            let dst = src.neighbor(i);
            if (!dst) return;
            let cost = costTo[src.id] + costs[dst.terrain];
            if (!(dst.id in costTo)) {  // with consistent estimate we always find best first
                costTo[dst.id] = cost;
                dirTo[dst.id] = i;
                let est = cost + minCost * manhattanDistance(src, dst),
                    at = '_';
                while (frontNext[at] && frontEst[at] < est) at = frontNext[at];
                next = frontNext[at];
                frontNext[at] = dst.id;
                frontNext[dst.id] = next;
                frontEst[dst.id] = est;
            }
        });
    }
    if (src.id != goal.id) return null;

    let orders = [];
    while (true) {
        let dir = dirTo[src.id];
        if (dir == null) break;
        orders.unshift(dir);
        src = src.neighbor((dir + 2) % 4);
    }
    return {cost: costTo[goal.id], orders: orders}
}
Unit.reach = function(range) {
    // find all squares accessible to unit, ignoring other units, zoc, within range
    let cost = 0,
        start = Location.of(this),
        locs = {[start.id]: 0};

    range = range || 32;
    while (cost < range) {
        Object.entries(locs).filter(([k,v]) => v == cost).forEach(([k,_]) => {
            let src = Location.fromid(k);
            src.put(this);
            Object.values(Direction).forEach(i => {
                let dst = src.neighbor(i);
                if (!dst) return;
                let curr = dst.id in locs ? locs[dst.id] : 255;
                if (curr <= cost) return;
                let c = cost + this.moveCost(i);
                if (c <= range && c < curr) locs[dst.id] = c;
            });
        });
        cost++;
    }
    start.put(this);
    return locs;
}
Unit.moveTo = function(dst, duration) {
    // move the unit
    Location.of(this).unitid = null;
    if (dst != null) {
        dst.unitid = this.id;
        dst.put(this);
        this.show(duration);
    } else {
        this.hide(duration);
    }
}
Unit.tryOrder = function() {
    let src = Location.of(this),
        dst = src.neighbor(this.orders[0]);  // assumes legal

    if (dst.unitid != null) {
        let opp = oob[dst.unitid];
        if (opp.player != this.player) {
            if (!this.resolveCombat(opp)) {
                this.tick++;
                return;
            }
            // otherwise fall through to advance after combat, ignoring ZoC
        } else {
            // traffic jam
            this.tick += 2;
            return;
        }
    } else if (zocBlocked(this.player, src, dst)) {
        // moving between enemy ZOC M.ASM:5740
        this.tick += 2;
        return;
    }

    this.moveTo(dst);
    this.orders.shift();
    this.scheduleOrder();
}
Unit.resolveCombat = function(opp) {
    if (!this.canAttack) return;

    // return 1 if target square is vacant
    let modifier = terraintypes[Location.of(opp).terrain].defence;
    if (opp.orders.length) modifier--;  // movement penalty

    let str = modifyStrength(opp.cstrng, modifier);
    if (str >= rand256()) this.takeDamage(1, 5);

    //TODO original game doesn't skip attacker if break
    modifier = terraintypes[Location.of(opp).terrain].offence;
    str = modifyStrength(this.cstrng, modifier);
    if (str >= rand256()) {
        return opp.takeDamage(1, 5, true, this.orders[0]);
    } else {
        return 0;
    }
}
Unit.takeDamage = function(mdmg, cdmg, checkBreak, retreatDir) {
    // return 1 if this square is vacated, 0 otherwise

    // apply mdmg/cdmg to unit
    this.mstrng -= mdmg;
    this.cstrng -= cdmg;

    // dead?
    if (this.cstrng <= 0) {
        this.mstrng = 0;
        this.cstrng = 0;
        this.arrive = 255;
        this.resetOrders();
        this.moveTo(null);
        return 1;
    }
    this.show();

    if (!checkBreak) return 0;

    // russian (& ger allies) break if cstrng <= 7/8 mstrng
    // german break if cstrng < 1/2 mstrng
    // original game seems to include SS type with german allies which seems wrong (are there any?)
    let shft = (this.player == Player.german && this.type <= 1) ? 1 : 3;
    if (this.cstrng < this.mstrng - (this.mstrng >> shft)) {
        this.resetOrders();

        if (retreatDir !== null) {
            const homedir = players[this.player].homedir,
                nxtdir = (rand256() & 0x1) ? Direction.north : Direction.south,
                dirs = [retreatDir, homedir,  nxtdir, (nxtdir + 2) % 4, (homedir + 2) % 4];

            for (dir of dirs) {
                let src = Location.of(this),
                    dst = src.neighbor(dir);
                if (!dst || dst.unitid != null || zocBlocked(this.player, src, dst)) {
                    if (this.takeDamage(0, 5)) return 1;  // dead
                } else {
                    this.moveTo(dst, 100);
                    return 1;
                }
            }
        }
    }
    // otherwise square still occupied (no break or all retreats blocked but defender remains)
    return 0;
}
Unit.recover = function() {
    // M.ASM:5070  recover combat strength
    if (this.mstrng - this.cstrng >= 2) this.cstring += 1 + (rand256() & 0x1);
}
Unit.traceSupply = function(weather) {
    // implement the supply check from C.ASM:3430, returns 0 if supplied, 1 if not
    const player = players[this.player],
        supply = player.supply;
    let fail = 0,
        loc = Location.of(this),
        dir = player.homedir;

    if (supply.freeze && weather == Weather.snow) {
        // C.ASM:3620
        if (rand256() >= 74 + 4*(dir == Direction.west ? this.lon: maxlon-this.lon)) {
            return 0;
        }
    }
    while(fail < supply.maxfail[weather]) {
        let dst = loc.neighbor(dir, true),
            cost = 0;

        if (dst.lon < 0 || dst.lon >= mapboard.maxlon) {
            return 1;
        } else if (dst.terrain == Terrain.impassable && (supply.sea == 0 || dst.alt == 1)) {
            cost = 1;
        } else if (zocAffecting(this.player, dst) >= 2) {
            cost = 2;
        } else {
            loc = dst;
        }
        if (cost) {
            fail += cost;
            dir = (rand256() & 0x1) ? Direction.north : Direction.south;
        } else {
            dir = player.homedir;
        }
    }
    return 0;
}
//TODO supply penalty & replacements


const oob = oobdata.map(vs => Unit(...vs));


function zocAffecting(player, loc) {
    // evaluate zoc experienced by player (eg. exerted by !player) in square at pt
    let zoc = 0;
    // same player in target square exerts 4, enemy negates zoc
    if (loc.unitid != null) {
        if (oob[loc.unitid].player == player) return zoc;
        zoc += 4;
    }
    //TODO spiralFrom(loc, 1).forEach((loc, i) => { ... })
    spiral1.forEach((d, i) => {
        loc = loc.neighbor(d, true);
        // even steps in the spiral exert 2, odd steps exert 1
        if (loc.unitid != null && oob[loc.unitid].player != player) zoc += (i % 2) ? 1: 2;
    });
    return zoc;
}

function zocBlocked(player, src, dst) {
    // does enemy ZoC block player move from src to dst?
    return zocAffecting(player, src) >= 2 && zocAffecting(player, dst) >= 2;
}

function modifyStrength(strength, modifier) {
    if (modifier > 0) {
        while (modifier-- > 0) strength = Math.min(strength << 1, 255);
    } else {
        while (modifier++ < 0) strength = Math.max(strength >> 1, 1);
    }
    return strength;
}


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
