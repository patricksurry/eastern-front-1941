import sys
from typing import List, Tuple


def uniquemarkers(data, chunk, step=1):
    markers = {}
    for i in range(0, len(data), step):
        s = data[i:i+chunk]
        if s in markers:
            markers[s] = -1
        else:
            markers[s] = i
    return {k: v for (k, v) in markers.items() if v >= 0}


chunk = 8

assert len(sys.argv) == 3

with open(sys.argv[1], 'rb') as fa, open(sys.argv[2], 'rb') as fb:
    a = fa.read()
    b = fb.read()
    am = uniquemarkers(a, chunk)
    bm = uniquemarkers(b, chunk, chunk)
    c = set(am.keys()) & set(bm.keys())

    print(f"Found {len(am)} markers and {len(bm)} markers, with {len(c)} overlap")

    matches: List[Tuple[int, int, int]] = []
    for k in c:
        i, j = am[k], bm[k]
        covered = False
        for (ii, jj, n) in matches:
            if ii <= i < ii+n or jj <= j < jj+n:
                covered = True
        if covered:
            continue

        n = chunk
        while i > 0 and j > 0 and a[i-1] == b[j-1]:
            i -= 1
            j -= 1
            n += 1
        while i + n < len(a) and j + n < len(b) and a[i+n] == b[j+n]:
            n += 1
        assert a[i:i+n] == b[j:j+n]
        matches.append((i, j, n))

for (i, j, n) in sorted(matches):
    print(f"{n} bytes match at offsets {i} (${i:x}) and {j} (${j:x}); diff {i-j} (${abs(i-j):x})")


"""
python matchmaps.py memmap.dat cartridge.rom

Found 13575 markers and 16384 markers, with 64 overlap
457 bytes match at offsets 6399 ($18ff) and 4095 ($fff); diff 2304 ($900)
480 bytes match at offsets 6888 ($1ae8) and 4584 ($11e8); diff 2304 ($900)
176 bytes match at offsets 9649 ($25b1) and 7121 ($1bd1); diff 2528 ($9e0)

memmap.dat: 13575 bytes, start offset $4700

$5400-  unit data

$5ff7-$5fff: kreuze
$6000-$6400: fonts
$6431-$6450: arrows

$6500-$6c88 bytes: map

$6cb1 + 176

$6ccd +60: movement chart



cartridge.rom: 16384 bytes

$1000-$1400: fonts




cart $8000-$9fff / $8000-$bfff (16K)
if $9ffc = 0, jsr $9ffe/f
if $bffc = 0, jsr $bffe/f


bit 2 of $9ffd = 1, jsr via $bffa/b, same for bffd..


from p158 http://data.atariwiki.org/DOC/Atari_400-800_Technical_Reference_Notes-Operating_System_User_s_Manual-Operating_System_Source_Listing_and_Hardware_Manual_553_pages.pdf

last 6 bytes of cartridge:

start...
... address
00
option byte [bit0 = 1=>boot disk/0 don't, bit2 = 0=> init but don't start, 1 init and start; bit7=1 diagnostic cart?]
init ...
... address


20  b9  00  05  1f  b9


init @ b91f
start @ b920


"""
