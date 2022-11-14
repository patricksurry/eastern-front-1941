import {PlayerKey, players, DirectionKey} from './defs';
import {scenarios, ScenarioKey} from './scenarios';
import {Game} from './game';
import {Display} from './display';
import {Thinker} from './think';

import {type GridPoint, type MapPoint} from './map';
import {type Unit} from './unit';

import * as d3 from 'd3';

const helpText = `
0123456789012345678901234567890123456789


      Welcome to Chris Crawford's
          Eastern Front  1941

       Ported by Patrick Surry }

  Select: Click, [n]ext, [p]rev
  Orders: \x1f, \x1c, \x1d, \x1e, [Bksp]
  Cancel: [Space], [Esc]
  Submit: [End], [Fn \x1f]
  Toggle: [z]oom, e[x]tras, debu[g]

          [?] shows this help

         Press any key to play!

0123456789012345678901234567890123456789
`.split('\n').slice(2,-2);

interface UIMode {
    enter?: () => void,
    exit?: () => void,
    keyHandler: (key: string) => boolean,
    mapClickHandler?: (ev: MouseEvent, loc: MapPoint) => void,
}

var game: Game,
    display: Display,
    ai: Thinker[],
    zoom = 0,           // display zoom 0 or 1
    help = 1,           // help visible 0 or 1
    uimode: UIModeKey | null = null,
    focusid: number | null = null,     // current focused unit id
    lastid: number |  null = null;      // most recent focused unit id (= focusid or null)

// main entry point
function start() {
    const resume = window.location.hash.slice(1) || undefined;
    game = new Game(resume);

    display = new Display(game, helpText, 'https://github.com/patricksurry/eastern-front-1941');

    game.start();
    game.on('game', (action) => {
        if (action == 'turn' && uimode == UIModeKey.resolve) setMode(UIModeKey.orders);
    })

    ai = Object.keys(players)
        .filter(player => +player != game.human)
        .map(player => new Thinker(game, +player));

    // set up a click handler to toggle help
    d3.select('#help-window').on('click', toggleHelp);

    // add map square click handlers
    d3.selectAll('#map .chr')
        .on('click', mapClickHandler)
        .on('mouseover', mapHoverHandler);

    // start the key handler
    document.addEventListener('keydown', keyHandler);

    if (resume) {
        // hide help and keep going
        toggleHelp();
        setMode(UIModeKey.orders);
    } else {
        setMode(UIModeKey.setup);
    }
}

const enum UIModeKey {setup, orders, resolve};
const modes: Record<UIModeKey, UIMode> = {
    [UIModeKey.setup]: {
        enter: () => {
            display.infomsg(
                display.centered('COPYRIGHT 1982 ATARI'),
                display.centered('ALL RIGHTS RESERVED')
            );
            //TODO this won't work until game responds appropriately
            //setScenario(Scenario.beginner);
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
            window.location.hash = game.token;
            // start thinking...
            ai.forEach(t => t.thinkRecurring(250));
        },
        keyHandler: (key) => {
            if (keymap.prev.includes(key)) {
                focusUnitRelative(-1);
            } else if (keymap.next.includes(key) || key == 'Enter') {
                focusUnitRelative(+1);
            } else if (key in arrowmap) {
                showNewOrder(arrowmap[key]);
            } else if (keymap.cancel.includes(key)) {
                showNewOrder(null);
            } else if (key == 'Backspace') {
                showNewOrder(-1);
            } else if (key == 'End') {
                setMode(UIModeKey.resolve);
            } else {
                return false;
            }
            return true;
        },
        mapClickHandler: (ev, loc) => {
            let u = getFocusedUnit();
            display.errmsg();       // clear errror window
            if (loc.unitid == null || (u && u.id == loc.unitid)) {
                // clicking an empty square or already-focused unit unfocuses
                blurUnit();
                if (loc.cityid) {
                    const label = game.mapboard.cities[loc.cityid].label.toUpperCase()
                    display.infomsg(display.centered(label));
                }
            } else {
                focusUnit(game.oob.at(loc.unitid));
            }
        },
    },
    [UIModeKey.resolve]: {
        enter: () => {
            // finalize AI orders
            ai.forEach(t => t.finalize());

            blurUnit();
            display.errmsg('EXECUTING MOVE');
            game.nextTurn(250);
        },
        keyHandler: (key) => {
            if (keymap.prev.includes(key)) {
                focusUnitRelative(-1);
            } else if (keymap.next.includes(key) || key == 'Enter') {
                focusUnitRelative(+1);
            } else {
                return false;
            }
            return true;
        }
    }
} as const;

function setMode(m: UIModeKey) {
    if (uimode && modes[uimode].exit != null) modes[uimode].exit!();
    uimode = m;
    if (modes[m].enter != null) modes[m].enter!();
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

    display.errmsg();   // clear error
    if (help || keymap.help.includes(e.key)) {
        toggleHelp();
    } else if (keymap.zoom.includes(e.key)) {
        toggleZoom();
    } else if (keymap.extras.includes(e.key)) {
        toggleExtras();
    } else if (keymap.debug.includes(e.key)) {
        toggleDebug();
    } else if (uimode && modes[uimode].keyHandler != null) {
        handled = modes[uimode].keyHandler(e.key);
    }
    if (handled) e.preventDefault();     // eat event if handled
}

function mapClickHandler(ev: MouseEvent, loc: MapPoint) {
    if (uimode && modes[uimode].mapClickHandler != null) 
        modes[uimode].mapClickHandler!(ev, loc);
}

function mapHoverHandler(ev: MouseEvent, loc: MapPoint) {
    let s = loc.describe();
    if (loc.unitid != null) s += '\n' + game.oob.at(loc.unitid).describe(!!game.debug);
    d3.select(this).attr('title', s);
}

function toggleHelp() {
    help = help ? 0: 1;
    display.setVisibility('#help-window', !!help);
    display.setVisibility('#map-scroller', !help);  //TODO needs to be display not visibility
}

function toggleZoom() {
    zoom = zoom ? 0: 1;
    display.setZoom(!!zoom, getFocusedUnit());
}

function toggleExtras() {
    game.extras = game.extras ? 0: 1;
    display.setVisibility('.extra', !!game.extras);
}

function toggleDebug() {
    game.debug = game.debug ? 0: 1;
    display.setVisibility('.debug', !!game.debug);
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

    display.errmsg(display.centered(`[<] ${label} [>]  [ENTER] TO START`))
}

function focusUnit(u: Unit | null) {
    blurUnit();
    if (!u) return;

    focusid = u.id;
    lastid = focusid;

    display.infomsg(`     ${u.label}`, `     MUSTER: ${u.mstrng}  COMBAT: ${u.cstrng}`);

    if (game.extras) {
        let locs = u.reach();
        d3.selectAll('.chr-dim').filter((d) => !((<GridPoint>d).id in locs)).style('opacity', 0.5);
    }

    game.emit('unit', 'focus', u);
}

function focusUnitRelative(offset: number) {
    // sort active germans descending by location id (right => left reading order)
    let humanUnits = game.oob.activeUnits(game.human)
            .sort((a, b) => game.mapboard.locationOf(b).id - game.mapboard.locationOf(a).id),
        n = humanUnits.length;
    var i;
    if (lastid) {
        i = humanUnits.findIndex(u => u.id == lastid);
        if (i < 0) {
            // if last unit no longer active, find the nearest active unit
            let locid = game.mapboard.locationOf(game.oob.at(lastid)).id;
            while (++i < humanUnits.length && game.mapboard.locationOf(humanUnits[i]).id > locid) {/**/}
        }
    } else {
        i = offset > 0 ? -1: 0;
    }
    i = (i + n + offset) % n;
    focusUnit(humanUnits[i]);
}

function getFocusedUnit() {
    return focusid === null ? null: game.oob.at(focusid);
}

function blurUnit() {
    const u = getFocusedUnit();
    if (u) game.emit('unit', 'blur', u);
    display.infomsg();
    focusid = null;
    d3.selectAll('.chr-dim').style('opacity', 0);
    window.location.hash = game.token;
}

function showNewOrder(dir: DirectionKey | null | -1) {
    let u = getFocusedUnit();
    if (!u) return;
    if (!u.human) {
        display.errmsg(`THAT IS A ${players[u.player].label.toUpperCase()} UNIT!`)
        return;
    }
    if (dir == null) {
        if (u.orders.length == 0) {
            blurUnit();
            return;
        }
        u.resetOrders();
    } else if (dir == -1) {
        u.delOrder();
    } else {
        u.addOrder(dir);
    }
    focusUnit(u);
}

export {start};
