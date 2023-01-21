import m from 'mithril';
import {DirectionKey, directions} from './defs';
import {UnitMode} from './unit';
import {AnticColor, DisplayLayer} from './anticmodel';
import {BlockComponent, DisplayAttr, GlyphAttr, type Glyph} from './anticview';
import {antic2rgb, DisplayComponent, GlyphComponent} from './anticview';
import {css} from '@emotion/css';

import type {AppModel} from './appmodel';
import type {HelpModel} from './help';

interface LayerAttrs {app: AppModel, help: HelpModel}

class AppView {
    constructor(attrs: LayerAttrs) {
        m.mount(document.body, {view: () => m(Layout, attrs)});
    }
    redraw() {
        m.redraw()
    }
}

document.body.style.backgroundColor = antic2rgb(0xD4) as string;

const Layout: m.Component<LayerAttrs> = {
    view: ({attrs: {help, app}}) => {
        return m('.layout', {
                class: css`
                    padding: 12px;
                    height: 100vh;
                    width: 100vw;
                `
            },
            m('.screen', {
                    class: css`
                        width: 336px;        /* 42x24 8px characters */
                        height: 192px;
                        transform: scale(4);
                        transform-origin: top center;
                        margin: 0 auto;
                        position: relative;
                    `,
                },
                app.help ? m(HelpComponent, {help}) : m(GameComponent, {app})
            )
        )
    }
}

const HelpComponent: m.Component<{help: HelpModel}> = {
    onupdate: ({attrs: {help: {window}}}) => {
        window.dirty = false;
    },
    view: ({attrs: {help: {window}}}) => {
        return m(DisplayComponent, {
            display: window,
            class: 'help',
        })
    },
}

const GameComponent: m.Component<{app: AppModel}> = {
    // called after a DOM element is updated,  guaranteed to run at the end of the render cycle
    onupdate: ({attrs: {app}}) => {
        Object.values(app)
            .filter(v => v instanceof DisplayLayer)
            .forEach(layer => layer.dirty = false);
    },
    view: ({attrs: {app}}) => {
        return [
            // double-width date-window at the top
            m(DisplayComponent, {
                display: app.dateWindow,
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
                        style: {transform: app.zoom ? 'scale(2)': null},
                    },
                    [
                        // bottom layer showing terrain
                        m(DisplayComponent, {
                            display: app.mapLayer,
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
                        app.extras ? m(DisplayComponent, {
                            display: app.labelLayer,
                            glyphComponent: LabelComponent,
                            class: [
                                'labels',
                                css`
                                    pointer-events: none;
                                `
                            ],
                        }) : null,
                        // layer with unit icons as sprites
                        m(DisplayComponent, {
                            display: app.unitLayer,
                            glyphComponent: UnitComponent,
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
                        app.extras ? m(OrdersOverlayComponent, {
                            display: app.unitLayer,
                        }) : null,
                        // conditionally show a semit-transparent mask to highlight unit reach
                        app.extras ? m(DisplayComponent, {
                            display: app.maskLayer,
                            glyphComponent: BlockComponent,
                            class: [
                                'mask',
                                css`
                                    opacity: 0.33;
                                    .glyph {
                                        pointer-events: none;
                                    }
                                `
                            ]
                        }) : null,
                        // show animated orders for focussed unit
                        m(DisplayComponent, {
                            display: app.kreuzeLayer,
                            glyphComponent: KreuzeComponent,
                            class: ['kreuze'],
                        }),
                    ]
                ),
            ),
            m(DividerComponent, {color: 0x02}), // same as map
            m(DisplayComponent, {display: app.infoWindow}),
            m(DividerComponent, {color: 0x8A}),
            m(DisplayComponent, {display: app.errorWindow}),
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
        const label = props?.label as string,
            points = props?.points as number;
        return m('.' + css`
                transform: translate(4px, 0);
                font-family: verdana;
                width: 0;
                white-space: nowrap;
                div {
                    justify-content: center;
                    display: flex;
                }
            `,
            [
                m('.' + css`
                        transform: translate(0, -4px);
                        font-size: 2pt;
                        color: ${antic2rgb(foregroundColor)};
                    `,
                        label
                    ),
                points ? m('.' + css`
                        transform: translate(0, -2.5px);
                        text-shadow: 0 0 0.5px ${antic2rgb(0x02)};
                        font-weight: bold;
                        font-size: 5px;
                        color: ${antic2rgb(0x96)}
                    `,
                        points
                    ) : null,
            ]
        );
    }
}

const modeIcons = {  // no icon for normal
    // mdi icons, all with viewBox="0 0 24 24" and icon in [6,18] square
    [UnitMode.assault]: "M5,5V19H8V5M10,5V19L21,12",            // mdi-step-forward
    [UnitMode.march]: "M13,6V18L21.5,12M4,18L12.5,12L4,6V18Z",  // mdi-fast-forward
    [UnitMode.entrench]: "M18,18H6V6H18V18Z",                   // mdi-stop
};

// extend Glyph component to conditionally overlay unit annotations
const UnitComponent: m.Component<GlyphAttr> = {
    view: ({attrs}): m.Children => {
        const {g: {props}, f: {glyphSize: sz}} = attrs;

        const cstrng = props?.cstrng as number|undefined,
            mstrng = props?.mstrng as number|undefined,
            mode = props?.mode as UnitMode|undefined,
            oos = props?.oos as boolean|undefined,
            enter = props?.enter as boolean|undefined,
            ramp = [0x68, 0x38, 0x18, 0xc8].map(antic2rgb),
            cutoff = [1/4, 1/2, 3/4];

        let cfill = '';
        if (cstrng != null && mstrng != null) {
            let i=0;
            while (i < cutoff.length && cstrng/mstrng > cutoff[i]) i++;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            cfill = ramp[i]!;
        }

        return [
            m(GlyphComponent, attrs),
            m('svg[version="1.1"][xmlns="http://www.w3.org/2000/svg"].unit-overlay',
                {
                    width: sz+3,
                    height: sz+3,
                    viewBox: `-1 -1 ${sz+3} ${sz+3}`,
                    class: css`
                        position: absolute;
                        top: -1px;
                        left: -1px;
                        filter: drop-shadow(0 0 0.5px ${antic2rgb(0x02)});
                    `
                },
                m('g',
                    {
                        transform: 'scale(8)',
                    },
                    [
                        // movement mode symbol
                        mode != null && mode != UnitMode.standard
                            ? m('path', {
                                transform: `translate(1, 0) scale(.04) translate(-15, -6)`,
                                d: modeIcons[mode],
                                fill: antic2rgb(0x96),
                            })
                            : null,
                        // indicator dot for new entry or OoS
                        oos || enter
                            ? m('circle', {cx: 1/8, cy: 1/8, r: 1/8, fill: oos ? ramp[0]: ramp[3]})
                            : null,
                        // health bar
                        cstrng != null && mstrng != null
                            ? m('g', [
                                m('rect', {x: 1/8, y: 7/8, height: 1/8, width: 7/8 * mstrng/255, rx: 1/16, opacity: 0.5, fill: cfill}),
                                m('rect', {x: 1/8, y: 7/8, height: 1/8, width: 7/8 * cstrng/255, rx: 1/16, fill: cfill}),
                            ])
                            : null,
                    ]
                )
            )
        ]
    }
}


const OrdersOverlayComponent: m.Component<DisplayAttr> = {
    onbeforeupdate({attrs: {display}}) {
        // false prevents diff for current element
        return display.dirty;
    },
    view: ({attrs: {display}}) => {
        const
            f = display.fontmap,
            sz = f.glyphSize,
            sprites = display.spritelist().filter(g => g.opacity);

        return m('svg[version="1.1"][xmlns="http://www.w3.org/2000/svg"].unit-overlay',
            {
                width: sz * display.width,
                height: sz * display.height,
                class: css`
                    position: relative;
                    pointer-events: ${display.layerColor != null ? 'auto': 'none'};
                    filter: drop-shadow(0 0 0.5px ${antic2rgb(0x02)});
                `
            },
            [
                m('g',
                    {
                        transform: 'scale(8)',
                        opacity: 0.5
                    },
                    sprites.filter(g => g.props?.orders).map(g => {
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
                ),
            ]
        );
    }
}

function kreuzeAnimation(elt: HTMLElement, g: Glyph) {
    // animate the path arrows, and transform the kreuze itself to the unit position
    // we cheat a bit with arrow and kreuze position so they align with the unit's 1px offest in the 8x8 square
    const orders = (g.props?.orders ?? []) as DirectionKey[],
        arrow = Object.values(directions).findIndex(d => d.icon == g.c) as DirectionKey|-1,
        steps = [{
            transform: 'translate(1px, 1px)',
            opacity: orders.length && orders[0] == arrow ? 1: 0
        }];
    let dx = 0, dy = 0;
    orders.forEach(d => {
        const {dlon, dlat} = directions[d];
        for (let i=0; i<2; i++) {
            // take two half steps so opacity transition is quicker
            dx -= dlon/2; dy -= dlat/2;
            steps.push({transform: `translate(${dx*8 + 1}px, ${dy*8 + 1}px)`, opacity: d == arrow ? 1: 0});
        }
    })
    if (arrow == -1) {  // the Kreuze
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        elt.style.transform = `translate(${dx*8+0.5}px, ${dy*8+0.5}px)`
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

export {AppView};