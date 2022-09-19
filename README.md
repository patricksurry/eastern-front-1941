Eastern Front 1941
===

A JavaScript port of Chris Crawford's [Eastern Front 1941](https://en.wikipedia.org/wiki/Eastern_Front_(1941)),
with a few optional extras.

<figure style="text-align: center; margin: 30px auto">
    <img style="border: none; margin: 0" alt="Preview" src="static/preview.png"/>
</figure>


  a port of the published APX source code


why?

one of my earliest memories of video games, and first introduction to wargaming.
friend I used to hang out with after school as a kid
had an Atari 400 iirc, not to mention an actual pong bar table :exploding_head:

Pitfall, Missile Command, Defender and a rogue-like game

fascinated to find that the source code existed, and thought would be fun
to create a more accessible port

understand how it works, appreciate the technical tour-de-force of full
interactive wargame with AI opponent in 12K (a 16K cartridge with 4K to spare),
and perhaps encourage others to experiment with AI improvements,
an AI for the Germans or even fully computer play environment.


also working on an annotated disassembly of the cartridge version to catalog differences
and offer as options here. some minor things already incorporated.
plenty of interesting stuff in there

oddly enough still haven't played an emulated version (tho consulted numerous screenshots and videos)

http://www.erasmatazz.com/library/source-code/index.html

source code package in `refdoc/EFT*.ASM` and `Eastern Front 1941 Essays.rtf`
more detailed version of essays `APX_Source_Code_for_Eastern_Front_1941_rev_2.pdf`
with AI pages extracted and reordered in `APX_Source_AI_Extract.pdf`
user manual for APX version `APX_Eastern_Front_1941.pdf`
opening APX screenshot `Ef1941scr.png` showing initial score of 12 and score shown in info rather than error window


the cartridge version map poster `Eastern_Front_1941_Atari_poster_text.pdf`
the cartridge user manual `eastern_front_atari_cartridge.pdf`


extras

notes, fun discoveries

- possible apx bugs

- variable precision division sliding scale

- cartridge chains
    - level
    - flieger units, difficulty levess (vs handicap)
    - fogofwar using code as seed
    - run length coding for map
    - attack even if defender wins first?
    - division


Useful resources
--

An hour long playthru of the APX edition https://www.youtube.com/watch?v=MOV5C_wvP4o

python ../pydisass6502/disass.py -i apxdump.dat -o apxdump.asm -e apxdump.map.json -c apxdump.stats -m ../pydisass6502/lib/atari-mapping.json

python ../pydisass6502/disass.py -i cartridge.rom -o cartridge.asm -e cartridge.map.json -c cartridge.stats -m ../pydisass6502/lib/atari-mapping.json


Resources:

APX version
http://www.atarimania.com/game-atari-400-800-xl-xe-eastern-front-1941_1791.html

cartridge download
http://www.atarimania.com/game-atari-400-800-xl-xe-eastern-front-1941_5986.html

startup vector @ $fffc


Atari tech ref

http://data.atariwiki.org/DOC/Atari_400-800_Technical_Reference_Notes-Operating_System_User_s_Manual-Operating_System_Source_Listing_and_Hardware_Manual_553_pages.pdf


Atari memory map, e.g. RANDOM

https://www.atariarchives.org/mapping/memorymap.php


6502 disassembler
https://github.com/Esshahn/pydisass6502


6502 simulator
https://skilldrick.github.io/easy6502/
