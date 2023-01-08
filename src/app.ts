import {
    players, unitkinds, UnitKindKey,
    terraintypes, weatherdata,
    directions, DirectionKey,
} from './defs';
import {ScenarioKey, scenarios} from './scenarios';
import {Game} from './game';
import {Unit, unitFlag, UnitMode, unitModes} from './unit';
import {Thinker} from './think';
import type {SpriteOpts} from './anticmodel';
import {MappedDisplayLayer, SpriteDisplayLayer, GlyphAnimation, fontMap} from './anticmodel';
import type {FlagModel, HelpScreenModel, ScreenModel} from './appview';
import {Layout} from './appview';
import m from 'mithril';

interface MithrilEvent extends Event {redraw: boolean}

const enum UIModeKey {setup, orders, resolve}

const atasciiFont = fontMap('static/fontmap-atascii.png', 128),
    helpUrl = 'https://github.com/patricksurry/eastern-front-1941',
    helpScrambleMillis = 2000,
    helpText = (
        '\fh\x11' + '\x12'.repeat(38) + '\x05'
        + '|\fl|'.repeat(22)
        + '\x1a' + '\x12'.repeat(38) + '\x03'
        + `\fH\f^


Welcome to Chris Crawford's
Eastern Front  1941
Reversed by Patrick Surry \fc\x94}\fC

\f@\x04<
Select: \f#Click\f-, \f#n\f-ext, \f#p\f-rev

Orders: \f#\x1f\f- \f#\x1c\f- \f#\x1d\f- \f#\x1e\f-, \f#Bksp\f-

Cancel: \f#Space\f-, \f#Esc\f-

Submit: \f#End\f-, \f#Fn \x1f\f-

Toggle: \f#z\f-oom, e\f#x\f-tras, debu\f#g\f-

\f^
\f#?\f- shows this help
Press any key to play!`
    ),
    resume = window.location.hash.slice(1) || undefined,
    game = resume ? new Game(resume) : new Game().start(ScenarioKey.learner),
    flags: FlagModel = {
        help: resume ? false: true,
        extras: true,                      // whether to show extras
        debug: false,                      // whether to show debug info
        zoom: false,                       // zoom 2x or not?
    },
    // placeholder to allow AI v AI, human Russian or both human play
    ai = Object.keys(players)
        .filter(player => +player != game.human)
        .map(player => new Thinker(game, +player)),
    hscr: HelpScreenModel = {
        window: new MappedDisplayLayer(40, 24, atasciiFont, {foregroundColor: 0x04, layerColor: 0x0E}),
    },
    scr: ScreenModel = {
        dateWindow: new MappedDisplayLayer(20, 2, atasciiFont, {foregroundColor: 0x6A, layerColor: 0xB0}),
        infoWindow: new MappedDisplayLayer(40, 2, atasciiFont, {foregroundColor: 0x28, layerColor: 0x22}),
        errorWindow: new MappedDisplayLayer(40, 1, atasciiFont, {foregroundColor: 0x22, layerColor: 0x3A}),

        // placecholders until we load the map
        mapLayer: new MappedDisplayLayer(0, 0, atasciiFont),
        labelLayer: new SpriteDisplayLayer(0, 0, atasciiFont),
        unitLayer: new SpriteDisplayLayer(0, 0, atasciiFont),
        kreuzeLayer: new SpriteDisplayLayer(0, 0, atasciiFont),
        maskLayer: new MappedDisplayLayer(0, 0, atasciiFont),
    };

let uimode = resume ? UIModeKey.orders: UIModeKey.setup,
    helpInit = false;

function paintHelp(h: HelpScreenModel, p?: number, scramble?: number[][]) {
    if (!helpInit) {
        helpInit = true;
        const t0 = +new Date();

        p = 0;
        scramble = h.window.glyphs.map(row => row.map(() => Math.random()));

        const paintScrambled = setInterval(() => {
            const pp = (+new Date() - t0)/helpScrambleMillis;
            paintHelp(h, pp, scramble);
            m.redraw();
            if (pp >= 1) clearInterval(paintScrambled);
        }, 250);
    }

    h.window.cls();
    h.window.puts(helpText, {onclick: () => flags.help = !flags.help});
    h.window.glyphs.forEach(line => line.forEach(g => {
        if (g?.foregroundColor) g.onclick = () => window.open(helpUrl);
    }))

    if (p != null && scramble != null) {
        scramble.forEach((line, y) => line.forEach((v, x) => {
            if (p as number < v) {
                h.window.putc(Math.floor(Math.random()*128), {
                    x, y,
                    foregroundColor: Math.floor(Math.random()*256),
                    backgroundColor: Math.floor(Math.random()*256),
                })
            }
        }));
    }
}

function paintCityLabels() {
    // these are static so never need redrawn, color changes via paintMap
    const {lon: left, lat: top} = game.mapboard.locations[0][0].point;

    game.mapboard.cities.forEach((c, i) => {
        scr.labelLayer.put(
            i.toString(), 32, left - c.lon, top - c.lat, {
                props: {label: c.label, points: c.points}
            }
        )
    });
}

function paintMap() {
    const {earth, contrast} = weatherdata[game.weather];

    scr.labelLayer.setcolors({foregroundColor: contrast});
    scr.mapLayer.setcolors({layerColor: earth});
    //TODO tree colors are updated in place in terrain defs :-(

    game.mapboard.locations.forEach(row =>
        row.forEach(loc => {
            const t = terraintypes[loc.terrain],
                city = loc.cityid != null ? game.mapboard.cities[loc.cityid] : null,
                color = city ? players[city?.owner].color : (loc.alt ? t.altcolor : t.color);

            scr.mapLayer.putc(loc.icon, {
                foregroundColor: color,
                onclick: () => {
                    if (uimode != UIModeKey.orders) return;
                    scr.errorWindow.cls();
                    focus.off();
                    if (city) scr.infoWindow.puts(`\fz\x05\x00\fe\f^${city.label.toUpperCase()}`)
                },
                onmouseover: (e) => {
                    (e.currentTarget as HTMLElement).title = game.mapboard.describe(loc);
                    (e as MithrilEvent).redraw = false;  // prevent mithril redraw
                },
            });
        })
    );
}

function paintUnits() {
    game.oob.forEach(paintUnit);
}

function paintUnit(u: Unit) {
    const
        focussed = u === focus.u(),
        {earth} = weatherdata[game.weather],
        {lon: left, lat: top} = game.mapboard.locations[0][0].point,
        ux = left - u.lon, uy = top - u.lat;

    let animation = undefined;
    if (focussed) {
        const f = u.foggyStrength(game.human);
        // game uses offset \x06 but then '4 RUMANIAN INFANTRY CORPS' touches STANDARD
        scr.infoWindow.puts(`\fz\x05\x00\fe\f@\x05<${u.label}\n\feMUSTER: ${f.mstrng}  COMBAT: ${f.cstrng}`);
        if (u.player == game.human) {
            if (scenarios[game.scenario].mvmode)
                scr.infoWindow.puts(`\fH\f>${unitModes[u.mode].label} \nMODE   `)

            animation = GlyphAnimation.blink;

            const props = {orders: u.orders};
            scr.kreuzeLayer.put('#', 0x80, ux, uy, {foregroundColor: 0x1A, props}),
            Object.values(directions).forEach(
                d => scr.kreuzeLayer.put(d.label, d.icon, ux, uy, {foregroundColor: 0xDC, props})
            )
        }
    } else if (u.active) {
        if (u.flags & unitFlag.attack) {
            animation = GlyphAnimation.flash;
        } else if (u.flags & unitFlag.defend) {
            animation = GlyphAnimation.flash_reverse;
        }
    }

    const opts: SpriteOpts = {
            backgroundColor: earth,
            foregroundColor: players[u.player].color,
            opacity: u.active ? 1: 0,
            animate: animation,
            onmouseover: (e) => {
                (e.currentTarget as HTMLElement).title = game.mapboard.describe(u.location);
                (e as MithrilEvent).redraw = false;  // prevent mithril redraw
            },
            onclick: () => {
                if (uimode != UIModeKey.orders) return;
                scr.errorWindow.cls();
                (uimode == UIModeKey.orders && focus.u() !== u) ? focus.on(u) : focus.off()
            }
        };
    opts.props = u.foggyStrength(game.human);
    if (u.player == game.human || flags.debug) {
        Object.assign(opts.props, {
            orders: u.orders,
            mode: u.mode,
        })
    }
    scr.unitLayer.put(`${game.scenario}:${u.id}`, unitkinds[u.kind].icon, ux, uy, opts)
}

function paintReach(u: Unit) {
    const {lon: left, lat: top} = game.mapboard.locations[0][0].point,
        pts = u.reach();

    scr.maskLayer.cls(0);  // mask everything with block char, then clear reach squares
    pts.forEach(({lon, lat}) => scr.maskLayer.putc(undefined, {x: left - lon, y: top - lat}));
}

function setScenario(scenario: ScenarioKey | null, inc?: number) {
/*
    orginal game shows errmsg "[SELECT]: LEARNER  [START] TO BEGIN" with copyright in txt window,
    where [] is reverse video.  could switch to "[< >]: LEARNER  [ENTER] TO BEGIN(RESUME)"
    so < > increments scenario, # picks directly
*/
    inc ??= 0;
    const n = Object.keys(scenarios).length;

    if (scenario == null) {
        scenario = (game.scenario + inc + n) % n;
    }

    start(scenario);
}

const focus = {
    id: -1,         // most-recently focused unit
    active: false,  // focus currently active?

    u: () => focus.active ? game.oob.at(focus.id) : undefined,
    on: (u: Unit) => {
        focus.off();

        focus.id = u.id;
        focus.active = true;
        paintUnit(u);
        paintReach(u);
    },
    off: () => {
        const u = focus.u();
        focus.active = false;
        scr.infoWindow.puts('\fz\x05\x00\fe');
        if (u) {
            paintUnit(u);           // repaint to clear blink etc
            scr.maskLayer.cls();    // remove all mask glyphs
            scr.kreuzeLayer.cls();  // remove any order animation
        }
    },
    shift: (offset: number) => {
        const
            locid = (u: Unit) => game.mapboard.locationOf(u).id,
            humanUnits = game.oob.activeUnits(game.human).sort((a, b) => locid(b) - locid(a)),
            n = humanUnits.length;
        let i;
        if (focus.id >= 0) {
            i = humanUnits.findIndex(u => u.id == focus.id);
            if (i < 0) {
                // if last unit no longer active, find the nearest active unit
                const id = locid(game.oob.at(focus.id));
                while (++i < n && locid(humanUnits[i]) > id) {/**/}
            }
        } else {
            i = offset > 0 ? -1: 0;
        }
        i = (i + n + offset) % n;
        focus.on(humanUnits[i]);
    },
};

function editUnitMode(mode: UnitMode | null) {
    const u = focus.u();
    if (!u) return;
    if (mode == null) u.nextmode();
    else u.mode = mode;
    focus.on(u);    // redraw reach
}

function editOrders(dir: DirectionKey | null | -1) {
    // dir => add step, -1 => remove step, null => clear or unfocus
    const u = focus.u();
    if (!u) return;
    if (!u.human) {
        scr.errorWindow.puts(`\fh\f^THAT IS A ${players[u.player].label.toUpperCase()} UNIT!`)
        return;
    }

    if (dir == null) {
        if (u.orders.length == 0) {
            focus.off();
            return;
        }
        u.resetOrders();
    } else if (u.kind == UnitKindKey.air && u.mode == UnitMode.assault) {
        if (!(dir in directions)) {
            u.resetOrders();
        }
        else {
            // air support towards next unit in given direction
            u.setOrdersSupportingFriendlyFurther(dir);
        }
    } else if (dir == -1) {
         u.delOrder();
    } else {
        u.addOrder(dir);
    }
}

const keymap = {
    help:   '?/',
    prev:   '<,p',
    next:   '>.n',
    cancel: ['Escape', ' '],
    scenario:  Object.keys(scenarios).map((k, i) => i).join(''),
    extras: 'xX',
    zoom:   'zZ',
    debug:  'gG',
    mode:   'mM',
    modes:  '1234',
},
arrowmap: Record<string, DirectionKey> = {
    ArrowUp: DirectionKey.north,
    ArrowDown: DirectionKey.south,
    ArrowRight: DirectionKey.east,
    ArrowLeft: DirectionKey.west,
};


function keyHandler(e: KeyboardEvent) {
    let handled = true;

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
        if (!scr.errorWindow.dirty) scr.errorWindow.cls(); // clear error if nothing wrote earlier
        m.redraw();
        e.preventDefault();     // eat event if handled
    }
}

interface UIMode {
    enter?: () => void,
    keyHandler: (key: string) => boolean,
}

function setMode(m: UIModeKey) {
    uimode = m;
    modes[m].enter?.();
}

const modes: Record<UIModeKey, UIMode> = {
    [UIModeKey.setup]: {
        enter: () => {
            const label = scenarios[game.scenario].label.padEnd(8, ' ');
            scr.errorWindow.puts(`\fh\f^\f#<\f- ${label} \f#>\f-    \f#ENTER\f- TO START`);
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

            const date = game.date.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'});
            scr.dateWindow.puts(`\fh\n\f^${date}`);
            scr.infoWindow.puts(`\fh\f@\x04>${game.score(game.human)}`);
            scr.errorWindow.puts('\fh\f^PLEASE ENTER YOUR ORDERS NOW');
        },
        keyHandler: (key) => {
            if (keymap.prev.includes(key)) {
                focus.shift(-1);
            } else if (keymap.next.includes(key) || key == 'Enter') {
                focus.shift(+1);
            } else if (scenarios[game.scenario].mvmode && keymap.mode.includes(key)) {
                editUnitMode(null);
            } else if (scenarios[game.scenario].mvmode && keymap.modes.includes(key)) {
                editUnitMode(keymap.modes.indexOf(key));
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
            scr.infoWindow.cls()
            scr.errorWindow.puts('\fh\f^EXECUTING MOVE');
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


function start(scenario?: ScenarioKey) {

    if (scenario == null) {  // initial setup
        scr.dateWindow.puts('\fh\n\f^EASTERN FRONT 1941');
        scr.infoWindow.puts('\fh\f^COPYRIGHT 1982 ATARI\nALL RIGHTS RESERVED')

        paintHelp(hscr);

        document.addEventListener('keydown', keyHandler);

        m.mount(document.body, {view: () => m(Layout, {scr, hscr, flags})});

        game.on('game', (action) => {
            console.debug('game', action);
            switch (action) {
                case 'end': {
                    const advice =
                        game.score(game.human) >= scenarios[game.scenario].win
                        ? 'ADVANCE TO NEXT LEVEL'
                        : 'TRY AGAIN';
                    scr.infoWindow.puts(`\fz\x05\x00\fe\f^GAME OVER\n${advice}`)
                    setMode(UIModeKey.setup);
                    break;
                }
                case 'turn':
                    paintMap();
                    paintUnits();
                    if (uimode == UIModeKey.resolve) setMode(UIModeKey.orders);
                    break;
                case 'tick':
                    paintUnits();
                    break;
                default: {
                    const fail: never = action;
                    throw new Error(`Unhandled game action: ${fail}`)
                }
            }
            m.redraw();
        }).on('map', (action) => {
            console.debug('map', action);
            switch (action) {
                case 'citycontrol':
                    paintMap();
                    break;
                default: {
                    const fail: never = action;
                    throw new Error(`Unhandled map action: ${fail}`)
                }
            }
        }).on('unit', (action, u) => {
            console.debug(`${action}: ${u.label}`);
            if (action == 'orders') {
                paintUnit(u);
                // save game state
                if (u.human) window.location.hash = game.token;
            } else if (action == 'exit' && flags.extras) {
                scr.infoWindow.puts(`\fz\x05\x00\fe\f^${u.label}\nELIMINATED!`)
            }
            // the rest of the actions happen during turn processing, which we pick up via game.tick
        }).on('message', (_, message) => {
            scr.errorWindow.puts(`\fh\f^${message}`)
        })
    } else {
        game.start(scenario);
    }
    const font = fontMap(`static/fontmap-custom-${game.mapboard.font}.png`, 128 + 6),
        {width, height} = game.mapboard.extent;

    scr.mapLayer = new MappedDisplayLayer(width, height, font);
    scr.labelLayer = new SpriteDisplayLayer(width, height, font, {foregroundColor: undefined});
    scr.unitLayer = new SpriteDisplayLayer(width, height, font);
    scr.kreuzeLayer = new SpriteDisplayLayer(width, height, font);
    scr.maskLayer = new MappedDisplayLayer(width, height, font, {backgroundColor: 0x00});

    paintMap();
    paintCityLabels();
    paintUnits();

    setMode(uimode);

    m.redraw();
}

export {start};