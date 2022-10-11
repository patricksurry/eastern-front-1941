import {zigzag, zagzig} from './fibcodec.js';
import {variants, scenarios} from './defs.js';
import {Unit} from './unit.js';
import {oobVariants} from './unit-data.js';


class Oob {
    #game;
    #units;

    constructor(game, memento) {
        const v = variants[game.variant].key + scenarios[game.scenario].key;

        this.#units = oobVariants[v].map((vs, i) => new Unit(game, i, ...vs));

        this.#game = game;
        // offer read-only array convenience functions
        [
            'at', 'every', 'filter', 'find', 'findIndex', 'findLast', 'findLastIndex',
            'forEach', 'map', 'reduce', 'reduceRight', 'slice', 'some'
        ].forEach(k => {this[k] = (...args) => this.#units[k](...args)});

        if (memento) {
            this.filter(u => u.scheduled <= game.turn)
                .forEach(u => {
                    let status = memento.shift();
                    if (status == 1) { // eliminated
                        //TODO function
                        u.mstrng = 0;
                        u.cstrng = 0;
                        u.arrive = 255;
                    } else if (status == 2) { // delayed
                        u.arrive = game.turn + 1;
                    }
                });
            let active = this.activeUnits(),
                human = active.filter(u => u.human),
                lats = zagzig(memento.splice(0, active.length)),
                lons = zagzig(memento.splice(0, active.length)),
                mstrs = zagzig(memento.splice(0, active.length)),
                cdmgs = memento.splice(0, active.length),
                nords = memento.splice(0, human.length),
                lat = 0, lon = 0, mstr = 255;
            active.forEach(u => {
                u.lat = lat + lats.shift();
                u.lon = lon + lons.shift();
                u.mstrng = mstr + mstrs.shift();
                [lat, lon, mstr] = [u.lat, u.lon, u.mstrng];
                u.cstrng = u.mstrng - cdmgs.shift();
            });
            human.forEach(u => {
                u.orders = memento.splice(0, nords.shift());
            });
        }
    }
    nextTurn(initialSetup) {
        if (initialSetup) {
            this.activeUnits().forEach(u => u.moveTo(u.location));
        } else {
            this.regroup();
            // TODO trace supply, with CSTR >> 1 if not, russian MSTR+2 (for apx)
            this.reinforce();
        }
    }
    get memento() {
        let lats = [], lons = [], mstrs = [], cdmgs = [], nords = [], ords = [],
            lat = 0, lon = 0, mstr = 255,
            active = this.activeUnits();

        // for scheduled active units, status = 0 (active), 1 (dead), 2 (delayed)
        let status = this.filter(u => u.scheduled <= this.#game.turn)
            .map(u => u.active ? 0: (u.arrive <= this.#game.turn ? 1: 2));

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

        return status.concat(zigzag(lats), zigzag(lons), zigzag(mstrs), cdmgs, nords, ords);
    }
    activeUnits(player) {
        return this.filter(u => u.active && (player == null || u.player == player));
    }
    scheduleOrders() {
        // M.asm:4950 movement execution
        this.forEach(u => u.scheduleOrder(true));
    }
    executeOrders(tick) {
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
    zocAffecting(player, loc) {
        // evaluate zoc experienced by player (eg. exerted by !player) in square at loc
        let zoc = 0;
        // same player in target square exerts 4, enemy negates zoc
        if (loc.unitid != null) {
            if (this.at(loc.unitid).player == player) return zoc;
            zoc += 4;
        }
        this.#game.mapboard.squareSpiral(loc, 3).slice(1).forEach((d, i) => {
            // even steps in the spiral exert 2, odd steps exert 1
            if (d.unitid != null && this.at(d.unitid).player != player) zoc += (i % 2) ? 1: 2;
        });
        return zoc;
    }
    zocBlocked(player, src, dst) {
        // does enemy ZoC block player move from src to dst?
        return this.zocAffecting(player, src) >= 2 && this.zocAffecting(player, dst) >= 2;
    }
}

export {Oob};
