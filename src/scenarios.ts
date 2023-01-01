import {OobVariantKey} from './oob-data';
import {MapVariantKey} from './map-data';

/*
cartridge offers selection of scenarios which modify various parameters:
- ncity:  is the number of cities that are scored
    nb. excludes Warsaw which always scores 0 pts anyway
- mdmg/cdmg: is the amount of damage caused by a successful attack tick
- cadj: is the base adjustment to german combat strength
- fog: controls which bits are randomized for enemy units out of sight
- nunit: gives index of first ineligbile unit, e.g. 0x2 means we use the first 2 ids
- endturn: when the scneario ends
- score required to win
*/
type Scenario = {
    label: string, map: MapVariantKey, oob: OobVariantKey, start: string,
    ncity: number, mdmg: number, cdmg: number, cadj: number,
    fog: number, nunit: readonly [number, number], endturn: number, win: number, mvmode?: boolean
};
const enum ScenarioKey {apx, learner, beginner, intermediate, advanced, expert41, expert42}
const scenarios: Record<ScenarioKey, Scenario> = {
    [ScenarioKey.apx]: {
        label: 'APX MODE', map: MapVariantKey.apx, oob: OobVariantKey.apx, start: '1941/6/22',
        //TODO fix me
        ncity: 18, mdmg: 1, cdmg: 4,  cadj: 0, fog: 0xff, nunit: [0x37, 0x9f], endturn: 44, win: 255,
    },
    [ScenarioKey.learner]: {
        label: 'LEARNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 255, fog: 0xff, nunit: [0x2,  0x31], endturn: 14, win: 5,
    },
    [ScenarioKey.beginner]: {
        label: 'BEGINNER', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 1, mdmg: 4, cdmg: 12, cadj: 150, fog: 0xff, nunit: [0x12, 0x50], endturn: 14, win: 25,
    },
    [ScenarioKey.intermediate]: {
        label: 'INTERMED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 3, mdmg: 2, cdmg: 8, cadj: 75, fog: 0xff, nunit: [0x1f, 0x72], endturn: 40, win: 40,
    },
    [ScenarioKey.advanced]: {
        label: 'ADVANCED', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 5, cadj: 25, fog: 0xc0, nunit: [0x2b, 0x90], endturn: 40, win: 80,
    },
    [ScenarioKey.expert41]: {
        label: 'EXPERT41', map: MapVariantKey.cart, oob: OobVariantKey.cart41, start: '1941/6/22',
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, fog: 0x80, nunit: [0x30, 0xa8], endturn: 44, win: 255, mvmode: true
    },
    [ScenarioKey.expert42]: {
        //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
        label: 'EXPERT42', map: MapVariantKey.cart, oob: OobVariantKey.cart42, start: '1942/5/24', // +48 weeks
        ncity: 18, mdmg: 1, cdmg: 4, cadj: 0, fog: 0x80, nunit: [0x30, 0xa8], endturn: 44, win: 255, mvmode: true
    },
} as const;

export {scenarios, ScenarioKey};
