import {Point, PlayerKey} from './defs';
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

The full map is 48 x 41, including the impassable border.
However most game logic use a lat/lon coord system
with (0,0) in the bottom right corner *excluding* the border.
Thus the internal map has longitudes 0-45 and latitudes 0-38.
Ihe first 25 rows (incl border) are mapped with a northern charset
which mainly uses forest rather than the mountains of the southern charset
*/
type City = Point & {owner: PlayerKey, points: number, label: string};
type MapVariant = {
    font: string, encoding: readonly [string, string], ascii: string, cities: readonly City[]
} ;
const enum MapVariantKey {apx, cart};
const mapVariants: Record<MapVariantKey, MapVariant> = {
    [MapVariantKey.apx]: {
        font: 'apx',
        encoding: [
            ' |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQR|{}??|~#',
            ' |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUVW|{}<??|~#'
        ],
        ascii: `
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
        // M.ASM:8630 MPTS / MOSCX / MOSCY - special city victory points; updated in CITYxxx for CART
        // oddly Sevastpol is assigned points but is not coded as a city in either version of the map?
        //TODO  create a variant that replaces F => @ in the bottom row of the map, and adds to city list
        cities: [
            {owner: PlayerKey.Russian, lon: 20, lat: 28, points: 20, label: 'Moscow'},
            {owner: PlayerKey.Russian, lon: 33, lat: 36, points: 10,  label: 'Leningrad'},
            {owner: PlayerKey.Russian, lon: 6,  lat: 15, points: 10,  label: 'Stalingrad'},
            {owner: PlayerKey.Russian, lon: 12, lat:  4, points: 0,  label: 'Krasnodar'},   // APX all others zero except Sevastopol
            {owner: PlayerKey.Russian, lon: 13, lat: 33, points: 0,  label: 'Gorky'},
            {owner: PlayerKey.Russian, lon: 7,  lat: 32, points: 0,  label: 'Kazan'},
            {owner: PlayerKey.Russian, lon: 38, lat: 30, points: 0,  label: 'Riga'},
            {owner: PlayerKey.Russian, lon: 24, lat: 28, points: 0,  label: 'Rzhev'},
            {owner: PlayerKey.Russian, lon: 26, lat: 24, points: 0,  label: 'Smolensk'},
            {owner: PlayerKey.Russian, lon: 3,  lat: 24, points: 0,  label: 'Kuibishev'},
            {owner: PlayerKey.Russian, lon: 33, lat: 22, points: 0,  label: 'Minsk'},
            {owner: PlayerKey.Russian, lon: 15, lat: 21, points: 0,  label: 'Voronezh'},
            {owner: PlayerKey.Russian, lon: 21, lat: 21, points: 0,  label: 'Orel'},
            {owner: PlayerKey.Russian, lon: 20, lat: 15, points: 0,  label: 'Kharkov'},
            {owner: PlayerKey.Russian, lon: 29, lat: 14, points: 0,  label: 'Kiev'},
            {owner: PlayerKey.Russian, lon: 12, lat:  8, points: 0,  label: 'Rostov'},
            {owner: PlayerKey.Russian, lon: 20, lat:  8, points: 0,  label: 'Dnepropetrovsk'},
            {owner: PlayerKey.Russian, lon: 26, lat:  5, points: 0,  label: 'Odessa'},
            {owner: PlayerKey.German,  lon: 44, lat: 19, points: 0,  label: 'Warsaw'},
    //        {owner: PlayerKey.Russian, lon: 20, lat:  0, points: 10,  label: 'Sevastopol'},
        ]
    },
    [MapVariantKey.cart]: {
        font: 'cart',
        encoding: [
            " |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQ|{}???|~#",
            " |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUV|{}<???|~#"
        ],
        ascii: `
################################################
#~~~A        L~~B                              #
#~~~GJ   MNPONK{H                              #
#~~~~GPOO~~IH0om                               #
#~~~~~IDEF{}v;f.        ow nrtx                #
#~~~~~C   QJj:g15       fcsl  dqw    nv        #
#~~~~~B   LBe.h26       i      nz* oskcrw      #
#~~~~~GJ   Hg,i31              gcrqm   @dx     #
#~~~~~~A      j43             ol         g     #
#~~ID~~B*     f 2       2     h          btqy  #
#~~B KE}qrw             1     i            nk  #
#~~A      av     om   @   $  nk            g   #
#~~C       bsx  nl     36    j             e   #
#~~GJ        ctuk   2i412pusqm             h   #
#~~~B              ntk 34f                nl   #
#~~I}rqsv   265  oul@ 16 e  j             i*   #
#~IH    ct 1431 pm          i             f    #
#EH        26@ .h,          aty          pm    #
#        135   :bw;      @    h*         j     #
#       26    ;,:dy           cw         h     #
#x@     54  ,.:;. j            g         g     #
#dw     31  ;quw:,f       h    bsv       i     #
# ay   346 ,.:;crxi       cx     dx      f     #
#  g   25,:;,.,:.dz        i      auqsrx j     #
# nl     .,;:.   ,f       *f           e0aqrtw #
# i       :      @g        bw          g     bx#
#16               ans       dnmolnr    f      d#
#2534               cmp           cop jh       #
#  1563  ns   nq      blr          ktmi        #
#    4315 cq   dop      doq       ji           #
#     246  amnlr als      ap     kh            #
#      135     bp  cr     *e   NC<@            #
#       264     ds  bq    kh ODHPL             #
#        516 r   aq  dp   g MI~QK              #
#        1243bs   cr* e  ji B~~FR              #
#        53621aq   d{C}DE<TJ~~~PL 0jlonq       #
#  451523614562cp  NH~~~PKUVVVASkomh   f       #
#  5364142 3416 d{EI~~~~FR  NH~G}DER           #
#               OJ~~~~~~~GSMI~~~~~~GCS542361621#
#               B~~~~~~~~~FJ~~~~~~~~~FDES123433#
################################################
`,
        // M.ASM:8630 MPTS / MOSCX / MOSCY - special city victory points; updated in CITYxxx for CART
        // oddly Sevastpol is assigned points but is not coded as a city in either version of the map?
        //TODO  create a variant that replaces F => @ in the bottom row of the map, and adds to city list
        cities: [
            {owner: PlayerKey.Russian, lon: 20, lat: 28, points: 10, label: 'Moscow'},
            {owner: PlayerKey.Russian, lon: 33, lat: 36, points: 5,  label: 'Leningrad'},
            {owner: PlayerKey.Russian, lon: 6,  lat: 15, points: 5,  label: 'Stalingrad'},
            {owner: PlayerKey.Russian, lon: 12, lat:  4, points: 5,  label: 'Krasnodar'},
            {owner: PlayerKey.Russian, lon: 13, lat: 33, points: 5,  label: 'Gorky'},
            {owner: PlayerKey.Russian, lon: 7,  lat: 32, points: 5,  label: 'Kazan'},
            {owner: PlayerKey.Russian, lon: 38, lat: 30, points: 2,  label: 'Riga'},
            {owner: PlayerKey.Russian, lon: 24, lat: 28, points: 2,  label: 'Rzhev'},
            {owner: PlayerKey.Russian, lon: 26, lat: 24, points: 2,  label: 'Smolensk'},
            {owner: PlayerKey.Russian, lon: 3,  lat: 24, points: 5,  label: 'Kuibishev'},
            {owner: PlayerKey.Russian, lon: 33, lat: 22, points: 2,  label: 'Minsk'},
            {owner: PlayerKey.Russian, lon: 15, lat: 21, points: 2,  label: 'Voronezh'},
            {owner: PlayerKey.Russian, lon: 21, lat: 21, points: 2,  label: 'Orel'},
            {owner: PlayerKey.Russian, lon: 20, lat: 15, points: 2,  label: 'Kharkov'},
            {owner: PlayerKey.Russian, lon: 29, lat: 14, points: 2,  label: 'Kiev'},
            {owner: PlayerKey.Russian, lon: 12, lat:  8, points: 2,  label: 'Rostov'},
            {owner: PlayerKey.Russian, lon: 20, lat:  8, points: 2,  label: 'Dnepropetrovsk'},
            {owner: PlayerKey.Russian, lon: 26, lat:  5, points: 2,  label: 'Odessa'},
            {owner: PlayerKey.German,  lon: 44, lat: 19, points: 0,  label: 'Warsaw'},
    //        {owner: PlayerKey.Russian, lon: 20, lat:  0, points: 5,  label: 'Sevastopol'},
        ]
    },
 } as const;

// D.ASM:5500 BHX1 .BYTE ... / BHY1 / BHX2 / BHY2
// there are 11 impassable square-sides
// the original game stores 22 sets of (x1,y1),(x2,y2) coordinates
// to enumerate the to/from coordinates in both senses
// but we can reduce from 88 to 22 bytes by storing a list of
// squares you can't move north from (or south to), and likewise west from (or east to)
const blocked: readonly [ readonly Point[], readonly Point[]] = [
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
    ] as const;

export {mapVariants, MapVariantKey, blocked};
