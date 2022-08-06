from base64 import b64encode
import numpy as np
from PIL import Image
import sys


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


offset = 0x6000 - baseoff
fonts = memmap[offset:offset+1024]

fonts = open('atascii.dat', 'rb').read() + fonts

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
im.save('fontmap.png')
# im.show()
# sys.exit()

# map @ 0x64ff - 0x6d60 = 2145   46 x 40 = 1840
rows, cols = 41, 48
row_mid = 24
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

#         0         1         2         3         4         5         6
#         0123456789012345678901234567890123456789012345678901234567890123
map64 = r' @*!%^&0123,.;:|/+-=_[]{}()<>abcdefghijklmnpqrstuvwyzABCDEFGHxo#'

assert len(map64) == 64 and len(set(map64)) == 64

encoding = {
    i + (0 if i < 7 else (64 if i < 11 else (128 if i < 61 else 64))): c
    for (i, c) in enumerate(map64)
}
encoding[253] = 'X'
encoding[254] = 'O'
encoding[191] = '~'

assert len(encoding) == len(set(encoding.values()))

assert set(counts.keys()) - set(encoding.keys()) == set()

map256 = ''.join(encoding.get(i, '?') for i in range(256))
map256nl = '\n'.join(
    map256[page:page+64]
    for page in range(0, 256, 64)
)
print(map256nl)

asciimap = '\n'.join(
    ''.join(map256[mapdata[row*cols + col]] for col in range(cols))
    for row in range(rows)
)

assert '?' not in asciimap

print(asciimap)

"""
0x2264 => 0x5400
0x229e => 0x5437

3a  vs 37  + 3bytes

3 byte checksum @ 0x228d, 0x230d  (128 byte spacing)


0x0190 to 0x4b10  18816  = 147 x 128

0x4a10

16896


0xe90 => 0x4000?

0x1516 => 0x4700  (18176)


18170 => x42c x 125  (1068 x 125 = 133500 - 18170 = 115330)

04 2c  (x2c * 125 => 5500 => 0x157c)
04 97

(108 x 125) = 13500 + 0x700 (1792) + 1092 = 16384

"""
