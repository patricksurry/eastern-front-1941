from typing import Dict, Tuple, List
from glob import glob
import json
import re

refdir = '../reference'

symbols: Dict[str, Tuple[str, int]] = {}
renamed = dict(COMBAT='DOCOMBAT')

for f in glob(f'{refdir}/EFT18*.ASM'):
    key = f.split('/')[-1].split('.')[0]
    lines = open(f).read().splitlines()
    for line in lines:
        m = re.match(r'(\d+) (\w+)\s+[.A-Z]', line)
        if m:
            sym = m.group(2)
            if sym in renamed:
                sym = renamed[sym]
            symbols[sym] = (key, int(m.group(1)))

xref: Dict[str, List[Tuple[int, int]]] = {}
lines = open(f'{refdir}/apxdump.asm').read().splitlines()
for (n, line) in enumerate(lines, 1):
    m = re.match(r'(\w+):', line)
    if m and m.group(1) in symbols:
        key, num = symbols[m.group(1)]
        xref.setdefault(key, []).append((num, n))

xref = {k: sorted(vs) for (k, vs) in xref.items()}
prev = -1
for k, vs in xref.items():
    for num, n in vs:
        if n < prev:
            print(f'{k}:{num} out of order at apxsrc.asm:{n} < {prev}')
        prev = n

json.dump(xref, open('apxsrc.map', 'w'), indent=4)

def lookup(key, tgt):
    pairs = xref[key]
    for (i, (num, _)) in enumerate(pairs):
        if num > tgt:
            break
    if i > 0:
        i -= 1
    num, n = pairs[i]
    if tgt == num:
        return n
    elif tgt > num and i < len(pairs) - 1:
        num2, n2 = pairs[i+1]
        return int(n + (tgt-num)/(num2-num) * (n2 - n))
    else:
        return n + int((tgt - num)/10)

# 5450 TRJAM LDX ARMY
# line 2072: TRJAM:      ldx ARMY                         ; 7138 a6c2

# print(lookup('EFT18M', 5450))

# print(lookup('EFT18D', 800))
# print(lookup('EFT18D', 1000))

url = 'https://github.com/patricksurry/eastern-front-1941/blob/main/refdata/apxdump.asm#'

lines = open('../doc/howitworks.md').read().splitlines()
for line in lines:
    m = re.match(r'\[(EFT[-\w]+)', line)
    if m:
        ref = m.group(1)
        key, *nums = ref.split('-')
        ls = ['L' + str(lookup(key, int(num))) for num in nums]
        line = f"[{ref}]: {url}{'-'.join(ls)}"
    print(line)
