import {OobVariantKey} from './oob-data';
import {MapVariantKey} from './map-data';

// cartridge offers selection of levels which modify various parameters:
//  ncity:  is the number of cities that are scored - note needs bumped if Sevastopol added
//  mdmg/cdmg: is the amount of damage caused by a successful attack tick
//  cadj: is the base adjustment to german combat strength
//  fog: controls which bits are randomized for enemy units out of sight
//  nunit: gives index of first ineligbile unit, e.g. 0x2 means we use the first 2 ids
//  endturn: when the scneario ends
//  score required to win
interface Level {
    label: string, ncity: number, mdmg: number, cdmg: number, cadj: number,
    fog: number, nunit: readonly [number, number], endturn: number, win: number,
}
const enum LevelKey {learner, beginner, intermediate, advanced, expert, apx}

//TODO does ncity exclude warsaw somehow?
const levels: Record<LevelKey, Level> = {
    [LevelKey.learner]:      {label: "learner",  ncity: 1,  mdmg: 4, cdmg: 12, cadj: 255, fog: 0xff, nunit: [0x2,  0x31], endturn: 14, win: 5},
    [LevelKey.beginner]:     {label: "beginner", ncity: 1,  mdmg: 4, cdmg: 12, cadj: 150, fog: 0xff, nunit: [0x12, 0x50], endturn: 14, win: 25},
    [LevelKey.intermediate]: {label: "intermed", ncity: 3,  mdmg: 2, cdmg: 8,  cadj:  75, fog: 0xff, nunit: [0x1f, 0x72], endturn: 40, win: 40},
    [LevelKey.advanced]:     {label: "advanced", ncity: 18, mdmg: 1, cdmg: 5,  cadj:  25, fog: 0xc0, nunit: [0x2b, 0x90], endturn: 40, win: 80},
    [LevelKey.expert]:       {label: "expert",   ncity: 18, mdmg: 1, cdmg: 4,  cadj:   0, fog: 0x80, nunit: [0x30, 0xa8], endturn: 44, win: 255},
//TODO fix me
    [LevelKey.apx]:          {label: "apx",      ncity: 18, mdmg: 1, cdmg: 4,  cadj:   0, fog: 0xff, nunit: [0x37, 0x9f], endturn: 44, win: 255},
} as const;

type Scenario = {label: string, map: MapVariantKey, oob: OobVariantKey, level: LevelKey, start: string};
const enum ScenarioKey {apx, learner, beginner, intermediate, advanced, expert41, expert42}
const scenarios: Record<ScenarioKey, Scenario> = {
    [ScenarioKey.apx]: {
        label: 'APX MODE', map: MapVariantKey.apx, oob: OobVariantKey.apx, level: LevelKey.apx, start: '1941/6/22'
    },
    [ScenarioKey.learner]: {
        label: 'LEARNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, level: LevelKey.learner, start: '1941/6/22'
    },
    [ScenarioKey.beginner]: {
        label: 'BEGINNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, level: LevelKey.beginner, start: '1941/6/22'
    },
    [ScenarioKey.intermediate]: {
        label: 'INTERMED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, level: LevelKey.intermediate, start: '1941/6/22'
    },
    [ScenarioKey.advanced]: {
        label: 'ADVANCED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, level: LevelKey.advanced, start: '1941/6/22'
    },
    [ScenarioKey.expert41]: {
        label: 'EXPERT41', map: MapVariantKey.cart, oob: OobVariantKey.cart41, level: LevelKey.expert, start: '1941/6/22'
    },
    [ScenarioKey.expert42]: {
        //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
        label: 'EXPERT42', map: MapVariantKey.cart, oob: OobVariantKey.cart42, level: LevelKey.expert, start: '1942/5/24'
    },
} as const;

export {levels, LevelKey, scenarios, ScenarioKey};
