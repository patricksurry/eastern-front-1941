import m from 'mithril';
import type {AnticColor, Glyph, Sprite, FontMap, DisplayLayer, LayerOpts} from './antic';
import {DirectionKey, directions} from './defs';
import {antic2rgb} from './antic';
import {injectGlobal, css, cx} from '@emotion/css';

injectGlobal(`
body {
    background-color: ${antic2rgb(0xD4)};
}
`);

function cssobj(ds: TemplateStringsArray, ...rest: any[]) {
    return {class: css(ds, ...rest)};
}

interface ScreenModel {
    helpWindow: DisplayLayer,

    dateWindow: DisplayLayer,
    infoWindow: DisplayLayer,
    errorWindow: DisplayLayer,

    mapLayer: DisplayLayer,
    labelLayer: DisplayLayer,
    unitLayer: DisplayLayer,
    maskLayer: DisplayLayer,
}

function renderScreen(model: ScreenModel, helpMode: boolean = false) {
    m.render(document.body,
        m(Layout,
            helpMode
            ? m(HelpComponent, {key: 'help', model})
            : m(GameComponent, {key: 'game', model})
        )
    )
}

const Layout: m.Component = {
    view: ({children}) => {
        return m('',
            cssobj`
                width: 320px;        /* 40x24 8px characters */
                height: 192px;
                transform: scale(4);
                transform-origin: top center;
                margin: 0 auto;
                position: relative;
            `,
            children
        );
    }
}

const HelpComponent: m.Component<{model: ScreenModel}> = {
    view: ({attrs: {model: {helpWindow}}}) => m('',
        m(DisplayComponent, {display: helpWindow}),
    )
}

const GameComponent: m.Component<{model: ScreenModel}> = {
    view: ({attrs: {model: {
            dateWindow, infoWindow, errorWindow,
            mapLayer, labelLayer, unitLayer, maskLayer}}}) => {
        return [
            m('',       // double-width date-window
                cssobj`
                    transform-origin: top left;
                    transform: scale(2, 1);
                `,
                m(DisplayComponent, {display: dateWindow}),
            ),
            m(DividerComponent, {color: 0x1A}),
            m('',  // map container
                cssobj`
                    height: 144px;
                    overflow: scroll;
                `,
                m('',  // map panel
                    cssobj`
                        /* 48 x 41  8px sq cells */
                        width: 384px;
                        height: 328px;
                        overflow: hidden;
                        position: relative;

                        /* stack the layers */
                        .display-layer {
                            position: absolute;
                            top: 0;
                        }
                    `,
                    [
                        m('.terrain',
                            cssobj`
                                .display-layer, .glyph-foreground {
                                    transition: background-color 1s linear;
                                }
                            `,
                            m(DisplayComponent, {display: mapLayer}),
                        ),
                        m('.labels',
                            m(DisplayComponent, {
                                display: labelLayer,
                                glyphComponent: LabelComponent,
                            }),
                        ),
                        m('.units',
                            cssobj`
                                .glyph {
                                    transition: transform 250ms linear;
                                }
                                .glyph-background {
                                    transition: background-color 1s linear;
                                }
                            `,
                            m(DisplayComponent, {
                                display: unitLayer,
                                glyphComponent: HealthBarGlyphComponent,
                            }),
                        ),
                        m('.orders',
                            cssobj`
                                opacity: 0.5;
                                pointer-events: none;
                            `,
                            m(SVGDisplayComponent, {
                                display: unitLayer
                            })
                        ),
                        m('.mask',
                            cssobj`
                                opacity: 0.5;
                                pointer-events: none;
                            `,
                            m(DisplayComponent, {
                                display: maskLayer,
                            })
                        )
                    ]
                ),
            ),
            m(DividerComponent, {color: 0x02}), // same as map
            m(DisplayComponent, {display: infoWindow}),
            m(DividerComponent, {color: 0x8A}),
            m(DisplayComponent, {display: errorWindow}),
            m(DividerComponent, {color: 0x8A}),
        ]
    }
};

interface DividerAttr {
    color: AnticColor
}

const DividerComponent: m.Component<DividerAttr> = {
    view: ({attrs: {color}}) => {
        return m('', cssobj`
            height: 2px;
            background-color: ${antic2rgb(color)};
        `);
    }
}

interface GlyphAttr {g: Glyph, f: FontMap, defaults: LayerOpts};
interface SpriteAttr extends GlyphAttr {g: Sprite};
interface DisplayAttr {
    display: DisplayLayer,
    glyphComponent?: m.Component<GlyphAttr>,
}

const DisplayComponent: m.Component<DisplayAttr> = {
    onbeforeupdate({attrs: {display}}) {
        // false prevents diff for current element
        console.log('display.onbeforeupdate', display.dirty);
//TODO        return display.dirty;
    },
    view: ({attrs: {display, glyphComponent}}) => {

        console.log('display.view', display.dirty);
//TODO        display.dirty = false;
        const
            f = display.fontmap,
            sz = f.glyphSize,
            mx = f.glyphsPerRow * sz,
            my = Math.ceil(f.numGlyphs / f.glyphsPerRow) * sz;

        return m('.display-layer',
            cssobj`
                position: relative;
                width: ${sz * display.width}px;
                height: ${sz * display.height}px;
                background-color: ${antic2rgb(display.layerColor)};

                .glyph {
                    position: absolute;
                    width: ${sz}px;
                    height: ${sz}px;
                    pointer-events: auto;
                }
                .glyph-foreground, .glyph-background {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    pointer-events: none;  /* reduce hit-testing by just looking at parent */
                }
                .glyph-background {
                    background-color: ${antic2rgb(display.backgroundColor)};
                }
                .glyph-foreground {
                    image-rendering: pixelated;
                    -webkit-mask-image: url(${f.maskImage});
                    -webkit-mask-size: ${mx}px ${my}px;
                    background-color: ${antic2rgb(display.foregroundColor)};
                }
            `,
            display.spritelist().map(g =>
                m(SpriteComponent,
                    {key: g.key, g, f, defaults: display},
                    m(glyphComponent ?? GlyphComponent,
                        {g, f, defaults: display}
                    )
                )
            )
        );
    }
}

function maybeHandler(props: {[k: string]: unknown}|undefined, name: string) {
    const f = (props && (name in props))
        ? props[name] as (e: Event) => void
        : undefined;
    return f;
}

const SpriteComponent: m.Component<SpriteAttr> = {
    view: ({attrs: {g, f}, children}) => {
        const sz = f.glyphSize;
        return m('.glyph',
            {
                onclick: maybeHandler(g.props, 'onclick'),
                onmouseover: maybeHandler(g.props, 'onmouseover'),
                class: css`
                    transform: translate(${g.x * sz}px, ${g.y * sz}px)
                `,
            },
            children
        );
    }
}

const GlyphComponent: m.Component<GlyphAttr> = {
    view: ({attrs: {g, f}}): m.ChildArray => {
        const k = g.c + f.startOffset,
            sz = f.glyphSize;
        return [
            m('.glyph-background', {
                style: {
                    'background-color': antic2rgb(g.backgroundColor),
                }
            }),
            m('.glyph-foreground', {
                style: {
                    'background-color': antic2rgb(g.foregroundColor),
                    '-webkit-mask-position': `${-(k % f.glyphsPerRow) * sz}px ${-Math.floor(k / f.glyphsPerRow) * sz}px`
                }
            }),
        ];
    }
}

const LabelComponent: m.Component<GlyphAttr> = {
    view: ({attrs: {g: {props}, defaults: {foregroundColor}}}) => {
        let label = props?.label as string;
        return m('',
            cssobj`
                transform: translate(4px, -4px);
                font-family: verdana;
                font-size: 2pt;
                white-space: nowrap;
                display: flex;
                justify-content: center;
                width: 0;
                color: ${antic2rgb(foregroundColor)}}};
            `,
            label
        )
    }
}

interface HealthBarAttr {cstrng?: number, mstrng?: number};

const HealthBarGlyphComponent: m.Component<GlyphAttr> = {
    view: ({attrs: {g, f, defaults}}) => {
        // add an optional health bar
        let {cstrng, mstrng} = (g.props ?? {}) as HealthBarAttr;
        if (cstrng == null || mstrng == null) return;
        return [
            m(GlyphComponent, {g, f, defaults}),
            m('',
                cssobj`
                    position:  absolute;
                    bottom: 0;
                    right: 0;
                    width: 6px;
                    height: 6px;
                    padding: 0.5px;
                `,
                m('',
                    {
                        class: css`
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            margin: 5%;
                            width: 90%;
                            height: 1px;
                            background-color: rgb(50,205,50, 0.4);
                            border-radius: 1px;
                            overflow: hidden;
                        `,
                        style: {width: `${90 * mstrng/255}%`},
                    },
                    m('',
                        {
                            class: css`
                                background-color: rgb(50,205,50, 0.8);
                                height: 100%;
                            `,
                            style: {width: `${100 * cstrng/mstrng}%`},
                        }
                    )
                )
            )
        ]
    }
}

const SVGDisplayComponent: m.Component<DisplayAttr> = {
    onbeforeupdate({attrs: {display}}) {
        // false prevents diff for current element
        console.log('display.onbeforeupdate', display.dirty);
//TODO won't work if we render twice        return display.dirty;
    },
    view: ({attrs: {display}}) => {

        console.log('display.view', display.dirty);
//TODO        display.dirty = false;
        const
            f = display.fontmap,
            sz = f.glyphSize;

        return m('svg[version="1.1"][xmlns="http://www.w3.org/2000/svg"].display-layer',
            {
                width: sz * display.width,
                height: sz * display.height,
                class: css`
                    position: relative;
                    background-color: ${antic2rgb(display.layerColor)};
                `
            },
            m('g',
                {
                    transform: "scale(8)"
                },
                display.spritelist().map(g => {
                    const orders = ((g.props ?? {}).orders as DirectionKey[]|undefined) ?? [];
                    return m('g',
                        {
                            key: g.key,
                            transform: `translate(${g.x + 0.5},${g.y + 0.5}) scale(-1)`,
                            class: css`
                                fill: ${antic2rgb(g.foregroundColor)};
                                stroke: ${antic2rgb(g.foregroundColor)};
                            `
                        },
                        m(UnitPathComponent, {orders})
                    )
                })
            )
        );
    }
}

const UnitPathComponent: m.Component<{orders: DirectionKey[]}> = {
    view: ({attrs: {orders}}) => {
        // form the path element from the list of orders
        const r = 0.25;
        let x = 0,
            y = 0,
            lastd: DirectionKey|null = null,
            s = "M0,0";

        orders.forEach(d => {
            let dir = directions[d],
                dx = dir.dlon,
                dy = dir.dlat;
            // add prev corner
            if (lastd == null) {
                s = `M${dx*r},${dy*r}`;
            } else {
                const turn = (lastd-d+4) % 4;
                if (turn == 0) {
                    s += ` l${dx*2*r},${dy*2*r}`;
                } else if (turn % 2) {
                    let cx = (dx + directions[lastd].dlon)*r,
                        cy = (dy + directions[lastd].dlat)*r;
                    s += ` a${r},${r} 0 0 ${turn==1?0:1} ${cx},${cy}`
                }
            }
            lastd = d;
            s += ` l${dx*(1-2*r)},${dy*(1-2*r)}`;
            x += dx;
            y += dy;
        })
        if (orders.length) s += ` L${x},${y}`;

        return [
            m('path', {d: s, class: css`
                fill: none;
                stroke-linecap: round;
                stroke-width: 1px;
                vector-effect: non-scaling-stroke;
            `}),
            orders.length
                ? m('circle', {r, cx: x, cy: y, class: css`
                    stroke: none;
                `})
                : undefined
        ];
    }
}

export {renderScreen, ScreenModel, Layout, GameComponent, HelpComponent};