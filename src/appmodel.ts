import {players, unitkinds, terraintypes, weatherdata, directions} from './defs';
import {scenarios} from './scenarios';
import {Game} from './game';
import {Grid} from './grid';
import {Unit, unitFlag, unitModes} from './unit';
import {
    type SpriteOpts, atasciiFont, fontMap,
    MappedDisplayLayer, SpriteDisplayLayer, GlyphAnimation
} from './anticmodel';

interface MithrilEvent extends Event {redraw: boolean}

const enum UIModeKey {setup, orders, resolve}

class AppModel {
    uimode = UIModeKey.setup;

    help = true;        // whether help is displayed
    // managed by setter/getter so we can repaint
    #extras = true;      // whether to show extras
    #debug = false;     // whether to show debug info
    zoom = true;        // zoom 2x or not?

    #game = new Game();
    #id = -1;         // most-recently focused unit
    #active = false;  // focus currently active?

    dateWindow = new MappedDisplayLayer(21, 2, atasciiFont, {foregroundColor: 0x6A, layerColor: 0xB0});
    infoWindow = new MappedDisplayLayer(42, 2, atasciiFont, {foregroundColor: 0x28, layerColor: 0x22});
    errorWindow = new MappedDisplayLayer(42, 1, atasciiFont, {foregroundColor: 0x22, layerColor: 0x3A});

    mapLayer!: MappedDisplayLayer;
    labelLayer!: SpriteDisplayLayer;
    unitLayer!: SpriteDisplayLayer;
    kreuzeLayer!: SpriteDisplayLayer;
    maskLayer!: MappedDisplayLayer;

    set game(g: Game) {
        if (this.#game == g) return;

        const font = fontMap(`static/fontmap-custom-${g.mapboard.font}.png`, 128 + 6),
            {width, height} = g.mapboard.extent;

        this.mapLayer = new MappedDisplayLayer(width, height, font);
        this.labelLayer = new SpriteDisplayLayer(width, height, font, {foregroundColor: undefined});
        this.unitLayer = new SpriteDisplayLayer(width, height, font);
        this.kreuzeLayer = new SpriteDisplayLayer(width, height, font);
        this.maskLayer = new MappedDisplayLayer(width, height, font, {backgroundColor: 0x00});

        this.#game = g;

        this.paintMap();
        this.paintCityLabels();
        this.paintUnits();
    }
    // repaint units when extras or debug flags change to trigger redraw
    get extras() { return this.#extras; }
    set extras(on: boolean) {
        this.#extras = on;
        this.paintUnits();
    }
    get debug() { return this.#debug; }
    set debug(on: boolean) {
        this.#debug = on;
        if (this.#debug) this.extras = true;  // extras layers required to see debug info
        this.paintUnits();
    }
    get mvmode(): boolean {
        return scenarios[this.#game.scenario].mvmode ?? false;
    }
    focussed(): Unit | undefined {
        return this.#active ? this.#game.oob.at(this.#id) : undefined
    }
    focusOn(u: Unit) {
        this.focusOff();

        this.#id = u.id;
        this.#active = true;
        this.paintUnit(u);
        this.paintReach(u);
    }
    focusOff() {
        const u = this.focussed();
        this.#active = false;
        this.infoWindow.puts('\fz\x06\x00\fe');
        if (u) {
            this.paintUnit(u);           // repaint to clear blink etc
            this.maskLayer.cls();    // remove all mask glyphs
            this.kreuzeLayer.cls();  // remove any order animation
        }
    }
    focusShift(offset: number) {
        const
            g = this.#game,
            locid = (u: Unit) => g.mapboard.locationOf(Grid.point(u)).gid,
            humanUnits = g.oob.activeUnits(g.human).sort((a, b) => locid(b) - locid(a)),
            n = humanUnits.length;
        let i;
        if (this.#id >= 0) {
            i = humanUnits.findIndex(u => u.id == this.#id);
            if (i < 0) {
                // if last unit no longer active, find the nearest active unit
                const id = locid(g.oob.at(this.#id));
                while (++i < n && locid(humanUnits[i]) > id) {/**/}
            }
        } else {
            i = offset > 0 ? -1: 0;
        }
        i = (i + n + offset) % n;
        this.focusOn(humanUnits[i]);
    }
    paintCityLabels() {
        // these are static so never need redrawn, color changes via paintMap
        const {lon: left, lat: top} = this.#game.mapboard.locations[0][0];

        this.#game.mapboard.cities.forEach((c, i) => {
            this.labelLayer.put(
                i.toString(), 32, left - c.lon, top - c.lat, {
                    props: {label: c.label, points: c.points}
                }
            )
        });
    }
    paintMap() {
        const g = this.#game,
            {earth, contrast} = weatherdata[this.#game.weather];

        this.labelLayer.setcolors({foregroundColor: contrast});
        this.mapLayer.setcolors({layerColor: earth});
        //TODO tree colors are updated in place in terrain defs :-(

        g.mapboard.locations.forEach(row =>
            row.forEach(loc => {
                const t = terraintypes[loc.terrain],
                    city = loc.cityid != null ? g.mapboard.cities[loc.cityid] : null,
                    color = city ? players[city?.owner].color : (loc.alt ? t.altcolor : t.color);

                this.mapLayer.putc(loc.icon, {
                    foregroundColor: color,
                    onclick: () => {
                        if (this.uimode != UIModeKey.orders) return;
                        this.errorWindow.cls();
                        this.focusOff();
                        if (city) this.infoWindow.puts(`\fz\x06\x00\fe\f^${city.label.toUpperCase()}`)
                    },
                    onmouseover: (e) => {
                        (e.currentTarget as HTMLElement).title = g.mapboard.describe(loc, this.debug);
                        (e as MithrilEvent).redraw = false;  // prevent mithril redraw
                    },
                });
            })
        );
    }
    paintUnits() {
        this.#game.oob.forEach(u => this.paintUnit(u));
    }
    paintReach(u: Unit) {
        const {lon: left, lat: top} = this.#game.mapboard.locations[0][0],
            pts = u.reach();

        this.maskLayer.cls(0);  // mask everything with block char, then clear reach squares
        pts.forEach(({lon, lat}) => this.maskLayer.putc(undefined, {x: left - lon, y: top - lat}));
    }
    paintUnit(u: Unit) {
        const
            g = this.#game,
            {earth} = weatherdata[g.weather],
            {lon: left, lat: top} = g.mapboard.locations[0][0],
            ux = left - u.lon, uy = top - u.lat;

        let animation = undefined;
        if (u === this.focussed()) {
            const f = u.foggyStrength(g.human);
            this.infoWindow.puts(`\fz\x06\x00\fe\f@\x06<${u.label}\n\feMUSTER: ${f.mstrng}  COMBAT: ${f.cstrng}`);
            animation = GlyphAnimation.blink;
            if (u.player == g.human) {
                if (scenarios[g.scenario].mvmode)
                    this.infoWindow.puts(`\fH\f>${unitModes[u.mode].label} \nMODE   `)

                const props = {orders: u.orders};
                this.kreuzeLayer.put('#', 0x80, ux, uy, {foregroundColor: 0x1A, props}),
                Object.values(directions).forEach(
                    d => this.kreuzeLayer.put(d.label, d.icon, ux, uy, {foregroundColor: 0xDC, props})
                )
            }
        } else if (u.active) {
            if (u.flags & unitFlag.attack) {
                animation = GlyphAnimation.flash;
            } else if (u.flags & unitFlag.defend) {
                animation = GlyphAnimation.flash_reverse;
            }
        }

        const opts: SpriteOpts = {
                backgroundColor: earth,
                foregroundColor: players[u.player].color,
                opacity: u.active ? 1: 0,
                animate: animation,
                onmouseover: (e) => {
                    (e.currentTarget as HTMLElement).title = g.mapboard.describe(u.location, this.debug);
                    (e as MithrilEvent).redraw = false;  // prevent mithril redraw
                },
                onclick: () => {
                    if (this.uimode != UIModeKey.orders || !u.active) return;
                    this.errorWindow.cls();
                    (this.uimode == UIModeKey.orders && this.focussed() !== u) ? this.focusOn(u) : this.focusOff()
                }
            };
        if (this.extras) {
            opts.props = u.foggyStrength(g.human);  // cstrng, mstrng
            opts.props.oos = (u.flags & unitFlag.oos) ? true: false;
            opts.props.enter = (u.flags & unitFlag.enter) && g.turn > 0 ? true: false;
            if (u.player == g.human || this.debug) {
                opts.props.orders = u.orders;
                opts.props.mode = u.mode;
            }
        } else {
            opts.props = {};
        }
        this.unitLayer.put(`${this.#game.scenario}:${u.id}`, unitkinds[u.kind].icon, ux, uy, opts)
    }
}

export {AppModel, UIModeKey};