import {
    enumFor,
    players, Player, terraintypes, Terrain, Direction, directions, Weather,
    unitkinds, UnitKind, moveCost, moveCosts, randbyte,
} from './defs.js';


const
    types = [
        {key: 'infantry', kind: UnitKind.infantry},
        {key: 'militia',  kind: UnitKind.infantry, canMove: 0},
        {key: 'unused'},  // apx had unused labels for shock and paratrp
        {key: 'flieger',  kind: UnitKind.air},   // cart only
        {key: 'panzer',   kind: UnitKind.armor},
        {key: 'tank',     kind: UnitKind.armor},
        {key: 'cavalry',  kind: UnitKind.armor},
        {key: 'pzgrndr',  kind: UnitKind.armor},   // apx only
    ],
    Type = enumFor(types),
    apxXref = {
        0: Type.infantry, 1: Type.tank, 2: Type.cavalry, 3: Type.panzer,
        4: Type.militia, 5: Type.unused /* shock */, 6: Type.unused /* paratrp */, 7: Type.pzgrndr,
    },
    modifiers = [
        {key: ''},
        {key: 'ss'}, // unused
        {key: 'finnish',  canAttack: 0},
        {key: 'rumanian'},
        {key: 'italian'},
        {key: 'hungarian'},
        {key: 'mountain'},  //  unused
        {key: 'guards'},
    ];

function Unit(game, ...args) {
    let corpsx, corpsy, mstrng, arrive, corpt, corpno;

    if (args.length == 7) {     // apx
        let swap, corptapx;
        [corpsx, corpsy, mstrng, swap, arrive, corptapx, corpno] = args;
        // translate apx => cart format
        corpt = (swap & 0x80) | (corptapx & 0x70) | apxXref[corptapx & 0x7];
    } else {                    // cart
        console.assert(args.length == 6, "Expected 6 or 7 args for cartridge or apx unit def respectively");
        [corpsx, corpsy, mstrng, arrive, corpt, corpno] = args;
    }
    const
        modifier = (corpt >> 4) & 0x7,
        type = corpt & 0x7,
        kind = types[type].kind;

    let u = Object.assign(
        {
            id: Unit.id++,
            player: (corpt & 0x80) ? Player.russian : Player.german,  // german=0, russian=1; equiv i >= 55
            unitno: corpno,
            kind,
            type,
            modifier,
            canMove: 1,
            canAttack: 1,
            resolute: 0,
            arrive,
            scheduled: arrive,
            lon: corpsx,
            lat: corpsy,
            mstrng,
            cstrng: mstrng,
            orders: [],      // WHORDRS, HMORDS
        },
        unitkinds[kind],
        types[type],
        modifiers[modifier],
        {
            game: game,
            m: game.mapboard,
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
            score: Unit.score,
            describe: Unit.describe,
        },
    );
    delete u.key;

    u.resolute = u.player == Player.german && !u.modifier ? 1: 0;
    u.label = [
        u.unitno,
        modifiers[u.modifier].key,
        types[u.type].key,
        players[u.player].unit
    ].filter(Boolean).join(' ').toUpperCase().trim();

    return u;
}
Unit.id = 0;
Unit.isActive = function() { return this.arrive <= this.game.turn && this.cstrng > 0; }
Unit.path = function() {
    let loc = this.m.locationOf(this),
        path = [loc];
    this.orders.forEach(dir => {
        let dst = this.m.neighbor(loc, dir);
        if (!dst) return;
        path.push(loc = dst)
    });
    return path;
}
Unit.addOrder = function(dir) {
    let dst = null;
    if (!this.canMove) {
        this.game.errmsg("MILITIA UNITS CAN'T MOVE!");
    } else if (this.orders.length == 8) {
        this.game.errmsg("ONLY 8 ORDERS ARE ALLOWED!")
    } else {
        let path = this.path();
        dst = this.m.neighbor(path.pop(), dir);
        if (dst) {
            this.orders.push(dir);
        } else {
            this.game.errmsg("IMPASSABLE!");
        }
    }
    return dst;
}
Unit.resetOrders = function() { this.orders = []; this.tick = 255;}
Unit.moveCost = function(dir) {
    if (!this.canMove) return 255;
    let dst = this.m.neighbor(this, dir);
    if (!dst) return 255;
    return moveCost(dst.terrain, this.kind, this.game.weather);
}
Unit.scheduleOrder = function(reset) {
    if (reset) this.tick = 0;
    if (this.orders.length) this.tick += this.moveCost(this.orders[0]);
    else this.tick = 255;
    this.game.changed('unit', this, {event: 'resolving'});
}
Unit.bestPath = function(goal) {
    //TODO config directPath for comparison
    return this.m.bestPath(this, goal, moveCosts(this.kind, this.game.weather));
}
Unit.reach = function(range) {
    return this.m.reach(this, range || 32, moveCosts(this.kind, this.game.weather));
}
Unit.moveTo = function(dst) {
    this.m.locationOf(this).unitid = null;  // leave the current location
    if (dst != null) {
        // occupy the new one and repaint
        dst.put(this);
        dst.unitid = this.id;
        this.m.occupy(dst, this.player);
    }
    this.game.changed('unit', this, {event: dst ? 'moved': 'removed'});
}
Unit.tryOrder = function() {
    let src = this.m.locationOf(this),
        dst = this.m.neighbor(src, this.orders[0]);  // assumes legal

    if (dst.unitid != null) {
        let opp = this.game.oob[dst.unitid];
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
    } else if (this.game.oob.zocBlocked(this.player, src, dst)) {
        // moving between enemy ZOC M.ASM:5740
        this.tick += 2;
        return;
    }

    this.orders.shift();
    this.moveTo(dst);
    this.scheduleOrder();
}
Unit.resolveCombat = function(opp) {
    // return 1 if target square is vacant
    if (!this.canAttack) return 0;

    this.flash(true);
    opp.flash(false);

    let modifier = terraintypes[this.m.locationOf(opp).terrain].defence;
    if (opp.orders.length) modifier--;  // movement penalty

    // opponent attacks
    let str = modifyStrength(opp.cstrng, modifier);
    // note APX doesn't skip attacker if break, but cart does
    if (str >= randbyte()) {
        this.takeDamage(1, 5, true);
        if (!this.orders) return 0;
    }
    modifier = terraintypes[this.m.locationOf(opp).terrain].offence;
    str = modifyStrength(this.cstrng, modifier);
    if (str >= randbyte()) {
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
        // TODO show as scrolling status window
        console.log(`${this.label} eliminated`)
        this.mstrng = 0;
        this.cstrng = 0;
        this.arrive = 255;
        this.resetOrders();
        this.moveTo(null);
        return 1;
    }
    this.game.changed('unit', this, {event: 'stats'});

    if (!checkBreak) return 0;

    // russian (& ger allies) break if cstrng <= 7/8 mstrng
    // german regulars break if cstrng < 1/2 mstrng
    let brkpt = this.mstrng - (this.mstrng >> (this.resolute ? 1: 3));
    if (this.cstrng < brkpt) {
        this.resetOrders();

        if (retreatDir !== null) {
            const homedir = players[this.player].homedir,
                nxtdir = (randbyte() & 0x1) ? Direction.north : Direction.south,
                dirs = [retreatDir, homedir,  nxtdir, (nxtdir + 2) % 4, (homedir + 2) % 4];

            for (let dir of dirs) {
                let src = this.m.locationOf(this),
                    dst = src.neighbor(dir);
                if (!dst || dst.unitid != null || this.game.oob.zocBlocked(this.player, src, dst)) {
                    if (this.takeDamage(0, 5)) return 1;  // dead
                } else {
                    this.moveTo(dst);
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
    if (this.mstrng - this.cstrng >= 2) this.cstring += 1 + (randbyte() & 0x1);
}
Unit.traceSupply = function() {
    // implement the supply check from C.ASM:3430, returns 0 if supplied, 1 if not
    const player = players[this.player],
        supply = player.supply;
    let fail = 0,
        loc = this.m.locationOf(this),
        dir = player.homedir;

    if (supply.freeze && this.game.weather == Weather.snow) {
        // C.ASM:3620
        if (randbyte() >= 74 + 4*(this.m.boundaryDistance(loc, dir) + (dir == Direction.east ? 1 : 0))) {
            return 0;
        }
    }
    while(fail < supply.maxfail[this.game.weather]) {
        let dst = this.m.neighbor(loc, dir, true),
            cost = 0;

        if (this.m.boundaryDistance(this, player.homedir) < 0) {
            return 1;
        } else if (dst.terrain == Terrain.impassable && (supply.sea == 0 || dst.alt == 1)) {
            cost = 1;
        } else if (this.game.oob.zocAffecting(this.player, dst) >= 2) {
            cost = 2;
        } else {
            loc = dst;
        }
        if (cost) {
            fail += cost;
            // either flip a coin or try the opposite direction (potentially repeatedly until failure)
            if (dir != player.homedir) dir = (dir + 2) % 4;
            else dir = (randbyte() & 0x1) ? Direction.north : Direction.south;
        } else {
            dir = player.homedir;
        }
    }
    return 0;
}
Unit.score = function() {
    let v = 0,
        dist = this.m.boundaryDistance(this, players[this.player].homedir);
    // see M.ASM:4050 - note even inactive units are scored based on future arrival/strength
    if (this.player == Player.german) {
        // maxlon + 2 == #$30 per M.ASM:4110
        v = (dist + 3) * (this.mstrng >> 1);
    } else {
        v = dist * (this.cstrng >> 3);
    }
    return v >> 8;
}
Unit.describe = function(debug) {
    let s = `[${this.id}] ${this.mstrng} / ${this.cstrng}\n`;
    s += `${this.label}\n`;
    if (this.orders) s += 'orders: ' + this.orders.map(d => directions[d].key[0].toUpperCase()).join('');

    if (this.ifr && debug) {
        s += `ifr: ${this.ifr}; `;
        s += directions.map((d, i) => `${d.key[0]}: ${this.ifrdir[i]}`).join(' ') + '\n';
        s += this.objective
            ? `obj: lon ${this.objective.lon} lat ${this.objective.lat}\n`
            : 'no objective\n'
    }
    return s;
}

function modifyStrength(strength, modifier) {
    if (modifier > 0) {
        while (modifier-- > 0) strength = Math.min(strength << 1, 255);
    } else {
        while (modifier++ < 0) strength = Math.max(strength >> 1, 1);
    }
    return strength;
}

export {Unit};
