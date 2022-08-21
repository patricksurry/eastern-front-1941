# eastern-front-1941
JS / CSS port of Chris Crawford's Eastern Front 1941


this is a port of the published APX source code https://en-academic.com/dic.nsf/enwiki/1159488


startup vector @ $fffc

http://www.atarimania.com/game-atari-400-800-xl-xe-eastern-front-1941_1791.html




python ../pydisass6502/disass.py -i apxdump.dat -o apxdump.asm -e apxdump.map.json -nc

python ../pydisass6502/disass.py -i cartridge.rom -o cartridge.asm -e cartridge.map.json -nc


Atari tech ref

http://data.atariwiki.org/DOC/Atari_400-800_Technical_Reference_Notes-Operating_System_User_s_Manual-Operating_System_Source_Listing_and_Hardware_Manual_553_pages.pdf
