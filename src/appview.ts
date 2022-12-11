import m from 'mithril';
import {DirectionKey, directions} from './defs';
import {AnticColor, DisplayLayer, MappedDisplayLayer, SpriteDisplayLayer} from './anticmodel';
import {BlockComponent, DisplayAttr, GlyphAttr, type Glyph} from './anticview';
import {antic2rgb, DisplayComponent, GlyphComponent} from './anticview';
import {css, cx} from '@emotion/css';

interface HelpScreenModel {
    window: MappedDisplayLayer
}

interface ScreenModel {
    dateWindow: MappedDisplayLayer,
    infoWindow: MappedDisplayLayer,
    errorWindow: MappedDisplayLayer,

    mapLayer: MappedDisplayLayer,
    labelLayer: SpriteDisplayLayer,
    unitLayer: SpriteDisplayLayer,
    kreuzeLayer: SpriteDisplayLayer,
    maskLayer: MappedDisplayLayer,
}

interface FlagModel {
    help: boolean,
    extras: boolean,
    debug: boolean,
    zoom: boolean,
}

interface LayerAttrs {hscr: HelpScreenModel, scr: ScreenModel, flags: FlagModel}

const Layout: m.Component<LayerAttrs> = {
    view: ({attrs: {hscr, scr, flags}}) => {
        return m('.layout', {
                class: css`
                    background-color: ${antic2rgb(0xD4)};
                    padding: 12px;
                    height: 100%;
                    width: 100%;
                `
            },
            m('.screen', {
                    class: css`
                        width: 320px;        /* 40x24 8px characters */
                        height: 192px;
                        transform: scale(4);
                        transform-origin: top center;
                        margin: 0 auto;
                        position: relative;
                    `,
                },
                flags.help ? m(HelpComponent, {hscr}) : m(GameComponent, {scr, flags})
            )
        )
    }
}

const HelpComponent: m.Component<{hscr: HelpScreenModel}> = {
    onupdate: ({attrs: {hscr: {window}}}) => {
        window.dirty = false;
    },
    view: ({attrs: {hscr: {window}}}) => {
        return m(DisplayComponent, {
            display: window,
            class: 'help',
        })
    },
}

const GameComponent: m.Component<{scr: ScreenModel, flags: FlagModel}> = {
    onupdate: ({attrs: {scr}}) => {
        Object.values(scr).forEach(layer => (layer as DisplayLayer).dirty = false);
    },
    view: ({attrs: {flags, scr: {
            dateWindow, infoWindow, errorWindow,
            mapLayer, labelLayer, unitLayer, kreuzeLayer, maskLayer}}}) => {
        return [
            // double-width date-window at the top
            m(DisplayComponent, {
                display: dateWindow,
                class: ['game', css`
                    transform-origin: top left;
                    transform: scale(2, 1);
                `],
            }),
            m(DividerComponent, {color: 0x1A}),
            // central fixed-size window containing the scrollable map
            m('.map-scroller', {
                    class: css`
                        height: 144px;
                        overflow: scroll;
                    `,
                },
                // the full-sized map
                m('.map-panel', {
                        class: css`
                            /* 48 x 41  8px sq cells */
                            width: 384px;
                            height: 328px;
                            overflow: hidden;
                            position: relative;
                            transform-origin: top left;

                            /* stack the layers */
                            .display-layer {
                                position: absolute;
                                top: 0;
                            }
                        `,
                        style: {transform: flags.zoom ? 'scale(2)': null},
                    },
                    [
                        // bottom layer showing terrain
                        m(DisplayComponent, {
                            display: mapLayer,
                            class: [
                                'terrain',
                                css`
                                    .display-layer, .glyph-foreground {
                                        transition: background-color 1s linear;
                                    }
                                `
                            ],
                        }),
                        // conditionally show text labels near cities
                        flags.extras ? m(DisplayComponent, {
                            display: labelLayer,
                            glyphComponent: LabelComponent,
                            class: [
                                'labels',
                                css`
                                    pointer-events: none;
                                `
                            ],
                        }) : null,
                        // layer with unit icons as sprites
                        //TODO does flags conditional work with dirty indicator
                        m(DisplayComponent, {
                            display: unitLayer,
                            glyphComponent: flags.extras ? HealthBarGlyphComponent: GlyphComponent,
                            class: [
                                'units',
                                css`
                                    .glyph {
                                        transition: transform 250ms linear;
                                        transition: opacity 500ms linear;
                                    }
                                    .glyph-background, .glyph-foreground {
                                        transition: background-color 1s linear;
                                    }
                                `
                            ],
                        }),
                        // conditionally show current order paths for all units
                        flags.extras ? m(SVGDisplayComponent, {
                            display: unitLayer,
                            class: [
                                'orders',
                                css`
                                    opacity: 0.5;
                                `
                            ],
                        }) : null,
                        // conditionally show a semit-transparent mask to highlight unit reach
                        flags.extras ? m(DisplayComponent, {
                            display: maskLayer,
                            glyphComponent: BlockComponent,
                            class: [
                                'mask',
                                css`
                                    opacity: 0.5;
                                    .glyph {
                                        pointer-events: none;
                                    }
                                `
                            ]
                        }) : null,
                        // show animated orders for focussed unit
                        m(DisplayComponent, {
                            display: kreuzeLayer,
                            glyphComponent: KreuzeComponent,
                            class: ['kreuze'],
                        }),
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
        return m('.' + css`
            height: 2px;
            background-color: ${antic2rgb(color)};
        `);
    }
}

const LabelComponent: m.Component<GlyphAttr> = {
    view: ({attrs: {g: {props}, defaults: {foregroundColor}}}) => {
        const label = props?.label as string;
        return m('.' + css`
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

interface HealthBarAttr {cstrng?: number, mstrng?: number}

const HealthBarGlyphComponent: m.Component<GlyphAttr> = {
    view: ({attrs: {g, f, defaults}}) => {
        // add an optional health bar
        const {cstrng, mstrng} = (g.props ?? {}) as HealthBarAttr;
        return [
            m(GlyphComponent, {g, f, defaults}),
            (cstrng != null && mstrng != null)
            ? m('.' + css`
                    position:  absolute;
                    bottom: 0;
                    right: 0;
                    width: 6px;
                    height: 6px;
                    padding: 0.5px;
                `,
                m('.' + css`
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
                    {style: {width: `${90 * mstrng/255}%`}},
                    m('.' + css`
                            background-color: rgb(50,205,50, 0.8);
                            height: 100%;
                        `,
                        {style: {width: `${100 * cstrng/mstrng}%`}},
                    )
                )
            ) : null,
        ]
    }
}

const SVGDisplayComponent: m.Component<DisplayAttr> = {
    onbeforeupdate({attrs: {display}}) {
        // false prevents diff for current element
        return display.dirty;
    },
    view: ({attrs: {display, class: kls = []}}) => {
        const
            f = display.fontmap,
            sz = f.glyphSize;

        return m('svg[version="1.1"][xmlns="http://www.w3.org/2000/svg"].display-layer',
            {
                width: sz * display.width,
                height: sz * display.height,
                class: cx(css`
                    position: relative;
                    background-color: ${antic2rgb(display.layerColor)};
                    pointer-events: ${display.layerColor != null ? 'auto': 'none'};
                `, ...(typeof(kls) === 'string' ? [kls]: kls))
            },
            m('g',
                {
                    transform: "scale(8)"
                },
                display.spritelist().filter(g => g.props?.orders).map(g => {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const orders = g.props!.orders as DirectionKey[];
                    return m('g',
                        {
                            key: g.key,
                            // unit icon centers are 1 pixel offset, so adjust by 1/16
                            transform: `translate(${g.x + 0.5625},${g.y + 0.5625}) scale(-1)`,
                            class: css`
                                fill: ${antic2rgb(g.foregroundColor)};
                                stroke: ${antic2rgb(g.foregroundColor)};
                            `
                        },
                        m(UnitPathComponent, {orders})
                    );
                })
            )
        );
    }
}

function kreuzeAnimation(elt: HTMLElement, g: Glyph) {
    const orders = (g.props?.orders ?? []) as DirectionKey[],
        arrow = Object.values(directions).findIndex(d => d.icon == g.c) as DirectionKey|-1,
        steps = [{
            transform: 'translate(0px, 0px)',
            opacity: orders.length && orders[0] == arrow ? 1: 0
        }];
    let dx = 0, dy = 0;
    orders.forEach(d => {
        const {dlon, dlat} = directions[d];
        for (let i=0; i<2; i++) {
            // take two half steps so opacity transition is quicker
            dx -= dlon/2; dy -= dlat/2;
            steps.push({transform: `translate(${dx*8}px, ${dy*8}px)`, opacity: d == arrow ? 1: 0});
        }
    })
    if (arrow == -1) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        elt.style.transform = steps.pop()!.transform;
    } else {
        elt.getAnimations().forEach(a => a.cancel());
        if (orders.length) {
            elt.animate(steps, {duration: 500*orders.length, iterations: Infinity});
        }
    }
}

const KreuzeComponent: m.Component<GlyphAttr> = {
    oncreate: ({dom, attrs: {g}}) => kreuzeAnimation(dom as HTMLElement, g),
    onupdate: ({dom, attrs: {g}}) => kreuzeAnimation(dom as HTMLElement, g),
    view: GlyphComponent.view,
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
            const {dlon: dx, dlat: dy} = directions[d];
            // add prev corner
            if (lastd == null) {
                s = `M${dx*r},${dy*r}`;
            } else {
                const turn = (lastd-d+4) % 4;
                if (turn == 0) {
                    s += ` l${dx*2*r},${dy*2*r}`;
                } else if (turn % 2) {
                    const cx = (dx + directions[lastd].dlon)*r,
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

export type {HelpScreenModel, ScreenModel, FlagModel};
export {Layout};