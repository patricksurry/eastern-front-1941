import {players, directions} from './defs.js';

import * as d3 from 'd3';

const
    // Antic NTSC palette via https://en.wikipedia.org/wiki/List_of_video_game_console_palettes#NTSC
    // 128 colors indexed via high 7 bits, e.g. 0x00 and 0x01 refer to the first entry
    anticPaletteRGB = [
        "#000000",  "#404040",  "#6c6c6c",  "#909090",  "#b0b0b0",  "#c8c8c8",  "#dcdcdc",  "#ececec",
        "#444400",  "#646410",  "#848424",  "#a0a034",  "#b8b840",  "#d0d050",  "#e8e85c",  "#fcfc68",
        "#702800",  "#844414",  "#985c28",  "#ac783c",  "#bc8c4c",  "#cca05c",  "#dcb468",  "#ecc878",
        "#841800",  "#983418",  "#ac5030",  "#c06848",  "#d0805c",  "#e09470",  "#eca880",  "#fcbc94",
        "#880000",  "#9c2020",  "#b03c3c",  "#c05858",  "#d07070",  "#e08888",  "#eca0a0",  "#fcb4b4",
        "#78005c",  "#8c2074",  "#a03c88",  "#b0589c",  "#c070b0",  "#d084c0",  "#dc9cd0",  "#ecb0e0",
        "#480078",  "#602090",  "#783ca4",  "#8c58b8",  "#a070cc",  "#b484dc",  "#c49cec",  "#d4b0fc",
        "#140084",  "#302098",  "#4c3cac",  "#6858c0",  "#7c70d0",  "#9488e0",  "#a8a0ec",  "#bcb4fc",
        "#000088",  "#1c209c",  "#3840b0",  "#505cc0",  "#6874d0",  "#7c8ce0",  "#90a4ec",  "#a4b8fc",
        "#00187c",  "#1c3890",  "#3854a8",  "#5070bc",  "#6888cc",  "#7c9cdc",  "#90b4ec",  "#a4c8fc",
        "#002c5c",  "#1c4c78",  "#386890",  "#5084ac",  "#689cc0",  "#7cb4d4",  "#90cce8",  "#a4e0fc",
        "#003c2c",  "#1c5c48",  "#387c64",  "#509c80",  "#68b494",  "#7cd0ac",  "#90e4c0",  "#a4fcd4",
        "#003c00",  "#205c20",  "#407c40",  "#5c9c5c",  "#74b474",  "#8cd08c",  "#a4e4a4",  "#b8fcb8",
        "#143800",  "#345c1c",  "#507c38",  "#6c9850",  "#84b468",  "#9ccc7c",  "#b4e490",  "#c8fca4",
        "#2c3000",  "#4c501c",  "#687034",  "#848c4c",  "#9ca864",  "#b4c078",  "#ccd488",  "#e0ec9c",
        "#442800",  "#644818",  "#846830",  "#a08444",  "#b89c58",  "#d0b46c",  "#e8cc7c",  "#fce08c"
    ];

function centered(s, width) {
    width ||= 40;
    let pad = width - s.length;
    return s.padStart((pad >> 1) + s.length).padEnd(width) ;
}

function setclr(sel, c) {
    //TODO support sel as existing d3 selection
    d3.selectAll(sel).style('background-color', anticColor(c));
}

function anticColor(v) {
    return anticPaletteRGB[Math.floor(parseInt(v, 16)/2)];
}

function atascii(c) {
    return c.charCodeAt(0) & 0x7f;
}

function maskpos(c) {
    return `${-(c%16)*8}px ${-Math.floor(c/16)*8}px`;
}

function putlines(win, lines, fg, bg, chrfn, idfn) {
    // fg color can be a function of the data element, bg should be a constant
    const w = d3.select(win);

    chrfn ||= atascii;
    fg ||= w.attr('data-fg-color');
    bg ||= w.attr('data-bg-color');

    w.attr('data-fg-color', () => fg);
    if (bg) {
        w.attr('data-bg-color', () => bg);
        w.style('background-color', anticColor(bg));
    }
    w.selectAll('div.chr').remove();  //TODO don't deal with enter/update yet

    let
        fgfn = typeof fg == 'function' ? fg : (() => fg),
        data = [].concat(
            ...lines.map(
                (ds, i) =>
                (typeof(ds) == 'string' ? ds.split(''): ds)
                    .map((d, j) => [i, j, d])
                )
            );

    let chrs= w
        .selectAll('div.chr')
        .data(data)
      .join('div')
        .classed('chr', true)
        .style('top', ([i, _, __]) => `${i*8}px`)        // eslint-disable-line no-unused-vars
        .style('left', ([_, j, __]) => `${j*8}px`)       // eslint-disable-line no-unused-vars
        .datum(([_, __, d]) => d);                       // eslint-disable-line no-unused-vars

    if (idfn) chrs.attr('id', idfn);

    chrs.append('div')
        .classed('chr-bg', true)
        .style('background-color', bg ? anticColor(bg) : null);
    chrs.append('div')
        .classed('chr-fg', true)
        .style('background-color', d => anticColor(fgfn(d)))
        .style("-webkit-mask-position", d => maskpos(chrfn(d)));

    return chrs;
}

function showAt(sel, loc, dx, dy) {
    return sel
        .style('left', `${loc.col*8 + (dx || 0)}px`)
        .style('top', `${loc.row*8 + (dy || 0)}px`)
        .style('opacity', 1);
}

function Display(help, game) {

    const icon = (d) => d.icon,
        unitcolor = (u) => players[u.player].color;

/*
    var r = document.querySelector(':root');
    r.style.setProperty('--fontmap', 'url(fontmap-cart.png)');
*/

    // set up background colors
    setclr('body', 'D4');
    setclr('.date-rule', '1A');
    setclr('.info-rule', '02');  // same as map
    setclr('.err-rule', '8A');

    // set up info, error and help
    putlines('#help-window', help, '04', '0e');
    putlines('#date-window', [''], '6A', 'B0');
    putlines('#info-window', [''], '28', '22');
    putlines('#err-window', [''], c => c == "}" ? '94': '22', '3A');

    _datemsg(centered("EASTERN FRONT 1941", 20))
    _infomsg(centered('COPYRIGHT 1982 ATARI'), centered('ALL RIGHTS RESERVED'));

    // draw the map characters with a semi-transparent dimming layer which we can hide/show
    putlines('#map', game.mapboard.locations, 'ff', '00', icon, m => `map-${m.id}`)
        .append('div')
        .classed('chr-dim', true)
        .classed('extra', true);

    // add the city labels
    d3.select('#labels')
        .selectAll('div.label')
        .data(game.mapboard.cities)
      .join('div')
        .classed('label', true)
        .classed('extra', true)
        .text(d => d.label)
        .each(function(d) { d3.select(this).call(showAt, game.mapboard.locationOf(d), 4, -4); })

    // create a layer to show paths with unit orders
    d3.select('#orders').append('svg')
        .attr('width', 48*8)
        .attr('height', 41*8)
        .append('g')
        .attr('transform', 'scale(8)')
        .selectAll('.unit-path')
        .data(game.oob)
      .join('g')
        .attr('id', u => `path-${u.id}`)
        .classed('unit-path', true)
        .classed('extra', true)
        .classed('debug', u => u.player != game.human)
        .attr('style', u => {
            const c = anticColor(unitcolor(u));
            return `stroke: ${c}; fill: ${c};`
        });

    // draw all of the units
    putlines('#units', [game.oob], unitcolor, '00', icon, u => `unit-${u.id}`)
        .each(function(u) { d3.select(this).call(showAt, game.mapboard.locationOf(u)); })
        .style('opacity', 0)
        .append('div')
        .attr('class', 'chr-overlay extra')
        .append('div')
        .classed('chr-mstrng', true)
        .append('div')
        .classed('chr-cstrng', true);

    // put arrows and kreuze in layer for path animation
    putlines(
        '#arrows', [[256], directions.map(icon)],
        d => d == 256 ? '1A': 'DC', null, c => c, (d, i) => d == 256 ? 'kreuze': `arrow-${i-1}`)
        .style('opacity', 0);

    let display = {
        _datemsg,
        _infomsg,
        _errmsg,
        nextTurn,
        setZoom,
        setVisibility,
        paintMap,
        paintUnit,
        animateUnitPath
    }
    game.display = display;
    return display;
}

function _datemsg(line2, line1) {  // by default put on second line
    putlines('#date-window', [line1 || "", line2 || ""]);
}

function _infomsg(line1, line2) {
    putlines('#info-window', [line1 || "", line2 || ""]);
}

function _errmsg(score, text) {
    let s = score.toString().padStart(3).padEnd(4);
    s += centered(text || "", 36);
    putlines('#err-window', [s])
}

function setZoom(zoomed, focus) {
    var elt;
    if (focus) {
        elt = d3.select('#kreuze').node();
    } else {
        let x = 320/2,
            y = 144/2 + d3.select('#map-window').node().offsetTop - window.scrollY;
        elt = document.elementFromPoint(x*4, y*4);
    }
    // toggle zoom level, apply it, and re-center target eleemnt
    d3.select('#map-window .container').classed('doubled', zoomed);
    elt.scrollIntoView({block: "center", inline: "center"})
}

function setVisibility(sel, visible) {
    d3.selectAll(sel).style('visibility', visible ? 'visible': 'hidden')
}

function nextTurn(date) {
    // clear error, show score for this turn
    _errmsg('PLEASE ENTER YOUR ORDERS NOW');
    _datemsg(" " + date.toLocaleDateString("en-US", {year: 'numeric', month: 'long', day: 'numeric'}));
}

function paintMap(opts)  {
    // apply current fg/bg colors to map and unit background
    d3.selectAll('#map .chr-bg, #units .chr-bg')
        .style('background-color', anticColor(opts.bgcolor));

    d3.selectAll('#map .chr-fg')
        .style('background-color', d => anticColor(opts.fgcolorfn(d)))

    // contrasting label colors
    d3.selectAll('.label')
        .style('color', anticColor(opts.labelcolor));
}

function paintUnit(u, opts) {
    let chr = d3.select(`#unit-${u.id}`),
        path = d3.select(`#path-${u.id}`),
        loc = u.m.locationOf(u);

    if (['moved', 'removed'].includes(opts.event)) {
        chr = chr.transition().duration(250).ease(d3.easeLinear);
    }
    switch (opts.event) {
        case 'moved':
            chr.call(showAt, loc);
            path.attr('transform', `translate(${loc.col + 0.5},${loc.row + 0.5}) scale(-1)`)
                .html(pathSVG(u.orders));
        // eslint-disable-next-line no-fallthrough
        case 'stats':
            chr.select('.chr-mstrng').style('width', (90 * u.mstrng/255) + '%');
            chr.select('.chr-cstrng').style('width', (100 * u.cstrng/u.mstrng) + '%');
            break;
        case 'removed':
            chr.style('opacity', 0);
            break;
        case 'attacking':
        case 'defending':
        case 'resolving':
            chr.select('.chr-fg')
                .classed('flash', opts.event != 'resolved')
                .style('animation-direction', opts.event == 'defending' ? 'reverse': 'normal');
            break;
        case 'selected':
        case 'unselected':
            chr.classed('blink', opts.event == 'selected');
    }
}

function animateUnitPath(u) {
    d3.selectAll('#arrows .chr').interrupt().style('opacity', 0);
    if (!u) return;

    let path = u.path(),
        loc = path.pop();

    d3.select('#kreuze')
        .call(showAt, loc)
        .node()
        .scrollIntoView({block: "center", inline: "center"});

    if (!path.length) return;

    let i = 0;
    function animateStep() {
        let loc = path[i],
            dir = u.orders[i],
            dst = u.m.neighbor(loc, dir),
            interrupted = false;
        d3.select(`#arrow-${dir}`)
            .call(showAt, loc)
        .transition()
            .delay(i ? 0: 250)
            .duration(500)
            .ease(d3.easeLinear)
            .call(showAt, dst)
        .transition()
            .duration(0)
            .style('opacity', 0)
        .on("interrupt", () => { interrupted = true; })
        .on("end", () => {
            i = (i+1) % path.length;
            if (!interrupted) animateStep();
        });
    }

    animateStep();
}

function pathSVG(orders) {
    const r = 0.25;
    let x = 0,
        y = 0,
        lastd = null,
        s = "M0,0";

    orders.forEach(d => {
        let dir = directions[d],
            dx = dir.dlon,
            dy = dir.dlat,
            turn = (lastd-d+4) % 4;
        // add prev corner
        if (lastd == null) {
            s = `M${dx*r},${dy*r}`;
        } else if (turn == 0) {
            s += ` l${dx*2*r},${dy*2*r}`;
        } else if (turn % 2) {
            let cx = (dx + directions[lastd].dlon)*r,
                cy = (dy + directions[lastd].dlat)*r;
            s += ` a${r},${r} 0 0 ${turn==1?0:1} ${cx},${cy}`
        }
        lastd = d;
        s += ` l${dx*(1-2*r)},${dy*(1-2*r)}`;
        x += dx;
        y += dy;
    })
    if (orders.length) s += ` L${x},${y}`;
    let svg = `<path d="${s}"/>`;
    if (orders.length) svg += `<circle r="${r}" cx="${x}" cy="${y}">`;
    return svg;
}

function putIcon(selector, u) {
    putlines(selector, [[u]], u => players[u.player].color, '02', u => u.icon)
}

export {
    centered,
    Display,
};
