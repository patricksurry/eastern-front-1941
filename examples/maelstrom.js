/*
compile and run with:

was nearly 10s for all scenarios
after grid refactor 3s.
after memoize byid 2.4s
after memoize neighbors 2s
after switch to neighborsOf 1.8s

with directpath vs bestpath 0.85s

    npx tsc --target es2015 maelstrom.ts --moduleResolution node

    /usr/bin/time -l node --prof --logfile=perf.log --no-logfile-per-isolate --es-module-specifier-resolution=node maelstrom.js
    node --prof-process perf.log > perf.txt

    or as one-liner

    npx tsc --target es2015 maelstrom.ts --moduleResolution node && /usr/bin/time -l node --prof --logfile=perf.log --no-logfile-per-isolate --es-module-specifier-resolution=node maelstrom.js && node --prof-process perf.log > perf.txt

    See https://stackoverflow.com/questions/74660824/nodejs-v19-drops-support-for-es-module-specifier-resolution-node-which-makes-i
*/
import { Game, Grid, scenarios } from '../dist/ef1941';
Object.keys(scenarios).forEach(v => {
    const k = +v, scenario = scenarios[k], g = new Game(k), moscow = Grid.point(g.mapboard.cities[0]);
    let lastturn = -1;
    console.log('Playing scenario', scenario.label);
    while (g.turn != lastturn) {
        lastturn = g.turn;
        // console.log('Playing turn', g.turn)
        g.oob.activeUnits().forEach(u => {
            if (u.movable && u.orders.length == 0) {
                //                const {orders} = g.mapboard.bestPath(Grid.point(u), moscow, u.moveCosts(g.weather));
                const { orders } = g.mapboard.directPath(u.location, moscow);
                u.setOrders(orders);
            }
        });
        g.nextTurn();
        // integrity test
        g.mapboard.locations.forEach(row => row.filter(p => p.unitid).forEach(p => {
            if (!g.oob.at(p.unitid).active)
                throw new Error(`${g.mapboard.describe(p)} occupied by inactive unit`);
        }));
        g.oob.activeUnits().forEach(u => {
            const mp = u.location;
            if (mp.unitid != u.id)
                throw new Error(`${u.describe()} not found at ${g.mapboard.describe(mp)}`);
        });
    }
    console.log('done');
});
