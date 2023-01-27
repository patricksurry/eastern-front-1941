import m from 'mithril';

import {atasciiFont, MappedDisplayLayer} from '../antic/anticmodel';

const
    helpScrambleMillis = 2000,
    helpUrl = 'https://github.com/patricksurry/eastern-front-1941',
    helpText = (
    '\fh\fb\x94' + ' '.repeat(42*12)
    + '\fb\x1a' + ' '.repeat(42*12)
    + `\fH\fb\x94\f^

Eastern Front  1941
by Chris Crawford


\fc\x08Redux\fc\x90}\fc\x08 by Patrick Surry\fC


\f^Press any key to start!


\fb\x1a\fc\x94\f@\x03<
Pick unit: \f#Click\f-, \f#<\f- \f#>\f- or \f#p\f-rev \f#n\f-ext

Give orders: \f#\x1c\f- \f#\x1f\f- \f#\x1d\f- \f#\x1e\f- \f#Bksp\f-, \f#Esc\f-, \f#Enter\f-

Execute move: \f#End\f- or \f#Fn \x1f\f-

Expert: change move \f#m\f-ode or \f#1\f- \f#2\f- \f#3\f- \f#4\f-

Toggle: help \f#?\f-, \f#z\f-oom, e\f#x\f-tras, debu\f#g\f-
`);


type EventHandler = (e: Event) => void;

class HelpModel {
    window = new MappedDisplayLayer(42, 24, atasciiFont);
    #init = false;
    clickHandler: EventHandler;

    constructor(clickHandler: EventHandler) {
        this.clickHandler = clickHandler;
    }
    paint(p?: number, scramble?: number[][]) {
        if (!this.#init) {
            this.#init = true;
            const t0 = +new Date();

            p = 0;
            scramble = this.window.glyphs.map(row => row.map(() => Math.random()));

            const paintScrambled = setInterval(() => {
                const pp = (+new Date() - t0)/helpScrambleMillis;
                this.paint(pp, scramble);
                m.redraw();
                if (pp >= 1) clearInterval(paintScrambled);
            }, 250);
        }

        this.window.cls();
        this.window.puts(helpText, {onclick: this.clickHandler});
        this.window.glyphs.forEach(line => line.forEach(g => {
            if (g?.foregroundColor) g.onclick = () => window.open(helpUrl);
        }))

        if (p != null && scramble != null) {
            scramble.forEach((line, y) => line.forEach((v, x) => {
                if (p as number < v) {
                    this.window.putc(Math.floor(Math.random()*128), {
                        x, y,
                        foregroundColor: Math.floor(Math.random()*256),
                        backgroundColor: Math.floor(Math.random()*256),
                    })
                }
            }));
        }
    }
}

export {HelpModel};