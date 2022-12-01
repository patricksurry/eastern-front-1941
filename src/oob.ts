import {zigzag, zagzig} from './codec';
import {scenarios} from './scenarios';
import {Unit} from './unit';
import {oobVariants} from './oob-data';
import {sum, PlayerKey} from './defs';
import {Game} from './game';

import {type MapPoint, GridPoint} from './map';

type UnitPredicate = (u: Unit, index: number) => boolean;
type UnitMap = (u: Unit, index: number) => any;
type UnitForeach = (u: Unit, index: number) => void;

class Oob {
    #game;
    #units;

    constructor(game: Game, memento?: number[]) {
        this.#units = oobVariants[scenarios[game.scenario].oob].map((vs, i) => new Unit(game, i, ...vs));

        this.#game = game;

        if (memento) {
            let scheduled: Unit[] = this.filter(u => u.scheduled <= game.turn);
            if (memento.length < scheduled.length) 
                throw new Error('Oob: malformed save data for scheduled unit status');
            scheduled.forEach(u => {
                    let status: number = memento.shift()!;
                    if (status == 1) { // eliminated
                        //TODO via unit function to match with unit elimination code
                        u.mstrng = 0;
                        u.cstrng = 0;
                        u.arrive = 255;
                    } else if (status == 2) { // delayed
                        u.arrive = game.turn + 1;
                    }
                });
            let active = this.activeUnits(),
                human = active.filter(u => u.human);

            if (memento.length < 4*active.length + human.length)
                throw new Error('oob: malformed save data for active unit properties');
            
            let lats = zagzig(memento.splice(0, active.length)),
                lons = zagzig(memento.splice(0, active.length)),
                mstrs = zagzig(memento.splice(0, active.length)),
                cdmgs = memento.splice(0, active.length),
                nords = memento.splice(0, human.length),
                lat = 0, lon = 0, mstr = 255;
            active.forEach(u => {
                lat += lats.shift()!;
                lon += lons.shift()!;
                mstr += mstrs.shift()!;
                [u.lat, u.lon, u.mstrng] = [lat, lon, mstr];
                u.cstrng = u.mstrng - cdmgs.shift()!;
            });
            if (memento.length < sum(nords))
                throw new Error('oob: malformed save data for unit orders');
            human.forEach(u => {
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
    map(f: UnitMap) { return this.#units.map(f); }
    slice(start?: number, end?: number) { return this.#units.slice(start, end)}

    get memento() {
        let lats: number[] = [], 
            lons: number[] = [], 
            mstrs: number[] = [], 
            cdmgs: number[] = [], 
            nords: number[] = [], 
            ords: number[] = [],
            lat = 0, lon = 0, mstr = 255;

        // for scheduled units, status = 0 (active), 1 (dead), 2 (delayed)
        let scheduled = this.filter(u => u.scheduled <= this.#game.turn),
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
                ords = ords.concat(u.orders);
            }
        });

        return (status as number[]).concat(zigzag(lats), zigzag(lons), zigzag(mstrs), cdmgs, nords, ords);
    }
    newTurn(initialize: boolean) {
        if (initialize) {
            this.activeUnits().forEach(u => u.moveTo(u.location));
        } else {
            this.regroup();
            // TODO trace supply, with CSTR >> 1 if not, russian MSTR+2 (for apx)
            this.reinforce();
        }
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
        // could be interesting to randomize, or support a 'pause' order to handle traffic
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
