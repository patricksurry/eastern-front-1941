# Changes

Recent changes and fixes are collected here for future reference, including links to the disassemblies in reference/.

- engine
  - [x] headless bundle with examples
  - [x] test AI vs AI game playthru doesn’t throw

- combat
  - [x] zoc damage is cstrng only (even at higher levels, cartridge:2159)
  - [x] attack adjust should be based on attacker's square (cartridge.asm:2035)
  - [x] include base cadj plus flieger for both attack & defense
  - [x] defender bonus x2 for expert mode (cartridge.asm:2003)
  - [x] defend adjust based on defender terrain
  - [x] retreat resets mvmode to standard
  - [x] dead units gives 1/4 mstrng to each cardinal nbr of same player as new mstrng (max 255) (cartridge.asm:2509)
  - [x] break check is simplified for level = 0,1, cartridge:2553
  - [x] add config for defenderFirstStrike: APX doesn't skip attacker if break, but cart does
  - [x] replace (and sevastopol) each tick not turn

- scoring
  - [x] fix cart scoring alg (cartridge.asm:3966 onward)
  - [x] non-expert levels end after winning score (cartridge.asm:4095)
  - [x] unit test for starting scores vs cart and apx
  - [x] show score in error window (see cartemu screenshot)
  - [x] game over erases final score :(
  - [x] reloading a game-over state continues instead of repeating game over message
  - [x] game over doesn't update token
  - [x] incorrectly flagged as new arrivals on reload [example](http://localhost:3000/#EF41W0-5q2sZNnQthDyhjWNR1cWNoEK7qGC2R3VL)

- zone of control
  - [x] zoc: level 0/1 unit only exerts zoc in own square (cartridge.asm:2486)
  - [x] zocBlocked is currently wrong since starting unit will negate initial ZoC
  - [x] different central unit treatment for supply check vs move (ignore or not)
  - [x] add zocBlocked unit test

- air units (flieger)
  - [x] Air suffers 75% loss and resetOrders if attack or defend, plus normal combat (cartridge.asm:1968)
  - [x] assault mode adds flieger strength / half flight distance to friendly unit cadj, clear orders (cartridge:4179)
  - [x] forcedMarch (normal movement rules like armor)
  - [x] assault mode (include impassable)

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

- cartridge scenario parameters
  - [x] base cadj, plus flieger
  - [x] mdmg, cdmg
  - [x] dealdmg varies by level via M/CSTRDMG not 1/5 like APX,
  - [x] option to include Sevastopol
  - 1942 scenario
    - [x] oob turn arrival calculation: cartridge:3704
    - [x] city ownership @ start via CITYOWN_reloc
    - [x] unit 109, 7 MILITIA ARMY in Sevastopol recovers full mstrng each tick:
        "... [your losses] may well be overwhelming if you attack the nearly impregnable fortress of
        [Sevastopol](https://en.wikipedia.org/wiki/Siege_of_Sevastopol_(1941%E2%80%931942)) ..."

- expert movement modes (UnitMode)
  - [x] any mode change clears orders
  - march:
    - [x] terrain cost => cost//2 + 2; "intended more for inf than pz (because of terrain cost modifier)"
    - [x] //2 brk chk
    - [x] cstrng halved (min 1) before movement (cartridge.asm:4153)
    - [x] cstrng quickly returns afterwards (via per tick recover)
  - assault:
    - [x] cost => cost + cost//2
    - [x] 2x brk chk
    - [x] deals level 1 damage, receives level 0 damage (normal is level dmg; oddly level 0 and 1 are equal).
          NB. implement as triple and double damage respectively
  - entrench:
    - [x] 2x defense
    - [x] 2x brk chk
    - [x] can't add new orders

- UX
  - [x] dotted line for air support orders
  - [x] zoom to center of mass on start/reload
  - [x] zoom option pins center point
  - [x] Message for city capture (extras)
  - [x] shadow on the color bar
  - [x] antic color ramp on abs cstrng
  - [x] scr.errorWindow.cls() on key/click
  - [x] fogofwar option for enemy unit strength a la cartridge (level 2+)
  - [x] badge newly arrived units
  - [x] Log token before each next turn in UX
  - [x] increase tick speed tho move animation can still be longer
  - [x] Move clears attack and defend flags (stop flashing)
  - [x] blink should apply to overlay exc order path, svg overlay within unit div??
  - [x] blink enemy units as well to see terrain underneath
  - debug flag behavior
    - [x] debug mode should show real strength values in hover
    - [x] toggle x twice reveals debug
    - [x] using flags inside display component won't play nice with dirty flag
