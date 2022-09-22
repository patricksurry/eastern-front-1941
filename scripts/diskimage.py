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


def extractfile(fname, outname):
    data = readfile(open(fname, 'rb').read(), 1, 0x2b)
    print(f'Read {len(data)} bytes from {fname}')

    memmap = data[6:]
    # header  ffff0047007c  with relocation 0x4700 and eof 0x7c00
    # trailer e002e102006e  includes entry point 6e00. also 021e, 0210 ?
    print('head(6):', ''.join(f'{d:02x}' for d in data[:6]))
    print('tail(6):', ''.join(f'{d:02x}' for d in data[-6:]))
    open(outname, 'wb').write(memmap)
    return memmap
