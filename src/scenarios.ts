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
    scoring: {
        win: number,        // score required to win from player 0 pov
        location?: boolean, // count score for east-west location?
        // whether and how to score strength by player;
        // 'current' means 1pt per 128 current and future cstrng, 'losses' is -1pt per 128 initial mstrng lost
        strength?: readonly ['current'|'losses'|null, 'current'|'losses'|null],
        adjust?: number,    // constant adjustment from player 0 pov
    },
    // original game stored as mask, e.g. 0xC0 is 1100 0000 so fog = 6, 0x80 => 7
    skipsupply?: boolean,   // whether to skip supply check
    simplebreak?: boolean,  // whether to use simplied break after combat check
    defmod?: number,      // additional shift modifier for defender strength
    fog?: number,           // number of randomized lsbits for far-off enemy strength
    mvmode?: boolean,       // true if scenario allows choice of move mode
    repl?: readonly [number, number], // mstrng replacements if in supply by PlayerKey
    control?: readonly string[],     // list of cities whose control is flipped from default
};
const enum ScenarioKey {apx, learner, beginner, intermediate, advanced, expert41, expert42}
const scenarios: Record<ScenarioKey, Scenario> = {
    [ScenarioKey.apx]: {
        label: 'APX MODE', map: MapVariantKey.apx, oob: OobVariantKey.apx, start: '1941/6/22',
        //TODO fix me
        ncity: 18, mdmg: 1, cdmg: 5, cadj: 0, nunit: [0x37, 0x9f], endturn: 44,
        scoring: {win: 255, location: true},
        repl: [0, 2]
    },
    [ScenarioKey.learner]: {
        label: 'LEARNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 255, nunit: [0x2,  0x31], endturn: 14,
        scoring: {win: 5, strength: [null, 'losses']},
        skipsupply: true, simplebreak: true
    },
    [ScenarioKey.beginner]: {
        label: 'BEGINNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 150, nunit: [0x12, 0x50], endturn: 14,
        scoring: {win: 25, strength: [null, 'losses']},
        skipsupply: true, simplebreak: true
    },
    [ScenarioKey.intermediate]: {
        label: 'INTERMED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 3, mdmg: 2, cdmg: 8, cadj: 75, nunit: [0x1f, 0x72], endturn: 40,
        scoring: {win: 40, strength: ['losses', 'losses']},
    },
    [ScenarioKey.advanced]: {
        label: 'ADVANCED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 5, cadj: 25, nunit: [0x2b, 0x90], endturn: 40,
        scoring: {win: 80, strength: ['losses', 'losses']},
        fog: 6,
    },
    [ScenarioKey.expert41]: {
        label: 'EXPERT41', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, nunit: [0x30, 0xa8], endturn: 44,
        scoring: {win: 255, strength: ['losses', 'current']},
        mvmode: true, fog: 7, defmod: 1,
    },
    [ScenarioKey.expert42]: {
        //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
        label: 'EXPERT42', map: MapVariantKey.cart, oob: OobVariantKey.cart42, start: '1942/5/24', // +48 weeks
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, nunit: [0x30, 0xa8], endturn: 44,
        // adjust by 9 here because cart measures losses wrt to 1941 start value
        scoring: {win: 255, strength: ['losses', 'current'], adjust: -9},
        mvmode: true, fog: 7, defmod: 1,
        control: ['Riga', 'Rzhev', 'Smolensk', 'Minsk', 'Orel', 'Kharkov', 'Kiev', 'Dnepropetrovsk', 'Odessa'] as const
    },
} as const;

export {scenarios, ScenarioKey};
