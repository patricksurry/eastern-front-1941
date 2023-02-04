import {DirectionKey} from '../engine/defs';
import {scenarios} from '../engine/scenarios';

import type {AppCtrl} from './appctrl';
import {UIModeKey} from './appmodel';

const keymap = {
        help:   '?/',
        prev:   '<,p',
        next:   '>.n',
        cancel: ['Escape', ' '],
        scenario: Object.keys(scenarios).join(''),
        extras: 'xX',
        zoom:   'zZ',
        debug:  'gG',
        mode:   'mM',
        modes:  '1234',
    },
    arrowdirs: Record<string, DirectionKey> = {
        ArrowUp: DirectionKey.north,
        ArrowDown: DirectionKey.south,
        ArrowRight: DirectionKey.east,
        ArrowLeft: DirectionKey.west,
    },
    modeHandlers = {
        [UIModeKey.setup]: setupHandler,
        [UIModeKey.orders]: ordersHandler,
        [UIModeKey.resolve]: resolveHandler,
    }
;

const modifier = {
    shift:  1 << 0,
    ctrl:   1 << 1,
    alt:    1 << 2,
    meta:   1 << 3,
};

function keyModifiers(event: KeyboardEvent): number {
    return (
          (event.shiftKey ? modifier.shift: 0)
        | (event.ctrlKey ? modifier.ctrl: 0)
        | (event.altKey ? modifier.alt: 0)
        | (event.metaKey ? modifier.meta: 0)
    )
}

function globalHandler(key: string, modifiers: number, ctrl: AppCtrl) {
    if (ctrl.app.help || keymap.help.includes(key)) {
        ctrl.app.help = !ctrl.app.help;
    } else if (keymap.zoom.includes(key)) {
        ctrl.view.pinMapCenter();
        ctrl.app.zoom = !ctrl.app.zoom;
    } else if (keymap.extras.includes(key)) {
        ctrl.app.extras = !ctrl.app.extras;
    } else if (keymap.debug.includes(key)) {
        ctrl.app.debug = !ctrl.app.debug;
    } else {
        return false;
    }
    return true;
}

function setupHandler(key: string, modifiers: number, ctrl: AppCtrl) {
    if (keymap.prev.includes(key) || key == 'ArrowLeft') {
        ctrl.setScenario(undefined, -1);
    } else if (keymap.next.includes(key) || key == 'ArrowRight') {
        ctrl.setScenario(undefined, +1);
    } else if (keymap.scenario.includes(key)) {
        ctrl.setScenario(parseInt(key));
    } else if (key == 'Enter') {
        ctrl.setMode(UIModeKey.orders);
    } else {
        return false;
    }
    return true;
}

function ordersHandler(key: string, modifiers: number, ctrl: AppCtrl) {
    if (keymap.prev.includes(key)) {
        ctrl.app.focusShift(-1);
    } else if (keymap.next.includes(key) || (key == 'Enter' && !modifiers)) {
        if (ctrl.game.over) ctrl.setMode(UIModeKey.setup);
        else ctrl.app.focusShift(+1);
    } else if (ctrl.app.mvmode && keymap.mode.includes(key)) {
        ctrl.editUnitMode(null);
    } else if (ctrl.app.mvmode && keymap.modes.includes(key)) {
        ctrl.editUnitMode(keymap.modes.indexOf(key));
    } else if (key in arrowdirs) {
        ctrl.editOrders(arrowdirs[key]);
    } else if (keymap.cancel.includes(key)) {
        ctrl.editOrders(null);
    } else if (key == 'Backspace') {
        ctrl.editOrders(-1);
    } else if (key == 'End' || (key == 'Enter' && (modifiers & (modifier.ctrl | modifier.shift)))) {
        ctrl.setMode(UIModeKey.resolve);
    } else {
        return false;
    }
    return true;
}

function resolveHandler(key: string, modifiers: number, ctrl: AppCtrl) {
    if (keymap.prev.includes(key)) {
        ctrl.app.focusShift(-1);
    } else if (keymap.next.includes(key) || key == 'Enter') {
        ctrl.app.focusShift(+1);
    } else {
        return false;
    }
    return true;
}

export {globalHandler, modeHandlers, keyModifiers};