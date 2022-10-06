import {zigzag, zagzig} from './vlq64.js';
import {variants, scenarios} from './defs.js';
import {Unit} from './unit.js';
import {oobVariants} from './unit-data.js';

function Oob(game, memento) {
    let oob = oobVariants[variants[game.variant].key + scenarios[game.scenario].key]
        .map(vs => Unit(game, ...vs)),
        o = Object.assign(
            oob,
            {
                game: game,
                m: game.mapboard,
                memento: Oob.memento,
                activeUnits: Oob.activeUnits,
                scheduleOrders: Oob.scheduleOrders,
                executeOrders: Oob.executeOrders,
                regroup: Oob.regroup,
                reinforce: Oob.reinforce,
                zocAffecting: Oob.zocAffecting,
                zocBlocked: Oob.zocBlocked,
            }
        );

    if (memento) {
        o.filter(u => u.scheduled <= game.turn)
            .forEach(u => {
                let status = memento.shift();
                if (status == 1) {
                    //TODO function
                    u.mstrng = 0;
                    u.cstrng = 0;
                    u.arrive = 255;
                } else if (status == 2) {
                    u.arrive = this.game.turn + 1;
                }
            });
        let active = o.activeUnits(),
            human = active.filter(u => u.player == game.human),
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
    return o;
}
Oob.memento = function() {
    let lats = [], lons = [], mstrs = [], cdmgs = [], nords = [], ords = [],
        lat = 0, lon = 0, mstr = 255,
        active = this.activeUnits();

    // for scheduled active units, status = 0 (active), 1 (dead), 2 (delayed)
    let status = this.filter(u => u.scheduled <= this.game.turn)
        .map(u => u.isActive() ? 0: (u.arrive <= this.game.turn ? 1: 2));

    active.forEach(u => {
        lats.push(u.lat - lat);
        lons.push(u.lon - lon);
        mstrs.push(u.mstrng - mstr);
        [lat, lon, mstr] = [u.lat, u.lon, u.mstrng];

        cdmgs.push(u.mstrng - u.cstrng);
        if (u.player == this.game.human) {
            nords.push(u.orders.length);
            ords = ords.concat(u.orders);
        }
    });

    return status.concat(zigzag(lats), zigzag(lons), zigzag(mstrs), cdmgs, nords, ords);
}
Oob.activeUnits = function(player) {
    return this.filter(u => u.isActive() && (player == null || u.player == player));
}
Oob.scheduleOrders = function() {
    // M.asm:4950 movement execution
    this.forEach(u => u.scheduleOrder(true));
}
Oob.executeOrders = function(tick) {
    this.filter(u => u.tick == tick).reverse().forEach(u => u.tryOrder());
}
Oob.regroup = function() {
    // regroup, recover...
    this.activeUnits().forEach(u => u.recover());
}
Oob.reinforce = function() {
    // M.ASM:3720  delay reinforcements scheduled for an occuplied square
    this.filter(u => u.arrive == this.game.turn)
        .forEach(u => {
            const loc = this.m.locationOf(u);
            if (loc.unitid != null) {
                u.arrive++;
            } else {
                u.moveTo(loc);   // reveal unit and link to the map square
            }
        });
}
Oob.zocAffecting = function(player, loc) {
    // evaluate zoc experienced by player (eg. exerted by !player) in square at loc
    let zoc = 0;
    // same player in target square exerts 4, enemy negates zoc
    if (loc.unitid != null) {
        if (this[loc.unitid].player == player) return zoc;
        zoc += 4;
    }
    this.m.squareSpiral(loc, 3).slice(1).forEach((d, i) => {
        // even steps in the spiral exert 2, odd steps exert 1
        if (d.unitid != null && this[d.unitid].player != player) zoc += (i % 2) ? 1: 2;
    });
    return zoc;
}
Oob.zocBlocked = function(player, src, dst) {
    // does enemy ZoC block player move from src to dst?
    return this.zocAffecting(player, src) >= 2 && this.zocAffecting(player, dst) >= 2;
}

export {Oob};
