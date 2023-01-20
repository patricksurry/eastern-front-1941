## Code structure

### Fonts

The original game uses Atari's builtin [atascii][atascii] font for text,
two custom 64 character fonts to display the northern and southern parts of the map,
as well as several additional custom sprite characters for the movement arrows and [maltakreuze][maltakreuze].
The game dynamically also changes the foreground and background colors as the seasons change
and to distinguish Russian from German units and cities.
The images below show all the characters used in the APX and cartridge versions respectively,
with the builtin characters in the top half, the custom map characters in the bottom half
(note the trees vs mountains and differences in river and coastline shapes),
plus the extra sprite characters at the bottom.
The cartridge version (right) drops one coastline character in favor of the new Flieger unit.

<p align="center">
    <img src="images/fontapx.png" width=384>
    &nbsp;&nbsp;
    <img src="images/fontcart.png" width=384>
</p>

One of my first challenges was to preserve that look using some combination of HTML, SVG and CSS.
After a few false starts, I discovered I could use an image with transparent background as a CSS `mask-image`
to cut from a square filled with foreground color, and stack that on a square filled with background color.
Thus each character is a `div.chr` containing a `div.fg-chr` atop a `div.bg-chr` as shown below.
We cut out the character we want by masking with a single image sprite containing all the characters
and setting an appropriate `mask-position`.

<p align="center"><img src="images/chr-mask.png" width=800></p>

### The map

The [original map][apxmapdata] is stored as 8-bit binary data with one byte per map square.
The lower six bits index into one the custom north or south font based on the square's latitude,
with the two upper bits choosing the color channel.
(The cartridge goes an extra step with a custom run-length coding but unpacks to essentially the same thing.)
Including the raw map data as a base64'd binary blob or whatever seemed like a cop out,
so I took a detour to re-encode using a custom base65 mapping
where each terrain type maps to a group of related printable characters:
space for clear, numbers for trees/mountains, upper and lowercase letters for coastlines and rivers respectively, and so on.
That makes the [javascript map data][jsmapdata] much more accessible and (if we're careful) even editable?!

<p align="center"><img src="images/asciimap.png" width=800></p>

slight differences between the APX map (pictured) and the cartridge version

[atascii]: https://en.wikipedia.org/wiki/ATASCII
[maltakreuze]: https://en.wikipedia.org/wiki/Maltese_cross
[apxmapdata]: https://github.com/patricksurry/eastern-front-1941/blob/main/refdata/apxdump.asm#L1527
[jsmapdata]: https://github.com/patricksurry/eastern-front-1941/blob/main/static/data.js#L202


### Disassembly

    python ../pydisass6502/disass.py -i apxdump.dat -o apxdump.asm -e apxdump.map.json -c apxdump.stats -m ../pydisass6502/lib/atari-mapping.json

    python ../pydisass6502/disass.py -i cartridge.rom -o cartridge.asm -e cartridge.map.json -c cartridge.stats -m ../pydisass6502/lib/atari-mapping.json


### Additions, changes and observations

- unit paths
- unit reach
- why 8 order limit (just 8 x 2 bits = 2 bytes)?

- more random retreat/supply check for n/s
- do linepoints N/S at same time (one rotartion vs three)

notes, fun discoveries

  - bug in expert'42: finns seem often fail initial supply check - seems like TERRB reports an enemy unit in (at least) $24 $25 $26, $2f = lat: 36 - 38, lon: 47 when checking Zoc around the boundary square


- random walk for supply check is a nice solution

- why is Sevastpol listed as a scoring city in APX version but not represented on the map in either version?

- unused unit types: ASM vs Cart, injects other words in gaps, reorders second group

hi nibble:
        "        ",        "",
x       "SS      ",        ["CORPS",]
        "FINNISH ",        "FINNISH",
        "RUMANIAN",        "RUMANIAN",
        "ITALIAN ",        "ITALIAN",
        "HUNGARAN",        "HUNGARIAN",
x        "MOUNTAIN",       ["ARMY",]
        "GUARDS  ",        "GUARDS",

lo nibble:
        "INFANTRY",        "INFANTRY",   0000     inf
        "TANK    ",        "MILITIA",    0001     inf
        "CAVALRY ",        ["MUSTER",]   0010    [fly]
        "PANZER  ",        "FLIEGER",    0011     fly
        "MILITIA ",        "PANZER",     0100   armor
x        "SHOCK   ",       "TANK",       0101   armor
x        "PARATRP ",       "CAVALRY",    0110   armor
        "PZRGRNDR",       ["COMBAT",]    0111  [armor]

cart uses low nibble for second name and infer icon/unit type
high nibble low 3 bits gives first word, high bit gives player (0=german, 1=russian)

- APX version allows attacker response even if the defender attack breaks it, cart adds `bcc ATAKR / jmp ENDCOM`

- APX gives MSTRNG+2 to russian in supply via `inc MSTRNG,x`, cart doesn't

- APX has fixed damage 1/5; cart is variable

- possible APX bugs, e.g. freezing Kerch straits, the corps,x/y issue differs in binary, notes (2 versions?)

    "russian units would advance into better positions during the retreat phase" bug mentioned in the [Opponents Undaunted][cpw120] piece in this old Computer Gaming world piece pdf p32-33

[cpw120]: https://www.cgwmuseum.org/galleries/issues/cgw_120.pdf

- cartridge bug - TERRTY should shift estuary check one down

- overlapping data structures, phantom offsets

- on new turn, cartridge verifies 256 byte checksum of NEWTRN routine = #$8e, otherwise
  resurrects last defender?

    _NXTTRN_1:  clc                              ; be28 18
                adc NEWTRN,x                     ; be29 7da7bb
                inx                              ; be2c e8
                bne _NXTTRN_1                    ; be2d d0f9
                cmp #$8e                         ; be2f c98e    Checksum of 256 bytes from NEWTRN is 8e, but why check ROM?
                beq _NXTTRN_2                    ; be31 f005
                ldx DEFNDR                       ; be33 a6ad
                jsr SETSWTCH                     ; be35 2081bf  . SETCHYX and SWITCH
    _NXTTRN_2:  ldx #$a6                         ; be38 a2a6


- cartridge changes
    - refactoring w subroutines
    - difficulty level, start date
    - flieger units, difficulty levels (vs handicap)
    - fogofwar using code as seed
    - attack even if defender wins first?




anatomy of a bug

from apx disassembly preparing for defender strike

```asm
            jsr SWITCH      ; 4f23 20ef79  replace original unit character
            ldx DEFNDR      ; 4f26 a6c4
            pla             ; 4f28 68
            sta SWAP,x      ; 4f29 9d7c56  . terrain code underneath unit
            jsr TERRTY      ; 4f2c 206973  . convert map chr in TRNCOD -> TRNTYP, also y reg
            ldx DEFNC,y     ; 4f2f beb479
            lda CSTRNG,y    ; 4f32 b9dd55  <= indexing OoB via terrain type instead of defender?
            lsr             ; 4f35 4a      adjust for terrain, max 255
_COMBAT_5:  dex             ; 4f36 ca
            beq _COMBAT_6   ; 4f37 f005
            rol             ; 4f39 2a
            bcc _COMBAT_5   ; 4f3a 90fa
            lda #$ff        ; 4f3c a9ff
_COMBAT_6:  ldx HMORDS,y    ; 4f3e be755d  now adjust for defender's motion [y still wrong?]
            beq DOBATL      ; 4f41 f001
            lsr             ; 4f43 4a      penalty if moving
DOBATL:     cmp  RANDOM     ; 4f44 cd0ad2  evaluate defender's strike
```

from EFT18C.ASM

```asm
1560  JSR SWITCH
1570  LDX DEFNDR
1580  PLA
1590  STA SWAP,X
1600 ;
1610 ;
1620  JSR TERRTY terrain in defender's square
1630  LDX DEFNC,Y defensive bonus factor
1640  LDA CSTRNG,Y defender's strength         <= still broken
1650  LSR A
1660 Y15 DEX adjust for terrain
1670  BEQ Y16
1680  ROL A
1690  BCC Y15
1700  LDA #$FF
1710 ;
1720 ;now adjust for defender's motion
1730 ;
1740 Y16 LDX HMORDS,Y
1750  BEQ DOBATL
1760  LSR A
1770 ;
1780 ;evaluate defender's strike
1790 ;
1800 DOBATL CMP RANDOM
```

<p align="center"><img src="images/defenderbug.png" width=800></p>

cartridge version
```asm
            ldx DEFNDR       ; ad02 a6ad
            jsr SETSWTCH     ; ad04 2081bf  SETCHYX and SWITCH
            pla              ; ad07 68
            sta SWAP,x       ; ad08 9d8331  terrain code underneath unit
            jsr FLGRBRK      ; ad0b 2028ae  Fliegerkorps break and suffer 75% loss
            jsr TERRTY       ; ad0e 20c8b8  convert map chr in TRNCOD -> TRNTYP and y, LAT -> x
            ldx DEFNC,y      ; ad11 be71a0
            lda LEVEL        ; ad14 a592    Level learner/beginner/intermediate/advanced/expert
            cmp #$04         ; ad16 c904
            bne _COMBAT_5    ; ad18 d001
            inx              ; ad1a e8      Double defense in expert mode
_COMBAT_5:  ldy DEFNDR       ; ad1b a4ad
            lda CSTRNG,y     ; ad1d b92b32  <= combat strength fixed
            lsr              ; ad20 4a
_COMBAT_6:  dex              ; ad21 ca
            beq _COMBAT_7    ; ad22 f005
            rol              ; ad24 2a
            bcc _COMBAT_6    ; ad25 90fa
            lda #$ff         ; ad27 a9ff
_COMBAT_7:  ldx HMORDS,y     ; ad29 bed232  how many orders queued for each unit
```



## Useful resources

- The original source for the [APX binaries][apxbinary] and the [cartrige edition][cartbinary]

- There are a bunch of useful YouTube videos with emulator(?) playthroughs of
  both the APX and cartridge versions of the game.
  I did some useful QA with this hour-long [APX video][apxvideo].

- I learned more details than I wanted to about Atari internals from this exhaustive [technical reference][atariref],
 though it brought back happy memories of hacking Apple //e assembler.  The [Atari memory map][atarimap]
 was also invaluable.

- Ingo Hinterding's [6502 disassembler][6502disass] got me interested in exploring the differences between
  the APX and cartridge editions, and led to a bunch of [enhancements][6502pds].
  Nick Morgan's [6502 simulator][6502sim] was handy to understand some of the more gnarly code fragments,
  like the new integer division routine :facepalm:.



convert -density 300 APX_Eastern_Front_1941.pdf -quality 90 apxdoc%02d.jpg

for i in 07 08 09 10 11 12 13 14 15 16 17 18; do echo $i; tesseract apxdoc$i.jpg - >> apxdoc.txt; done

variants/easter eggs
https://www.digitpress.com/eastereggs/a48easternfront.htm


6502 simulator in python (e.g. scripts/cart.cmd, scripts/apx.cmd)
https://github.com/mnaberez/py65/

Atari Emulator for OS X including debugging monitor.  run cartridge.rom binary directly
https://www.atarimac.com/atari800macx.php


[apxvideo]: https://www.youtube.com/watch?v=MOV5C_wvP4o
[apxbinary]: http://www.atarimania.com/game-atari-400-800-xl-xe-eastern-front-1941_1791.html
[cartbinary]: http://www.atarimania.com/game-atari-400-800-xl-xe-eastern-front-1941_5986.html
[atariref]: http://data.atariwiki.org/DOC/Atari_400-800_Technical_Reference_Notes-Operating_System_User_s_Manual-Operating_System_Source_Listing_and_Hardware_Manual_553_pages.pdf
[atarimap]: https://www.atariarchives.org/mapping/memorymap.php
[6502disass]: https://github.com/Esshahn/pydisass6502
[6502pds]: https://github.com/patricksurry/pydisass6502
[6502sim]: https://skilldrick.github.io/easy6502/

