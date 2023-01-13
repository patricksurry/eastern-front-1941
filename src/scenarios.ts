import {OobVariantKey} from './oob-data';
import {MapVariantKey} from './map-data';

// cartridge offers selection of scenarios which modify various parameters:
type Scenario = {
    label: string,          // name for this scenario
    map: MapVariantKey,     // which map variant is used
    oob: OobVariantKey,     // which OoB is used
    start: string,          // date of start turn as 'yyyy/mm/dd'
    ncity: number,          // number of scored cities (excl Warsaw which never scores)
    mdmg: number,           // mstrng damage from successful attack
    cdmg: number,           // cstrng damage from successful attack
    cadj: number,           // base adjustment to german combat strength
    // index of first ineligbile unit, e.g. 0x2 means we use the first 2 ids
    nunit: readonly [number, number],
    endturn: number,        // turn (week) number after which scenario ends
    win: number,            // score required to win
    // original game stored as mask, e.g. 0xC0 is 1100 0000 so fog = 6, 0x80 => 7
    skipsupply?: boolean,    // whether to skip supply check
    fog?: number,            // number of randomized lsbits for far-off enemy strength
    mvmode?: boolean,       // true if scenario allows choice of move mode
    repl?: readonly [number, number], // mstrng replacements if in supply by PlayerKey
    control?: readonly string[],     // list of cities whose control is flipped from default
};
const enum ScenarioKey {apx, learner, beginner, intermediate, advanced, expert41, expert42}
const scenarios: Record<ScenarioKey, Scenario> = {
    [ScenarioKey.apx]: {
        label: 'APX MODE', map: MapVariantKey.apx, oob: OobVariantKey.apx, start: '1941/6/22',
        //TODO fix me
        ncity: 18, mdmg: 1, cdmg: 4,  cadj: 0, nunit: [0x37, 0x9f], endturn: 44, win: 255,
        repl: [0, 2]
    },
    [ScenarioKey.learner]: {
        label: 'LEARNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 255, nunit: [0x2,  0x31], endturn: 14, win: 5,
        skipsupply: true
    },
    [ScenarioKey.beginner]: {
        label: 'BEGINNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 150, nunit: [0x12, 0x50], endturn: 14, win: 25,
        skipsupply: true
    },
    [ScenarioKey.intermediate]: {
        label: 'INTERMED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 3, mdmg: 2, cdmg: 8, cadj: 75, nunit: [0x1f, 0x72], endturn: 40, win: 40,
    },
    [ScenarioKey.advanced]: {
        label: 'ADVANCED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 5, cadj: 25, nunit: [0x2b, 0x90], endturn: 40, win: 80,
        fog: 6,
    },
    [ScenarioKey.expert41]: {
        label: 'EXPERT41', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, nunit: [0x30, 0xa8], endturn: 44, win: 255,
        mvmode: true, fog: 7,
    },
    [ScenarioKey.expert42]: {
        //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
        label: 'EXPERT42', map: MapVariantKey.cart, oob: OobVariantKey.cart42, start: '1942/5/24', // +48 weeks
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, nunit: [0x30, 0xa8], endturn: 44, win: 255,
        fog: 7, mvmode: true, control: ['Riga', 'Rzhev', 'Smolensk', 'Minsk', 'Orel', 'Kharkov', 'Kiev', 'Dnepropetrovsk', 'Odessa'] as const
    },
} as const;

export {scenarios, ScenarioKey};
