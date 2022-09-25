function enumFor(vs, key) {
    return Object.fromEntries(vs.map((v, i) => [v[key || 'key'], i]));
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
    //TODO remove me
    spiral1 = [
        Direction.north, Direction.east, Direction.south, Direction.south,
        Direction.west, Direction.west, Direction.north, Direction.north
    ],
    // D.ASM:5500 BHX1 .BYTE ... / BHY1 / BHX2 / BHY2
    // there are 11 impassable square-sides
    // the original game stores 22 sets of (x1,y1),(x2,y2) coordinates
    // to enumerate the to/from coordinates in both senses
    // but we can reduce from 88 to 22 bytes by storing a list of
    // squares you can't move north from (or south to), and likewise west from (or east to)
    blocked = [
        // can't move north from here (or south into here)
        [
            {lon: 40, lat: 35},
            {lon: 39, lat: 35},
            {lon: 38, lat: 35},
            {lon: 35, lat: 36},
            {lon: 34, lat: 36},
            {lon: 22, lat: 3},
            {lon: 15, lat: 6},
            {lon: 14, lat: 7},
            {lon: 19, lat: 3}
        ],
        // can't move west from here (or east into here)
        [
            {lon: 35, lat: 33},
            {lon: 14, lat: 7},
        ]
    ],
    players = [
        {
            key: 'german',  unit: 'CORPS', color: '0C', homedir: Direction.west,
            supply: {
                sea: 1, replacements: 0, maxfail: [24, 0, 16], freeze: 1,
            }
        },
        {
            key: 'russian', unit: 'ARMY',  color: '46', homedir: Direction.east,
            supply: {
                sea: 0, replacements: 2, maxfail: [24, 24, 24], freeze: 0,
            }
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
    /*
    The game map is represented as binary data using one byte per square at offset 0x6500
    the original encoding uses the high two bits to select the foreground color
    and the low six bits to choose a character from a set of 64 custom characters.
    in fact the top and bottom halves of the map use slightly different character sets and color scheme.

    Since not all bit patterns are used (the high two bits are nearly redundant),
    we can store exactly the same raw binary data using a custom base64(ish) encoding
    (for north and south) and then represent the map with a human-readable string.

    North and south parts of map are encoded from 6-bit hex to ascii
    with pipe-delimited blocks of chrs for consecutive terrain types
    */
    mapencoding = [
        ' |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQR|{}??|~#',
        ' |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUVW|{}<??|~#'
    ].map((enc, i) => {
        // convert the encoding table into a lookup of char => [icon, terraintype, alt-flag]
        let lookup = {}, ch=0;
        enc.split('|').forEach((s, t) =>
            s.split('').forEach(c => {
                let alt = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                if (ch==0x40) ch--;
                lookup[c] = {
                    icon: 0x80 + i * 0x40 + ch++,
                    terrain: t,
                    alt: alt
                };
            })
        );
        return lookup;
    }),
    /*
    The full map is 48 x 41, including the impassable border.
    However most game logic use  a lat/lon coord system
    with (0,0) in the bottom right corner *excluding* the border.
    Thus the internal map has longitudes 0-45 and latitudes 0-38.
    Ihe first 25 rows (incl border) are mapped with a northern charset
    which mainly uses forest rather than the mountains of the southern charset
    */
    mapascii = `
################################################
#~~~A        L~~B                              #
#~~~GJ   MNPONK{H                              #
#~~~~GPOQ~~IH@om                               #
#~~~~~IDEF{}v;f.        ow nrtx                #
#~~~~~C   RJj:g15       fcsl  dqw    nv        #
#~~~~~B   LBe.h26       i      nz* oskcrw      #
#~~~~~GJ   Hg,i31              gcrqm   0dx     #
#~~~~~~A      j43             ol         g     #
#~~ID~~B*     f 2       2     h          btqy  #
#~~B KE}qrw             1     i            nk  #
#~~A      av     om   0   $  nk            g   #
#~~C       bsx  nl     36    j             e   #
#~~GJ        ctuk   2i412pusqm             h   #
#~~~B              ntk 34f                nl   #
#~~I}rqsv   265  oul@ 16 e  j             i$   #
#~IH    ct 1431 pm          i             f    #
#EH        26$ .h,          aty          pm    #
#        135   :bw;      @    h0         j     #
#       26    ;,:dy           cw         h     #
#x0     54  ,.:;. j            g         g     #
#dw     31  ;quw:,f       h    bsv       i     #
# ay   346 ,.:;crxi       cx     dx      f     #
#  g   25,:;,.,:.dz        i      auqsrx j     #
# nl     .,;:.   ,f       $f           e@aqrtw #
#ki       :      @g        bw          g     bx#
#16               ans       dnmolnr    f      d#
#2534               cmp           cop jh       #
#  1563  ns   nq      blr          ktmi        #
#    4315 cq   dop      doq       ji           #
#     246  amnlr als      ap     kh            #
#      135     bp  cr     *e   NC<0            #
#       264     ds  bq    kh ODHPL             #
#        516 r   aq  dp   g MI~QK              #
#        1243bs   cr0 e  ji B~~FR              #
#        53621aq   d{C}DE<TJ~~~PL $jlonq       #
#  451523614562cp  NH~~~PKUVVWASkomh   f       #
#  5364142 3416 d{EI~~~~FR  NH~G}DER           #
#               OJ~~~~~~~GSMI~~~~~~GCS542361621#
#               B~~~~~~~~~FJ~~~~~~~~~FDES123433#
################################################
`,
    // decode the map into a 2-d array of rows x cols of  {lon: , lat:, icon:, terrain:, alt:}
    mapdata = mapascii.split(/\n/).slice(1,-1).map(
            (row, i) =>
            row.split('').map(
                c => Object.assign({}, mapencoding[i <= 25 ? 0: 1][c])
            )
        ),
    maxlon = mapdata[0].length-2,
    maxlat = mapdata.length-2,
    // order-of-battle table with 159 units (55 german) comes from D.ASM:0x5400
    // in the original game each column is stored separately,
    // we've transposed into a list of rows which we map to unit objects
    oobdata = [
        // CORPSX, CORPSY, MSTRNG, SWAP, ARRIVE, CORPT, CORPNO
        // German
        [0, 0, 0, 0, 255, 0, 0],
        [40, 20, 203, 126, 0, 3, 24],
        [40, 19, 205, 126, 255, 3, 39],
        [40, 18, 192, 126, 0, 3, 46],
        [40, 17, 199, 126, 0, 3, 47],
        [40, 16, 184, 126, 0, 3, 57],
        [41, 20, 136, 125, 0, 0, 5],
        [40, 19, 127, 125, 0, 0, 6],
        [41, 18, 150, 125, 0, 0, 7],
        [41, 17, 129, 125, 0, 0, 8],
        [41, 16, 136, 125, 0, 0, 9],
        [42, 20, 109, 125, 255, 0, 12],
        [42, 19, 72, 125, 255, 0, 13],
        [42, 18, 70, 125, 255, 0, 20],
        [42, 17, 81, 125, 255, 0, 42],
        [43, 19, 131, 125, 255, 0, 43],
        [43, 18, 102, 125, 255, 0, 53],
        [43, 17, 53, 125, 255, 64, 3],
        [41, 23, 198, 126, 0, 3, 41],
        [40, 22, 194, 126, 0, 3, 56],
        [40, 21, 129, 125, 0, 0, 1],
        [41, 21, 123, 125, 0, 0, 2],
        [41, 22, 101, 125, 0, 0, 10],
        [42, 22, 104, 125, 0, 0, 26],
        [42, 23, 112, 125, 0, 0, 28],
        [42, 24, 120, 125, 0, 0, 38],
        [40, 15, 202, 126, 0, 3, 3],
        [41, 14, 195, 126, 0, 3, 14],
        [42, 13, 191, 126, 0, 3, 48],
        [41, 15, 72, 126, 255, 3, 52],
        [42, 14, 140, 125, 0, 0, 49],
        [42, 12, 142, 125, 0, 0, 4],
        [43, 13, 119, 125, 0, 0, 17],
        [41, 15, 111, 125, 0, 0, 29],
        [42, 16, 122, 125, 255, 0, 44],
        [43, 16, 77, 125, 255, 0, 55],
        [30, 2, 97, 125, 0, 48, 1],
        [30, 3, 96, 125, 0, 48, 2],
        [31, 4, 92, 125, 0, 48, 4],
        [33, 6, 125, 125, 0, 0, 11],
        [35, 7, 131, 125, 0, 0, 30],
        [37, 8, 106, 125, 0, 0, 54],
        [35, 38, 112, 125, 0, 32, 2],
        [36, 37, 104, 125, 0, 32, 4],
        [36, 38, 101, 125, 255, 32, 6],
        [45, 20, 210, 126, 2, 3, 40],
        [45, 15, 97, 125, 255, 0, 27],
        [38, 8, 98, 126, 2, 83, 1],
        [45, 16, 95, 125, 5, 0, 23],
        [31, 1, 52, 125, 6, 48, 5],
        [45, 20, 98, 125, 9, 0, 34],
        [45, 19, 96, 125, 10, 0, 35],
        [32, 1, 55, 125, 11, 64, 4],
        [45, 17, 104, 125, 20, 0, 51],
        [45, 18, 101, 126, 24, 7, 50],
        // Russian
        [29, 32, 100, 253, 4, 4, 7],
        [27, 31, 103, 253, 5, 4, 11],
        [24, 38, 110, 253, 7, 0, 41],
        [23, 38, 101, 253, 9, 0, 42],
        [20, 38, 92, 253, 11, 0, 43],
        [15, 38, 103, 253, 13, 0, 44],
        [0, 20, 105, 253, 7, 0, 45],
        [0, 8, 107, 253, 12, 0, 46],
        [0, 18, 111, 253, 8, 0, 47],
        [0, 10, 88, 253, 10, 0, 48],
        [0, 14, 117, 254, 10, 1, 9],
        [0, 33, 84, 254, 14, 1, 13],
        [0, 11, 109, 254, 15, 1, 14],
        [0, 15, 89, 254, 16, 1, 15],
        [0, 20, 105, 254, 18, 1, 16],
        [0, 10, 93, 254, 7, 2, 7],
        [21, 28, 62, 254, 0, 1, 2],
        [21, 27, 104, 253, 0, 0, 19],
        [30, 14, 101, 253, 0, 0, 18],
        [30, 13, 67, 254, 0, 2, 1],
        [39, 28, 104, 253, 0, 0, 27],
        [38, 28, 84, 254, 0, 1, 10],
        [23, 31, 127, 253, 0, 0, 22],
        [19, 24, 112, 253, 0, 0, 21],
        [34, 22, 111, 253, 0, 0, 13],
        [34, 21, 91, 254, 0, 1, 6],
        [31, 34, 79, 253, 0, 4, 9],
        [27, 6, 69, 253, 0, 0, 2],
        [33, 37, 108, 253, 0, 4, 1],
        [41, 24, 118, 253, 0, 0, 8],
        [40, 23, 137, 253, 0, 0, 11],
        [39, 23, 70, 254, 0, 1, 1],
        [42, 25, 85, 254, 0, 1, 7],
        [39, 20, 130, 253, 0, 0, 3],
        [39, 22, 91, 253, 0, 0, 4],
        [39, 18, 131, 253, 0, 0, 10],
        [39, 17, 71, 254, 0, 1, 5],
        [39, 21, 86, 254, 0, 1, 8],
        [37, 20, 75, 254, 0, 2, 3],
        [39, 19, 90, 254, 0, 2, 6],
        [39, 16, 123, 253, 0, 0, 5],
        [39, 15, 124, 253, 0, 0, 6],
        [40, 14, 151, 253, 0, 0, 12],
        [41, 13, 128, 253, 0, 0, 26],
        [41, 12, 88, 254, 0, 1, 3],
        [39, 11, 77, 254, 0, 1, 4],
        [36, 9, 79, 254, 0, 1, 11],
        [34, 8, 80, 254, 0, 2, 5],
        [32, 6, 126, 253, 0, 0, 9],
        [35, 9, 79, 254, 0, 1, 12],
        [30, 4, 91, 254, 0, 2, 4],
        [28, 2, 84, 254, 0, 2, 2],
        [25, 6, 72, 253, 1, 0, 7],
        [29, 14, 86, 253, 1, 4, 2],
        [32, 22, 76, 253, 1, 0, 14],
        [33, 36, 99, 253, 1, 4, 4],
        [26, 23, 67, 253, 1, 0, 15],
        [21, 8, 78, 253, 2, 0, 16],
        [29, 33, 121, 253, 2, 0, 20],
        [0, 28, 114, 253, 2, 0, 6],
        [28, 30, 105, 253, 3, 0, 24],
        [21, 20, 122, 253, 3, 0, 40],
        [21, 28, 127, 253, 4, 0, 29],
        [21, 33, 129, 253, 4, 0, 30],
        [20, 27, 105, 253, 5, 0, 31],
        [20, 30, 111, 253, 5, 0, 32],
        [12, 8, 112, 253, 6, 0, 33],
        [0, 10, 127, 253, 6, 0, 37],
        [0, 32, 119, 253, 7, 0, 43],
        [0, 11, 89, 253, 8, 0, 49],
        [0, 25, 108, 253, 8, 0, 50],
        [0, 12, 113, 253, 8, 0, 52],
        [0, 23, 105, 253, 9, 0, 54],
        [0, 13, 94, 253, 9, 0, 55],
        [21, 29, 103, 254, 5, 114, 1],
        [25, 30, 97, 253, 5, 0, 34],
        [0, 31, 108, 253, 2, 112, 1],
        [0, 15, 110, 253, 9, 112, 2],
        [0, 27, 111, 253, 10, 112, 3],
        [0, 17, 96, 253, 10, 112, 4],
        [0, 25, 109, 253, 6, 0, 39],
        [0, 11, 112, 253, 11, 0, 59],
        [0, 23, 95, 253, 5, 0, 60],
        [0, 19, 93, 253, 17, 0, 61],
        [0, 21, 114, 254, 2, 114, 2],
        [0, 33, 103, 254, 11, 1, 1],
        [0, 28, 107, 254, 20, 113, 1],
        [0, 13, 105, 253, 21, 112, 5],
        [0, 26, 92, 254, 22, 1, 2],
        [0, 10, 109, 253, 23, 112, 6],
        [0, 29, 101, 254, 24, 1, 3],
        [0, 35, 106, 254, 26, 1, 4],
        [0, 27, 95, 253, 28, 0, 38],
        [0, 15, 99, 254, 30, 0, 36],
        [38, 30, 101, 253, 2, 0, 35],
        [21, 22, 118, 253, 3, 0, 28],
        [12, 8, 106, 253, 3, 0, 25],
        [20, 13, 112, 253, 3, 0, 23],
        [21, 14, 104, 253, 3, 0, 17],
        [20, 28, 185, 253, 6, 4, 8],
        [15, 3, 108, 253, 6, 4, 10],
        [21, 3, 94, 253, 4, 4, 3],
        [20, 3, 102, 253, 4, 4, 5],
        [19, 2, 98, 253, 4, 4, 6],
    ];


function anticColor(v) {
    return anticPaletteRGB[Math.floor(parseInt(v, 16)/2)];
}

export {
    directions, Direction,
    blocked,
    players, Player,
    cities,
    leveldata, Level,
    terraintypes, Terrain,
    weatherdata, Weather,
    waterstate, Water,
    monthdata, Month,
    mapdata, maxlon, maxlat,
    oobdata,
    anticColor,
    spiral1, //TODO remove
};


