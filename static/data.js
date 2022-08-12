function enumFor(vs, key) {
    return Object.fromEntries(vs.map((v, i) => [v[key || 'key'], i]));
}

const
    // Antic NTSC palette via https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#NTSC
    // 128 colors indexed via high 7 bits, e.g. 0x00 and 0x01 refer to the first entry
    colormap = ["#000000",  "#404040",  "#6c6c6c",  "#909090",  "#b0b0b0",  "#c8c8c8",  "#dcdcdc",  "#ececec",  "#444400",  "#646410",  "#848424",  "#a0a034",  "#b8b840",  "#d0d050",  "#e8e85c",  "#fcfc68",  "#702800",  "#844414",  "#985c28",  "#ac783c",  "#bc8c4c",  "#cca05c",  "#dcb468",  "#ecc878",  "#841800",  "#983418",  "#ac5030",  "#c06848",  "#d0805c",  "#e09470",  "#eca880",  "#fcbc94",  "#880000",  "#9c2020",  "#b03c3c",  "#c05858",  "#d07070",  "#e08888",  "#eca0a0",  "#fcb4b4",  "#78005c",  "#8c2074",  "#a03c88",  "#b0589c",  "#c070b0",  "#d084c0",  "#dc9cd0",  "#ecb0e0",  "#480078",  "#602090",  "#783ca4",  "#8c58b8",  "#a070cc",  "#b484dc",  "#c49cec",  "#d4b0fc",  "#140084",  "#302098",  "#4c3cac",  "#6858c0",  "#7c70d0",  "#9488e0",  "#a8a0ec",  "#bcb4fc",  "#000088",  "#1c209c",  "#3840b0",  "#505cc0",  "#6874d0",  "#7c8ce0",  "#90a4ec",  "#a4b8fc",  "#00187c",  "#1c3890",  "#3854a8",  "#5070bc",  "#6888cc",  "#7c9cdc",  "#90b4ec",  "#a4c8fc",  "#002c5c",  "#1c4c78",  "#386890",  "#5084ac",  "#689cc0",  "#7cb4d4",  "#90cce8",  "#a4e0fc",  "#003c2c",  "#1c5c48",  "#387c64",  "#509c80",  "#68b494",  "#7cd0ac",  "#90e4c0",  "#a4fcd4",  "#003c00",  "#205c20",  "#407c40",  "#5c9c5c",  "#74b474",  "#8cd08c",  "#a4e4a4",  "#b8fcb8",  "#143800",  "#345c1c",  "#507c38",  "#6c9850",  "#84b468",  "#9ccc7c",  "#b4e490",  "#c8fca4",  "#2c3000",  "#4c501c",  "#687034",  "#848c4c",  "#9ca864",  "#b4c078",  "#ccd488",  "#e0ec9c",  "#442800",  "#644818",  "#846830",  "#a08444",  "#b89c58",  "#d0b46c",  "#e8cc7c",  "#fce08c"],
    // mimic logic from STKTAB looking for zeroed pins
    // see https://forums.atariage.com/topic/275027-joystick-value-logic/:
    directions = [
        {x: 0,  y: 1,  key: 'north'},   // up    1110 => 0 - north
        {x: -1, y: 0,  key: 'east'},   // right 0111 => 1 - east
        {x: 0,  y: -1, key: 'south'},  // down  1101 => 2 - south
        {x: 1,  y: 0,  key: 'west'},   // left  1011 => 3 - west
    ],
    Direction = enumFor(directions),
    // D.ASM:5500 BHX1 .BYTE ... / BHY1 / BHX2 / BHY2
    // there are 11 impassable square-sides
    // the original game stores 22 sets of (x1,y1),(x2,y2) coordinates
    // to enumerate the to/from coordinates in both senses
    // but we can reduce from 88 to 22 bytes by storing a list of
    // squares you can't move north from (or south to), and likewise west from (or east to)
    blocked = [
        // can't move north from here (or south into here)
        [
            {x: 40, y: 35},
            {x: 39, y: 35},
            {x: 38, y: 35},
            {x: 35, y: 36},
            {x: 34, y: 36},
            {x: 22, y: 3},
            {x: 15, y: 6},
            {x: 14, y: 7},
            {x: 19, y: 3}
        ],
        // can't move west from here (or east into here)
        [
            {x: 35, y: 33},
            {x: 14, y: 7},
        ]
    ],
    // D.ASM:2690 TRTAB
    // M.ASM:2690 season calcs
    weatherdata = [
        {key: 'summer', earth: '10'},
        {key: 'mud',    earth: '02'},
        {key: 'snow',   earth: '0A'},
    ],
    Weather = enumFor(weatherdata),
    monthdata = [
        {label: "January",   trees: '12', weather: Weather.snow},
        {label: "February",  trees: '12', weather: Weather.snow},
        {label: "March",     trees: '12', weather: Weather.snow, rivers: "thaw"},
        {label: "April",     trees: 'D2', weather: Weather.mud},
        {label: "May",       trees: 'D8', weather: Weather.summer},
        {label: "June",      trees: 'D6', weather: Weather.summer},
        {label: "July",      trees: 'C4', weather: Weather.summer},
        {label: "August",    trees: 'D4', weather: Weather.summer},
        {label: "September", trees: 'C2', weather: Weather.summer},
        {label: "October",   trees: '12', weather: Weather.mud},
        {label: "November",  trees: '12', weather: Weather.snow, rivers: "freeze"},
        {label: "December",  trees: '12', weather: Weather.snow},
    ],
    Month = enumFor(monthdata, 'label'),
/*



SEASN1 - x40 unfrozen, x80 frozen
SEASN2 - ff fall or 00 spring - to move ICELAT north or south
SEASN3 - ff fall or 01 in spring
EARTH - color of earth by season

month 1 (jan)
    SEASN1 = x80
    SEASN2 = xff
    SEASN3 = xff
month 3 (mar):
    => thaw swamp/rivers
    ICELAT -= [7,14] incl]; clamp 1-39 incl
    small bug? freeze chrs $0B - $29 (exclusive, seems like it could freeze Kerch straight?)
month 4 (apr):
    EARTH = 2
    SEASN1 = x40
    SEASN2 = 0
    SEASN3 = 1
month 5 (may):
    EARTH = 0x10
month 10 (oct):
    EARTH = 2
month 11 (nov):
    EARTH = x0A
    => freeze swamp/rivers


M.ASM:8600 PSXVAL .BYTE $E0,0,0,$33,$78,$D6,$10,$27,$40,0,1,15,6,41,0,1

0520 XPOSL *=*+5 Horizontal position of screen window [$E0,0,0,$33,$78]
0530 TRCOLR *=*+1 [$D6]
0540 EARTH *=*+1 [$10]
0550 ICELAT *=*+1 [$27]
0560 SEASN1 *=*+1 [$40]
0570 SEASN2 *=*+1 [0]
0580 SEASN3 *=*+1 [1]
0590 DAY *=*+1  [15]  15/6/41 => 22/6/41 on first init
0600 MONTH *=*+1 [6]
0610 YEAR *=*+1 [41]
0620 BUTFLG *=*+1 [0]
0630 BUTMSK *=*+1 [1]



D.ASM:

// tree color by month EFT18D.ASM
// 2690 TRTAB    0,$12,$12,$12,$D2,$D8,$D6,$C4,$D4,$C2,$12,$12,$12


// index into TRNTAB as function of month
5430 SSNCOD .BYTE 40,40,40,20,0,0,0,0,0,20,40,40

inf * 10, armor * 10; x summer/mud/snow = 60
number of subturns (of 32 total) to enter
5440 TRNTAB .BYTE 6,12,8,0,0,18,14,8,20,128
5450  .BYTE 4,8,6,0,0,18,13,6,16,128
5460  .BYTE 24,30,24,0,0,30,30,26,28,128
5470  .BYTE 30,30,30,0,0,30,30,30,30,128
5480  .BYTE 10,16,10,12,12,24,28,12,24,128
5490  .BYTE 6,10,8,8,8,24,28,8,20,128

blocked paths - 11 pairs of X1,Y1 <=> X2,Y2 in both senses
5500 BHX1 .BYTE 40,39,38,36,35,34,22,15,15,14
5510  .BYTE 40,39,38,35,35,34,22,15,14,14,19,19
5520 BHY1 .BYTE 35,35,35,33,36,36,4,7,7,8
5530  .BYTE 36,36,36,33,37,37,3,6,7,7,4,3
5540 BHX2 .BYTE 40,39,38,35,35,34,22,15,14,14
5550  .BYTE 40,39,38,36,35,34,22,15,15,14,19,19
5560 BHY2 .BYTE 36,36,36,33,37,37,3,6,7,7
5570  .BYTE 35,35,35,33,36,36,4,7,7,8,3,4
*/
    cities = [
// M.ASM:8630 MPTS / MOSCX / MOSCY - special city victory points
// oddly Sevastpol is assigned points but is not coded as a city in the map?
        {owner: 1, x: 33, y: 36, label: 'Leningrad', points: 10},
        {owner: 1, x: 13, y: 33, label: 'Gorky'},
        {owner: 1, x: 7,  y: 32, label: 'Kazan'},
        {owner: 1, x: 38, y: 30, label: 'Riga'},
        {owner: 1, x: 24, y: 28, label: 'Rzhev'},
        {owner: 1, x: 20, y: 28, label: 'Moscow', points: 20},
        {owner: 1, x: 26, y: 24, label: 'Smolensk'},
        {owner: 1, x: 3,  y: 24, label: 'Kubyshev'},
        {owner: 1, x: 33, y: 22, label: 'Minsk'},
        {owner: 1, x: 21, y: 21, label: 'Orel'},
        {owner: 1, x: 15, y: 21, label: 'Voronezh'},
        {owner: 0, x: 44, y: 19, label: 'Warsaw'},
        {owner: 1, x: 20, y: 15, label: 'Kharkov'},
        {owner: 1, x: 6,  y: 15, label: 'Stalingrad', points: 20},
        {owner: 1, x: 29, y: 14, label: 'Kiev'},
        {owner: 1, x: 20, y:  8, label: 'Dnepropetrovsk'},
        {owner: 1, x: 12, y:  8, label: 'Rostov'},
        {owner: 1, x: 26, y:  5, label: 'Odessa'},
        {owner: 1, x: 12, y:  4, label: 'Krasnodar'},
        // replace the first F => @ in the bottom row of the map for Sevastopol variant
        //        {owner: 1, x: 20, y:  0, label: 'Sevastopol', points: 20},
    ],
    terraintypes = [
        {key: 'clear', color: '02' },          // 0 - clear
        {key: 'mountain_forest', color: '28', altcolor: 'D6'},   // 1 - mountain & forest
        {key: 'city', color: '0C', altcolor: '46'},   // 2 - city
        {key: 'frozen_swamp', color: '0C'},           // 3 - frozen swamp
        {key: 'frozen_river', color: '0C'},           // 4 - frozen river
        {key: 'swamp', color: '94'},           // 5 - swamp
        {key: 'river', color: '94'},           // 6 - river
        {key: 'coastline', color: '94'},           // 7 - coastline
        {key: 'estuary', color: '94'},           // 8 - estuary
        {key: 'impassable', color: '94', altcolor: '0C'}    // 9 - border & sea
    ],
    Terrain = enumFor(terraintypes)
    mapencoding = [
        // north and south parts of map are encoded from 6-bit hex to ascii
        // with blocks of chrs corresponding to terrain types delimited by |
        ' |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQR|{}??|~#',
        ' |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUVW|{}<??|~#'
    ].map((enc, i) => {
        // turn into a lookup of encoded char => [icon, terraintype, alt-flag]
        let lookup = {}, ch=0;
        enc.split('|').forEach((s, t) =>
            s.split('').forEach(c => {
                let alt = ((t == 1 && i == 0) || ch == 0x40) ? 1 : 0;
                if (ch==0x40) ch--;
                lookup[c] = {icon: 0x80 + i * 0x40 + ch++, terrain: t, alt: alt};
            })
        );
        return lookup;
    }),
    // Map with border is 48 x 41, coords 0-45 x 0-38 from bottom right excl boder
    // The first 25 rows (incl border) are mapped with northern charset
    mapdata = `
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
`
        .split(/\n/).slice(1,-1).map((row, i) =>
            row.split('').map((c, j) => {
                let o = Object.assign(
                    {x: 46 - j, y: 39 - i},
                    mapencoding[i <= 25 ? 0: 1][c]
                );
                if (o.terrain == 2) {
                    let city = cities.find(d => d.x == o.x && d.y == o.y);
                    if (city) o.alt = city.owner;
                }
                return o;
            })
        ),
    oob = [
        // [CORPSX, CORPSY, MSTRNG, SWAP, ARRIVE, CORPT, CORPNO
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
    ].map((vs, i) => {
        const types = ['', 'SS', 'FINNISH', 'RUMANIAN', 'ITALIAN', 'HUNGARAN', 'MOUNTAIN', 'GUARDS'],
            variants = ['INFANTRY', 'TANK', 'CAVALRY', 'PANZER', 'MILITIA', 'SHOCK', 'PARATRP', 'PZRGRNDR'];
        let u = {
            id: i,
            player: (vs[3] & 0x80) ? 1 : 0,  // german=0, russian=1; equiv i >= 55
            x: vs[0], y: vs[1],
            mstrng: vs[2], cstrng: vs[2],
            icon: vs[3] & 0x3f | 0x80,  // drop the color and address custom char pages
            arrive: vs[4],
            flags: vs[5],
            type: types[vs[5] >> 4],          // FINNISH can't attack
            variant: variants[vs[5] & 0x0f],  // MILITIA can't move
            armor: (vs[3] & 0x1) == 0,        // inf is clr | 0x3d, armor is clr | 0x3e
            unitno: vs[6],
        }
        u.label = [u.unitno, u.variant, u.type, ['CORPS', 'ARMY'][u.player]].filter(Boolean).join(' ').trim();
        return u;
    });