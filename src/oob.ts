import {zigzag, zagzig} from './codec';
import {scenarios} from './scenarios';
import {Unit} from './unit';
import {oobVariants} from './oob-data';
import {sum, PlayerKey} from './defs';
import {Game} from './game';

import {type MapPoint, GridPoint} from './map';

type UnitPredicate = (u: Unit, index: number) => boolean;
type UnitMap<T> = (u: Unit, index: number) => T;
type UnitForeach = (u: Unit, index: number) => void;

class Oob {
    #game;
    #units;

    constructor(game: Game, memento?: number[]) {
        const scenario = scenarios[game.scenario],
            maxunit = scenario.nunit;
        this.#units = oobVariants[scenario.oob]
            .map((vs, i) => {
                const u = new Unit(game, i, ...vs);
                // exclude units not in the scenario, but leave them in array
                if (u.id >= maxunit[u.player]) u.eliminate();
                return u;
            });
        this.#game = game;

        if (memento) {
            const scheduled: Unit[] = this.filter(u => u.scheduled <= game.turn);
            if (memento.length < scheduled.length)
                throw new Error('Oob: malformed save data for scheduled unit status');
            scheduled.forEach(u => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const status: number = memento.shift()!;
                    if (status == 1) { // eliminated
                        u.eliminate()
                    } else if (status == 2) { // delayed
                        u.arrive = game.turn + 1;
                    }
                });
            const active = this.activeUnits(),
                human = active.filter(u => u.human),
                mvmode = scenarios[this.#game.scenario].mvmode;

            if (memento.length < 4*active.length + human.length +(mvmode ? human.length : 0))
                throw new Error('oob: malformed save data for active unit properties');

            const lats = zagzig(memento.splice(0, active.length)),
                lons = zagzig(memento.splice(0, active.length)),
                mstrs = zagzig(memento.splice(0, active.length)),
                cdmgs = memento.splice(0, active.length),
                modes = mvmode ? memento.splice(0, human.length): [],
                nords = memento.splice(0, human.length);
            let lat = 0, lon = 0, mstr = 255;
            active.forEach(u => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                lat += lats.shift()!;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                lon += lons.shift()!;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                mstr += mstrs.shift()!;
                [u.lat, u.lon, u.mstrng] = [lat, lon, mstr];
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                u.cstrng = u.mstrng - cdmgs.shift()!;
            });
            if (memento.length < sum(nords))
                throw new Error('oob: malformed save data for unit orders');
            human.forEach(u => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                if (mvmode) u.mode = modes.shift()!;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                u.orders = memento.splice(0, nords.shift()!);
            });
        }
    }
    at(index: number): Unit {
        const u = this.#units.at(index);
        if (!u) throw new Error(`Oob.at(${index}): Invalid unit index`);
        return u;
    }
    every(f: UnitPredicate) { return this.#units.every(f) }
    some(f: UnitPredicate) { return this.#units.some(f) }
    filter(f: UnitPredicate) { return this.#units.filter(f) }
    find(f: UnitPredicate) { return this.#units.find(f) }
    findIndex(f: UnitPredicate) { return this.#units.findIndex(f) }
    forEach(f: UnitForeach) { this.#units.forEach(f); }
    map<T>(f: UnitMap<T>) { return this.#units.map(f); }
    slice(start?: number, end?: number) { return this.#units.slice(start, end)}

    get memento() {
        const lats: number[] = [],
            lons: number[] = [],
            mstrs: number[] = [],
            cdmgs: number[] = [],
            modes: number[] = [],
            nords: number[] = [],
            ords: number[] = [];
        let lat = 0, lon = 0, mstr = 255;

        // for scheduled units, status = 0 (active), 1 (dead), 2 (delayed)
        const scheduled = this.filter(u => u.scheduled <= this.#game.turn),
            status = scheduled.map(u => u.active ? 0: (u.cstrng == 0 ? 1: 2)),
            active = scheduled.filter(u => u.active);

        active.forEach(u => {
            lats.push(u.lat - lat);
            lons.push(u.lon - lon);
            mstrs.push(u.mstrng - mstr);
            [lat, lon, mstr] = [u.lat, u.lon, u.mstrng];

            cdmgs.push(u.mstrng - u.cstrng);
            if (u.human) {
                nords.push(u.orders.length);
                ords.push(...u.orders);
                if (scenarios[this.#game.scenario].mvmode) modes.push(u.mode);
            }
        });

        return (status as number[]).concat(zigzag(lats), zigzag(lons), zigzag(mstrs), cdmgs, modes, nords, ords);
    }
    newTurn(initialize: boolean) {
        if (initialize) {
            this.activeUnits().forEach(u => u.moveTo(u.location));
        } else {
            this.regroup();
            //TODO trace supply, with CSTR >> 1 if not, russian MSTR+2 (for apx)
            this.reinforce();
        }
        this.activeUnits().forEach(u => u.flags = 0);
    }
    activeUnits(player?: number): Unit[] {
        return this.filter((u: Unit) => u.active && (player == null || u.player == player));
    }
    scheduleOrders() {
        // M.asm:4950 movement execution
        this.forEach(u => u.scheduleOrder(true));
    }
    executeOrders(tick: number) {
        // original code processes movement in reverse-oob order
        // could be interesting to randomize, or allow a delay/no-op order to handle traffic
        this.filter(u => u.tick == tick).reverse().forEach(u => u.tryOrder());
    }
    regroup() {
        // regroup, recover...
        this.activeUnits().forEach(u => u.recover());
    }
    reinforce() {
        // M.ASM:3720  delay reinforcements scheduled for an occuplied square
        this.filter(u => u.arrive == this.#game.turn)
            .forEach(u => {
                const loc = u.location;
                if (loc.unitid != null) {
                    u.arrive++;
                } else {
                    u.moveTo(loc);   // reveal unit and link to the map square
                }
            });
    }
    zocAffecting(player: PlayerKey, loc: MapPoint) {
        // evaluate zoc experienced by player (eg. exerted by !player) in square at loc
        let zoc = 0;
        // same player in target square negates zoc, enemy exerts 4
        if (loc.unitid != null) {
            if (this.at(loc.unitid).player == player) return zoc;
            zoc += 4;
        }
        GridPoint.squareSpiral(loc, 3).slice(1).forEach((p, i) => {
            if (!this.#game.mapboard.valid(p)) return;
            const pt = this.#game.mapboard.locationOf(p);
            // even steps in the spiral exert 2, odd steps exert 1
            if (pt.unitid != null && this.at(pt.unitid).player != player) zoc += (i % 2) ? 1: 2;
        });
        return zoc;
    }
    zocBlocked(player: PlayerKey, src: MapPoint, dst: MapPoint): boolean {
        // does enemy ZoC block player move from src to dst?
        return this.zocAffecting(player, src) >= 2 && this.zocAffecting(player, dst) >= 2;
    }
}

export {Oob};
