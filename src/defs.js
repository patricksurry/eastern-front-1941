// Atari had a memory location that could be read for a byte of random noise
function randbyte() {
    return Math.floor(Math.random()*256);
}

function sum(xs) {
    return xs.reduce((s, x) => s + x, 0);
}


function enumFor(vs, key) {
    return Object.fromEntries(vs.map((v, i) => [v[key || 'key'], i]));
}

const
    // mimic logic from STKTABlon looking for zeroed pins
    // see https://forums.atariage.com/topic/275027-joystick-value-logic/:
    directions = [
        {dlon: 0,  dlat: 1,  key: 'north', icon: 257},   // up    1110 => 0 - north
        {dlon: -1, dlat: 0,  key: 'east',  icon: 258},   // right 0111 => 1 - east
        {dlon: 0,  dlat: -1, key: 'south', icon: 259},   // down  1101 => 2 - south
        {dlon: 1,  dlat: 0,  key: 'west',  icon: 260},   // left  1011 => 3 - west
    ],
    Direction = enumFor(directions),
    players = [
        {
            key: 'german',  unit: 'CORPS', color: '0C', homedir: Direction.west,
            supply: {sea: 1, replacements: 0, maxfail: [24, 0, 16], freeze: 1}
        },
        {
            key: 'russian', unit: 'ARMY',  color: '46', homedir: Direction.east,
            supply: {sea: 0, replacements: 2, maxfail: [24, 24, 24], freeze: 0}
        },
    ],
    // note we rely on Player.german = 1 - Player.russian and vice versa
    Player = enumFor(players),
    // cartridge offers selection of levels which modify various parameters:
    //  ncity:  is the number of cities that are scored - note needs bumped if Sevastopol added
    //  mdmg/cdmg: is the amount of damage caused by a successful attack tick
    //  cadj: is the base adjustment to german combat strength
    //  fog: controls which bits are randomized for enemy units out of sight
    //  nunit: gives index of first ineligbile unit, e.g. 0x2 means control first 2 ids
    //  endturn: when the scneario ends
    //  score required to win
    leveldata = [
        {key: "learner",      ncity: 1,  mdmg: 4, cdmg: 12, cadj: 255, fog: 0xff, nunit: [0x2,  0x31], endturn: 14, win: 5},
        {key: "beginner",     ncity: 1,  mdmg: 4, cdmg: 12, cadj: 150, fog: 0xff, nunit: [0x12, 0x50], endturn: 14, win: 25},
        {key: "intermediate", ncity: 3,  mdmg: 2, cdmg: 8,  cadj:  75, fog: 0xff, nunit: [0x1f, 0x72], endturn: 40, win: 40},
        {key: "advanced",     ncity: 18, mdmg: 1, cdmg: 5,  cadj:  25, fog: 0xc0, nunit: [0x2b, 0x90], endturn: 40, win: 80},
        {key: "expert",       ncity: 18, mdmg: 1, cdmg: 4,  cadj:   0, fog: 0x80, nunit: [0x30, 0xa8], endturn: 44, win: 255},
    ],
    Level = enumFor(leveldata),
    // terrain types M.ASM: 8160 TERRTY
    // NB we store offence and defence modifiers so 0 is no effect, equivalent to orignal game's 2
    // OFFNC I.ASM:9080 1,1,1,1,1,1,2,2,1,0
    // DEFNC I.ASM:9080 2,3,3,2,2,2,1,1,2,0
    // movement costs (of 32/turn) come from D.ASM:5430 SSNCOD / 5440 TRNTAB
    // index by terrain, then armor(0/1) and finally Weather enum
    // value of 128 means impassable, 0 means error (frozen terrain outside winter)
    terraintypes = [
        {
            key: 'clear', color: '02',
            offence: 0, defence: 0, movecost: [[ 6, 24, 10], [ 4, 30,  6]]
        },
        {
            key: 'mountain_forest', color: '28', altcolor: 'D6',   // mtn + forest
            offence: 0, defence: 1, movecost: [[12, 30, 16], [ 8, 30, 10]]
        },
        {
            key: 'city', color: '0C', altcolor: '46',  // german + russian control
            offence: 0, defence: 1, movecost: [[ 8, 24, 10], [ 6, 30,  8]]
        },
        {
            key: 'frozen_swamp', color: '0C',
            offence: 0, defence: 0, movecost: [[ 0,  0, 12], [ 0,  0,  8]]
        },
        {
            key: 'frozen_river', color: '0C',
            offence: 0, defence: 0, movecost: [[ 0,  0, 12], [ 0,  0,  8]]
        },
        {
            key: 'swamp', color: '94',
            offence: 0, defence: 0, movecost: [[18, 30, 24], [18, 30, 24]]
        },
        {
            key: 'river', color: '94',
            offence: -1, defence: -1, movecost: [[14, 30, 28], [13, 30, 28]]
        },
        {
            // strange that coastline acts like river but estuary doesn't?
            key: 'coastline', color: '94',
            offence: -1, defence: -1, movecost: [[ 8, 26, 12], [ 6, 30,  8]]
        },
        {
            key: 'estuary', color: '94',
            offence: 0, defence: 0, movecost: [[20, 28, 24], [16, 30, 20]],
        },
        {
            key: 'impassable', color: '94', altcolor: '0C',  // sea + border
            offence: 0, defence: 0, movecost: [[0, 0, 0], [0, 0, 0]]
        }
    ],
    Terrain = enumFor(terraintypes),
    // D.ASM:2690 TRTAB
    // M.ASM:2690 season calcs
    weatherdata = [
        {key: 'dry',  earth: '10'},
        {key: 'mud',  earth: '02'},
        {key: 'snow', earth: '0A'},
    ],
    Weather = enumFor(weatherdata),
    waterstate = [
        {key: 'freeze', dir: Direction.south, terrain: [Terrain.frozen_swamp, Terrain.frozen_river]},
        {key: 'thaw',   dir: Direction.north, terrain: [Terrain.swamp, Terrain.river]},
    ],
    Water = enumFor(waterstate),
    // combines D.asm:2690 TRTAB and 5430 SSNCOD, also annotated PDF p71 (labelled -63-)
    monthdata = [
        {label: "January",   trees: '12', weather: Weather.snow},
        {label: "February",  trees: '12', weather: Weather.snow},
        {label: "March",     trees: '12', weather: Weather.snow, water: Water.thaw},
        {label: "April",     trees: 'D2', weather: Weather.mud},
        {label: "May",       trees: 'D8', weather: Weather.dry},
        {label: "June",      trees: 'D6', weather: Weather.dry},
        {label: "July",      trees: 'C4', weather: Weather.dry},
        {label: "August",    trees: 'D4', weather: Weather.dry},
        {label: "September", trees: 'C2', weather: Weather.dry},
        {label: "October",   trees: '12', weather: Weather.mud},
        {label: "November",  trees: '12', weather: Weather.snow, water: Water.freeze},
        {label: "December",  trees: '12', weather: Weather.snow},
    ],
    Month = enumFor(monthdata, 'label'),
    unitkinds = [
        {key: 'infantry',   icon: 0xfd},
        {key: 'armor',      icon: 0xfe},
        {key: 'air',        icon: 0xfc},
    ],
    UnitKind = enumFor(unitkinds),
    variants = [
        {key: 'apx'},
        {key: 'cart'}
    ],
    Variant = enumFor(variants),
    //TODO arrival turns for '42 scenario seem to be calculated in cartridge.asm:3709
    scenarios = [
        // start dates stored as week prior to first turn in cartridge, ie. '41/6/15, '42/5/17
        {key: '41', start: '1941/6/22'},
        {key: '42', start: '1942/5/24'},
    ],
    Scenario = enumFor(scenarios);

function moveCost(terrain, kind, weather) {
    return kind == UnitKind.air ? 4: (terraintypes[terrain].movecost[kind][weather] || 255);
}

function moveCosts(kind, weather) {
    // return a table of movement costs based on armor/inf and weather
    return terraintypes.map((_, i) => moveCost(i, kind, weather));
}

export {
    sum, randbyte, enumFor,
    directions, Direction,
    players, Player,
    leveldata, Level,
    terraintypes, Terrain,
    weatherdata, Weather,
    waterstate, Water,
    monthdata, Month,
    unitkinds, UnitKind,
    moveCost, moveCosts,
    variants, Variant,
    scenarios, Scenario,
}
