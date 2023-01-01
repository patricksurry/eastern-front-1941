import m from 'mithril';
import type {AnticColor, Glyph, Sprite, DisplayLayer, FontMap, LayerOpts} from './anticmodel';
import {GlyphAnimation} from './anticmodel';
import {css, cx, keyframes} from '@emotion/css';

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

interface GlyphAttr {g: Glyph, f: FontMap, defaults: LayerOpts}
interface SpriteAttr extends GlyphAttr {g: Sprite, gc: m.Component<GlyphAttr>}
interface DisplayAttr {
    display: DisplayLayer,
    glyphComponent?: m.Component<GlyphAttr>,
    class?: string | string[],  //TODO dangerous if class is non-constant with display.dirty
}

const DisplayComponent: m.Component<DisplayAttr> = {
    onbeforeupdate({attrs: {display}}) {
        // false prevents diff for current element
        return display.dirty;
    },
    view: ({attrs: {class: kls = [], display, glyphComponent}}) => {
        const
            gc = glyphComponent ?? GlyphComponent,
            f = display.fontmap,
            sz = f.glyphSize,
            mx = f.glyphsPerRow * sz,
            my = Math.ceil(f.numGlyphs / f.glyphsPerRow) * sz,
            // emulate pointer-events: visible https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
            visible = (display.opacity ?? 1) > 0;

//TODO clean up the styles here
        return m('.display-layer', {
                class: cx(
                    css`
                        position: relative;
                        width: ${sz * display.width}px;
                        height: ${sz * display.height}px;
                        opacity: ${display.opacity};
                        background-color: ${antic2rgb(display.layerColor)};
                        pointer-events: ${display.layerColor != null ? 'auto':'none'};
                        /* set default glyph fg/bg colors to be overridden as needed */
                        .glyph {
                            position: absolute;
                            width: ${sz}px;
                            height: ${sz}px;
                            background-color: ${antic2rgb(display.backgroundColor)};
                            pointer-events: ${visible && display.backgroundColor != null ? 'auto':'none'}
                        }
                        .glyph-foreground {
                            width: 100%;
                            height: 100%;
                            position: absolute;
                            image-rendering: pixelated;
                            -webkit-mask-image: url(${f.maskImage});
                            mask-image: url(${f.maskImage});
                            -webkit-mask-size: ${mx}px ${my}px;
                            mask-size: ${mx}px ${my}px;
                            background-color: ${antic2rgb(display.foregroundColor)};
                            pointer-events: ${visible && display.foregroundColor != null ? 'auto':'none'}
                        }
                    `,
                    ...(typeof(kls) === 'string' ? [kls]: kls)
                ),
            },
            display.spritelist().map(g =>
                m(SpriteComponent, {key: g.key, g, f, gc, defaults: display.opts})
            )
        );
    }
}

function maybeAnimate(elt: Element, animate: GlyphAnimation|undefined, f: FontMap) {
    if (animate == null) {
        elt.getAnimations().forEach(a => a.cancel());
        return;
    }
    switch (animate) {
        case GlyphAnimation.blink:
            elt.animate(
                [
                    {opacity: 0.0},
                    {opacity: 0.0},
                    {opacity: 1.0},
                    {opacity: 1.0},
                ],
                {duration: 1000, easing: 'ease-in', iterations: Infinity}
            );
            break;
        case GlyphAnimation.flash:
        case GlyphAnimation.flash_reverse:
            {
                const kids = elt.getElementsByClassName('glyph-foreground');
                if (!kids.length) break;
                const dir = animate == GlyphAnimation.flash ? 'normal': 'reverse',
                    flashFrames = keyframes`
                        0% {
                            -webkit-mask-image: none;
                            mask-image: none
                        }
                        100% {
                            -webkit-mask-image: url(${f.maskImage});
                            mask-image: url(${f.maskImage});
                        }
                    `,
                    anim = css`animation: ${flashFrames} 250ms infinite ${dir};`;

                kids[0].classList.add(anim);
                // Chrome bug: doesn't work in WAAPI, see https://stackoverflow.com/questions/74966631/how-do-i-use-chromes-webkit-mask-image-in-the-web-animations-api
                /*
                kids[0].animate(
                    [
                        {
                            webkitMaskImage: 'none',
                            maskImage: 'none',
                        },
                        {
                            webkitMaskImage: `url(${f.maskImage})`,
                            maskImage: `url(${f.maskImage})`,
                        },
                    ],
                    {duration: 125, iterations: Infinity, direction: dir}
                );
                */
            }
            break;
        default: {
            const fail: never = animate;
            throw new Error(`Unhandled animation type: ${fail}`)
        }
    }

}

// background block that positions the glyph
const SpriteComponent: m.Component<SpriteAttr> = {
    oncreate: ({dom, attrs: {g: {animate}, f}}) => maybeAnimate(dom, animate, f),
    onupdate: ({dom, attrs: {g: {animate}, f}}) => maybeAnimate(dom, animate, f),
    view: ({attrs: {g, f, gc, defaults}}) => {
        const sz = f.glyphSize,
            visible = (g.opacity ?? 1) > 0;

        return m('.glyph',
            {
                onclick: g.onclick,
                onmouseover: g.onmouseover,
                style: {
                    opacity: g.opacity,
                    'background-color': antic2rgb(
                        g.invert
                        ? (g.foregroundColor ?? defaults.foregroundColor)
                        : g.backgroundColor
                    ),
                    'pointer-events': visible && g.backgroundColor != null ? 'auto': null,
                    transform: `translate(${g.x * sz}px, ${g.y * sz}px)`,
                },
            },
            m(gc, {g, f, defaults})
        )
    }
}

// a nil glyph which draws blocks of backgroundColor ignoring font and foreground
const BlockComponent: m.Component<GlyphAttr> = {
    view: () => null,
}

// foreground masked block that draws the character within a block
const GlyphComponent: m.Component<GlyphAttr> = {
    oncreate: ({dom, attrs: {g: {animate}, f}}) => maybeAnimate(dom, animate, f),
    onupdate: ({dom, attrs: {g: {animate}, f}}) => maybeAnimate(dom, animate, f),
    view: ({attrs: {g, f, defaults}}): m.Children => {
        const {glyphSize: sz, glyphsPerRow: nc} = f,
            visible = (g.opacity ?? 1) > 0;

        return m('.glyph-foreground', {
            style: {
                'background-color': antic2rgb(
                    g.invert
                    ? (g.backgroundColor ?? defaults.backgroundColor ?? defaults.layerColor)
                    : g.foregroundColor
                ),
                'pointer-events': visible && g.foregroundColor != null ? 'auto': null,
                '-webkit-mask-position': `${-(g.c % nc) * sz}px ${-Math.floor(g.c / nc) * sz}px`,
                'mask-position': `${-(g.c % nc) * sz}px ${-Math.floor(g.c / nc) * sz}px`,
            }
        })
    }
}

export type {DisplayAttr, GlyphAttr, Glyph};
export {antic2rgb, DisplayComponent, GlyphComponent, BlockComponent};