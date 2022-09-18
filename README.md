# eastern-front-1941
JS / CSS port of Chris Crawford's Eastern Front 1941


this is a port of the published APX source code https://en-academic.com/dic.nsf/enwiki/1159488


notes, fun discoveries

- possible apx bugs

- variable precision division sliding scale

- cartridge chains
    - level
    - flieger
    - fogofwar using code as seed
    - run length coding for map
    - attack even if defender wins first?
    - division



useful resources

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
