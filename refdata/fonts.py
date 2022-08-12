from base64 import b64encode
import numpy as np
from PIL import Image
import sys
from typing import List


colors = open('colormap.src').read().splitlines()[1:]
cmap = {}
i = 0
for c in colors:
    cmap[hex(256+i)[-2:].upper()] = c
    i += 16
    if i > 255:
        i = (i % 256)+2
with open('colormap.dat', 'w') as out:
    for k, v in sorted(cmap.items()):
        out.write(f'clr{k}: {v}\n')

disk = open('APX20050.ATR', 'rb').read()


def readfile(fileno, sector):
#    print(f'reading fileno {fileno} sector {sector}')
    off = 16 + (sector-1)*128
    sec = disk[off:off+128]
    fno = sec[-3] >> 2
    assert fileno == fno, f'Mismatch fileno {fileno} != {fno}'
    nxt = ((sec[-3] & 0x3) << 8) + sec[-2]
    bytes = sec[-1]
    data = sec[:bytes]
    if nxt > 0:
        data += readfile(fileno, nxt)
    return data


bits = list(reversed([1 << i for i in range(8)]))


"""
Each font has 64 chars (there is a north and south font)

https://www.atariarchives.org/c2bag/page069.php
https://en.wikipedia.org/wiki/ANTIC

An 8-bit character code implies a six bit character index (low bits)
and one of four foreground colors (two high bits), with a fixed bg color.
"""
def asciiart(bs):
    s = ''
    for b in bs:
        s += ''.join('*' if b & bit else ' ' for bit in bits) + '\n'
    return s[:-1]


def concatart(chrs):
    return '\n'.join(
        ('|' + '|'.join(rows) + '|')
        for rows in zip(*(chr.split('\n') for chr in chrs))
    )


# https://www.atariarchives.org/creativeatari/Atari_Diskfile_Tutorial_Part_III.php

# disk index at sector 360 (1-indexed), file names start at 361 offset 16+360*128 = 46096 = 0xb410
# DOS.SYS start sector 0x04, 0x27 total sectors
# AUTORUN.SYS start sector 0x2b, 0x6d total sectors

"""
000b440   \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0
           00  00  00  00  00  00  00  00  00  00  00  00  00  00  00  00
*
000b810    B   '  \0 004  \0   D   O   S                       S   Y   S
           42  27  00  04  00  44  4f  53  20  20  20  20  20  53  59  53
000b820    B   m  \0   +  \0   A   U   T   O   R   U   N       S   Y   S
           42  6d  00  2b  00  41  55  54  4f  52  55  4e  20  53  59  53
000b830    B 001  \0 230  \0   D   I   S   K   N   A   M   E   D   A   T
           42  01  00  98  00  44  49  53  4b  4e  41  4d  45  44  41  54
000b840    T   T   T   T   T   T   T   T   T   T   T   T   T   T   T   T
           54  54  54  54  54  54  54  54  54  54  54  54  54  54  54  54
*
000b890   \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0  \0
           00  00  00  00  00  00  00  00  00  00  00  00  00  00  00  00
*
"""
data = readfile(1, 0x2b)
print('Read {len(data)} bytes')

# memmap starts at address 0x4700, the 'thinking routines'
baseoff = 0x4700
memmap = data[6:]
print(data[:6])
print(memmap[:16].hex())
open('memmap.dat', 'wb').write(memmap)


"""
maltakreuze: 0x5ff7
font table: 0x6000
display list: 0x6400
arrow table: 0x6431
"""

offset = 0x6000 - baseoff
fonts = memmap[offset:offset+1024]

offset = 0x5ff7 - baseoff
specials = memmap[offset:offset+8]
offset = 0x6431 - baseoff
specials += memmap[offset:offset+32]
specials += bytes([0] * (16-5)*8)

fonts = open('atascii.dat', 'rb').read() + fonts + specials


open('fontmap.dat', 'wb').write(fonts)

print(b64encode(fonts))

sep = '-'*(9*8+1)
print(sep)
chrs = []
for row in range(0, len(fonts), 64):
    chrs += [asciiart(fonts[row+off:row+off+8]) for off in range(0, 64, 8)]
    print(concatart(chrs[-8:]))
    print(sep)

print(len(chrs))

"""
>>> np.unpackbits(np.array(list(b'\xff\xff'), dtype=np.uint8))
array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], dtype=uint8)
>>> np.unpackbits(np.array([[255, 255], [129, 129]], dtype=np.uint8))
array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
       0, 1, 1, 0, 0, 0, 0, 0, 0, 1], dtype=uint8)
>>> np.unpackbits(np.array([[255, 255], [129, 129]], dtype=np.uint8), axis=1)
array([[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
       [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1]], dtype=uint8)
"""

nc = 16
nr = len(fonts) // (8 * nc)

bitmap = np.unpackbits(
    np.array([
        [
            fonts[(r * nc + c)*8 + i]
            for c in range(nc)
        ]
        for r in range(nr) for i in range(8)
    ], dtype=np.uint8),
    axis=1,
    bitorder='big',
)
print(bitmap.shape)
print(bitmap)
rgba = np.zeros(bitmap.shape + (4,), dtype='uint8')
rgba[:, :, :] = bitmap[:, :, np.newaxis]*255
im = Image.fromarray(rgba)
#im = Image.fromarray(bitmap*255)
im.save('fontmap.png')  # base64 => url(data:image/png;base64,iVBORw...)
# im.show()
# sys.exit()

# map @ 0x64ff - 0x6d60 = 2145   46 x 40 = 1840
rows, cols = 41, 48
row_mid = 25
offset = 0x6500 - baseoff
mapdata = memmap[offset:offset+rows*cols]
sep = '\n' + ('-'*(cols*9+1)) + '\n'
poster = sep
for row in range(rows):
    cs = [
        chrs[128 + (mapdata[row*cols + col] & 0x3f) + 64*(row > row_mid)]
        for col in range(cols)
    ]
    poster += concatart(cs)
    poster += sep

open('poster.txt', 'w').write(poster)


from collections import Counter


counts = dict(Counter(mapdata))
print(len(counts))
print(counts)
print(sorted(counts.keys()))


# Create our own base-64ish encoding for the map, since only 67 distinct
# values can appear.

map64 = [
    # 0           1             2         3         4         5           6
    # 0 123456 7890   1234 56789012345678901234567890 123456789012345678 9012 3
    ' |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQR|{}??|~#',
    ' |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUVW|{}<??|~#'
]

assert all(len(set(s)) == 63 + 2 for s in map64)

# EFT18M.ASM: 8160 TERRTY
{
    "clear": 0,
    "mountain": 1,  # forest
    "city": 2,
    "frozen swamp": 3,
    "frozen river": 4,
    "swamp": 5,
    "river": 6,
    "coastline": 7,
    "estuary": 8,
    "border": 9  # and impassable
}

asciimap = '\n'.join(
    ''.join(
        map64[row > row_mid].replace('|', '')[-1 if c == 127 else c & 0x3f]
        for col in range(cols)
        for c in [mapdata[row*cols + col]]
    )
    for row in range(rows)
)

assert '?' not in asciimap
assert '|' not in asciimap

print(asciimap)


num_units = 159
offset = 0x5400 - baseoff
oob = {}
words: List[str] = []
# CORPSX,Y is map position
# M/CSTRNG is muster and current strength [skip CSTRNG initialized later]
# SWAP is icon chr
# ARRIVE is arrival turn
# CORPT is unit type (lo and hi nibble index into word lists)
# CORPNO is unit designation information only
for k in ['CORPSX', 'CORPSY', 'MSTRNG', num_units, 'SWAP', 'ARRIVE', 0x110, 'CORPT', 'CORPNO']:
    if isinstance(k, int):
        if k % 8 == 0:
            words = [
                memmap[i:i+8].decode('utf-8').strip()
                for i in range(offset, offset+k, 8)
            ]
        offset += k
        continue
    oob[k] = list(map(int, memmap[offset:offset+num_units]))
    offset += num_units

units = list(zip(*oob.values()))
with open('oob.dat', 'w') as f:
    f.write("// ['CORPSX', 'CORPSY', 'MSTRNG', 'SWAP', 'ARRIVE', 'CORPT', 'CORPNO']\n[\n")
    for u in units:
        f.write(f"    {list(u)},\n")
    f.write("]\n")
print(f"Wrote {len(units)} units to oob.dat, ending @ {hex(offset + baseoff)}")
print("Distinct CORPT flags: ", sorted(set(f'{v:02x}' for v in oob['CORPT'])))
print(words)
