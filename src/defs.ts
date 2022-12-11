import type {AnticColor} from './anticmodel';

type Flag = 0 | 1;
interface Point {lon: number, lat: number}

function sum(xs: number[]): number {
    return xs.reduce((s: number, x: number) => s + x, 0);
}

function memoize<S, T>(fn: (x: S) => T): (x: S) => T {
    const cache = new Map<S, T>();
    const cached = function (x: S): T {
        if (!cache.has(x)) cache.set(x, fn(x));
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return cache.get(x)!;
    };
    return cached;
}

// mimic logic from STKTABlon looking for zeroed pins
// see https://forums.atariage.com/topic/275027-joystick-value-logic/:
interface Direction {label: string, dlon: number, dlat: number, icon: number}
const enum DirectionKey {north, east, south, west}
const directions: Record<DirectionKey, Direction> = {
    [DirectionKey.north]: {label: 'N', dlon: 0,  dlat: 1,  icon: 0x81},   // up    1110 => 0
    [DirectionKey.east]:  {label: 'E', dlon: -1, dlat: 0,  icon: 0x82},   // right 0111 => 1
    [DirectionKey.south]: {label: 'S', dlon: 0,  dlat: -1, icon: 0x83},   // down  1101 => 2
    [DirectionKey.west]:  {label: 'W', dlon: 1,  dlat: 0,  icon: 0x84},   // left  1011 => 3
} as const;

interface Supply {
    sea: number, replacements: number, freeze: number, maxfail: readonly [number, number, number]
}
interface Player {
    label: string, unit: string, color: AnticColor, homedir: DirectionKey, supply: Supply
}
// note we rely on Player.german = 1 - Player.russian and vice versa
const enum PlayerKey {German, Russian}
const players: Record<PlayerKey, Player> = {
    [PlayerKey.German]: {
        label: 'German',  unit: 'CORPS', color: 0x0C, homedir: DirectionKey.west,
        supply: {sea: 1, replacements: 0, maxfail: [24, 0, 16], freeze: 1}
    },
    [PlayerKey.Russian]: {
        label: 'Russian', unit: 'ARMY',  color: 0x46, homedir: DirectionKey.east,
        supply: {sea: 0, replacements: 2, maxfail: [24, 24, 24], freeze: 0}
    },
 } as const;

// terrain types M.ASM: 8160 TERRTY
// NB we store offence and defence modifiers so 0 is no effect, equivalent to orignal game's 2
// OFFNC I.ASM:9080 1,1,1,1,1,1,2,2,1,0
// DEFNC I.ASM:9080 2,3,3,2,2,2,1,1,2,0
// movement costs (of 32/turn) come from D.ASM:5430 SSNCOD / 5440 TRNTAB
// index by terrain, then armor(0/1) and finally Weather enum
// value of 128 means impassable, 0 means error (frozen terrain outside winter)
const enum TerrainKey {
    clear, mountain_forest, city, frozen_swamp, frozen_river,
    swamp, river, coastline, estuary, impassable
}
type WeatherCosts = readonly [number, number, number];
type UnitKindCosts = readonly [WeatherCosts, WeatherCosts];
interface Terrain {
    label: string, color: AnticColor, altcolor?: AnticColor,
    offence: number, defence: number, movecost: UnitKindCosts
}
const terraintypes: Record<TerrainKey, Terrain> = {
    [TerrainKey.clear]: {
        label: 'clear', color: 0x02,
        offence: 0, defence: 0, movecost: [[ 6, 24, 10], [ 4, 30,  6]]
    },
    [TerrainKey.mountain_forest]: {
        label: 'mountain/forest', color: 0x28, altcolor: 0xD6,   // mtn + forest
        offence: 0, defence: 1, movecost: [[12, 30, 16], [ 8, 30, 10]]
    },
    [TerrainKey.city]: {
        label: 'city', color: 0x00,  // will be colored based on player control
        offence: 0, defence: 1, movecost: [[ 8, 24, 10], [ 6, 30,  8]]
    },
    [TerrainKey.frozen_swamp]: {
        label: 'frozen swamp', color: 0x0C,
        offence: 0, defence: 0, movecost: [[ 0,  0, 12], [ 0,  0,  8]]
    },
    [TerrainKey.frozen_river]: {
        label: 'frozen river', color: 0x0C,
        offence: 0, defence: 0, movecost: [[ 0,  0, 12], [ 0,  0,  8]]
    },
    [TerrainKey.swamp]: {
        label: 'swamp', color: 0x94,
        offence: 0, defence: 0, movecost: [[18, 30, 24], [18, 30, 24]]
    },
    [TerrainKey.river]: {
        label: 'river', color: 0x94,
        offence: -1, defence: -1, movecost: [[14, 30, 28], [13, 30, 28]]
    },
    [TerrainKey.coastline]: {
        // strange that coastline acts like river but estuary doesn't?
        label: 'coastline', color: 0x94,
        offence: -1, defence: -1, movecost: [[ 8, 26, 12], [ 6, 30,  8]]
    },
    [TerrainKey.estuary]: {
        label: 'estuary', color: 0x94,
        offence: 0, defence: 0, movecost: [[20, 28, 24], [16, 30, 20]],
    },
    [TerrainKey.impassable]: {
        label: 'impassable', color: 0x94, altcolor: 0x0C,  // sea + border
        offence: 0, defence: 0, movecost: [[0, 0, 0], [0, 0, 0]]
    }
} as const;

// adds contrast color for optional labels
interface Weather {label: string, earth: AnticColor, contrast: AnticColor}
const enum WeatherKey {dry, mud, snow}
const weatherdata: Record<WeatherKey, Weather> = {
    [WeatherKey.dry]:  {label: 'dry',  earth: 0x10, contrast: 0x06},
    [WeatherKey.mud]:  {label: 'mud',  earth: 0x02, contrast: 0x06},
    [WeatherKey.snow]: {label: 'snow', earth: 0x0A, contrast: 0x04},
} as const;

interface WaterState {
    dir: DirectionKey, terrain: readonly[TerrainKey, TerrainKey]
}
const enum WaterStateKey {freeze, thaw}
const waterstate: Record<WaterStateKey, WaterState> = {
    [WaterStateKey.freeze]: {
        dir: DirectionKey.south, terrain: [TerrainKey.frozen_swamp, TerrainKey.frozen_river]
    },
    [WaterStateKey.thaw]: {
        dir: DirectionKey.north, terrain: [TerrainKey.swamp, TerrainKey.river]
    },
} as const;

// combines D.asm:2690 TRTAB and 5430 SSNCOD, also annotated PDF p71 (labelled -63-)
interface Month {label: string, trees: AnticColor, weather: WeatherKey, water?: WaterStateKey}
const enum MonthKey {
    Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
}
const monthdata: Record<MonthKey, Month> = {
    [MonthKey.Jan]: {label: "January",   trees: 0x12, weather: WeatherKey.snow},
    [MonthKey.Feb]: {label: "February",  trees: 0x12, weather: WeatherKey.snow},
    [MonthKey.Mar]: {label: "March",     trees: 0x12, weather: WeatherKey.snow, water: WaterStateKey.thaw},
    [MonthKey.Apr]: {label: "April",     trees: 0xD2, weather: WeatherKey.mud},
    [MonthKey.May]: {label: "May",       trees: 0xD8, weather: WeatherKey.dry},
    [MonthKey.Jun]: {label: "June",      trees: 0xD6, weather: WeatherKey.dry},
    [MonthKey.Jul]: {label: "July",      trees: 0xC4, weather: WeatherKey.dry},
    [MonthKey.Aug]: {label: "August",    trees: 0xD4, weather: WeatherKey.dry},
    [MonthKey.Sep]: {label: "September", trees: 0xC2, weather: WeatherKey.dry},
    [MonthKey.Oct]: {label: "October",   trees: 0x12, weather: WeatherKey.mud},
    [MonthKey.Nov]: {label: "November",  trees: 0x12, weather: WeatherKey.snow, water: WaterStateKey.freeze},
    [MonthKey.Dec]: {label: "December",  trees: 0x12, weather: WeatherKey.snow},
} as const;

interface UnitKind {key: string, icon: number}
const enum UnitKindKey {infantry, armor, air}
const unitkinds: Record<UnitKindKey, UnitKind> = {
    [UnitKindKey.infantry]: {key: 'infantry',   icon: 0x7d},
    [UnitKindKey.armor]:    {key: 'armor',      icon: 0x7e},
    [UnitKindKey.air]:      {key: 'air',        icon: 0x7c},
} as const;

// cartridge offers selection of levels which modify various parameters:
//  ncity:  is the number of cities that are scored - note needs bumped if Sevastopol added
//  mdmg/cdmg: is the amount of damage caused by a successful attack tick
//  cadj: is the base adjustment to german combat strength
//  fog: controls which bits are randomized for enemy units out of sight
//  nunit: gives index of first ineligbile unit, e.g. 0x2 means control first 2 ids
//  endturn: when the scneario ends
//  score required to win
interface Level {
    label: string, ncity: number, mdmg: number, cdmg: number, cadj: number,
    fog: number, nunit: readonly [number, number], endturn: number, win: number,
}
const enum LevelKey {learner, beginner, intermediate, advanced, expert}
const levels: Record<LevelKey, Level> = {
    [LevelKey.learner]: {label: "learner",  ncity: 1,  mdmg: 4, cdmg: 12, cadj: 255, fog: 0xff, nunit: [0x2,  0x31], endturn: 14, win: 5},
    [LevelKey.beginner]: {label: "beginner", ncity: 1,  mdmg: 4, cdmg: 12, cadj: 150, fog: 0xff, nunit: [0x12, 0x50], endturn: 14, win: 25},
    [LevelKey.intermediate]: {label: "intermed", ncity: 3,  mdmg: 2, cdmg: 8,  cadj:  75, fog: 0xff, nunit: [0x1f, 0x72], endturn: 40, win: 40},
    [LevelKey.advanced]: {label: "advanced", ncity: 18, mdmg: 1, cdmg: 5,  cadj:  25, fog: 0xc0, nunit: [0x2b, 0x90], endturn: 40, win: 80},
    [LevelKey.expert]: {label: "expert",   ncity: 18, mdmg: 1, cdmg: 4,  cadj:   0, fog: 0x80, nunit: [0x30, 0xa8], endturn: 44, win: 255},
} as const;

function moveCost(terrain: TerrainKey, kind: UnitKindKey, weather: WeatherKey): number {
    return kind == UnitKindKey.air ? 4: (terraintypes[terrain].movecost[kind][weather] || 255);
}

function moveCosts(kind: UnitKindKey, weather: WeatherKey): number[] {
    // return a table of movement costs based on armor/inf and weather
    return Object.keys(terraintypes).map(t => moveCost(+t, kind, weather));
}

export type {Flag, Point};

export {
    sum, memoize,
    directions, DirectionKey,
    players, PlayerKey,
    terraintypes, TerrainKey,
    weatherdata, WeatherKey,
    waterstate, WaterStateKey,
    monthdata, MonthKey,
    unitkinds, UnitKindKey,
    levels, LevelKey,
    moveCost, moveCosts,
}
