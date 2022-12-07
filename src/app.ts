import {players, unitkinds, terraintypes, weatherdata, DirectionKey} from './defs';
import {ScenarioKey, scenarios} from './scenarios';
import {Game} from './game';
import {Unit} from './unit';
import {Thinker} from './think';
import type {SpriteOpts} from './anticmodel';
import {MappedDisplayLayer, SpriteDisplayLayer, GlyphAnimation, fontMap} from './anticmodel';
import type {FlagModel, HelpScreenModel, ScreenModel} from './appview';
import {Layout} from './appview';
import {GridPoint} from './map';
import m from 'mithril';

/*
TODO

- debug flag
- change reach mask so it has transparent bkgrnd and uses new BlockGlyph to put
mask elements outside reach

 - kill all logging inside game, just events
 - kill complex event properties/callbacks, switch to enumerated event type
 - trigger and catch a map event on city ownership change for repaint

     setZoom(zoomed: boolean, u: Unit | null) {
        var elt;
        if (u != null) {
            elt = d3.select('#kreuze').node();
        } else {
            let x = 320/2,
                y = 144/2 + (d3.select('#map-window').node() as HTMLElement).offsetTop - window.scrollY;
            elt = document.elementFromPoint(x*4, y*4);
        }
        // toggle zoom level, apply it, and re-center target eleemnt
        d3.select('#map-window .container').classed('doubled', zoomed);
        (elt as HTMLElement)!.scrollIntoView({block: "center", inline: "center"})
    }

    function animateUnitPath(u: Unit | null) {
...
*/

const enum UIModeKey {setup, orders, resolve};

const resume = window.location.hash.slice(1) || undefined;

var game = new Game(resume),
    uimode = resume ? UIModeKey.orders: UIModeKey.setup,
    flags: FlagModel = {
        help: resume ? false: true,
        extras: true,                      // whether to show extras
        debug: false,                      // whether to show debug info
        zoom: false,                       // zoom 2x or not?
    },
    ai = Object.keys(players)
        .filter(player => +player != game.human)
        .map(player => new Thinker(game, +player));

const helpUrl = 'https://github.com/patricksurry/eastern-front-1941',
    helpText = `
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
`.trim().split('\n'),
    helpScrambleMillis = 2000,
    helpScramble = helpText.map(line => line.split('').map(() => Math.random())),
    t0 = +new Date();

const atasciiFont = fontMap('static/fontmap-atascii.png', 128);

const hscr: HelpScreenModel = {
    window: new MappedDisplayLayer(40, 24, atasciiFont, {foregroundColor: 0x04, layerColor: 0x0E}),
}

const scr: ScreenModel = {
    dateWindow: new MappedDisplayLayer(20, 2, atasciiFont, {foregroundColor: 0x6A, layerColor: 0xB0}),
    infoWindow: new MappedDisplayLayer(40, 2, atasciiFont, {foregroundColor: 0x28, layerColor: 0x22}),
    errorWindow: new MappedDisplayLayer(40, 1, atasciiFont, {foregroundColor: 0x22, layerColor: 0x3A}),

    mapLayer: new MappedDisplayLayer(0, 0, atasciiFont),
    labelLayer: new SpriteDisplayLayer(0, 0, atasciiFont),
    unitLayer: new SpriteDisplayLayer(0, 0, atasciiFont),
    maskLayer: new MappedDisplayLayer(0, 0, atasciiFont),
}

function paintHelp(h: HelpScreenModel) {
    const t = +new Date();
    h.window.setpos(0, 0);
    helpText.forEach((line, y) => line.split('').forEach((c, x) => {
        if ((t - t0)/helpScrambleMillis < helpScramble[y][x]) {
            h.window.putc(Math.floor(Math.random()*128), {
                foregroundColor: Math.floor(Math.random()*128),
                backgroundColor: Math.floor(Math.random()*128),
            })
        } else if (c == '}') {
            h.window.puts(c, {
                foregroundColor: 0x94,
                onclick: () => window.open(helpUrl)
            });
        } else {
            h.window.puts(c, {
                onclick: () => flags.help = !flags.help
            })
        }
    }));
}

function setMap() {
    const
        m = game.mapboard,
        font = fontMap(`static/fontmap-custom-${m.font}.png`, 128 + 6),
        {width, height} = m.extent,
        {lon: left, lat: top} = game.mapboard.locations[0][0].point;

    scr.mapLayer = new MappedDisplayLayer(width, height, font);
    scr.labelLayer = new SpriteDisplayLayer(width, height, font, {foregroundColor: undefined});
    scr.unitLayer = new SpriteDisplayLayer(width, height, font);
    scr.maskLayer = new MappedDisplayLayer(width, height, font, {backgroundColor: 0x00});

    //TOOD repaint city if change ownership, with color animation
    m.locations.forEach(row =>
        row.forEach(loc => {
            const t = terraintypes[loc.terrain],
                city = loc.cityid != null ? game.mapboard.cities[loc.cityid] : null,
                color = city ? players[city?.owner].color : (loc.alt ? t.altcolor : t.color);

            scr.mapLayer.putc(loc.icon, {
                foregroundColor: color,
                onclick: () => {
                    focus.off();
                    if (city) scr.infoWindow.puts(city.label.toUpperCase(), {justify: 'center'})
                },
                onmouseover: (e) => {
                    (e.currentTarget as HTMLElement).title = loc.describe();
                },
            });
        })
    );

    m.cities.forEach((c, i) => {
        scr.labelLayer.put(
            i.toString(), 32, left - c.lon, top - c.lat, {
                props: {label: c.label}
            }
        )
    });
}

function paintMap() {
    const {earth, contrast} = weatherdata[game.weather];

    scr.labelLayer.setcolors({foregroundColor: contrast});
    scr.mapLayer.setcolors({layerColor: earth});
    game.oob.forEach(u => paintUnit(u));
}

function paintUnit(u: Unit, focussed = false) {
    const
        {earth} = weatherdata[game.weather],
        {lon: left, lat: top} = game.mapboard.locations[0][0].point;

    let p = u.point,
        opts: SpriteOpts = {
            backgroundColor: earth,
            foregroundColor: players[u.player].color,
            opacity: u.active ? 1: 0,
            animate: focussed ? GlyphAnimation.blink: undefined,
            onclick: () => {
                if (focus.u()?.id != u.id) focus.on(u)
                else focus.off();
            },
            onmouseover: (e) => {
                (e.currentTarget as HTMLElement).title = u.location.describe();
            },
            props: {
                cstrng: u.cstrng,
                mstrng: u.mstrng,
                orders: u.orders,
            },
        };

    scr.unitLayer.put(
        u.id.toString(),
        unitkinds[u.kind].icon,
        left - p.lon, top - p.lat,
        opts,
    )
}

function paintReach(u?: Unit) {
    if (!u) {
        scr.maskLayer.cls();  // remove all mask glyphs
        return;
    }
    const {lon: left, lat: top} = game.mapboard.locations[0][0].point,
        reachmap = u.reach();

    scr.maskLayer.cls(0);  // mask everything, then clear reach squares
    Object.keys(reachmap).forEach(v => {
        const {lon, lat} = GridPoint.fromid(+v);
        scr.maskLayer.putc(undefined, {x: left - lon, y: top - lat});
    })
}

function setScenario(scenario: ScenarioKey | null, inc?: number) {
/*
    orginal game shows errmsg "[SELECT]: LEARNER  [START] TO BEGIN" with copyright in txt window,
    where [] is reverse video.  could switch to "[< >]: LEARNER  [ENTER] TO BEGIN(RESUME)"
    so < > increments scenario, # picks directly
*/
    inc ??= 0;
    let n = Object.keys(scenarios).length;

    if (scenario == null) {
        scenario = (game.scenario + inc + n) % n;
    }

    // TODO setter
    game.scenario = scenario;

    let label = scenarios[scenario].label.padEnd(8, ' ');

    scr.errorWindow.puts(`[<] ${label} [>]  [ENTER] TO START`, {justify: 'center'})
}

var focus = {
    id: -1,         // most-recently focused unit
    active: false,  // focus currently active?

    u: () => focus.active ? game.oob.at(focus.id) : undefined,
    on: (u: Unit) => {
        focus.off();

        focus.id = u.id;
        focus.active = true;
        scr.infoWindow.putlines([
            u.label,
            `MUSTER: ${u.mstrng}  COMBAT: ${u.cstrng}`
        ], {x: 6});

        paintUnit(u, true);
        paintReach(u);
    },
    off: () => {
        const u = focus.u();
        if (u) {
            // clear blink and reach
            paintUnit(u, false);
            paintReach(undefined);
        }
        scr.infoWindow.cls();
        focus.active = false;
    },
    shift: (offset: number) => {
        const
            locid = (u: Unit) => game.mapboard.locationOf(u).id,
            humanUnits = game.oob.activeUnits(game.human).sort((a, b) => locid(b) - locid(a)),
            n = humanUnits.length;
        var i;
        if (focus.id >= 0) {
            i = humanUnits.findIndex(u => u.id == focus.id);
            if (i < 0) {
                // if last unit no longer active, find the nearest active unit
                let id = locid(game.oob.at(focus.id));
                while (++i < n && locid(humanUnits[i]) > id) {/**/}
            }
        } else {
            i = offset > 0 ? -1: 0;
        }
        i = (i + n + offset) % n;
        focus.on(humanUnits[i]);
    },
};


function editOrders(dir: DirectionKey | null | -1) {
    // dir => add step, -1 => remove step, null => clear or unfocus
    let u = focus.u();
    if (!u) return;
    if (!u.human) {
        scr.errorWindow.puts(
            `THAT IS A ${players[u.player].label.toUpperCase()} UNIT!`,
            {justify: 'center'}
        )
        return;
    }
    if (dir == null) {
        if (u.orders.length == 0) {
            focus.off();
            return;
        }
        u.resetOrders();
    } else if (dir == -1) {
        u.delOrder();
    } else {
        u.addOrder(dir);
    }
    paintUnit(u, true);
}

const keymap = {
    help:   '?/',
    prev:   '<,p',
    next:   '>.n',
    cancel: ['Escape', ' '],
    scenario:  '0123456789'.slice(0, Object.keys(scenarios).length),
    extras: 'xX',
    zoom:   'zZ',
    debug:  'gG',
},
arrowmap: Record<string, DirectionKey> = {
    ArrowUp: DirectionKey.north,
    ArrowDown: DirectionKey.south,
    ArrowRight: DirectionKey.east,
    ArrowLeft: DirectionKey.west,
};


function keyHandler(e: KeyboardEvent) {
    let handled = true;
    console.log('keyhandler', e.key)
    scr.errorWindow.cls();   // clear error

    if (flags.help || keymap.help.includes(e.key)) {
        flags.help = !flags.help;
    } else if (keymap.zoom.includes(e.key)) {
        flags.zoom = !flags.zoom;
    } else if (keymap.extras.includes(e.key)) {
        flags.extras = !flags.extras;
    } else if (keymap.debug.includes(e.key)) {
        flags.debug = !flags.debug;
    } else {
        const f = modes[uimode].keyHandler;
        if (f) handled = f(e.key);
    }
    if (handled) {
        m.redraw();
        e.preventDefault();     // eat event if handled
    }
}

interface UIMode {
    enter?: () => void,
    exit?: () => void,
    keyHandler: (key: string) => boolean,
}

function setMode(m: UIModeKey) {
    const exit = modes[uimode].exit,
        enter = modes[m].enter;
    if (exit) exit();
    uimode = m;
    if (enter) enter();
}

const modes: Record<UIModeKey, UIMode> = {
    [UIModeKey.setup]: {
        enter: () => {
            scr.infoWindow.putlines([
                'COPYRIGHT 1982 ATARI',
                'ALL RIGHTS RESERVED',
            ], {justify: 'center'})

            //TODO setScenario(ScenarioKey.beginner);
        },
        keyHandler: (key) =>  {
            if (keymap.prev.includes(key) || key == 'ArrowLeft') {
                setScenario(null, -1);
            } else if (keymap.next.includes(key) || key == 'ArrowRight') {
                setScenario(null, +1);
            } else if (keymap.scenario.includes(key)) {
                setScenario(parseInt(key));
            } else if (key == 'Enter') {
                setMode(UIModeKey.orders);
            } else {
                return false;
            }
            return true;
        },
    },
    [UIModeKey.orders]: {
        enter: () => {
            // save game state
            window.location.hash = game.token;
            // start thinking...
            ai.forEach(t => t.thinkRecurring(250));
        },
        keyHandler: (key) => {
            if (keymap.prev.includes(key)) {
                focus.shift(-1);
            } else if (keymap.next.includes(key) || key == 'Enter') {
                focus.shift(+1);
            } else if (key in arrowmap) {
                editOrders(arrowmap[key]);
            } else if (keymap.cancel.includes(key)) {
                editOrders(null);
            } else if (key == 'Backspace') {
                editOrders(-1);
            } else if (key == 'End') {
                setMode(UIModeKey.resolve);
            } else {
                return false;
            }
            return true;
        },
    },
    [UIModeKey.resolve]: {
        enter: () => {
            // finalize AI orders
            ai.forEach(t => t.finalize());

            focus.off();
            scr.errorWindow.puts('EXECUTING MOVE', {justify: 'center'});
            game.nextTurn(250);
        },
        keyHandler: (key) => {
            if (keymap.prev.includes(key)) {
                focus.shift(-1);
            } else if (keymap.next.includes(key) || key == 'Enter') {
                focus.shift(+1);
            } else {
                return false;
            }
            return true;
        }
    }
} as const;


function start() {
    const scramble = setInterval(() => {
        paintHelp(hscr);
        m.redraw();

        if (+new Date() > t0 + helpScrambleMillis) clearInterval(scramble);
    }, 150);

    setMap();
    paintMap();

    document.addEventListener('keydown', keyHandler);

    scr.dateWindow.puts('EASTERN FRONT 1941', {justify: 'center', y: 1});
    scr.infoWindow.puts('PLEASE ENTER YOUR ORDERS NOW', {x: 6});
    let ai = Object.keys(players)
        .filter(player => +player != game.human)
        .map(player => new Thinker(game, +player));

    console.log(`set up ${ai.length} AIs`);

    m.mount(document.body, {view: () => m(Layout, {scr, hscr, flags})});

    function play() {
        console.log('repaint & start thinking...');
        paintMap();
        ai.forEach(t => t.thinkRecurring(250));

        setTimeout(() => {
            console.log('stop thinking and nextTurn ticktock');
            ai.forEach(t => t.finalize());
            game.nextTurn(100);
        }, 32*100 + 2500);
    }
/*
    game.on('game', (action) => {
//        console.log('game event', action);
        if (action == 'turn') play();
        else repaint();
    });

    game.start();       // TODO

    renderScreen(gameModel);
*/
}

export {start};