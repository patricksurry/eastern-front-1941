Reference
===

This is the source material used as reference for the Typescript port,
including binaries for both the APX and cartridge versions.

`APX20050.ATR` is a disk image extracted to the memory image in `apxdump.dat`
via `scripts/extractdata.py`, and `cartridge.rom` is a ROM image which can
be loaded and run directly in an Atari emulator like
[Atari800MacX][atari800macx].

`EFT18{C,D,I,M,T}.ASM` are the annotated APX source files provided
on [Crawford's website][ccsrc],
for the Combat, Display, Interrupt, Main and Thinking modules respectively.

The binary files are disassembled in `apxdump.asm` and `cartridge.asm` respectively.
These were largely automatically generated using my fork of [pydisass][pydisass],
with the annotated symbol files in `*.map.json`.
I imported much of Crawford's commentary to the APX dump, and added additional
notes as I built a better understanding of how it worked.
The cartridge disassembly was essentially blind,
but as far as possible I tried to reuse the same symbols and comments
when I could find correspondences with the APX edition, inventing my own only when necessary.

[atari800macx]: https://www.atarimac.com/atari800macx.php
[ccsrc]: http://www.erasmatazz.com/library/source-code/index.html
[pydisass]: https://github.com/patricksurry/pydisass6502