
from base64 import b64encode
import numpy as np
from PIL import Image


BITFLAGS = list(reversed([1 << i for i in range(8)]))


def asciiart(bs):
    """write a character as 8x8 ascii art"""
    s = ''
    for b in bs:
        s += ''.join('*' if b & bit else ' ' for bit in BITFLAGS) + '\n'
    return s[:-1]


def concatart(chrs):
    """paste a set of 8x8 ascii art side-by-side"""
    return '\n'.join(
        ('|' + '|'.join(rows) + '|')
        for rows in zip(*(chr.split('\n') for chr in chrs))
    )


def showascii(fonts):
    sep = '-'*(9*8+1)
    print(sep)
    chrs = []
    for row in range(0, len(fonts), 64):
        chrs += [asciiart(fonts[row+off:row+off+8]) for off in range(0, 64, 8)]
        print(concatart(chrs[-8:]))
        print(sep)
    return chrs


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


def writefontpng(fonts, outfile, nc=16):
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
    #print(bitmap.shape)
    #print(bitmap)
    rgba = np.zeros(bitmap.shape + (4,), dtype='uint8')
    rgba[:, :, :] = bitmap[:, :, np.newaxis]*255
    im = Image.fromarray(rgba)
    #im = Image.fromarray(bitmap*255)
    im.save(outfile)  # base64 => url(data:image/png;base64,iVBORw...)
    print(f'Wrote fonts png to {outfile}')
    # im.show()


# print(b64encode(fonts))  # if we want to include as data-url

def asciimapposter(chrs, data, rows, cols, row_mid, outfile):
    sep = '\n' + ('-'*(cols*9+1)) + '\n'
    poster = sep
    for row in range(rows):
        cs = [
            chrs[128 + (data[row*cols + col] & 0x3f) + 64*(row > row_mid)]
            for col in range(cols)
        ]
        poster += concatart(cs)
        poster += sep

    print(f"Wrote map poster to {outfile}")
    open(outfile, 'w').write(poster)
