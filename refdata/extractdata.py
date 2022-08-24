import json
from typing import List
from fonts import writefontpng, showascii, asciimapposter

data = open('cartridge.rom', 'rb').read()

maprle = data[int('1400', 16):int('173a', 16)]
print(len(maprle))
out: List[int] = []
for b in maprle:
    if b & 0x40 and b & 0x30:
        rpt = b & 0xf
        if not rpt:
            break
        v = [0xff, 0x7f, 0xbf, 0x00][(b >> 4) & 0x3]
        out += [v] * (rpt+1)
    else:
        out.append(b)

open('map_new.bin', 'wb').write(bytes(out[:41*48]))
print(len(out))  # 826 => 1969  2400=>2bb1;  48*41 = 1968

for i in range(0, len(out), 48):
    s = ''
    for j in range(i, i+48):
        if j >= len(out):
            s += 'ZZZ'
            break
        b = out[j] & 0x7f
        if 0 < b < 32: b = 64-b
        elif b == 0: b = 32
        elif b == 127: b = ord('#')
        s += chr(b)
    print(s)

open('map_new.hex', 'w').write(
    '\n'.join(
        ''.join('{:2x}'.format(out[i+j]) for j in range(48))
        for i in range(0, 41*48, 48)
    )
)


def extractcolors(src='colormap.src', dst='colormap.dat'):
    """convert a list of hex colors from wikipedia in low/hi-nibble order to a CSV of byte => hex"""
    colors = open(src).read().splitlines()[1:]
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


def readfile(diskimg, fileno, sector):
    """read a file from a diskimg, starting at sector"""
    off = 16 + (sector-1)*128
    sec = diskimg[off:off+128]
    fno = sec[-3] >> 2
    assert fileno == fno, f'Mismatch fileno {fileno} != {fno}'
    nxt = ((sec[-3] & 0x3) << 8) + sec[-2]
    bytes = sec[-1]
    data = sec[:bytes]
    if nxt > 0:
        data += readfile(diskimg, fileno, nxt)
    return data


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


def readapxdisk(fname, outname):
    data = readfile(open(fname, 'rb').read(), 1, 0x2b)
    print(f'Read {len(data)} bytes from {fname}')

    memmap = data[6:]
    # header  ffff0047007c  with relocation 0x4700 and eof 0x7c00
    # trailer e002e102006e  includes entry point 6e00. also 021e, 0210 ?
    print('head(6):', ''.join(f'{d:02x}' for d in data[:6]))
    print('tail(6):', ''.join(f'{d:02x}' for d in data[-6:]))
    open(outname, 'wb').write(memmap)
    return memmap


def _chunk(bytes, base, addr, n):
    return bytes[addr-base:addr-base+n]


data = readapxdisk('APX20050.ATR', 'apxdump.dat')
symtab = json.load(open('apxdump.map.json'))


#data = open('cartridge.rom', 'rb').read()
#symtab = json.load(open('cartridge.map.json'))

base = int(symtab['startaddress'], 16)
chunks = {
    s['symbol']: _chunk(data, base, int(s['addr'], 16), int(s['length'], 16) )
    for s in symtab['entrypoints'] if 'length' in s
}
print(f"Read {len(chunks)} chunks for {', '.join(chunks.keys())}")


fontdata = chunks['FONTDATA']
specials = chunks["MLTKRZ"] + chunks["ARRTAB"] + bytes([0] * (16-5)*8)

fonts = open('atascii.dat', 'rb').read() + fontdata + specials

open('fontmap.dat', 'wb').write(fonts)

writefontpng(fonts, 'fontmap.png')

# map @ 0x64ff - 0x6d60 = 2145   46 x 40 = 1840
rows, cols = 41, 48
row_mid = 25
mapdata = chunks['MAPDATA'][:rows*cols]

# chrs = showascii(fonts)
# asciimapposter(chrs, mapdata, rows, cols, row_mid, 'poster.txt')

open('map_old.hex', 'w').write(
    '\n'.join(
        ''.join('{:2x}'.format(mapdata[i+j]) for j in range(48))
        for i in range(0, 41*48, 48)
    )
)


"""
Each font has 64 chars (there is a north and south font)

https://www.atariarchives.org/c2bag/page069.php
https://en.wikipedia.org/wiki/ANTIC

An 8-bit character code implies a six bit character index (low bits)
and one of four foreground colors (two high bits), with a fixed bg color.
"""


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

# terrain movement chart; indexed as month + 10*armor[0/1] + 20*season[0/1/2]
offset = 0x6ccd - baseoff
trntab = memmap[offset:offset+60]
print(list(map(int, trntab)))

table = [
    [
        [int(trntab[month + armor*10 + season*20]) for season in range(3)]
        for armor in range(2)
    ]
    for month in range(10)
]
print('terrain effects for [summer, mud, winter] x [infantry, armor] per terrain type')
for row in table:
    print(row)
