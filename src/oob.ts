import {zigzag, zagzig} from './codec';
import {scenarios} from './scenarios';
import {Unit} from './unit';
import {oobVariants} from './oob-data';
import {sum, PlayerKey} from './defs';
import {Game} from './game';
import {Grid} from './grid';
import {type MapPoint} from './map';

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
                u.fog = scenario.fog ?? 0;
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
                expected = 4*active.length + human.length + (scenario.mvmode ? human.length : 0) + (scenario.fog ? human.length : 0);

            if (memento.length < expected)
                throw new Error('oob: malformed save data for active unit properties');

            const lats = zagzig(memento.splice(0, active.length)),
                lons = zagzig(memento.splice(0, active.length)),
                mstrs = zagzig(memento.splice(0, active.length)),
                cdmgs = memento.splice(0, active.length),
                modes = scenario.mvmode ? memento.splice(0, human.length): [],
                dfogs = scenario.fog ? memento.splice(0, human.length): [],
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
                if (scenario.mvmode) u.mode = modes.shift()!;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                if (scenario.fog) u.fog -= dfogs.shift()!;
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
        const scenario = scenarios[this.#game.scenario],
            lats: number[] = [],
            lons: number[] = [],
            mstrs: number[] = [],
            cdmgs: number[] = [],
            modes: number[] = [],
            dfogs: number[] = [],
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
                if (scenario.mvmode) modes.push(u.mode);
                if (scenario.fog) dfogs.push(scenario.fog - u.fog);
            }
        });

        return (status as number[]).concat(zigzag(lats), zigzag(lons), zigzag(mstrs), cdmgs, modes, dfogs, nords, ords);
    }
    newTurn(initialize: boolean) {
        if (initialize) {
            this.activeUnits().forEach(u => u.moveTo(u.location));
        } else {
            this.supply();
            this.regroup();
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
    supply() {
        const scenario = scenarios[this.#game.scenario];
        if (scenario.skipsupply) return;
        this.activeUnits().forEach(u => {
            const inSupply = u.traceSupply();
            if (scenario.repl && inSupply) u.replace(scenario.repl[u.player])
        })
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
    zocAffecting(player: PlayerKey, loc: MapPoint, omitSelf = false) {
        // evaluate zoc experienced by player (eg. exerted by !player) in the square at loc
        let zoc = 0;
        // same player in target square negates any zoc, enemy exerts 4
        if (loc.unitid != null) {
            if (this.at(loc.unitid).player == player) {
                if (!omitSelf) return 0;
            } else {
                zoc += 4;
            }
        }
        // look at square spiral excluding center, so even squares are adj, odd are corners
        Grid.squareSpiral(loc, 1).slice(1).forEach((p, i) => {
            if (!this.#game.mapboard.valid(p)) return;
            const pt = this.#game.mapboard.locationOf(p);
            // center-adjacent (even) exert 2, corners (odd) exert 1
            if (pt.unitid != null && this.at(pt.unitid).player != player) {
                zoc += (i % 2) ? 1: 2;
            }
        });
        return zoc;
    }
    zocBlocked(player: PlayerKey, src: MapPoint, dst: MapPoint): boolean {
        // does enemy ZoC block player move from src to dst?
        return this.zocAffecting(player, src, true) >= 2 && this.zocAffecting(player, dst) >= 2;
    }
}

export {Oob};
