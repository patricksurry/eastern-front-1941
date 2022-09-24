import json
from typing import List, Dict, Any
from fonts import writefontpng, showascii, asciimapposter
from diskimage import extractfile
import re


def readcartridge() -> Dict[str, bytes]:
    data = open('cartridge.rom', 'rb').read()
    symtab = json.load(open('cartridge.map.json'))
    print('Reading cartridge.rom with cartridge.map.json')
    return readchunks(data, symtab)


def readapxdisk() -> Dict[str, bytes]:
    data = extractfile('APX20050.ATR', 'apxdump.dat')
    symtab = json.load(open('apxdump.map.json'))
    print('Reading APX20050.ATR disk image with with apxdump.map.json')
    return readchunks(data, symtab)


def readchunks(data: bytes, symtab: Dict[str, Dict[str, Any]]) -> Dict[str, bytes]:
    base = int(symtab['startaddress'], 16)
    chunks = {
        re.split(r'[^a-zA-Z0-9]', s['symbol'])[0]: _chunk(data, base, s['addr'], s['length'])
        for s in symtab['entrypoints'] if 'length' in s
    }
    print(f"Read {len(chunks)} chunks for {', '.join(chunks.keys())}")
    return chunks


def _chunk(bytes, base, addr, n):
    if isinstance(addr, str):
        addr = int(addr, 16)
    if isinstance(n, str):
        n = int(n, 16)
    return bytes[addr - base:addr - base + n]


def buildcolormap(src='colormap.src', dst='colormap.dat'):
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


def buildfontmap(chunks, outbase):
    fontdata = chunks['FONTDATA']
    specials = chunks['MLTKRZ'] + chunks['ARRTAB']
    if 'DIAMOND' in chunks:
        specials += chunks['DIAMOND']
    specials += bytes([0] * (16*8 - len(specials)))

    fontmap = open('atascii.dat', 'rb').read() + fontdata + specials
    open(outbase + '.dat', 'wb').write(fontmap)
    writefontpng(fontmap, outbase + '.png')

    # chrs = showascii(fonts)
    # asciimapposter(chrs, mapdata, rows, cols, row_mid, 'poster.txt')


def decodemaprle(maprle: bytes) -> bytes:
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
    return bytes(out)


def buildasciimap(mapdata, outbase, flieger=False):
    # map @ 0x64ff - 0x6d60 = 2145   46 x 40 = 1840
    rows, cols = 41, 48
    row_mid = 25

    assert len(mapdata) == rows*cols + 1, f"Expected {len(mapdata)} == {rows * cols + 1} == rows x cols + 1"

    open(outbase + '.hex', 'w').write(
        '\n'.join(
            ''.join('{:2x}'.format(mapdata[i+j]) for j in range(cols))
            for i in range(0, rows * cols, cols)
        )
    )

    """
    Each custom font has 64 chars (there is a north and south font)

    https://www.atariarchives.org/c2bag/page069.php
    https://en.wikipedia.org/wiki/ANTIC

    An 8-bit character code implies a six bit character index (low bits)
    and one of four foreground colors (two high bits), with a fixed bg color.

    We create a custom base-65 ascii encoding for the map, with slightly
    different mapping for top and bottom so that we can map a set of related
    ascii characters to each terrain type.  Those groups are separated by
    pipe symbols here.  Note the question mark characters are rsserved for units
    and don't appear on the map.
    """

    map64 = [
        #0           1             2         3         4         5           6
        #0|123456|7890|||1234|56789012345678901234567890|123456789012345678|9012|34
        ' |123456|@*0$|||,.;:|abcdefghijklmnopqrstuvwxyz|ABCDEFGHIJKLMNOPQR|{}??|~#',
        ' |123456|@*0$|||,.;:|abcdefghijklmnopqrst|ABCDEFGHIJKLMNOPQRSTUVW|{}<??|~#'
    ]

    mapchrs = 63
    if flieger:
        mapchrs -= 1
        map64[0] = map64[0].replace('R', '').replace('??', '???')
        map64[1] = map64[1].replace('W', '').replace('??', '???')

    assert all(len(set(s)) == mapchrs + 2 for s in map64)

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

    open(outbase + '.asc', 'w').write(f"""
mapencoding = {json.dumps(map64, indent=True)}

mapascii = `
{asciimap}
`
""")


def buildoob(chunks, outbase, scenario=''):
    # CORPSX,Y is map position
    # M/CSTRNG is muster and current strength [skip CSTRNG initialized later]
    # SWAP is icon chr
    # ARRIVE is arrival turn
    # CORPT is unit type (lo and hi nibble index into word lists)
    # CORPNO is unit designation information only
    keys = ['CORPSX' + scenario, 'CORPSY' + scenario, 'MSTRNG' + scenario, 'ARRIVE', 'CORPT', 'CORPNO']  # 'SWAP'

    # for cart, SWAP gets set from CORPT @ bb88
    assert len({len(chunks[k]) for k in keys}) == 1  # all equal

    num_units = len(chunks[keys[0]])

    oob = [tuple(int(chunks[k][i]) for k in keys) for i in range(num_units)]
    with open(outbase + '.json', 'w') as f:
        f.write(f'// {json.dumps(keys)}\n')
        f.write('[\n')
        for u in oob:
            f.write(f'    {json.dumps(u)},\n')
        f.write(']\n')
    print(f"Wrote {len(oob)} units to {outbase}.json")
    print("Unique CORPT values", sorted({u[-2] for u in oob}))


def buildwords(chunks, outbase, fmts):
    words = {}
    for k, fmt in fmts.items():
        data = bytes(b & 0x7f for b in chunks[k]).decode('ascii')
        if isinstance(fmt, int):
            ws = [data[i:i+fmt] for i in range(0, len(data), fmt)]
        else:
            ws = data.split(fmt)
        words[k] = ws
    json.dump(words, open(outbase + '.json', 'w'), indent=4)


def buildterrain(data, outbase):
    ttypes = [
        "clear",
        "mountain_forest",     # south/north
        "city",
        "frozen swamp",
        "frozen river",
        "swamp",
        "river",
        "coastline",
        "estuary",
        "border",
    ]
    # terrain movement chart; indexed as terrain type + 10*armor[0/1] + 20*season[0/1/2]
    with open(outbase + '.json', 'w') as f:
        f.write('[\n')
        for ttyp, key in enumerate(ttypes):
            s = json.dumps(dict(
                key=key,
                movecost=[[int(data[ttyp + season*20]) for season in range(3)] for armor in range(2)]
            ))
            f.write(f'    {s},\n')
        f.write(']\n')


versions = dict(
    cart=readcartridge(),
    apx=readapxdisk()
)

buildcolormap()

for ver, chunks in versions.items():
    buildfontmap(chunks, f'fontmap-{ver}')
    if 'MAPRLE' in chunks:
        chunks['MAPDATA'] = decodemaprle(chunks['MAPRLE'])
    buildasciimap(chunks['MAPDATA'], f'mapboard-{ver}', ver == 'cart')
    buildoob(chunks, f'oob-{ver}')
    if 'CORPSX42' in chunks:
        buildoob(chunks, f'oob-{ver}42', '42')
    fmts = dict(zip('WORDS TXTTBL ERRMSG'.split(), ' !!' if ver == 'cart' else [8, 32, 32]))
    buildwords(chunks, f'words-{ver}', fmts)
    buildterrain(chunks['TRNTAB'], f'terrain-{ver}')
