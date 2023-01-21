import {clamp} from './defs';

type AnticColor = number;  // a hex value like 0x23, see anticview.ts

type CharMapper = (c: string) => number;

const atascii: CharMapper = (c: string) => c.charCodeAt(0) & 0x7f,
    atasciiFont = fontMap('static/fontmap-atascii.png', 128);

interface SpriteColors {
    foregroundColor?: AnticColor,
    backgroundColor?: AnticColor,
    opacity?: number,
}

const enum GlyphAnimation {blink, flash, flash_reverse}

interface SpriteOpts extends SpriteColors {
    animate?: GlyphAnimation,
    invert?: boolean,
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

interface StringOpts extends GlyphOpts {
    charMap?: CharMapper,
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
    endLine: 'newline' | 'wraparound' = 'newline';
    endScreen: 'scroll' | 'wraparound' = 'wraparound';
    glyphs: (Glyph|undefined)[][];

    constructor(width: number, height: number, fontmap: FontMap, opts: LayerOpts = {}) {
        super(width, height, fontmap, opts);
        this.glyphs = new Array(height).fill(undefined).map(() => new Array(width).fill(undefined));
    }
    spritelist() {
        return this.glyphs.flatMap(
            (row, y) => row.map((g, x) => g && {key: `${x},${y}`, x, y, ...g}).filter(d => d)
        ) as Sprite[];
    }
    cls(c?: number) {
        super.cls();
        // with no argument, clear all glyphs (so we see the container layer)
        // otherwise set all glyphs to a specific character
        this.x = 0;
        this.y = 0;
        this.glyphs = this.glyphs.map(row => row.map(() => c != null ? {c}: undefined));
    }
    scroll(dx: number, dy: number, c?: number): void {
        // scroll screen by dx, dy, filling with character c (blank for undefined)
        this.dirty = true;
        const xs = [...Array(this.width).keys()],
            ys = [...Array(this.height).keys()],
            g: Glyph | undefined = c != null ? {c} : undefined;
        this.glyphs = ys.map(y => {
            const y_ = y + dy;
            return (y_ < 0 || y_ >= this.height)
                ? new Array(this.width).fill(g)
                : xs.map(x => {
                    const x_ = x + dx;
                    return (x_ < 0 || x_ >= this.width) ? g : this.glyphs[y_][x_]
                })
        })
        this.setpos(this.x - dx, this.y - dy)
    }
    roll(dx: number, dy: number): void {
        this.dirty = true;
        // roll screen by dx, dy
        const xs = [...Array(this.width).keys()],
            ys = [...Array(this.height).keys()]
        this.glyphs = ys.map(y =>
            xs.map(x =>
                this.glyphs[(y + dy) % this.height][(x + dx) % this.width])
        )
        this.setpos(this.x - dx, this.y - dy)
    }
    setpos(x: number, y: number): void {
        this.x = clamp(x, 0, this.width-1);
        this.y = clamp(y, 0, this.height-1);
    }
    putc(c?: number, opts: GlyphOpts = {}) {
        // put a character at current position, with options.  put undefined to clear current chr
        this.dirty = true;
        const {x, y, ...rest} = opts;
        this.setpos(x ?? this.x, y ?? this.y);
        this.glyphs[this.y][this.x] = c != null ? Object.assign({c}, rest) : undefined;
        this.x = (this.x + 1) % this.width;
        if (this.x == 0 && this.endLine == 'newline') {
            this.y++;
            if (this.y == this.height) {
                if (this.endScreen == 'wraparound') this.y = 0;
                else this.scroll(0, 1);
            }
        }

    }
    puts(s: string, opts: StringOpts = {}) {
        const {x, y, ...rest} = opts,
            cs = s.split(''),
            charMap = opts.charMap ?? atascii,
            stops = {'<': 0, '>': this.width, '^': Math.floor(this.width/2)};
        this.setpos(x ?? this.x, y ?? this.y);

        let justify: keyof typeof stops | undefined = undefined,
            jlen = 0;

        opts = {...rest};

        function nextch(): string {
            return (cs.shift() as string)
        }
        function nextval(): number {
            return nextch().charCodeAt(0);
        }
        const outch = (c: string) => {
            const eol = this.endLine;
            if ('>^'.includes(justify ?? 'X')) {
                this.endLine = 'wraparound';  // disable non-explicit newline while center/right justify
                let x0, xoff;
                const row = this.glyphs[this.y];
                if (justify == '>') {
                    x0 = stops['>'] - 1;
                    xoff = Math.max(0, x0 - jlen);
                    row.splice(xoff, 1);
                    row.splice(x0, 0, undefined);
                } else /* justify == '^' */ {
                    x0 = stops['^'] + Math.floor((jlen+1)/2)-1;
                    xoff = Math.max(0, x0 - jlen)
                    if (x0 > this.width) return;
                    if (jlen % 2 == 0) {
                        row.splice(xoff, 1);  // remove one char @ xoff
                        row.splice(x0, 0, undefined) // add placeholder at x0
                    }
                }
                opts.x = x0;
            } else {
                opts.x = undefined;
            }
            jlen++;
            this.putc(charMap(c), opts);
            this.endLine = eol;
        }

        while (cs.length) {
            const c = nextch(),
                x0 = this.x,
                y0 = this.y;

            switch (c) {
                case '\n':  // hex 0a
                    this.setpos(justify != null ? stops[justify]: 0, this.y);
                    jlen = 0;
                    this.y++;
                    if (this.y == this.height) {
                        if (this.endScreen == 'wraparound') this.y = 0;
                        else this.scroll(0, 1);
                    }
                    break;
                case '\f': {  // hex 0c
                    const k = nextch();
                    switch (k) {
                        // emit literal \f or \n character with \ff, \fn
                        case 'f': outch('\f'); break;
                        case 'n': outch('\n'); break;

                        // set/unset glyph style
                        case '-': opts.animate = undefined; opts.invert = undefined; break;
                        case '.': opts.animate = GlyphAnimation.blink; break;
                        case ':': opts.animate = GlyphAnimation.flash; break;
                        case '#': opts.invert = true; break;

                        // set/unset glyph color
                        case 'C': opts.foregroundColor = undefined; break;
                        case 'B': opts.backgroundColor = undefined; break;
                        case 'c': opts.foregroundColor = nextval(); break;
                        case 'b': opts.backgroundColor = nextval(); break;

                        // home, clear+home
                        case 'H': this.x = this.y = 0; break;
                        case 'h': this.cls(); break;

                        // move cursor up/down/left/right
                        case 'I': if (this.y > 0) this.y--; break;
                        case 'J': if (this.x > 0) this.x--; break;
                        case 'K': if (this.y < this.height-1) this.y++; break;
                        case 'L': if (this.x < this.width-1) this.x++; break;
                        case 'i': this.y = 0; break;
                        case 'j': this.x = 0; break;
                        case 'k': this.y = this.height-1; break;
                        case 'l': this.x = this.width-1; break;

                        // set cursor, e.g. \fx\06
                        case 'x': this.setpos(nextval(), 0); break;
                        case 'y': this.setpos(0, nextval()); break;
                        case 'z': this.setpos(nextval(), nextval()); break;

                        // clear to start/end of line/screen
                        case 'S':
                            for (let x=0; x<x0; x++)
                                this.putc(undefined, {x});
                            this.setpos(x0, y0);
                            break;
                        case 'E':
                            for (let x=x0; x<this.width; x++)
                                this.putc(undefined, {x});
                            this.setpos(x0, y0);
                            break;
                        case 's':
                            for (let y=0; y<=y0; y++)
                                for (let x=0; x<((y==y0)?x0:this.width); x++)
                                    this.putc(undefined, {x, y});
                            this.setpos(x0, y0);
                            break;
                        case 'e':
                            for (let y=y0; y<this.height; y++)
                                for (let x=((y==y0)?x0:0); x<this.width; x++)
                                    this.putc(undefined, {x, y});
                            this.setpos(x0, y0);
                            break;

                        // justify left/center/right, with default or explicit stop
                        // explicitly justified text is delimited with matching paren
                        // or arbitrary matching character
                        // use \f@ to specify explicit tab stop, eg:
                        //   \f>/dexter\ndroit/ => justify 'dexter' and 'droit' to right-hand edge
                        //   \f^(centrist) => center-align 'centrist'
                        //   \f@\x04>[indent\n\some\n\lines] => left-justify text @ indent 4
                        case '@':  // follow with single byte tab stop value and tab type
                        case '^':  // follow ^,>,< with delimited text block
                        case '>':
                        case '<':  {
                            if (k == '@') {  // \f@\x3^...
                                const stop = nextval(),
                                    ch = nextch();
                                if (!Object.keys(stops).includes(ch))
                                    throw new Error('Bad @ sequence, expected value followed by one of ^<>');
                                justify = ch as keyof typeof stops;
                                stops[justify] = stop;
                                this.setpos(stop, this.y);
                            } else {
                                justify = k;
                            }
                            jlen = 0;
                            break;
                        }
                        case '/': // stop justifying
                            justify = undefined; break;
                        default:
                            throw new Error(`Unknown formatting character '${k}'`)
                    }
                    break;
                }
                default:
                    outch(c);
            }

        }

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

export type {AnticColor, FontMap, Glyph, GlyphOpts, Sprite, SpriteOpts, LayerOpts};

export {fontMap, atasciiFont, GlyphAnimation, MappedDisplayLayer, SpriteDisplayLayer, DisplayLayer};