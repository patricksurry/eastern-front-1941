import {LevelKey} from './defs';
import {OobVariantKey} from './oob-data';
import {MapVariantKey} from './map-data';

type Scenario = {label: string, map: MapVariantKey, oob: OobVariantKey, level: LevelKey, start: string};
const enum ScenarioKey {
    apx, learner, beginner, intermediate, advanced, expert41, expert42
};
const scenarios: Record<ScenarioKey, Scenario> = {
    [ScenarioKey.apx]: {
        label: 'APX MODE', map: MapVariantKey.apx, oob: OobVariantKey.apx, level: LevelKey.advanced, start: '1941/6/22'
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
        label: 'EXPERT42', map: MapVariantKey.cart, oob: OobVariantKey.cart41, level: LevelKey.expert, start: '1942/5/24'
    },
} as const;

export {scenarios, ScenarioKey};
