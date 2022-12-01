import {players, unitkinds, terraintypes, weatherdata} from './defs';
import {Game} from './game';
import {Thinker} from './think';
import {MappedDisplayLayer, SpriteDisplayLayer, fontMap} from './antic';
import {renderScreen, type ScreenModel} from './screen';

/*
TODO
 - kill all logging inside game, just events
 - kill complex event properties/callbacks
 - map event on city ownership change
*/

const helpText = `
\x11${'\x12'.repeat(38)}\x05
|                                      |
|                                      |
|                                      |
|                                      |
|     Welcome to Chris Crawford's      |
|         Eastern Front  1941          |
|                                      |
|      Ported by Patrick Surry }       |
|                                      |
| Select: Click, [n]ext, [p]rev        |
| Orders: \x1f, \x1c, \x1d, \x1e, [Bksp]           |
| Cancel: [Space], [Esc]               |
| Submit: [End], [Fn \x1f]                |
| Toggle: [z]oom, e[x]tras, debu[g]    |
|                                      |
|         [?] shows this help          |
|                                      |
|        Press any key to play!        |
|                                      |
|                                      |
|                                      |
|                                      |
\x1a${'\x12'.repeat(38)}\x03
`.trim().split('\n')

//TODO via scenario
const apxmap = fontMap('static/fontmap-apx.png', 260);

var game = new Game();

function start() {
    const {width, height} = game.mapboard.size,
        topleft = game.mapboard.locations[0][0].point;
    var helpWindow = new MappedDisplayLayer(40, 24, apxmap, {foregroundColor: 0x04, layerColor: 0x0E}),
        dateWindow = new MappedDisplayLayer(20, 2, apxmap, {foregroundColor: 0x6A, layerColor: 0xB0}),
        infoWindow = new MappedDisplayLayer(40, 2, apxmap, {foregroundColor: 0x28, layerColor: 0x22}),
        errorWindow = new MappedDisplayLayer(40, 1, apxmap, {foregroundColor: 0x22, layerColor: 0x3A}),
        mapLayer = new MappedDisplayLayer(width, height, apxmap),
        labelLayer = new SpriteDisplayLayer(width, height, apxmap, {foregroundColor: undefined}),
        unitLayer = new SpriteDisplayLayer(width, height, apxmap);

    const model: ScreenModel = {
        helpWindow,
        dateWindow,
        infoWindow,
        errorWindow,
        mapLayer,
        labelLayer,
        unitLayer,
        clickHandler: play
    }

    helpWindow.putlines(helpText);
    helpText.forEach((s, y) => s.split('').forEach((c, x) => {
        if (c == '}') helpWindow.puts(c, {x, y, foregroundColor: 0x94})
        // TODO via decorator or glyphopts?  .on('click', () => window.open(helpUrl))
    }));

    game.mapboard.cities.forEach((c, i) => {
        labelLayer.put(i.toString(), 32, topleft.lon - c.lon, topleft.lat - c.lat, {props: {label: c.label}})
    });

    dateWindow.puts(' EASTERN FRONT 1941 ', {y: 1});
    infoWindow.puts('PLEASE ENTER YOUR ORDERS NOW', {x: 6});
    let ai = Object.keys(players)
        .filter(player => +player != game.human)
        .map(player => new Thinker(game, +player));

    console.log(`set up ${ai.length} AIs`);

    function repaint() {
        const {earth, contrast} = weatherdata[game.weather];

        labelLayer.setcolors({foregroundColor: contrast});

        mapLayer.setcolors({layerColor: earth});

        game.mapboard.locations.forEach(row =>
            row.forEach(loc => {
                const t = terraintypes[loc.terrain],
                    city = loc.cityid != null ? game.mapboard.cities[loc.cityid] : null,
                    color = city ? players[city?.owner].color : (loc.alt ? t.altcolor : t.color);
                mapLayer.putc(loc.icon, {foregroundColor: color});
            })
        );

        game.oob.activeUnits().forEach(u => {
            let p = u.point,
                opts = {
                    backgroundColor: earth,
                    foregroundColor: players[u.player].color,
                    props: {cstrng: u.cstrng, mstrng: u.mstrng, orders: u.orders},
                };

            unitLayer.put(
                u.id.toString(),
                unitkinds[u.kind].icon,
                topleft.lon - p.lon, topleft.lat - p.lat,
                opts,
            )
        });

        renderScreen(model);
    }


    function play() {
        console.log('repaint & start thinking...');
        repaint();
        ai.forEach(t => t.thinkRecurring(250));

        setTimeout(() => {
            console.log('stop thinking and nextTurn ticktock');
            ai.forEach(t => t.finalize());
            game.nextTurn(100);
        }, 32*100 + 500);
    }

    game.on('game', (action) => {
//        console.log('game event', action);
        if (action == 'turn') play();
        else repaint();
    });

    game.start();       // TODO

    renderScreen(model);
}

export {start};