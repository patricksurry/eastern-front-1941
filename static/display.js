var focusid = null,  // current focused unit id
    lastid = null,   // must recent focused unit id (= focusid or null)
    kreuze = null,   // d3 selection with the chr displaying the maltakreuze
    arrows = null;   // d3 selection of the four arrow chrs

function centered(s, width) {
    width ||= 40;
    let pad = width - s.length;
    return s.padStart((pad >> 1) + s.length).padEnd(width) ;
}
function errmsg(text) {
    let s = score(gameState.human).toString().padStart(3).padEnd(4);
    s += centered(text || "", 36);
    putlines('#err-window', [s])
};
infomsg = (line1, line2) => putlines('#info-window', [line1 || "", line2 || ""])

function setupDisplay(help, mapchrs, units) {
    const icon = (d) => d.icon
        unitcolor = (u) => players[u.player].color;

    // set up background colors
    setclr('body', 'D4');
    setclr('.date-rule', '1A');
    setclr('.info-rule', '02');  // same as map
    setclr('.err-rule', '8A');

    // set up info, error and help
    putlines('#help-window', help, '04', '0e');
    putlines('#info-window', [''], '28', '22');
    putlines('#err-window', [''], '22', '3A');

    // draw the map characters with a semi-transparent dimming layer which we can hide/show
    putlines('#map', mapchrs, 'ff', '00', icon)
        .append('div')
        .classed('chr-dim', true)
        .classed('extra', true);

    // add the city labels
    d3.select('#labels')
        .selectAll('div.label')
        .data(cities)
      .join('div')
        .classed('label', true)
        .classed('extra', true)
        .text(d => d.label)
        .each(function(d) { d3.select(this).call(showAt, Location.of(d), 4, -4); })

    // create a layer to show paths with unit orders
    d3.select('#orders').append('svg')
        .attr('width', 48*8)
        .attr('height', 41*8)
        .append('g')
        .attr('transform', 'scale(8)')
        .selectAll('.unit-path')
        .data(units)
      .join('g')
        .classed('unit-path', true)
        .classed('extra', true)
        .classed('debug', u => u.player != gameState.human)
        .attr('style', u => {
            const c = hexcolor(unitcolor(u));
            return `stroke: ${c}; fill: ${c};`
        });

    // draw all of the units
    putlines('#units', [units], unitcolor, '00', icon)
        .style('opacity', 0)
        .each(function(u) {
            // set up some callbacks for units to manage their state
            u.chr = d3.select(this);
            u.pathsvg = d3.selectAll('.unit-path').filter(v => v.id == u.id);
            u.show = function(duration) {
                let chr = this.chr,
                    loc = Location.of(this);
                if (duration) chr = chr.transition(duration);
                chr.call(showAt, loc);
                chr.select('.chr-mstrng').style('width', (90 * this.mstrng/255) + '%');
                chr.select('.chr-cstrng').style('width', (100 * this.cstrng/this.mstrng) + '%');
                this.pathsvg
                    .attr('transform', `translate(${loc.col + 0.5},${loc.row + 0.5}) scale(-1)`)
                    .html(pathSVG(this.orders));
            };
            u.hide = function(duration) {
                let chr = this.chr;
                if (duration) chr = chr.transition(duration);
                chr.style('opacity', 0);
            };
            u.flash = function(delay, duration) {
                let fg = this.chr.select('.chr-fg');
                fg.transition()
                    .delay(delay).duration(0)
                    .style('-webkit-mask-position', maskpos(0xff))
                  .transition()
                    .delay(duration).duration(0)
                    .style('-webkit-mask-position', maskpos(u.icon));
            };
            // pre-position at correct location
            u.show(); u.hide();
        })
        .append('div')
        .attr('class', 'chr-overlay extra')
        .append('div')
        .classed('chr-mstrng', true)
        .append('div')
        .classed('chr-cstrng', true);

    // put arrows and kreuze in layer for path animation
    chrs = putlines('#arrows', [[256], directions.map(icon)], '1A', null, d => d)
        .style('opacity', 0);
    kreuze = chrs.filter(d => d == 256);
    arrows = chrs.filter(d => d != 256);
}

function hexcolor(v) {
    return colormap[Math.floor(parseInt(v, 16)/2)];
}

function setclr(sel, c) {
    //TODO support sel as existing d3 selection
    d3.selectAll(sel).style('background-color', hexcolor(c));
}

atascii = (c) => c.charCodeAt(0) & 0x7f;

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
    w.selectAll('div.chr').remove();  //TODO don't deal with enter/update yet

    let
        fgfn = typeof fg == 'function' ? fg : (_ => fg),
        data = [].concat(
            ...lines.map(
                (ds, i) =>
                (typeof(ds) == 'string' ? ds.split(''): ds)
                    .map((d, j) => [i, j, d])
                )
            ),
        cells = w
            .selectAll('div.chr')
            .data(data)
          .join('div')
            .classed('chr', true)
            .style('top', ([i, j, d]) => `${i*8}px`)
            .style('left', ([i, j, d]) => `${j*8}px`)
            .datum(([i, j, d]) => d);

        cells.append('div')
            .classed('chr-bg', true)
            .style('background-color', bg ? hexcolor(bg) : null);
        cells.append('div')
            .classed('chr-fg', true)
            .style('background-color', d => hexcolor(fgfn(d)))
            .style("-webkit-mask-position", d => maskpos(chrfn(d)));

    return cells;
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

function focusUnit(u) {
    unfocusUnit();
    if (!u) return;

    focusid = u.id;
    lastid = focusid;

    u.show();
    infomsg(`     ${u.label}`, `     MUSTER: ${u.mstrng}  COMBAT: ${u.cstrng}`);

    if (gameState.extras) {
        let locs = u.reach();
        d3.selectAll('.chr-dim').filter(d => !(d.id in locs)).style('opacity', 0.5);
    }

    if (u.player == gameState.human) {
        animateUnitPath(u);
        u.chr.classed('blink', true);
    }
}

function focusUnitRelative(offset) {
    // sort active germans descending by location id (right => left reading order)
    let german = oob
            .filter(u => u.player == gameState.human && u.isActive())
            .sort((a, b) => Location.of(b).id - Location.of(a).id),
        n = german.length;
    var i;
    if (lastid) {
        i = german.findIndex(u => u.id == lastid);
        if (i < 0) {
            // if last unit no longer active, find the nearest active unit
            let locid = Location.of(oob[lastid]).id;
            while (++i < german.length && Location.of(german[i]).id > locid) {/**/}
        }
    } else {
        i = offset > 0 ? -1: 0;
    }
    i = (i + n + offset) % n;
    focusUnit(german[i]);
}

function unfocusUnit() {
    infomsg();
    focusid = null;
    hideUnitPath();
    d3.selectAll('.blink').classed('blink', false);
    d3.selectAll('.chr-dim').style('opacity', 0);
}

function getFocusedUnit() {
    return focusid === null ? null: oob[focusid];
}


function showAt(sel, loc, dx, dy) {
    return sel
        .style('left', `${loc.col*8 + (dx || 0)}px`)
        .style('top', `${loc.row*8 + (dy || 0)}px`)
        .style('opacity', 1);
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

function animateUnitPath(u) {
    let path = u.path(),
        loc = path.pop();

    kreuze
        .call(showAt, loc)
        .node()
        .scrollIntoView({block: "center", inline: "center"});

    arrows.style('opacity', 0).interrupt();
    if (!path.length) return;

    let i = 0;
    function animateStep() {
        let loc = path[i],
            dir = u.orders[i],
            dst = loc.neighbor(dir),
            interrupted = false;
        arrows.filter((_, j) => j == dir)
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
            i = (i+1) % u.orders.length;
            if (!interrupted) animateStep();
        });
    }

    animateStep();
}

function hideUnitPath() {
    kreuze.style('opacity', 0);
    arrows.style('opacity', 0).interrupt();
    d3.select('.blink').classed('blink', false);
}

function showNewOrder(dir) {
    let u = getFocusedUnit();
    if (!u) return;
    if (u.player != gameState.human) {
        errmsg(`THAT IS A ${players[u.player].key.toUpperCase()} UNIT!`)
        return;
    }
    if (dir == null) {
        if (u.orders.length == 0) {
            unfocusUnit();
            return;
        }
        u.resetOrders();
    } else if (dir == -1) {
        u.orders.pop();
    } else {
        u.addOrder(dir);
    }
    focusUnit(u);
}

