import m from 'mithril';
import type {AnticColor, Glyph, Sprite, DisplayLayer, FontMap, LayerOpts} from './anticmodel';
import {GlyphAnimation} from './anticmodel';
import {css, cx, keyframes} from '@emotion/css';
import {colorPalettes} from './palettes';
import {options} from './config';

const palette = colorPalettes[options.colorPalette];

function antic2rgb(color?: AnticColor): string|undefined {
    if (color == null) return undefined;
    if (!Number.isInteger(color) || color < 0 || color > 255) {
        throw new Error(`DisplayLayer: Invalid antic color ${color}`);
    }
    return palette[color >> 1];
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

function maybeAnimate(elt: Element|undefined, animate: GlyphAnimation|undefined, f: FontMap) {
    if (!elt) return;
    if (animate == null) {
        elt.getAnimations().forEach(a => a.cancel());
        // also deal with the class-based animation we're using as a workaround
        const kids = elt.getElementsByClassName('glyph-foreground');
        if (kids.length) {
            const kid = kids[0] as HTMLElement,
                animClass = kid.dataset.animClass;
            if (animClass) kid.classList.remove(animClass);
        }
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
                const kid = kids[0] as HTMLElement,
                    dir = animate == GlyphAnimation.flash ? 'normal': 'reverse',
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

                kid.classList.add(anim);
                kid.dataset.animClass = anim;
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
        if ((g.opacity ?? 1) == 0) {
            return;  // skip invisible glyphs
        }
        const sz = f.glyphSize;
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
                    'pointer-events': g.backgroundColor != null ? 'auto': null,
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
    view: ({attrs: {g, f, defaults}}): m.Children => {
        if ((g.opacity ?? 1) == 0) {
            return;
        }
        const {glyphSize: sz, glyphsPerRow: nc} = f;
        return m('.glyph-foreground', {
            style: {
                'background-color': antic2rgb(
                    g.invert
                    ? (g.backgroundColor ?? defaults.backgroundColor ?? defaults.layerColor)
                    : g.foregroundColor
                ),
                'pointer-events': g.foregroundColor != null ? 'auto': null,
                '-webkit-mask-position': `${-(g.c % nc) * sz}px ${-Math.floor(g.c / nc) * sz}px`,
                'mask-position': `${-(g.c % nc) * sz}px ${-Math.floor(g.c / nc) * sz}px`,
            }
        })
    }
}

export type {DisplayAttr, GlyphAttr, Glyph};
export {antic2rgb, DisplayComponent, GlyphComponent, BlockComponent};