Helper scripts
===

This hodge-podge collection of scripts is used to extract raw game data from
the binary image files and help enrich the disassembler output.

The main entrypoint is `extractdata.py`, which uses `fonts.py` and `diskimage.py`.
This runs in a conda environment which is created by:

    conda env update -f environment.yml

Then run the script via:

    conda activate ef1941
    python extractdata.py

This creates a number of data files in `extract/` as well as the APX binary image
in `reference/apxdump.dat` read from the disk image.
These files are incorporated into the game engine, e.g. in `src/engine/map-data.ts`,
with the font image masks copied directly to `static/`.

Other scripts
---

- `apxsrcmap.py`: Generates a cross-reference in `apxsrc.map` from APX listing line numbers to the annotated APX disassembly in `apxdump.asm` for the `howitworks.md` document.  I think `apxsrcrefs.py` an earlier version?
- `atascii.py`: Dumps a binary file with the Atascii font
- `matchmaps.py`: A failed attempt to look for common binary code sequences between the APX and cartridge images.
- `asciimap.html`: old helper to render an ascii map as HTML (see unused `fonts.py:asciimapposter`)
- `apx.cmd`, `card.cmd`: example command files for driving [my fork][py65pds] of the [py65][py65] 6502 emulator

[py65pds]: https://github.com/patricksurry/py65
[py65]: https://github.com/mnaberez/py65

Other notes
---

Dissemblies were produced using [my fork][6502pds] of the [pydisass6502][6502dis]
disassembler, which includes significant changes and few bugfixes.  The typical recipe is:

    python <pydisass6502>/disass.py -i apxdump.dat -o apxdump.asm -e apxdump.map.json -c apxdump.stats -m <pydisass6502>/lib/atari-mapping.json

    python <pydisass6502>/disass.py -i cartridge.rom -o cartridge.asm -e cartridge.map.json -c cartridge.stats -m <pydisass6502>/lib/atari-mapping.json

[6502dis]: https://github.com/Esshahn/pydisass6502
[6502pds]: https://github.com/patricksurry/pydisass6502

Convert the black and white fontmap images to transparent background with a command like:

    convert extract/fontmap-custom-apx.png -background black -alpha remove -sample 1600% -negate doc/fontapx.png

Extract pages from PDF document to individual JPG images for OCR via:

    convert -density 300 APX_Source_Code_for_Eastern_Front_1941_rev_2.pdf[10-58] -quality 90 apxsrc%02d.jpg

Run OCR on each page with [tesseract][tesseract] like:

    for i in {10..58}; do echo $i; echo $i >> apxsrc.txt; tesseract apxsrc$i.jpg - >> apxsrc.txt; done

[tesseract]: https://github.com/tesseract-ocr/tesseract

Pad cover image for GH aspect ratio:

    convert preview.png -gravity center -background black -extent 1536x768 preview-padded.png
