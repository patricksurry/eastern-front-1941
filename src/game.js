// Atari had a memory location that could be read for a byte of random noise
function randbyte() {
    return Math.floor(Math.random()*256);
}

function sum(xs) {
    return xs.reduce((s, x) => s + x, 0);
}

function score(player, oob) {
    // M.asm:4050
    let eastwest = sum(oob.map(u => u.score() * (u.player == player ? 1: -1))),
        bonus = sum(cities.filter(c => c.owner == player).map(c => c.points)),
        score = Math.max(0, eastwest) + bonus;
    if (gameState.handicap) score >>= 1;
    return score;
}

function enumFor(vs, key) {
    return Object.fromEntries(vs.map((v, i) => [v[key || 'key'], i]));
}

function anticColor(v) {
    return anticPaletteRGB[Math.floor(parseInt(v, 16)/2)];
}

const
    // Antic NTSC palette via https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#NTSC
    // 128 colors indexed via high 7 bits, e.g. 0x00 and 0x01 refer to the first entry
    anticPaletteRGB = [
        "#000000",  "#404040",  "#6c6c6c",  "#909090",  "#b0b0b0",  "#c8c8c8",  "#dcdcdc",  "#ececec",
        "#444400",  "#646410",  "#848424",  "#a0a034",  "#b8b840",  "#d0d050",  "#e8e85c",  "#fcfc68",
        "#702800",  "#844414",  "#985c28",  "#ac783c",  "#bc8c4c",  "#cca05c",  "#dcb468",  "#ecc878",
        "#841800",  "#983418",  "#ac5030",  "#c06848",  "#d0805c",  "#e09470",  "#eca880",  "#fcbc94",
        "#880000",  "#9c2020",  "#b03c3c",  "#c05858",  "#d07070",  "#e08888",  "#eca0a0",  "#fcb4b4",
        "#78005c",  "#8c2074",  "#a03c88",  "#b0589c",  "#c070b0",  "#d084c0",  "#dc9cd0",  "#ecb0e0",
        "#480078",  "#602090",  "#783ca4",  "#8c58b8",  "#a070cc",  "#b484dc",  "#c49cec",  "#d4b0fc",
        "#140084",  "#302098",  "#4c3cac",  "#6858c0",  "#7c70d0",  "#9488e0",  "#a8a0ec",  "#bcb4fc",
        "#000088",  "#1c209c",  "#3840b0",  "#505cc0",  "#6874d0",  "#7c8ce0",  "#90a4ec",  "#a4b8fc",
        "#00187c",  "#1c3890",  "#3854a8",  "#5070bc",  "#6888cc",  "#7c9cdc",  "#90b4ec",  "#a4c8fc",
        "#002c5c",  "#1c4c78",  "#386890",  "#5084ac",  "#689cc0",  "#7cb4d4",  "#90cce8",  "#a4e0fc",
        "#003c2c",  "#1c5c48",  "#387c64",  "#509c80",  "#68b494",  "#7cd0ac",  "#90e4c0",  "#a4fcd4",
        "#003c00",  "#205c20",  "#407c40",  "#5c9c5c",  "#74b474",  "#8cd08c",  "#a4e4a4",  "#b8fcb8",
        "#143800",  "#345c1c",  "#507c38",  "#6c9850",  "#84b468",  "#9ccc7c",  "#b4e490",  "#c8fca4",
        "#2c3000",  "#4c501c",  "#687034",  "#848c4c",  "#9ca864",  "#b4c078",  "#ccd488",  "#e0ec9c",
        "#442800",  "#644818",  "#846830",  "#a08444",  "#b89c58",  "#d0b46c",  "#e8cc7c",  "#fce08c"
    ],
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
    Player = enumFor(players),
    cities = [
// M.ASM:8630 MPTS / MOSCX / MOSCY - special city victory points; updated in CITYxxx for CART
// oddly Sevastpol is assigned points but is not coded as a city in either version of the map?
//TODO  create a variant that replaces F => @ in the bottom row of the map, and adds to city list
        {owner: Player.russian, lon: 20, lat: 28, points: 10, label: 'Moscow'},      // APX = 20
        {owner: Player.russian, lon: 33, lat: 36, points: 5,  label: 'Leningrad'},   // APX = 10
        {owner: Player.russian, lon: 6,  lat: 15, points: 5,  label: 'Stalingrad'},  // APX = 10
        {owner: Player.russian, lon: 12, lat:  4, points: 5,  label: 'Krasnodar'},   // APX all others zero except Sevastopol
        {owner: Player.russian, lon: 13, lat: 33, points: 5,  label: 'Gorky'},
        {owner: Player.russian, lon: 7,  lat: 32, points: 5,  label: 'Kazan'},
        {owner: Player.russian, lon: 38, lat: 30, points: 2,  label: 'Riga'},
        {owner: Player.russian, lon: 24, lat: 28, points: 2,  label: 'Rzhev'},
        {owner: Player.russian, lon: 26, lat: 24, points: 2,  label: 'Smolensk'},
        {owner: Player.russian, lon: 3,  lat: 24, points: 5,  label: 'Kuibishev'},
        {owner: Player.russian, lon: 33, lat: 22, points: 2,  label: 'Minsk'},
        {owner: Player.russian, lon: 15, lat: 21, points: 2,  label: 'Voronezh'},
        {owner: Player.russian, lon: 21, lat: 21, points: 2,  label: 'Orel'},
        {owner: Player.russian, lon: 20, lat: 15, points: 2,  label: 'Kharkov'},
        {owner: Player.russian, lon: 29, lat: 14, points: 2,  label: 'Kiev'},
        {owner: Player.russian, lon: 12, lat:  8, points: 2,  label: 'Rostov'},
        {owner: Player.russian, lon: 20, lat:  8, points: 2,  label: 'Dnepropetrovsk'},
        {owner: Player.russian, lon: 26, lat:  5, points: 2,  label: 'Odessa'},
        {owner: Player.german,  lon: 44, lat: 19, points: 0,  label: 'Warsaw'},
//        {owner: Player.russian, lon: 20, lat:  0, points: 5,  label: 'Sevastopol'},
    ],
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
    UnitKind = enumFor(unitkinds);


var gameState = {
    human: Player.german,
    turn: -1,       // 0-based turn counter, -1 is pre-game
    startDate: null,
    icelat: 39,     // via M.ASM:8600 PSXVAL initial value is 0x27
    handicap: 0,    // whether the game is handicapped
    zoom: false,    // display zoom on or off
    extras: true,   // display extras like labels, health, zoc
    debug: false,   // whether to display debug info for Russian units
    weather: null,
    help: null,     // after init, has boolean indicating help hide/show state
}

export {
    enumFor,
    directions, Direction,
    players, Player,
    cities,
    leveldata, Level,
    terraintypes, Terrain,
    weatherdata, Weather,
    waterstate, Water,
    monthdata, Month,
    unitkinds, UnitKind,
    anticColor,
    randbyte,
    sum,
    gameState,
    score,
}
