# Open issues

## Game play issues

- finish implementing scenario parameters from defs.ts
  - [ ] mdmg (mstrng dmg at higher levels),
  - [ ] cdmg,
  - [ ] cadj,
  - [ ] fog of war
  - [ ] dealdmg varies by level via M/CSTRDMG not 1/5 like APX, some weirdness with assault nmode #$01 and cpx ARMY ?

- logic for u.mode:
  - [ ] forcedMarch - terrain cost => cost//2 + 2, cstrng halved (min 1), //2 brk chk, quickly(??) returns afterwards, intended more for inf than pz (because of terrain cost modifier)
  - [ ] assault - cost => cost + cost//2, 2x brk chk, deals level 1 damage, receives level 0 damage (normal is level dmg)
  - [ ] entrench - 2x defense, 2x brk chk, clears orders (any mode change clears)
  - [ ] entrench - can't add new orders
  - [ ] option for auto-entrench if no orders?
  - [ ] retreat resets mode to standard

- supply check
  - [ ] traceSupply is unused.
  - [ ] germans automatically OoS in mud
  - [ ] supply.replacements unused
  - [ ] in APX version, russians in supply get MSTRNG+2 in supply check (should be max 255)
  - [ ] unit test

- zocAffecting
  - [ ] different central unit treatment for supply check vs move (ignore or not)
  - [ ] unit test

- combat
  - [ ] defender bonus x2 for expert mode
  - [ ] confirm attack/defend adjust are applied based on correct square - always defender?

- air units (flieger)
  - [ ] forcedMarch (normal movement rules - what terrain cost?)
  - [x] assault mode (include impassable)
  - [ ] assault mode adds flieger strength / half flight distance to friendly unit cadj

- [ ] dead unit disperse nearby in cartridge

- [ ] break check is simplified for level = 0,1

- [ ] 1942 oob turn arrival calculation

- [ ] optionally allow >8 orders

- AI changes for mvmode
  - [ ] code browsing

## Display issues

- [ ] scr.errorWindow.cls() on key/click, if 'error showing' flag set

- [ ] blink should apply to overlay exc order path, svg overlay within unit div??

TXTWDW => screen mapping:

- #$24 + 'STANDARD ' is end of first line of info => TXTWDW+45
- #$56 + 'MODE   '  is end of info window  => TXTWDW+93
- 102 score -xxx__  106 - 137  in clear error window (32 chars)

- when's the right time to clear unit flags for flash behavior?

- confirm score updating correctly: (expert mode)  you begin with a negative score ... you receive points for destroying russian armies ... you lose points for your own losses

- toggle x twice reveals debug (because doubly classed, and visibility is local not children vs display)

- fogofwar option for enemy unit strength a la cartridge

- using flags inside display component won't play nice with dirty flag

- debug flag behavior

- 'resolving' doesn't capture prior defenders (for animation?)

- display * indicator for movable reinforcements

- animate scroll of unit status report eg. elimination, in info window

- update title/hover on click (for supply and zoc in debug mode)

- some indicator for zoc (both sides?) on click square

- zoom preserve point:

     setZoom(zoomed: boolean, u: Unit | null) {
        var elt;
        if (u != null) {
            elt = d3.select('#kreuze').node();
        } else {
            let x = 320/2,
                y = 144/2 + (d3.select('#map-window').node() as HTMLElement).offsetTop - window.scrollY;
            elt = document.elementFromPoint(x*4, y*4);
        }
        // toggle zoom level, apply it, and re-center target eleemnt
        d3.select('#map-window .container').classed('doubled', zoomed);
        (elt as HTMLElement)!.scrollIntoView({block: "center", inline: "center"})
    }

## Other improvements

- shouldn't update tree color in-place in terrain data

- have think() track a current unit and bail out once it uses a certain amount of time,
  rather than doing a whole pass at once

- include config.ts options in code

- toggle key for handicap - increase muster strength of all your units by 50% but halve score,
  self-modifies VBI to change color of text window.  replaced by cartridge difficulty level

- path finding gets blocked by static militia eg. Kiev, consider impassable for planning?  prob also poor near ZoC.  allow an optional costadj: loc => adj so we could penalize map locations like units +255 or +2/4 for zoc/enemy

- add battle sound, e.g. [machine gun](https://archive.org/details/MachineGunSoundEffects/Machine%2BGun%2B4.mp3) ?

## Potential AI improvements

- evalLocation could try isOccupied = p => ghosts[p.id] || !p.valid || p.terrain == Terrain.impassable
    could also measure nbval with path-finder vs manhattan (general point)

- try linePoints with only adj column penalties, distinguish impassable vs unit?
