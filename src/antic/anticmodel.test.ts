import {MappedDisplayLayer, DisplayLayer, fontMap} from './anticmodel';

function asciiView(display: DisplayLayer): string {
    const chars = [...Array(display.height).keys()].map(() => '.'.repeat(display.width).split(''));
    display.spritelist().forEach(({x, y, c}) => {
        chars[y][x] = String.fromCharCode(c ?? 46);
    })
    return chars.map(line => line.join('')).join('\n');
}

test("simple ascii", () => {
    const atasciiFont = fontMap('static/fontmap-atascii.png', 128),
        display = new MappedDisplayLayer(40, 24, atasciiFont);

    display.puts(`hello world
  the quick brown fox
\f@\x04<tab\nstop
\f^a\nfew\ncentered\nlines\f/
what?
\f>goodbye\ncruel\nworld\f/
\fj|\f^wahay!\f/\fl|
`)
    const s = asciiView(display);
    // console.log(s)

    expect(s).toMatch(/^hello world/);
});
