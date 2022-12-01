type AnticColor = number;

const
    // Antic NTSC palette via https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#NTSC
    // 128 colors indexed via high 7 bits, e.g. 0x00 and 0x01 refer to the first entry
    anticPaletteRGB = [
        "#000000",  "#404040",  "#6c6c6c",  "#909090",  "#b0b0b0",  "#c8c8c8",  "#dcdcdc",  "#ececec",
        "#444400",  "#646410",  "#848424",  "#a0a034",  "#b8b840",  "#d0d050",  "#e8e85c",  "#fcfc68",
        "#702800",  "#844414",  "#985c28",  "#ac783c",  "#bc8c4c",  "#cca05c",  "#dcb468",  "#ecc878",
        "#841800",  "#983418",  "#ac5030",  "#c06848",  "#d0805c",  "#e09470",  "#eca880",  "#fcbc94",
        "#880000",  "#9c2020",  "#b03c3c",  "#c05858",  "#d07070",  "#e08888",  "#eca0a0",  "#fcb4b4",
        "#78005c",  "#8c2074",  "#a03c88",  "#b0589c",  "#c070b0",  "#d084c0",  "#dc9cd0",  "#ecb0e0",
        "#480078",  "#602090",  "#783ca4",  "#8c58b8",  "#a070cc",  "#b484dc",  "#c49cec",  "#d4b0fc",
        "#140084",  "#302098",  "#4c3cac",  "#6858c0",  "#7c70d0",  "#9488e0",  "#a8a0ec",  "#bcb4fc",
        "#000088",  "#1c209c",  "#3840b0",  "#505cc0",  "#6874d0",  "#7c8ce0",  "#90a4ec",  "#a4b8fc",
        "#00187c",  "#1c3890",  "#3854a8",  "#5070bc",  "#6888cc",  "#7c9cdc",  "#90b4ec",  "#a4c8fc",
        "#002c5c",  "#1c4c78",  "#386890",  "#5084ac",  "#689cc0",  "#7cb4d4",  "#90cce8",  "#a4e0fc",
        "#003c2c",  "#1c5c48",  "#387c64",  "#509c80",  "#68b494",  "#7cd0ac",  "#90e4c0",  "#a4fcd4",
        "#003c00",  "#205c20",  "#407c40",  "#5c9c5c",  "#74b474",  "#8cd08c",  "#a4e4a4",  "#b8fcb8",
        "#143800",  "#345c1c",  "#507c38",  "#6c9850",  "#84b468",  "#9ccc7c",  "#b4e490",  "#c8fca4",
        "#2c3000",  "#4c501c",  "#687034",  "#848c4c",  "#9ca864",  "#b4c078",  "#ccd488",  "#e0ec9c",
        "#442800",  "#644818",  "#846830",  "#a08444",  "#b89c58",  "#d0b46c",  "#e8cc7c",  "#fce08c",
    ];

function antic2rgb(color?: AnticColor): string|undefined {
    if (color == null) return undefined;
    if (!Number.isInteger(color) || color < 0 || color > 255) {
        throw new Error(`DisplayLayer: Invalid antic color ${color}`);
    }
    return anticPaletteRGB[color >> 1];
}

type CharMapper = (c: string) => number;

const atascii: CharMapper = (c: string) => c.charCodeAt(0) & 0x7f;

interface SpriteColors {
    foregroundColor?: AnticColor,
    backgroundColor?: AnticColor,
}
interface SpriteOpts extends SpriteColors {
    props?: {[k: string]: unknown},
};

interface LayerColors extends SpriteColors {
    // controls default glyph fg/bg plus layer bg and decoration
    layerColor?: AnticColor,
}
interface LayerOpts extends LayerColors {}

interface Glyph extends SpriteOpts {
    c: number,
}

interface Sprite extends Glyph {
    key: string
    x: number,
    y: number,
}

interface GlyphOpts extends SpriteOpts {
    x?: number,
    y?: number,
}

interface CharOpts extends GlyphOpts {
    charMap?: CharMapper
}

interface FontMap {
    maskImage: string,
    numGlyphs: number,
    glyphSize: number,
    glyphsPerRow: number,
    startOffset: number,
}

function fontMap(
        maskImage: string, numGlyphs: number,
        glyphSize = 8, glyphsPerRow = 16, startOffset = 0): FontMap {
    return {maskImage, numGlyphs, glyphSize, glyphsPerRow, startOffset};
}

abstract class DisplayLayer implements LayerOpts {
    width: number;
    height: number;
    fontmap: FontMap;
    foregroundColor?: AnticColor;
    backgroundColor?: AnticColor;
    layerColor?: AnticColor;
    dirty = true;

    constructor(width: number, height: number, fontmap: FontMap, opts: LayerOpts = {}) {
        // explicitly set foregroundColor: undefined for transparent grl can be explicitly undefined
        if (!('foregroundColor' in opts)) opts.foregroundColor = 0x0f;
        this.width = width;
        this.height = height;
        this.fontmap = fontmap;
        this.setcolors(opts);
    }

    setcolors(opts: LayerColors) {
        this.dirty = true;
        this.foregroundColor = opts.foregroundColor;
        this.backgroundColor = opts.backgroundColor;
        this.layerColor = opts.layerColor;
    }

    abstract spritelist(): Sprite[]
}

class MappedDisplayLayer extends DisplayLayer {
    x: number = 0;
    y: number = 0;
    glyphs: Glyph[][];

    constructor(width: number, height: number, fontmap: FontMap, opts: LayerOpts = {}) {
        super(width, height, fontmap, opts);
        this.glyphs = new Array(height).fill(undefined).map(() => new Array(width).fill(undefined));
    }
    spritelist() {
        return this.glyphs.flatMap(
            (row, y) => row.map((g, x) => g && {key: `${x},${y}`, x, y, ...g}).filter(d => d)
        );
    }
    setpos(x: number, y: number): void {
        this.x = x % this.width;
        this.y = y % this.height;
    }
    putc(c: number, opts: GlyphOpts = {}) {
        this.dirty = true;
        this.setpos(opts.x ?? this.x, opts.y ?? this.y);
        this.glyphs[this.y][this.x] = Object.assign({c}, opts);
        this.x = (this.x + 1) % this.width;
        if (this.x == 0) this.y = (this.y + 1) % this.height;
    }
    puts(s: string, opts: CharOpts = {}) {
        let {x, y, ...rest} = opts; // drop x and y
        this.setpos(x ?? this.x, y ?? this.y);
        s.split('').forEach((c) => this.putc((opts.charMap ?? atascii)(c), rest));
    }
    putlines(lines: string[], opts: CharOpts = {}) {
        const x0 = opts.x ?? this.x,
            y0 = opts.y ?? this.y;
        lines.forEach((s, j) => this.puts(s, Object.assign({}, opts, {x: x0, y: y0 + j})));
    }
}

class SpriteDisplayLayer extends DisplayLayer {
    sprites: Record<string, Sprite> = {};
    put(key: string, c: number, x: number, y: number, opts: SpriteOpts = {}) {
        this.dirty = true;
        this.sprites[key] = Object.assign({key, c, x, y}, opts);
    }
    moveto(key: string, x: number, y: number) {
        this.dirty = true;
        if (!(key in this.sprites)) {
            throw new Error(`SpriteDisplayLayer.moveto: key error for '${key}'`)
        }
        Object.assign(this.sprites[key], {x: x, y: y});
    }
    delete(key: string) {
        this.dirty = true;
        if (!(key in this.sprites)) {
            throw new Error(`SpriteDisplayLayer.delete: key error for '${key}'`)
        }
        delete this.sprites[key];
    }
    spritelist() {
        return Object.values(this.sprites);
    }
}

export type {AnticColor, FontMap, Glyph, Sprite, LayerOpts, DisplayLayer};

export {antic2rgb, fontMap, MappedDisplayLayer, SpriteDisplayLayer};