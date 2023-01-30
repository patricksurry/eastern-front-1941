import re
from typing import List

lines = open('../doc/apxdev.md').read().splitlines()

refs: List[str] = []

module = None
for line in lines:
    m = re.match(r'(\w+)\s+MODULE', line)
    if m:
        module = m.group(1)

    def mkref(m):
        txt = m.group(0)
        ref = f'EFT18{module[0]}-' + txt.split(' ', 1)[1]
        refs.append(ref)
        return f'[{txt}][{ref}]'

    line = re.sub(r'[Ll]ine(?:\s+\d+|s\s+\d+-\d+)', mkref, line)
    print(line)

print()
for ref in refs:
    print(f'   [{ref}]: https://github.com/patricksurry/eastern-front-1941/blob/main/refdata/apxdump.asm#L1-L3')
