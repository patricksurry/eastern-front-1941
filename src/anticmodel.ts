type AnticColor = number;  // a hex value like 0x23, see anticview.ts

type CharMapper = (c: string) => number;

const atascii: CharMapper = (c: string) => c.charCodeAt(0) & 0x7f;

interface SpriteColors {
    foregroundColor?: AnticColor,
    backgroundColor?: AnticColor,
    opacity?: number,
}

const enum GlyphAnimation {blink, flash, flash_reverse}

interface SpriteOpts extends SpriteColors {
    animate?: GlyphAnimation,
    onclick?: (e: Event) => void,
    onmouseover?: (e: Event) => void,
    props?: {[k: string]: unknown},
}

interface LayerColors extends SpriteColors {
    // controls default glyph fg/bg plus layer bg and decoration
    layerColor?: AnticColor,
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
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

interface LineOpts extends GlyphOpts {
    charMap?: CharMapper
    justify?: 'center' | 'left' | 'right'
}

interface FontMap {
    maskImage: string,
    numGlyphs: number,
    glyphSize: number,
    glyphsPerRow: number,
}

function fontMap(
        maskImage: string, numGlyphs: number,
        glyphSize = 8, glyphsPerRow = 16): FontMap {
    return {maskImage, numGlyphs, glyphSize, glyphsPerRow};
}

abstract class DisplayLayer implements LayerOpts {
    width: number;
    height: number;
    fontmap: FontMap;
    foregroundColor?: AnticColor;
    backgroundColor?: AnticColor;
    layerColor?: AnticColor;
    opacity?: number;
    dirty = true;

    constructor(width: number, height: number, fontmap: FontMap, opts: LayerOpts = {}) {
        // explicitly set foregroundColor: undefined for transparent glyphs
        if (!('foregroundColor' in opts)) opts.foregroundColor = 0x0f;
        this.width = width;
        this.height = height;
        this.fontmap = fontmap;
        this.setcolors(opts);
    }
    get opts(): LayerOpts {
        return {
            foregroundColor: this.foregroundColor,
            backgroundColor: this.backgroundColor,
            layerColor: this.layerColor,
            opacity: this.opacity,
        }
    }
    setcolors(opts: LayerColors) {
        this.dirty = true;
        this.foregroundColor = opts.foregroundColor;
        this.backgroundColor = opts.backgroundColor;
        this.layerColor = opts.layerColor;
        this.opacity = opts.opacity;
    }

    cls(): void {
        this.dirty = true;
    }

    abstract spritelist(): Sprite[]
}

class MappedDisplayLayer extends DisplayLayer {
    x = 0;
    y = 0;
    glyphs: (Glyph|undefined)[][];

    constructor(width: number, height: number, fontmap: FontMap, opts: LayerOpts = {}) {
        super(width, height, fontmap, opts);
        this.glyphs = new Array(height).fill(undefined).map(() => new Array(width).fill(undefined));
    }
    cls(c?: number) {
        super.cls();
        // with no argument, clear all glyphs (so we see the container layer)
        // otherwise set all glyphs to a specific
        this.x = 0;
        this.y = 0;
        this.glyphs = this.glyphs.map(row => row.map(() => c != null ? {c}: undefined));
    }
    spritelist() {
        return this.glyphs.flatMap(
            (row, y) => row.map((g, x) => g && {key: `${x},${y}`, x, y, ...g}).filter(d => d)
        ) as Sprite[];
    }
    setpos(x: number, y: number): void {
        this.x = x % this.width;
        this.y = y % this.height;
    }
    putc(c?: number, opts: GlyphOpts = {}) {
        // put a character at current position, with options.  put undefined to clear current chr
        this.dirty = true;
        this.setpos(opts.x ?? this.x, opts.y ?? this.y);
        this.glyphs[this.y][this.x] = c != null ? Object.assign({c}, opts) : undefined;
        this.x = (this.x + 1) % this.width;
        if (this.x == 0) this.y = (this.y + 1) % this.height;
    }
    puts(s: string, opts: LineOpts = {}) {
        const {x: x0, y, ...rest} = opts; // drop x and y
        let x = x0;
        switch (opts.justify) {
            case 'center': x = Math.floor((this.width - s.length)/2); break;
            case 'left': x = 0; break;
            case 'right': x = this.width - s.length; break;
            default: // no change
        }
        this.setpos(x ?? this.x, y ?? this.y);
        s.split('').forEach((c) => this.putc((opts.charMap ?? atascii)(c), rest));
    }
    putlines(lines: string[], opts: LineOpts = {}) {
        const x0 = opts.x ?? this.x,
            y0 = opts.y ?? this.y;
        lines.forEach((s, j) => {
            this.puts(s, Object.assign({}, opts, {x: x0, y: y0 + j}))
        });
    }
}

class SpriteDisplayLayer extends DisplayLayer {
    sprites: Record<string, Sprite> = {};

    cls() {
        super.cls();
        this.sprites = {};
    }
    put(key: string, c: number, x: number, y: number, opts: SpriteOpts = {}) {
        this.dirty = true;
        this.sprites[key] = Object.assign({key, c, x, y}, opts);
    }
    moveto(key: string, x: number, y: number) {
        if (!(key in this.sprites)) {
            throw new Error(`SpriteDisplayLayer.moveto: key error for '${key}'`)
        }
        this.dirty = true;
        Object.assign(this.sprites[key], {x: x, y: y});
    }
    delete(key: string) {
        if (!(key in this.sprites)) {
            throw new Error(`SpriteDisplayLayer.delete: key error for '${key}'`)
        }
        this.dirty = true;
        delete this.sprites[key];
    }
    spritelist() {
        return Object.values(this.sprites);
    }
}

export type {AnticColor, FontMap, Glyph, GlyphOpts, Sprite, SpriteOpts, LayerOpts, DisplayLayer};

export {fontMap, GlyphAnimation, MappedDisplayLayer, SpriteDisplayLayer};