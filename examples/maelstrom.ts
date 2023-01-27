import {Game, Grid, ScenarioKey, scenarios} from '../dist/ef1941';

Object.keys(scenarios).forEach(v => {
    const k = +v as ScenarioKey,
        scenario = scenarios[k],
        g = new Game(k),
        moscow = Grid.point(g.mapboard.cities[0]);

    let lastturn = -1;
    console.log('Playing scenario', scenario.label);
    while (g.turn != lastturn) {
        lastturn = g.turn;
        // console.log('Playing turn', g.turn)
        g.oob.activeUnits().forEach(u => {
            if (u.movable && u.orders.length == 0) {
//                const {orders} = g.mapboard.bestPath(Grid.point(u), moscow, u.moveCosts(g.weather));
                const {orders} = g.mapboard.directPath(u.location, moscow);
                u.setOrders(orders);
            }
        });
        g.resolveTurn();
    }
    console.log('done')
});