# Open issues

## Bugs

- [ ] 8th inf in the south accepted but stoppped processing/following orders?  id=8. could it be blocked by a dead unit somehow?  sadly works on resume :(  http://localhost:3000/#EF4123J7PPcdU5ls-txzsMVOjBM_-t-rshjVx_r6q1COOWLN3TdbSNBEyYL3cpfFnnClqfdQqm5BvbzoSm9ZBBuOSlCXn7iuWZ1J6cMD7OrnbLQIMDq0OWHDXXBon4viebb97fX07neHQLNr16YBvWZZOLCfbcuYXCrGBNcUo56orxB3JSi43dyd7kCy_erpvV_xrU-1Hm

- [ ] game over erases final score :(

- [ ] reloading a game-over state continues instead of repeating game over message

http://localhost:3000/#EF41x28dtxcdyA-txz-VRzarMvzxVjphjVj_rEY1vONDrgZSEEWRsuSiwoIhCn3CuavGBMPvm1cCoq9Mne5hENtnah6P5BPwbHpLNCLZoqm0OWHDXXBnveiLiiOq9OeEg9ugEo5EEYhmHNie9mgTCVCebCqazfEnqku7onUDmZ_cvpDsQ-UDljctUjDhTtQ33Tb

## Game play issues

- combat
  - [ ] defender bonus x2 for expert mode
  - [ ] confirm attack/defend adjust are applied based on correct square - always defender?
  - [ ] retreat resets mode to standard
  - [ ] dead unit disperse nearby in cartridge
  - [ ] break check is simplified for level = 0,1, cartridge:2553

- scoring
  - [ ] fix cart scoring alg
  - [ ] show score in error window (see cartemu screenshot)
  - [x] unit test for starting scores vs cart and apx
  - [ ] can early scenarios end early after winning score, or just moscow capture for learner?

- finish implementing scenario parameters from defs.ts
  - [ ] mdmg (mstrng dmg at higher levels),
  - [ ] cdmg,
  - [ ] cadj,
  - [ ] dealdmg varies by level via M/CSTRDMG not 1/5 like APX, some weirdness with assault nmode #$01 and cpx ARMY ?

- logic for u.mode:
  - [x] any mode change clears orders
  - [x] march - terrain cost => cost//2 + 2; "intended more for inf than pz (because of terrain cost modifier)"
  - [ ] march - cstrng halved (min 1), //2 brk chk
  - [ ] march - cstrng quickly(??) returns afterwards (where?)
  - [x] assault - cost => cost + cost//2
  - [ ] assault - 2x brk chk
  - [ ] assault - deals level 1 damage, receives level 0 damage (normal is level dmg)
  - [ ] entrench - 2x defense, 2x brk chk
  - [x] entrench - can't add new orders
  - [ ] option for auto-entrench if no orders?

- air units (flieger)
  - [x] forcedMarch (normal movement rules like armor)
  - [x] assault mode (include impassable)
  - [ ] assault mode adds flieger strength / half flight distance to friendly unit cadj
  - [ ] Fliegerkorps break and suffer 75% loss

- fog of war
  - [x] config option to reduce initial fog
  - [x] at end of each turn, unit loses a bit of uncertainty if enemy zoc >= 2, gains otherwise, up to max bits by level
  - [x] it's an offset not a simple masking of bits, clamped in (1,255)
  - [x] state stores current bits for active units relative to max
  - [x] for display, bits are randomized predictably by turn and unit index
  - [x] unit tests, incl test for fog value changing between turns

- supply check
  - [x] add a dot for units OoS
  - [x] supply option in scenario (not level 0, 1)
  - [x] refactor (remove) supply defs, merge to player?
  - [x] traceSupply is unused.
  - [x] germans automatically OoS in mud
  - [x] in APX version, russians in supply get MSTRNG+2 in supply check (should be max 255)
  - [x] add unit test - blocking line of units every 2 sq vs every 3 sq

- zocAffecting
  - [x] zocBlocked is currently wrong since starting unit will negate initial ZoC
  - [x] different central unit treatment for supply check vs move (ignore or not)
  - [x] add zocBlocked unit test

- 1942 scenario
  - [x] oob turn arrival calculation: cartridge:3704
  - [x] city ownership @ start via CITYOWN_reloc
  - [ ] unit #$6d = 109 recovers automatically?

- AI changes for mvmode
  - [ ] code browse, compare to APX

- UX
  - [ ] optionally allow >8 orders via UI (supported elsewhere)
  - [ ] n/p vs </> to skip units that already have orders?

## Display issues

- [x] make sure we have a shadow on the color bar, and maybe better background bar,
  adding antic color ramp on abs cstrng

- [x] scr.errorWindow.cls() on key/click

- [ ] blink should apply to overlay exc order path, svg overlay within unit div??

- [ ] when's the right time to clear unit flags for flash behavior?

- [ ] toggle x twice reveals debug (because doubly classed, and visibility is local not children vs display)

- [x] fogofwar option for enemy unit strength a la cartridge (level 2+)

- [ ] debug mode show real strength values

- [ ] using flags inside display component won't play nice with dirty flag

- [ ] debug flag behavior

- [ ] 'resolving' doesn't capture prior defenders (for animation?)

- reinforcements
  - [x] badge new units
  - [ ] display status window '*' indicator for movable reinforcements

- [ ] animate scroll of unit status report eg. elimination, in info window

- [ ] update title/hover on click (for supply and zoc in debug mode)

- [ ] some indicator for zoc (both sides?) on click square

- [ ] zoom preserves point:

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

- include more config.ts options in code

- toggle key for handicap - increase muster strength of all your units by 50% but halve score,
  self-modifies VBI to change color of text window.  replaced by cartridge difficulty level

- path finding gets blocked by static militia eg. Kiev, consider impassable for planning?  prob also poor near ZoC.  allow an optional costadj: loc => adj so we could penalize map locations like units +255 or +2/4 for zoc/enemy

- add battle sound, e.g. [machine gun](https://archive.org/details/MachineGunSoundEffects/Machine%2BGun%2B4.mp3) ?

## Potential AI improvements

- evalLocation could try isOccupied = p => ghosts[p.id] || !p.valid || p.terrain == Terrain.impassable
    could also measure nbval with path-finder vs manhattan (general point)

- try linePoints with only adj column penalties, distinguish impassable vs unit?
