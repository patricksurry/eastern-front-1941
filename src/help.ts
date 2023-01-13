import {atasciiFont, MappedDisplayLayer} from './anticmodel';
import m from 'mithril';

const
    helpScrambleMillis = 2000,
    helpUrl = 'https://github.com/patricksurry/eastern-front-1941',
    helpText = (
    '\fh\x11' + '\x12'.repeat(40) + '\x05'
    + '|\fl|'.repeat(22)
    + '\x1a' + '\x12'.repeat(40) + '\x03'
    + `\fH\f^


Welcome to Chris Crawford's
Eastern Front  1941
Reversed by Patrick Surry \fc\x94}\fC

\f@\x04<
Select: \f#Click\f-, \f#n\f-ext, \f#p\f-rev, \f#<\f-, \f#>\f-

Orders: \f#\x1f\f- \f#\x1c\f- \f#\x1d\f- \f#\x1e\f-, \f#Bksp\f-, \f#Space\f-, \f#Esc\f-

Modes: \f#1\f- \f#2\f- \f#3\f- ..., \f#m\f- toggles

Submit: \f#End\f-, \f#Fn \x1f\f-

Toggle: \f#z\f-oom, e\f#x\f-tras, debu\f#g\f-

\f^
\f#?\f- shows this help
Press any key to play!`
);


type EventHandler = (e: Event) => void;

class HelpModel {
    window = new MappedDisplayLayer(42, 24, atasciiFont,
        {foregroundColor: 0x04, layerColor: 0x0E}
    );
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