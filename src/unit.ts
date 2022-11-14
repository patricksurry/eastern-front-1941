import {
    type Point, type Flag,
    players, PlayerKey, 
    terraintypes, TerrainKey, 
    directions, DirectionKey, 
    WeatherKey,
    unitkinds, UnitKindKey, 
    moveCost, moveCosts,
} from './defs';

import {Path, GridPoint, MapPoint} from './map';
import {Game} from './game';

type UnitType = {label: string, kind: UnitKindKey, canMove?: number};
const enum UnitTypeKey {
    infantry, militia, unused, flieger, panzer, tank, cavalry, pzgrndr
}
const unittypes: Record<UnitTypeKey, UnitType | null> = {
    [UnitTypeKey.infantry]: {label: "infantry", kind: UnitKindKey.infantry},
    [UnitTypeKey.militia]:  {label: "militia", kind: UnitKindKey.infantry, canMove: 0},
    [UnitTypeKey.unused]:   null, // apx had unused labels for shock and paratrp
    [UnitTypeKey.flieger]:  {label: "flieger", kind: UnitKindKey.air},   // cart only
    [UnitTypeKey.panzer]:   {label: "panzer", kind: UnitKindKey.armor},
    [UnitTypeKey.tank]:     {label: "tank", kind: UnitKindKey.armor},
    [UnitTypeKey.cavalry]:  {label: "cavalry", kind: UnitKindKey.armor},
    [UnitTypeKey.pzgrndr]:  {label: "pzgrndr", kind: UnitKindKey.armor},   // apx only
};

const apxXref: Record<number, UnitTypeKey> = {
        0: UnitTypeKey.infantry, 
        1: UnitTypeKey.tank, 
        2: UnitTypeKey.cavalry, 
        3: UnitTypeKey.panzer,
        4: UnitTypeKey.militia, 
        5: UnitTypeKey.unused /* shock */, 
        6: UnitTypeKey.unused /* paratrp */, 
        7: UnitTypeKey.pzgrndr,
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

class Unit implements Point {
    id: number;
    player: PlayerKey;
    unitno: number;
    kind: UnitKindKey;
    icon: number;
    type: UnitTypeKey;
    modifier: number;
    canMove = 1;
    canAttack = 1;
    resolute = 0;
    label: string;
    arrive: number;
    scheduled: number;
    lon: number;
    lat: number;
    mstrng: number;
    cstrng: number;
    orders: DirectionKey[] = [];        // WHORDRS, HMORDS
    tick?: number;
    ifr = 0;
    ifrdir: [number, number, number, number] = [0, 0, 0, 0];
    objective?: Point;

    #game: Game;

    constructor(game: Game, id: number, ...args: number[]) {
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
        this.id = id;
        this.player = (corpt & 0x80) ? PlayerKey.Russian : PlayerKey.German;  // german=0, russian=1; equiv i >= 55
        this.unitno = corpno;
        this.type = corpt & 0x7 as UnitTypeKey;
        let ut = unittypes[this.type];
        if (ut == null) throw new Error(`Unused unit type for unit id ${id}`)
        this.kind = ut.kind;
        this.icon = unitkinds[this.kind].icon;
        this.modifier = (corpt >> 4) & 0x7;
        this.arrive = arrive;
        this.scheduled = arrive;
        this.lon = corpsx;
        this.lat = corpsy;
        this.mstrng = mstrng;
        this.cstrng = mstrng;

        this.canMove = ut.canMove ?? 1;
        this.canAttack = modifiers[this.modifier].canAttack ?? 1;
        this.resolute = this.player == PlayerKey.German && !this.modifier ? 1: 0;
        this.label = [
            this.unitno,
            modifiers[this.modifier].key,
            ut.label,
            players[this.player].unit
        ].filter(Boolean).join(' ').toUpperCase().trim();

        this.#game = game;
    }
    get active() {
        return this.arrive <= this.#game.turn && this.cstrng > 0;
    }
    get human() {
        return this.player == this.#game.human;
    }
    get location() {
        return this.#game.mapboard.locationOf(this);
    }
    get path(): MapPoint[] {
        let loc = this.location,
            path = [loc];
        this.orders.forEach(dir => {
            let dst = this.#game.mapboard.neighborOf(loc, dir);
            if (!dst) return;
            path.push(loc = dst)
        });
        return path;
    }
    addOrder(dir: number) {
        let dst: MapPoint | null = null,
            err: string | null = null;
        if (!this.canMove) {
            err = "MILITIA UNITS CAN'T MOVE!";
        } else if (this.orders.length == 8) {
            err ="ONLY 8 ORDERS ARE ALLOWED!";
        } else {
            dst = this.#game.mapboard.neighborOf(this.path.pop()!, dir);
            if (!dst) {
                err = "IMPASSABLE!";
            } else {
                this.orders.push(dir);
            }
        }
        if (err) {
            this.#game.emit('message', 'error', err)
        } else {
            this.#game.emit('unit', 'orders', this);
        }
        return dst;
    }
    delOrder() {
        if (this.orders.length) {
            this.#game.emit('unit', 'orders', this);
            this.orders.pop();
        }
    }
    setOrders(dirs: DirectionKey[]) {
        this.orders = dirs;
        this.#game.emit('unit', 'orders', this);
    }
    resetOrders() {
        this.orders = [];
        this.tick = 255;
        this.#game.emit('unit', 'orders', this);
    }
    moveCost(dir: DirectionKey): number {
        if (!this.canMove) return 255;
        let dst = this.#game.mapboard.neighborOf(GridPoint.get(this), dir);
        if (!dst) return 255;
        return moveCost(dst.terrain, this.kind, this.#game.weather);
    }
    scheduleOrder(reset = false) {
        if (reset || !this.tick) this.tick = 0;
        if (this.orders.length) this.tick += this.moveCost(this.orders[0]);
        else this.tick = 255;
    }
    bestPath(goal: Point): Path {
        //TODO config directPath for comparison
        return this.#game.mapboard.bestPath(this, goal, moveCosts(this.kind, this.#game.weather));
    }
    reach(range: number = 32) {
        return this.#game.mapboard.reach(this, range, moveCosts(this.kind, this.#game.weather));
    }
    moveTo(dst: MapPoint|null) {
        let action = 'move';

        if (this.location.unitid) {
            this.location.unitid = undefined;  // leave the current location
        } else {
            action = 'enter';
        }
        if (dst != null) {
            // occupy the new one and repaint
            dst.put(this);
            dst.unitid = this.id;
            this.#game.mapboard.occupy(dst, this.player);
        } else {
            action = 'exit';
        }
        this.#game.emit('unit', action, this);
    }
    tryOrder() {
        if (this.tick == null) throw new Error('Unit:tryOrder tick not set');

        let src = this.location,
            dst = this.#game.mapboard.neighborOf(src, this.orders[0]);  // assumes already validated

        if (dst == null) throw new Error("Unit.tryOrder: invalid order");

        if (dst.unitid != null) {
            let opp = this.#game.oob.at(dst.unitid);
            if (opp.player != this.player) {
                if (!this.#resolveCombat(opp)) {
                    this.tick++;
                    return;
                }
                // otherwise fall through to advance after combat, ignoring ZoC
            } else {
                // traffic jam
                this.tick += 2;
                return;
            }
        } else if (this.#game.oob.zocBlocked(this.player, src, dst)) {
            // moving between enemy ZOC M.ASM:5740
            this.tick += 2;
            return;
        }

        this.orders.shift();
        this.moveTo(dst);
        this.scheduleOrder();
    }
    #resolveCombat(opp: Unit) {
        // return 1 if target square is vacant
        if (!this.canAttack) return 0;

        this.#game.emit('unit', 'attack', this);
        this.#game.emit('unit', 'defend', opp);

        let modifier = terraintypes[this.#game.mapboard.locationOf(opp).terrain].defence;
        if (opp.orders.length) modifier--;  // movement penalty

        // opponent attacks
        let str = modifyStrength(opp.cstrng, modifier);
        // note APX doesn't skip attacker if break, but cart does
        if (str >= this.#game.rand.byte()) {
            this.#takeDamage(1, 5, true);
            if (!this.orders) return 0;
        }
        let t = this.#game.mapboard.locationOf(opp).terrain;
        modifier = terraintypes[t].offence;
        str = modifyStrength(this.cstrng, modifier);
        if (str >= this.#game.rand.byte()) {
            return opp.#takeDamage(1, 5, true, this.orders[0]);
        } else {
            return 0;
        }
    }
    #takeDamage(mdmg: number, cdmg: number, checkBreak = false, retreatDir?: DirectionKey) {
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
        this.#game.emit('unit', 'damage', this);

        if (!checkBreak) return 0;

        // russian (& ger allies) break if cstrng <= 7/8 mstrng
        // german regulars break if cstrng < 1/2 mstrng
        let brkpt = this.mstrng - (this.mstrng >> (this.resolute ? 1: 3));
        if (this.cstrng < brkpt) {
            this.resetOrders();

            if (retreatDir != null) {
                const homedir = players[this.player].homedir,
                    nxtdir = this.#game.rand.bit() ? DirectionKey.north : DirectionKey.south,
                    dirs = [retreatDir, homedir,  nxtdir, (nxtdir + 2) % 4, (homedir + 2) % 4];

                for (let dir of dirs) {
                    let src = this.location,
                        dst = this.#game.mapboard.neighborOf(src, dir);
                    if (!dst || dst.unitid != null || this.#game.oob.zocBlocked(this.player, src, dst)) {
                        if (this.#takeDamage(0, 5)) return 1;  // dead
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
    recover() {
        // M.ASM:5070  recover combat strength
        if (this.mstrng - this.cstrng >= 2) this.cstrng += 1 + this.#game.rand.bit();
    }
    traceSupply(): Flag {
        // implement the supply check from C.ASM:3430, returns 1 if supplied, 0 if not
        const player = players[this.player],
            supply = player.supply;
        let fail = 0,
            loc = this.location,
            dir = player.homedir;

        if (supply.freeze && this.#game.weather == WeatherKey.snow) {
            // C.ASM:3620
            if (this.#game.rand.byte() >= 74 + 4*(this.#game.mapboard.boundaryDistance(loc, dir) + (dir == DirectionKey.east ? 1 : 0))) {
                return 0;
            }
        }
        while(fail < supply.maxfail[this.#game.weather]) {
            let dst = this.#game.mapboard.locationOf(loc.next(dir)),
                cost = 0;

            if (this.#game.mapboard.boundaryDistance(this, player.homedir) < 0) {
                return 1;
            } else if (dst == null || (
                    dst.terrain == TerrainKey.impassable && (supply.sea == 0 || dst.alt == 1))) {
                cost = 1;
            } else if (this.#game.oob.zocAffecting(this.player, dst) >= 2) {
                cost = 2;
            } else {
                loc = dst;
            }
            if (cost) {
                fail += cost;
                // either flip a coin or try the opposite direction (potentially repeatedly until failure)
                if (dir != player.homedir) dir = (dir + 2) % 4;
                else dir = this.#game.rand.bit() ? DirectionKey.north : DirectionKey.south;
            } else {
                dir = player.homedir;
            }
        }
        return 0;
    }
    score() {
        let v = 0,
            dist = this.#game.mapboard.boundaryDistance(this, players[this.player].homedir);
        // see M.ASM:4050 - note even inactive units are scored based on future arrival/strength
        if (this.player == PlayerKey.German) {
            // maxlon + 2 == #$30 per M.ASM:4110
            v = (dist + 3) * (this.mstrng >> 1);
        } else {
            v = dist * (this.cstrng >> 3);
        }
        return v >> 8;
    }
    describe(debug: boolean) {
        let s = `[${this.id}] ${this.mstrng} / ${this.cstrng}\n`;
        s += `${this.label}\n`;
        if (this.orders) s += 'orders: ' + this.orders.map(d => directions[d].label).join('');

        if (debug && this.ifr !== undefined && this.ifrdir !== undefined) {
            s += `ifr: ${this.ifr}; `;
            s += Object.entries(directions)
                .map(([i, d]) => `${d.label}: ${this.ifrdir![+i]}`).join(' ') + '\n';
            s += this.objective
                ? `obj: lon ${this.objective.lon} lat ${this.objective.lat}\n`
                : 'no objective\n'
        }
        return s;
    }
}


function modifyStrength(strength: number, modifier: number): number {
    if (modifier > 0) {
        while (modifier-- > 0) strength = Math.min(strength << 1, 255);
    } else {
        while (modifier++ < 0) strength = Math.max(strength >> 1, 1);
    }
    return strength;
}

export {Unit};
