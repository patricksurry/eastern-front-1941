function hexcolor(v) {
    return colormap[Math.floor(parseInt(v, 16)/2)];
}

function setclr(sel, c) {
    //TODO support sel as already d3 selection
    d3.selectAll(sel).style('background-color', hexcolor(c));
}

function atascii(c) {
    let x = c.charCodeAt(0) % 128;
    return (x >= 32 && x < 96) ? x - 32 : (x < 32 ? x + 48: x);
}

function maskpos(c) {
    return `${-(c%16)*8}px ${-Math.floor(c/16)*8}px`;
}

function putlines(win, lines, fg, bg, chrfn) {
    // fg color can be a function of the data element, bg should be a constant
    const w = d3.select(win);

    chrfn ||= atascii;
    fg ||= w.attr('data-fg-color');
    bg ||= w.attr('data-bg-color');

    w.attr('data-fg-color', _ => fg);
    if (bg) {
        w.attr('data-bg-color', _ => bg);
        w.style('background-color', hexcolor(bg));
    }

    let
        fgfn = typeof fg == 'function' ? fg : (_ => fg),
        data = [].concat(
            ...lines.map(
                (ds, i) =>
                (typeof(ds) == 'string' ? ds.split(''): ds)
                    .map((d, j) => [i, j, d])
                )
            ),
        chrs = w
            .selectAll('div.chr')
            .data(data)
          .join('div')
            .classed('chr', true)
            .style('top', ([i, j, d]) => `${i*8}px`)
            .style('left', ([i, j, d]) => `${j*8}px`)
            .style('background-color', bg ? hexcolor(bg) : null)
            .datum(([i, j, d]) => d);
        chrs
            .append('div')
            .style('background-color', d => hexcolor(fgfn(d)))
            .style("-webkit-mask-position", d => maskpos(chrfn(d)));

    return chrs;
}

// I.ASM:2640 - time to move arrow


//TODO - debug colors
// let colors = ['B0', '6A', '0C', '94', '46', '1A', '28', '22', '8A', '00', '3A', 'D4'];
/*
let colors = ['58','DC','2F','00','6A','0C','94','46','B0'];  // COLTAB

d3.select('#screen')
    .append('div')
    .selectAll('span')
    .data(colors)
  .join('span')
    .style('background-color', hexcolor)
    .style('color', '#666')
    .text(d => d);
*/

/*
Colors PDF p67

M.ASM
8620 COLTAB .BYTE $58,$DC,$2F,0,$6A,$C,$94,$46,$B0


Section         BK      0       1       2       3
vert blank      B0      6A      OC      94      46
date window     1A      TRCOLR
date hrule      EARTH
map north               28
unit hrule                              22
unit info       8A
err hrule                       00      3A
err message     D4
*/

// in some character modes COL2 is the background instead of COLBK
