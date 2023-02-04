import m from 'mithril';
import {css} from '@emotion/css';

import {DirectionKey, directions} from '../engine/defs';
import {UnitMode} from '../engine/unit';

import {AnticColor, DisplayLayer} from '../antic/anticmodel';
import {
    antic2rgb, DisplayComponent, GlyphComponent,
    BlockComponent, DisplayAttr, GlyphAttr, type Glyph
} from '../antic/anticview';

import type {AppModel} from './appmodel';
import type {HelpModel} from './help';

const screenWidth = 42,
    screenHeight = 24,
    mapHeight = 18;

class AppView {
    app: AppModel;
    help: HelpModel;
    #pinmap?: {x: number, y: number}; // the glyph coordinate to pin at map center

    constructor(app: AppModel, help: HelpModel) {
        this.app = app;
        this.help = help;
        m.mount(document.body, {view: () => m(Layout, {view: this})});
        window.addEventListener('resize', () => this.redraw());
    }
    redraw() {
        m.redraw()
    }
    scrollForMapCenter(): {top: number, left: number} | undefined {
        if (!this.#pinmap) return;
        const
            {x, y} = this.#pinmap,
            z = this.app.zoom ? 2: 1,
            sz = z * this.app.mapLayer.fontmap.glyphSize,
            xc = screenWidth / 2 / z,
            yc = mapHeight / 2 / z;
        return {left: (x - xc) * sz, top: (y - yc) * sz}
    }
    unpinMap() {
        this.#pinmap = undefined;
    }
    pinMapCenter(): void;
    pinMapCenter(x: number, y: number): void;
    pinMapCenter(x?: number, y?: number): void {
        if (x != null && y != null) {
            this.#pinmap = {x, y};
            return;
        }
        const
            z = (this.app.zoom ? 2: 1),
            sz = z * this.app.mapLayer.fontmap.glyphSize,
            xc = screenWidth / 2 / z,
            yc = mapHeight / 2 / z;

        const elts = document.getElementsByClassName('map-scroller');
        if (elts.length == 0) return;
        const elt = elts[0] as HTMLElement;
        this.#pinmap = {
            x: elt.scrollLeft / sz + xc,
            y: elt.scrollTop / sz + yc,
        }
    }
}

document.body.style.backgroundColor = antic2rgb(0xD4) as string;

const Layout: m.Component<{view: AppView}> = {
    view: ({attrs: {view}}) => {
        // find the max integer scaling we can use based on (screenWidth x screenHeight) 8 pix chars
        const scale = Math.floor(Math.min(window.innerWidth/screenWidth, window.innerHeight/screenHeight)/8) || 1;
        return m('.layout', {
                class: css`
                    padding: 12px;
                    height: 100vh;
                    width: 100vw;
                `
            },
            m('.screen', {
                    class: css`
                        width: ${screenWidth * 8}px;
                        height: ${screenHeight * 8}px;
                        transform: translate(-50%, -50%) scale(${scale});
                        position: fixed;
                        top: 50%;
                        left: 50%;
                    `,
                },
                view.app.help ? m(HelpComponent, {help: view.help}) : m(GameComponent, {view})
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

const GameComponent: m.Component<{view: AppView}> = {
    // called after DOM element is updated,  guaranteed to run at the end of the render cycle
    onupdate: ({attrs: {view: {app}}}) => {
        Object.values(app)
            .filter(v => v instanceof DisplayLayer)
            .forEach(layer => layer.dirty = false);
    },
    view: ({attrs: {view}}) => {
        return [
            // double-width date-window at the top
            m(DisplayComponent, {
                display: view.app.dateWindow,
                class: ['game', css`
                    transform-origin: top left;
                    transform: scale(2, 1);
                `],
            }),
            m(DividerComponent, {color: 0x1A}),
            m(MapComponent, {view}),
            m(DividerComponent, {color: 0x02}), // same as map
            m(DisplayComponent, {display: view.app.infoWindow}),
            m(DividerComponent, {color: 0x8A}),
            m(DisplayComponent, {display: view.app.errorWindow}),
            m(DividerComponent, {color: 0x8A}),
        ]
    }
};

const MapComponent: m.Component<{view: AppView}> = {
    onupdate: ({attrs: {view}, dom: elt}) => {
        // possibly center the map on a target x,y square
        const pin = view.scrollForMapCenter();
        if (!pin) return;
        elt.scrollTo(pin.left, pin.top);
        view.unpinMap();
    },
    view: ({attrs: {view: {app}}}) => {
        // central fixed-size window containing the scrollable map
        return m('.map-scroller', {
                class: css`
                    height: ${mapHeight * 8}px;
                    overflow: scroll;
                `,
            },
            // the full-sized map
            m('.map-panel', {
                    class: css`
                        width: ${app.mapLayer.width * 8}px;
                        height: ${app.mapLayer.height * 8}px;
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
                    app.extras && m(DisplayComponent, {
                        display: app.labelLayer,
                        glyphComponent: LabelComponent,
                        class: [
                            'labels',
                            css`
                                pointer-events: none;
                            `
                        ],
                    }),
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
                    app.extras && m(OrdersOverlayComponent, {
                        display: app.unitLayer,
                    }),
                    // conditionally show a semit-transparent mask to highlight unit reach
                    app.extras && m(DisplayComponent, {
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
                    }),
                    // show animated orders for focussed unit
                    m(DisplayComponent, {
                        display: app.kreuzeLayer,
                        glyphComponent: KreuzeComponent,
                        class: ['kreuze'],
                    }),
                ]
            ),
        );
    }
}

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
        return m(
            '.' + css`
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
                m(
                    '.' + css`
                        transform: translate(0, -4px);
                        font-size: 2pt;
                        color: ${antic2rgb(foregroundColor)};
                    `,
                    label
                ),
                (points || null) && m(
                    '.' + css`
                        transform: translate(0, -2.5px);
                        text-shadow: 0 0 0.5px ${antic2rgb(0x02)};
                        font-weight: bold;
                        font-size: 5px;
                        color: ${antic2rgb(0x96)}
                    `,
                    points
                ),
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
                        (mode != null && mode != UnitMode.standard) &&
                            m('path', {
                                transform: `translate(1, 0) scale(.04) translate(-15, -6)`,
                                d: modeIcons[mode],
                                fill: antic2rgb(0x96),
                            }),
                        // indicator dot for new entry or OoS
                        (oos || enter) &&
                            m('circle', {cx: 1/8, cy: 1/8, r: 1/8, fill: oos ? ramp[0]: ramp[3]}),
                        // health bar
                        (cstrng != null && mstrng != null) &&
                            m('g', [
                                m('rect', {x: 1/8, y: 7/8, height: 1/8, width: 7/8 * mstrng/255, rx: 1/16, opacity: 0.5, fill: cfill}),
                                m('rect', {x: 1/8, y: 7/8, height: 1/8, width: 7/8 * cstrng/255, rx: 1/16, fill: cfill}),
                            ]),
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
                        const {orders, contrast, fly}
                                = g.props as {orders: DirectionKey[], contrast: AnticColor, fly: boolean},
                            fg = antic2rgb(contrast ?? g.foregroundColor);
                        return m('g',
                            {
                                key: g.key,
                                // unit icon centers are 1 pixel offset, so adjust by 1/16
                                transform: `translate(${g.x + 0.5625},${g.y + 0.5625}) scale(-1)`,
                                class: css`
                                    fill: ${fg};
                                    stroke: ${fg};
                                    stroke-linecap: round;
                                    stroke-width: 1px;
                                `
                            },
                            m(UnitPathComponent, {orders, fly})
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

const UnitPathComponent: m.Component<{orders: DirectionKey[], fly: boolean}> = {
    view: ({attrs: {orders, fly}}) => {
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
            m('path', {
                d: s,
                class: css`
                    fill: none;
                    stroke-dasharray: ${fly ? '1 2': null};
                    vector-effect: non-scaling-stroke;
                `
            }),
            orders.length
                ? m('circle', {
                    r, cx: x, cy: y,
                    class: css`
                        stroke: none;
                    `
                })
                : undefined
        ];
    }
}

export {AppView};