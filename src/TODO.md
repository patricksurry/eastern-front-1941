# TODO

Tracks current outstanding issues, ideas for improvements, etc.

## Open issues

- scoring
  - [x] show score in error window (see cartemu screenshot)
  - [x] game over erases final score :(
  - [x] reloading a game-over state continues instead of repeating game over message
  - [x] game over doesn't update token
  - [x] incorrectly flagged as new arrivals on reload [example](http://localhost:3000/#EF41W0-5q2sZNnQthDyhjWNR1cWNoEK7qGC2R3VL)

- UX
  - [ ] Unit describe human is dumb
  - [x] Log token before each next turn in UX
  - [x] increase tick speed tho move animation can still be longer
  - [x] Move clears attack and defend flags (stop flashing)
  - [x] blink should apply to overlay exc order path, svg overlay within unit div??
  - [x] blink enemy units as well to see terrain underneath
  - debug flag behavior
    - [x] debug mode should show real strength values in hover
    - [x] toggle x twice reveals debug
    - [x] using flags inside display component won't play nice with dirty flag

- engine
  - [ ] zoc: level 0/1 unit only exerts zoc in own square (cartridge.asm:2486)
  - [ ] supply check happens before first turn (tho units should be in supply anyway, adjust initial oob?)
  - [ ] test newTurn(true) is idempotent on token
  - [ ] test AI vs human game playthru doesn’t throw

- Cartridge AI changes
  - [ ] code browse, diff to APX
  - [ ] mvmode choice
  - [ ] other changes?

## Triage

- [ ] (possibly fixed; also now maelstrom sanity tests) 8th inf in the south accepted but stopped processing/following orders?  id=8. could it be blocked by a dead unit somehow?  sadly works on resume :(
  [game](http://localhost:3000/#EF4123J7PPcdU5ls-txzsMVOjBM_-t-rshjVx_r6q1COOWLN3TdbSNBEyYL3cpfFnnClqfdQqm5BvbzoSm9ZBBuOSlCXn7iuWZ1J6cMD7OrnbLQIMDq0OWHDXXBon4viebb97fX07neHQLNr16YBvWZZOLCfbcuYXCrGBNcUo56orxB3JSi43dyd7kCy_erpvV_xrU-1Hm)

## Future

- config
  - [ ] wire up more of the hard-coded options
  - [ ] option for auto-entrench if no orders?

- engine
  - [ ] don't update tree color in-place in terrain data

- UX
  - [ ] attack flash could also jitter toward target
  - [ ] display status window '*' indicator for movable reinforcements
  - [ ] optionally allow >8 orders via UI (supported elsewhere)
  - [ ] n/p vs </> could skip units that already have orders?
  - [ ] animate scroll of unit status report eg. elimination, in info window
  - [ ] option to show friendly/enemy ZoC like reach?
  - [ ] zoom option preserves point ([old](https://github.com/patricksurry/eastern-front-1941/blob/71be93479b3885cb239c00b41a6002de8249914c/src/display.ts#L357))
  - [ ] toggle key for handicap - increase muster strength of all your units by 50% but halve score,
  self-modifies VBI to change color of text window.  replaced by cartridge difficulty level
  - [ ] add battle sound, e.g. [machine gun](https://archive.org/details/MachineGunSoundEffects/Machine%2BGun%2B4.mp3)

- AI
  - [ ] have think() track a current unit and bail out once it uses a certain amount of time,
    rather than doing a whole pass at once
  - [ ] path finding gets blocked by static militia eg. Kiev, consider impassable for planning?  prob also poor near ZoC.  allow an optional costadj: loc => adj so we could penalize map locations like units +255 or +2/4 for zoc/enemy
  - [ ] evalLocation could try isOccupied = p => ghosts[p.id] || !p.valid || p.terrain == Terrain.impassable
    could also measure nbval with path-finder vs manhattan (general point)
  - [ ] try linePoints with only adj column penalties, distinguish impassable vs unit?